import { useEffect, useState } from 'react';
import { assetUrl } from '../lib/api';

const FALLBACK_IMAGE = '/assets/figma/hero-galaxy-s24.png';

/**
 * Gambar produk dengan fallback bertingkat:
 * 1. gambar asli produk,
 * 2. gambar katalog default,
 * 3. ikon placeholder bila keduanya gagal dimuat.
 */
export default function ProductThumb({ src, alt = 'Produk', className = '' }) {
  const [currentSrc, setCurrentSrc] = useState(() => assetUrl(src) || assetUrl(FALLBACK_IMAGE));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(assetUrl(src) || assetUrl(FALLBACK_IMAGE));
    setFailed(false);
  }, [src]);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-gradient-to-br from-[#eef1f3] via-[#dfe3e6] to-[#c4c9ce] text-[#5b6570] ${className}`}
      >
        <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
          <path d="M10.5 18.5h3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => {
        if (currentSrc !== assetUrl(FALLBACK_IMAGE)) {
          setCurrentSrc(assetUrl(FALLBACK_IMAGE));
        } else {
          setFailed(true);
        }
      }}
    />
  );
}
