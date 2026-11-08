import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../db/db.js';
import { authenticateAdmin } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `product-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpe?g|png|webp|gif)$/i;
    if (!file.mimetype?.startsWith('image/') || !allowed.test(file.originalname)) {
      const error = new Error('Format gambar harus JPG, PNG, WEBP, atau GIF.');
      error.status = 400;
      return cb(error);
    }
    return cb(null, true);
  },
});

const router = express.Router();

function parseImage(req) {
  if (req.file) return `/uploads/${req.file.filename}`;
  if (typeof req.body.imageurl === 'string' && req.body.imageurl.trim()) {
    return req.body.imageurl.trim();
  }
  return undefined;
}

function removeUploadedFile(file) {
  if (!file?.path) return;
  fs.promises.unlink(file.path).catch(() => {});
}

function removeStoredImage(imagePath) {
  if (typeof imagePath !== 'string' || !imagePath.startsWith('/uploads/')) return;
  const filePath = path.join(uploadDir, path.basename(imagePath));
  fs.promises.unlink(filePath).catch(() => {});
}

async function validateProductPayload(body, { partial = false } = {}) {
  const errors = [];

  if (!partial || body.name !== undefined) {
    if (!String(body.name || '').trim()) errors.push('Nama produk wajib diisi.');
  }

  if (!partial || body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      errors.push('Harga harus berupa angka 0 atau lebih.');
    }
  }

  if (!partial || body.categoryId !== undefined) {
    if (!body.categoryId) {
      errors.push('Kategori produk wajib dipilih.');
    } else if (!(await db.getCategoryById(body.categoryId))) {
      errors.push('Kategori produk tidak ditemukan.');
    }
  }

  if (body.stockStatus !== undefined) {
    if (!['Tersedia', 'Habis'].includes(String(body.stockStatus))) {
      errors.push('Status stok harus "Tersedia" atau "Habis".');
    }
  }

  return errors;
}

// GET semua produk (publik)
router.get('/', async (req, res) => {
  try {
    const { categoryId, brand, search, stockStatus } = req.query;
    const products = await db.getProducts({ categoryId, brand, search, stockStatus });
    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET detail produk (publik)
router.get('/:id', async (req, res) => {
  try {
    const product = await db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.json({ success: true, data: product });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST produk baru (admin)
router.post('/', authenticateAdmin, upload.single('image'), async (req, res) => {
  try {
    const errors = await validateProductPayload(req.body);
    if (errors.length) {
      removeUploadedFile(req.file);
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    const image = parseImage(req);
    const newProduct = await db.addProduct({
      ...req.body,
      name: String(req.body.name).trim(),
      price: Number(req.body.price),
      stockStatus: req.body.stockStatus || 'Tersedia',
      description: req.body.description || '',
      image: image || '',
    });

    return res.status(201).json({
      success: true,
      data: newProduct,
      message: 'Product added successfully',
    });
  } catch (err) {
    removeUploadedFile(req.file);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update produk (admin)
router.put('/:id', authenticateAdmin, upload.single('image'), async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await db.getProductById(id);
    if (!existing) {
      removeUploadedFile(req.file);
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const errors = await validateProductPayload(req.body, { partial: true });
    if (errors.length) {
      removeUploadedFile(req.file);
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    const payload = {};
    const fields = [
      'name', 'brand', 'tag', 'featured', 'price', 'originalPrice', 'stock',
      'stockStatus', 'badges', 'variants', 'categoryId', 'description',
      'releaseYear', 'isNew', 'performanceScore', 'cameraScore',
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) payload[field] = req.body[field];
    }

    if (payload.price !== undefined) payload.price = Number(payload.price);
    if (payload.name !== undefined) payload.name = String(payload.name).trim();
    if (payload.stock !== undefined) payload.stock = Number(payload.stock);
    if (payload.originalPrice !== undefined) {
      payload.originalPrice =
        payload.originalPrice === '' || payload.originalPrice === 'null'
          ? null
          : Number(payload.originalPrice);
    }

    for (const field of ['colors', 'colorNames', 'specs', 'highlights']) {
      if (req.body[field] !== undefined) payload[field] = req.body[field];
    }

    const image = parseImage(req);
    if (image !== undefined) payload.image = image;

    const updated = await db.updateProduct(id, payload);
    if (image && image !== existing.image) removeStoredImage(existing.image);

    return res.json({ success: true, data: updated, message: 'Product updated successfully' });
  } catch (err) {
    removeUploadedFile(req.file);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH toggle status stok (admin)
router.patch('/:id', authenticateAdmin, async (req, res) => {
  try {
    const updated = await db.toggleStock(req.params.id);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.json({
      success: true,
      data: updated,
      message: `Product stock status updated to ${updated.stockStatus}`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE produk (admin)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const existing = await db.getProductById(req.params.id);
    const deleted = await db.deleteProduct(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    removeStoredImage(existing?.image);
    return res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
