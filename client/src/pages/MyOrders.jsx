import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductThumb from '../components/ProductThumb';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../lib/api';
import { useFormatCurrency } from '../contexts/CurrencyContext';

const STATUS_LABELS = {
  pending: 'Menunggu Pembayaran',
  paid: 'Pembayaran Diterima',
  diproses: 'Sedang Diproses',
  dikirim: 'Sedang Dikirim',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
};

const STATUS_COLORS = {
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  paid: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  diproses: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  dikirim: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  selesai: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  dibatalkan: 'bg-red-500/15 text-red-300 border-red-500/30',
};

const STATUS_HINTS = {
  pending: 'Pesanan sudah diterima. Admin akan segera mengonfirmasi pembayaran/pesanan Anda.',
  paid: 'Pembayaran dikonfirmasi. Pesanan akan segera diproses.',
  diproses: 'Pesanan sedang disiapkan oleh admin.',
  dikirim: 'Pesanan sedang dalam perjalanan/diantar.',
  selesai: 'Pesanan selesai. Terima kasih sudah berbelanja.',
  dibatalkan: 'Pesanan dibatalkan. Hubungi admin bila perlu bantuan.',
};

const PAYMENT_LABELS = {
  transfer: 'Transfer Bank',
  cod: 'COD (Bayar saat ketemu)',
};

