import './env.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import productRoutes from './routes/product.js';
import storeRoutes from './routes/store.js';
import figmaRoutes from './routes/figma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = (
  process.env.CORS_ORIGIN ||
  'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');

// Middleware keamanan dasar.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Middleware
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

const uploadsPath = path.join(__dirname, '../uploads');
const figmaAssetsPath = path.join(__dirname, '../assets/figma');

// Serve uploaded product images and Figma exported assets statically
app.use('/uploads', express.static(uploadsPath));
app.use('/assets/figma', express.static(figmaAssetsPath));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/figma', figmaRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'katalogWa API SERVER',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to KatalogWA API SERVER',
    endpoints: {
      auth: '/api/auth',
      categories: '/api/categories',
      products: '/api/products',
      store: '/api/store',
      health: '/api/health',
    },
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// Error handler (termasuk error multer)
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.name === 'MulterError' ? 400 : error.status || 500;
  res.status(status).json({
    success: false,
    message: error.message || 'Terjadi kesalahan pada server',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`KatalogWA API Server running on http://localhost:${PORT}`);
});
