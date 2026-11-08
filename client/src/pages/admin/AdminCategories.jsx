import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCatalog } from '../../contexts/CatalogContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import { apiRequest } from '../../lib/api';

export default function AdminCategories() {
  const { user } = useAuth();
  const { categories, refresh } = useCatalog();
  const token = user?.token;

  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const resetMessages = () => {
    setError('');
    setNotice('');
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    resetMessages();
    try {
      await apiRequest('/api/categories', {
        method: 'POST',
        body: { name: name.trim() },
        token,
      });
      await refresh();
      setName('');
      setNotice('Kategori berhasil ditambahkan.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    setEditingName(category.name);
    resetMessages();
  };

  const cancelEdit = () => {
    setEditingId('');
    setEditingName('');
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editingName.trim()) return;
    setBusyId(editingId);
    resetMessages();
    try {
      await apiRequest(`/api/categories/${editingId}`, {
        method: 'PUT',
        body: { name: editingName.trim() },
        token,
      });
      await refresh();
      cancelEdit();
      setNotice('Kategori berhasil diperbarui.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId('');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const category = deleteTarget;
    setBusyId(category.id);
    resetMessages();
    try {
      await apiRequest(`/api/categories/${category.id}`, { method: 'DELETE', token });
      await refresh();
      setNotice('Kategori berhasil dihapus.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId('');
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">Katalog</span>
        <h1 className="mt-2 text-3xl font-extrabold text-white">Kelola kategori</h1>
        <p className="mt-2 text-sm text-white/45">
          Kategori membantu merapikan produk. Kategori yang masih dipakai tidak bisa dihapus.
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

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <section className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-sm font-bold text-white">Tambah kategori baru</h2>
          <p className="mt-1 text-xs text-white/40">Gunakan nama singkat dan jelas.</p>
          <form onSubmit={handleCreate} className="mt-4 space-y-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="input-field"
              placeholder="Contoh: Tablet"
              required
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-[#04111c] transition-colors hover:bg-cyan-300 disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Tambah kategori'}
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h2 className="text-sm font-bold text-white">Daftar kategori</h2>
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-white/50">
              {categories.length} kategori
            </span>
          </div>

          <ul className="divide-y divide-white/5">
            {categories.map((category) => (
              <li key={category.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                {editingId === category.id ? (
                  <form onSubmit={handleUpdate} className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      className="input-field py-2 text-sm"
                      autoFocus
                      required
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={busyId === category.id}
                        className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-[#04111c] disabled:opacity-60"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/60"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="min-w-0">
                      <p className="font-semibold text-white">{category.name}</p>
                      <p className="text-[11px] text-white/35">
                        slug: {category.slug || '—'} · {category.productCount ?? 0} produk
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(category)}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(category)}
                        disabled={busyId === category.id || (category.productCount ?? 0) > 0}
                        title={
                          (category.productCount ?? 0) > 0
                            ? 'Pindahkan atau hapus produk di kategori ini terlebih dahulu'
                            : 'Hapus kategori'
                        }
                        className="rounded-lg border border-red-400/20 px-3 py-1.5 text-xs font-semibold text-red-300/80 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Hapus
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
            {categories.length === 0 && (
              <li className="px-5 py-12 text-center text-sm text-white/40">Belum ada kategori.</li>
            )}
          </ul>
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus kategori ini?"
        description={
          deleteTarget ? (
            <>
              Kategori <span className="font-semibold text-white/80">"{deleteTarget.name}"</span>{' '}
              akan dihapus dari katalog. Kategori yang masih dipakai produk tidak bisa dihapus.
            </>
          ) : null
        }
        confirmLabel="Ya, hapus kategori"
        cancelLabel="Batal"
        tone="danger"
        busy={Boolean(busyId)}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
