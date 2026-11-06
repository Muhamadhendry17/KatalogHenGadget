import { Link } from 'react-router-dom';
import { useCatalog } from '../../contexts/CatalogContext';
import { useFormatCurrency } from '../../contexts/CurrencyContext';

const statCards = [
  {
    key: 'products',
    label: 'Total produk',
    hint: 'Produk di katalog toko',
    accent: 'from-cyan-400/20 to-sky-500/5 text-cyan-300 border-cyan-400/20',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  },
  {
    key: 'categories',
    label: 'Kategori',
    hint: 'Kelompok produk aktif',
    accent: 'from-indigo-400/20 to-violet-500/5 text-indigo-300 border-indigo-400/20',
    icon: 'M4 6h16M4 12h16M4 18h10',
  },
  {
    key: 'outOfStock',
    label: 'Stok habis',
    hint: 'Perlu segera diisi ulang',
    accent: 'from-red-400/20 to-orange-500/5 text-red-300 border-red-400/20',
    icon: 'M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  },
  {
    key: 'featured',
    label: 'Produk unggulan',
    hint: 'Tampil di beranda',
    accent: 'from-amber-400/20 to-yellow-500/5 text-amber-300 border-amber-400/20',
    icon: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2z',
  },
];

export default function AdminDashboard() {
  const formatCurrency = useFormatCurrency();
  const { products, categories, loading, refresh } = useCatalog();

  const outOfStock = products.filter((product) => product.stockStatus === 'Habis');
  const featured = products.filter((product) => product.featured);
  const averageRating = products.length
    ? products.reduce((total, product) => total + Number(product.rating || 0), 0) / products.length
    : 0;

  const stats = {
    products: products.length,
    categories: categories.length,
    outOfStock: outOfStock.length,
    featured: featured.length,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">Ringkasan</span>
          <h1 className="mt-2 text-3xl font-extrabold text-white md:text-4xl">Selamat datang kembali 👋</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/50">
            Pantau katalog, stok, kategori, dan pengaturan toko dari satu tempat.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M20 11a8 8 0 10-2.3 5.7M20 5v6h-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Segarkan data
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.key}
            className={`rounded-2xl border bg-gradient-to-br p-5 ${card.accent}`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d={card.icon} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-3xl font-extrabold text-white">{stats[card.key]}</span>
            </div>
            <p className="mt-4 text-sm font-semibold text-white">{card.label}</p>
            <p className="mt-0.5 text-[11px] text-white/45">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">Produk terbaru</h2>
              <p className="text-xs text-white/40">5 produk terakhir yang ditambahkan ke katalog.</p>
            </div>
            <Link to="/admin/products" className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
              Kelola produk →
            </Link>
          </div>

          {loading && !products.length ? (
            <div className="py-10 text-center text-sm text-white/40">Memuat produk...</div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center">
              <p className="text-sm text-white/50">Belum ada produk.</p>
              <Link to="/admin/products" className="mt-3 inline-block text-sm font-semibold text-cyan-300">
                Tambah produk pertama
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/35">
                    <th className="pb-3 font-semibold">Produk</th>
                    <th className="pb-3 font-semibold">Kategori</th>
                    <th className="pb-3 font-semibold">Harga</th>
                    <th className="pb-3 font-semibold">Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0, 5).map((product) => (
                    <tr key={product.id} className="border-b border-white/5 last:border-0">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-3">
                          <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-[#eef1f3] to-[#c4c9ce]">
                            <img src={product.image} alt="" className="h-full w-full object-cover" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">{product.name}</p>
                            <p className="text-[11px] text-white/35">{product.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-white/55">{product.categoryName || '—'}</td>
                      <td className="py-3 pr-3 text-white/75">{formatCurrency(product.price)}</td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            product.stockStatus === 'Habis'
                              ? 'bg-red-500/15 text-red-300'
                              : 'bg-emerald-500/15 text-emerald-300'
                          }`}
                        >
                          {product.stockStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <h2 className="text-lg font-bold text-white">Kualitas katalog</h2>
            <p className="mt-1 text-xs text-white/40">Rata-rata rating produk saat ini.</p>
            <div className="mt-5 flex items-end gap-3">
              <span className="text-4xl font-extrabold text-white">{averageRating.toFixed(1)}</span>
              <span className="mb-1 text-sm text-amber-400">★★★★★</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
                style={{ width: `${(averageRating / 5) * 100}%` }}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-white">Perlu perhatian</h2>
              <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-bold text-red-300">
                {outOfStock.length}
              </span>
            </div>
            {outOfStock.length === 0 ? (
              <p className="mt-4 text-sm text-white/45">Semua produk tersedia. Stok aman 🎉</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {outOfStock.slice(0, 4).map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-white/70">{product.name}</span>
                    <Link to="/admin/products" className="shrink-0 text-[11px] font-semibold text-cyan-300">
                      Atur
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.06] p-5 sm:p-6">
            <h2 className="text-sm font-bold text-cyan-200">Aksi cepat</h2>
            <div className="mt-3 grid gap-2">
              <Link
                to="/admin/products"
                className="rounded-xl bg-cyan-400 px-4 py-2.5 text-center text-xs font-bold text-[#04111c] transition-colors hover:bg-cyan-300"
              >
                + Tambah produk
              </Link>
              <Link
                to="/admin/categories"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-xs font-semibold text-white/70 transition-colors hover:text-white"
              >
                Kelola kategori
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
