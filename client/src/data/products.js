export const formatRupiah = (value) =>
  Number(value || 0).toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  });

export const products = [
  {
    id: 'samsung-galaxy-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra',
    brand: 'Samsung',
    tag: 'UNGGULAN PILIHAN',
    featured: true,
    price: 16999000,
    originalPrice: null,
    description:
      'Flagship Samsung dengan performa premium, kamera luar biasa, dan layar yang sangat nyaman untuk editing dan gaming.',
    image: '/assets/figma/samsung-galaxy-s24-ultra.png',
    colors: ['#d4d4d8', '#2d2d2d', '#9c8d64'],
    colorNames: ['Titanium Gray', 'Titanium Black', 'Titanium Yellow'],
    releaseYear: 2024,
    isNew: true,
    performanceScore: 98,
    cameraScore: 96,
    stock: 10,
    stockStatus: 'Tersedia',
    badges: ['Best Seller'],
    variants: [
      { storage: '256 GB', price: 16999000, stock: 10, color: '#d4d4d8', colorName: 'Titanium Gray' },
      { storage: '512 GB', price: 20699000, stock: 10, color: '#2d2d2d', colorName: 'Titanium Black' },
    ],
    specs: [
      { label: 'Layar', value: '6.8" Dynamic AMOLED 2X · 120 Hz' },
      { label: 'Kamera utama', value: '200 MP + OIS' },
      { label: 'Prosesor', value: 'Snapdragon 8 Gen 3 for Galaxy' },
      { label: 'RAM / Penyimpanan', value: '12 GB / 256 GB' },
      { label: 'Baterai', value: '5.000 mAh · 45W' },
      { label: 'Konektivitas', value: '5G · Wi-Fi 7' },
    ],
    highlights: [
      'Kamera 200 MP dengan zoom optik 5x',
      'Layar anti-silau 2.600 nits',
      'S Pen untuk produktivitas harian',
    ],
  },
  {
    id: 'apple-iphone-15',
    name: 'Apple iPhone 15',
    brand: 'Apple',
    tag: 'FAVORIT SEHARI-HARI',
    featured: true,
    price: 15499000,
    originalPrice: null,
    description:
      'iPhone 15 memberikan keseimbangan sempurna antara performa, desain premium, dan kemudahan penggunaan harian.',
    image: '/assets/figma/apple-iphone-15.png',
    colors: ['#becfe7', '#c0c0c0', '#71809b'],
    colorNames: ['Biru Muda', 'Silver', 'Biru Tua'],
    releaseYear: 2023,
    isNew: false,
    performanceScore: 95,
    cameraScore: 92,
    stock: 10,
    stockStatus: 'Tersedia',
    badges: ['Best Seller'],
    variants: [
      { storage: '128 GB', price: 15499000, stock: 10, color: '#becfe7', colorName: 'Biru Muda' },
      { storage: '256 GB', price: 16999000, stock: 10, color: '#c0c0c0', colorName: 'Silver' },
    ],
    specs: [
      { label: 'Layar', value: '6.1" Super Retina XDR · 60 Hz' },
      { label: 'Kamera utama', value: '48 MP + OIS' },
      { label: 'Prosesor', value: 'Apple A16 Bionic' },
      { label: 'RAM / Penyimpanan', value: '6 GB / 128 GB' },
      { label: 'Baterai', value: '3.349 mAh · 20W' },
      { label: 'Konektivitas', value: '5G · USB-C' },
    ],
    highlights: [
      'Dynamic Island dan kamera 48 MP',
      'Ekostem Apple yang mulus dan awet',
      'Perekaman video kelas profesional',
    ],
  },
  {
    id: 'redmi-note-13-pro-5g',
    name: 'Redmi Note 13 Pro 5G',
    brand: 'Xiaomi',
    tag: 'SPESIFIKASI TERBAIK',
    featured: true,
    price: 4499000,
    originalPrice: 4799000,
    description:
      'Pilihan terbaik untuk kebutuhan harian dan gaming dengan harga yang sangat masuk akal untuk spesifikasi tinggi.',
    image: '/assets/figma/redmi-note-13-pro-5g.png',
    colors: ['#d3c0ff', '#b0d7c6', '#c8bcff'],
    colorNames: ['Lavender', 'Mint', 'Lilac'],
    releaseYear: 2024,
    isNew: false,
    performanceScore: 78,
    cameraScore: 88,
    stock: 10,
    stockStatus: 'Tersedia',
    badges: ['Promo', 'Best Seller'],
    variants: [
      { storage: '256 GB', price: 4499000, stock: 10, color: '#d3c0ff', colorName: 'Lavender' },
      { storage: '512 GB', price: 5499000, stock: 10, color: '#b0d7c6', colorName: 'Mint' },
    ],
    specs: [
      { label: 'Layar', value: '6.7" AMOLED · 120 Hz' },
      { label: 'Kamera utama', value: '200 MP + OIS' },
      { label: 'Prosesor', value: 'Snapdragon 7s Gen 2' },
      { label: 'RAM / Penyimpanan', value: '8 GB / 256 GB' },
      { label: 'Baterai', value: '5.100 mAh · 67W' },
      { label: 'Konektivitas', value: '5G · Wi-Fi 6' },
    ],
    highlights: [
      'Kamera 200 MP untuk detail tajam',
      'Pengisian cepat 67W',
      'Harga paling bersahabat di kelasnya',
    ],
  },
  {
    id: 'vivo-30',
    name: 'Vivo V30',
    brand: 'vivo',
    tag: 'ANDALAN POTRET',
    featured: true,
    price: 5499000,
    originalPrice: null,
    description:
      'Smartphone dengan desain stylish, layar AMOLED, dan kamera potret yang cocok untuk multimedia sehari-hari.',
    image: '/assets/figma/vivo-30.png',
    colors: ['#5ab4a8', '#d7dfe9', '#1f2d3a'],
    colorNames: ['Hijau Tosca', 'Putih', 'Biru Gelap'],
    releaseYear: 2024,
    isNew: false,
    performanceScore: 80,
    cameraScore: 90,
    stock: 10,
    stockStatus: 'Tersedia',
    badges: ['Baru'],
    variants: [
      { storage: '256 GB', price: 5499000, stock: 10, color: '#5ab4a8', colorName: 'Hijau Tosca' },
      { storage: '512 GB', price: 6999000, stock: 10, color: '#d7dfe9', colorName: 'Putih' },
    ],
    specs: [
      { label: 'Layar', value: '6.78" AMOLED · 120 Hz' },
      { label: 'Kamera utama', value: '50 MP + OIS' },
      { label: 'Prosesor', value: 'Snapdragon 7 Gen 3' },
      { label: 'RAM / Penyimpanan', value: '8 GB / 256 GB' },
      { label: 'Baterai', value: '5.000 mAh · 80W' },
      { label: 'Konektivitas', value: '5G · Wi-Fi 6' },
    ],
    highlights: [
      'Aura Light untuk potret malam',
      'Desain tipis dan ringan',
      'Pengisian cepat 80W',
    ],
  },
  {
    id: 'realme-12-pro-plus-5g',
    name: 'realme 12 Pro+ 5G',
    brand: 'realme',
    tag: 'ZOOM PORTRAIT',
    featured: true,
    price: 5999000,
    originalPrice: null,
    description:
      'realme 12 Pro+ 5G menghadirkan kamera telefoto periskop dan desain mewah di kelas menengah, cocok untuk foto potret dan zoom.',
    image: '/assets/figma/realme-12-pro-plus-5g.png',
    colors: ['#e8622c', '#d9b45c', '#5b7cc9'],
    colorNames: ['Orange', 'Gold', 'Blue'],
    releaseYear: 2024,
    isNew: true,
    performanceScore: 84,
    cameraScore: 93,
    stock: 10,
    stockStatus: 'Tersedia',
    badges: [],
    variants: [
      { storage: '256 GB', price: 5999000, stock: 10, color: '#e8622c', colorName: 'Orange' },
      { storage: '512 GB', price: 6999000, stock: 10, color: '#d9b45c', colorName: 'Gold' },
    ],
    specs: [
      { label: 'Layar', value: '6.7" AMOLED · 120 Hz' },
      { label: 'Kamera utama', value: '50 MP + OIS + telefoto 64 MP' },
      { label: 'Prosesor', value: 'Snapdragon 7s Gen 2' },
      { label: 'RAM / Penyimpanan', value: '12 GB / 512 GB' },
      { label: 'Baterai', value: '5.000 mAh · 67W' },
      { label: 'Konektivitas', value: '5G · Wi-Fi 6' },
    ],
    highlights: [
      'Kamera telefoto periskop 64 MP',
      'Desain kulit vegan premium',
      'RAM besar 12 GB untuk multitasking',
    ],
  },
  {
    id: 'oppo-reno12-5g',
    name: 'OPPO Reno12 5G',
    brand: 'OPPO',
    tag: 'DESAIN TIPIS',
    featured: true,
    price: 5999000,
    originalPrice: 7499000,
    description:
      'OPPO Reno12 5G memadukan bodi tipis, layar melengkung, dan kamera potret AI yang siap menemani gaya hidup sehari-hari.',
    image: '/assets/figma/oppo-reno12-5g.png',
    colors: ['#e8e2f2', '#c9bde6', '#9f9aa8'],
    colorNames: ['Silver', 'Lilac', 'Abu-abu'],
    releaseYear: 2024,
    isNew: true,
    performanceScore: 82,
    cameraScore: 89,
    stock: 10,
    stockStatus: 'Tersedia',
    badges: ['Promo'],
    variants: [
      { storage: '256 GB', price: 5999000, stock: 10, color: '#e8e2f2', colorName: 'Silver' },
      { storage: '512 GB', price: 6999000, stock: 10, color: '#c9bde6', colorName: 'Lilac' },
    ],
    specs: [
      { label: 'Layar', value: '6.7" AMOLED · 120 Hz' },
      { label: 'Kamera utama', value: '50 MP + OIS' },
      { label: 'Prosesor', value: 'MediaTek Dimensity 7300' },
      { label: 'RAM / Penyimpanan', value: '12 GB / 256 GB' },
      { label: 'Baterai', value: '5.000 mAh · 80W' },
      { label: 'Konektivitas', value: '5G · Wi-Fi 6' },
    ],
    highlights: [
      'Bodi tipis 7,3 mm dan ringan',
      'AI Eraser untuk foto bersih',
      'Pengisian cepat 80W',
    ],
  },
  {
    id: 'samsung-galaxy-a55-5g',
    name: 'Samsung Galaxy A55 5G',
    brand: 'Samsung',
    tag: 'ANDALAN KELAS MENENGAH',
    featured: false,
    price: 4999000,
    originalPrice: 6499000,
    description:
      'Samsung Galaxy A55 5G menawarkan bodi metal, layar Super AMOLED, dan kamera OIS yang seimbang untuk pemakaian harian jangka panjang.',
    image: '/assets/figma/samsung-galaxy-a55-5g.png',
    colors: ['#a8c6e8', '#2b3a55', '#c9b6e4'],
    colorNames: ['Awesome Iceblue', 'Awesome Navy', 'Awesome Lilac'],
    releaseYear: 2024,
    isNew: false,
    performanceScore: 72,
    cameraScore: 84,
    stock: 10,
    stockStatus: 'Tersedia',
    badges: ['Promo', 'Best Seller'],
    variants: [
      { storage: '128 GB', price: 4999000, stock: 10, color: '#a8c6e8', colorName: 'Awesome Iceblue' },
      { storage: '256 GB', price: 5499000, stock: 10, color: '#2b3a55', colorName: 'Awesome Navy' },
    ],
    specs: [
      { label: 'Layar', value: '6.6" Super AMOLED · 120 Hz' },
      { label: 'Kamera utama', value: '50 MP + OIS' },
      { label: 'Prosesor', value: 'Exynos 1480' },
      { label: 'RAM / Penyimpanan', value: '8 GB / 256 GB' },
      { label: 'Baterai', value: '5.000 mAh · 25W' },
      { label: 'Konektivitas', value: '5G · Wi-Fi 6' },
    ],
    highlights: [
      'Bodi metal dan Gorilla Glass Victus+',
      'Empat tahun pembaruan Android',
      'Kamera OIS untuk video stabil',
    ],
  },
  {
    id: 'apple-iphone-16',
    name: 'Apple iPhone 16',
    brand: 'Apple',
    tag: 'BARU · APPLE INTELLIGENCE',
    featured: true,
    price: 17999000,
    originalPrice: null,
    description:
      'iPhone 16 membawa chip A18, tombol Camera Control, dan Apple Intelligence dalam bodi ringkas yang nyaman dipakai sehari-hari.',
    image: '/assets/figma/apple-iphone-16.png',
    colors: ['#cfe3f2', '#f2efe8', '#1f1f22'],
    colorNames: ['Ultramarine', 'White', 'Black'],
    releaseYear: 2024,
    isNew: true,
    performanceScore: 97,
    cameraScore: 94,
    stock: 10,
    stockStatus: 'Tersedia',
    badges: ['Baru'],
    variants: [
      { storage: '128 GB', price: 17999000, stock: 10, color: '#cfe3f2', colorName: 'Ultramarine' },
      { storage: '256 GB', price: 19499000, stock: 10, color: '#f2efe8', colorName: 'White' },
    ],
    specs: [
      { label: 'Layar', value: '6.1" Super Retina XDR · 60 Hz' },
      { label: 'Kamera utama', value: '48 MP Fusion + ultrawide 12 MP' },
      { label: 'Prosesor', value: 'Apple A18' },
      { label: 'RAM / Penyimpanan', value: '8 GB / 128 GB' },
      { label: 'Baterai', value: '3.561 mAh · 20W' },
      { label: 'Konektivitas', value: '5G · USB-C' },
    ],
    highlights: [
      'Chip A18 dengan Apple Intelligence',
      'Tombol Camera Control',
      'Desain ringan dan tahan lama',
    ],
  },
  {
    id: 'xiaomi-14t-pro',
    name: 'Xiaomi 14T Pro',
    brand: 'Xiaomi',
    tag: 'FLAGSHIP KAMERA',
    featured: true,
    price: 7299000,
    originalPrice: null,
    description:
      'Xiaomi 14T Pro menghadirkan kamera Leica, layar 144 Hz, dan pengisian 120W untuk performa flagship di harga kompetitif.',
    image: '/assets/figma/xiaomi-14t-pro.png',
    colors: ['#2b2b2e', '#a9b7c6', '#d8d4ce'],
    colorNames: ['Titan Black', 'Titan Blue', 'Titan Gray'],
    releaseYear: 2024,
    isNew: true,
    performanceScore: 93,
    cameraScore: 95,
    stock: 10,
    stockStatus: 'Tersedia',
    badges: ['Baru'],
    variants: [
      { storage: '256 GB', price: 7299000, stock: 10, color: '#2b2b2e', colorName: 'Titan Black' },
      { storage: '512 GB', price: 8799000, stock: 10, color: '#a9b7c6', colorName: 'Titan Blue' },
    ],
    specs: [
      { label: 'Layar', value: '6.67" AMOLED · 144 Hz' },
      { label: 'Kamera utama', value: '50 MP Leica + telefoto 50 MP' },
      { label: 'Prosesor', value: 'MediaTek Dimensity 9300+' },
      { label: 'RAM / Penyimpanan', value: '12 GB / 512 GB' },
      { label: 'Baterai', value: '5.000 mAh · 120W' },
      { label: 'Konektivitas', value: '5G · Wi-Fi 7' },
    ],
    highlights: [
      'Kamera Leica dengan telefoto',
      'HyperCharge 120W',
      'Layar 144 Hz untuk gaming',
    ],
  },
  {
    id: 'oppo-find-x8',
    name: 'OPPO Find X8',
    brand: 'OPPO',
    tag: 'FLAGSHIP KOMPAK',
    featured: false,
    price: 11999000,
    originalPrice: null,
    description:
      'OPPO Find X8 memadukan kamera Hasselblad, chip Dimensity 9400, dan desain ringkas dengan baterai besar dalam satu perangkat.',
    image: '/assets/figma/oppo-find-x8.png',
    colors: ['#2f3336', '#e8e6df', '#b7c7d6'],
    colorNames: ['Black', 'White', 'Blue'],
    releaseYear: 2024,
    isNew: true,
    performanceScore: 95,
    cameraScore: 96,
    stock: 10,
    stockStatus: 'Tersedia',
    badges: [],
    variants: [
      { storage: '256 GB', price: 11999000, stock: 10, color: '#2f3336', colorName: 'Black' },
      { storage: '512 GB', price: 14999000, stock: 10, color: '#e8e6df', colorName: 'White' },
    ],
    specs: [
      { label: 'Layar', value: '6.59" AMOLED · 120 Hz' },
      { label: 'Kamera utama', value: '50 MP Hasselblad triple + periskop' },
      { label: 'Prosesor', value: 'MediaTek Dimensity 9400' },
      { label: 'RAM / Penyimpanan', value: '12 GB / 256 GB' },
      { label: 'Baterai', value: '5.630 mAh · 80W' },
      { label: 'Konektivitas', value: '5G · Wi-Fi 7' },
    ],
    highlights: [
      'Kamera Hasselblad dengan periskop',
      'Bodi ringkas dan seimbang',
      'Baterai besar 5.630 mAh',
    ],
  },
  {
    id: 'vivo-x100',
    name: 'vivo X100',
    brand: 'vivo',
    tag: 'KAMERA ZEISS',
    price: 9299000,
    originalPrice: null,
    description:
      'vivo X100 dikenal dengan kamera ZEISS, chip Dimensity 9300, dan pengisian cepat 120W untuk fotografi dan performa kelas atas.',
    image: '/assets/figma/vivo-x100.png',
    colors: ['#c9b7a4', '#dbe3ea', '#d9c7b8'],
    colorNames: ['Asteroid Black', 'Blue', 'Sunset Orange'],
    releaseYear: 2023,
    isNew: false,
    performanceScore: 94,
    cameraScore: 97,
    stock: 10,
    stockStatus: 'Tersedia',
    badges: [],
    variants: [
      { storage: '256 GB', price: 9299000, stock: 10, color: '#c9b7a4', colorName: 'Asteroid Black' },
      { storage: '512 GB', price: 9999000, stock: 10, color: '#dbe3ea', colorName: 'Blue' },
    ],
    specs: [
      { label: 'Layar', value: '6.78" AMOLED · 120 Hz' },
      { label: 'Kamera utama', value: '50 MP ZEISS triple + periskop' },
      { label: 'Prosesor', value: 'MediaTek Dimensity 9300' },
      { label: 'RAM / Penyimpanan', value: '12 GB / 256 GB' },
      { label: 'Baterai', value: '5.000 mAh · 120W' },
      { label: 'Konektivitas', value: '5G · Wi-Fi 7' },
    ],
    highlights: [
      'Kamera ZEISS dengan periskop',
      'Pengisian cepat 120W',
      'Layar AMOLED 120 Hz',
    ],
  },
  {
    id: 'samsung-galaxy-z-flip6',
    name: 'Samsung Galaxy Z Flip6',
    brand: 'Samsung',
    tag: 'LIPAT MODERN',
    price: 11999000,
    originalPrice: null,
    description:
      'Galaxy Z Flip6 menawarkan desain lipat kompak, FlexWindow yang lebih fungsional, dan kamera 50 MP dengan bantuan AI.',
    image: '/assets/figma/samsung-galaxy-z-flip6.png',
    colors: ['#f2d36b', '#b9c6d6', '#d6d6d6'],
    colorNames: ['Yellow', 'Blue', 'Silver Shadow'],
    releaseYear: 2024,
    isNew: true,
    performanceScore: 92,
    cameraScore: 88,
    stock: 10,
    stockStatus: 'Tersedia',
    badges: [],
    variants: [
      { storage: '256 GB', price: 11999000, stock: 10, color: '#f2d36b', colorName: 'Yellow' },
      { storage: '512 GB', price: 12999000, stock: 10, color: '#b9c6d6', colorName: 'Blue' },
    ],
    specs: [
      { label: 'Layar', value: '6.7" AMOLED lipat · 120 Hz' },
      { label: 'Kamera utama', value: '50 MP + OIS' },
      { label: 'Prosesor', value: 'Snapdragon 8 Gen 3 for Galaxy' },
      { label: 'RAM / Penyimpanan', value: '12 GB / 256 GB' },
      { label: 'Baterai', value: '4.000 mAh · 25W' },
      { label: 'Konektivitas', value: '5G · Wi-Fi 6E' },
    ],
    highlights: [
      'Desain lipat yang kompak',
      'FlexWindow untuk notifikasi cepat',
      'Fitur foto berbasis AI',
    ],
  },
  {
    id: 'apple-iphone-16-pro-max',
    name: 'Apple iPhone 16 Pro Max',
    brand: 'Apple',
    tag: 'PREMIUM MAKSIMAL',
    price: 20499000,
    originalPrice: null,
    description:
      'iPhone 16 Pro Max adalah pilihan tertinggi dengan layar 6,9 inci, chip A18 Pro, dan sistem kamera tetraprism untuk zoom jauh.',
    image: '/assets/figma/apple-iphone-16-pro-max.png',
    colors: ['#b8b3a8', '#3a3a3c', '#d8cfc4'],
    colorNames: ['Natural Titanium', 'Black Titanium', 'Desert Titanium'],
    releaseYear: 2024,
    isNew: true,
    performanceScore: 100,
    cameraScore: 99,
    stock: 10,
    stockStatus: 'Tersedia',
    badges: [],
    variants: [
      { storage: '256 GB', price: 20499000, stock: 10, color: '#b8b3a8', colorName: 'Natural Titanium' },
      { storage: '512 GB', price: 21999000, stock: 10, color: '#3a3a3c', colorName: 'Black Titanium' },
    ],
    specs: [
      { label: 'Layar', value: '6.9" Super Retina XDR · 120 Hz' },
      { label: 'Kamera utama', value: '48 MP Fusion triple + tetraprism 5x' },
      { label: 'Prosesor', value: 'Apple A18 Pro' },
      { label: 'RAM / Penyimpanan', value: '8 GB / 256 GB' },
      { label: 'Baterai', value: '4.685 mAh · 30W' },
      { label: 'Konektivitas', value: '5G · USB-C' },
    ],
    highlights: [
      'Zoom optik 5x tetraprism',
      'Layar terbesar di lini iPhone',
      'Performa A18 Pro untuk editing video',
    ],
  },
  {
    id: 'apple-iphone-17-pro-max',
    name: 'Apple iPhone 17 Pro Max 1TB',
    brand: 'Apple',
    tag: 'BARU · 2025',
    featured: true,
    price: 34249000,
    originalPrice: null,
    description:
      'iPhone 17 Pro Max hadir dengan chip A19 Pro, sistem kamera triple 48 MP, dan penyimpanan 1TB untuk kreator yang butuh ruang ekstra.',
    image: '/assets/figma/apple-iphone-17-pro-max.png',
    colors: ['#e8622c', '#2f4f7f', '#d8d8d4'],
    colorNames: ['Cosmic Orange', 'Deep Blue', 'Silver'],
    releaseYear: 2025,
    isNew: true,
    performanceScore: 100,
    cameraScore: 100,
    stock: 10,
    stockStatus: 'Tersedia',
    badges: ['Baru'],
    variants: [
      { storage: '1 TB', price: 34249000, stock: 10, color: '#e8622c', colorName: 'Cosmic Orange' },
      { storage: '2 TB', price: 43249000, stock: 10, color: '#2f4f7f', colorName: 'Deep Blue' },
    ],
    specs: [
      { label: 'Layar', value: '6.9" Super Retina XDR ProMotion · 120 Hz' },
      { label: 'Kamera utama', value: '48 MP Fusion triple + telefoto 48 MP' },
      { label: 'Prosesor', value: 'Apple A19 Pro' },
      { label: 'RAM / Penyimpanan', value: '12 GB / 1 TB' },
      { label: 'Baterai', value: '4.800 mAh · 40W' },
      { label: 'Konektivitas', value: '5G · Wi-Fi 7 · USB-C' },
    ],
    highlights: [
      'Penyimpanan super lega 1TB',
      'Chip A19 Pro untuk video dan gaming',
      'Sistem kamera triple 48 MP',
    ],
  },
  {
    id: 'vivo-v40',
    name: 'vivo V40',
    brand: 'vivo',
    tag: 'POTRET ZEISS',
    price: 6999000,
    originalPrice: null,
    description:
      'vivo V40 menghadirkan kamera ZEISS, baterai 5.500 mAh, dan desain tipis dengan perlindungan IP68 di kelas menengah atas.',
    image: '/assets/figma/vivo-v40.png',
    colors: ['#b9c6d8', '#d9b8c4', '#2f3b4a'],
    colorNames: ['Stellar Silver', 'Rose', 'Nebula Blue'],
    releaseYear: 2024,
    isNew: true,
    performanceScore: 80,
    cameraScore: 93,
    stock: 10,
    stockStatus: 'Tersedia',
    badges: [],
    variants: [
      { storage: '128 GB', price: 6499000, stock: 10, color: '#b9c6d8', colorName: 'Stellar Silver' },
      { storage: '256 GB', price: 6999000, stock: 10, color: '#d9b8c4', colorName: 'Rose' },
    ],
    specs: [
      { label: 'Layar', value: '6.78" AMOLED · 120 Hz' },
      { label: 'Kamera utama', value: '50 MP ZEISS + ultrawide 50 MP' },
      { label: 'Prosesor', value: 'Snapdragon 7 Gen 3' },
      { label: 'RAM / Penyimpanan', value: '12 GB / 256 GB' },
      { label: 'Baterai', value: '5.500 mAh · 80W' },
      { label: 'Konektivitas', value: '5G · Wi-Fi 6' },
    ],
    highlights: [
      'Kamera potret ZEISS',
      'Baterai besar 5.500 mAh',
      'Tahan air dan debu IP68',
    ],
  },
  {
    id: 'realme-13-pro-plus',
    name: 'realme 13 Pro+',
    brand: 'realme',
    tag: 'KAMERA AI',
    price: 6499000,
    originalPrice: null,
    description:
      'realme 13 Pro+ membawa kamera AI Hyperimage, zoom periskop, dan desain artistik untuk pengalaman fotografi yang lebih ekspresif.',
    image: '/assets/figma/realme-13-pro-plus.png',
    colors: ['#c7a45b', '#b6a7d6', '#3d4a5c'],
    colorNames: ['Monet Gold', 'Lavender', 'Navy'],
    releaseYear: 2024,
    isNew: true,
    performanceScore: 83,
    cameraScore: 94,
    stock: 10,
    stockStatus: 'Tersedia',
    badges: [],
    variants: [
      { storage: '256 GB', price: 6499000, stock: 10, color: '#c7a45b', colorName: 'Monet Gold' },
      { storage: '512 GB', price: 7999000, stock: 10, color: '#b6a7d6', colorName: 'Lavender' },
    ],
    specs: [
      { label: 'Layar', value: '6.7" AMOLED · 120 Hz' },
      { label: 'Kamera utama', value: '50 MP OIS + periskop 50 MP' },
      { label: 'Prosesor', value: 'Snapdragon 7s Gen 2' },
      { label: 'RAM / Penyimpanan', value: '12 GB / 256 GB' },
      { label: 'Baterai', value: '5.200 mAh · 80W' },
      { label: 'Konektivitas', value: '5G · Wi-Fi 6' },
    ],
    highlights: [
      'Kamera AI Hyperimage',
      'Zoom periskop 3x',
      'Desain artistik Monet',
    ],
  },
  {
    id: 'redmi-13',
    name: 'Redmi 13',
    brand: 'Xiaomi',
    tag: 'BUDGET ANDALAN',
    featured: false,
    price: 1899000,
    originalPrice: 2799000,
    description:
      'Handphone budget untuk Sukabumi dengan layar 90 Hz, kamera 108 MP, dan baterai tahan lama dalam harga yang ramah dompet.',
    image: '/assets/figma/redmi-note-13-pro-5g.png',
    colors: ['#d3c0ff', '#b0d7c6'],
    colorNames: ['Lavender', 'Mint'],
    releaseYear: 2024,
    isNew: true,
    performanceScore: 65,
    cameraScore: 78,
    stock: 10,
    stockStatus: 'Tersedia',
    badges: ['Promo', 'Best Seller'],
    variants: [
      { storage: '128 GB', price: 1899000, stock: 10, color: '#d3c0ff', colorName: 'Lavender' },
      { storage: '256 GB', price: 2199000, stock: 10, color: '#b0d7c6', colorName: 'Mint' },
    ],
    specs: [
      { label: 'Layar', value: '6.79" IPS LCD · 90 Hz' },
      { label: 'Kamera utama', value: '108 MP' },
      { label: 'Prosesor', value: 'MediaTek Helio G91 Ultra' },
      { label: 'RAM / Penyimpanan', value: '8 GB / 256 GB' },
      { label: 'Baterai', value: '5.030 mAh · 33W' },
      { label: 'Konektivitas', value: '4G · Wi-Fi 5' },
    ],
    highlights: [
      'Layar besar 6,79 inci 90 Hz',
      'Kamera 108 MP hasil tajam',
      'Harga terjangkau untuk semua kalangan',
    ],
  },
  {
    id: 'infinix-note-40',
    name: 'Infinix Note 40',
    brand: 'Infinix',
    tag: 'BUDGET GAMING',
    featured: false,
    price: 2499000,
    originalPrice: 3499000,
    description:
      'Infinix Note 40 hadir dengan layar AMOLED 120 Hz, pengisian cepat 45W, dan baterai besar untuk aktivitas gaming sehari-hari di Sukabumi.',
    image: '/assets/figma/vivo-30.png',
    colors: ['#5ab4a8', '#d7dfe9'],
    colorNames: ['Hijau Tosca', 'Putih'],
    releaseYear: 2024,
    isNew: true,
    performanceScore: 68,
    cameraScore: 75,
    stock: 10,
    stockStatus: 'Tersedia',
    badges: ['Promo'],
    variants: [
      { storage: '128 GB', price: 2499000, stock: 10, color: '#5ab4a8', colorName: 'Hijau Tosca' },
      { storage: '256 GB', price: 2799000, stock: 10, color: '#d7dfe9', colorName: 'Putih' },
    ],
    specs: [
      { label: 'Layar', value: '6.78" AMOLED · 120 Hz' },
      { label: 'Kamera utama', value: '108 MP + OIS' },
      { label: 'Prosesor', value: 'MediaTek Helio G99 Ultimate' },
      { label: 'RAM / Penyimpanan', value: '8 GB / 256 GB' },
      { label: 'Baterai', value: '5.000 mAh · 45W' },
      { label: 'Konektivitas', value: '4G · Wi-Fi 5' },
    ],
    highlights: [
      'Layar AMOLED 120 Hz halus',
      'Pengisian cepat 45W + charge bypass',
      'Speaker stereo dengan DTS',
    ],
  },
  {
    id: 'samsung-galaxy-a15-4g',
    name: 'Samsung Galaxy A15 4G',
    brand: 'Samsung',
    tag: 'BUDGET SAMSUNG',
    featured: false,
    price: 2899000,
    originalPrice: null,
    description:
      'Samsung Galaxy A15 4G menawarkan layar Super AMOLED 90 Hz, kamera 50 MP, dan jaminan pembaruan Samsung dengan harga terjangkau untuk warga Sukabumi.',
    image: '/assets/figma/samsung-galaxy-a55-5g.png',
    colors: ['#a8c6e8', '#2b3a55'],
    colorNames: ['Awesome Iceblue', 'Awesome Navy'],
    releaseYear: 2024,
    isNew: false,
    performanceScore: 62,
    cameraScore: 72,
    stock: 10,
    stockStatus: 'Tersedia',
    badges: ['Best Seller'],
    variants: [
      { storage: '128 GB', price: 2899000, stock: 10, color: '#a8c6e8', colorName: 'Awesome Iceblue' },
      { storage: '256 GB', price: 3299000, stock: 10, color: '#2b3a55', colorName: 'Awesome Navy' },
    ],
    specs: [
      { label: 'Layar', value: '6.5" Super AMOLED · 90 Hz' },
      { label: 'Kamera utama', value: '50 MP + OIS' },
      { label: 'Prosesor', value: 'MediaTek Helio G99' },
      { label: 'RAM / Penyimpanan', value: '4 GB / 128 GB' },
      { label: 'Baterai', value: '5.000 mAh · 25W' },
      { label: 'Konektivitas', value: '4G · Wi-Fi 5' },
    ],
    highlights: [
      'Layar Super AMOLED 90 Hz',
      'Kamera utama 50 MP dengan OIS',
      'Dukungan pembaruan Samsung jangka panjang',
    ],
  },
];

