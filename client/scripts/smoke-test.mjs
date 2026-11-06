import fs from 'fs';
import { chromium } from 'playwright-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';
const OUT = 'C:\\Users\\manda\\AppData\\Local\\Temp\\opencode\\hengadget-shots';

fs.mkdirSync(OUT, { recursive: true });

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

const log = (...args) => console.log(...args);

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(900);

log('HOME cards:', await page.locator('article').count());
log(
  'HOME hero:',
  await page.locator('section h1').first().innerText()
);
await page.screenshot({ path: `${OUT}\\home.png`, fullPage: true });

await page.getByRole('button', { name: /Performa kencang/ }).click();
await page.waitForTimeout(350);
log('PERFORMA:', await page.locator('article h3').allTextContents());

await page.getByRole('button', { name: /Harga bersahabat/ }).click();
await page.waitForTimeout(350);
log('HARGA:', await page.locator('article h3').allTextContents());

await page.getByRole('button', { name: /Kamera unggul/ }).click();
await page.waitForTimeout(350);
log('KAMERA:', await page.locator('article h3').allTextContents());

await page.getByRole('button', { name: /^Terbaru/ }).click();
await page.waitForTimeout(350);
log('TERBARU:', await page.locator('article h3').allTextContents());

await page.getByRole('link', { name: /Lihat semua handphone/ }).click();
await page.waitForURL('**/catalog');
await page.waitForTimeout(500);
log('CATALOG cards:', await page.locator('article').count());
await page.screenshot({ path: `${OUT}\\catalog.png`, fullPage: true });

await page.locator('article').first().getByRole('link', { name: 'Lihat detail' }).click();
await page.waitForURL('**/product/**');
await page.waitForTimeout(500);
log('DETAIL:', await page.locator('h1').first().innerText());
await page.screenshot({ path: `${OUT}\\detail.png`, fullPage: true });

await page.getByRole('button', { name: /Tambahkan ke Keranjang/ }).click();
await page.getByText(/ditambahkan ke keranjang/).waitFor({ timeout: 5000 });
log('ADD TO CART toast: OK');
await page.getByRole('link', { name: /Buka keranjang/ }).click();
await page.waitForURL('**/cart');
await page.waitForTimeout(500);
log('CART heading:', await page.locator('h1').innerText());

await page.getByRole('link', { name: /Checkout via WhatsApp/ }).click();
await page.waitForURL('**/checkout');
await page.waitForTimeout(700);
log('CHECKOUT drawer has image:', (await page.locator('aside img').count()) > 0);
log('CHECKOUT drawer total:', await page.locator('aside').innerText());
await page.screenshot({ path: `${OUT}\\checkout.png` });

await page.getByRole('button', { name: 'Tutup checkout' }).click();
await page.waitForURL('**/cart');

await page.goto(`${BASE}/compare`, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
log('COMPARE native selects:', await page.locator('select').count());
log('COMPARE custom dropdowns:', await page.getByRole('combobox').count());
await page.getByRole('combobox').first().click();
await page.waitForTimeout(300);
log('COMPARE dropdown options:', await page.getByRole('option').count());
await page.keyboard.press('Escape');
await page.getByRole('button', { name: /Tambahkan handphone lain/ }).click();
await page.waitForTimeout(300);
log('COMPARE dropdowns after add:', await page.getByRole('combobox').count());
await page.screenshot({ path: `${OUT}\\compare.png`, fullPage: true });

await page.goto(`${BASE}/articles`, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}\\articles.png`, fullPage: true });
await page.locator('article').first().getByRole('link', { name: /Baca panduan/ }).click();
await page.waitForURL('**/article/**');
await page.waitForTimeout(400);
log('ARTICLE:', await page.locator('h1').first().innerText());

await page.goto(`${BASE}/info/faq`, { waitUntil: 'networkidle' });
log('INFO:', await page.locator('h1').first().innerText());

await page.goto(BASE, { waitUntil: 'networkidle' });
const footerLinks = await page
  .locator('footer a')
  .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
log('FOOTER links:', footerLinks);

// Pastikan tidak ada tautan mati (#)
const deadLinks = footerLinks.filter((href) => !href || href === '#');
log('FOOTER dead links:', deadLinks);

log('BROWSER ERRORS:', errors.length ? errors : 'none');

await browser.close();
process.exit(0);
