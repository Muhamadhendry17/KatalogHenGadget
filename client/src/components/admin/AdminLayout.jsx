import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../Logo';

const links = [
  {
    to: '/admin',
    label: 'Ringkasan',
    end: true,
    icon: (
      <path d="M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6V11h-6v9zm0-16v5h6V4h-6z" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    to: '/admin/products',
    label: 'Produk',
    icon: (
      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    to: '/admin/categories',
    label: 'Kategori',
    icon: (
      <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    to: '/admin/settings',
    label: 'Pengaturan Toko',
    icon: (
      <path d="M12 15a3 3 0 100-6 3 3 0 000 6zm7.4-3a7.4 7.4 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 00-2-1.2L14.6 3h-4l-.4 2.6a7 7 0 00-2 1.2l-2.4-1-2 3.4 2 1.6A7.4 7.4 0 005.6 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 002 1.2l.4 2.6h4l.4-2.6a7 7 0 002-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    to: '/admin/orders',
    label: 'Pesanan',
    icon: (
      <path d="M3 3h2l.4 2M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707L15.414 5H12a1 1 0 00-.707.293L10.414 7H3a1 1 0 00-1 1v16a1 1 0 001 1zM7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707L15.414 5H12a1 1 0 00-.707.293L10.414 7H3a1 1 0 00-1 1v16a1 1 0 001 1z" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    to: '/admin/password-resets',
    label: 'Reset Kata Sandi',
    icon: (
      <path d="M15 7a4 4 0 11-3.5 5.9L9 15.4V18H6.4L4 20.4V17l5.1-5.1A4 4 0 0115 7zm1.5 1.5h.01" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
];

function NavItems({ onNavigate }) {
  return (
    <nav className="space-y-1">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/20'
                : 'text-white/60 border border-transparent hover:bg-white/5 hover:text-white'
            }`
          }
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7">
            {link.icon}
          </svg>
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-5">
      <Link to="/" aria-label="HenGadget - Beranda" onClick={() => setOpen(false)}>
        <Logo />
      </Link>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300/70">Admin panel</p>
        <p className="mt-1 truncate text-sm font-semibold text-white">{user?.name || 'Administrator'}</p>
        <p className="truncate text-[11px] text-white/40">{user?.email}</p>
      </div>

      <NavItems onNavigate={() => setOpen(false)} />

      <div className="mt-auto space-y-2">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-white/55 transition-colors hover:bg-white/5 hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M3 11l9-8 9 8M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Lihat toko
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-red-300/80 transition-colors hover:bg-red-500/10 hover:text-red-300"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Keluar
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070b14]">
      <div className="lg:flex">
        <aside className="hidden lg:block w-72 shrink-0 border-r border-white/10 bg-[#080d16]">
          <div className="sticky top-0 h-screen">{sidebar}</div>
        </aside>

        {open && (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <aside className="relative h-full w-72 max-w-[85vw] border-r border-white/10 bg-[#080d16]">
              {sidebar}
            </aside>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070b14]/90 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  aria-label="Buka menu admin"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white lg:hidden"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                  </svg>
                </button>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Dashboard</p>
                  <p className="text-sm font-semibold text-white">Manajemen HenGadget</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 sm:inline-flex">
                  Admin aktif
                </span>
                <Link
                  to="/catalog"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 transition-colors hover:text-white"
                >
                  Lihat katalog
                </Link>
              </div>
            </div>
          </header>

          <main className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
