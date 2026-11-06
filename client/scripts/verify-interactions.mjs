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

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);

const productCards = page.locator('article').filter({ has: page.locator('button[aria-label*="Simpan"]') });
console.log('PRODUCT CARDS:', await productCards.count());

const firstCard = page
  .locator('article')
  .filter({ has: page.getByRole('heading', { name: 'Samsung Galaxy S24 Ultra', exact: true }) })
  .first();
const heart = firstCard.locator('button[aria-pressed]').first();
const wishlistBefore = await heart.getAttribute('aria-pressed');
console.log('HEART initial pressed:', wishlistBefore, 'url:', page.url());

await heart.click();
await page.waitForTimeout(350);
const urlAfterFirst = page.url();
const pressedAfterFirst = await heart.getAttribute('aria-pressed');
const storedAfterFirst = await page.evaluate(() => localStorage.getItem('hengadget_wishlist'));
console.log('HEART after 1st click:', {
  url: urlAfterFirst,
  pressed: pressedAfterFirst,
  stored: storedAfterFirst,
});
if (urlAfterFirst !== `${BASE}/`) {
  console.log('FAIL: heart click navigated away');
}

await heart.click();
await page.waitForTimeout(350);
const urlAfterSecond = page.url();
const pressedAfterSecond = await heart.getAttribute('aria-pressed');
console.log('HEART after 2nd click:', {
  url: urlAfterSecond,
  pressed: pressedAfterSecond,
});
if (urlAfterSecond !== `${BASE}/`) {
  console.log('FAIL: heart unclick navigated away');
}
if (pressedAfterFirst === pressedAfterSecond) {
  console.log('FAIL: heart state did not toggle');
}

await firstCard.locator('h3').click();
await page.waitForURL('**/product/**');
console.log('CARD body click navigates to detail: OK');

await page.goto(`${BASE}/compare`, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
console.log('NATIVE SELECTS:', await page.locator('select').count());

const combo = page.getByRole('combobox').first();
await combo.click();
await page.waitForTimeout(350);
const listbox = page.getByRole('listbox');
console.log('DROPDOWN visible:', await listbox.isVisible());
console.log('DROPDOWN options:', await page.getByRole('option').count());
await page.screenshot({ path: `${OUT}\\compare-dropdown.png` });

await page.getByRole('option', { name: /vivo X100/ }).click();
await page.waitForTimeout(400);
console.log('DROPDOWN selected:', (await combo.innerText()).replace(/\n/g, ' | '));
console.log('URL after select:', page.url());
console.log('FIRST COLUMN heading:', await page.locator('p.text-white.font-bold.text-sm').first().innerText());
await page.screenshot({ path: `${OUT}\\compare-after-select.png`, fullPage: true });

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}\\home-hero.png`, clip: { x: 0, y: 0, width: 1440, height: 900 } });

const mobile = await browser.newPage({ viewport: { width: 390, height: 1000 } });
await mobile.goto(BASE, { waitUntil: 'domcontentloaded' });
await mobile.waitForTimeout(1000);
await mobile.locator('div[style*="perspective"]').first().hover();
await mobile.getByRole('button', { name: 'Handphone berikutnya' }).click();
await mobile.waitForTimeout(1300);
const mobileImage = mobile.locator('section img').first();
console.log(
  'MOBILE hero image:',
  await mobileImage.evaluate((img) => ({
    src: img.getAttribute('src'),
    complete: img.complete,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    opacity: getComputedStyle(img).opacity,
    filter: getComputedStyle(img).filter,
    display: getComputedStyle(img).display,
    box: img.getBoundingClientRect().toJSON(),
  }))
);
await mobile.screenshot({ path: `${OUT}\\mobile-hero.png` });
await mobile.screenshot({ path: `${OUT}\\mobile-hero-noanim.png`, animations: 'disabled' });

console.log('BROWSER ERRORS:', errors.length ? errors : 'none');

await Promise.race([
  browser.close().catch(() => {}),
  new Promise((resolve) => setTimeout(resolve, 4000)),
]);
process.exit(0);
