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

const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];

page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`CONSOLE: ${message.text()}`);
});
page.on('pageerror', (error) => errors.push(`PAGEERROR: ${error.message}`));

const log = (...args) => console.log(...args);

// --- Product detail + colour swatches ---
await page.goto(`${BASE}/product/apple-iphone-17-pro-max`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
log('IPHONE17 title:', await page.locator('h1').first().innerText());
log('IPHONE17 price:', await page.locator('main').innerText().then((t) => t.match(/Rp[\s\d.]+/)?.[0]));
await page.screenshot({ path: `${OUT}\\p17-orange.png`, fullPage: false });

const img = page.locator('main img').first();
log('FILTER initial:', await img.evaluate((el) => el.style.filter));
await page.getByRole('button', { name: 'Warna Deep Blue' }).click();
await page.waitForTimeout(650);
log('FILTER blue:', await img.evaluate((el) => el.style.filter));
log('LABEL blue:', await page.getByText('Gambar menyesuaikan warna yang dipilih').locator('..').innerText());
await page.screenshot({ path: `${OUT}\\p17-blue.png`, fullPage: false });

await page.getByRole('button', { name: 'Warna Silver' }).click();
await page.waitForTimeout(650);
log('FILTER silver:', await img.evaluate((el) => el.style.filter));
await page.screenshot({ path: `${OUT}\\p17-silver.png`, fullPage: false });

// --- Catalog count ---
await page.goto(`${BASE}/catalog`, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
log('CATALOG cards:', await page.locator('article').count());
log('CATALOG has iPhone 17:', (await page.getByText('Apple iPhone 17 Pro Max 1TB').count()) > 0);

// --- Login / register screens ---
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const loginBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
log('LOGIN body bg:', loginBg);
log('LOGIN h2:', await page.locator('h2').first().innerText());
log('LOGIN overflowX:', await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth));
await page.screenshot({ path: `${OUT}\\login-desktop.png`, fullPage: true });

if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  console.error('Set ADMIN_EMAIL dan ADMIN_PASSWORD sebelum menjalankan skrip ini.');
  process.exit(1);
}

await page.getByLabel('Email').fill(process.env.ADMIN_EMAIL);
await page.getByLabel('Kata Sandi').fill(process.env.ADMIN_PASSWORD);
await page.getByRole('button', { name: 'Masuk' }).click();
await page.waitForURL(`${BASE}/admin`, { timeout: 10000 });
log('LOGIN redirect to dashboard: OK');

// Logged-in state redirects /register to home, so use a clean context.
const context2 = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page2 = await context2.newPage();
page2.on('pageerror', (error) => errors.push(`PAGEERROR2: ${error.message}`));
await page2.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
await page2.waitForTimeout(600);
log('REGISTER h2:', await page2.locator('h2').first().innerText());
log('REGISTER overflowX:', await page2.evaluate(() => document.documentElement.scrollWidth > window.innerWidth));
await page2.screenshot({ path: `${OUT}\\register-desktop.png`, fullPage: true });

// --- Mobile auth ---
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
const mpage = await mobile.newPage();
mpage.on('pageerror', (error) => errors.push(`PAGEERROR-M: ${error.message}`));
await mpage.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await mpage.waitForTimeout(600);
log('MOBILE LOGIN overflowX:', await mpage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth));
await mpage.screenshot({ path: `${OUT}\\login-mobile.png`, fullPage: true });

log('BROWSER ERRORS:', errors.length ? errors : 'none');

await browser.close();
process.exit(0);
