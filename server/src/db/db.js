/**
 * db.js — Database layer menggunakan MySQL (mysql2/promise)
 * Drop-in replacement untuk db.js berbasis JSON file lama.
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import pool from './mysql.js';

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
    stockStatus: row.stock_status,
    colors: parseArray(row.colors),
    colorNames: parseArray(row.color_names),
    rating: Number(row.rating),
    reviews: Number(row.reviews),
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

    await pool.execute(
      `INSERT INTO products
         (id, name, brand, tag, featured, price, description, image,
          category_id, category_name, stock_status,
          colors, color_names, rating, reviews, release_year,
          is_new, performance_score, camera_score, specs, highlights)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        String(productData.name || '').trim(),
        String(productData.brand || 'Lainnya').trim(),
        String(productData.tag || 'PILIHAN HENGADGET').trim(),
        parseBoolean(productData.featured) ? 1 : 0,
        parseNumber(productData.price, 0),
        productData.description || '',
        productData.image || '',
        productData.categoryId || null,
        category?.name || '',
        normalizeStock(productData.stockStatus || STOCK_AVAILABLE),
        JSON.stringify(colors.length ? colors : ['#cbd5e1', '#94a3b8']),
        JSON.stringify(colorNames.length ? colorNames : ['Default', 'Alternatif']),
        Math.min(5, Math.max(0, parseNumber(productData.rating, 0))),
        Math.max(0, Math.round(parseNumber(productData.reviews, 0))),
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

    await pool.execute(
      `UPDATE products SET
         name              = ?,
         brand             = ?,
         tag               = ?,
         featured          = ?,
         price             = ?,
         description       = ?,
         image             = ?,
         category_id       = ?,
         category_name     = ?,
         stock_status      = ?,
         colors            = ?,
         color_names       = ?,
         rating            = ?,
         reviews           = ?,
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
        productData.description !== undefined ? productData.description : current.description,
        productData.image !== undefined ? productData.image : current.image,
        categoryId || null,
        category?.name || current.categoryName,
        normalizeStock(productData.stockStatus !== undefined ? productData.stockStatus : current.stockStatus),
        JSON.stringify(colors),
        JSON.stringify(colorNames),
        Math.min(5, Math.max(0, parseNumber(productData.rating !== undefined ? productData.rating : current.rating, 0))),
        Math.max(0, Math.round(parseNumber(productData.reviews !== undefined ? productData.reviews : current.reviews, 0))),
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

    const newStatus =
      product.stockStatus === STOCK_AVAILABLE ? STOCK_EMPTY : STOCK_AVAILABLE;

    await pool.execute(
      `UPDATE products SET stock_status = ? WHERE id = ?`,
      [newStatus, id],
    );

    return this.getProductById(id);
  }

  async deleteProduct(id) {
    const [result] = await pool.execute(`DELETE FROM products WHERE id = ?`, [id]);
    return result.affectedRows > 0;
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

    await pool.execute(
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
