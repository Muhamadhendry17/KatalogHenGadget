import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import AuthShell from '../components/AuthShell';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = String(searchParams.get('token') || '').trim();

  const [mode, setMode] = useState(token ? 'checking' : 'invalid');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(
    token ? '' : 'Tautan reset tidak lengkap. Minta tautan baru ke admin.',
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    if (!token) {
      return () => {
        active = false;
      };
    }

    apiRequest(`/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`)
      .then(() => {
        if (active) setMode('form');
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
          setMode('invalid');
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: { token, newPassword },
      });
      setMode('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Reset kata sandi"
      title="Buat kata sandi baru"
      subtitle="Tautan ini hanya bisa dipakai sekali. Setelah tersimpan, masuk kembali dengan kata sandi baru."
      footer={
        <p className="text-center text-sm text-white/50">
          Butuh tautan baru?{' '}
          <Link
            to="/lupa-kata-sandi"
            className="font-semibold text-cyan-400 transition-colors hover:text-cyan-300"
          >
            Minta bantuan admin
          </Link>
        </p>
      }
    >
      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          <span aria-hidden="true">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {mode === 'checking' && (
        <div className="flex items-center justify-center gap-3 py-10 text-sm text-white/60">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          Memeriksa tautan reset...
        </div>
      )}

      {mode === 'invalid' && (
        <div className="py-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-300">
            !
          </div>
          <h3 className="mb-2 text-lg font-bold text-white">Tautan tidak berlaku</h3>
          <p className="mb-6 text-sm leading-relaxed text-white/55">
            Tautan reset sudah kedaluwarsa atau sudah pernah dipakai. Minta admin mengirim
            tautan baru melalui WhatsApp.
          </p>
          <Link
            to="/lupa-kata-sandi"
            className="inline-flex rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-[#04111c] transition-colors hover:bg-cyan-400"
          >
            Minta tautan baru
          </Link>
        </div>
      )}

      {mode === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/70">Kata sandi baru</label>
            <input
              type="password"
              autoComplete="new-password"
              className="input-field"
              placeholder="Minimal 8 karakter"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/70">
              Ulangi kata sandi baru
            </label>
            <input
              type="password"
              autoComplete="new-password"
              className="input-field"
              placeholder="Masukkan ulang kata sandi baru"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Menyimpan...' : 'Simpan kata sandi baru'}
          </button>
        </form>
      )}

      {mode === 'done' && (
        <div className="py-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
            ✓
          </div>
          <h3 className="mb-2 text-lg font-bold text-white">Kata sandi berhasil diubah</h3>
          <p className="mb-6 text-sm leading-relaxed text-white/55">
            Kata sandi baru sudah tersimpan. Silakan masuk untuk melanjutkan belanja.
          </p>
          <Link
            to="/login"
            className="inline-flex rounded-xl bg-cyan-500 px-6 py-3 text-sm font-bold text-[#04111c] transition-colors hover:bg-cyan-400"
          >
            Masuk
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
