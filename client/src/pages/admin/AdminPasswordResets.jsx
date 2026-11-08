import { useCallback, useEffect, useState } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../lib/api';

const STATUS_META = {
  pending: { label: 'Menunggu', className: 'bg-amber-500/15 text-amber-300' },
  diproses: { label: 'Tautan dibuat', className: 'bg-cyan-500/15 text-cyan-300' },
  selesai: { label: 'Selesai', className: 'bg-emerald-500/15 text-emerald-300' },
  ditolak: { label: 'Ditolak', className: 'bg-red-500/15 text-red-300' },
};

const FILTERS = ['all', 'pending', 'diproses', 'selesai', 'ditolak'];

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function normalizePhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith('8')) digits = `62${digits}`;
  return digits;
}

function whatsappLink(request, link) {
  const number = normalizePhone(request.phone);
  if (!number) return '';
  const message = [
    `Halo ${request.accountName || 'kak'},`,
    '',
    'Kami menerima permintaan reset kata sandi untuk akun HenGadget Anda.',
    'Silakan buka tautan berikut untuk membuat kata sandi baru:',
    link,
    '',
    'Tautan berlaku 1 jam dan hanya bisa dipakai sekali. Abaikan pesan ini jika Anda tidak meminta reset.',
  ].join('\n');
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export default function AdminPasswordResets() {
  const { user } = useAuth();
  const token = user?.token;

  const [requests, setRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');
  const [linkDialog, setLinkDialog] = useState(null);
  const [copied, setCopied] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest('/api/password-resets', { token });
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleGenerateLink = async (request) => {
    setBusyId(request.id);
    setError('');
    setNotice('');
    setCopied(false);
    try {
      const res = await apiRequest(`/api/password-resets/${request.id}/link`, {
        method: 'POST',
        token,
      });
      setLinkDialog({ request, link: res.data.link, expiresAt: res.data.expiresAt });
      setNotice('Tautan reset dibuat. Kirim tautan ke customer melalui WhatsApp.');
      await fetchRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setBusyId(rejectTarget.id);
    setError('');
    setNotice('');
    try {
      await apiRequest(`/api/password-resets/${rejectTarget.id}/reject`, {
        method: 'POST',
        token,
      });
      await fetchRequests();
      setNotice('Permintaan reset ditolak.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId('');
      setRejectTarget(null);
    }
  };

  const handleCopy = async () => {
    if (!linkDialog?.link) return;
    try {
      await navigator.clipboard.writeText(linkDialog.link);
      setCopied(true);
    } catch {
      setError('Gagal menyalin otomatis. Salin tautan secara manual dari kolom di atas.');
    }
  };

  const pendingCount = requests.filter((item) => item.status === 'pending').length;
  const filtered = requests.filter(
    (item) => filterStatus === 'all' || item.status === filterStatus,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">
            Keamanan
          </span>
          <h1 className="mt-2 text-3xl font-extrabold text-white">Reset Kata Sandi</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/45">
            Permintaan reset dari customer muncul di sini. Verifikasi identitas melalui
            WhatsApp, lalu buat tautan reset dan kirimkan. Customer tidak perlu mengetik token.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchRequests}
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-white/35">Total permintaan</p>
          <p className="text-xl font-bold text-white">{requests.length}</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-amber-300">Menunggu</p>
          <p className="text-xl font-bold text-amber-300">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.05] p-4">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-cyan-300">Tautan dibuat</p>
          <p className="text-xl font-bold text-cyan-300">
            {requests.filter((item) => item.status === 'diproses').length}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
          <p className="mb-1 text-[10px] uppercase tracking-wider text-emerald-300">Selesai</p>
          <p className="text-xl font-bold text-emerald-300">
            {requests.filter((item) => item.status === 'selesai').length}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {FILTERS.map((status) => (
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
              {status === 'all' ? 'Semua' : STATUS_META[status].label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.02] text-[10px] uppercase tracking-wider text-white/35">
              <tr>
                <th className="px-5 py-4 font-semibold">Pelanggan</th>
                <th className="px-4 py-4 font-semibold">WhatsApp</th>
                <th className="px-4 py-4 font-semibold">Diajukan</th>
                <th className="px-4 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && requests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-sm text-white/40">
                    Memuat permintaan...
                  </td>
                </tr>
              )}

              {filtered.map((request) => {
                const meta = STATUS_META[request.status] || {
                  label: request.status,
                  className: 'bg-white/10 text-white/60',
                };
                const canGenerate = request.status !== 'selesai';
                const canReject = ['pending', 'diproses'].includes(request.status);
                const busy = busyId === request.id;

                return (
                  <tr
                    key={request.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">{request.accountName || '—'}</p>
                      <p className="text-[11px] text-white/40">{request.accountEmail || request.email}</p>
                    </td>
                    <td className="px-4 py-4 text-white/60">
                      {request.phone ? (
                        <span className="font-mono text-xs">{request.phone}</span>
                      ) : (
                        <span className="text-[11px] text-amber-300/80">Belum tersedia</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-white/50">
                      {formatDateTime(request.requestedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${meta.className}`}>
                        {meta.label}
                      </span>
                      {request.status === 'selesai' && request.handledAt && (
                        <p className="mt-1 text-[10px] text-white/30">
                          {formatDateTime(request.handledAt)}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col items-end gap-2">
                        {canGenerate && (
                          <button
                            type="button"
                            onClick={() => handleGenerateLink(request)}
                            disabled={busy}
                            className="rounded-lg bg-cyan-400 px-3 py-1.5 text-[11px] font-bold text-[#04111c] transition-colors hover:bg-cyan-300 disabled:opacity-50"
                          >
                            {busy
                              ? 'Membuat...'
                              : request.status === 'diproses'
                                ? 'Buat ulang tautan'
                                : 'Buat tautan reset'}
                          </button>
                        )}
                        {canReject && (
                          <button
                            type="button"
                            onClick={() => setRejectTarget(request)}
                            disabled={busy}
                            className="rounded-lg border border-red-400/25 px-3 py-1.5 text-[11px] font-semibold text-red-300/80 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                          >
                            Tolak
                          </button>
                        )}
                        {request.status === 'selesai' && (
                          <span className="text-[11px] font-semibold text-emerald-300/80">
                            Sudah selesai
                          </span>
                        )}
                        {canGenerate && (
                          <p className="max-w-[180px] text-right text-[10px] leading-snug text-white/30">
                            Tautan hanya ditampilkan sekali.
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <p className="text-sm text-white/50">
                      {requests.length === 0
                        ? 'Belum ada permintaan reset.'
                        : 'Tidak ada permintaan dengan status ini.'}
                    </p>
                    <p className="mt-1 text-xs text-white/35">
                      Permintaan dari halaman &quot;Lupa kata sandi&quot; akan muncul di sini.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] px-4 py-3 text-xs leading-relaxed text-cyan-100/70">
        <span className="font-semibold text-cyan-200">Tips keamanan:</span> pastikan Anda
        menghubungi nomor yang memang terdaftar pada pesanan/alamat customer. Tautan reset
        berlaku 1 jam dan otomatis tidak berlaku setelah kata sandi diubah.
      </div>

      {linkDialog && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => setLinkDialog(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-link-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b111c] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                  Tautan reset
                </p>
                <h2 id="reset-link-title" className="mt-1 text-lg font-extrabold text-white">
                  Kirim ke {linkDialog.request.accountName || 'customer'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setLinkDialog(null)}
                aria-label="Tutup"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-white/55">
              Tautan ini hanya ditampilkan sekali. Kirim melalui WhatsApp; customer cukup
              mengklik tautan untuk membuat kata sandi baru.
            </p>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-2">
              <input
                readOnly
                value={linkDialog.link}
                onFocus={(event) => event.target.select()}
                className="min-w-0 flex-1 bg-transparent px-2 py-1.5 font-mono text-[11px] text-cyan-100/80 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-[11px] font-bold text-cyan-200 transition-colors hover:bg-cyan-400/20"
              >
                {copied ? 'Tersalin' : 'Salin'}
              </button>
            </div>

            <p className="mt-2 text-[11px] text-white/35">
              Berlaku sampai {formatDateTime(linkDialog.expiresAt)}.
            </p>

            {linkDialog.request.phone ? (
              <a
                href={whatsappLink(linkDialog.request, linkDialog.link)}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-[#04111c] transition-colors hover:bg-emerald-400"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm5.8 14.13c-.24.68-1.42 1.3-1.96 1.35-.54.05-1.05.24-3.54-.74-2.99-1.18-4.87-4.26-5.02-4.46-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.29.59-.37.79-.37.2 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.83 2.03.9 2.18.07.15.12.32.02.52-.1.2-.15.32-.29.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.03 1.12 1 2.07 1.31 2.36 1.46.29.15.46.13.63-.08.17-.2.73-.85.93-1.14.2-.29.39-.24.66-.15.27.1 1.7.8 1.99.95.29.15.48.22.55.34.07.12.07.7-.17 1.38z" />
                </svg>
                Kirim via WhatsApp
              </a>
            ) : (
              <p className="mt-5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200">
                Nomor WhatsApp customer belum tersedia. Salin tautan di atas dan kirim melalui
                kontak lain yang terverifikasi.
              </p>
            )}

            <button
              type="button"
              onClick={() => setLinkDialog(null)}
              className="mt-3 w-full rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(rejectTarget)}
        title="Tolak permintaan reset?"
        description={
          rejectTarget ? (
            <>
              Permintaan dari{' '}
              <span className="font-semibold text-white/80">
                {rejectTarget.accountName || rejectTarget.accountEmail}
              </span>{' '}
              akan ditolak dan tautan reset yang pernah dibuat tidak berlaku. Customer harus
              mengajukan permintaan baru jika masih membutuhkan bantuan.
            </>
          ) : null
        }
        confirmLabel="Ya, tolak permintaan"
        cancelLabel="Batal"
        tone="danger"
        busy={Boolean(busyId)}
        onConfirm={handleReject}
        onCancel={() => setRejectTarget(null)}
      />
    </div>
  );
}
