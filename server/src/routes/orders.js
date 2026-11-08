import express from 'express';
import { db } from '../db/db.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  DELIVERY_METHODS,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  isValidMethodPair,
} from '../domain/order.js';

const router = express.Router();

function errorStatus(err) {
  const status = Number(err?.status);
  return status >= 400 && status < 600 ? status : 500;
}

// GET semua pesanan (admin) atau pesanan milik akun yang login
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, accountId } = req.query;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && accountId && accountId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Tidak dapat melihat pesanan milik orang lain.',
      });
    }

    const orders = await db.getOrders({
      accountId: isAdmin ? accountId : req.user.id,
      status,
    });

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db.getOrderItems(order.id);
        return { ...order, items };
      }),
    );

    return res.json({ success: true, count: ordersWithItems.length, data: ordersWithItems });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET detail pesanan (admin atau pemilik pesanan)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const order = await db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    if (!isAdmin && order.accountId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Bukan pesanan Anda.',
      });
    }

    const items = await db.getOrderItems(req.params.id);
    const addresses = await db.getAddresses(order.accountId);

    return res.json({
      success: true,
      data: { ...order, items, addresses },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST buat pesanan baru (pelanggan)
router.post('/', authenticateToken, async (req, res) => {
  const { paymentMethod, deliveryMethod, catatan, items, addressId } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Item pesanan wajib diisi.',
    });
  }

  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      message: 'Metode pembayaran harus "transfer" atau "cod".',
    });
  }

  if (!DELIVERY_METHODS.includes(deliveryMethod)) {
    return res.status(400).json({
      success: false,
      message: 'Metode pengiriman harus "cod_sukabumi" atau "logistik_paket".',
    });
  }

  if (!isValidMethodPair(paymentMethod, deliveryMethod)) {
    return res.status(400).json({
      success: false,
      message:
        paymentMethod === 'cod'
          ? 'COD hanya tersedia untuk pengiriman COD Sukabumi.'
          : 'Pembayaran transfer digunakan untuk pengiriman logistik paket.',
    });
  }

  if (!addressId) {
    return res.status(400).json({
      success: false,
      message: 'Alamat pengiriman wajib dipilih.',
    });
  }

  try {
    const order = await db.createOrder({
      accountId: req.user.id,
      addressId,
      paymentMethod,
      deliveryMethod,
      catatan: String(catatan || '').trim(),
      items: items.map((item) => ({
        productId: item.productId,
        varian: String(item.varian || '').trim(),
        qty: item.qty,
      })),
    });

    return res.status(201).json({
      success: true,
      data: order,
      message: 'Pesanan berhasil dibuat.',
    });
  } catch (err) {
    return res.status(errorStatus(err)).json({ success: false, message: err.message });
  }
});

// PATCH update status pesanan (admin only)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  const { status } = req.body;
  const isAdmin = req.user.role === 'admin';

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Hanya admin yang dapat mengubah status pesanan.',
    });
  }

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Status wajib diisi.',
    });
  }

  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status harus salah satu dari: ${ORDER_STATUSES.join(', ')}.`,
    });
  }

  try {
    const order = await db.updateOrderStatus(req.params.id, status, { role: 'admin' });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    return res.json({
      success: true,
      data: order,
      message: `Status pesanan diperbarui menjadi ${status}.`,
    });
  } catch (err) {
    return res.status(errorStatus(err)).json({ success: false, message: err.message });
  }
});

// PATCH batalkan pesanan (pelanggan pemilik pesanan; admin boleh via status)
router.patch('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const accountId = req.user.role === 'admin' ? null : req.user.id;
    const order = await db.cancelOrder(req.params.id, accountId);

    if (order?.notFound) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }
    if (order?.forbidden) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Bukan pesanan Anda.',
      });
    }

    return res.json({
      success: true,
      data: order,
      message: 'Pesanan berhasil dibatalkan dan stok dikembalikan.',
    });
  } catch (err) {
    return res.status(errorStatus(err)).json({ success: false, message: err.message });
  }
});

// DELETE pesanan (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  const isAdmin = req.user.role === 'admin';

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Hanya admin yang dapat menghapus pesanan.',
    });
  }

  try {
    const deleted = await db.deleteOrder(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
    }

    return res.json({ success: true, message: 'Pesanan berhasil dihapus.' });
  } catch (err) {
    return res.status(errorStatus(err)).json({ success: false, message: err.message });
  }
});

export default router;
