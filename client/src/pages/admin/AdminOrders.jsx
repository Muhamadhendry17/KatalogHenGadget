import { useCallback, useEffect, useState } from 'react';
import ProductThumb from '../../components/ProductThumb';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../lib/api';
import { useFormatCurrency } from '../../contexts/CurrencyContext';

const STATUS_LABELS = {
  pending: 'Menunggu',
  paid: 'Dibayar',
  diproses: 'Diproses',
  dikirim: 'Dikirim',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
};

const STATUS_COLORS = {
  pending: 'bg-amber-500/15 text-amber-300',
  paid: 'bg-blue-500/15 text-blue-300',
  diproses: 'bg-indigo-500/15 text-indigo-300',
  dikirim: 'bg-purple-500/15 text-purple-300',
  selesai: 'bg-emerald-500/15 text-emerald-300',
  dibatalkan: 'bg-red-500/15 text-red-300',
};

const PAYMENT_LABELS = {
  transfer: 'Transfer bank',
  cod: 'COD',
};

const DELIVERY_LABELS = {
  logistik_paket: 'Logistik paket',
  cod_sukabumi: 'COD Sukabumi',
};

const NEXT_STATUS = {
  pending: 'paid',
  paid: 'diproses',
  diproses: 'dikirim',
  dikirim: 'selesai',
};

const ALLOWED_TRANSITIONS = {
  pending: ['paid', 'diproses', 'dibatalkan'],
  paid: ['diproses', 'dibatalkan'],
  diproses: ['dikirim', 'dibatalkan'],
  dikirim: ['selesai'],
  selesai: [],
  dibatalkan: [],
};

function nextActionLabel(order) {
  if (order.status === 'pending') {
    return order.paymentMethod === 'cod' ? 'Konfirmasi pesanan' : 'Tandai dibayar';
  }
  if (order.status === 'paid') return 'Proses pesanan';
  if (order.status === 'diproses') return 'Kirim pesanan';
  if (order.status === 'dikirim') return 'Tandai selesai';
  return null;
}

function nextStatusFor(order) {
  if (order.status === 'pending' && order.paymentMethod === 'cod') return 'diproses';
  return NEXT_STATUS[order.status] || null;
}

function statusHint(order) {
  if (order.status === 'pending') {
    return order.paymentMethod === 'cod'
      ? 'Konfirmasi jadwal COD, lalu proses pesanan.'
      : 'Menunggu transfer. Tandai "Dibayar" setelah dana masuk.';
  }
  if (order.status === 'paid') return 'Pembayaran diterima. Siapkan produk lalu proses.';
  if (order.status === 'diproses') {
    return order.deliveryMethod === 'cod_sukabumi'
      ? 'Admin/worker menyiapkan produk dan menjadwalkan pertemuan COD.'
      : 'Kemas paket, lalu ubah status menjadi Dikirim.';
  }
  if (order.status === 'dikirim') {
    return order.deliveryMethod === 'cod_sukabumi'
      ? 'Worker menuju lokasi customer. Tandai selesai setelah barang diterima & dibayar.'
      : 'Paket dalam perjalanan. Tandai selesai setelah diterima customer.';
  }
  if (order.status === 'selesai') return 'Pesanan selesai.';
  if (order.status === 'dibatalkan') return 'Pesanan dibatalkan.';
  return '';
}

