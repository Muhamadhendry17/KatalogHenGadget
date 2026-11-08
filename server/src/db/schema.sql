-- ============================================================
-- Schema MySQL untuk HenGadget / KatalogWA
-- Jalankan sekali: mysql -u root -p hengadget < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS hengadget
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hengadget;

-- ─── Settings ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id            INT          NOT NULL DEFAULT 1,
  store_name    VARCHAR(100) NOT NULL DEFAULT 'HenGadget',
  tagline       VARCHAR(200)          DEFAULT NULL,
  address       TEXT                  DEFAULT NULL,
  phone         VARCHAR(30)           DEFAULT NULL,
  currency      VARCHAR(10)  NOT NULL DEFAULT 'Rp.',
  active_whatsapp TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  CONSTRAINT chk_singleton CHECK (id = 1)
);

-- Baris tunggal settings; INSERT IGNORE agar aman jika sudah ada.
INSERT IGNORE INTO settings (id, store_name, tagline, address, phone, currency, active_whatsapp)
VALUES (1, 'HenGadget', 'Best Gadget and Accessories', '', '', 'Rp.', 1);

-- ─── Accounts (admin & customer) ────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
  id         VARCHAR(60)  NOT NULL,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('admin','customer') NOT NULL DEFAULT 'customer',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_email (email)
);

-- ─── Categories ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id         VARCHAR(60)  NOT NULL,
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(120) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_slug (slug)
);

-- ─── Products ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                VARCHAR(60)    NOT NULL,
  name              VARCHAR(200)   NOT NULL,
  brand             VARCHAR(100)   NOT NULL DEFAULT 'Lainnya',
  tag               VARCHAR(100)   NOT NULL DEFAULT 'PILIHAN HENGADGET',
  featured          TINYINT(1)     NOT NULL DEFAULT 0,
  price             BIGINT         NOT NULL DEFAULT 0,
  description       TEXT,
  image             VARCHAR(500)            DEFAULT '',
  category_id       VARCHAR(60)             DEFAULT NULL,
  category_name     VARCHAR(100)   NOT NULL DEFAULT '',
  stock_status      ENUM('Tersedia','Habis') NOT NULL DEFAULT 'Tersedia',
  -- colors & colorNames disimpan sebagai JSON
  colors            JSON,
  color_names       JSON,
  release_year      YEAR                    DEFAULT NULL,
  is_new            TINYINT(1)     NOT NULL DEFAULT 0,
  performance_score TINYINT        NOT NULL DEFAULT 0,
  camera_score      TINYINT        NOT NULL DEFAULT 0,
  specs             JSON,
  highlights        JSON,
  -- Stok integer (10 = tersedia, 0 = habis) untuk konsistensi toggle admin.
  stock             INT            NOT NULL DEFAULT 10,
  -- Harga asli sebelum diskon (untuk tampilan coret/promo).
  original_price    BIGINT                  DEFAULT NULL,
  -- Badge produk: ['Best Seller','Baru','Promo'] disimpan sebagai JSON.
  badges            JSON,
  -- Variasi warna/storasi yang memengaruhi harga: [ {storage, price, stock, color, colorName} ].
  variants          JSON,
  created_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_category (category_id),
  CONSTRAINT fk_product_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

