import express from 'express';
import { db } from '../db/db.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET pengaturan toko (publik, dipakai storefront)
router.get('/', async (req, res) => {
  try {
    res.json({ success: true, data: await db.getSettings() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT pengaturan toko (admin)
router.put('/', authenticateAdmin, async (req, res) => {
  try {
    const current = await db.getSettings();
    const { storeName, tagline, address, phone, currency, activeWhatsApp } = req.body;

    if (storeName !== undefined && !String(storeName).trim()) {
      return res.status(400).json({ success: false, message: 'Nama toko wajib diisi' });
    }

    const updated = await db.updateSettings({
      storeName: storeName !== undefined ? String(storeName).trim() : current.storeName,
      tagline: tagline !== undefined ? String(tagline).trim() : current.tagline,
      address: address !== undefined ? String(address).trim() : current.address,
      phone: phone !== undefined ? String(phone).replace(/[^0-9+]/g, '') : current.phone,
      currency: currency !== undefined ? String(currency).trim() : current.currency,
      activeWhatsApp:
        activeWhatsApp !== undefined
          ? activeWhatsApp === true || activeWhatsApp === 'true'
          : current.activeWhatsApp,
    });

    return res.json({
      success: true,
      data: updated,
      message: 'Pengaturan toko berhasil disimpan',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
