import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductSelect from '../components/ProductSelect';
import { useFormatCurrency } from '../contexts/CurrencyContext';
import { normalizeWhatsAppNumber } from '../lib/phone';
import { useCatalog } from '../contexts/CatalogContext';
import { assetUrl } from '../lib/api';

const specLabels = [
  'Layar',
  'Kamera utama',
  'Prosesor',
  'RAM / Penyimpanan',
  'Baterai',
  'Konektivitas',
];

const getSpec = (product, label) =>
  product.specs.find((spec) => spec.label === label)?.value || '—';

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const { products, getProductById, settings } = useCatalog();
  const formatCurrency = useFormatCurrency();
  const initialFirst = getProductById(searchParams.get('p1')) || products[0];
  const initialSecond =
    getProductById(searchParams.get('p2')) ||
    products.find((product) => product.id !== initialFirst?.id) ||
    products[1];

  const [selectedIds, setSelectedIds] = useState(
    () => [initialFirst?.id, initialSecond?.id].filter(Boolean),
  );

  const columns = selectedIds.map((id) => getProductById(id)).filter(Boolean);
  const canAdd = selectedIds.length < 3;
  const addableProduct = products.find((product) => !selectedIds.includes(product.id));

  const updateColumn = (index, id) => {
    setSelectedIds((current) => current.map((item, itemIndex) => (itemIndex === index ? id : item)));
  };

  const removeColumn = (index) => {
    if (selectedIds.length <= 2) return;
    setSelectedIds((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const addColumn = () => {
    if (addableProduct) setSelectedIds((current) => [...current, addableProduct.id]);
  };

  const whatsappUrl =
    `https://wa.me/${normalizeWhatsAppNumber(settings.phone)}?text=` +
    encodeURIComponent(
      `Halo HenGadget, saya sedang membandingkan ${columns
        .map((product) => product.name)
        .join(' dan ')}. Boleh dibantu rekomendasi dan ketersediaannya?`
    );

  if (!columns.length) {
    return (
      <div className="min-h-screen bg-[#070b14]">
        <Navbar />
        <main className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] py-20 text-center">
            <h1 className="text-2xl font-bold text-white">Belum ada produk untuk dibandingkan</h1>
            <p className="text-white/45 text-sm mt-2">Tambahkan produk lewat dashboard admin terlebih dahulu.</p>
            <Link to="/catalog" className="inline-block mt-6 text-cyan-300 font-semibold text-sm">
              Buka katalog →
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14]">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-xs text-white/35 flex items-center gap-2 mb-8" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-cyan-300 transition-colors">Beranda</Link>
            <span>/</span>
            <span className="text-white/60">Perbandingan</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
            <div>
              <span className="text-cyan-300 text-xs font-bold uppercase tracking-[0.2em]">
                Bandingkan sebelum membeli
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white mt-2">
                Dua pilihan. <span className="gradient-text">Mana yang lebih kamu?</span>
              </h1>
              <p className="text-white/55 mt-3 max-w-2xl">
                Lihat hal yang penting secara berdampingan, tanpa perlu berpindah halaman.
                Tambahkan handphone ketiga bila masih ragu.
              </p>
            </div>
            <Link
              to="/catalog"
              className="shrink-0 rounded-xl border border-white/15 text-white/75 hover:text-white hover:bg-white/5 text-sm font-semibold px-5 py-2.5 transition-colors"
            >
              Buka katalog →
            </Link>
          </div>

          <div
            className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden"
            style={{ overflowX: 'auto' }}
          >
            <div
              className="min-w-[760px]"
              style={{ display: 'grid', gridTemplateColumns: `190px repeat(${columns.length}, minmax(0, 1fr))` }}
            >
              <div className="border-b border-r border-white/10 p-4 bg-white/[0.02]">
                <p className="text-white/40 text-[10px] uppercase tracking-wider">Handphone</p>
              </div>

              {columns.map((product, index) => (
                <div key={product.id} className="border-b border-white/10 p-4 relative">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                      Pilihan {index + 1}
                    </span>
                    {columns.length > 2 && (
                      <button
                        onClick={() => removeColumn(index)}
                        className="text-white/35 hover:text-red-300 text-xs transition-colors"
                        aria-label={`Hapus ${product.name}`}
                      >
                        Hapus
                      </button>
                    )}
                  </div>

                  <ProductSelect
                    products={products.filter(
                      (option) => option.id === product.id || !selectedIds.includes(option.id)
                    )}
                    value={product.id}
                    onChange={(id) => updateColumn(index, id)}
                    ariaLabel={`Pilih handphone ${index + 1}`}
                  />

                  <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#eef1f3] via-[#dfe3e6] to-[#c4c9ce] overflow-hidden">
                    <img
                      src={assetUrl(product.image)}
                      alt={product.name}
                      className="w-full h-32 object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <p className="text-white font-bold text-sm mt-3 leading-snug">{product.name}</p>
                  <p className="text-cyan-300 font-extrabold text-sm mt-1">{formatCurrency(product.price)}</p>
                  <Link
                    to={`/product/${product.id}`}
                    className="inline-block mt-2 text-[11px] font-semibold text-white/50 hover:text-cyan-300 transition-colors"
                  >
                    Lihat detail →
                  </Link>
                </div>
              ))}

              {specLabels.map((label) => (
                <div key={label} className="contents">
                  <div className="border-b border-r border-white/10 bg-white/[0.02] px-4 py-4 text-sm text-white/50">
                    {label}
                  </div>
                  {columns.map((product) => (
                    <div
                      key={`${label}-${product.id}`}
                      className="border-b border-white/10 px-4 py-4 text-sm text-white/80"
                    >
                      {getSpec(product, label)}
                    </div>
                  ))}
                </div>
              ))}

              <div className="contents">
                <div className="border-b border-r border-white/10 bg-white/[0.02] px-4 py-4 text-sm text-white/50">
                  Varian & harga
                </div>
                {columns.map((product) => (
                  <div
                    key={`variants-${product.id}`}
                    className="border-b border-white/10 px-4 py-4 text-sm text-white/80"
                  >
                    {product.variants?.length ? (
                      <ul className="space-y-1">
                        {product.variants.map((variant) => (
                          <li key={`${variant.storage}-${variant.price}`} className="text-xs">
                            <span className="font-semibold text-white/85">{variant.storage}</span>{' '}
                            <span className="text-cyan-300">{formatCurrency(variant.price)}</span>
                            {Number(variant.stock) <= 0 && (
                              <span className="ml-1 text-red-300">(habis)</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="contents">
                <div className="border-b border-r border-white/10 bg-white/[0.02] px-4 py-4 text-sm text-white/50">
                  Stok
                </div>
                {columns.map((product) => (
                  <div
                    key={`stock-${product.id}`}
                    className="border-b border-white/10 px-4 py-4 text-sm"
                  >
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        product.stockStatus === 'Habis'
                          ? 'bg-red-500/15 text-red-300'
                          : 'bg-emerald-500/15 text-emerald-300'
                      }`}
                    >
                      {product.stockStatus === 'Habis' ? 'Habis' : `${product.stock} unit`}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-r border-white/10 bg-white/[0.02] px-4 py-4 text-sm text-white/50">
                Tahun rilis
              </div>
              {columns.map((product) => (
                <div key={`year-${product.id}`} className="px-4 py-4 text-sm text-white/80">
                  {product.releaseYear}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={addColumn}
              disabled={!canAdd}
              className={`inline-flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-xl border transition-colors ${
                canAdd
                  ? 'border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/10'
                  : 'border-white/10 text-white/25 cursor-not-allowed'
              }`}
            >
              <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs">
                +
              </span>
              {canAdd ? 'Tambahkan handphone lain' : 'Maksimal 3 handphone'}
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#04111c] font-bold text-sm px-6 py-3 transition-colors"
            >
              Tanya rekomendasi via WhatsApp
            </a>
          </div>

          <p className="text-white/35 text-xs mt-6">
            Catatan: harga dapat berubah mengikuti pasar. Ketersediaan dan harga final
            dikonfirmasi melalui WhatsApp sebelum pembelian.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
