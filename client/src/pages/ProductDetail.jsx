import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { useCart } from '../contexts/CartContext';
import { useCatalog } from '../contexts/CatalogContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useFormatCurrency } from '../contexts/CurrencyContext';
import { getColorEffect } from '../data/products';
import { assetUrl } from '../lib/api';
import { normalizeWhatsAppNumber } from '../lib/phone';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [toast, setToast] = useState('');
  const { products, getProductById, loading, settings } = useCatalog();
  const formatCurrency = useFormatCurrency();

  const product = getProductById(id);

  if (loading && !product) {
    return (
      <div className="min-h-screen bg-[#070b14]">
        <Navbar />
        <div className="min-h-[70vh] flex items-center justify-center px-4 pt-20">
          <div className="flex items-center gap-3 text-sm text-white/60">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            Memuat produk...
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#070b14]">
        <Navbar />
        <div className="min-h-[70vh] flex items-center justify-center px-4 pt-20">
          <div className="glass-panel p-12 text-center max-w-md w-full">
            <div className="text-5xl mb-4">📵</div>
            <h2 className="text-2xl font-bold text-white mb-3">Produk tidak ditemukan</h2>
            <p className="text-white/50 text-sm mb-6">
              Handphone yang kamu cari mungkin sudah tidak ada di katalog.
            </p>
            <Link
              to="/catalog"
              className="inline-flex rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#04111c] font-bold px-6 py-3 transition-colors"
            >
              Kembali ke Katalog
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const variants = product.variants?.length ? product.variants : [{ storage: '', price: product.price, stock: product.stock, color: product.colors?.[0], colorName: product.colorNames?.[0] || 'Default' }];
  const activeVariant = variants[selectedVariant] || variants[0];
  const activeColor = variants.length ? (product.colors[selectedColor] || product.colors[0]) : activeVariant.color;
  const activeColorName = product.colorNames?.[selectedColor] || activeVariant.colorName || 'Warna pilihan';
  const colorEffect = getColorEffect(activeColor, selectedColor > 0 || variants.length > 1);

  // Warna dan penyimpanan adalah dua pilihan terpisah. Jangan saling
  // mengubah indeks, karena dulu memilih warna ikut memindahkan storasi
  // (dan sebaliknya) sehingga dua tombol terlihat terpilih bersamaan.
  const chooseVariant = (index) => {
    setSelectedVariant(index);
  };

  const chooseColor = (index) => {
    setSelectedColor(index);
  };

  const related = products
    .filter((item) => item.id !== product.id)
    .sort((a, b) => b.releaseYear - a.releaseYear)
    .slice(0, 3);

  const saved = isFavorite(product.id);

  const whatsappUrl =
    `https://wa.me/${normalizeWhatsAppNumber(settings.phone)}?text=` +
    encodeURIComponent(
      `Halo HenGadget, saya ingin menanyakan ketersediaan dan kesiapan ${product.name} (${activeVariant.storage ? activeVariant.storage + ' - ' : ''}${activeColorName}). Apakah stoknya tersedia dan siap dikirim?`
    );

  const handleAddToCart = () => {
    if (product.stockStatus === 'Habis' || (activeVariant.stock != null && activeVariant.stock <= 0)) return;
    addItem({ ...product, price: activeVariant.price, varian: `${activeVariant.storage || ''} ${activeColorName || ''}`.trim() });
    setToast(`${product.name} ditambahkan ke keranjang`);
    window.setTimeout(() => setToast(''), 3000);
  };

  const handleBuyNow = () => {
    if (product.stockStatus === 'Habis' || (activeVariant.stock != null && activeVariant.stock <= 0)) return;
    addItem({ ...product, price: activeVariant.price, varian: `${activeVariant.storage || ''} ${activeColorName || ''}`.trim() });
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-[#070b14]">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-xs text-white/35 flex items-center gap-2 mb-8" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-cyan-300 transition-colors">Beranda</Link>
            <span>/</span>
            <Link to="/catalog" className="hover:text-cyan-300 transition-colors">Katalog</Link>
            <span>/</span>
            <span className="text-white/60">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14">
            <div>
              <div className="relative rounded-3xl border border-white/10 overflow-hidden bg-gradient-to-br from-[#eef1f3] via-[#dfe3e6] to-[#c4c9ce]">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                  style={{ background: colorEffect.glow, opacity: selectedColor > 0 ? 1 : 0 }}
                />
                <img
                  src={assetUrl(product.image)}
                  alt={`${product.name} warna ${activeColorName}`}
                  className="relative w-full h-[340px] sm:h-[440px] object-contain transition-[filter] duration-500"
                  style={{ filter: colorEffect.filter }}
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                  style={{
                    backgroundColor: activeColor,
                    mixBlendMode: 'hue',
                    opacity: colorEffect.hueOpacity,
                  }}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                  style={{
                    backgroundColor: activeColor,
                    mixBlendMode: 'color',
                    opacity: colorEffect.tintOpacity,
                  }}
                />
                <span className="absolute top-4 left-4 rounded-md bg-black/70 backdrop-blur px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                  {product.tag}
                </span>
                {product.badges?.length && (
                  <div className="absolute top-12 right-4 flex flex-col gap-1.5">
                    {product.badges.map((badge, idx) => {
                      const variant =
                        badge === 'Promo'
                          ? 'bg-emerald-500 text-emerald-900'
                          : badge === 'Best Seller'
                            ? 'bg-amber-500 text-[#04111c]'
                            : 'bg-cyan-500 text-[#04111c]';
                      return (
                        <span
                          key={idx}
                          className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md ${variant}`}
                        >
                          {badge}
                        </span>
                      );
                    })}
                  </div>
                )}
                <span className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-black/55 backdrop-blur px-3 py-1.5 text-[11px] font-semibold text-white/85">
                  <span
                    className="w-3 h-3 rounded-full border border-white/40"
                    style={{ backgroundColor: activeColor }}
                  />
                  {activeColorName}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider">Pilih warna</p>
                  <p className="text-white text-sm font-medium">{activeColorName}</p>
                  <p className="text-white/35 text-[11px] mt-0.5">
                    Gambar menyesuaikan warna yang dipilih
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {product.colors.map((color, index) => (
                    <button
                      key={color}
                      onClick={() => chooseColor(index)}
                      aria-label={`Warna ${product.colorNames?.[index] || index + 1}`}
                      aria-pressed={selectedColor === index}
                      title={product.colorNames?.[index] || color}
                      className={`relative w-9 h-9 rounded-full border-2 transition-all ${
                        selectedColor === index
                          ? 'border-cyan-400 scale-110 shadow-[0_0_0_3px_rgba(34,211,238,0.15)]'
                          : 'border-white/20 hover:border-white/50'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {selectedColor === index && (
                        <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {product.variants?.length && product.variants.length > 1 && (
                <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
                  <div>
                    <p className="text-white/40 text-[10px] uppercase tracking-wider">Pilih varian penyimpanan</p>
                    <p className="text-white text-sm font-medium">{activeVariant.storage}</p>
                    <p className="text-white/35 text-[11px] mt-0.5">
                      Penyimpanan memengaruhi harga akhir
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {variants.map((variant, index) => (
                      <button
                        key={variant.storage}
                        onClick={() => chooseVariant(index)}
                        aria-pressed={selectedVariant === index}
                        className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
                          selectedVariant === index
                            ? 'border-cyan-400 bg-cyan-400/20 text-white'
                            : 'border-white/10 text-white/50 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {variant.storage}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-cyan-300 text-xs font-bold uppercase tracking-[0.18em]">
                  {product.brand}
                </span>
                <button
                  type="button"
                  onClick={() => toggleFavorite(product.id)}
                  aria-pressed={saved}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    saved
                      ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-300'
                      : 'border-white/15 text-white/55 hover:border-cyan-400/40 hover:text-cyan-300'
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
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
                  {saved ? 'Tersimpan' : 'Simpan favorit'}
                </button>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
                {product.name}
              </h1>
              <p className="text-white/55 mt-3 leading-relaxed">{product.description}</p>

              <div className="mt-6 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] px-5 py-4">
                <span className="block text-white/40 text-[10px] uppercase tracking-wider">Harga</span>
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-extrabold text-white">{formatCurrency(activeVariant.price)}</span>
                  {product.originalPrice && product.originalPrice > activeVariant.price && (
                    <span className="text-white/35 text-sm line-through">
                      {formatCurrency(product.originalPrice)}
                    </span>
                  )}
                </div>
                <p className="text-cyan-300/80 text-xs mt-2">
                  Harga mengikuti harga pasar terkini. Ketersediaan dan harga final dikonfirmasi lewat WhatsApp.
                </p>
                <p className="mt-2 text-xs">
                  <span
                    className={`rounded-full px-2.5 py-1 font-bold ${
                      product.stockStatus === 'Habis' || Number(activeVariant.stock) <= 0
                        ? 'bg-red-500/15 text-red-300'
                        : 'bg-emerald-500/15 text-emerald-300'
                    }`}
                  >
                    {product.stockStatus === 'Habis' || Number(activeVariant.stock) <= 0
                      ? 'Stok habis'
                      : `Stok tersedia: ${activeVariant.stock ?? product.stock} unit`}
                  </span>
                </p>
              </div>

              <div className="mt-6 space-y-2.5">
                {product.highlights.map((highlight) => (
                  <div key={highlight} className="flex items-start gap-2.5 text-sm text-white/70">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-cyan-400/15 text-cyan-300 flex items-center justify-center text-[10px] shrink-0">
                      ✓
                    </span>
                    {highlight}
                  </div>
                ))}
              </div>

              <div className="mt-8 grid sm:grid-cols-2 gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stockStatus === 'Habis' || (activeVariant.stock != null && activeVariant.stock <= 0)}
                  className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#04111c] font-bold py-3.5 px-5 transition-colors disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
                >
                  {product.stockStatus === 'Habis' || (activeVariant.stock != null && activeVariant.stock <= 0) ? 'Stok Habis' : 'Tambahkan ke Keranjang'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.stockStatus === 'Habis' || (activeVariant.stock != null && activeVariant.stock <= 0)}
                  className="rounded-xl border border-white/15 text-white font-bold py-3.5 px-5 hover:bg-white/5 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Beli Langsung
                </button>
              </div>

              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20 font-semibold text-sm py-3 px-5 text-center transition-colors"
                >
                  Tanya stok via WhatsApp
                </a>
                <button
                  onClick={() => navigate(`/compare?p1=${product.id}`)}
                  className="rounded-xl border border-white/15 text-white/75 hover:text-white hover:bg-white/5 font-semibold text-sm py-3 px-5 transition-colors"
                >
                  Bandingkan handphone
                </button>
              </div>
            </div>
          </div>

          <section className="mt-14 grid lg:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <h2 className="text-xl font-bold text-white mb-5">Spesifikasi lengkap</h2>
              <div className="space-y-3">
                {product.specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex justify-between gap-6 text-sm border-b border-white/5 pb-3 last:border-0 last:pb-0"
                  >
                    <span className="text-white/45">{spec.label}</span>
                    <span className="text-white/85 text-right font-medium">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
              <h2 className="text-xl font-bold text-white mb-5">Cocok untuk</h2>
              <div className="space-y-4">
                <div className="rounded-2xl bg-white/[0.04] border border-white/5 p-4">
                  <p className="text-white font-semibold text-sm">Performa harian</p>
                  <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-cyan-400" style={{ width: `${product.performanceScore}%` }}></div>
                  </div>
                  <p className="text-white/40 text-xs mt-1.5">Skor performa {product.performanceScore}/100</p>
                </div>
                <div className="rounded-2xl bg-white/[0.04] border border-white/5 p-4">
                  <p className="text-white font-semibold text-sm">Kualitas kamera</p>
                  <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${product.cameraScore}%` }}></div>
                  </div>
                  <p className="text-white/40 text-xs mt-1.5">Skor kamera {product.cameraScore}/100</p>
                </div>
                <div className="rounded-2xl bg-white/[0.04] border border-white/5 p-4 text-sm text-white/60">
                  Rilis {product.releaseYear} · {product.specs.find((spec) => spec.label === 'Baterai')?.value}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-16">
            <div className="flex items-end justify-between gap-4 mb-6">
              <h2 className="text-2xl font-extrabold text-white">Mungkin kamu juga suka</h2>
              <Link to="/catalog" className="text-sm text-cyan-300 hover:text-cyan-200 font-semibold">
                Lihat semua →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} compact />
              ))}
            </div>
          </section>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-fade-in">
          <div className="rounded-2xl border border-emerald-400/30 bg-[#0b1a16] px-5 py-4 shadow-2xl flex items-center gap-4">
            <span className="w-9 h-9 rounded-full bg-emerald-400/15 text-emerald-300 flex items-center justify-center text-sm">
              ✓
            </span>
            <div className="flex-1">
              <p className="text-white text-sm font-semibold">{toast}</p>
              <Link to="/cart" className="text-emerald-300 text-xs font-semibold hover:text-emerald-200">
                Buka keranjang →
              </Link>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
