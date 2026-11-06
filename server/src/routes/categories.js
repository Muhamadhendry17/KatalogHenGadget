import express from 'express';
import { db } from '../db/db.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET semua kategori (publik)
router.get('/', async (req, res) => {
  try {
    res.json({ success: true, data: await db.getCategories() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST buat kategori (admin)
router.post('/', authenticateAdmin, async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) {
    return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
  }

  try {
    const categories = await db.getCategories();
    const existing = categories.find(
      (category) => category.name.toLowerCase() === name.toLowerCase(),
    );
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Kategori dengan nama tersebut sudah ada',
      });
    }

    const newCategory = await db.addCategory(name);
    return res.status(201).json({
      success: true,
      message: 'Kategori berhasil ditambahkan',
      data: newCategory,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update kategori (admin)
router.put('/:id', authenticateAdmin, async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) {
    return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
  }

  try {
    const categories = await db.getCategories();
    const duplicate = categories.find(
      (category) =>
        category.id !== req.params.id && category.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'Kategori dengan nama tersebut sudah ada',
      });
    }

    const updated = await db.updateCategory(req.params.id, name);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    return res.json({ success: true, data: updated, message: 'Kategori berhasil diperbarui' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE kategori (admin)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const products = await db.getProducts({ categoryId: id });

    if (products.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Tidak dapat menghapus kategori karena masih memiliki ${products.length} produk terkait. Hapus atau pindahkan produk terlebih dahulu.`,
      });
    }

    const deleted = await db.deleteCategory(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    return res.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