export const brands = ['Semua', 'Samsung', 'Apple', 'Xiaomi', 'OPPO', 'vivo', 'realme', 'Infinix'];

export const featureFilters = [
  'Pilihan handphone',
  'Terbaru',
  'Kamera unggul',
  'Performa kencang',
  'Harga bersahabat',
];

export const filterMeta = {
  'Pilihan handphone': {
    description: 'Semua handphone pilihan HenGadget, dari andalan harian sampai flagship.',
    test: () => true,
    sort: (a, b) => b.releaseYear - a.releaseYear,
  },
  Terbaru: {
    description: 'Handphone rilis terbaru yang paling relevan untuk dibeli sekarang.',
    test: (product) => product.isNew,
    sort: (a, b) => b.releaseYear - a.releaseYear,
  },
  'Kamera unggul': {
    description: 'Kamera dengan skor terbaik: sensor besar, OIS, dan hasil potret tajam.',
    test: (product) => product.cameraScore >= 90,
    sort: (a, b) => b.cameraScore - a.cameraScore,
  },
  'Performa kencang': {
    description: 'Chipset bertenaga untuk gaming, editing, dan multitasking berat.',
    test: (product) => product.performanceScore >= 84,
    sort: (a, b) => b.performanceScore - a.performanceScore,
  },
  'Harga bersahabat': {
    description: 'Spesifikasi terbaik dengan harga paling masuk kantong (di bawah Rp6,5 juta).',
    test: (product) => product.price <= 6500000,
    sort: (a, b) => a.price - b.price,
  },
};

