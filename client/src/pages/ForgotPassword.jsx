import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import AuthShell from '../components/AuthShell';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const data = await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: { email },
      });
      setNotice(
        data.message ||
          'Jika email terdaftar, permintaan reset telah dikirim ke admin. Admin akan menghubungi Anda via WhatsApp.',
      );
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Lupa kata sandi"
      title="Minta bantuan reset"
      subtitle="Masukkan email akun Anda. Admin akan memverifikasi dan mengirim tautan reset melalui WhatsApp."
      footer={
        <p className="text-center text-sm text-white/50">
          Ingat kata sandi?{' '}
          <Link to="/login" className="font-semibold text-cyan-400 transition-colors hover:text-cyan-300">
            Masuk di sini
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

      {sent ? (
        <div className="py-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
            ✓
          </div>
          <h3 className="mb-2 text-lg font-bold text-white">Permintaan diterima</h3>
          <p className="mb-5 text-sm leading-relaxed text-white/55">
            {notice}
          </p>
          <div className="mb-6 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] px-4 py-3 text-left text-xs leading-relaxed text-cyan-100/70">
            <p className="font-semibold text-cyan-200">Apa yang terjadi selanjutnya?</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>Admin menerima permintaan reset Anda.</li>
              <li>Admin memverifikasi melalui WhatsApp.</li>
              <li>Anda menerima tautan untuk membuat kata sandi baru.</li>
            </ol>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setNotice('');
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              Kirim permintaan lagi
            </button>
            <Link
              to="/login"
              className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-[#04111c] transition-colors hover:bg-cyan-400"
            >
              Kembali ke halaman masuk
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleRequest} className="space-y-4">
          <div>
            <label htmlFor="forgot-email" className="mb-2 block text-sm font-medium text-white/70">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              className="input-field"
              placeholder="email@contoh.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Mengirim permintaan...' : 'Minta bantuan reset'}
          </button>
          <p className="text-center text-[11px] leading-relaxed text-white/35">
            Demi keamanan, kami tidak menampilkan token atau kata sandi di halaman ini.
          </p>
        </form>
      )}
    </AuthShell>
  );
}
