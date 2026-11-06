import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductGrid from '../components/ProductGrid';
import { featureFilters } from '../data/products';
import { useCatalog } from '../contexts/CatalogContext';

export default function CatalogPage() {
  const [searchParams] = useSearchParams();
  const { products, brands } = useCatalog();
  const brandParam = searchParams.get('brand');
  const filterParam = searchParams.get('filter');

  const brand = brands.includes(brandParam) ? brandParam : 'Semua';
  const filter = featureFilters.includes(filterParam) ? filterParam : 'Pilihan handphone';

  return (
    <div className="min-h-screen bg-[#070b14]">
      <Navbar />

      <main className="pt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <nav className="text-xs text-white/35 flex items-center gap-2" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-cyan-300 transition-colors">
              Beranda
            </Link>
            <span>/</span>
            <span className="text-white/60">Katalog handphone</span>
            {brand !== 'Semua' && (
              <>
                <span>/</span>
                <span className="text-cyan-300">{brand}</span>
              </>
            )}
          </nav>

          <div className="mt-8 mb-10 relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b1624] via-[#0a1420] to-[#08101a] p-8 md:p-12">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl"></div>
            <div className="relative z-10 max-w-3xl">
              <span className="inline-block rounded-full bg-cyan-400/10 border border-cyan-400/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                Katalog lengkap · {products.length} handphone
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white mt-4">
                Semua handphone, <span className="gradient-text">satu tempat.</span>
              </h1>
              <p className="text-white/55 mt-3 max-w-2xl">
                Gunakan filter merek dan kebutuhan untuk menemukan handphone yang tepat.
                Setiap produk bisa langsung dibandingkan atau ditanyakan lewat WhatsApp.
              </p>
            </div>
          </div>
        </div>

        <ProductGrid
          key={`${brand}-${filter}`}
          initialBrand={brand}
          initialFilter={filter}
          heading="Pilih sesuai kebutuhanmu."
          subheading="Filter bekerja secara nyata: merek, harga, kamera, dan performa."
          showSearch
          showSort
        />
      </main>

      <Footer />
    </div>
  );
}
