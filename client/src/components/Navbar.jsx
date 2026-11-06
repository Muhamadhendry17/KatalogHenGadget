import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import Logo from './Logo';

const navigation = [
  { label: 'Beranda', to: '/' },
  { label: 'Katalog', to: '/catalog' },
  { label: 'Perbandingan', to: '/compare' },
  { label: 'Artikel', to: '/articles' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const initials = (user?.name || 'User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled || menuOpen
          ? 'bg-[#070b14]/90 backdrop-blur-xl border-b border-white/10'
          : 'bg-gradient-to-b from-[#070b14]/80 to-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          <Link to="/" aria-label="HenGadget - Beranda">
            <Logo />
          </Link>

          {!isAuthPage && (
            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.to)
                      ? 'text-cyan-300 bg-cyan-400/10'
                      : 'text-white/65 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive('/admin')
                      ? 'text-[#04111c] bg-cyan-400'
                      : 'text-cyan-300 bg-cyan-400/10 hover:bg-cyan-400/20'
                  }`}
                >
                  Dashboard
                </Link>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            {!isAuthPage && (
              <Link
                to="/cart"
                aria-label="Keranjang"
                className="relative w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M3 4h2l2.4 11.2a2 2 0 002 1.6h7.8a2 2 0 002-1.6L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="10" cy="20" r="1.2" fill="currentColor" />
                  <circle cx="18" cy="20" r="1.2" fill="currentColor" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-cyan-400 text-[#04111c] text-[10px] font-extrabold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
            )}

            {!user ? (
              <>
                <Link
                  to="/login"
                  className="hidden sm:block text-sm text-white/70 hover:text-cyan-300 transition-colors px-2"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex items-center rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
                >
                  Daftar
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <div
                  title={user.name}
                  className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1 pr-1 lg:pr-3"
                >
                  <span
                    aria-hidden="true"
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 via-sky-400 to-indigo-500 text-[#04111c] text-[11px] font-extrabold tracking-wide flex items-center justify-center shadow-[0_0_18px_rgba(34,211,238,0.25)]"
                  >
                    {initials}
                  </span>
                  <span className="hidden lg:flex flex-col leading-tight">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/35">
                      Masuk sebagai
                    </span>
                    <span className="max-w-[150px] truncate text-xs font-semibold text-white/85">
                      {user.name}
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Keluar dari akun"
                  title="Keluar"
                  className="inline-flex h-10 w-10 lg:w-auto items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] text-white/55 transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 lg:px-3.5"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="hidden lg:inline text-xs font-medium">Keluar</span>
                </button>
              </div>
            )}

            {!isAuthPage && (
              <button
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Buka menu"
                aria-expanded={menuOpen}
                className="md:hidden w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  {menuOpen ? (
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  ) : (
                    <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>

        {menuOpen && !isAuthPage && (
          <div className="md:hidden pb-5 pt-1 border-t border-white/10 mt-1">
            <div className="grid gap-1 mt-3">
              {navigation.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive(item.to)
                      ? 'text-cyan-300 bg-cyan-400/10'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="px-4 py-3 rounded-xl text-sm font-semibold text-[#04111c] bg-cyan-400"
                >
                  Dashboard Admin
                </Link>
              )}
              {!user && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Link to="/login" className="btn-outline text-center text-sm py-2.5">
                    Masuk
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-xl bg-cyan-500 text-white text-sm font-semibold py-2.5 text-center"
                  >
                    Daftar
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
