import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../lib/api';
import { products as fallbackProducts } from '../data/products';
import { CurrencyProvider } from './CurrencyContext';

const CatalogContext = createContext(null);

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const asNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export function normalizeProduct(product) {
  const colors = asArray(product.colors).filter(Boolean);
  const colorNames = asArray(product.colorNames).filter(Boolean);
  const specs = asArray(product.specs).filter((spec) => spec && spec.label && spec.value);
  const highlights = asArray(product.highlights).filter(Boolean);

  return {
    ...product,
    brand: product.brand || 'Lainnya',
    tag: product.tag || 'PILIHAN HENGADGET',
    featured: Boolean(product.featured),
    price: asNumber(product.price),
    description: product.description || '',
    image: product.image || '/assets/figma/hero-galaxy-s24.png',
    colors: colors.length ? colors : ['#cbd5e1', '#94a3b8'],
    colorNames: colorNames.length ? colorNames : ['Default', 'Alternatif'],
    rating: asNumber(product.rating),
    reviews: asNumber(product.reviews),
    releaseYear: asNumber(product.releaseYear, new Date().getFullYear()),
    isNew: Boolean(product.isNew),
    performanceScore: asNumber(product.performanceScore),
    cameraScore: asNumber(product.cameraScore),
    stockStatus: product.stockStatus === 'Habis' ? 'Habis' : 'Tersedia',
    specs: specs.length
      ? specs
      : [{ label: 'Kategori', value: product.categoryName || product.categoryId || 'Handphone' }],
    highlights: highlights.length ? highlights : [],
  };
}

export function CatalogProvider({ children }) {
  const [products, setProducts] = useState(fallbackProducts);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({
    storeName: 'HenGadget',
    tagline: 'Best Gadget and Accessories',
    phone: '6287777747462',
    currency: 'Rp.',
    activeWhatsApp: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [productResult, categoryResult, storeResult] = await Promise.allSettled([
        apiRequest('/api/products'),
        apiRequest('/api/categories'),
        apiRequest('/api/store'),
      ]);

      if (productResult.status === 'fulfilled' && Array.isArray(productResult.value.data)) {
        setProducts(productResult.value.data.map(normalizeProduct));
      }
      if (categoryResult.status === 'fulfilled' && Array.isArray(categoryResult.value.data)) {
        setCategories(categoryResult.value.data);
      }
      if (storeResult.status === 'fulfilled' && storeResult.value.data) {
        setSettings((current) => ({ ...current, ...storeResult.value.data }));
      }

      if (productResult.status === 'rejected') {
        setError(productResult.reason?.message || 'Gagal memuat katalog.');
      } else {
        setError('');
      }
    } catch (requestError) {
      // API belum menyala: storefront tetap memakai katalog statis.
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const name = String(settings.storeName || 'HenGadget').trim() || 'HenGadget';
    const tagline = String(settings.tagline || '').trim();
    document.title = tagline ? `${name} — ${tagline}` : name;
  }, [settings.storeName, settings.tagline]);

  const brands = useMemo(
    () => ['Semua', ...new Set(products.map((product) => product.brand).filter(Boolean))],
    [products],
  );

  const value = useMemo(
    () => ({
      products,
      categories,
      brands,
      settings,
      loading,
      error,
      refresh,
      getProductById: (id) => products.find((product) => product.id === id) || null,
    }),
    [products, categories, brands, settings, loading, error, refresh],
  );

  return (
    <CurrencyProvider currency={settings.currency}>
      <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
    </CurrencyProvider>
  );
}

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) throw new Error('useCatalog must be used within CatalogProvider');
  return context;
};
