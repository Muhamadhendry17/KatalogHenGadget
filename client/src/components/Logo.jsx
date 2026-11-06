import { useCatalog } from '../contexts/CatalogContext';

export default function Logo({ size = 40, showText = true, className = '' }) {
  const { settings } = useCatalog();
  const storeName = String(settings.storeName || 'HenGadget').trim() || 'HenGadget';

  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span
        className="relative inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-600 shadow-[0_0_22px_rgba(34,211,238,0.45)]"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: size * 0.62, height: size * 0.62 }}
          aria-hidden="true"
        >
          <rect
            x="7"
            y="2.8"
            width="10"
            height="18.4"
            rx="2.6"
            stroke="white"
            strokeWidth="1.5"
          />
          <path d="M10.6 5.6h2.8" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
          <path
            d="M12.9 8.7L9.7 12.7h2.4l-1 4.1 3.6-4.9h-2.4l.6-3.2z"
            fill="white"
          />
        </svg>
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#070b14]" />
      </span>

      {showText && (
        <span className="font-extrabold text-xl tracking-tight leading-none">
          <span className="bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
            {storeName}
          </span>
          <span className="text-cyan-400">.</span>
        </span>
      )}
    </span>
  );
}
