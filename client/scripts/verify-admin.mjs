/**
 * Verifikasi alur dashboard admin + storefront berbasis API.
 * Jalankan dengan server (port 3000) dan client (port 5173) aktif:
 *   node scripts/verify-admin.mjs
 */
import fs from 'fs';
import { chromium } from 'playwright-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';
const OUT = 'C:\\Users\\manda\\AppData\\Local\\Temp\\opencode\\hengadget-admin';
const unique = Date.now();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Set ADMIN_EMAIL dan ADMIN_PASSWORD sebelum menjalankan skrip ini.');
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });

const assert = (condition, label) => {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`OK  ${label}`);
};

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});

const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];

page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`CONSOLE: ${message.text()}`);
});
page.on('pageerror', (error) => errors.push(`PAGEERROR: ${error.message}`));
page.on('dialog', (dialog) => dialog.accept());

// 1. Proteksi route admin
await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
await page.waitForURL('**/login');
assert(page.url().includes('/login'), 'belum login diarahkan ke /login');

// 2. Login admin
await page.locator('#login-email').fill(ADMIN_EMAIL);
await page.locator('#login-password').fill(ADMIN_PASSWORD);
await page.getByRole('button', { name: 'Masuk', exact: true }).click();
await page.waitForURL('**/admin', { timeout: 10000 });
await page.getByText('Selamat datang kembali').waitFor({ timeout: 10000 });
assert(page.url().endsWith('/admin'), 'login admin mendarat di dashboard');
await page.screenshot({ path: `${OUT}\\dashboard.png`, fullPage: true });

const statText = await page.locator('main').innerText();
assert(/Total produk/i.test(statText) && /16/.test(statText), 'dashboard menampilkan statistik produk');

// 3. Halaman produk
await page.getByRole('link', { name: 'Produk', exact: true }).click();
await page.waitForURL('**/admin/products');
await page.getByRole('heading', { name: 'Kelola produk' }).waitFor({ timeout: 10000 });
await page.locator('tbody tr').first().waitFor();
const initialRows = await page.locator('tbody tr').count();
assert(initialRows === 16, `tabel produk menampilkan 16 baris (dapat ${initialRows})`);

// 4. Tambah produk lewat UI
await page.getByRole('button', { name: /Tambah produk/ }).first().click();
const form = page.locator('#product-form');
await form.waitFor();
await form.getByPlaceholder('Contoh: Samsung Galaxy S25 Ultra').fill(`Produk Uji UI ${unique}`);
await form.getByPlaceholder('Samsung, Apple, Xiaomi...').fill('TestUI');
await form.locator('select').first().selectOption({ index: 1 });
await form.locator('input[type="number"]').first().fill('5000000');
await form.getByPlaceholder('Deskripsi singkat produk...').fill('Produk untuk menguji dashboard admin.');
await page.getByRole('button', { name: 'Simpan produk' }).click();
await page.getByText('Produk berhasil ditambahkan.').waitFor({ timeout: 10000 });
assert(true, 'produk baru berhasil disimpan dari dashboard');

await page.getByPlaceholder('Cari nama atau merek...').fill(`Produk Uji UI ${unique}`);
await page.waitForTimeout(400);
const createdRow = page.locator('tbody tr', { hasText: `Produk Uji UI ${unique}` });
assert((await createdRow.count()) === 1, 'produk baru muncul di tabel');
assert((await createdRow.innerText()).includes('4.5'), 'rating produk baru tersimpan dari form');

await createdRow.getByRole('button', { name: 'Hapus' }).click();
await page.getByText('berhasil dihapus.').waitFor({ timeout: 10000 });
assert(true, 'produk uji berhasil dihapus');

// 5. Kategori
await page.getByRole('link', { name: 'Kategori', exact: true }).click();
await page.waitForURL('**/admin/categories');
await page.getByPlaceholder('Contoh: Tablet').fill(`Kategori Uji ${unique}`);
await page.getByRole('button', { name: 'Tambah kategori' }).click();
await page.getByText(`Kategori Uji ${unique}`).waitFor({ timeout: 10000 });
assert(true, 'kategori baru berhasil ditambahkan');

const categoryItem = page.locator('li', { hasText: `Kategori Uji ${unique}` });
await categoryItem.getByRole('button', { name: 'Edit' }).click();
const editForm = page.locator('li form');
await editForm.locator('input').fill(`Kategori Edit ${unique}`);
await editForm.getByRole('button', { name: 'Simpan' }).click();
await page.getByText(`Kategori Edit ${unique}`).waitFor({ timeout: 10000 });
assert(true, 'kategori berhasil diedit');

const editedCategoryItem = page.locator('li', { hasText: `Kategori Edit ${unique}` });
await editedCategoryItem.getByRole('button', { name: 'Hapus' }).click();
await page.getByText('Kategori berhasil dihapus.').waitFor({ timeout: 10000 });
assert(true, 'kategori uji berhasil dihapus');

// 6. Pengaturan toko
await page.getByRole('link', { name: 'Pengaturan Toko', exact: true }).click();
await page.waitForURL('**/admin/settings');
await page.getByRole('heading', { name: 'Pengaturan toko' }).waitFor();
await page.waitForFunction(() => {
  const input = document.querySelector('form input');
  return Boolean(input && input.value.trim());
});
const storeName = await page.locator('form input').first().inputValue();
assert(storeName === 'HenGadget', 'pengaturan toko termuat dari server');
await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
await page.getByText('Pengaturan toko berhasil disimpan.').waitFor({ timeout: 10000 });
assert(true, 'pengaturan toko bisa disimpan');
await page.screenshot({ path: `${OUT}\\settings.png`, fullPage: true });

// 7. Storefront memakai API + link dashboard
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const homeCards = await page.locator('article').count();
assert(homeCards > 0, `beranda menampilkan produk dari API (${homeCards} kartu)`);
assert((await page.getByRole('link', { name: 'Dashboard' }).count()) === 1, 'navbar menampilkan link Dashboard untuk admin');

await page.goto(`${BASE}/catalog`, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const catalogCards = await page.locator('article').count();
assert(catalogCards === 16, `katalog menampilkan 16 produk (dapat ${catalogCards})`);
await page.screenshot({ path: `${OUT}\\catalog.png`, fullPage: true });

await page.goto(`${BASE}/product/apple-iphone-17-pro-max`, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
assert((await page.locator('h1').first().innerText()).includes('iPhone 17 Pro Max'), 'detail produk termuat dari API');
await page.screenshot({ path: `${OUT}\\product.png`, fullPage: true });

await browser.close();

if (errors.length) {
  console.log('\nConsole/page errors:');
  errors.forEach((error) => console.log(' -', error));
  process.exitCode = 1;
} else {
  console.log('\nSemua verifikasi UI lulus tanpa console error.');
}
