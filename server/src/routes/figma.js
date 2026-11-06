import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const ASSETS_DIR = path.resolve(__dirname, '../../assets/figma');
const MANIFEST_PATH = path.join(ASSETS_DIR, 'manifest.json');

router.get('/assets', (_req, res) => {
  try {
    if (!fs.existsSync(MANIFEST_PATH)) {
      return res.status(404).json({ error: 'Belum ada aset Figma. Jalankan export dulu.' });
    }
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    res.json({ success: true, fileId: manifest.fileId, total: manifest.components.length, components: manifest.components });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/assets/:fileName', (req, res) => {
  const filePath = path.resolve(ASSETS_DIR, req.params.fileName);

  // Tolak path traversal: berkas harus benar-benar di dalam ASSETS_DIR.
  if (filePath !== ASSETS_DIR && !filePath.startsWith(ASSETS_DIR + path.sep)) {
    return res.status(400).json({ error: 'Nama berkas tidak valid.' });
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return res.status(404).json({ error: 'File tidak ditemukan.' });
  }

  return res.sendFile(filePath, { dotfiles: 'deny' });
});

export default router;