export const getProductById = (id) => products.find((product) => product.id === id);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function hexToHsl(hex) {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((char) => char + char)
          .join('')
      : value;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === r) h = 60 * (((g - b) / delta) % 6);
    else if (max === g) h = 60 * ((b - r) / delta + 2);
    else h = 60 * ((r - g) / delta + 4);
  }

  if (h < 0) h += 360;
  return { h, s: clamp(s, 0, 1), l: clamp(l, 0, 1) };
}

export function getColorEffect(color, active = true) {
  if (!active) {
    return {
      filter: 'none',
      hueOpacity: 0,
      tintOpacity: 0,
      glow: 'rgba(255,255,255,0)',
      label: null,
    };
  }

  const { s, l } = hexToHsl(color);
  const isNeutral = s < 0.18;

  let filter;
  if (isNeutral) {
    if (l < 0.32) filter = 'grayscale(1) brightness(0.52)';
    else if (l > 0.72) filter = 'grayscale(1) brightness(1.1)';
    else filter = 'grayscale(1) brightness(0.85)';
  } else {
    const brightness = clamp(0.97 + (l - 0.5) * 0.18, 0.85, 1.08);
    const saturation = clamp(0.95 + s * 0.55, 1, 1.45);
    filter = `saturate(${saturation.toFixed(2)}) brightness(${brightness.toFixed(2)})`;
  }

  return {
    filter,
    hueOpacity: isNeutral ? 0 : 0.92,
    tintOpacity: isNeutral ? 0 : 0.14,
    glow: `radial-gradient(circle at 50% 42%, ${color}55 0%, ${color}22 42%, transparent 70%)`,
    label: isNeutral ? 'netral' : 'warna',
  };
}

