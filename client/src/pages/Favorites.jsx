import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { useCatalog } from '../contexts/CatalogContext';
import { useFavorites } from '../contexts/FavoritesContext';

export default function FavoritesPage() {
  const { products, loading } = useCatalog();
  const { favoriteIds, count, clearFavorites } = useFavorites();

  const favorites = favoriteIds
    .map((id) => products.find((product) => product.id === id))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#070b14]">
      <Navbar />

      <main className="pb-20 pt-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-8 flex items-center gap-2 text-xs text-white/35" aria-label="Breadcrumb">
            <Link to="/" className="transition-colors hover:text-cyan-300">
              Beranda
            </Link>
            <span>/</span>
            <span className="text-white/60">Favorit</span>
          </nav>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                Disimpan untuk nanti
              </span>
              <h1 className="mt-2 text-3xl font-extrabold text-white md:text-4xl">
                Favorit Saya
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/50">
                {count > 0
                  ? `${count} handphone tersimpan. Klik ikon hati untuk menambah atau menghapus.`
                  : 'Tandai handphone dengan ikon hati agar mudah ditemukan kembali di sini.'}
              </p>
            </div>

            {count > 0 && (
              <button
                type="button"
                onClick={clearFavorites}
                className="self-start rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/60 transition-colors hover:border-red-400/30 hover:text-red-300 sm:self-auto"
              >
                Hapus semua
              </button>
            )}
          </div>

          {loading && favorites.length === 0 ? (
            <div className="mt-10 flex items-center gap-3 text-sm text-white/60">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              Memuat katalog...
            </div>
          ) : favorites.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {favorites.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] py-20 text-center">
              <div className="mb-4 text-5xl">💙</div>
              <h2 className="text-xl font-bold text-white">Belum ada favorit</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-white/45">
                Jelajahi katalog dan tekan ikon hati pada handphone yang kamu suka.
                Daftarnya akan tersimpan di perangkat ini.
              </p>
              <Link
                to="/catalog"
                className="mt-6 inline-flex rounded-xl bg-cyan-500 px-6 py-3 font-bold text-[#04111c] transition-colors hover:bg-cyan-400"
              >
                Jelajahi Katalog
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
