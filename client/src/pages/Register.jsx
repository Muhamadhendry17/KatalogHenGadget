import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthShell from '../components/AuthShell';
import { apiUrl } from '../lib/api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Pendaftaran gagal');

      login({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        token: data.token,
      });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Gabung HenGadget"
      title="Buat akun baru"
      subtitle="Simpan handphone favorit dan lanjutkan belanja lebih cepat."
      footer={
        <p className="text-center text-sm text-white/50">
          Sudah punya akun?{' '}
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="register-name" className="mb-2 block text-sm font-medium text-white/70">
            Nama Lengkap
          </label>
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            className="input-field"
            placeholder="Masukkan nama Anda"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="register-email" className="mb-2 block text-sm font-medium text-white/70">
            Email
          </label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            className="input-field"
            placeholder="email@contoh.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="register-password" className="text-sm font-medium text-white/70">
              Kata Sandi
            </label>
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="text-[11px] font-medium text-cyan-400/80 transition-colors hover:text-cyan-300"
            >
              {showPassword ? 'Sembunyikan' : 'Tampilkan'}
            </button>
          </div>
          <input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className="input-field"
            placeholder="Minimal 8 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Memproses...' : 'Daftar'}
        </button>
      </form>

      <p className="mt-4 text-center text-[10px] leading-relaxed text-white/30">
        Dengan mendaftar, kamu menyetujui{' '}
        <Link to="/info/panduan-membeli" className="text-cyan-400/70 hover:text-cyan-300">
          panduan pembelian
        </Link>{' '}
        HenGadget.
      </p>
    </AuthShell>
  );
}