const DELIVERY_LABELS = {
  logistik_paket: 'Logistik Paket (Luar Kota)',
  cod_sukabumi: 'COD Sukabumi (Admin Bertemu Langsung)',
};

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function OrderCard({ order, formatCurrency, onCancel, cancelling }) {
  const [expanded, setExpanded] = useState(false);
  const items = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const address = order.address || null;
  const shortId = String(order.id || '').slice(-8).toUpperCase();
  const cancellable = ['pending', 'paid'].includes(order.status);

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="flex flex-col gap-4 border-b border-white/5 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
              Pesanan
            </span>
            <span className="font-mono text-sm font-bold text-white">#{shortId}</span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                STATUS_COLORS[order.status] || 'border-white/10 text-white/60'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {STATUS_LABELS[order.status] || order.status}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-white/40">
            {formatDate(order.createdAt)} · {itemCount} barang
          </p>
          {order.catatan && (
            <p className="mt-2 text-[11px] italic text-white/35">"{order.catatan}"</p>
          )}
        </div>

        <div className="shrink-0 sm:text-right">
          <p className="text-[10px] uppercase tracking-wider text-white/35">Total</p>
          <p className="text-xl font-extrabold text-cyan-300">{formatCurrency(order.total)}</p>
        </div>
      </div>

      <div className="space-y-3 p-5">
        {items.length === 0 ? (
          <p className="text-sm text-white/40">Detail item pesanan tidak tersedia.</p>
        ) : (
          items.map((item) => {
            const lineTotal = (Number(item.price) || 0) * (Number(item.qty) || 0);
            const productLink = item.productId ? `/product/${item.productId}` : null;

            return (
              <div key={item.id} className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#eef1f3] to-[#c4c9ce]">
                  <ProductThumb
                    src={item.productImage}
                    alt={item.productName || 'Gambar produk'}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  {productLink ? (
                    <Link
                      to={productLink}
                      className="line-clamp-2 text-sm font-semibold text-white transition-colors hover:text-cyan-300"
                    >
                      {item.productName}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold text-white/70">Produk tidak tersedia</p>
                  )}
                  <p className="mt-0.5 text-[11px] text-white/40">
                    {item.varian || 'Varian default'} · {item.qty} ×{' '}
                    {formatCurrency(item.price)}
                  </p>
                </div>

                <p className="shrink-0 text-sm font-semibold text-white/80">
                  {formatCurrency(lineTotal)}
                </p>
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-white/5 bg-white/[0.02] px-5 py-4 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <p>
            <span className="text-white/30">Pembayaran:</span>{' '}
            {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
          </p>
          <p>
            <span className="text-white/30">Pengiriman:</span>{' '}
            {DELIVERY_LABELS[order.deliveryMethod] || order.deliveryMethod}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {cancellable && (
            <button
              type="button"
              onClick={() => onCancel(order)}
              disabled={cancelling}
              className="inline-flex items-center gap-1.5 self-start rounded-lg border border-red-400/25 px-3 py-1.5 font-semibold text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-50 sm:self-auto"
            >
              {cancelling ? 'Membatalkan...' : 'Batalkan pesanan'}
            </button>
          )}

          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-white/10 px-3 py-1.5 font-semibold text-white/65 transition-colors hover:border-cyan-400/40 hover:text-cyan-300 sm:self-auto"
            aria-expanded={expanded}
          >
            {expanded ? 'Tutup detail' : 'Detail pesanan'}
            <svg
              viewBox="0 0 24 24"
              className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="grid gap-4 border-t border-white/5 px-5 py-4 text-xs sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-white/35">
              Alamat pengiriman
            </p>
            {address ? (
              <p className="leading-relaxed text-white/60">
                <span className="font-semibold text-white/80">{address.name}</span>
                {address.phone ? ` · ${address.phone}` : ''}
                <br />
                {address.address}
                <br />
                {[address.city, address.province, address.postalCode]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            ) : (
              <p className="text-white/40">Alamat tidak tersedia.</p>
            )}
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-white/35">
              Status pesanan
            </p>
            <p className="leading-relaxed text-white/60">
              {STATUS_HINTS[order.status] || 'Status pesanan sedang diperbarui admin.'}
            </p>
            <p className="mt-2 font-mono text-[10px] text-white/25">{order.id}</p>
          </div>
        </div>
      )}
    </article>
  );
}

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const formatCurrency = useFormatCurrency();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [error, setError] = useState('');

  const loadOrders = useCallback(
    async ({ silent = false } = {}) => {
      if (!user?.token || user.role === 'admin') return;
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const res = await apiRequest('/api/orders', { token: user.token });
        setOrders(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user],
  );

  useEffect(() => {
    if (authLoading || !user || user.role === 'admin') return;
    loadOrders();
  }, [authLoading, user, loadOrders]);

  // Admin hanya mengelola pesanan lewat dashboard, bukan "Pesanan Saya".
  if (user?.role === 'admin') {
    return <Navigate to="/admin/orders" replace />;
  }

  const handleCancelOrder = async () => {
    if (!cancelTarget || cancellingId) return;
    const order = cancelTarget;
    setCancellingId(order.id);
    setError('');
    try {
      await apiRequest(`/api/orders/${order.id}/cancel`, {
        method: 'PATCH',
        token: user.token,
      });
      await loadOrders({ silent: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setCancellingId('');
      setCancelTarget(null);
    }
  };

  if (authLoading || (loading && user)) {
    return (
      <div className="min-h-screen bg-[#070b14]">
        <Navbar />
        <div className="flex min-h-[70vh] items-center justify-center px-4 pt-20">
          <div className="flex items-center gap-3 text-sm text-white/60">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            Memuat pesanan...
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#070b14]">
        <Navbar />
        <div className="flex min-h-[70vh] items-center justify-center px-4 pt-20">
          <div className="glass-panel w-full max-w-md p-12 text-center">
            <div className="mb-4 text-5xl">🔐</div>
            <h2 className="mb-3 text-2xl font-bold text-white">Silakan Masuk</h2>
            <p className="mb-6 text-sm text-white/50">
              Anda perlu masuk untuk melihat daftar pesanan.
            </p>
            <Link
              to="/login"
              className="inline-flex rounded-xl bg-cyan-500 px-6 py-3 font-bold text-[#04111c] transition-colors hover:bg-cyan-400"
            >
              Masuk ke Akun
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14]">
      <Navbar />
      <main className="pb-20 pt-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-8 flex items-center gap-2 text-xs text-white/35" aria-label="Breadcrumb">
            <Link to="/" className="transition-colors hover:text-cyan-300">
              Beranda
            </Link>
            <span>/</span>
            <span className="text-white/60">Pesanan Saya</span>
          </nav>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Pesanan Saya</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/50">
                Riwayat dan status pesanan Anda. Status diperbarui admin setelah
                pembayaran dikonfirmasi atau pesanan diproses/dikirim.
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadOrders({ silent: true })}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:text-white disabled:opacity-50 sm:self-auto"
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M20 11a8 8 0 10-2.3 5.7M20 5v6h-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {refreshing ? 'Memuat...' : 'Segarkan'}
            </button>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {orders.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] py-20 text-center">
              <div className="mb-4 text-5xl">📭</div>
              <h3 className="text-xl font-bold text-white">Belum ada pesanan</h3>
              <p className="mb-6 mt-2 text-sm text-white/45">
                Mulai belanja dari katalog kami untuk membuat pesanan pertama.
              </p>
              <Link
                to="/catalog"
                className="rounded-xl bg-cyan-500 px-6 py-3 font-bold text-[#04111c] transition-colors hover:bg-cyan-400"
              >
                Lihat Katalog
              </Link>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  formatCurrency={formatCurrency}
                  onCancel={() => setCancelTarget(order)}
                  cancelling={cancellingId === order.id}
                />
              ))}
            </div>
          )}

          <p className="mt-6 text-center text-xs text-white/35">
            Status pesanan diperbarui admin setelah konfirmasi pembayaran (transfer)
            atau pertemuan langsung (COD Sukabumi).
          </p>
        </div>
      </main>
      <Footer />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Batalkan pesanan ini?"
        description={
          cancelTarget ? (
            <>
              Pesanan <span className="font-semibold text-white/80">#{String(cancelTarget.id).slice(-8).toUpperCase()}</span>{' '}
              akan dibatalkan dan stok produk dikembalikan otomatis. Tindakan ini tidak bisa
              diurungkan.
            </>
          ) : null
        }
        confirmLabel="Ya, batalkan pesanan"
        cancelLabel="Pertahankan pesanan"
        tone="danger"
        busy={Boolean(cancellingId)}
        onConfirm={handleCancelOrder}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
