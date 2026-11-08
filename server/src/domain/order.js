/**
 * domain/order.js — Aturan bisnis pesanan yang murni (tanpa akses database).
 *
 * Semua helper di sini bisa diuji tanpa MySQL sehingga logika transisi status,
 * validasi metode, dan perhitungan stok tidak bergantung pada infrastruktur.
 */

export const ORDER_STATUSES = [
  'pending',
  'paid',
  'diproses',
  'dikirim',
  'selesai',
  'dibatalkan',
];

export const PAYMENT_METHODS = ['transfer', 'cod'];
export const DELIVERY_METHODS = ['cod_sukabumi', 'logistik_paket'];

/** Transisi status yang diizinkan untuk admin. */
export const ADMIN_STATUS_TRANSITIONS = {
  pending: ['paid', 'diproses', 'dibatalkan'],
  paid: ['diproses', 'dibatalkan'],
  diproses: ['dikirim', 'dibatalkan'],
  dikirim: ['selesai'],
  selesai: [],
  dibatalkan: [],
};

/** Status yang masih boleh dibatalkan sendiri oleh pelanggan. */
export const CUSTOMER_CANCELLABLE = ['pending', 'paid'];

export const STOCK_AVAILABLE = 'Tersedia';
export const STOCK_EMPTY = 'Habis';

export class OrderValidationError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'OrderValidationError';
    this.status = status;
  }
}

export function normalizeQty(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.min(99, n);
}

export function isValidMethodPair(paymentMethod, deliveryMethod) {
  if (!PAYMENT_METHODS.includes(paymentMethod)) return false;
  if (!DELIVERY_METHODS.includes(deliveryMethod)) return false;
  if (paymentMethod === 'cod') return deliveryMethod === 'cod_sukabumi';
  return deliveryMethod === 'logistik_paket';
}

/**
 * Cari varian berdasarkan teks penyimpanan.
 * Mengembalikan { variant, index } atau { variant: null, index: -1 }.
 */
export function findVariant(variants, varian) {
  const text = String(varian || '').trim().toLowerCase();
  const list = Array.isArray(variants) ? variants : [];
  if (!text) return { variant: null, index: -1 };

  const index = list.findIndex((variant) => {
    const storage = String(variant?.storage || '').trim().toLowerCase();
    if (!storage) return false;
    return text === storage || text.includes(storage) || storage.includes(text);
  });

  if (index === -1) return { variant: null, index: -1 };
  return { variant: list[index], index };
}

/**
 * Validasi satu baris pesanan terhadap produk dan hitung harga resminya.
 * Harga selalu diambil dari katalog, bukan dari kiriman klien.
 */
export function resolveOrderLine(product, item) {
  if (!product) {
    throw new OrderValidationError('Produk tidak ditemukan.');
  }

  const qty = normalizeQty(item?.qty);
  const wanted = String(item?.varian || '').trim();
  const { variant, index } = findVariant(product.variants, wanted);

  if (wanted && Array.isArray(product.variants) && product.variants.length > 0 && index === -1) {
    throw new OrderValidationError(`Varian "${wanted}" untuk ${product.name} tidak tersedia.`);
  }

  const stock = Math.max(0, Number(product.stock) || 0);
  if (product.stockStatus === STOCK_EMPTY || stock <= 0) {
    throw new OrderValidationError(`Stok ${product.name} sedang habis.`);
  }
  if (stock < qty) {
    throw new OrderValidationError(`Stok ${product.name} tersisa ${stock} unit.`);
  }

  if (variant && variant.stock !== undefined && variant.stock !== null) {
    const variantStock = Math.max(0, Number(variant.stock) || 0);
    if (variantStock < qty) {
      throw new OrderValidationError(
        `Stok ${product.name} varian ${variant.storage} tersisa ${variantStock} unit.`,
      );
    }
  }

  const variantPrice = Number(variant?.price);
  const price = Number.isFinite(variantPrice) && variantPrice > 0
    ? variantPrice
    : Number(product.price) || 0;

  if (!Number.isFinite(price) || price <= 0) {
    throw new OrderValidationError(`Harga ${product.name} tidak valid.`);
  }

  return {
    productId: product.id,
    productName: product.name,
    productBrand: product.brand,
    productImage: product.image || '',
    varian: variant ? String(variant.storage || wanted).trim() : wanted,
    qty,
    price,
    variantIndex: index,
  };
}

export function computeOrderTotal(lines) {
  return (Array.isArray(lines) ? lines : []).reduce(
    (sum, line) => sum + Number(line.price) * Number(line.qty),
    0,
  );
}

/**
 * Hitung stok produk setelah dikurangi/dikembalikan.
 * direction = -1 untuk mengurangi, +1 untuk mengembalikan.
 */
export function adjustProductStock(product, line, direction = -1) {
  const delta = (direction < 0 ? -1 : 1) * Number(line.qty);
  const nextStock = Math.max(0, (Number(product.stock) || 0) + delta);

  const variants = Array.isArray(product.variants)
    ? product.variants.map((variant) => ({ ...variant }))
    : [];

  const { index } = findVariant(variants, line.varian);
  if (index >= 0) {
    const variant = variants[index];
    if (variant.stock !== undefined && variant.stock !== null) {
      variant.stock = Math.max(0, (Number(variant.stock) || 0) + delta);
    }
  }

  return {
    stock: nextStock,
    stockStatus: nextStock > 0 ? STOCK_AVAILABLE : STOCK_EMPTY,
    variants,
  };
}

export function canTransition(from, to, role = 'admin') {
  if (!ORDER_STATUSES.includes(to)) return false;
  if (!ORDER_STATUSES.includes(from)) return false;
  if (from === to) return true;

  if (role === 'customer') {
    return to === 'dibatalkan' && CUSTOMER_CANCELLABLE.includes(from);
  }

  return (ADMIN_STATUS_TRANSITIONS[from] || []).includes(to);
}

export function isCustomerCancellable(status) {
  return CUSTOMER_CANCELLABLE.includes(status);
}

/** Status yang stoknya sudah dikunci dan perlu dikembalikan saat batal/hapus. */
export function shouldRestoreStock(status) {
  return ['pending', 'paid', 'diproses', 'dikirim'].includes(status);
}
