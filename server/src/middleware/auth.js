import jwt from 'jsonwebtoken';
import { db } from '../db/db.js';

const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error('JWT_SECRET wajib diisi di server/.env (lihat server/.env.example).');
}

export const JWT_SECRET = secret;

export const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '').trim();

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

export const requireAdmin = async (req, res, next) => {
  try {
    const account = await db.getAdminById(req.user?.id);
    const isActiveAdmin = account?.role === 'admin';

    if (req.user?.role !== 'admin' || !isActiveAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Halaman ini hanya untuk admin.',
      });
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

export const authenticateAdmin = [authenticateToken, requireAdmin];
