import express from 'express';
import cors from 'cors';
import path from 'path';
import {fileURLToPath} from 'url';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';

import productRoutes from './routes/products.js';
import storeRoutes from './routes/store.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE','OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({extended: true}));

const uploadsPath = path.join(__dirname, '../uploads')

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/store', storeRoutes);

app.get('/api/health', (req,res) => {
    res.json({
        status: 'ok',
        app:'katalogWa API SERVER',
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to KatalogWA API SEERVER', endpoints: {
            auth: '/api/auth',
            categories: '/api/categories',
            products: '/api/products',
            store: '/api/store',
            health: '/api/health'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`KatalogWA API Server running on http://localhost:${PORT}`);
});