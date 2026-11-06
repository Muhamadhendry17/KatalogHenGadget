import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { articles, getArticleById } from '../data/products';
import { useCatalog } from '../contexts/CatalogContext';
import { normalizeWhatsAppNumber } from '../lib/phone';

export default function ArticleDetail() {
  const { id } = useParams();
  const { settings } = useCatalog();
  const article = getArticleById(id);

  if (!article) {
    return (
      <div className="min-h-screen bg-[#070b14]">
        <Navbar />
        <div className="min-h-[70vh] flex items-center justify-center px-4 pt-20">
          <div className="glass-panel p-12 text-center max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">Artikel tidak ditemukan</h2>
            <Link
              to="/articles"
              className="inline-flex rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#04111c] font-bold px-6 py-3 transition-colors"
            >
              Lihat semua artikel
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const otherArticles = articles.filter((item) => item.id !== article.id);
  const whatsappUrl =
    `https://wa.me/${normalizeWhatsAppNumber(settings.phone)}?text=` +
    encodeURIComponent('Halo HenGadget, saya sudah baca artikel dan ingin dibantu memilih handphone.');

  return (
    <div className="min-h-screen bg-[#070b14]">
      <Navbar />

      <main className="pt-28 pb-20">
        <article className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link to="/articles" className="text-sm text-cyan-300 hover:text-cyan-200 font-semibold">
            ← Semua artikel
          </Link>

          <div className="mt-6 flex items-center gap-3 text-xs">
            <span className="rounded-md bg-cyan-400/10 border border-cyan-400/20 px-2.5 py-1 font-bold text-cyan-300 uppercase tracking-wider">
              {article.category}
            </span>
            <span className="text-white/35">{article.readTime}</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-4 leading-tight">
            {article.title}
          </h1>
          <p className="text-white/55 mt-3 text-lg">{article.excerpt}</p>

          <div className="mt-8 rounded-3xl overflow-hidden border border-white/10">
            <img src={article.image} alt={article.title} className="w-full h-64 md:h-80 object-cover" />
          </div>

          <div className="mt-8 space-y-5">
            {article.content.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="text-white/75 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
            <h2 className="text-xl font-bold text-white">Masih bingung memilih?</h2>
            <p className="text-white/55 text-sm mt-2">
              Ceritakan budget dan kebutuhanmu. Kami bantu mempersingkat pilihan lewat WhatsApp.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <Link
                to="/catalog"
                className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#04111c] text-sm font-bold px-5 py-2.5 transition-colors"
              >
                Lihat katalog
              </Link>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20 text-sm font-semibold px-5 py-2.5 transition-colors"
              >
                Tanya via WhatsApp
              </a>
            </div>
          </div>

          {otherArticles.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-white mb-5">Baca juga</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {otherArticles.map((item) => (
                  <Link
                    key={item.id}
                    to={`/article/${item.id}`}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-cyan-400/30 transition-colors"
                  >
                    <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <p className="text-white font-semibold mt-2 leading-snug">{item.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
}
