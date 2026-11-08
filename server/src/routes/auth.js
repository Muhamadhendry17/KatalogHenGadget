import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db/db.js';
import pool from '../db/mysql.js';
import { authenticateToken, JWT_SECRET } from '../middleware/auth.js';
import {
  clearLoginAttempts,
  forgotPasswordRateLimit,
  loginRateLimit,
  resetPasswordRateLimit,
} from '../middleware/rateLimit.js';

const router = express.Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const roleOf = (account) => (account.role === 'admin' ? 'admin' : 'customer');

const hashResetToken = (token) =>
  crypto.createHash('sha256').update(String(token)).digest('hex');

// Nomor WhatsApp diambil dari alamat terbaru, lalu dari pesanan terakhir.
async function findContactPhone(accountId) {
  const [addressRows] = await pool.execute(
    `SELECT phone FROM addresses
     WHERE account_id = ? AND phone IS NOT NULL AND TRIM(phone) <> ''
     ORDER BY is_default DESC, created_at DESC
     LIMIT 1`,
    [accountId],
  );
  if (addressRows[0]?.phone) return String(addressRows[0].phone).trim();

  const [orderRows] = await pool.execute(
    `SELECT recipient_phone FROM orders
     WHERE account_id = ? AND recipient_phone IS NOT NULL AND TRIM(recipient_phone) <> ''
     ORDER BY created_at DESC
     LIMIT 1`,
    [accountId],
  );
  return orderRows[0]?.recipient_phone
    ? String(orderRows[0].recipient_phone).trim()
    : null;
}

const FORGOT_MESSAGE =
  'Jika email terdaftar, permintaan reset telah dikirim ke admin. Admin akan menghubungi Anda via WhatsApp.';

const toPublicUser = (account) => ({
  id: account.id,
  email: account.email,
  name: account.name,
  role: roleOf(account),
});

const signToken = (account) =>
  jwt.sign(
    {
      id: account.id,
      email: account.email,
      name: account.name,
      role: roleOf(account),
    },
    JWT_SECRET,
    { expiresIn: '24h' },
  );

