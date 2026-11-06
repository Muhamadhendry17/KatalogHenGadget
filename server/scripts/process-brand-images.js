import sharp from 'sharp';
import path from 'path';

const ASSETS = path.resolve('assets/figma');

const SOURCES = [
  { input: 'realme-12-pro-plus-5g.jpg', output: 'realme-12-pro-plus-5g.png' },
  { input: 'oppo-reno12-5g.jpg', output: 'oppo-reno12-5g.png' },
  { input: 'samsung-galaxy-a55-5g.jpg', output: 'samsung-galaxy-a55-5g.png' },
  { input: 'apple-iphone-16.jpg', output: 'apple-iphone-16.png' },
  { input: 'xiaomi-14t-pro.jpg', output: 'xiaomi-14t-pro.png' },
  { input: 'oppo-find-x8.jpg', output: 'oppo-find-x8.png' },
  { input: 'vivo-x100.jpg', output: 'vivo-x100.png' },
  { input: 'samsung-galaxy-z-flip6.jpg', output: 'samsung-galaxy-z-flip6.png' },
  { input: 'apple-iphone-16-pro-max.jpg', output: 'apple-iphone-16-pro-max.png' },
  { input: 'vivo-v40.jpg', output: 'vivo-v40.png' },
  { input: 'realme-13-pro-plus.jpg', output: 'realme-13-pro-plus.png' },
  { input: 'apple-iphone-17-pro-max.jpg', output: 'apple-iphone-17-pro-max.png' },
  { input: 'vivo-v30.jpg', output: 'vivo-30.png' },
];

const W = 632;
const H = 516;

const background = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#eef1f3"/>
      <stop offset="0.55" stop-color="#dfe3e6"/>
      <stop offset="1" stop-color="#c6cbd0"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.55">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="0.65" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="16"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <ellipse cx="${W / 2}" cy="${H * 0.44}" rx="${W * 0.44}" ry="${H * 0.55}" fill="url(#glow)"/>
  <ellipse cx="${W / 2}" cy="${H - 26}" rx="150" ry="20" fill="#1f2937" opacity="0.28" filter="url(#soft)"/>
</svg>`);

function featherMask(w, h) {
  const pad = 10;
  return Buffer.from(`
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="f" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="${pad}"/>
    </filter>
  </defs>
  <rect x="${pad}" y="${pad}" width="${w - pad * 2}" height="${h - pad * 2}" rx="26" fill="#fff" filter="url(#f)"/>
</svg>`);
}

function colorDistance(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// Remove a plain, light studio background (common in GSMArena renders) while
// keeping the phone, its edges, and any soft shadow.
async function removeLightBackground(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;

  const cornerSamples = [];
  const sampleCorner = (x0, y0) => {
    for (let y = y0; y < y0 + 6; y += 1) {
      for (let x = x0; x < x0 + 6; x += 1) {
        const i = (y * w + x) * 4;
        cornerSamples.push([data[i], data[i + 1], data[i + 2]]);
      }
    }
  };
  sampleCorner(0, 0);
  sampleCorner(w - 6, 0);
  sampleCorner(0, h - 6);
  sampleCorner(w - 6, h - 6);

  const avg = [0, 1, 2].map(
    (channel) => cornerSamples.reduce((sum, color) => sum + color[channel], 0) / cornerSamples.length
  );
  const spread = Math.max(...cornerSamples.map((color) => colorDistance(color, avg)));
  const isLightBackground = avg.every((channel) => channel > 232) && spread < 18;

  if (!isLightBackground) return buffer;

  const threshold = 26;
  const isBg = new Uint8Array(w * h);
  const stack = [];
  const tryPush = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (isBg[p]) return;
    const i = p * 4;
    if (colorDistance([data[i], data[i + 1], data[i + 2]], avg) < threshold) {
      isBg[p] = 1;
      stack.push(p);
    }
  };

  for (let x = 0; x < w; x += 1) {
    tryPush(x, 0);
    tryPush(x, h - 1);
  }
  for (let y = 0; y < h; y += 1) {
    tryPush(0, y);
    tryPush(w - 1, y);
  }
  while (stack.length) {
    const p = stack.pop();
    const x = p % w;
    const y = (p - x) / w;
    tryPush(x - 1, y);
    tryPush(x + 1, y);
    tryPush(x, y - 1);
    tryPush(x, y + 1);
  }

  let removed = 0;
  const out = Buffer.from(data);
  for (let p = 0; p < w * h; p += 1) {
    if (isBg[p]) {
      out[p * 4 + 3] = 0;
      removed += 1;
    }
  }
  if (removed / (w * h) < 0.01) return buffer;

  return sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer();
}

async function processImage({ input, output }) {
  const src = path.join(ASSETS, input);

  let phone = sharp(src).trim({ threshold: 12 });
  const meta = await phone.metadata();
  console.log(`  source ${meta.width}x${meta.height}`);

  const trimmed = await phone.png().toBuffer();
  const cleaned = await removeLightBackground(trimmed);

  phone = sharp(cleaned).resize({ height: H - 42, fit: 'inside', withoutEnlargement: false });
  const resized = await phone.toBuffer({ resolveWithObject: true });
  const { width: pw, height: ph } = resized.info;

  const mask = featherMask(pw, ph);
  const feathered = await sharp(resized.data)
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const left = Math.round((W - pw) / 2);
  const top = H - ph - 12;

  await sharp(background)
    .composite([{ input: feathered, left, top }])
    .png()
    .toFile(path.join(ASSETS, output));

  console.log(`  → ${output} (${pw}x${ph} placed at ${left},${top})`);
}

for (const item of SOURCES) {
  console.log(`Processing ${item.input}`);
  await processImage(item);
}
console.log('Done.');
