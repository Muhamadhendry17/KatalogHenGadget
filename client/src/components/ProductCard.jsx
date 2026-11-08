import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useFormatCurrency } from '../contexts/CurrencyContext';
import { assetUrl } from '../lib/api';

export default function ProductCard({ product, compact = false }) {
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const formatCurrency = useFormatCurrency();
  const navigate = useNavigate();
  const saved = isFavorite(product.id);

  // Default varian jika belum dipilih (dari halaman detail)
  const variants = product.variants || [{ storage: '', price: product.price, stock: product.stock, color: product.colors?.[0], colorName: product.colorNames?.[0] || 'Default' }];
  const selectedVariant = 0;
  const activeVariant = variants[selectedVariant] || variants[0];
  const activeColorName = product.colorNames?.[selectedVariant] || activeVariant.colorName || 'Warna pilihan';

  const toggleWishlist = (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(product.id);
  };

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (product.stockStatus === 'Habis') return;
    if (!product.variants || product.variants.length === 0) {
      addItem(product);
    } else {
      // Cek stok varian aktif
      const activeVariant = variants[selectedVariant] || variants[0];
      if (activeVariant.stock != null && activeVariant.stock <= 0) return;
      addItem({ ...product, price: activeVariant.price, varian: `${activeVariant.storage || ''} ${activeColorName || ''}`.trim() });
    }
    navigate('/cart');
  };

  const handleCompare = (event) => {
    event.preventDefault();
    event.stopPropagation();
    navigate(`/compare?p1=${product.id}`);
  };

  const openDetail = (event) => {
    if (event.target.closest('button, a')) return;
    navigate(`/product/${product.id}`);
  };

  return (
    <article
      onClick={openDetail}
      className="relative h-full rounded-3xl bg-[#0b0f17] border border-white/10 overflow-hidden group hover:border-cyan-400/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      <div className="relative h-60 overflow-hidden bg-gradient-to-br from-[#eef1f3] via-[#dfe3e6] to-[#c4c9ce]">
        <img
          src={assetUrl(product.image)}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />

        <div className="absolute inset-x-0 top-0 p-3 flex items-start justify-between gap-2">
          <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
            {product.tag}
          </span>
          <button
            type="button"
            onClick={toggleWishlist}
            aria-label={saved ? `Hapus ${product.name} dari simpanan` : `Simpan ${product.name}`}
            aria-pressed={saved}
            className={`w-9 h-9 rounded-full backdrop-blur border flex items-center justify-center transition-all hover:scale-110 ${
              saved
                ? 'bg-cyan-400 text-[#04111c] border-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.45)]'
                : 'bg-black/40 text-white border-white/20 hover:bg-black/60'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill={saved ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                d="M12 20s-7-4.35-7-9a4 4 0 017-2.65A4 4 0 0119 11c0 4.65-7 9-7 9z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {product.stockStatus === 'Habis' && (
          <span className="absolute bottom-3 left-3 rounded-md bg-red-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            Stok habis
          </span>
        )}

        {product.badges?.length && (
          <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
            {product.badges.map((badge, idx) => {
              const variant =
                badge === 'Promo'
                  ? 'bg-emerald-500/90 text-emerald-900'
                  : badge === 'Best Seller'
                    ? 'bg-amber-500/90 text-[#04111c]'
                    : 'bg-cyan-500/90 text-[#04111c]';
              return (
                <span
                  key={idx}
                  className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white ${variant}`}
                >
                  {badge}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-cyan-300 text-[10px] font-bold uppercase tracking-[0.16em]">
            {product.brand}
          </span>
          <span className="text-white/35 text-[11px] uppercase tracking-wider">
            {product.stockStatus === 'Habis' ? 'Stok habis' : 'Tersedia'}
          </span>
        </div>

        <h3 className="text-lg font-bold text-white leading-snug group-hover:text-cyan-300 transition-colors">
          {product.name}
        </h3>

        <p className="text-white/45 text-xs mt-1.5 line-clamp-2">
          {[product.specs?.[0]?.value, product.specs?.[1]?.value].filter(Boolean).join(' · ') ||
            'Spesifikasi lengkap'}
        </p>

        <div className="flex items-center gap-1.5 mt-3">
          {product.colors.map((color, colorIndex) => (
            <span
              key={color}
              className="w-3 h-3 rounded-full border border-white/25"
              style={{ backgroundColor: color }}
              title={product.colorNames?.[colorIndex] || color}
            />
          ))}
          {!compact && (
            <span className="ml-auto text-[10px] text-white/35 uppercase tracking-wider">
              {product.releaseYear}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <span className="block text-white/35 text-[10px] uppercase tracking-wider">
              Harga
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-white">
                {formatCurrency(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-[11px] text-white/40 line-through">
                  {formatCurrency(product.originalPrice)}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.stockStatus === 'Habis'}
            aria-label={`Tambah ${product.name} ke keranjang`}
            className="shrink-0 w-10 h-10 rounded-xl bg-cyan-500 hover:bg-cyan-400 flex items-center justify-center text-[#04111c] shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-colors disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none"
            title={product.stockStatus === 'Habis' ? 'Stok habis' : 'Tambah ke keranjang'}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {!compact && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              to={`/product/${product.id}`}
              onClick={(event) => event.stopPropagation()}
              className="rounded-lg border border-white/10 text-center text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 py-2 transition-colors"
            >
              Lihat detail
            </Link>
            <button
              type="button"
              onClick={handleCompare}
              className="rounded-lg border border-white/10 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 py-2 transition-colors"
            >
              Bandingkan
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