export const articles = [
  {
    id: 'ram-mitos',
    title: 'Jangan cuma lihat RAM. Ini yang perlu kamu cek.',
    category: 'DASAR MELIHAT',
    readTime: '5 menit baca',
    image: '/assets/figma/articles/ram-mitos.jpg',
    excerpt:
      'Panduan singkat membaca spesifikasi yang benar-benar terasa di lapangan, bukan sekadar angka di brosur.',
    content: [
      'RAM besar memang membantu, tetapi pengalaman harian lebih ditentukan oleh kombinasi chipset, optimasi sistem, dan kecepatan penyimpanan. Handphone dengan RAM 8 GB dan chipset efisien bisa terasa lebih lancar daripada RAM 12 GB dengan prosesor lama.',
      'Perhatikan jenis penyimpanan. UFS 3.1 atau lebih baru memberi waktu buka aplikasi dan transfer file yang jauh lebih cepat dibanding eMMC. Untuk pemakaian beberapa tahun ke depan, penyimpanan cepat adalah investasi yang terasa setiap hari.',
      'Tanyakan juga kebijakan pembaruan sistem. Perangkat yang mendapat update Android dan patch keamanan lebih lama biasanya lebih aman dan tetap relevan lebih lama.',
    ],
  },
  {
    id: 'kamera-ois',
    title: 'Megapiksel besar belum tentu lengkap.',
    category: 'KENAL KAMERA',
    readTime: '4 menit baca',
    image: '/assets/figma/articles/kamera-ois.jpg',
    excerpt:
      'Kenali sensor, OIS, dan pemrosesan gambar sebelum memilih kamera handphone.',
    content: [
      'Angka megapiksel hanya menunjukkan jumlah piksel, bukan kualitas foto. Ukuran sensor dan kualitas lensa lebih menentukan kemampuan kamera dalam kondisi cahaya rendah.',
      'OIS atau optical image stabilization sangat membantu saat memotret malam atau merekam video sambil berjalan. Tanpa OIS, hasil foto mudah blur meski angka megapikselnya besar.',
      'Terakhir, lihat konsistensi warna antar-lensa. Kamera utama, ultrawide, dan telefoto sebaiknya menghasilkan warna yang serupa agar hasil foto terasa natural.',
    ],
  },
  {
    id: 'baterai-3-6-juta',
    title: 'Mencari titik pas di kelas Rp3–6 juta.',
    category: 'BUJET CERDAS',
    readTime: '6 menit baca',
    image: '/assets/figma/articles/baterai.jpg',
    excerpt:
      'Apa yang layak jadi prioritas, dan fitur apa yang bisa kamu kompromikan?',
    content: [
      'Di kelas Rp3–6 juta, prioritaskan hal yang paling sering kamu pakai: layar yang nyaman, baterai tahan lama, dan performa yang stabil. Fitur seperti kamera telefoto atau bodi metal bisa jadi nilai tambah, bukan keharusan.',
      'Cari handphone dengan pengisian cepat minimal 33W dan baterai 5.000 mAh. Kombinasi ini memberi ketenangan saat mobilitas tinggi tanpa harus sering mencari colokan.',
      'Jika budget terbatas, model generasi sebelumnya sering menjadi pilihan paling rasional. Spesifikasinya masih kompetitif, tetapi harganya sudah turun jauh.',
    ],
  },
];

export const getArticleById = (id) => articles.find((article) => article.id === id);
