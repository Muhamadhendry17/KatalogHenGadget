/**
 * Seed katalog toko dari data storefront (client/src/data/products.js).
 *
 * Jalankan sekali dari folder server:
 *   node scripts/seed-catalog.js
 *
 * Script ini mengganti daftar produk di data.json dengan katalog lengkap
 * (spesifikasi, warna, skor, dsb.) supaya dashboard admin dan storefront
 * memakai sumber data yang sama.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { products as storefrontProducts } from '../../client/src/data/products.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = path.join(__dirname, '../src/db/data.json');

const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

const category = (data.categories || []).find((item) => item.name === 'Smartphone') ||
  (data.categories || [])[0] || { id: 'cat_1', name: 'Smartphone', slug: 'smartphone' };

if (!Array.isArray(data.categories) || !data.categories.length) {
  data.categories = [category];
}

data.products = storefrontProducts.map((product, index) => ({
  id: product.id,
  name: product.name,
  brand: product.brand,
  tag: product.tag,
  featured: Boolean(product.featured),
  price: product.price,
  description: product.description,
  image: product.image,
  categoryId: category.id,
  categoryName: category.name,
  stockStatus: 'Tersedia',
  colors: product.colors,
  colorNames: product.colorNames,
  rating: product.rating,
  reviews: product.reviews,
  releaseYear: product.releaseYear,
  isNew: Boolean(product.isNew),
  performanceScore: product.performanceScore,
  cameraScore: product.cameraScore,
  specs: product.specs,
  highlights: product.highlights,
  createdAt: new Date(Date.UTC(2024, 0, 1 + index)).toISOString(),
  updatedAt: new Date().toISOString(),
}));

// Pastikan semua akun lama tetap admin, akun baru (customer) tidak tersentuh.
data.admins = (data.admins || []).map((admin) => ({ ...admin, role: admin.role || 'admin' }));
if (data.admin) {
  if (!data.admins.some((admin) => admin.id === data.admin.id)) {
    data.admins.unshift(data.admin);
  }
  delete data.admin;
}

const tempFile = `${dataFile}.${process.pid}.tmp`;
fs.writeFileSync(tempFile, `${JSON.stringify(data, null, 2)}\n`);
fs.renameSync(tempFile, dataFile);

console.log(`Seed selesai: ${data.products.length} produk, ${data.categories.length} kategori.`);
