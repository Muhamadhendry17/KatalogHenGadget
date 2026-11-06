import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Hero from '../components/Hero';
import ProductGrid from '../components/ProductGrid';
import { ArticlesPreview, TrustSection } from '../components/ArticleCard';
import { useCatalog } from '../contexts/CatalogContext';

export default function Home() {
  const { products, brands } = useCatalog();

  return (
    <div className="min-h-screen bg-[#070b14]">
      <Navbar />
      <Hero />

      <ProductGrid
        heading="Temukan favorit baru."
        subheading={`${products.length} handphone pilihan dari ${brands.length - 1} merek, dari andalan harian sampai flagship premium. Klik filter untuk mempersempit pilihan.`}
        showAllLink
        horizontal
      />

      <ArticlesPreview />
      <TrustSection />
      <Footer />
    </div>
  );
}
