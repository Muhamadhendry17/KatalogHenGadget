import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/db.js';
import { authenticateToken, JWT_SECRET } from '../middleware/auth.js';
import { clearLoginAttempts, loginRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const roleOf = (account) => (account.role === 'admin' ? 'admin' : 'customer');

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

router.put('/password', authenticateToken, async (req, res) => {
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

export default router;
