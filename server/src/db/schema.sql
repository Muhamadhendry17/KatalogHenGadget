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
  rating            DECIMAL(3,1)   NOT NULL DEFAULT 0.0,
  reviews           INT            NOT NULL DEFAULT 0,
  release_year      YEAR                    DEFAULT NULL,
  is_new            TINYINT(1)     NOT NULL DEFAULT 0,
  performance_score TINYINT        NOT NULL DEFAULT 0,
  camera_score      TINYINT        NOT NULL DEFAULT 0,
  specs             JSON,
  highlights        JSON,
  created_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_category (category_id),
  CONSTRAINT fk_product_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

