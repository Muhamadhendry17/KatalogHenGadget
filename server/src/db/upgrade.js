/**
 * upgrade.js — Naikkan skema database lama ke skema terbaru TANPA menghapus data.
 *
 * Berbeda dengan migrate.js (yang men-drop tabel produk/pesanan), skrip ini:
 *  - menambah kolom snapshot pesanan & item pesanan bila belum ada,
 *  - membuat product_id pada order_items boleh NULL + ON DELETE SET NULL,
 *  - menghapus kolom rating/reviews dari products bila masih ada,
 *  - mengisi snapshot lama dari tabel addresses/products.
 *
 * Jalankan dari folder server:
 *   node src/db/upgrade.js
 *
 * Aman dijalankan berulang kali (idempotent).
 */

import '../env.js';
import mysql from 'mysql2/promise';

const DB = process.env.DB_NAME || 'hengadget';

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: DB,
});

async function tableExists(table) {
  const [rows] = await conn.execute(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
     LIMIT 1`,
    [table],
  );
  return rows.length > 0;
}

async function columnExists(table, column) {  const [rows] = await conn.execute(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [table, column],
  );
  return rows.length > 0;
}

async function addColumn(table, column, definition) {
  if (await columnExists(table, column)) {
    console.log(`   • ${table}.${column} sudah ada`);
    return;
  }
  await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  console.log(`   + ${table}.${column}`);
}

console.log(`🚀 Upgrade skema database "${DB}"...\n`);

const required = ['products', 'orders', 'order_items', 'addresses'];
const missing = [];
for (const table of required) {
  if (!(await tableExists(table))) missing.push(table);
}
if (missing.length) {
  console.error(
    `❌ Tabel belum ada: ${missing.join(', ')}.\n` +
      '   Database baru harus diinisialisasi dengan: npm run migrate',
  );
  await conn.end();
  process.exit(1);
}

// ── 1. orders: kolom snapshot alamat ─────────────────────────────────────────
console.log('📦 orders — snapshot alamat');
await addColumn('orders', 'recipient_name', 'VARCHAR(100) DEFAULT NULL');
await addColumn('orders', 'recipient_phone', 'VARCHAR(30) DEFAULT NULL');
await addColumn('orders', 'shipping_address', 'TEXT DEFAULT NULL');
await addColumn('orders', 'shipping_city', 'VARCHAR(100) DEFAULT NULL');
await addColumn('orders', 'shipping_province', 'VARCHAR(100) DEFAULT NULL');
await addColumn('orders', 'shipping_postal_code', 'VARCHAR(10) DEFAULT NULL');

// ── 2. order_items: snapshot produk + product_id nullable ───────────────────
console.log('\n📦 order_items — snapshot produk');
await addColumn('order_items', 'product_name', 'VARCHAR(200) DEFAULT NULL');
await addColumn('order_items', 'product_brand', 'VARCHAR(100) DEFAULT NULL');
await addColumn('order_items', 'product_image', 'VARCHAR(500) DEFAULT NULL');

const [fkRows] = await conn.execute(
  `SELECT CONSTRAINT_NAME
   FROM information_schema.KEY_COLUMN_USAGE
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'order_items'
     AND COLUMN_NAME = 'product_id'
     AND REFERENCED_TABLE_NAME = 'products'`,
);

for (const row of fkRows) {
  await conn.query(
    `ALTER TABLE order_items DROP FOREIGN KEY \`${row.CONSTRAINT_NAME}\``,
  );
  console.log(`   - FK ${row.CONSTRAINT_NAME} dilepas sementara`);
}

const [colRows] = await conn.execute(
  `SELECT IS_NULLABLE, COLUMN_TYPE
   FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'order_items'
     AND COLUMN_NAME = 'product_id'
   LIMIT 1`,
);
if (colRows[0] && (colRows[0].IS_NULLABLE !== 'YES' || !/varchar/i.test(colRows[0].COLUMN_TYPE))) {
  await conn.query(
    'ALTER TABLE order_items MODIFY COLUMN product_id VARCHAR(60) DEFAULT NULL',
  );
  console.log('   ~ order_items.product_id → NULL-able');
}

