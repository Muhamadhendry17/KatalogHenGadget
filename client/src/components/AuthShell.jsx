import { Link } from 'react-router-dom';
import Logo from './Logo';
import { getProductById } from '../data/products';
import { useFormatCurrency } from '../contexts/CurrencyContext';

const SHOWCASE = [
  { id: 'apple-iphone-17-pro-max', label: 'Baru 2025', wide: true },
  { id: 'realme-13-pro-plus', label: 'Kamera AI' },
  { id: 'samsung-galaxy-s24-ultra', label: 'Flagship' },
];

const FEATURES = [
  { icon: '🛡️', title: 'Garansi resmi', desc: 'Aman & terpercaya' },
  { icon: '⚡', title: 'Stok siap', desc: 'Cek cepat via WhatsApp' },
  { icon: '💳', title: 'Cicilan 0%', desc: 'Tenor fleksibel' },
];

function ShowcaseCard({ item }) {
  const formatCurrency = useFormatCurrency();
  const product = getProductById(item.id);
  if (!product) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_18px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-sm transition-transform duration-500 hover:-translate-y-1 ${
        item.wide ? 'col-span-2' : ''
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent" />
      <img
        src={product.image}
        alt={product.name}
        className={`relative w-full bg-gradient-to-br from-[#eef1f3] via-[#e2e6e9] to-[#c6cbd0] object-contain ${
          item.wide ? 'h-36 sm:h-40' : 'h-28'
        }`}
        loading="lazy"
      />
      <div className="relative border-t border-white/10 px-3.5 py-2.5">
        <p className="truncate text-[12px] font-semibold text-white/90">{product.name}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-cyan-300">{formatCurrency(product.price)}</span>
          <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-300">
            {item.label}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AuthShell({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b14]">
      {/* Aurora ambience */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="hero-aurora-a absolute -top-32 -left-24 h-[26rem] w-[26rem] rounded-full bg-cyan-500/20 blur-[110px]" />
        <div className="hero-aurora-b absolute top-1/3 right-[-8rem] h-[28rem] w-[28rem] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-indigo-500/15 blur-[120px]" />
        <div className="hero-grid absolute inset-0" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(7,11,20,0)_0%,rgba(7,11,20,0.55)_55%,#070b14_100%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between lg:hidden">
          <Link to="/" aria-label="HenGadget beranda">
            <Logo size={40} />
          </Link>
          <Link
            to="/catalog"
            className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 transition-colors hover:border-cyan-400/40 hover:text-white"
          >
            Lihat katalog
          </Link>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_minmax(0,0.95fr)] lg:gap-16">
          {/* Showcase / branding */}
          <section className="relative hidden lg:block">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.07] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              {eyebrow || 'HenGadget Catalog'}
            </div>

            <h1 className="text-4xl font-extrabold leading-tight text-white xl:text-5xl">
              Handphone impian,
              <br />
              <span className="gradient-text">mulai dari sini.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/55">
              Bandingkan spesifikasi, pilih warna favorit, dan tanyakan stok langsung lewat
              WhatsApp. Semua dalam satu katalog yang rapi.
            </p>

            <div className="relative mt-10">
              <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-cyan-500/[0.06] blur-2xl" />
              <div className="relative grid grid-cols-2 gap-3.5">
                {SHOWCASE.map((item) => (
                  <ShowcaseCard key={item.id} item={item} />
                ))}
              </div>

              <div className="mt-3.5 flex items-center justify-end gap-2 rounded-xl border border-white/10 bg-[#0b1220]/70 px-3 py-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/15 text-[11px] text-emerald-300">
                  ●
                </span>
                <div>
                  <p className="text-[10px] font-semibold text-white">Admin online</p>
                  <p className="text-[9px] text-white/45">Balas cepat via WhatsApp</p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3.5"
                >
                  <span className="text-lg">{feature.icon}</span>
                  <p className="mt-2 text-[11px] font-semibold text-white">{feature.title}</p>
                  <p className="text-[10px] text-white/40">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Form card */}
          <section className="mx-auto w-full max-w-md">
            <div className="glass-panel relative overflow-hidden p-7 sm:p-9">
              <div
                className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-blue-500/15 blur-3xl"
                aria-hidden="true"
              />

              <div className="relative">
                <div className="mb-7 hidden items-center justify-between gap-4 sm:flex">
                  <Link to="/" aria-label="HenGadget beranda">
                    <Logo size={48} />
                  </Link>
                  <Link
                    to="/catalog"
                    className="hidden rounded-full border border-white/10 px-3.5 py-1.5 text-[11px] font-semibold text-white/55 transition-colors hover:border-cyan-400/40 hover:text-white sm:inline-flex"
                  >
                    Katalog
                  </Link>
                </div>

                <h2 className="text-2xl font-bold text-white sm:text-3xl">{title}</h2>
                <p className="mt-2 text-sm text-white/50">{subtitle}</p>

                <div className="mt-7">{children}</div>

                {footer && <div className="mt-7">{footer}</div>}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-center gap-4 text-[10px] text-white/30">
              <span>© {new Date().getFullYear()} HenGadget</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <Link to="/info/kebijakan-privasi" className="transition-colors hover:text-white/60">
                Kebijakan privasi
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
