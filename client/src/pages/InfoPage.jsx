import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCatalog } from '../contexts/CatalogContext';
import { formatPhoneNumber, normalizeWhatsAppNumber } from '../lib/phone';

const WHATSAPP_MESSAGE = encodeURIComponent('Halo HenGadget, saya ingin bertanya.');

const pages = {
  'panduan-membeli': {
    eyebrow: 'Bantu memilih',
    title: 'Panduan membeli handphone tanpa menyesal',
    intro:
      'Empat langkah sederhana untuk mempersempit pilihan sebelum kamu menghubungi kami.',
    sections: [
      {
        heading: '1. Tentukan budget sejak awal',
        paragraphs: [
          'Tetapkan batas atas yang nyaman, bukan sekadar angka maksimal yang sanggup dibayar. Sisihkan dana untuk casing, pelindung layar, dan cadangan servis.',
          'Di HenGadget, filter Harga bersahabat menampilkan pilihan di bawah Rp6,5 juta yang spesifikasinya masih kompetitif.',
        ],
      },
      {
        heading: '2. Pilih prioritas utama',
        paragraphs: [
          'Kalau sering memotret, utamakan kamera dengan OIS dan hasil potret yang konsisten. Kalau sering bermain game, utamakan chipset dan pendinginan. Jarang ada handphone yang sempurna di semua sisi pada satu harga.',
        ],
      },
      {
        heading: '3. Bandingkan dua kandidat',
        paragraphs: [
          'Gunakan halaman Perbandingan untuk melihat layar, kamera, prosesor, penyimpanan, dan baterai secara berdampingan. Ini membantu melihat kompromi yang sebenarnya.',
        ],
      },
      {
        heading: '4. Konfirmasi stok lewat WhatsApp',
        paragraphs: [
          'Harga di katalog adalah harga contoh. Sebelum memutuskan, tanyakan ketersediaan, warna, garansi, dan estimasi pengiriman melalui WhatsApp agar tidak ada kejutan.',
        ],
      },
    ],
  },
  faq: {
    eyebrow: 'Pertanyaan umum',
    title: 'Hal yang paling sering ditanyakan',
    intro: 'Belum menemukan jawabannya? Chat kami lewat WhatsApp, dijawab langsung oleh admin.',
    sections: [
      {
        heading: 'Apakah harga di katalog sudah final?',
        paragraphs: [
          'Harga yang ditampilkan adalah harga contoh untuk membantu perbandingan. Harga final dan ketersediaan dikonfirmasi melalui WhatsApp sebelum pembelian.',
        ],
      },
      {
        heading: 'Bagaimana cara memesan?',
        paragraphs: [
          'Tambahkan handphone ke keranjang, buka checkout, lalu klik Chat WhatsApp. Pesan otomatis berisi daftar produk, jumlah, dan total akan terkirim ke admin.',
        ],
      },
      {
        heading: 'Apakah semua produk bergaransi?',
        paragraphs: [
          'Ya. Produk yang kami tawarkan bergaransi resmi. Detail masa garansi dan klaim dijelaskan oleh admin saat konfirmasi pesanan.',
        ],
      },
      {
        heading: 'Bisa bandingkan lebih dari dua handphone?',
        paragraphs: [
          'Bisa. Di halaman Perbandingan, klik Tambahkan handphone lain untuk melihat hingga tiga produk berdampingan.',
        ],
      },
      {
        heading: 'Apakah bisa COD atau pengiriman luar kota?',
        paragraphs: [
          'Metode pembayaran dan pengiriman menyesuaikan lokasi. Admin akan mengirimkan opsi yang tersedia saat kamu menghubungi WhatsApp.',
        ],
      },
    ],
  },
  'cerita-kami': {
    eyebrow: 'Tentang HenGadget',
    title: 'Kami percaya memilih handphone tidak harus rumit',
    intro:
      'HenGadget hadir untuk membuat perbandingan spesifikasi terasa manusiawi, bukan seperti membaca lembar brosur.',
    sections: [
      {
        heading: 'Berawal dari kebingungan yang sama',
        paragraphs: [
          'Terlalu banyak istilah, terlalu banyak angka, dan terlalu banyak ulasan yang saling bertentangan. Kami merangkum hal-hal yang benar-benar terasa di pemakaian harian.',
          'Setiap rekomendasi dimulai dari kebutuhan: kamera, performa, baterai, atau budget. Bukan dari merek yang paling ramai diiklankan.',
        ],
      },
      {
        heading: 'Transparan sejak awal',
        paragraphs: [
          'Harga contoh ditampilkan terbuka. Ketersediaan dan harga final dikonfirmasi langsung lewat WhatsApp, tanpa biaya tersembunyi.',
        ],
      },
    ],
  },
  'cara-kami-memilih': {
    eyebrow: 'Tentang HenGadget',
    title: 'Cara kami memilih handphone',
    intro:
      'Kriteria sederhana yang kami pakai sebelum sebuah handphone masuk katalog.',
    sections: [
      {
        heading: '1. Relevan untuk kebutuhan nyata',
        paragraphs: [
          'Kami memilih handphone yang punya alasan jelas untuk dibeli: kamera yang konsisten, performa stabil, atau harga yang masuk akal untuk spesifikasinya.',
        ],
      },
      {
        heading: '2. Seimbang, bukan hanya unggul di satu angka',
        paragraphs: [
          'Megapiksel besar tidak berarti banyak jika tanpa OIS. Chipset kencang tidak berguna jika baterai boros. Kami menilai keseimbangan antar komponen.',
        ],
      },
      {
        heading: '3. Didukung data dan pengalaman pemakaian',
        paragraphs: [
          'Skor performa dan kamera di katalog adalah ringkasan editorial untuk membantu perbandingan cepat. Bukan pengganti pengalaman langsung, tetapi cukup untuk mempersempit pilihan.',
        ],
      },
    ],
  },
  kontak: {
    eyebrow: 'Tentang HenGadget',
    title: 'Hubungi kami',
    intro:
      'Admin kami siap membantu memilih, mengecek stok, dan mengonfirmasi pengiriman.',
    contact: true,
    sections: [
      {
        heading: 'Waktu layanan',
        paragraphs: ['Senin–Sabtu, 09.00–20.00 WIB. Pesan di luar jam ini akan dibalas pada hari kerja berikutnya.'],
      },
      {
        heading: 'Sebelum menghubungi',
        paragraphs: [
          'Siapkan nama handphone yang diminati, warna pilihan, dan kota tujuan. Informasi ini membantu admin memberikan jawaban yang lebih cepat dan akurat.',
        ],
      },
    ],
  },
  'kebijakan-privasi': {
    eyebrow: 'Tentang HenGadget',
    title: 'Kebijakan privasi',
    intro: 'Kami hanya memakai data yang benar-benar diperlukan untuk melayani pesananmu.',
    sections: [
      {
        heading: 'Data yang kami kumpulkan',
        paragraphs: [
          'Saat kamu membuat akun, kami menyimpan nama dan alamat email. Data keranjang disimpan di perangkatmu sendiri. Kami tidak menyimpan nomor kartu pembayaran.',
        ],
      },
      {
        heading: 'Bagaimana data digunakan',
        paragraphs: [
          'Data akun dipakai untuk menampilkan nama pada sesi login. Detail pesanan hanya dikirim ke WhatsApp ketika kamu menekan tombol checkout.',
        ],
      },
      {
        heading: 'Berbagi data',
        paragraphs: [
          'Kami tidak menjual data pengguna. Data hanya dibagikan kepada pihak pengiriman atau layanan pembayaran bila diperlukan untuk menyelesaikan pesanan.',
        ],
      },
      {
        heading: 'Menghapus data',
        paragraphs: [
          'Kamu dapat meminta penghapusan data akun dengan menghubungi admin melalui WhatsApp atau email hello@hengadget.com.',
        ],
      },
    ],
  },
};