export default function AdminOrders() {
  const { user } = useAuth();
  const token = user?.token;
  const formatCurrency = useFormatCurrency();

  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const res = await apiRequest(`/api/orders${params}`, { token });
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, filterStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (order, newStatus) => {
    setBusyId(order.id);
    setError('');
    setNotice('');
    try {
      await apiRequest(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        body: { status: newStatus },
        token,
      });
      await fetchOrders();
      setNotice(`Status pesanan #${order.id.slice(-6)} diperbarui menjadi ${STATUS_LABELS[newStatus]}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  };

  const filtered = orders.filter(
    (order) => filterStatus === 'all' || order.status === filterStatus,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">Pesanan</span>
          <h1 className="mt-2 text-3xl font-extrabold text-white">Kelola Pesanan</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/45">
            Pesanan transfer diproses setelah pembayaran diterima, lalu dikirim via logistik
            paket. Pesanan COD Sukabumi diproses setelah dikonfirmasi dan diserahkan langsung
            oleh admin/worker.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:text-white disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M20 11a8 8 0 10-2.3 5.7M20 5v6h-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Segarkan
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {notice}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-white/35">Total pesanan</p>
          <p className="text-xl font-bold text-white">{orders.length}</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-amber-300">Menunggu</p>
          <p className="text-xl font-bold text-amber-300">
            {orders.filter((order) => order.status === 'pending').length}
          </p>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.05] p-4">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-blue-300">Transfer</p>
          <p className="text-xl font-bold text-blue-300">
            {orders.filter((order) => order.paymentMethod === 'transfer').length}
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-amber-300">COD</p>
          <p className="text-xl font-bold text-amber-300">
            {orders.filter((order) => order.paymentMethod === 'cod').length}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['all', 'pending', 'paid', 'diproses', 'dikirim', 'selesai', 'dibatalkan'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-medium transition-all ${
                filterStatus === status
                  ? 'border-cyan-300 bg-cyan-400 text-[#04111c] shadow-[0_0_20px_rgba(34,211,238,0.25)]'
                  : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {status === 'all' ? 'Semua' : STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.02] text-[10px] uppercase tracking-wider text-white/35">
              <tr>
                <th className="px-5 py-4 font-semibold">Pesanan</th>
                <th className="px-4 py-4 font-semibold">Pelanggan &amp; Alamat</th>
                <th className="px-4 py-4 font-semibold">Total</th>
                <th className="px-4 py-4 font-semibold">Metode</th>
                <th className="px-4 py-4 font-semibold">Status</th>
                <th className="px-4 py-4 font-semibold">Tanggal</th>
                <th className="px-5 py-4 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-white/40">
                    Memuat pesanan...
                  </td>
                </tr>
              )}

              {filtered.map((order) => {
                const address = order.address || order.addresses?.[0] || null;
                const nextStatus = nextStatusFor(order);
                const expanded = expandedId === order.id;

                return (
                  <FragmentRow
                    key={order.id}
                    order={order}
                    address={address}
                    nextStatus={nextStatus}
                    expanded={expanded}
                    busy={busyId === order.id}
                    formatCurrency={formatCurrency}
                    onToggle={() => setExpandedId(expanded ? '' : order.id)}
                    onStatusChange={(status) => handleStatusChange(order, status)}
                  />
                );
              })}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <p className="text-sm text-white/50">Tidak ada pesanan yang cocok.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FragmentRow({
  order,
  address,
  nextStatus,
  expanded,
  busy,
  formatCurrency,
  onToggle,
  onStatusChange,
}) {
  const [statusPanelOpen, setStatusPanelOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const statusOptions = ALLOWED_TRANSITIONS[order.status] || [];

  const chooseStatus = (status) => {
    setStatusPanelOpen(false);
    if (status === 'dibatalkan') {
      setConfirmCancel(true);
      return;
    }
    onStatusChange(status);
  };

  return (
    <>
      <tr className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
        <td className="px-5 py-4">
          <p className="font-semibold text-white">#{order.id.slice(-6)}</p>
          <p className="max-w-[150px] truncate text-[11px] text-white/35">{order.id}</p>
          <button
            type="button"
            onClick={onToggle}
            className="mt-1 text-[11px] font-semibold text-cyan-300 hover:text-cyan-200"
          >
            {expanded ? 'Tutup detail' : 'Lihat detail'}
          </button>
        </td>

        <td className="px-4 py-4">
          <p className="font-semibold text-white">{order.accountName || '—'}</p>
          <p className="text-[11px] text-white/35">{order.accountEmail || '—'}</p>
          {address ? (
            <div className="mt-1 text-[11px] leading-relaxed text-white/45">
              <p className="font-medium text-white/70">
                {address.name} · {address.phone}
              </p>
              <p>
                {address.address}, {address.city}, {address.province}
                {address.postalCode ? ` ${address.postalCode}` : ''}
              </p>
            </div>
          ) : (
            <p className="mt-1 text-[11px] text-red-300/80">Alamat belum tersedia</p>
          )}
        </td>

        <td className="px-4 py-4 font-medium text-white/80">{formatCurrency(order.total)}</td>

        <td className="px-4 py-4 text-white/55">
          <p className="text-xs">{PAYMENT_LABELS[order.paymentMethod]}</p>
          <p className="text-[11px] text-white/35">{DELIVERY_LABELS[order.deliveryMethod]}</p>
        </td>

        <td className="px-4 py-4">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_COLORS[order.status]}`}>
            {STATUS_LABELS[order.status]}
          </span>
          <p className="mt-1 max-w-[180px] text-[10px] leading-snug text-white/35">
            {statusHint(order)}
          </p>
        </td>

        <td className="px-4 py-4 text-white/50">
          {new Date(order.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </td>

        <td className="px-5 py-4">
          <div className="flex flex-col items-end gap-2">
            {nextStatus && (
              <button
                type="button"
                onClick={() => onStatusChange(nextStatus)}
                disabled={busy}
                className="rounded-lg bg-cyan-400 px-3 py-1.5 text-[11px] font-bold text-[#04111c] transition-colors hover:bg-cyan-300 disabled:opacity-50"
              >
                {busy ? 'Menyimpan...' : nextActionLabel(order)}
              </button>
            )}

            {statusOptions.length > 0 && (
              <button
                type="button"
                onClick={() => setStatusPanelOpen((value) => !value)}
                disabled={busy}
                aria-expanded={statusPanelOpen}
                aria-controls={`status-panel-${order.id}`}
                className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                  statusPanelOpen
                    ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200'
                    : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                Ubah status
                <svg
                  viewBox="0 0 24 24"
                  className={`h-3 w-3 transition-transform ${statusPanelOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}

            {statusPanelOpen && statusOptions.length > 0 && (
              <div
                id={`status-panel-${order.id}`}
                className="w-full min-w-[168px] rounded-xl border border-white/10 bg-[#0b111c] p-1.5 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.85)]"
              >
                <p className="px-2 pb-1 pt-0.5 text-[9px] font-bold uppercase tracking-wider text-white/30">
                  Pilih status baru
                </p>
                <div className="flex flex-col gap-0.5">
                  {statusOptions.map((status) => {
                    const isCancel = status === 'dibatalkan';
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => chooseStatus(status)}
                        disabled={busy}
                        className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                          isCancel
                            ? 'text-red-300 hover:bg-red-500/10'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span>{STATUS_LABELS[status]}</span>
                        {isCancel && (
                          <svg
                            viewBox="0 0 24 24"
                            className="h-3.5 w-3.5 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-white/10 bg-[#070c14]">
          <td colSpan={7} className="px-5 py-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/35">
                  Item pesanan
                </p>
                <div className="space-y-2">
                  {(order.items || []).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-white/10 bg-gradient-to-br from-[#eef1f3] to-[#c4c9ce]">
                          <ProductThumb
                            src={item.productImage}
                            alt={item.productName || 'Gambar produk'}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white/85">
                            {item.productName || 'Produk tidak tersedia'}
                          </p>
                          <p className="text-white/35">
                            {item.varian || 'Varian default'} · {item.qty} ×{' '}
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 font-semibold text-white/75">
                        {formatCurrency(item.price * item.qty)}
                      </span>
                    </div>
                  ))}
                  {!order.items?.length && (
                    <p className="text-xs text-white/40">Tidak ada item.</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-white/35">
                    Alamat lengkap
                  </p>
                  {address ? (
                    <p className="leading-relaxed text-white/65">
                      {address.name} ({address.phone})<br />
                      {address.address}<br />
                      {address.city}, {address.province}
                      {address.postalCode ? ` ${address.postalCode}` : ''}
                    </p>
                  ) : (
                    <p className="text-red-300/80">Alamat belum tersedia.</p>
                  )}
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-white/35">
                    Catatan customer
                  </p>
                  <p className="text-white/65">{order.catatan || '—'}</p>
                </div>
                <div className="rounded-lg border border-cyan-400/15 bg-cyan-400/[0.05] px-3 py-2 text-[11px] text-cyan-200/80">
                  {statusHint(order)}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}

      <ConfirmDialog
        open={confirmCancel}
        title="Batalkan pesanan ini?"
        description={
          <>
            Pesanan <span className="font-semibold text-white/80">#{order.id.slice(-6)}</span>{' '}
            akan dibatalkan dan stok produk dikembalikan otomatis. Customer akan melihat status
            dibatalkan. Tindakan ini tidak bisa diurungkan.
          </>
        }
        confirmLabel="Ya, batalkan pesanan"
        cancelLabel="Kembali"
        tone="danger"
        busy={busy}
        onConfirm={async () => {
          await onStatusChange('dibatalkan');
          setConfirmCancel(false);
        }}
        onCancel={() => setConfirmCancel(false)}
      />
    </>
  );
}
