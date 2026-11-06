# HenGadget — Katalog Handphone

Aplikasi katalog handphone dengan pengalaman belanja modern: filter yang benar-benar
bekerja, perbandingan produk, keranjang, dan checkout melalui WhatsApp.

## Fitur

- **Beranda** — hero modern dengan aurora, grid halus, tilt 3D, carousel otomatis 16
  handphone, daftar produk horizontal yang bisa digeser (satu baris, snap + tombol
  panah di desktop), promo, artikel, dan footer.
- **Katalog** — pencarian, filter merek, filter kebutuhan, dan pengurutan harga/rating.
- **Filter fungsional**
  - `Pilihan handphone` — semua produk.
  - `Terbaru` — produk rilis terbaru.
  - `Kamera unggul` — skor kamera ≥ 90.
  - `Performa kencang` — skor performa ≥ 84.
  - `Harga bersahabat` — harga ≤ Rp6,5 juta.
- **Detail produk** — gambar, pemilih warna interaktif, spesifikasi, skor
  performa/kamera, produk terkait. Memilih swatch warna ikut mengubah tampilan
  bodi handphone secara visual (lapisan warna CSS pada foto produk).
- **Produk terbaru** — `Apple iPhone 17 Pro Max 1TB` (A19 Pro, layar 6,9" 120 Hz,
  kamera triple 48 MP, 12 GB / 1 TB).
- **Perbandingan** — bandingkan 2–3 handphone dengan dropdown kustom yang menampilkan
  thumbnail, harga, dan status pilihan.
- **Wishlist** — tombol hati di kartu produk hanya menyimpan/menghapus produk tanpa
  membuka halaman detail; status tersimpan di `localStorage`.
- **Keranjang & Checkout** — panel checkout geser dari kanan, menampilkan gambar,
  harga, jumlah, dan total; checkout membuka WhatsApp `628xxxxxxx`.
- **Artikel** — daftar dan halaman detail artikel.
- **Halaman informasi** — panduan membeli, FAQ, cerita kami, cara memilih, kontak,
  kebijakan privasi.
- **Login / Register** — autentikasi JWT dengan penyimpanan JSON di server. Login
  admin otomatis diarahkan ke dashboard; pendaftaran publik membuat akun
  **customer** (tidak bisa mengubah katalog). Halaman auth memakai latar bertema
  handphone: aurora, grid, kartu showcase produk, dan panel form kaca.
  Kredensial admin tidak ditampilkan di halaman login.
- **Dashboard admin** (`/admin`) — ringkasan statistik, kelola produk (tambah,
  edit, hapus, upload gambar, toggle stok), kelola kategori, dan pengaturan toko.
  Perubahan langsung dipakai storefront karena katalog membaca API.
- **Katalog berbasis API** — produk, kategori, dan pengaturan toko dibaca dari
  server. Jika API belum menyala, storefront memakai data statis sebagai fallback.

## Menjalankan

Butuh Node.js 20+.

Terminal 1 — API server:

```powershell
cd server
npm install
Copy-Item .env.example .env    # lalu isi JWT_SECRET dengan string acak
node scripts/seed-catalog.js   # opsional: isi ulang katalog dari data storefront
node src/index.js
```

Server berjalan di `http://localhost:3000`.

Terminal 2 — client:

```powershell
cd client
npm install
npm run dev
```

Client berjalan di `http://localhost:5173`.

## Struktur singkat

```
client/
  src/
    components/   Navbar, Footer, Logo, Hero, ProductCard, ProductGrid,
                  ProductSelect, ArticleCard, AuthShell
    components/admin/  AdminLayout (sidebar + proteksi tampilan)
    contexts/     AuthContext, CartContext, CatalogContext
    data/         products.js (artikel, filter, efek warna; fallback katalog)
    lib/          api.js (fetch + token), phone.js (format WhatsApp)
    pages/        Home, CatalogPage, ProductDetail, Compare, Cart, Checkout,
                  Articles, ArticleDetail, InfoPage, Login, Register
    pages/admin/  AdminDashboard, AdminProducts, AdminCategories, AdminSettings
server/
  assets/figma/   gambar produk & artikel
  scripts/        seed-catalog.js + pipeline komposit gambar produk
  src/            Express API + static assets (assets/figma, uploads)
  src/db/         data.json + akses database JSON
```

## Aset gambar

Gambar produk utama diekspor dari desain Figma. Gambar produk merek lain diambil
dari GSMArena, lalu dikomposit ke latar studio 632×516 yang sama agar tampilan
kartu konsisten. Thumbnail artikel disimpan lokal agar tidak bergantung pada
layanan gambar eksternal.

## Catatan

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
