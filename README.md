# HenGadget — Katalog Handphone

Aplikasi katalog handphone (khusus smartphone) dengan pengalaman belanja modern:
filter yang benar-benar bekerja, perbandingan spesifikasi, varian storasi, keranjang,
checkout dengan alamat pengiriman, dan pengelolaan pesanan di dashboard admin.

## Fitur

- **Beranda** — hero modern dengan aurora, grid halus, tilt 3D, carousel otomatis,
  daftar produk horizontal yang bisa digeser, promo, artikel, dan footer.
- **Katalog handphone** — pencarian, filter merek, filter kebutuhan, dan pengurutan
  harga/tahun rilis. Kategori aktif hanya **Smartphone**.
- **HP budget Rp2–4 juta** — `Redmi 13`, `Infinix Note 40`, dan `Samsung Galaxy A15 4G`
  disiapkan untuk pasar Sukabumi.
- **Detail produk** — pemilih warna dan varian storasi (64/128/256 GB) yang
  memengaruhi harga dan stok, spesifikasi, skor performa/kamera, serta produk terkait.
- **Harga promo** — beberapa produk memiliki harga coret (`originalPrice`) yang
  ditampilkan dengan garis coret.
- **Badge produk** — `Best Seller`, `Baru`, dan `Promo` dapat diatur per produk.
- **Favorit** — tandai handphone dengan ikon hati; daftar favorit tersimpan di
  perangkat dan bisa dibuka kembali kapan saja di halaman **Favorit**.
- **Perbandingan** — bandingkan 2–3 handphone, termasuk RAM/penyimpanan, chipset
  (prosesor), kamera, varian & harga, serta stok.
- **Keranjang** — baris keranjang dipisahkan per produk + varian, jadi varian storasi
  yang berbeda tidak saling menimpa.
- **Checkout dengan alamat** — pelanggan wajib memilih/menambah alamat pengiriman.
  Pesanan disimpan ke server dengan total yang dihitung dari harga produk/varian.
- **Dua metode pesanan**
  - **COD Sukabumi** — pembayaran tunai saat admin/worker bertemu pelanggan.
  - **Logistik paket (luar kota)** — pembayaran transfer bank; pesanan diproses
    setelah pembayaran dikonfirmasi admin.
- **Lupa kata sandi** — permintaan token reset dari halaman login. Di mode
  pengembangan token dikembalikan API agar bisa langsung dipakai; di production
  token tidak boleh dikembalikan dan perlu layanan email.
- **Dashboard admin** (`/admin`) — ringkasan statistik, kelola produk, kategori,
  pesanan, dan pengaturan toko.
  - Kelola pesanan menampilkan data pelanggan, alamat lengkap, item, metode
    pembayaran/pengiriman, catatan, serta aksi status berikutnya.
  - Alur status: `pending → paid → diproses → dikirim → selesai`
    (COD dapat dikonfirmasi langsung ke `diproses`), atau `dibatalkan`.
- **Katalog berbasis API** — produk, kategori, dan pengaturan toko dibaca dari
  server. Jika API belum menyala, storefront memakai data statis sebagai fallback.

## Menjalankan

Butuh Node.js 20+ dan MySQL (XAMPP MySQL sudah didukung).

### 1. Siapkan MySQL

Jalankan MySQL dari XAMPP, lalu buat konfigurasi server:

```powershell
cd server
npm install
Copy-Item .env.example .env
# Edit .env: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, dan JWT_SECRET
```

### 2. Buat schema & isi data awal

```powershell
npm run migrate
```

Perintah ini membuat database `hengadget`, menjalankan `src/db/schema.sql`, dan
mengimpor katalog awal dari `src/db/data.json`.

> **Peringatan:** `npm run migrate` menghapus tabel produk, pesanan, alamat, dan
> token reset sebelum mengimpor ulang. Jalankan hanya saat inisialisasi atau saat
> memang ingin mengosongkan katalog/pesanan. Akun tidak dihapus.

Untuk database yang **sudah berisi data** dan hanya perlu skema terbaru (snapshot
pesanan, item pesanan tanpa rating, dll.), gunakan upgrade yang tidak menghapus data:

```powershell
npm run upgrade
```

Skrip ini idempotent dan aman dijalankan berulang kali.

### 3. Jalankan server

```powershell
npm run dev
# atau: node src/index.js
```

Server berjalan di `http://localhost:3000` (health check: `/api/health`).

### 4. Jalankan client

```powershell
cd ../client
npm install
npm run dev
```

Client berjalan di `http://localhost:5173` (Vite akan memakai port lain bila
5173 sedang dipakai).

## Alur pesanan