// Login
router.post('/login', loginRateLimit, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email & Password wajib diisi',
    });
  }

  try {
    const account = await db.getAdminByEmail(email);
    if (!account) {
      return res.status(401).json({ success: false, message: 'Email atau Password salah' });
    }

    const isMatch = bcrypt.compareSync(password, account.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email atau Password salah' });
    }

    clearLoginAttempts(req);

    return res.json({
      success: true,
      message: 'Login berhasil',
      token: signToken(account),
      user: toPublicUser(account),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

// Registrasi publik selalu membuat akun customer, bukan admin.
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Nama, Email & Password wajib diisi',
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const trimmedName = String(name).trim();

  if (!trimmedName) {
    return res.status(400).json({ success: false, message: 'Nama wajib diisi' });
  }

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return res.status(400).json({ success: false, message: 'Format email tidak valid' });
  }

  if (String(password).length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Password minimal ${MIN_PASSWORD_LENGTH} karakter`,
    });
  }

  try {
    const existing = await db.getAdminByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const account = await db.addAdmin({
      name: trimmedName,
      email: normalizedEmail,
      password,
      role: 'customer',
    });

    return res.status(201).json({
      success: true,
      message: 'Pendaftaran berhasil',
      token: signToken(account),
      user: toPublicUser(account),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal mendaftar' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const account = await db.getAdminById(req.user.id);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Akun tidak ditemukan' });
    }
    return res.json({ success: true, user: toPublicUser(account) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

router.put('/password', resetPasswordRateLimit, authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Password saat ini dan password baru wajib diisi',
    });
  }

  if (String(newPassword).length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Password baru minimal ${MIN_PASSWORD_LENGTH} karakter`,
    });
  }

  if (String(currentPassword) === String(newPassword)) {
    return res.status(400).json({
      success: false,
      message: 'Password baru harus berbeda dari password saat ini',
    });
  }

  try {
    const account = await db.getAdminById(req.user.id);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Akun tidak ditemukan' });
    }

    if (!bcrypt.compareSync(currentPassword, account.password)) {
      return res.status(401).json({ success: false, message: 'Password saat ini salah' });
    }

    await db.updateAccountPassword(account.id, bcrypt.hashSync(String(newPassword), 10));

    return res.json({
      success: true,
      message: 'Password berhasil diubah. Gunakan password baru pada login berikutnya.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

// Lupa kata sandi: catat permintaan untuk dibantu admin via WhatsApp.
// Tidak ada token yang dikembalikan ke browser.
router.post('/forgot-password', forgotPasswordRateLimit, async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail || !EMAIL_PATTERN.test(normalizedEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Format email tidak valid.',
    });
  }

  try {
    const account = await db.getAdminByEmail(normalizedEmail);
    if (!account) {
      // Jangan mengungkapkan apakah email terdaftar (keamanan).
      return res.json({ success: true, message: FORGOT_MESSAGE });
    }

    const phone = await findContactPhone(account.id);

    // Satu permintaan aktif per akun agar daftar admin tidak menumpuk.
    const [existingRows] = await pool.execute(
      `SELECT id FROM password_reset_requests
       WHERE account_id = ? AND status = 'pending'
       LIMIT 1`,
      [account.id],
    );

    if (existingRows[0]) {
      await pool.execute(
        `UPDATE password_reset_requests
         SET email = ?, phone = ?, created_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [normalizedEmail, phone, existingRows[0].id],
      );
    } else {
      await pool.execute(
        `INSERT INTO password_reset_requests (id, account_id, email, phone)
         VALUES (?, ?, ?, ?)`,
        [`resetreq_${crypto.randomUUID()}`, account.id, normalizedEmail, phone],
      );
    }

    return res.json({ success: true, message: FORGOT_MESSAGE });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

// Validasi tautan reset sebelum form kata sandi baru ditampilkan.
router.get('/reset-password/validate', resetPasswordRateLimit, async (req, res) => {
  const token = String(req.query.token || '').trim();
  if (!token) {
    return res.status(400).json({ success: false, message: 'Tautan reset tidak lengkap.' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT expires_at FROM password_reset_tokens
       WHERE token = ? AND used = 0 AND expires_at > NOW()
       LIMIT 1`,
      [hashResetToken(token)],
    );

    if (!rows[0]) {
      return res.status(400).json({
        success: false,
        message: 'Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru ke admin.',
      });
    }

    return res.json({ success: true, expiresAt: rows[0].expires_at });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

// Reset kata sandi dengan token yang valid.
router.post('/reset-password', resetPasswordRateLimit, async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Tautan reset dan password baru wajib diisi.',
    });
  }

  if (String(newPassword).length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({
      success: false,
      message: `Password baru minimal ${MIN_PASSWORD_LENGTH} karakter`,
    });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT * FROM password_reset_tokens
       WHERE token = ? AND used = 0 AND expires_at > NOW()
       LIMIT 1`,
      [hashResetToken(token)],
    );

    if (!rows[0]) {
      return res.status(400).json({
        success: false,
        message: 'Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru ke admin.',
      });
    }

    const reset = rows[0];
    const hashedPassword = bcrypt.hashSync(String(newPassword), 10);

    await db.updateAccountPassword(reset.account_id, hashedPassword);

    await pool.execute(
      `UPDATE password_reset_tokens SET used = 1 WHERE account_id = ?`,
      [reset.account_id],
    );

    await pool.execute(
      `UPDATE password_reset_requests
       SET status = 'selesai', handled_at = COALESCE(handled_at, NOW()), updated_at = NOW()
       WHERE account_id = ? AND status IN ('pending', 'diproses')`,
      [reset.account_id],
    );

    return res.json({
      success: true,
      message: 'Kata sandi berhasil direset. Silakan masuk dengan password baru.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

export default router;
