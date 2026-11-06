import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import { featureFilters, filterMeta } from '../data/products';
import { useCatalog } from '../contexts/CatalogContext';

const sortOptions = [
  { value: 'recommended', label: 'Rekomendasi' },
  { value: 'price-asc', label: 'Harga termurah' },
  { value: 'price-desc', label: 'Harga tertinggi' },
  { value: 'rating', label: 'Rating tertinggi' },
];

export default function ProductGrid({
  limit,
  initialBrand = 'Semua',
  initialFilter = 'Pilihan handphone',
  heading = 'Temukan favorit baru.',
  subheading = 'Dari andalan harian sampai unggulan premium. Pilih sesuai kebutuhan dan budget Anda.',
  showAllLink = false,
  showSearch = false,
  showSort = false,
  featuredOnly = false,
  horizontal = false,
}) {
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [selectedFilter, setSelectedFilter] = useState(initialFilter);
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState('recommended');
  const scrollerRef = useRef(null);
  const [scrollState, setScrollState] = useState({ left: false, right: false });
  const { products, brands } = useCatalog();

  const activeMeta = filterMeta[selectedFilter] || filterMeta['Pilihan handphone'];

  const pool = useMemo(
    () => (featuredOnly ? products.filter((product) => product.featured) : products),
    [featuredOnly, products]
  );

  const brandCounts = useMemo(() => {
    const counts = { Semua: pool.length };
    brands.forEach((brand) => {
      if (brand !== 'Semua') {
        counts[brand] = pool.filter((product) => product.brand === brand).length;
      }
    });
    return counts;
  }, [pool, brands]);

  const filterCounts = useMemo(() => {
    const counts = {};
    featureFilters.forEach((filter) => {
      counts[filter] = pool.filter(filterMeta[filter].test).length;
    });
    return counts;
  }, [pool]);

  const result = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    let list = pool.filter((product) => {
      const matchBrand = selectedBrand === 'Semua' || product.brand === selectedBrand;
      const matchFeature = activeMeta.test(product);
      const matchQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.brand.toLowerCase().includes(normalizedQuery) ||
        product.specs.some((spec) => spec.value.toLowerCase().includes(normalizedQuery));
      return matchBrand && matchFeature && matchQuery;
    });

    list = [...list].sort(activeMeta.sort);

    if (sortMode === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (sortMode === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (sortMode === 'rating') list.sort((a, b) => b.rating - a.rating);

    return list;
  }, [pool, selectedBrand, activeMeta, query, sortMode]);

  const visibleProducts = limit ? result.slice(0, limit) : result;
  const hasActiveFilter =
    selectedBrand !== 'Semua' ||
    selectedFilter !== 'Pilihan handphone' ||
    query.trim().length > 0 ||
    sortMode !== 'recommended';

  const resetFilters = () => {
    setSelectedBrand('Semua');
    setSelectedFilter('Pilihan handphone');
    setQuery('');
    setSortMode('recommended');
  };

  useEffect(() => {
    if (!horizontal) return undefined;
    const scroller = scrollerRef.current;
    if (!scroller) return undefined;

    const update = () => {
      setScrollState({
        left: scroller.scrollLeft > 6,
        right: scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 6,
      });
    };

    update();
    scroller.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const observer = new ResizeObserver(update);
    observer.observe(scroller);

    return () => {
      scroller.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      observer.disconnect();
    };
  }, [horizontal]);

  useEffect(() => {
    if (!horizontal) return;
    scrollerRef.current?.scrollTo({ left: 0, behavior: 'auto' });
  }, [horizontal, selectedBrand, selectedFilter, query, sortMode]);

  const scrollCarousel = (direction) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const card = scroller.querySelector('[data-carousel-item]');
    const step = card ? card.getBoundingClientRect().width + 20 : scroller.clientWidth * 0.8;
    scroller.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  const handleCarouselKeyDown = (event) => {
    if (!horizontal) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollCarousel(1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollCarousel(-1);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">{heading}</h2>
            <p className="text-white/55 max-w-2xl">{subheading}</p>
          </div>

          {showSearch && (
            <div className="relative w-full lg:w-80">
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari handphone, merek, atau spesifikasi..."
                className="w-full rounded-xl bg-white/5 border border-white/10 pl-11 pr-4 py-3 text-sm text-white placeholder-white/35 focus:outline-none focus:border-cyan-400/60"
              />
            </div>
          )}
        </div>

        {/* Brand chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(brand)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-medium border transition-all ${
                selectedBrand === brand
                  ? 'bg-cyan-400 text-[#04111c] border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.25)]'
                  : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {brand}
              <span
                className={`ml-1.5 text-[10px] ${
                  selectedBrand === brand ? 'text-[#04111c]/70' : 'text-white/30'
                }`}
              >
                {brandCounts[brand]}
              </span>
            </button>
          ))}
        </div>

        {/* Feature chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {featureFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              title={filterMeta[filter].description}
              className={`whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-medium border transition-all ${
                selectedFilter === filter
                  ? 'bg-white/10 text-white border-cyan-400/60 shadow-[0_0_15px_rgba(34,211,238,0.18)]'
                  : 'border-white/10 text-white/50 hover:border-white/25 hover:text-white'
              }`}
            >
              {filter}
              <span className="ml-1.5 text-[10px] text-cyan-300/70">
                {filterCounts[filter]}
              </span>
            </button>
          ))}
        </div>

        {/* Active filter explanation */}
        <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-cyan-300 text-sm font-semibold">
              {selectedFilter}
              {selectedBrand !== 'Semua' ? ` · ${selectedBrand}` : ''}
            </p>
            <p className="text-white/50 text-sm mt-0.5">{activeMeta.description}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {horizontal && (
              <div className="hidden sm:flex items-center gap-1.5 mr-1">
                <button
                  type="button"
                  onClick={() => scrollCarousel(-1)}
                  disabled={!scrollState.left}
                  aria-label="Geser handphone ke kiri"
                  className="w-9 h-9 rounded-full border border-white/10 bg-white/5 text-white/70 flex items-center justify-center transition-all hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel(1)}
                  disabled={!scrollState.right}
                  aria-label="Geser handphone ke kanan"
                  className="w-9 h-9 rounded-full border border-white/10 bg-white/5 text-white/70 flex items-center justify-center transition-all hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )}
            <span className="text-white/60 text-sm">
              {result.length} handphone
            </span>
            {showSort && (
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value)}
                className="rounded-lg bg-[#0b0f17] border border-white/10 text-white/70 text-xs px-3 py-2 focus:outline-none focus:border-cyan-400/50"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            {hasActiveFilter && (
              <button
                onClick={resetFilters}
                className="text-xs font-semibold text-white/50 hover:text-white transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Product list */}
        {visibleProducts.length > 0 ? (
          horizontal ? (
            <div className="relative">
              <p className="sm:hidden flex items-center gap-1.5 text-[11px] text-white/40 mb-2.5">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12h16M14 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Geser kartu ke samping untuk melihat handphone lainnya
              </p>

              <div
                ref={scrollerRef}
                onKeyDown={handleCarouselKeyDown}
                tabIndex={0}
                role="region"
                aria-label="Daftar handphone pilihan, geser ke kiri atau kanan"
                className="flex gap-5 overflow-x-auto overscroll-x-contain snap-x snap-mandatory scroll-smooth pt-3 pb-4 scrollbar-hide rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
              >
                {visibleProducts.map((product) => (
                  <div
                    key={product.id}
                    data-carousel-item
                    className="w-[80vw] max-w-[320px] shrink-0 snap-start sm:w-[300px] xl:w-[310px]"
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              <div
                aria-hidden="true"
                className={`pointer-events-none absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-[#070b14] to-transparent transition-opacity duration-300 ${
                  scrollState.left ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-[#070b14] to-transparent transition-opacity duration-300 ${
                  scrollState.right ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] py-20 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-white">Belum ada yang cocok</h3>
            <p className="text-white/45 text-sm mt-2 mb-6">
              Coba ubah merek, filter, atau kata kunci pencarian.
            </p>
            <button
              onClick={resetFilters}
              className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#04111c] text-sm font-bold px-5 py-2.5 transition-colors"
            >
              Tampilkan semua handphone
            </button>
          </div>
        )}

        {showAllLink && (
          <div className="flex justify-center pt-2">
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-6 py-3 text-cyan-300 font-semibold text-sm hover:bg-cyan-400/20 hover:text-cyan-200 transition-colors"
            >
              Lihat semua handphone
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