export default function InfoPage() {
  const { slug } = useParams();
  const { settings } = useCatalog();
  const whatsappUrl = `https://wa.me/${normalizeWhatsAppNumber(settings.phone)}?text=${WHATSAPP_MESSAGE}`;
  const displayPhone = formatPhoneNumber(settings.phone);
  const page = pages[slug];

  if (!page) {
    return (
      <div className="min-h-screen bg-[#070b14]">
        <Navbar />
        <div className="min-h-[70vh] flex items-center justify-center px-4 pt-20">
          <div className="glass-panel p-12 text-center max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">Halaman tidak ditemukan</h2>
            <Link
              to="/"
              className="inline-flex rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#04111c] font-bold px-6 py-3 transition-colors"
            >
              Kembali ke beranda
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14]">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <nav className="text-xs text-white/35 flex items-center gap-2 mb-8" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-cyan-300 transition-colors">Beranda</Link>
            <span>/</span>
            <span className="text-white/60">{page.title}</span>
          </nav>

          <span className="text-cyan-300 text-xs font-bold uppercase tracking-[0.2em]">
            {page.eyebrow}
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-3">{page.title}</h1>
          <p className="text-white/55 mt-3 text-lg">{page.intro}</p>

          {page.contact && (
            <div className="mt-8 rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.06] p-6">
              <p className="text-white/60 text-sm">WhatsApp</p>
              <p className="text-white font-extrabold text-xl mt-1">{displayPhone}</p>
              <p className="text-white/60 text-sm mt-4">Email</p>
              <a href="mailto:hello@hengadget.com" className="text-cyan-300 font-semibold">
                hello@hengadget.com
              </a>
              {settings.address && (
                <>
                  <p className="text-white/60 text-sm mt-4">Alamat</p>
                  <p className="text-white/80 text-sm mt-1">{settings.address}</p>
                </>
              )}
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#04111c] font-bold text-sm px-5 py-2.5 transition-colors"
                >
                  Chat WhatsApp
                </a>
                <Link
                  to="/catalog"
                  className="rounded-xl border border-white/15 text-white/75 hover:text-white hover:bg-white/5 text-sm font-semibold px-5 py-2.5 transition-colors"
                >
                  Lihat katalog
                </Link>
              </div>
            </div>
          )}

          <div className="mt-10 space-y-8">
            {page.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-xl font-bold text-white">{section.heading}</h2>
                <div className="mt-3 space-y-3">
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph.slice(0, 30)} className="text-white/65 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-white/55 text-sm">
              Butuh jawaban cepat? Admin kami siap membantu lewat WhatsApp.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#04111c] font-bold text-sm px-5 py-2.5 transition-colors"
            >
              Hubungi admin
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
