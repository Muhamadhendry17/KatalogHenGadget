import { Link } from 'react-router-dom';
import Logo from './Logo';
import { useCatalog } from '../contexts/CatalogContext';
import { formatPhoneNumber, normalizeWhatsAppNumber } from '../lib/phone';

const WHATSAPP_MESSAGE = encodeURIComponent(
  'Halo HenGadget, saya ingin dibantu memilih handphone.'
);

const exploreLinks = [
  { label: 'Semua handphone', to: '/catalog' },
  { label: 'Merek populer', to: '/catalog' },
  { label: 'Pilih handphone', to: '/compare' },
  { label: 'Artikel & panduan', to: '/articles' },
  { label: 'Promo pilihan', to: '/catalog?filter=Harga%20bersahabat' },
];

const helpLinks = [
  { label: 'Panduan membeli', to: '/info/panduan-membeli' },
  { label: 'Pilih berdasarkan bujet', to: '/catalog?filter=Harga%20bersahabat' },
  { label: 'Pilih spesifikasi', to: '/compare' },
  { label: 'Pertanyaan umum', to: '/info/faq' },
];

const aboutLinks = [
  { label: 'Cerita kami', to: '/info/cerita-kami' },
  { label: 'Cara kami memilih', to: '/info/cara-kami-memilih' },
  { label: 'Hubungi kami', to: '/info/kontak' },
  { label: 'Kebijakan privasi', to: '/info/kebijakan-privasi' },
];

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M21.6 7.2a2.5 2.5 0 00-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.84.43A2.5 2.5 0 002.4 7.2 26 26 0 002 12a26 26 0 00.4 4.8 2.5 2.5 0 001.76 1.77C5.75 19 12 19 12 19s6.25 0 7.84-.43a2.5 2.5 0 001.76-1.77A26 26 0 0022 12a26 26 0 00-.4-4.8zM10 15V9l5.2 3L10 15z" />
      </svg>
    ),
  },
  {
    label: 'WhatsApp',
    href: '',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm5.8 14.13c-.24.68-1.42 1.3-1.96 1.35-.54.05-1.05.24-3.54-.74-2.99-1.18-4.87-4.26-5.02-4.46-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.29.59-.37.79-.37.2 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.83 2.03.9 2.18.07.15.12.32.02.52-.1.2-.15.32-.29.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.03 1.12 1 2.07 1.31 2.36 1.46.29.15.46.13.63-.08.17-.2.73-.85.93-1.14.2-.29.39-.24.66-.15.27.1 1.7.8 1.99.95.29.15.48.22.55.34.07.12.07.7-.17 1.38z" />
      </svg>
    ),
  },
  {
    label: 'Email',
    href: 'mailto:hello@hengadget.com',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function Footer() {
  const { settings } = useCatalog();
  const whatsappUrl = `https://wa.me/${normalizeWhatsAppNumber(settings.phone)}?text=${WHATSAPP_MESSAGE}`;
  const displayPhone = formatPhoneNumber(settings.phone);

  return (
    <footer className="bg-[#05080e] text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-600 p-8 md:p-12 mb-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-extrabold mb-2">Masih mencari handphone yang pas?</h3>
            <p className="text-white/80 text-sm max-w-xl">
              Mulai dari kebutuhan dan budgetmu. Kami bantu mempersingkat pilihan.
            </p>
          </div>
          <Link
            to="/catalog"
            className="shrink-0 rounded-xl bg-[#04111c] text-white px-6 py-3 font-bold hover:bg-[#0a1a2a] transition-colors"
          >
            Temukan handphone saya →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" aria-label="HenGadget - Beranda">
              <Logo />
            </Link>
            <p className="text-white/45 text-sm leading-relaxed mt-4 max-w-xs">
              {settings.tagline || 'Lebih banyak promo, lebih cerdas memilih. Temukan handphone yang tepat untukmu, tanpa tekanan.'}
            </p>
            {settings.address && (
              <p className="text-white/35 text-xs leading-relaxed mt-3 max-w-xs">
                {settings.address}
              </p>
            )}
            <div className="flex gap-3 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.label === 'WhatsApp' ? whatsappUrl : social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  title={social.label}
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/55 hover:text-cyan-300 hover:border-cyan-400/40 transition-colors"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-5 text-sm uppercase tracking-wider text-white/80">Jelajahi</h4>
            <ul className="space-y-3">
              {exploreLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-white/45 text-sm hover:text-cyan-300 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-5 text-sm uppercase tracking-wider text-white/80">Bantu memilih</h4>
            <ul className="space-y-3">
              {helpLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-white/45 text-sm hover:text-cyan-300 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-5 text-sm uppercase tracking-wider text-white/80">Tentang HenGadget</h4>
            <ul className="space-y-3">
              {aboutLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-white/45 text-sm hover:text-cyan-300 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/35 text-xs">© 2026 HenGadget. Pilih dengan lebih yakin.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/35">
            <span>Indonesia</span>
            <span aria-hidden="true">·</span>
            <span>Rupiah (IDR)</span>
            <span aria-hidden="true">·</span>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="hover:text-cyan-300 transition-colors">
              {displayPhone}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
