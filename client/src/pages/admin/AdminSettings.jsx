import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCatalog } from '../../contexts/CatalogContext';
import { apiRequest } from '../../lib/api';

const emptySettings = {
  storeName: '',
  tagline: '',
  address: '',
  phone: '',
  currency: 'Rp.',
  activeWhatsApp: true,
};

export default function AdminSettings() {
  const { user } = useAuth();
  const { refresh } = useCatalog();
  const token = user?.token;

  const [settings, setSettings] = useState(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordNotice, setPasswordNotice] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest('/api/store')
      .then((response) => {
        if (active && response.data) setSettings({ ...emptySettings, ...response.data });
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const updateField = (field, value) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const updatePasswordField = (field, value) => {
    setPasswordForm((current) => ({ ...current, [field]: value }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordNotice('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Konfirmasi password baru tidak cocok.');
      return;
    }

    setPasswordSaving(true);
    try {
      const response = await apiRequest('/api/auth/password', {
        method: 'PUT',
        body: {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        token,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordNotice(response.message || 'Password berhasil diubah.');
    } catch (requestError) {
      setPasswordError(requestError.message);
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await apiRequest('/api/store', {
        method: 'PUT',
        body: settings,
        token,
      });
      setSettings({ ...emptySettings, ...response.data });
      await refresh();
      setNotice('Pengaturan toko berhasil disimpan.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">Toko</span>
        <h1 className="mt-2 text-3xl font-extrabold text-white">Pengaturan toko</h1>
        <p className="mt-2 text-sm text-white/45">
          Informasi ini dipakai untuk identitas toko dan kontak yang ditampilkan ke pembeli.
        </p>
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

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <h2 className="text-sm font-bold text-white">Identitas toko</h2>

          {loading ? (
            <div className="py-12 text-center text-sm text-white/40">Memuat pengaturan...</div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-white/60">Nama toko *</span>
                <input
                  required
                  value={settings.storeName}
                  onChange={(event) => updateField('storeName', event.target.value)}
                  className="input-field"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-white/60">Tagline</span>
                <input
                  value={settings.tagline}
                  onChange={(event) => updateField('tagline', event.target.value)}
                  className="input-field"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-white/60">Alamat</span>
                <textarea
                  rows={3}
                  value={settings.address}
                  onChange={(event) => updateField('address', event.target.value)}
                  className="input-field resize-y"
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-white/60">Nomor telepon / WhatsApp</span>
                <input
                  value={settings.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  className="input-field"
                  placeholder="6287777747462"
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-white/60">Simbol mata uang</span>
                <input
                  value={settings.currency}
                  onChange={(event) => updateField('currency', event.target.value)}
                  className="input-field"
                  placeholder="Rp."
                />
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={Boolean(settings.activeWhatsApp)}
                  onChange={(event) => updateField('activeWhatsApp', event.target.checked)}
                  className="h-4 w-4 accent-cyan-400"
                />
                <span>
                  <span className="block text-sm font-medium text-white/80">Aktifkan checkout WhatsApp</span>
                  <span className="block text-[11px] text-white/35">
                    Pembeli diarahkan ke WhatsApp untuk konfirmasi stok dan harga.
                  </span>
                </span>
              </label>
            </div>
          )}
        </section>

        <section className="h-fit space-y-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.05] p-5 sm:p-6">
          <h2 className="text-sm font-bold text-cyan-200">Ringkasan</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
              <dt className="text-white/45">Nama</dt>
              <dd className="truncate font-semibold text-white">{settings.storeName || '—'}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
              <dt className="text-white/45">Telepon</dt>
              <dd className="truncate font-semibold text-white">{settings.phone || '—'}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
              <dt className="text-white/45">Mata uang</dt>
              <dd className="font-semibold text-white">{settings.currency || '—'}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-white/45">WhatsApp</dt>
              <dd className="font-semibold text-white">
                {settings.activeWhatsApp ? 'Aktif' : 'Nonaktif'}
              </dd>
            </div>
          </dl>
          <button
            type="submit"
            disabled={saving || loading}
            className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-[#04111c] transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : 'Simpan pengaturan'}
          </button>
          <p className="text-[11px] leading-relaxed text-white/35">
            Pengaturan disimpan di server dan langsung dipakai saat halaman dimuat ulang.
          </p>
        </section>
      </form>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white">Keamanan akun</h2>
            <p className="mt-1 text-xs text-white/40">
              Gunakan password minimal 8 karakter dan jangan bagikan ke siapa pun.
            </p>
          </div>
          <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
            Admin
          </span>
        </div>

        {passwordError && (
          <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {passwordError}
          </div>
        )}
        {passwordNotice && (
          <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {passwordNotice}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="mt-5 grid gap-4 sm:grid-cols-3">
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-white/60">Password saat ini</span>
            <input
              type="password"
              autoComplete="current-password"
              value={passwordForm.currentPassword}
              onChange={(event) => updatePasswordField('currentPassword', event.target.value)}
              className="input-field"
              required
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-white/60">Password baru</span>
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={passwordForm.newPassword}
              onChange={(event) => updatePasswordField('newPassword', event.target.value)}
              className="input-field"
              required
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-white/60">Ulangi password baru</span>
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={passwordForm.confirmPassword}
              onChange={(event) => updatePasswordField('confirmPassword', event.target.value)}
              className="input-field"
              required
            />
          </label>
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={passwordSaving}
              className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-2.5 text-sm font-bold text-cyan-200 transition-colors hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {passwordSaving ? 'Menyimpan...' : 'Ubah password'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