-- ─── Alamat pelanggan (untuk pemesanan & pengiriman) ───────────────────────────
CREATE TABLE IF NOT EXISTS addresses (
  id          VARCHAR(60)  NOT NULL,
  account_id  VARCHAR(60)  NOT NULL,
  name        VARCHAR(100) NOT NULL,
  phone       VARCHAR(30)  NOT NULL,
  address     TEXT         NOT NULL,
  city        VARCHAR(100) NOT NULL DEFAULT 'Sukabumi',
  province    VARCHAR(100) NOT NULL DEFAULT 'Jawa Barat',
  postal_code VARCHAR(10)           DEFAULT NULL,
  is_default  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_address_account (account_id),
  CONSTRAINT fk_address_account
    FOREIGN KEY (account_id) REFERENCES accounts(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- ─── Pesanan ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id              VARCHAR(60)    NOT NULL,
  account_id      VARCHAR(60)    NOT NULL,
  address_id      VARCHAR(60)             DEFAULT NULL,
  total           BIGINT         NOT NULL DEFAULT 0,
  payment_method  ENUM('transfer','cod') NOT NULL DEFAULT 'transfer',
  -- 'pending' = menunggu pembayaran/konfirmasi, 'paid' = pembayaran diterima (online),
  -- 'diproses' = sedang diproses, 'dikirim' = dalam pengiriman, 'selesai', 'dibatalkan'
  status          ENUM('pending','paid','diproses','dikirim','selesai','dibatalkan') NOT NULL DEFAULT 'pending',
  -- COD di Sukabumi: admin/worker bertemu customer langsung. Luar kota: pakai logistik paket.
  delivery_method ENUM('cod_sukabumi','logistik_paket') NOT NULL DEFAULT 'logistik_paket',
  catatan         TEXT,
  -- Snapshot alamat saat pesanan dibuat. Alamat asli boleh berubah/dihapus,
  -- data pengiriman pada pesanan tetap utuh.
  recipient_name       VARCHAR(100)  DEFAULT NULL,
  recipient_phone      VARCHAR(30)   DEFAULT NULL,
  shipping_address     TEXT          DEFAULT NULL,
  shipping_city        VARCHAR(100)  DEFAULT NULL,
  shipping_province    VARCHAR(100)  DEFAULT NULL,
  shipping_postal_code VARCHAR(10)   DEFAULT NULL,
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order_account (account_id),
  KEY idx_order_status (status),
  CONSTRAINT fk_order_account
    FOREIGN KEY (account_id) REFERENCES accounts(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_order_address
    FOREIGN KEY (address_id) REFERENCES addresses(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

-- ─── Item pesanan ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id            VARCHAR(60)  NOT NULL,
  order_id      VARCHAR(60)  NOT NULL,
  -- Boleh NULL: produk bisa dihapus, tetapi riwayat pesanan tetap lengkap
  -- berkat kolom snapshot di bawah.
  product_id    VARCHAR(60)           DEFAULT NULL,
  -- Snapshot produk saat transaksi.
  product_name  VARCHAR(200)          DEFAULT NULL,
  product_brand VARCHAR(100)          DEFAULT NULL,
  product_image VARCHAR(500)          DEFAULT NULL,
  varian        VARCHAR(100)          DEFAULT NULL,
  qty           INT          NOT NULL DEFAULT 1,
  price         BIGINT       NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_orderitem_order (order_id),
  KEY idx_orderitem_product (product_id),
  CONSTRAINT fk_orderitem_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_orderitem_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

-- ─── Token reset kata sandi ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         VARCHAR(60)   NOT NULL,
  account_id VARCHAR(60)   NOT NULL,
  token      VARCHAR(100)  NOT NULL,
  expires_at DATETIME      NOT NULL,
  used       TINYINT(1)    NOT NULL DEFAULT 0,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_reset_account (account_id),
  KEY idx_reset_token (token),
  CONSTRAINT fk_reset_account
    FOREIGN KEY (account_id) REFERENCES accounts(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- ─── Permintaan reset kata sandi (dibantu admin via WhatsApp) ──────────────────
CREATE TABLE IF NOT EXISTS password_reset_requests (
  id         VARCHAR(60)  NOT NULL,
  account_id VARCHAR(60)  NOT NULL,
  email      VARCHAR(150) NOT NULL,
  phone      VARCHAR(30)           DEFAULT NULL,
  status     ENUM('pending','diproses','selesai','ditolak') NOT NULL DEFAULT 'pending',
  handled_by VARCHAR(60)           DEFAULT NULL,
  handled_at DATETIME              DEFAULT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_resetreq_account (account_id),
  KEY idx_resetreq_status (status),
  CONSTRAINT fk_resetreq_account
    FOREIGN KEY (account_id) REFERENCES accounts(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

