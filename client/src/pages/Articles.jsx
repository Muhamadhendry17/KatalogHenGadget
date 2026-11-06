import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ArticleCard, { TrustSection } from '../components/ArticleCard';
import { articles } from '../data/products';

export default function ArticlesPage() {
  return (
    <div className="min-h-screen bg-[#070b14]">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-xs text-white/35 flex items-center gap-2 mb-8" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-cyan-300 transition-colors">Beranda</Link>
            <span>/</span>
            <span className="text-white/60">Artikel</span>
          </nav>

          <div className="mb-12 max-w-3xl">
            <span className="text-cyan-300 text-xs font-bold uppercase tracking-[0.2em]">
              Sedikit baca, lebih yakin memilih
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mt-3">
              Biar paham, <span className="gradient-text">bukan sekadar iklan tren.</span>
            </h1>
            <p className="text-white/55 mt-3">
              Panduan singkat membaca spesifikasi yang benar-benar terasa di lapangan.
              Tanpa istilah rumit, tanpa tekanan untuk membeli.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-14">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          <TrustSection />
        </div>
      </main>

      <Footer />
    </div>
  );
}