1. Pelanggan menambahkan produk/varian ke keranjang dan membuka checkout.
2. Pelanggan memilih/menambah alamat, lalu memilih metode:
   - **COD Sukabumi** → `paymentMethod: cod`, `deliveryMethod: cod_sukabumi`.
   - **Logistik paket** → `paymentMethod: transfer`, `deliveryMethod: logistik_paket`.
3. Server memvalidasi kombinasi metode, kepemilikan alamat, stok, dan menghitung
   total dari harga produk/varian. Total dari client tidak dipercaya.
4. Pesanan masuk ke dashboard admin.
   - Transfer: admin menandai **Dibayar** setelah dana masuk, lalu memproses dan
     mengirim paket.
   - COD: admin mengonfirmasi jadwal, memproses, lalu worker bertemu pelanggan.
5. Status berlanjut sampai **Selesai**. Admin juga dapat membatalkan pesanan.

### Aturan stok

- Stok berupa bilangan bulat dan menjadi sumber kebenaran.
- `0` → **Habis**; `> 0` → **Tersedia**.
- Toggle stok di admin akan mengubah stok menjadi `0` (habis) atau mengisi ulang
  minimal `10` (tersedia).

## Struktur singkat

```
client/
  src/
    components/   Navbar, Footer, Logo, Hero, ProductCard, ProductGrid,
                  ProductSelect, ArticleCard, AuthShell
    components/admin/  AdminLayout (sidebar + proteksi tampilan)
    contexts/     AuthContext, CartContext, CatalogContext, CurrencyContext
    data/         products.js (artikel, filter, fallback katalog)
    lib/          api.js (fetch + token), phone.js (format WhatsApp)
    pages/        Home, CatalogPage, ProductDetail, Compare, Cart, Checkout,
                  Articles, ArticleDetail, InfoPage, Login, Register,
                  ForgotPassword, MyOrders
    pages/admin/  AdminDashboard, AdminProducts, AdminCategories,
                  AdminOrders, AdminSettings
server/
  assets/figma/   gambar produk & artikel
  scripts/        seed-catalog.js + pipeline komposit gambar produk
  src/            Express API + static assets (assets/figma, uploads)
  src/db/         schema.sql, migrate.js, upgrade.js, mysql.js, db.js, data.json
  src/routes/     auth, categories, product, store, orders, addresses, figma
```

## Catatan

<<<<<<< HEAD
- Harga di katalog mengikuti harga pasar terkini. Harga final, stok, dan ongkir
  dikonfirmasi melalui WhatsApp.
- Nomor WhatsApp checkout: **+62 877-7774-7462** (`6287777747462`).
- Akun admin disimpan di tabel `accounts` (MySQL). Halaman register publik hanya
  membuat akun customer. Kredensial admin tidak ditampilkan di UI.
- Isi `JWT_SECRET` di `server/.env` sebelum deploy.
- Endpoint mutasi (`POST/PUT/PATCH/DELETE` produk, kategori, pengaturan toko,
  pesanan) membutuhkan token dengan role `admin` (kecuali pembuatan pesanan dan
  alamat milik pelanggan sendiri).
- Reset password memakai token sekali pakai yang berlaku 1 jam. Token lama
  otomatis tidak berlaku saat token baru dibuat.
- Di production (`NODE_ENV=production`), API tidak mengembalikan token reset.
  Hubungkan ke layanan email sebelum mengandalkan alur ini di production.
- Data utama disimpan di MySQL (bukan JSON). `data.json` hanya dipakai sebagai
  sumber seed saat migrasi.
=======
- Harga di katalog adalah harga contoh. Harga final, stok, dan ongkir dikonfirmasi
  melalui WhatsApp.
- Nomor WhatsApp checkout: **+62 xxxxxxx** (`628xxxxx`).
- Akun admin dikelola di `server/src/db/data.json`; halaman register publik hanya
  membuat akun customer. Kredensial admin tidak ditampilkan di UI. Gunakan
  password yang kuat dan jangan commit kredensial ke repository publik.
- Isi `JWT_SECRET` di `server/.env` (lihat `server/.env.example`) sebelum deploy.
  `ADMIN_PASSWORD` hanya dipakai saat membuat password admin awal dari placeholder.
- Skrip verifikasi UI membaca kredensial dari environment, bukan hardcoded:
  `$env:ADMIN_EMAIL="..."; $env:ADMIN_PASSWORD="..."; node scripts/verify-admin.mjs`.
- Akun baru dari halaman register berperan **customer**. Akun lama di
  `data.json` dipertahankan sebagai admin.
- Endpoint mutasi (`POST/PUT/PATCH/DELETE` produk, kategori, pengaturan toko)
  membutuhkan token dengan role `admin`.
- Data pengguna dan produk disimpan di `server/src/db/data.json` (bukan SQLite).
>>>>>>> origin/main
