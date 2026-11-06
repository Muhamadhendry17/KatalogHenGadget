import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Muat .env dari folder server, tidak bergantung pada direktori kerja.
dotenv.config({ path: path.resolve(__dirname, '../.env') });