const [fkAfter] = await conn.execute(
  `SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE()
     AND TABLE_NAME = 'order_items'
     AND CONSTRAINT_NAME = 'fk_orderitem_product'
   LIMIT 1`,
);
if (!fkAfter.length) {
  await conn.query(
    `ALTER TABLE order_items
       ADD CONSTRAINT fk_orderitem_product
       FOREIGN KEY (product_id) REFERENCES products(id)
       ON DELETE SET NULL ON UPDATE CASCADE`,
  );
  console.log('   + FK fk_orderitem_product (ON DELETE SET NULL)');
}

// ── 3. products: hapus rating/reviews ───────────────────────────────────────
console.log('\n🧹 products — hapus kolom rating/reviews');
for (const column of ['rating', 'reviews']) {
  if (await columnExists('products', column)) {
    await conn.query(`ALTER TABLE products DROP COLUMN \`${column}\``);
    console.log(`   - products.${column}`);
  } else {
    console.log(`   • products.${column} sudah tidak ada`);
  }
}

// ── 4. Backfill snapshot pesanan lama ────────────────────────────────────────
console.log('\n🔁 Backfill snapshot data lama');
const [orderResult] = await conn.query(
  `UPDATE orders o
   JOIN addresses ad ON ad.id = o.address_id
   SET o.recipient_name      = COALESCE(NULLIF(o.recipient_name, ''), ad.name),
       o.recipient_phone     = COALESCE(NULLIF(o.recipient_phone, ''), ad.phone),
       o.shipping_address    = COALESCE(NULLIF(o.shipping_address, ''), ad.address),
       o.shipping_city       = COALESCE(NULLIF(o.shipping_city, ''), ad.city),
       o.shipping_province   = COALESCE(NULLIF(o.shipping_province, ''), ad.province),
       o.shipping_postal_code = COALESCE(NULLIF(o.shipping_postal_code, ''), ad.postal_code)
   WHERE o.address_id IS NOT NULL`,
);
console.log(`   • ${orderResult.affectedRows} pesanan diisi snapshot alamatnya`);

const [itemResult] = await conn.query(
  `UPDATE order_items oi
   JOIN products p ON p.id = oi.product_id
   SET oi.product_name  = COALESCE(NULLIF(oi.product_name, ''), p.name),
       oi.product_brand = COALESCE(NULLIF(oi.product_brand, ''), p.brand),
       oi.product_image = COALESCE(NULLIF(oi.product_image, ''), p.image)`,
);
console.log(`   • ${itemResult.affectedRows} item pesanan diisi snapshot produknya`);

// ── 5. Permintaan reset kata sandi (dibantu admin) ──────────────────────────
console.log('\n🔐 password_reset_requests');
await conn.query(
  `CREATE TABLE IF NOT EXISTS password_reset_requests (
     id         VARCHAR(60)  NOT NULL,
     account_id VARCHAR(60)  NOT NULL,
     email      VARCHAR(150) NOT NULL,
     phone      VARCHAR(30)           DEFAULT NULL,
     status     ENUM('pending','diproses','selesai','ditolak') NOT NULL DEFAULT 'pending',
     handled_by VARCHAR(60)           DEFAULT NULL,
     handled_at DATETIME              DEFAULT NULL,
     created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
     updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     PRIMARY KEY (id),
     KEY idx_resetreq_account (account_id),
     KEY idx_resetreq_status (status),
     CONSTRAINT fk_resetreq_account
       FOREIGN KEY (account_id) REFERENCES accounts(id)
       ON DELETE CASCADE ON UPDATE CASCADE
   )`,
);
console.log('   • tabel password_reset_requests siap');

await conn.end();
console.log('\n🎉 Upgrade skema selesai tanpa menghapus data.');
