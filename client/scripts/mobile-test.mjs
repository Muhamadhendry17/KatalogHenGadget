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

const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`CONSOLE: ${message.text()}`);
});
page.on('pageerror', (error) => errors.push(`PAGEERROR: ${error.message}`));

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}\\mobile-home.png`, fullPage: true });

const hasOverflow = await page.evaluate(
  () => document.documentElement.scrollWidth > window.innerWidth + 2
);
console.log('MOBILE horizontal overflow:', hasOverflow);

await page.getByRole('button', { name: 'Buka menu' }).click();
await page.waitForTimeout(300);
console.log('MOBILE menu visible:', await page.getByRole('link', { name: 'Artikel', exact: true }).first().isVisible());
await page.screenshot({ path: `${OUT}\\mobile-menu.png` });

await page.goto(`${BASE}/catalog?filter=Harga%20bersahabat`, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
console.log(
  'DEEP LINK harga products:',
  await page.locator('article h3').allTextContents()
);
console.log(
  'DEEP LINK active chip:',
  await page.locator('button', { hasText: 'Harga bersahabat' }).first().getAttribute('class')
);

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}\\login.png`, fullPage: true });
console.log('LOGIN heading:', await page.locator('h2').first().innerText());

await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}\\register.png`, fullPage: true });
console.log('REGISTER heading:', await page.locator('h2').first().innerText());

console.log('BROWSER ERRORS:', errors.length ? errors : 'none');
await browser.close();
process.exit(0);
