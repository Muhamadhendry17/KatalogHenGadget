import express from 'express';
import crypto from 'crypto';
import pool from '../db/mysql.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 jam
const STATUSES = ['pending', 'diproses', 'selesai', 'ditolak'];

const hashResetToken = (token) =>
  crypto.createHash('sha256').update(String(token)).digest('hex');

const mapRequest = (row) => ({
  id: row.id,
  accountId: row.account_id,
  accountName: row.account_name,
  accountEmail: row.account_email,
  email: row.email,
  phone: row.phone || '',
  status: row.status,
  requestedAt: row.created_at,
  updatedAt: row.updated_at,
  handledAt: row.handled_at,
});

function clientBaseUrl(req) {
  return (
    req.get('origin') ||
    process.env.CLIENT_URL ||
    'http://localhost:5173'
  ).replace(/\/+$/, '');
}

router.use(authenticateToken, requireAdmin);

// Daftar permintaan reset kata sandi.
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const useFilter = STATUSES.includes(status);
    const [rows] = await pool.execute(
      `SELECT r.*, a.name AS account_name, a.email AS account_email
       FROM password_reset_requests r
       JOIN accounts a ON a.id = r.account_id
       ${useFilter ? 'WHERE r.status = ?' : ''}
       ORDER BY FIELD(r.status, 'pending', 'diproses', 'selesai', 'ditolak'),
                r.created_at DESC`,
      useFilter ? [status] : [],
    );

    return res.json({
      success: true,
      count: rows.length,
      data: rows.map(mapRequest),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

// Buat tautan reset baru untuk permintaan tertentu.
router.post('/:id/link', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM password_reset_requests WHERE id = ? LIMIT 1`,
      [req.params.id],
    );
    const request = rows[0];

    if (!request) {
      return res.status(404).json({ success: false, message: 'Permintaan tidak ditemukan.' });
    }

    if (request.status === 'selesai') {
      return res.status(400).json({
        success: false,
        message: 'Permintaan ini sudah selesai. Customer sudah mengganti kata sandinya.',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    // Tautan lama otomatis tidak berlaku.
    await pool.execute(
      `UPDATE password_reset_tokens SET used = 1 WHERE account_id = ? AND used = 0`,
      [request.account_id],
    );

    await pool.execute(
      `INSERT INTO password_reset_tokens (id, account_id, token, expires_at)
       VALUES (?, ?, ?, ?)`,
      [`reset_${crypto.randomUUID()}`, request.account_id, hashResetToken(token), expiresAt],
    );

    await pool.execute(
      `UPDATE password_reset_requests
       SET status = 'diproses', handled_by = ?, handled_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [req.user.id, request.id],
    );

    const link = `${clientBaseUrl(req)}/reset-password?token=${encodeURIComponent(token)}`;

    return res.json({
      success: true,
      message: 'Tautan reset dibuat. Kirim tautan ini ke customer via WhatsApp.',
      data: {
        requestId: request.id,
        link,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

// Tolak permintaan reset.
router.post('/:id/reject', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM password_reset_requests WHERE id = ? LIMIT 1`,
      [req.params.id],
    );
    const request = rows[0];

    if (!request) {
      return res.status(404).json({ success: false, message: 'Permintaan tidak ditemukan.' });
    }

    if (request.status === 'selesai') {
      return res.status(400).json({
        success: false,
        message: 'Permintaan sudah selesai dan tidak bisa ditolak.',
      });
    }

    await pool.execute(
      `UPDATE password_reset_tokens SET used = 1 WHERE account_id = ? AND used = 0`,
      [request.account_id],
    );

    await pool.execute(
      `UPDATE password_reset_requests
       SET status = 'ditolak', handled_by = ?, handled_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [req.user.id, request.id],
    );

    return res.json({ success: true, message: 'Permintaan reset ditolak.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

export default router;
