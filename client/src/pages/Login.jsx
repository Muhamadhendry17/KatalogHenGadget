import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthShell from '../components/AuthShell';
import { apiUrl } from '../lib/api';

export default function Login() {
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
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Login gagal');

      login({
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        token: data.token,
      });
      navigate(data.user.role === 'admin' ? '/admin' : (location.state?.from || '/'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Masuk ke HenGadget"
      title="Selamat datang kembali"
      subtitle="Masuk untuk menyimpan favorit dan mempercepat proses checkout."
      footer={
        <p className="text-center text-sm text-white/50">
          Belum punya akun?{' '}
          <Link to="/register" className="font-semibold text-cyan-400 transition-colors hover:text-cyan-300">
            Daftar di sini
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
          <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-white/70">
            Email
          </label>
          <input
            id="login-email"
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
            <label htmlFor="login-password" className="text-sm font-medium text-white/70">
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
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className="input-field"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Memproses...' : 'Masuk'}
        </button>

        <p className="mt-4 text-center text-sm text-white/40">
          Lupa kata sandi?{' '}
          <Link to="/lupa-kata-sandi" className="font-semibold text-cyan-400 transition-colors hover:text-cyan-300">
            Atur ulang di sini
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
