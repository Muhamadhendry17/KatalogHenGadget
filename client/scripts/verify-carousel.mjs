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

const errors = [];
const log = (...args) => console.log(...args);

async function setup(viewport) {
  const page = await browser.newPage({ viewport });
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`CONSOLE: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`PAGEERROR: ${error.message}`));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  return page;
}

const regionSel = '[aria-label="Daftar handphone pilihan, geser ke kiri atau kanan"]';

// ---------- Desktop ----------
const desktop = await setup({ width: 1440, height: 1100 });
const section = desktop.locator('section', { has: desktop.getByRole('heading', { name: 'Temukan favorit baru.' }) });
await section.scrollIntoViewIfNeeded();
await desktop.waitForTimeout(400);

const metrics = await desktop.locator(regionSel).evaluate((el) => ({
  clientWidth: el.clientWidth,
  scrollWidth: el.scrollWidth,
  scrollLeft: el.scrollLeft,
  cards: el.querySelectorAll('[data-carousel-item]').length,
  cardWidth: el.querySelector('[data-carousel-item]').getBoundingClientRect().width,
  pageOverflow: document.documentElement.scrollWidth > window.innerWidth,
}));
log('DESKTOP metrics:', metrics);
log('DESKTOP right arrow enabled:', await desktop.getByRole('button', { name: 'Geser handphone ke kanan' }).isEnabled());
log('DESKTOP left arrow enabled:', await desktop.getByRole('button', { name: 'Geser handphone ke kiri' }).isEnabled());
await section.screenshot({ path: `${OUT}\\carousel-desktop-start.png` });

await desktop.getByRole('button', { name: 'Geser handphone ke kanan' }).click();
await desktop.waitForTimeout(900);
const afterNext = await desktop.locator(regionSel).evaluate((el) => el.scrollLeft);
log('DESKTOP scrollLeft after next:', afterNext);
await section.screenshot({ path: `${OUT}\\carousel-desktop-next.png` });

await desktop.getByRole('button', { name: 'Geser handphone ke kiri' }).click();
await desktop.waitForTimeout(900);
log('DESKTOP scrollLeft after prev:', await desktop.locator(regionSel).evaluate((el) => el.scrollLeft));

// keyboard arrows
await desktop.locator(regionSel).focus();
await desktop.keyboard.press('ArrowRight');
await desktop.waitForTimeout(700);
log('DESKTOP scrollLeft after keydown right:', await desktop.locator(regionSel).evaluate((el) => el.scrollLeft));

// filter resets scroll to start
await desktop.getByRole('button', { name: /^Kamera unggul/ }).click();
await desktop.waitForTimeout(900);
log('DESKTOP after filter cards:', await desktop.locator(`${regionSel} [data-carousel-item]`).count());
log('DESKTOP after filter scrollLeft:', await desktop.locator(regionSel).evaluate((el) => el.scrollLeft));
await section.screenshot({ path: `${OUT}\\carousel-desktop-filter.png` });

// first card detail link exists inside carousel
const firstHref = await desktop.locator(`${regionSel} article a`).first().getAttribute('href');
log('DESKTOP first card href:', firstHref);

await desktop.close();

// ---------- Mobile ----------
const mobile = await setup({ width: 390, height: 844 });
const mSection = mobile.locator('section', { has: mobile.getByRole('heading', { name: 'Temukan favorit baru.' }) });
await mSection.scrollIntoViewIfNeeded();
await mobile.waitForTimeout(400);
const mMetrics = await mobile.locator(regionSel).evaluate((el) => ({
  clientWidth: el.clientWidth,
  scrollWidth: el.scrollWidth,
  cards: el.querySelectorAll('[data-carousel-item]').length,
  cardWidth: el.querySelector('[data-carousel-item]').getBoundingClientRect().width,
  pageOverflow: document.documentElement.scrollWidth > window.innerWidth,
}));
log('MOBILE metrics:', mMetrics);
log('MOBILE hint visible:', await mobile.getByText(/Geser kartu ke samping/).isVisible());
log('MOBILE arrows hidden:', await mobile.getByRole('button', { name: 'Geser handphone ke kanan' }).isHidden());
await mSection.screenshot({ path: `${OUT}\\carousel-mobile-start.png` });

await mobile.locator(regionSel).evaluate((el) => el.scrollBy({ left: 340, behavior: 'instant' }));
await mobile.waitForTimeout(500);
log('MOBILE scrollLeft after swipe:', await mobile.locator(regionSel).evaluate((el) => el.scrollLeft));
await mSection.screenshot({ path: `${OUT}\\carousel-mobile-next.png` });

// filter resets scroll to start on mobile
await mobile.getByRole('button', { name: /^Kamera unggul/ }).click();
await mobile.waitForTimeout(900);
log('MOBILE after filter scrollLeft:', await mobile.locator(regionSel).evaluate((el) => el.scrollLeft));
log('MOBILE after filter cards:', await mobile.locator(`${regionSel} [data-carousel-item]`).count());

await mobile.close();

log('BROWSER ERRORS:', errors.length ? errors : 'none');
await browser.close();
process.exit(0);
