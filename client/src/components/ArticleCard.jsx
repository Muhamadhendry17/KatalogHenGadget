import { Link } from 'react-router-dom';
import { articles, getProductById } from '../data/products';
import { useFormatCurrency } from '../contexts/CurrencyContext';
import { assetUrl } from '../lib/api';

export default function ArticleCard({ article }) {
  return (
    <article className="group rounded-3xl overflow-hidden border border-white/10 bg-[#0b0f17] hover:border-cyan-400/30 transition-colors">
      <Link to={`/article/${article.id}`} className="block">
        <div className="relative h-48 overflow-hidden">
          <img
            src={assetUrl(article.image)}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f17] via-transparent to-transparent"></div>
          <span className="absolute top-3 left-3 rounded-md bg-black/70 backdrop-blur px-2.5 py-1 text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
            {article.category}
          </span>
        </div>
      </Link>

      <div className="p-5">
        <span className="text-white/35 text-xs">{article.readTime}</span>
        <Link to={`/article/${article.id}`}>
          <h3 className="text-lg font-bold text-white mt-2 mb-2 leading-snug group-hover:text-cyan-300 transition-colors">
            {article.title}
          </h3>
        </Link>
        <p className="text-white/45 text-sm line-clamp-2">{article.excerpt}</p>
        <Link
          to={`/article/${article.id}`}
          className="inline-flex items-center gap-1.5 text-cyan-300 text-sm font-semibold mt-4 hover:text-cyan-200 transition-colors"
        >
          Baca panduan <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

export function ArticlesPreview({ limit = 3 }) {
  const formatCurrency = useFormatCurrency();
  const promoProduct = getProductById('redmi-note-13-pro-5g');

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-cyan-300 text-xs font-bold uppercase tracking-[0.2em]">
            Sedikit baca, lebih yakin memilih
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-2">
            Biar paham, bukan sekadar iklan tren.
          </h2>
          <p className="text-white/55 mt-2 max-w-2xl">
            Panduan singkat membaca spesifikasi yang benar-benar terasa di lapangan.
          </p>
        </div>
        <Link
          to="/articles"
          className="shrink-0 text-sm font-semibold text-cyan-300 hover:text-cyan-200 transition-colors"
        >
          Semua artikel →
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {articles.slice(0, limit).map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {promoProduct && (
        <div className="mt-12 relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#0b1624] via-[#0c1b2b] to-[#08101a]">
          <div className="grid md:grid-cols-2 items-center">
            <div className="p-8 md:p-12 relative z-10">
              <span className="inline-block rounded-full bg-cyan-400/10 border border-cyan-400/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                Promo pilihan minggu ini
              </span>
              <h3 className="text-2xl md:text-3xl font-extrabold text-white mt-4">
                {promoProduct.name}
              </h3>
              <p className="text-white/55 mt-2 max-w-md">{promoProduct.description}</p>
              <p className="text-2xl font-extrabold text-cyan-300 mt-4">
                {formatCurrency(promoProduct.price)}
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  to={`/product/${promoProduct.id}`}
                  className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#04111c] text-sm font-bold px-5 py-2.5 transition-colors"
                >
                  Lihat penawaran
                </Link>
                <Link
                  to="/catalog?filter=Harga%20bersahabat"
                  className="rounded-xl border border-white/15 text-white/80 hover:text-white hover:bg-white/5 text-sm font-semibold px-5 py-2.5 transition-colors"
                >
                  Cari yang lebih murah
                </Link>
              </div>
            </div>
            <div className="relative h-64 md:h-80">
              <img
                src="/assets/figma/promo-redmi.png"
                alt={promoProduct.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0b1624] via-transparent to-transparent md:block hidden"></div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function TrustSection() {
  const points = [
    {
      icon: '📐',
      title: 'Spesifikasi, bukan sekadar jargon',
      description: 'Informasi utama disajikan agar mudah dibaca dan dibandingkan.',
    },
    {
      icon: '⚖️',
      title: 'Pilihan dengan konteks',
      description: 'Kenali keunggulan dan kompromi, bukan hanya angka di kertas.',
    },
    {
      icon: '💬',
      title: 'Transparan sejak awal',
      description: 'Harga pasar ditampilkan jelas. Ketersediaan dikonfirmasi lewat WhatsApp.',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-12">
        <div className="grid md:grid-cols-3 gap-8">
          {points.map((point) => (
            <div key={point.title} className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-lg shrink-0">
                {point.icon}
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">{point.title}</h4>
                <p className="text-white/50 text-sm">{point.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
