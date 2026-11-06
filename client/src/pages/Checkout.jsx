import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useCatalog } from '../contexts/CatalogContext';
import { useFormatCurrency } from '../contexts/CurrencyContext';
import { formatPhoneNumber, normalizeWhatsAppNumber } from '../lib/phone';
import Logo from '../components/Logo';

export default function CheckoutPage() {
  const { items, total, totalItems, clearCart, updateQty, removeItem } = useCart();
  const { settings } = useCatalog();
  const formatCurrency = useFormatCurrency();
  const whatsappNumber = normalizeWhatsAppNumber(settings.phone);
  const displayPhone = formatPhoneNumber(settings.phone);
  const navigate = useNavigate();
  const [closing, setClosing] = useState(false);

  const closePanel = useCallback(() => {
    setClosing(true);
    setTimeout(() => navigate('/cart'), 220);
  }, [navigate]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (event) => {
      if (event.key === 'Escape') closePanel();
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [closePanel]);

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const buildWhatsAppMessage = () => {
    const lines = [
      'Halo HenGadget, saya ingin menanyakan ketersediaan dan kesiapan produk berikut:',
      '',
    ];

    items.forEach((item, index) => {
      lines.push(
        `${index + 1}. ${item.name} x${item.qty} - ${formatCurrency(item.price * item.qty)}`
      );
    });

    lines.push(
      '',
      `Total: ${formatCurrency(total)}`,
      '',
      'Mohon informasi apakah semua produk tersebut tersedia dan siap dikirim. Terima kasih.'
    );

    return lines.join('\n');
  };

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    buildWhatsAppMessage()
  )}`;
  const whatsappEnabled = settings.activeWhatsApp !== false;

  const handleCheckout = () => {
    if (!whatsappEnabled) return;
    const opened = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    // Jangan kosongkan keranjang bila popup diblokir browser.
    if (!opened) return;
    clearCart();
    navigate('/');
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 overflow-hidden bg-[#050912] animate-fade-in"
        onClick={closePanel}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
        <div className="absolute inset-0 hero-grid opacity-25" />
        <div className="absolute -left-24 top-1/4 h-[420px] w-[420px] rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[320px] w-[520px] rounded-full bg-indigo-500/15 blur-[120px]" />

        <div className="absolute inset-y-0 left-0 right-[576px] hidden items-center px-12 lg:flex xl:px-20">
          <div className="w-full max-w-md">
            <Logo size={38} />

            <span className="mt-9 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              Checkout via WhatsApp
            </span>

            <h2 className="mt-4 text-3xl font-extrabold leading-[1.1] tracking-tight text-white xl:text-[40px]">
              Pesanan siap.
              <br />
              <span className="text-cyan-300">Tinggal satu chat.</span>
            </h2>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/45">
              Periksa produk di panel kanan, lalu kirim pesanan lewat WhatsApp. Admin
              akan mengonfirmasi stok, harga final, dan pengiriman.
            </p>

            <ol className="mt-8 space-y-4">
              {[
                ['01', 'Periksa pesanan', 'Jumlah dan total sudah terhitung otomatis.'],
                ['02', 'Kirim ke WhatsApp', 'Pesan berisi daftar produk dan total.'],
                ['03', 'Konfirmasi admin', 'Stok, harga final, dan opsi pengiriman.'],
              ].map(([step, title, description]) => (
                <li key={step} className="flex gap-3.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-400/10 text-[10px] font-bold text-cyan-300">
                    {step}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white/90">{title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-white/40">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm5.8 14.13c-.24.68-1.42 1.3-1.96 1.35-.54.05-1.05.24-3.54-.74-2.99-1.18-4.87-4.26-5.02-4.46-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.29.59-.37.79-.37.2 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.83 2.03.9 2.18.07.15.12.32.02.52-.1.2-.15.32-.29.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.03 1.12 1 2.07 1.31 2.36 1.46.29.15.46.13.63-.08.17-.2.73-.85.93-1.14.2-.29.39-.24.66-.15.27.1 1.7.8 1.99.95.29.15.48.22.55.34.07.12.07.7-.17 1.38z" />
                </svg>
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                  Butuh bantuan?
                </p>
                <p className="text-sm font-semibold text-white">{displayPhone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-xl bg-[#080d16] border-l border-white/10 shadow-2xl flex flex-col ${
          closing ? 'animate-slide-out-right' : 'animate-slide-in-right'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Checkout via WhatsApp"
      >
        <header className="flex items-start justify-between gap-4 px-6 py-5 border-b border-white/10">
          <div>
            <p className="text-cyan-300 text-[10px] font-bold uppercase tracking-[0.2em]">
              Keranjang · {totalItems} item
            </p>
            <h2 className="text-xl font-extrabold text-white mt-1">Checkout via WhatsApp</h2>
            <p className="text-white/40 text-xs mt-1">
              Periksa produk, lalu lanjutkan ke WhatsApp.
            </p>
          </div>
          <button
            onClick={closePanel}
            aria-label="Tutup checkout"
            className="w-9 h-9 rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-[#eef1f3] via-[#dfe3e6] to-[#c4c9ce] shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                        {item.brand}
                      </p>
                      <p className="text-white font-semibold text-sm leading-snug truncate">
                        {item.name}
                      </p>
                      <p className="text-white/40 text-xs mt-0.5">
                        {formatCurrency(item.price)} / unit
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-white/30 hover:text-red-300 text-xs transition-colors shrink-0"
                      aria-label={`Hapus ${item.name}`}
                    >
                      Hapus
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        className="w-7 h-7 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 text-sm"
                        aria-label="Kurangi jumlah"
                      >
                        −
                      </button>
                      <span className="text-white text-sm font-semibold w-6 text-center">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        className="w-7 h-7 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 text-sm"
                        aria-label="Tambah jumlah"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-white font-bold text-sm">
                      {formatCurrency(item.price * item.qty)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
            <p className="text-emerald-300 text-sm font-semibold">
              Nomor WhatsApp HenGadget
            </p>
            <p className="text-white font-bold mt-1">{displayPhone}</p>
            <p className="text-white/45 text-xs mt-1.5">
              Pesan otomatis akan berisi daftar produk, jumlah, dan total. Ketersediaan
              serta kesiapan produk dikonfirmasi langsung oleh admin.
            </p>
          </div>
        </div>

        <footer className="border-t border-white/10 px-6 py-5 space-y-4 bg-[#070b14]">
          <div className="flex items-center justify-between">
            <span className="text-white/50 text-sm">Total {totalItems} item</span>
            <span className="text-2xl font-extrabold text-cyan-300">{formatCurrency(total)}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={!whatsappEnabled}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#04111c] font-extrabold py-3.5 transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm5.8 14.13c-.24.68-1.42 1.3-1.96 1.35-.54.05-1.05.24-3.54-.74-2.99-1.18-4.87-4.26-5.02-4.46-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.29.59-.37.79-.37.2 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.83 2.03.9 2.18.07.15.12.32.02.52-.1.2-.15.32-.29.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.03 1.12 1 2.07 1.31 2.36 1.46.29.15.46.13.63-.08.17-.2.73-.85.93-1.14.2-.29.39-.24.66-.15.27.1 1.7.8 1.99.95.29.15.48.22.55.34.07.12.07.7-.17 1.38z" />
            </svg>
            {whatsappEnabled ? 'Chat WhatsApp & Pesan Sekarang' : 'Checkout WhatsApp Nonaktif'}
          </button>

          {!whatsappEnabled && (
            <p className="text-xs text-amber-300/80">
              Admin menonaktifkan checkout WhatsApp. Silakan hubungi toko melalui kontak yang tersedia.
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={closePanel}
              className="text-white/50 hover:text-white text-sm font-medium transition-colors"
            >
              ← Kembali ke keranjang
            </button>
            <Link
              to="/catalog"
              className="text-cyan-300 hover:text-cyan-200 text-sm font-semibold transition-colors"
            >
              Tambah produk lain
            </Link>
          </div>
        </footer>
      </aside>
    </div>
  );
}
