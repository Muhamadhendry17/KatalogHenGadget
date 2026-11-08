import { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCatalog } from '../../contexts/CatalogContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import { apiRequest, assetUrl } from '../../lib/api';
import { useFormatCurrency } from '../../contexts/CurrencyContext';

const currentYear = new Date().getFullYear();

const emptyForm = {
  name: '',
  brand: '',
  tag: 'PILIHAN HENGADGET',
  featured: false,
  price: '',
  originalPrice: '',
  stock: 10,
  stockStatus: 'Tersedia',
  badges: '',
  variants: '',
  categoryId: '',
  description: '',
  imageurl: '',
  releaseYear: currentYear,
  isNew: true,
  performanceScore: 80,
  cameraScore: 80,
  colors: '#cbd5e1, #94a3b8',
  colorNames: 'Default, Alternatif',
  specs: 'Layar: \nKamera utama: \nProsesor: \nRAM / Penyimpanan: \nBaterai: \nKonektivitas: ',
  highlights: '',
};

const splitList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const splitLines = (value) =>
  String(value || '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const parseSpecs = (value) =>
  String(value || '')
    .split(/\r?\n/)
    .map((line) => {
      const separator = line.indexOf(':');
      if (separator === -1) return null;
      const label = line.slice(0, separator).trim();
      const specValue = line.slice(separator + 1).trim();
      return label && specValue ? { label, value: specValue } : null;
    })
    .filter(Boolean);

const parseVariants = (value) =>
  String(value || '')
    .split(/\r?\n/)
    .map((line) => {
      const parts = line.split('|');
      if (parts.length < 3) return null;
      return {
        storage: parts[0].trim() || null,
        price: Number(parts[1].trim()) || 0,
        stock: Number(parts[2].trim()) || 10,
        color: parts[3]?.trim() || '#cbd5e1',
        colorName: parts[4]?.trim() || 'Default',
      };
    })
    .filter(Boolean);

const toForm = (product) => ({
  name: product.name || '',
  brand: product.brand || '',
  tag: product.tag || '',
  featured: Boolean(product.featured),
  price: product.price ?? '',
  originalPrice: product.originalPrice ?? '',
  stock: product.stock ?? 10,
  stockStatus: product.stockStatus || 'Tersedia',
  badges: (product.badges || []).join(', '),
  variants: (product.variants || []).map((v) => `${v.storage || ''}|${v.price || ''}|${v.stock || ''}|${v.color || ''}|${v.colorName || ''}`).join('\n'),
  categoryId: product.categoryId || '',
  description: product.description || '',
  imageurl: product.image || '',
  releaseYear: product.releaseYear ?? currentYear,
  isNew: Boolean(product.isNew),
  performanceScore: product.performanceScore ?? 80,
  cameraScore: product.cameraScore ?? 80,
  colors: (product.colors || []).join(', '),
  colorNames: (product.colorNames || []).join(', '),
  specs: (product.specs || []).map((spec) => `${spec.label}: ${spec.value}`).join('\n'),
  highlights: (product.highlights || []).join('\n'),
});

function Modal({ title, subtitle, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm sm:items-center sm:p-8">
      <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0b111c] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-white/40">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5 sm:p-6">{children}</div>
        {footer && <div className="border-t border-white/10 p-5 sm:px-6">{footer}</div>}
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const { user } = useAuth();
  const { products, categories, refresh } = useCatalog();
  const formatCurrency = useFormatCurrency();
  const token = user?.token;

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery =
        !normalized ||
        product.name.toLowerCase().includes(normalized) ||
        product.brand.toLowerCase().includes(normalized);
      const matchesCategory =
        categoryFilter === 'all' || product.categoryId === categoryFilter;
      const matchesStock = stockFilter === 'all' || product.stockStatus === stockFilter;
      return matchesQuery && matchesCategory && matchesStock;
    });
  }, [products, query, categoryFilter, stockFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id || '',
      tag: 'PILIHAN HENGADGET',
    });
    setImageFile(null);
    setPreview('');
    setError('');
    setNotice('');
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm(toForm(product));
    setImageFile(null);
    setPreview('');
    setError('');
    setNotice('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setImageFile(null);
    setPreview('');
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    setImageFile(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const payload = new FormData();
      payload.append('name', form.name);
      payload.append('brand', form.brand);
      payload.append('tag', form.tag);
      payload.append('featured', String(form.featured));
      payload.append('price', form.price);
      payload.append('originalPrice', form.originalPrice);
      payload.append('stock', String(form.stock));
      payload.append('stockStatus', form.stockStatus);
      payload.append('badges', JSON.stringify(splitList(form.badges)));
      payload.append('variants', JSON.stringify(parseVariants(form.variants)));
      payload.append('categoryId', form.categoryId);
      payload.append('description', form.description);
      payload.append('releaseYear', String(form.releaseYear));
      payload.append('isNew', String(form.isNew));
      payload.append('performanceScore', String(form.performanceScore));
      payload.append('cameraScore', String(form.cameraScore));
      payload.append('colors', JSON.stringify(splitList(form.colors)));
      payload.append('colorNames', JSON.stringify(splitList(form.colorNames)));
      payload.append('specs', JSON.stringify(parseSpecs(form.specs)));
      payload.append('highlights', JSON.stringify(splitLines(form.highlights)));

      if (imageFile) payload.append('image', imageFile);
      else if (form.imageurl.trim()) payload.append('imageurl', form.imageurl.trim());

      await apiRequest(editing ? `/api/products/${editing.id}` : '/api/products', {
        method: editing ? 'PUT' : 'POST',
        body: payload,
        token,
      });

      await refresh();
      setNotice(editing ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.');
      setModalOpen(false);
      setEditing(null);
      setImageFile(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStock = async (product) => {
    setBusyId(product.id);
    setError('');
    setNotice('');
    try {
      await apiRequest(`/api/products/${product.id}`, { method: 'PATCH', token });
      await refresh();
      setNotice(`Stok ${product.name} diperbarui.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId('');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const product = deleteTarget;
    setBusyId(product.id);
    setError('');
    setNotice('');
    try {
      await apiRequest(`/api/products/${product.id}`, { method: 'DELETE', token });
      await refresh();
      setNotice(`"${product.name}" berhasil dihapus.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId('');
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">Katalog</span>
          <h1 className="mt-2 text-3xl font-extrabold text-white">Kelola produk</h1>
          <p className="mt-2 text-sm text-white/45">
            {products.length} produk tersimpan. Perubahan langsung tampil di storefront.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#04111c] transition-colors hover:bg-cyan-300"
        >
          <span className="text-lg leading-none">+</span>
          Tambah produk
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

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_200px_170px]">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama atau merek..."
            className="input-field"
          />
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="input-field"
          >
            <option value="all">Semua kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={stockFilter}
            onChange={(event) => setStockFilter(event.target.value)}
            className="input-field"
          >
            <option value="all">Semua stok</option>
            <option value="Tersedia">Tersedia</option>
            <option value="Habis">Habis</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.02] text-[10px] uppercase tracking-wider text-white/35">
              <tr>
                <th className="px-5 py-4 font-semibold">Produk</th>
                <th className="px-4 py-4 font-semibold">Kategori</th>
                <th className="px-4 py-4 font-semibold">Harga</th>
                <th className="px-4 py-4 font-semibold">Stok</th>
                <th className="px-4 py-4 font-semibold">Badge</th>
                <th className="px-4 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#eef1f3] to-[#c4c9ce]">
                        <img src={assetUrl(product.image)} alt="" className="h-full w-full object-cover" />
                      </span>
                      <div className="min-w-0">
                        <p className="max-w-[260px] truncate font-semibold text-white">{product.name}</p>
                        <p className="text-[11px] text-white/35">
                          {product.brand} · {product.releaseYear}
                          {product.featured ? ' · Unggulan' : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-white/55">{product.categoryName || '—'}</td>
                  <td className="px-4 py-4 font-medium text-white/80">{formatCurrency(product.price)}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors ${
                        product.stock === 0 || product.stockStatus === 'Habis'
                          ? 'bg-red-500/15 text-red-300'
                          : product.stock <= 5
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-emerald-500/15 text-emerald-300'
                      }`}
                    >
                      {product.stockStatus} ({product.stock})
                    </span>
                  </td>
                  <td className="px-4 py-4 text-white/55">
                    {product.badges?.length ? (
                      product.badges.map((b, i) => (
                        <span key={i} className="mr-1.5 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/70">
                          {b}
                        </span>
                      ))
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-white/55">
                    {product.featured ? (
                      <span className="rounded bg-cyan-400/15 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
                        Unggulan
                      </span>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleStock(product)}
                        disabled={busyId === product.id}
                        className={`rounded-full px-3 py-1 text-[10px] font-bold transition-colors disabled:opacity-50 ${
                          product.stockStatus === 'Habis'
                            ? 'bg-red-500/15 text-red-300 hover:bg-red-500/25'
                            : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                        }`}
                        title="Klik untuk mengubah status stok"
                      >
                        {product.stockStatus}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(product)}
                        disabled={busyId === product.id}
                        className="rounded-lg border border-red-400/20 px-3 py-1.5 text-xs font-semibold text-red-300/80 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <p className="text-sm text-white/50">Tidak ada produk yang cocok.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('');
                        setCategoryFilter('all');
                        setStockFilter('all');
                      }}
                      className="mt-3 text-xs font-semibold text-cyan-300"
                    >
                      Reset filter
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <Modal
          title={editing ? 'Edit produk' : 'Tambah produk'}
          subtitle="Data ini dipakai langsung oleh halaman katalog dan detail produk."
          onClose={closeModal}
          footer={
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-white/65 transition-colors hover:text-white disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                form="product-form"
                disabled={saving}
                className="rounded-xl bg-cyan-400 px-6 py-2.5 text-sm font-bold text-[#04111c] transition-colors hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Menyimpan...' : editing ? 'Simpan perubahan' : 'Simpan produk'}
              </button>
            </div>
          }
        >
          <form id="product-form" onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-white/60">Nama produk *</span>
                <input
                  required
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  className="input-field"
                  placeholder="Contoh: Samsung Galaxy S25 Ultra"
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-white/60">Merek</span>
                <input
                  value={form.brand}
                  onChange={(event) => updateField('brand', event.target.value)}
                  className="input-field"
                  placeholder="Samsung, Apple, Xiaomi..."
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-white/60">Kategori *</span>
                <select
                  required
                  value={form.categoryId}
                  onChange={(event) => updateField('categoryId', event.target.value)}
                  className="input-field"
                >
                  <option value="">Pilih kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-white/60">Harga (Rp) *</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="1000"
                  value={form.price}
                  onChange={(event) => updateField('price', event.target.value)}
                  className="input-field"
                  placeholder="19999000"
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-white/60">Harga Asli / Coret (Rp)</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={form.originalPrice}
                  onChange={(event) => updateField('originalPrice', event.target.value)}
                  className="input-field"
                  placeholder="Kosongkan jika tidak ada diskon"
                />
                <p className="mt-0.5 text-[10px] text-white/40">
                  Diisi jika ada promo. Akan ditampilkan dengan garis coret di halaman produk.
                </p>
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-white/60">Stok (integer)</span>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(event) => updateField('stock', event.target.value)}
                  className="input-field"
                  placeholder="10"
                />
                <p className="mt-0.5 text-[10px] text-white/40">
                  10 = tersedia, 0 = habis. Digunakan untuk toggle stok konsisten.
                </p>
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-white/60">Badge (pisahkan koma)</span>
                <input
                  value={form.badges}
                  onChange={(event) => updateField('badges', event.target.value)}
                  className="input-field"
                  placeholder="Promo, Best Seller, Baru"
                />
                <p className="mt-0.5 text-[10px] text-white/40">
                  Contoh: Promo, Best Seller, Baru. Tampilkan badge pada kartu produk.
                </p>
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-white/60">Varian (satu per baris, format: penyimpanan|harga|stok|warna|nama_warna)</span>
                <textarea
                  rows={4}
                  value={form.variants}
                  onChange={(event) => updateField('variants', event.target.value)}
                  className="input-field resize-y font-mono text-xs"
                />
                <p className="mt-0.5 text-[10px] text-white/40">
                  Contoh: 256 GB|19999000|10|#d4d4d8|Titanium Gray<br />
                  Varian memengaruhi harga yang ditampilkan pada halaman produk.
                </p>
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-white/60">Status stok</span>
                <select
                  value={form.stockStatus}
                  onChange={(event) => updateField('stockStatus', event.target.value)}
                  className="input-field"
                >
                  <option value="Tersedia">Tersedia</option>
                  <option value="Habis">Habis</option>
                </select>
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-white/60">Tag / label</span>
                <input
                  value={form.tag}
                  onChange={(event) => updateField('tag', event.target.value)}
                  className="input-field"
                  placeholder="FLAGSHIP KAMERA"
                />
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-white/60">Tahun rilis</span>
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={form.releaseYear}
                  onChange={(event) => updateField('releaseYear', event.target.value)}
                  className="input-field"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-white/60">Deskripsi</span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  className="input-field resize-y"
                  placeholder="Deskripsi singkat produk..."
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-white/60">Skor performa (0–100)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.performanceScore}
                  onChange={(event) => updateField('performanceScore', event.target.value)}
                  className="input-field"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-white/60">Skor kamera (0–100)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.cameraScore}
                  onChange={(event) => updateField('cameraScore', event.target.value)}
                  className="input-field"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-6 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-white/65">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) => updateField('featured', event.target.checked)}
                  className="h-4 w-4 accent-cyan-400"
                />
                Tampilkan sebagai produk unggulan
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-white/65">
                <input
                  type="checkbox"
                  checked={form.isNew}
                  onChange={(event) => updateField('isNew', event.target.checked)}
                  className="h-4 w-4 accent-cyan-400"
                />
                Tandai sebagai produk terbaru
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-white/60">Warna (hex, pisahkan koma)</span>
                <input
                  value={form.colors}
                  onChange={(event) => updateField('colors', event.target.value)}
                  className="input-field"
                  placeholder="#d4d4d8, #2d2d2d"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-white/60">Nama warna (pisahkan koma)</span>
                <input
                  value={form.colorNames}
                  onChange={(event) => updateField('colorNames', event.target.value)}
                  className="input-field"
                  placeholder="Titanium Gray, Titanium Black"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-white/60">
                Spesifikasi (satu per baris, format <code className="text-cyan-300">Label: Nilai</code>)
              </span>
              <textarea
                rows={6}
                value={form.specs}
                onChange={(event) => updateField('specs', event.target.value)}
                className="input-field resize-y font-mono text-xs"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-white/60">
                Keunggulan (satu per baris)
              </span>
              <textarea
                rows={3}
                value={form.highlights}
                onChange={(event) => updateField('highlights', event.target.value)}
                className="input-field resize-y"
              />
            </label>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="mb-3 text-xs font-semibold text-white/60">Gambar produk</p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#eef1f3] to-[#c4c9ce]">
                  {preview || form.imageurl ? (
                    <img src={assetUrl(preview || form.imageurl)} alt="Pratinjau" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-slate-500">Belum ada</span>
                  )}
                </span>
                <div className="min-w-0 flex-1 space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-xs text-white/50 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-white/15"
                  />
                  <input
                    value={form.imageurl}
                    onChange={(event) => updateField('imageurl', event.target.value)}
                    className="input-field text-xs"
                    placeholder="atau tempel URL gambar: /assets/figma/... atau https://..."
                  />
                </div>
              </div>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus produk ini?"
        description={
          deleteTarget ? (
            <>
              <span className="font-semibold text-white/80">"{deleteTarget.name}"</span> akan
              dihapus dari katalog. Produk yang sudah pernah dipesan tetap tersimpan di riwayat
              pesanan. Tindakan ini tidak bisa dibatalkan.
            </>
          ) : null
        }
        confirmLabel="Ya, hapus produk"
        cancelLabel="Batal"
        tone="danger"
        busy={Boolean(busyId)}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
