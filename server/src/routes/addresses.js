import express from 'express';
import { db } from '../db/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET alamat pelanggan yang login
router.get('/', authenticateToken, async (req, res) => {
  try {
    const addresses = await db.getAddresses(req.user.id);
    return res.json({ success: true, count: addresses.length, data: addresses });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST tambah alamat baru
router.post('/', authenticateToken, async (req, res) => {
  const { name, phone, address, city, province, postalCode, isDefault } = req.body;

  if (!name || !phone || !address) {
    return res.status(400).json({
      success: false,
      message: 'Nama, nomor telepon, dan alamat wajib diisi.',
    });
  }

  try {
    const addressList = await db.addAddress(req.user.id, {
      name,
      phone,
      address,
      city: city || 'Sukabumi',
      province: province || 'Jawa Barat',
      postalCode: postalCode || '',
      isDefault: Boolean(isDefault),
    });

    return res.status(201).json({
      success: true,
      data: addressList,
      message: 'Alamat berhasil ditambahkan.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH set alamat default
router.patch('/:id/default', authenticateToken, async (req, res) => {
  try {
    const ok = await db.setDefaultAddress(req.user.id, req.params.id);
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Alamat tidak ditemukan' });
    }
    return res.json({ success: true, message: 'Alamat default diperbarui.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE alamat
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const ok = await db.deleteAddress(req.user.id, req.params.id);
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Alamat tidak ditemukan' });
    }
    return res.json({ success: true, message: 'Alamat berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;