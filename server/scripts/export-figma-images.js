import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const TOKEN = process.env.FIGMA_PERSONAL_ACCESS_TOKEN;
const FILE_ID = process.env.FIGMA_FILE_ID;

if (!TOKEN || !FILE_ID) {
  console.error('❌ FIGMA_PERSONAL_ACCESS_TOKEN atau FIGMA_FILE_ID belum diisi di server/.env');
  process.exit(1);
}

const BASE_URL = 'https://api.figma.com/v1';
const ASSETS_DIR = path.resolve('assets/figma');
const headers = { 'X-Figma-Token': TOKEN };

fs.mkdirSync(ASSETS_DIR, { recursive: true });

// Node ID dari file Figma Anda (Foto handphone pada setiap kartu produk)
const IMAGE_NODES = {
  'samsung-galaxy-s24-ultra': '4:3279',
  'apple-iphone-15': '4:3312',
  'redmi-note-13-pro-5g': '4:3345',
  'vivo-30': '4:3378',
  // Hero image
  'hero-galaxy-s24': '4:3209',
  // Promo image
  'promo-redmi': '4:3424',
};

async function fetchJson(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Figma API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function exportImages() {
  const nodeIds = Object.values(IMAGE_NODES).join(',');
  const url = `${BASE_URL}/images/${FILE_ID}?ids=${encodeURIComponent(nodeIds)}&scale=2&format=png`;
  const data = await fetchJson(url);
  const images = data.images || {};

  const manifest = { fileId: FILE_ID, exportedAt: new Date().toISOString(), images: {} };

  for (const [key, nodeId] of Object.entries(IMAGE_NODES)) {
    const imageUrl = images[nodeId];
    if (!imageUrl) {
      console.warn(`⚠️  Tidak ada gambar untuk node ${nodeId} (${key})`);
      continue;
    }

    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`Gagal unduh ${key}: ${res.status}`);
    const buffer = await res.arrayBuffer();

    const fileName = `${key}.png`;
    const filePath = path.join(ASSETS_DIR, fileName);
    fs.writeFileSync(filePath, Buffer.from(buffer));

    manifest.images[key] = { nodeId, fileName, localPath: `assets/figma/${fileName}` };
    console.log(`✅ ${key} (${nodeId}) → ${fileName}`);
  }

  fs.writeFileSync(path.join(ASSETS_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\n🎉 Selesai! ${Object.keys(manifest.images).length} gambar diekspor ke ${ASSETS_DIR}`);
}

exportImages().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});