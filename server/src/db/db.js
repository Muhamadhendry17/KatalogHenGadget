/**
 * db.js — Database layer menggunakan MySQL (mysql2/promise)
 * Drop-in replacement untuk db.js berbasis JSON file lama.
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import pool from './mysql.js';
import {
  OrderValidationError,
  adjustProductStock,
  canTransition,
  computeOrderTotal,
  isValidMethodPair,
  resolveOrderLine,
  shouldRestoreStock,
} from '../domain/order.js';

export const STOCK_AVAILABLE = 'Tersedia';
export const STOCK_EMPTY = 'Habis';

// ── Helper ────────────────────────────────────────────────────────────────────

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
}

function parseNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseOptionalPrice(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function normalizeStockCount(value, fallback = 10) {
  const n = Math.round(parseNumber(value, fallback));
  return Math.max(0, n);
}

function parseArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

function normalizeStock(value) {
  if (typeof value === 'number') return value > 0 ? STOCK_AVAILABLE : STOCK_EMPTY;
  const v = String(value || '').trim().toLowerCase();
  if (['habis', 'empty', 'out-of-stock', 'out_of_stock', '0', 'false'].includes(v)) {
    return STOCK_EMPTY;
  }
  return STOCK_AVAILABLE;
}

function normalizeSpecs(value) {
  const list = parseArray(value);
  return list
    .map((item) => {
      if (typeof item === 'string') {
        const [label, ...rest] = item.split(':');
        return label && rest.length ? { label: label.trim(), value: rest.join(':').trim() } : null;
      }
      if (!item || !item.label) return null;
      return { label: String(item.label).trim(), value: String(item.value ?? '').trim() };
    })
    .filter((item) => item && item.label && item.value);
}

/** Konversi row MySQL → objek produk yang dipakai frontend */
function rowToProduct(row) {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    tag: row.tag,
    featured: Boolean(row.featured),
    price: Number(row.price),
    description: row.description || '',
    image: row.image || '',
    categoryId: row.category_id || '',
    categoryName: row.category_name || '',
    stock: Number(row.stock || 0),
    stockStatus: row.stock_status,
    originalPrice: row.original_price != null ? Number(row.original_price) : null,
    badges: parseArray(row.badges),
    variants: parseArray(row.variants),
    colors: parseArray(row.colors),
    colorNames: parseArray(row.color_names),
    releaseYear: Number(row.release_year),
    isNew: Boolean(row.is_new),
    performanceScore: Number(row.performance_score),
    cameraScore: Number(row.camera_score),
    specs: normalizeSpecs(parseArray(row.specs)),
    highlights: parseArray(row.highlights).map((s) => String(s).trim()).filter(Boolean),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

/**
 * Bangun objek alamat dari snapshot pesanan.
 * Fallback ke join tabel addresses untuk pesanan lama sebelum snapshot ada.
 */
function buildOrderAddress(row) {
  const hasSnapshot = Boolean(
    row.recipient_name ||
      row.recipient_phone ||
      row.shipping_address ||
      row.shipping_city ||
      row.shipping_province ||
      row.shipping_postal_code,
  );
  if (!hasSnapshot && !row.address_id) return null;

  return {
    id: row.address_id || null,
    name: row.recipient_name || row.address_name || '',
    phone: row.recipient_phone || row.address_phone || '',
    address: row.shipping_address || row.address_text || '',
    city: row.shipping_city || row.address_city || '',
    province: row.shipping_province || row.address_province || '',
    postalCode: row.shipping_postal_code || row.address_postal_code || '',
  };
}

// ── Database class ────────────────────────────────────────────────────────────

class Database {
  // ─── Accounts ──────────────────────────────────────────────

  async getAdmin() {
    const [rows] = await pool.execute(
      `SELECT * FROM accounts WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1`,
    );
    return rows[0] || null;
  }

  async getAdminById(id) {
    const [rows] = await pool.execute(`SELECT * FROM accounts WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  }

  async getAdminByEmail(email) {
    const normalized = String(email || '').trim().toLowerCase();
    if (!normalized) return null;
    const [rows] = await pool.execute(
      `SELECT * FROM accounts WHERE email = ? LIMIT 1`,
      [normalized],
    );
    return rows[0] || null;
  }

  async addAdmin(adminData) {
    const id = `admin_${crypto.randomUUID()}`;
    const hashedPassword = bcrypt.hashSync(adminData.password, 10);
    const role = adminData.role === 'admin' ? 'admin' : 'customer';
    const name = String(adminData.name || '').trim();
    const email = String(adminData.email || '').trim().toLowerCase();

    await pool.execute(
      `INSERT INTO accounts (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)`,
      [id, name, email, hashedPassword, role],
    );

    return { id, name, email, password: hashedPassword, role };
  }

  async updateAccountPassword(id, hashedPassword) {
    const [result] = await pool.execute(
      `UPDATE accounts SET password = ? WHERE id = ?`,
      [hashedPassword, id],
    );
    if (result.affectedRows === 0) return null;
    return this.getAdminById(id);
  }

  // ─── Categories ────────────────────────────────────────────

  async getCategories() {
    const [rows] = await pool.execute(
      `SELECT c.*, COUNT(p.id) AS productCount
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name ASC`,
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      productCount: Number(r.productCount),
    }));
  }

  async getCategoryById(id) {
    const [rows] = await pool.execute(`SELECT * FROM categories WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  }

  async addCategory(name) {
    const id = `cat_${crypto.randomUUID()}`;
    const slug = slugify(name);
    await pool.execute(
      `INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)`,
      [id, String(name).trim(), slug],
    );
    return { id, name: String(name).trim(), slug };
  }

  async updateCategory(id, name) {
    const slug = slugify(name);
    const [result] = await pool.execute(
      `UPDATE categories SET name = ?, slug = ? WHERE id = ?`,
      [String(name).trim(), slug, id],
    );
    if (result.affectedRows === 0) return null;

    // Sinkronkan categoryName di tabel products
    await pool.execute(
      `UPDATE products SET category_name = ? WHERE category_id = ?`,
      [String(name).trim(), id],
    );

    return { id, name: String(name).trim(), slug };
  }

  async deleteCategory(id) {
    const [result] = await pool.execute(`DELETE FROM categories WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  // ─── Products ──────────────────────────────────────────────

  async getProducts(filters = {}) {
    let sql = `SELECT * FROM products WHERE 1=1`;
    const params = [];

    if (filters.categoryId) {
      sql += ` AND category_id = ?`;
      params.push(filters.categoryId);
    }
    if (filters.stockStatus) {
      sql += ` AND stock_status = ?`;
      params.push(normalizeStock(filters.stockStatus));
    }
    if (filters.brand) {
      sql += ` AND LOWER(brand) = ?`;
      params.push(String(filters.brand).toLowerCase());
    }
    if (filters.search) {
      sql += ` AND (LOWER(name) LIKE ? OR LOWER(brand) LIKE ? OR LOWER(description) LIKE ?)`;
      const q = `%${String(filters.search).toLowerCase()}%`;
      params.push(q, q, q);
    }

    sql += ` ORDER BY created_at DESC`;

    const [rows] = await pool.execute(sql, params);
    return rows.map(rowToProduct);
  }

  async getProductById(id) {
    const [rows] = await pool.execute(`SELECT * FROM products WHERE id = ? LIMIT 1`, [id]);
    return rows[0] ? rowToProduct(rows[0]) : null;
  }

  async addProduct(productData) {
    const id = `prod_${crypto.randomUUID()}`;
    const category = productData.categoryId
      ? await this.getCategoryById(productData.categoryId)
      : null;

    const colors = parseArray(productData.colors);
    const colorNames = parseArray(productData.colorNames);
    const stock = normalizeStockCount(productData.stock, 10);
    const stockStatus = stock > 0 ? STOCK_AVAILABLE : STOCK_EMPTY;
    const originalPrice = parseOptionalPrice(productData.originalPrice);

    await pool.execute(
      `INSERT INTO products
         (id, name, brand, tag, featured, price, original_price, description, image,
          category_id, category_name, stock_status, stock,
          badges, variants, colors, color_names, release_year,
          is_new, performance_score, camera_score, specs, highlights)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        String(productData.name || '').trim(),
        String(productData.brand || 'Lainnya').trim(),
        String(productData.tag || 'PILIHAN HENGADGET').trim(),
        parseBoolean(productData.featured) ? 1 : 0,
        parseNumber(productData.price, 0),
        originalPrice,
        productData.description || '',
        productData.image || '',
        productData.categoryId || null,
        category?.name || '',
        stockStatus,
        stock,
        JSON.stringify(parseArray(productData.badges)),
        JSON.stringify(parseArray(productData.variants)),
        JSON.stringify(colors.length ? colors : ['#cbd5e1', '#94a3b8']),
        JSON.stringify(colorNames.length ? colorNames : ['Default', 'Alternatif']),
        parseNumber(productData.releaseYear, new Date().getFullYear()),
        parseBoolean(productData.isNew) ? 1 : 0,
        Math.min(100, Math.max(0, parseNumber(productData.performanceScore, 0))),
        Math.min(100, Math.max(0, parseNumber(productData.cameraScore, 0))),
        JSON.stringify(normalizeSpecs(productData.specs)),
        JSON.stringify(parseArray(productData.highlights).map((s) => String(s).trim()).filter(Boolean)),
      ],
    );

    return this.getProductById(id);
  }

  async updateProduct(id, productData) {
    const current = await this.getProductById(id);
    if (!current) return null;

    const categoryId =
      productData.categoryId !== undefined ? productData.categoryId : current.categoryId;
    const category = categoryId ? await this.getCategoryById(categoryId) : null;

    const colors =
      productData.colors !== undefined ? parseArray(productData.colors) : current.colors;
    const colorNames =
      productData.colorNames !== undefined
        ? parseArray(productData.colorNames)
        : current.colorNames;
    const specs =
      productData.specs !== undefined
        ? normalizeSpecs(productData.specs)
        : current.specs;
    const highlights =
      productData.highlights !== undefined
        ? parseArray(productData.highlights).map((s) => String(s).trim()).filter(Boolean)
        : current.highlights;
    const badges = productData.badges !== undefined ? parseArray(productData.badges) : current.badges;
    const variants =
      productData.variants !== undefined ? parseArray(productData.variants) : current.variants;

    // Stok angka adalah sumber kebenaran: 0 = Habis, > 0 = Tersedia.
    let nextStock =
      productData.stock !== undefined
        ? normalizeStockCount(productData.stock, current.stock || 10)
        : normalizeStockCount(current.stock, 10);
    let nextStatus;

    if (productData.stock !== undefined) {
      nextStatus = nextStock > 0 ? STOCK_AVAILABLE : STOCK_EMPTY;
    } else if (productData.stockStatus !== undefined) {
      nextStatus = normalizeStock(productData.stockStatus);
      if (nextStatus === STOCK_EMPTY) nextStock = 0;
      else if (nextStock <= 0) nextStock = 10;
    } else {
      nextStatus = current.stockStatus === STOCK_EMPTY ? STOCK_EMPTY : STOCK_AVAILABLE;
      if (nextStatus === STOCK_EMPTY) nextStock = 0;
      else if (nextStock <= 0) nextStock = 10;
    }

    const originalPrice =
      productData.originalPrice !== undefined
        ? parseOptionalPrice(productData.originalPrice)
        : current.originalPrice;

    await pool.execute(
      `UPDATE products SET
         name              = ?,
         brand             = ?,
         tag               = ?,
         featured          = ?,
         price             = ?,
         original_price    = ?,
         description       = ?,
         image             = ?,
         category_id       = ?,
         category_name     = ?,
         stock_status      = ?,
         stock             = ?,
         badges            = ?,
         variants          = ?,
         colors            = ?,
         color_names       = ?,
         release_year      = ?,
         is_new            = ?,
         performance_score = ?,
         camera_score      = ?,
         specs             = ?,
         highlights        = ?
       WHERE id = ?`,
      [
        String(productData.name !== undefined ? productData.name : current.name).trim(),
        String(productData.brand !== undefined ? productData.brand : current.brand).trim(),
        String(productData.tag !== undefined ? productData.tag : current.tag).trim(),
        parseBoolean(productData.featured !== undefined ? productData.featured : current.featured) ? 1 : 0,
        parseNumber(productData.price !== undefined ? productData.price : current.price, 0),
        originalPrice,
        productData.description !== undefined ? productData.description : current.description,
        productData.image !== undefined ? productData.image : current.image,
        categoryId || null,
        category?.name || current.categoryName,
        nextStatus,
        nextStock,
        JSON.stringify(badges),
        JSON.stringify(variants),
        JSON.stringify(colors),
        JSON.stringify(colorNames),
        parseNumber(productData.releaseYear !== undefined ? productData.releaseYear : current.releaseYear, new Date().getFullYear()),
        parseBoolean(productData.isNew !== undefined ? productData.isNew : current.isNew) ? 1 : 0,
        Math.min(100, Math.max(0, parseNumber(productData.performanceScore !== undefined ? productData.performanceScore : current.performanceScore, 0))),
        Math.min(100, Math.max(0, parseNumber(productData.cameraScore !== undefined ? productData.cameraScore : current.cameraScore, 0))),
        JSON.stringify(specs),
        JSON.stringify(highlights),
        id,
      ],
    );

    return this.getProductById(id);
  }

  async toggleStock(id) {
    const product = await this.getProductById(id);
    if (!product) return null;

    const isAvailable = product.stockStatus === STOCK_AVAILABLE && Number(product.stock) > 0;
    const newStatus = isAvailable ? STOCK_EMPTY : STOCK_AVAILABLE;
    const newStock = isAvailable ? 0 : Math.max(10, Number(product.stock) || 0);

    await pool.execute(
      `UPDATE products SET stock_status = ?, stock = ? WHERE id = ?`,
      [newStatus, newStock, id],
    );

    return this.getProductById(id);
  }

  async deleteProduct(id) {
    const [result] = await pool.execute(`DELETE FROM products WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  // ─── Alamat pelanggan ───────────────────────────────────────────────────────

  async getAddresses(accountId) {
    const [rows] = await pool.execute(
      `SELECT * FROM addresses WHERE account_id = ? ORDER BY is_default DESC, created_at DESC`,
      [accountId],
    );
    return rows.map((r) => ({
      id: r.id,
      accountId: r.account_id,
      name: r.name,
      phone: r.phone,
      address: r.address,
      city: r.city,
      province: r.province,
      postalCode: r.postal_code,
      isDefault: Boolean(r.is_default),
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    }));
  }

  async addAddress(accountId, addressData) {
    const id = `addr_${crypto.randomUUID()}`;
    const isDefault = addressData.isDefault ? 1 : 0;

    // Jika ditandai default, matikan default lain untuk akun ini.
    if (isDefault) {
      await pool.execute(`UPDATE addresses SET is_default = 0 WHERE account_id = ?`, [accountId]);
    }

    await pool.execute(
      `INSERT INTO addresses
         (id, account_id, name, phone, address, city, province, postal_code, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        accountId,
        String(addressData.name || '').trim(),
        String(addressData.phone || '').trim(),
        String(addressData.address || '').trim(),
        String(addressData.city || 'Sukabumi').trim(),
        String(addressData.province || 'Jawa Barat').trim(),
        String(addressData.postalCode || '').trim() || null,
        isDefault,
      ],
    );
    return this.getAddresses(accountId).then((list) => list.find((a) => a.id === id));
  }

  async setDefaultAddress(accountId, addressId) {
    await pool.execute(`UPDATE addresses SET is_default = 0 WHERE account_id = ?`, [accountId]);
    const [result] = await pool.execute(
      `UPDATE addresses SET is_default = 1 WHERE id = ? AND account_id = ?`,
      [addressId, accountId],
    );
    return result.affectedRows > 0;
  }

  async deleteAddress(accountId, addressId) {
    const [result] = await pool.execute(
      `DELETE FROM addresses WHERE id = ? AND account_id = ?`,
      [addressId, accountId],
    );
    return result.affectedRows > 0;
  }

  // ─── Pesanan ──────────────────────────────────────────────────────────────────

  async getOrders(filters = {}) {
    let sql = `SELECT o.*, a.name AS account_name, a.email AS account_email,
                      ad.name AS address_name, ad.phone AS address_phone,
                      ad.address AS address_text, ad.city AS address_city,
                      ad.province AS address_province, ad.postal_code AS address_postal_code
               FROM orders o
               LEFT JOIN accounts a ON a.id = o.account_id
               LEFT JOIN addresses ad ON ad.id = o.address_id
               WHERE 1=1`;
    const params = [];

    if (filters.accountId) {
      sql += ` AND o.account_id = ?`;
      params.push(filters.accountId);
    }
    if (filters.status) {
      sql += ` AND o.status = ?`;
      params.push(filters.status);
    }

    sql += ` ORDER BY o.created_at DESC`;

    const [rows] = await pool.execute(sql, params);
    return rows.map((r) => ({
      id: r.id,
      accountId: r.account_id,
      accountName: r.account_name,
      accountEmail: r.account_email,
      addressId: r.address_id,
      address: buildOrderAddress(r),
      total: Number(r.total),
      paymentMethod: r.payment_method,
      deliveryMethod: r.delivery_method,
      status: r.status,
      catatan: r.catatan || '',
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
      updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at,
    }));
  }

  async getOrderById(id) {
    const [rows] = await pool.execute(
      `SELECT o.*, a.name AS account_name, a.email AS account_email,
              ad.name AS address_name, ad.phone AS address_phone,
              ad.address AS address_text, ad.city AS address_city,
              ad.province AS address_province, ad.postal_code AS address_postal_code
       FROM orders o
       LEFT JOIN accounts a ON a.id = o.account_id
       LEFT JOIN addresses ad ON ad.id = o.address_id
       WHERE o.id = ? LIMIT 1`,
      [id],
    );
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      id: r.id,
      accountId: r.account_id,
      accountName: r.account_name || '',
      accountEmail: r.account_email || '',
      addressId: r.address_id,
      address: buildOrderAddress(r),
      total: Number(r.total),
      paymentMethod: r.payment_method,
      deliveryMethod: r.delivery_method,
      status: r.status,
      catatan: r.catatan || '',
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
      updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at,
    };
  }

  async getOrderItems(orderId) {
    const [rows] = await pool.execute(
      `SELECT oi.*,
              COALESCE(NULLIF(oi.product_name, ''), p.name)   AS resolved_name,
              COALESCE(NULLIF(oi.product_brand, ''), p.brand) AS resolved_brand,
              COALESCE(NULLIF(oi.product_image, ''), p.image) AS resolved_image
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?
       ORDER BY oi.created_at ASC, oi.id ASC`,
      [orderId],
    );
    return rows.map((r) => ({
      id: r.id,
      orderId: r.order_id,
      productId: r.product_id,
      productName: r.resolved_name || 'Produk tidak tersedia',
      productBrand: r.resolved_brand || '',
      productImage: r.resolved_image || '',
      varian: r.varian || '',
      qty: Number(r.qty),
      price: Number(r.price),
    }));
  }

  async createOrder(orderData) {
    if (!orderData?.accountId) {
      throw new OrderValidationError('Akun pesanan tidak ditemukan.', 401);
    }
    if (!isValidMethodPair(orderData.paymentMethod, orderData.deliveryMethod)) {
      throw new OrderValidationError(
        'Kombinasi metode pembayaran dan pengiriman tidak valid.',
      );
    }
    const rawItems = Array.isArray(orderData.items) ? orderData.items : [];
    if (rawItems.length === 0) {
      throw new OrderValidationError('Item pesanan wajib diisi.');
    }

    const conn = await pool.getConnection();
    let orderId;
    try {
      await conn.beginTransaction();
      orderId = `order_${crypto.randomUUID()}`;

      const [addressRows] = await conn.execute(
        `SELECT * FROM addresses WHERE id = ? AND account_id = ? LIMIT 1`,
        [orderData.addressId, orderData.accountId],
      );
      const address = addressRows[0] || null;
      if (!address) {
        throw new OrderValidationError('Alamat pengiriman tidak ditemukan pada akun Anda.');
      }

      // Gabungkan item dengan produk + varian yang sama agar stok dihitung tepat.
      const grouped = new Map();
      for (const item of rawItems) {
        const key = `${item.productId}::${String(item.varian || '').trim().toLowerCase()}`;
        const existing = grouped.get(key);
        if (existing) {
          existing.qty = Number(existing.qty) + Number(item.qty || 1);
        } else {
          grouped.set(key, { ...item });
        }
      }

      const lines = [];
      for (const item of grouped.values()) {
        // Kunci baris produk sampai transaksi selesai agar stok tidak balapan.
        const [productRows] = await conn.execute(
          `SELECT * FROM products WHERE id = ? LIMIT 1 FOR UPDATE`,
          [item.productId],
        );
        if (!productRows[0]) {
          throw new OrderValidationError(`Produk ${item.productId} tidak ditemukan.`);
        }

        const product = rowToProduct(productRows[0]);
        const line = resolveOrderLine(product, item);
        const next = adjustProductStock(product, line, -1);

        await conn.execute(
          `UPDATE products SET stock = ?, stock_status = ?, variants = ? WHERE id = ?`,
          [next.stock, next.stockStatus, JSON.stringify(next.variants), product.id],
        );

        lines.push(line);
      }

      const total = computeOrderTotal(lines);

      await conn.execute(
        `INSERT INTO orders
           (id, account_id, address_id, total, payment_method, delivery_method, status, catatan,
            recipient_name, recipient_phone, shipping_address,
            shipping_city, shipping_province, shipping_postal_code)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          orderData.accountId,
          orderData.addressId || null,
          total,
          orderData.paymentMethod,
          orderData.deliveryMethod,
          'pending',
          String(orderData.catatan || '').trim(),
          address.name || '',
          address.phone || '',
          address.address || '',
          address.city || '',
          address.province || '',
          address.postal_code || null,
        ],
      );

      for (const line of lines) {
        await conn.execute(
          `INSERT INTO order_items
             (id, order_id, product_id, product_name, product_brand, product_image,
              varian, qty, price)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `item_${crypto.randomUUID()}`,
            orderId,
            line.productId,
            line.productName,
            line.productBrand,
            line.productImage,
            line.varian || '',
            line.qty,
            line.price,
          ],
        );
      }

      await conn.commit();
    } catch (err) {
      try {
        await conn.rollback();
      } catch {
        /* rollback terbaik; error asli tetap dilempar */
      }
      throw err;
    } finally {
      conn.release();
    }

    const order = await this.getOrderById(orderId);
    const items = await this.getOrderItems(orderId);
    return { ...order, items };
  }

  /** Kembalikan stok seluruh item pesanan (dipanggil di dalam transaksi). */
  async _restoreOrderStock(conn, orderId) {
    const [items] = await conn.execute(
      `SELECT * FROM order_items WHERE order_id = ?`,
      [orderId],
    );

    for (const item of items) {
      if (!item.product_id) continue;

      const [rows] = await conn.execute(
        `SELECT * FROM products WHERE id = ? LIMIT 1 FOR UPDATE`,
        [item.product_id],
      );
      if (!rows[0]) continue;

      const product = rowToProduct(rows[0]);
      const next = adjustProductStock(
        product,
        { qty: Number(item.qty), varian: item.varian || '' },
        1,
      );

      await conn.execute(
        `UPDATE products SET stock = ?, stock_status = ?, variants = ? WHERE id = ?`,
        [next.stock, next.stockStatus, JSON.stringify(next.variants), product.id],
      );
    }
  }

  async updateOrderStatus(id, status, options = {}) {
    const role = options.role === 'customer' ? 'customer' : 'admin';
    const conn = await pool.getConnection();
    let found = false;

    try {
      await conn.beginTransaction();
      const [rows] = await conn.execute(
        `SELECT * FROM orders WHERE id = ? LIMIT 1 FOR UPDATE`,
        [id],
      );
      const current = rows[0];
      if (!current) {
        await conn.rollback();
        return null;
      }
      found = true;

      if (current.status !== status) {
        if (!canTransition(current.status, status, role)) {
          throw new OrderValidationError(
            `Status tidak dapat diubah dari "${current.status}" ke "${status}".`,
            409,
          );
        }

        if (status === 'dibatalkan' && shouldRestoreStock(current.status)) {
          await this._restoreOrderStock(conn, id);
        }

        await conn.execute(`UPDATE orders SET status = ? WHERE id = ?`, [status, id]);
      }

      await conn.commit();
    } catch (err) {
      try {
        await conn.rollback();
      } catch {
        /* abaikan */
      }
      throw err;
    } finally {
      conn.release();
    }

    return found ? this.getOrderById(id) : null;
  }

  /** Pelanggan membatalkan pesanannya sendiri; stok dikembalikan otomatis. */
  async cancelOrder(id, accountId) {
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();
      const [rows] = await conn.execute(
        `SELECT * FROM orders WHERE id = ? LIMIT 1 FOR UPDATE`,
        [id],
      );
      const current = rows[0];
      if (!current) {
        await conn.rollback();
        return { notFound: true };
      }
      if (accountId && current.account_id !== accountId) {
        await conn.rollback();
        return { forbidden: true };
      }
      if (!canTransition(current.status, 'dibatalkan', 'customer')) {
        throw new OrderValidationError(
          `Pesanan berstatus "${current.status}" tidak dapat dibatalkan.`,
          409,
        );
      }

      await this._restoreOrderStock(conn, id);
      await conn.execute(`UPDATE orders SET status = 'dibatalkan' WHERE id = ?`, [id]);
      await conn.commit();
    } catch (err) {
      try {
        await conn.rollback();
      } catch {
        /* abaikan */
      }
      throw err;
    } finally {
      conn.release();
    }

    return this.getOrderById(id);
  }

  /** Hapus pesanan; stok dikembalikan bila pesanan masih aktif. */
  async deleteOrder(id) {
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();
      const [rows] = await conn.execute(
        `SELECT * FROM orders WHERE id = ? LIMIT 1 FOR UPDATE`,
        [id],
      );
      if (!rows[0]) {
        await conn.rollback();
        return false;
      }

      if (shouldRestoreStock(rows[0].status)) {
        await this._restoreOrderStock(conn, id);
      }

      await conn.execute(`DELETE FROM orders WHERE id = ?`, [id]);
      await conn.commit();
      return true;
    } catch (err) {
      try {
        await conn.rollback();
      } catch {
        /* abaikan */
      }
      throw err;
    } finally {
      conn.release();
    }
  }

  // ─── Settings ──────────────────────────────────────────────

  async getSettings() {
    const [rows] = await pool.execute(`SELECT * FROM settings WHERE id = 1 LIMIT 1`);
    if (!rows[0]) return this._defaultSettings();
    const r = rows[0];
    return {
      storeName: r.store_name,
      tagline: r.tagline || '',
      address: r.address || '',
      phone: r.phone || '',
      currency: r.currency,
      activeWhatsApp: Boolean(r.active_whatsapp),
    };
  }

  async updateSettings(newSettings) {
    const current = await this.getSettings();
    const merged = { ...current, ...newSettings };

    const [result] = await pool.execute(
      `UPDATE settings
       SET store_name = ?, tagline = ?, address = ?, phone = ?, currency = ?, active_whatsapp = ?
       WHERE id = 1`,
      [
        merged.storeName,
        merged.tagline,
        merged.address,
        merged.phone,
        merged.currency,
        merged.activeWhatsApp ? 1 : 0,
      ],
    );

    if (result.affectedRows === 0) {
      throw new Error('Gagal memperbarui pengaturan: konfigurasi tidak ditemukan.');
    }

    return merged;
  }

  // Alias untuk kompatibilitas route store yang lama
  async getStoreSettings() { return this.getSettings(); }
  async updateStoreSettings(s) { return this.updateSettings(s); }

  _defaultSettings() {
    return {
      storeName: 'HenGadget',
      tagline: 'Best Gadget and Accessories',
      address: '',
      phone: '',
      currency: 'Rp.',
      activeWhatsApp: true,
    };
  }
}

export const db = new Database();
