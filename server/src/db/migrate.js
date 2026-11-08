/**
 * migrate.js — Migrasi data dari data.json ke MySQL (XAMPP)
 *
 * Jalankan SEKALI dari folder server/:
 *   node src/db/migrate.js
 */

import '../env.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data.json');

// ── Koneksi sementara (tanpa nama DB dulu agar bisa CREATE DATABASE) ──────────
const conn = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
});

const DB = process.env.DB_NAME || 'hengadget';

console.log('🚀 Memulai migrasi ke MySQL...\n');

// ── Buat database & jalankan schema ──────────────────────────────────────────
const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
await conn.query(schemaSql);
console.log(`✅ Database "${DB}" & schema berhasil dibuat/diperbarui`);

await conn.query(`USE ${DB}`);

// ── Pastikan tabel produk & order menggunakan skema terbaru ─────────────────────
// Drop tabel terkait produk agar kolom baru (stock, badges, variants, dsb.)
// dapat dibuat ulang. Akun, settings, dan kategori tetap dipertahankan.
await conn.query(`SET FOREIGN_KEY_CHECKS = 0`);
await conn.query(`DROP TABLE IF EXISTS order_items`);
await conn.query(`DROP TABLE IF EXISTS orders`);
await conn.query(`DROP TABLE IF EXISTS addresses`);
await conn.query(`DROP TABLE IF EXISTS password_reset_tokens`);
await conn.query(`DROP TABLE IF EXISTS products`);
await conn.query(`SET FOREIGN_KEY_CHECKS = 1`);

// Jalankan schema (buat ulang tabel dengan kolom baru)
await conn.query(schemaSql);
console.log(`✅ Database "${DB}" & schema berhasil dibuat/diperbarui`);

// ── Baca data.json ────────────────────────────────────────────────────────────
const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

// ── 1. Settings ───────────────────────────────────────────────────────────────
const s = raw.settings || {};
await conn.execute(
  `REPLACE INTO settings (id, store_name, tagline, address, phone, currency, active_whatsapp)
   VALUES (1, ?, ?, ?, ?, ?, ?)`,
  [
    s.storeName || 'HenGadget',
    s.tagline || '',
    s.address || '',
    s.phone || '',
    s.currency || 'Rp.',
    s.activeWhatsApp ? 1 : 0,
  ],
);
console.log('✅ Settings dimigrasi');

// ── 2. Accounts (admins) ──────────────────────────────────────────────────────
const accounts = Array.isArray(raw.admins) ? raw.admins : [];
let accountCount = 0;
for (const acc of accounts) {
  if (!acc.id || !acc.email || !acc.password) continue;
  await conn.execute(
    `INSERT IGNORE INTO accounts (id, name, email, password, role, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      acc.id,
      acc.name || '',
      acc.email.trim().toLowerCase(),
      acc.password,
      acc.role === 'admin' ? 'admin' : 'customer',
      acc.createdAt ? new Date(acc.createdAt) : new Date(),
    ],
  );
  accountCount++;
}
console.log(`✅ ${accountCount} akun dimigrasi`);

// ── 3. Categories ─────────────────────────────────────────────────────────────
const categories = Array.isArray(raw.categories) ? raw.categories : [];
for (const cat of categories) {
  if (!cat.id || !cat.name) continue;
  const slug = cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  await conn.execute(
    `INSERT IGNORE INTO categories (id, name, slug) VALUES (?, ?, ?)`,
    [cat.id, cat.name.trim(), slug],
  );
}
console.log(`✅ ${categories.length} kategori dimigrasi`);

// ── 4. Products ───────────────────────────────────────────────────────────────
const products = Array.isArray(raw.products) ? raw.products : [];
let productCount = 0;
for (const p of products) {
  if (!p.id || !p.name) continue;
  await conn.execute(
    `INSERT IGNORE INTO products
       (id, name, brand, tag, featured, price, original_price, description, image,
        category_id, category_name, stock_status, stock,
        badges, variants, colors, color_names, release_year,
        is_new, performance_score, camera_score,
        specs, highlights, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      p.id,
      String(p.name || '').trim(),
      String(p.brand || 'Lainnya').trim(),
      String(p.tag || 'PILIHAN HENGADGET').trim(),
      p.featured ? 1 : 0,
      Number(p.price) || 0,
      p.originalPrice != null ? Number(p.originalPrice) : null,
      p.description || '',
      p.image || '',
      p.categoryId || null,
      String(p.categoryName || '').trim(),
      ['Tersedia', 'Habis'].includes(p.stockStatus) ? p.stockStatus : 'Tersedia',
      Number(p.stock) || 10,
      JSON.stringify(Array.isArray(p.badges) ? p.badges : []),
      JSON.stringify(Array.isArray(p.variants) ? p.variants : []),
      JSON.stringify(Array.isArray(p.colors) ? p.colors : []),
      JSON.stringify(Array.isArray(p.colorNames) ? p.colorNames : []),
      p.releaseYear ? Number(p.releaseYear) : new Date().getFullYear(),
      p.isNew ? 1 : 0,
      Math.min(100, Math.max(0, Number(p.performanceScore) || 0)),
      Math.min(100, Math.max(0, Number(p.cameraScore) || 0)),
      JSON.stringify(Array.isArray(p.specs) ? p.specs : []),
      JSON.stringify(Array.isArray(p.highlights) ? p.highlights : []),
      p.createdAt ? new Date(p.createdAt) : new Date(),
      p.updatedAt ? new Date(p.updatedAt) : new Date(),
    ],
  );
  productCount++;
}
console.log(`✅ ${productCount} produk dimigrasi`);

await conn.end();
console.log('\n🎉 Migrasi selesai! Semua data sudah masuk ke MySQL.');
