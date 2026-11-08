import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useFormatCurrency } from '../contexts/CurrencyContext';
import { assetUrl } from '../lib/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function CartPage() {
  const { items, updateQty, removeItem, clearCart, total, totalItems } = useCart();
  const formatCurrency = useFormatCurrency();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 pt-24 pb-20">
          <div className="glass-panel p-12 text-center max-w-md w-full">
            <div className="w-16 h-16 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mx-auto mb-5 text-2xl">
              🛒
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Keranjang masih kosong</h2>
            <p className="text-white/45 mb-8">
              Belum ada handphone yang ditambahkan. Mulai dari katalog pilihan kami.
            </p>
            <Link
              to="/catalog"
              className="inline-flex rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#04111c] font-bold px-6 py-3 transition-colors"
            >
              Lihat katalog
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-xs text-white/35 flex items-center gap-2 mb-8" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-cyan-300 transition-colors">Beranda</Link>
            <span>/</span>
            <span className="text-white/60">Keranjang</span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Keranjang belanja</h1>
              <p className="text-white/45 text-sm mt-1">{totalItems} item siap di-checkout</p>
            </div>
            <button
              onClick={clearCart}
              className="text-red-300 hover:text-red-200 text-sm font-medium transition-colors"
            >
              Kosongkan keranjang
            </button>
          </div>

          <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.cartKey}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col sm:flex-row gap-4"
                >
                  <Link
                    to={`/product/${item.id}`}
                    className="w-full sm:w-28 h-28 rounded-xl overflow-hidden bg-gradient-to-br from-[#eef1f3] via-[#dfe3e6] to-[#c4c9ce] shrink-0"
                  >
                    <img
                      src={assetUrl(item.image)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                          {item.brand}
                        </p>
                        <Link
                          to={`/product/${item.id}`}
                          className="text-white font-bold hover:text-cyan-300 transition-colors"
                        >
                          {item.name}
                        </Link>
                        <p className="text-white/40 text-xs mt-1">
                          {[item.specs?.[0]?.value, item.specs?.[2]?.value]
                            .filter(Boolean)
                            .join(' · ') || 'Spesifikasi lengkap'}
                        </p>
                        {item.varian && (
                          <p className="text-cyan-300/80 text-xs mt-1">Varian: {item.varian}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.cartKey)}
                        className="text-white/30 hover:text-red-300 text-xs transition-colors"
                      >
                        Hapus
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(item.cartKey, item.qty - 1)}
                          className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10"
                          aria-label="Kurangi jumlah"
                        >
                          −
                        </button>
                        <span className="text-white text-sm font-semibold w-7 text-center">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.cartKey, item.qty + 1)}
                          className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10"
                          aria-label="Tambah jumlah"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-white/35 text-xs">{formatCurrency(item.price)} / unit</p>
                        <p className="text-white font-bold">{formatCurrency(item.price * item.qty)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:sticky lg:top-24">
              <h2 className="text-lg font-bold text-white mb-5">Ringkasan</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-white/50">
                  <span>Subtotal ({totalItems} item)</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Pengiriman</span>
                  <span>Dikonfirmasi admin</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between text-white font-bold text-base">
                  <span>Total</span>
                  <span className="text-cyan-300">{formatCurrency(total)}</span>
                </div>
              </div>

              <Link
                to="/checkout"
                className="mt-6 flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#04111c] font-extrabold py-3.5 transition-colors"
              >
                Checkout via WhatsApp
              </Link>

              <Link
                to="/catalog"
                className="mt-3 flex items-center justify-center w-full rounded-xl border border-white/15 text-white/70 hover:text-white hover:bg-white/5 text-sm font-semibold py-3 transition-colors"
              >
                Lanjut belanja
              </Link>

              <p className="text-white/35 text-xs mt-4 leading-relaxed">
                Harga masih berupa contoh. Ketersediaan, harga final, dan ongkir
                dikonfirmasi melalui WhatsApp sebelum pembayaran.
              </p>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
