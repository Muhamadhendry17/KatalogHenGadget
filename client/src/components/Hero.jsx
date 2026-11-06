import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFormatCurrency } from '../contexts/CurrencyContext';
import { normalizeWhatsAppNumber } from '../lib/phone';
import { useCatalog } from '../contexts/CatalogContext';

const WHATSAPP_MESSAGE = encodeURIComponent(
  'Halo HenGadget, saya mau tanya-tanya soal handphone yang cocok untuk saya.'
);

function buildSlides(products) {
  if (!products.length) return [];
  const heroProduct =
    products.find((product) => product.id === 'samsung-galaxy-s24-ultra') || products[0];
  const heroSlide = {
    ...heroProduct,
    image: '/assets/figma/hero-galaxy-s24.png',
    badge: 'Paling dicari minggu ini',
  };

  const others = products
    .filter((product) => product.id !== heroProduct.id)
    .map((product) => ({ ...product, badge: product.tag }));

  return [heroSlide, ...others];
}

const pad = (value) => String(value).padStart(2, '0');

export default function Hero() {
  const { products, settings } = useCatalog();
  const formatCurrency = useFormatCurrency();
  const whatsappUrl = `https://wa.me/${normalizeWhatsAppNumber(settings.phone)}?text=${WHATSAPP_MESSAGE}`;
  const slides = useMemo(() => buildSlides(products), [products]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const active = slides[index % (slides.length || 1)];

  useEffect(() => {
    if (paused || slides.length === 0) return undefined;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 4600);
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  const go = (nextIndex) => setIndex((nextIndex + slides.length) % slides.length);

  const handleTilt = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const relX = (event.clientX - rect.left) / rect.width - 0.5;
    const relY = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: relX * 8, y: relY * -8 });
  };

  const accent = active?.colors?.[0] || '#22d3ee';
  const progress = slides.length ? ((index + 1) / slides.length) * 100 : 0;

  if (!active) return null;

  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-70" aria-hidden="true" />
      <div className="absolute inset-0 hero-grid opacity-60" aria-hidden="true" />
      <div
        className="hero-aurora-a pointer-events-none absolute -left-32 -top-24 h-[440px] w-[440px] rounded-full bg-cyan-500/25 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="hero-aurora-b pointer-events-none absolute -right-24 top-1/4 h-[420px] w-[420px] rounded-full bg-indigo-500/20 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="hero-aurora-a pointer-events-none absolute bottom-0 left-1/3 h-[300px] w-[520px] rounded-full bg-sky-400/10 blur-[110px]"
        style={{ animationDelay: '-7s' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#070b14] to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_1fr]">
          {/* Copy */}
          <div className="animate-fade-in space-y-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.08] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-200">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-300" />
              </span>
              Koleksi 2026 · {slides.length} handphone pilihan
            </span>

            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-6xl">
              Bukan sekadar <br />
              <span className="gradient-text">ganti handphone.</span>
            </h1>

            <p className="max-w-lg text-base leading-relaxed text-white/60 md:text-lg">
              Bandingkan spesifikasi, lihat harga, dan pilih handphone yang benar-benar
              cocok dengan kebutuhanmu. Lebih yakin sebelum membeli.
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/45">
              {['Spesifikasi jelas', 'Harga transparan', 'Bisa dibandingkan'].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-300">
                    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link to="/catalog" className="btn-primary group inline-flex items-center justify-center gap-2 text-center">
                Jelajahi Katalog
                <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
              </Link>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-outline inline-flex items-center justify-center gap-2 text-center"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-400" fill="currentColor">
                  <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.09 3.19 5.06 4.47.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.28.17-1.41-.07-.12-.27-.19-.57-.34z" />
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.86 9.86 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.15h-.01a8.2 8.2 0 01-4.18-1.14l-.3-.18-3.11.82.83-3.04-.2-.31a8.18 8.18 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 012.41 5.83c0 4.54-3.7 8.22-8.24 8.22z" />
                </svg>
                Hubungi Kami
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-5">
              <div className="flex -space-x-3">
                {[
                  { initials: 'AR', gradient: 'from-cyan-400 to-blue-500' },
                  { initials: 'DN', gradient: 'from-blue-400 to-indigo-500' },
                  { initials: 'SP', gradient: 'from-teal-400 to-cyan-500' },
                  { initials: 'MW', gradient: 'from-violet-400 to-blue-500' },
                  { initials: 'RF', gradient: 'from-sky-400 to-cyan-600' },
                ].map((reviewer) => (
                  <div
                    key={reviewer.initials}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#070b14] bg-gradient-to-br ${reviewer.gradient} text-[10px] font-extrabold text-[#04111c]`}
                    title={`Ulasan dari ${reviewer.initials}`}
                  >
                    {reviewer.initials}
                  </div>
                ))}
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
                  4.9/5
                  <span className="text-xs tracking-tight text-amber-400">★★★★★</span>
                </p>
                <p className="text-xs text-white/50">15.000+ ulasan terverifikasi</p>
              </div>
              <div className="hidden h-9 w-px bg-white/10 sm:block" />
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-white">{products.length} produk</p>
                <p className="text-xs text-white/50">6 merek pilihan</p>
              </div>
            </div>
          </div>

          {/* Product showcase */}
          <div
            className="relative"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => {
              setPaused(false);
              setTilt({ x: 0, y: 0 });
            }}
            onMouseMove={handleTilt}
            style={{ perspective: '1400px' }}
          >
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <div className="hero-halo h-[320px] w-[320px] rounded-full bg-cyan-500/20 blur-3xl sm:h-[430px] sm:w-[430px]" />
            </div>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <div className="animate-slow-spin h-[360px] w-[360px] rounded-full bg-[conic-gradient(from_0deg,rgba(34,211,238,0.6),transparent_32%,rgba(99,102,241,0.5),transparent_68%,rgba(34,211,238,0.6))] opacity-25 blur-3xl sm:h-[520px] sm:w-[520px]" />
            </div>

            <div
              className="hero-tilt relative z-10"
              style={{
                transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
                transformStyle: 'preserve-3d',
              }}
            >
              <div className="rounded-[2.2rem] bg-gradient-to-br from-white/25 via-white/5 to-cyan-400/25 p-[1px] shadow-[0_30px_90px_-20px_rgba(8,145,178,0.55)]">
                <div className="relative rounded-[2.14rem] bg-[#0a111c]/90 p-2.5 backdrop-blur-xl">
                  <div className="hero-shine relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#eef1f3] via-[#dfe3e6] to-[#c4c9ce]">
                    <div
                      className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-35 blur-3xl transition-colors duration-700"
                      style={{ backgroundColor: accent }}
                      aria-hidden="true"
                    />

                    <div key={active.id} className="animate-product-in relative">
                      <img
                        src={active.image}
                        alt={active.name}
                        className="h-[300px] w-full object-cover object-center sm:h-[390px] lg:h-[420px]"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>

                    <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-4">
                      <span className="max-w-[68%] truncate rounded-full bg-black/65 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300 backdrop-blur">
                        {active.badge}
                      </span>
                      <span className="rounded-full border border-white/20 bg-white/55 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-800 backdrop-blur">
                        {active.brand}
                      </span>
                    </div>

                    <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#070d16]/85 px-4 py-3 shadow-xl backdrop-blur-xl">
                      <div className="min-w-0 flex-1">
                        <p aria-live="polite" className="truncate text-sm font-bold text-white sm:text-base">
                          {active.name}
                        </p>
                        <p className="mt-0.5 flex items-center gap-2 text-xs text-white/45">
                          <span className="font-semibold text-cyan-300">{formatCurrency(active.price)}</span>
                          <span className="hidden h-0.5 w-0.5 rounded-full bg-white/30 sm:block" />
                          <span className="hidden truncate sm:block">{active.specs?.[0]?.value ?? '—'}</span>
                        </p>
                      </div>
                      <Link
                        to={`/product/${active.id}`}
                        className="group/detail inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 py-2.5 text-xs font-bold text-[#04111c] transition-colors hover:bg-cyan-400"
                      >
                        Detail
                        <span className="transition-transform duration-300 group-hover/detail:translate-x-0.5">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating score chips */}
              <div className="animate-float-chip absolute -left-3 top-16 z-20 hidden items-center gap-2.5 rounded-2xl border border-white/15 bg-[#0a111c]/85 px-3.5 py-2.5 shadow-2xl backdrop-blur-xl sm:flex lg:-left-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 8.5A2.5 2.5 0 015.5 6h2L9 4h6l1.5 2h2A2.5 2.5 0 0121 8.5v9A2.5 2.5 0 0118.5 20h-13A2.5 2.5 0 013 17.5v-9z" />
                    <circle cx="12" cy="13" r="3.5" />
                  </svg>
                </span>
                <span>
                  <span className="block text-[9px] uppercase tracking-[0.16em] text-white/40">Skor kamera</span>
                  <span className="block text-sm font-extrabold text-white">{active.cameraScore}<span className="text-[10px] font-medium text-white/35"> / 100</span></span>
                </span>
              </div>

              <div className="animate-float-chip-delayed absolute -right-2 bottom-24 z-20 hidden items-center gap-2.5 rounded-2xl border border-white/15 bg-[#0a111c]/85 px-3.5 py-2.5 shadow-2xl backdrop-blur-xl sm:flex lg:-right-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-400/15 text-indigo-300">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M13 2L4.5 13H11l-1 9L19.5 11H13l0-9z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>
                  <span className="block text-[9px] uppercase tracking-[0.16em] text-white/40">Skor performa</span>
                  <span className="block text-sm font-extrabold text-white">{active.performanceScore}<span className="text-[10px] font-medium text-white/35"> / 100</span></span>
                </span>
              </div>
            </div>

            {/* Carousel controls */}
            <div className="relative z-10 mt-6 flex items-center gap-4">
              <span className="shrink-0 text-xs tabular-nums text-white/40">
                <span className="text-sm font-bold text-white">{pad(index + 1)}</span>
                <span className="mx-0.5">/</span>
                {pad(slides.length)}
              </span>

              <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => go(index - 1)}
                  aria-label="Handphone sebelumnya"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-all hover:border-cyan-400/40 hover:bg-white/10 active:scale-95"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => go(index + 1)}
                  aria-label="Handphone berikutnya"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-all hover:border-cyan-400/40 hover:bg-white/10 active:scale-95"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
