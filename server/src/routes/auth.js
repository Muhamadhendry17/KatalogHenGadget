import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../db/db.js';
import { authenticateToken, JWT_SECRET } from '../middleware/authMiddleware.js';

const router = express.Router();

// Gw Login
router.post('/login', (req,res) => {
    const {email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email & Password wajib diisi"
        });
    }

const isMatch = bcrypt.compareSync(password, admin.password);
if (!isMatch) {
    return res.status(401).json({
        success: false,
        message: "Email atau Password salah"
    });
}

const token = jwt.sign(
    {id: admin.id, email: admin.email, name: admin.name},
    JWT_SECRET,
    {expiresIn: '24h'}
);

return res.json({
    success: true,
    message: "Login berhasil",
    token,
    user: {
        id: admin.id,
        email: admin.email,
        name: admin.email
      }
    });
});

router.get('/me', authenticateToken, (req, res) => {
    const admin = db.getAdmin();
    res.json({
        success: true,
        user: {
            id: admin.id,
            email: admin.email,
            name: admin.name
        }
    });
});

export default router;