import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OrderValidationError,
  adjustProductStock,
  canTransition,
  computeOrderTotal,
  findVariant,
  isCustomerCancellable,
  isValidMethodPair,
  resolveOrderLine,
  shouldRestoreStock,
} from '../src/domain/order.js';

const product = {
  id: 'prod-1',
  name: 'Contoh Phone',
  brand: 'Contoh',
  image: '/assets/contoh.png',
  price: 5_000_000,
  stock: 5,
  stockStatus: 'Tersedia',
  variants: [
    { storage: '128 GB', price: 5_000_000, stock: 3 },
    { storage: '256 GB', price: 6_000_000, stock: 2 },
  ],
};

test('pasangan metode pembayaran & pengiriman divalidasi', () => {
  assert.equal(isValidMethodPair('transfer', 'logistik_paket'), true);
  assert.equal(isValidMethodPair('cod', 'cod_sukabumi'), true);
  assert.equal(isValidMethodPair('cod', 'logistik_paket'), false);
  assert.equal(isValidMethodPair('transfer', 'cod_sukabumi'), false);
  assert.equal(isValidMethodPair('kartu', 'logistik_paket'), false);
});

test('findVariant mencocokkan teks storage secara longgar', () => {
  assert.equal(findVariant(product.variants, '256 GB').index, 1);
  assert.equal(findVariant(product.variants, '256').index, 1);
  assert.equal(findVariant(product.variants, '').index, -1);
});

test('resolveOrderLine memakai harga varian dari katalog', () => {
  const line = resolveOrderLine(product, { varian: '256 GB', qty: 2 });
  assert.equal(line.price, 6_000_000);
  assert.equal(line.qty, 2);
  assert.equal(line.productName, 'Contoh Phone');
  assert.equal(line.productImage, '/assets/contoh.png');
});

test('resolveOrderLine memakai harga dasar bila tanpa varian', () => {
  const line = resolveOrderLine(product, { qty: 1 });
  assert.equal(line.price, 5_000_000);
});

test('resolveOrderLine menolak varian yang tidak ada', () => {
  assert.throws(
    () => resolveOrderLine(product, { varian: '1 TB', qty: 1 }),
    (err) => err instanceof OrderValidationError && /tidak tersedia/i.test(err.message),
  );
});

test('resolveOrderLine menolak stok habis dan stok kurang', () => {
  assert.throws(
    () => resolveOrderLine({ ...product, stock: 0, stockStatus: 'Habis' }, { qty: 1 }),
    /habis/i,
  );
  assert.throws(() => resolveOrderLine(product, { qty: 6 }), /tersisa 5 unit/i);
  assert.throws(
    () => resolveOrderLine(product, { varian: '128 GB', qty: 4 }),
    /tersisa 3 unit/i,
  );
});

test('resolveOrderLine membatasi qty ke rentang 1..99', () => {
  assert.equal(resolveOrderLine(product, { qty: 0 }).qty, 1);
  assert.equal(resolveOrderLine({ ...product, stock: 500 }, { qty: 500 }).qty, 99);
});

test('computeOrderTotal menjumlahkan harga x qty', () => {
  assert.equal(
    computeOrderTotal([
      { price: 5_000_000, qty: 1 },
      { price: 3_000_000, qty: 2 },
    ]),
    11_000_000,
  );
  assert.equal(computeOrderTotal([]), 0);
});

test('adjustProductStock mengurangi lalu mengembalikan stok produk & varian', () => {
  const reduced = adjustProductStock(product, { varian: '256 GB', qty: 1 }, -1);
  assert.equal(reduced.stock, 4);
  assert.equal(reduced.variants[1].stock, 1);
  assert.equal(reduced.stockStatus, 'Tersedia');

  const restored = adjustProductStock(
    { ...product, stock: reduced.stock, variants: reduced.variants },
    { varian: '256 GB', qty: 1 },
    1,
  );
  assert.equal(restored.stock, 5);
  assert.equal(restored.variants[1].stock, 2);
});

test('adjustProductStock menandai habis saat stok mencapai nol', () => {
  const next = adjustProductStock({ ...product, stock: 1 }, { qty: 1 }, -1);
  assert.equal(next.stock, 0);
  assert.equal(next.stockStatus, 'Habis');
});

test('transisi status admin mengikuti alur pesanan', () => {
  assert.equal(canTransition('pending', 'paid', 'admin'), true);
  assert.equal(canTransition('pending', 'diproses', 'admin'), true);
  assert.equal(canTransition('paid', 'dikirim', 'admin'), false);
  assert.equal(canTransition('diproses', 'dikirim', 'admin'), true);
  assert.equal(canTransition('dikirim', 'selesai', 'admin'), true);
  assert.equal(canTransition('selesai', 'dibatalkan', 'admin'), false);
  assert.equal(canTransition('dibatalkan', 'pending', 'admin'), false);
  assert.equal(canTransition('pending', 'pending', 'admin'), true);
});

test('pelanggan hanya boleh membatalkan pesanan aktif', () => {
  assert.equal(canTransition('pending', 'dibatalkan', 'customer'), true);
  assert.equal(canTransition('paid', 'dibatalkan', 'customer'), true);
  assert.equal(canTransition('diproses', 'dibatalkan', 'customer'), false);
  assert.equal(canTransition('pending', 'selesai', 'customer'), false);
  assert.equal(isCustomerCancellable('pending'), true);
  assert.equal(isCustomerCancellable('dikirim'), false);
});

test('stok hanya dikembalikan untuk pesanan yang masih aktif', () => {
  assert.equal(shouldRestoreStock('pending'), true);
  assert.equal(shouldRestoreStock('paid'), true);
  assert.equal(shouldRestoreStock('diproses'), true);
  assert.equal(shouldRestoreStock('dikirim'), true);
  assert.equal(shouldRestoreStock('selesai'), false);
  assert.equal(shouldRestoreStock('dibatalkan'), false);
});
