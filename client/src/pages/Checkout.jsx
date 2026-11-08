import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useCatalog } from '../contexts/CatalogContext';
import { useFormatCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest, assetUrl } from '../lib/api';
import { formatPhoneNumber, normalizeWhatsAppNumber } from '../lib/phone';
import Logo from '../components/Logo';

const emptyAddressForm = {
  name: '',
  phone: '',
  address: '',
  city: 'Sukabumi',
  province: 'Jawa Barat',
  postalCode: '',
  isDefault: false,
};

export default function CheckoutPage() {
  const { items, total, totalItems, clearCart, removeItem } = useCart();
  const { settings } = useCatalog();
  const { user, loading: authLoading } = useAuth();
  const formatCurrency = useFormatCurrency();
  const whatsappNumber = normalizeWhatsAppNumber(settings.phone);
  const displayPhone = formatPhoneNumber(settings.phone);
  const navigate = useNavigate();
  const [closing, setClosing] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [orderType, setOrderType] = useState('cod_sukabumi');
  const [catatan, setCatatan] = useState('');
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [orderError, setOrderError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  const isCOD = orderType === 'cod_sukabumi';
  const paymentMethod = isCOD ? 'cod' : 'transfer';
  const deliveryMethod = orderType;
  const whatsappEnabled = settings.activeWhatsApp !== false;

  const closePanel = useCallback(() => {
    setClosing(true);
    setTimeout(() => navigate('/cart'), 220);
  }, [navigate]);

  const loadAddresses = useCallback(async () => {
    if (!user?.token) return;
    setAddressesLoading(true);
    try {
      const res = await apiRequest('/api/addresses', { token: user.token });
      const list = Array.isArray(res.data) ? res.data : [];
      setAddresses(list);
      setSelectedAddressId((current) => {
        if (current && list.some((item) => item.id === current)) return current;
        return (list.find((item) => item.isDefault) || list[0])?.id || '';
      });
      if (!list.length) setShowAddressForm(true);
    } catch {
      setAddresses([]);
      setShowAddressForm(true);
    } finally {
      setAddressesLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  useEffect(() => {
    if (!user) return;
    setAddressForm((current) => ({
      ...current,
      name: current.name || user.name || '',
      phone: current.phone || '',
    }));
  }, [user]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKey = (event) => {
      if (event.key === 'Escape') closePanel();
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [closePanel]);

  // Tunggu validasi sesi selesai agar tidak salah redirect ke login.
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-white/60">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          Memeriksa sesi checkout...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/checkout' }} />;
  }

  if (!completedOrder && items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const selectedAddress = addresses.find((item) => item.id === selectedAddressId) || null;

  const buildWhatsAppMessage = (orderId, address) => {
    const lines = ['Halo HenGadget, saya ingin memesan produk berikut:', ''];

    items.forEach((item, index) => {
      const varian = item.varian ? ` (${item.varian})` : '';
      lines.push(
        `${index + 1}. ${item.name}${varian} x${item.qty} - ${formatCurrency(item.price * item.qty)}`
      );
    });

    lines.push(
      '',
      `No. pesanan: ${orderId}`,
      `Total: ${formatCurrency(total)}`,
      '',
      `Metode pembayaran: ${isCOD ? 'COD (bayar tunai saat bertemu)' : 'Transfer bank'}`,
      `Metode pengiriman: ${
        isCOD
          ? 'COD Sukabumi (admin/worker bertemu customer)'
          : 'Logistik paket (luar kota)'
      }`,
      '',
      `Nama penerima: ${address.name}`,
      `No. HP: ${address.phone}`,
      `Alamat: ${address.address}, ${address.city}, ${address.province}${
        address.postalCode ? ` ${address.postalCode}` : ''
      }`
    );
    if (catatan) lines.push('', `Catatan: ${catatan}`);
    lines.push(
      '',
      'Mohon konfirmasi ketersediaan, harga final, dan jadwal pengiriman. Terima kasih.'
    );

    return lines.join('\n');
  };

  const buildWhatsAppUrl = (orderId, address) =>
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      buildWhatsAppMessage(orderId, address)
    )}`;

  const handleAddressField = (field, value) => {
    setAddressForm((current) => ({ ...current, [field]: value }));
  };

  const handleSaveAddress = async (event) => {
    event.preventDefault();
    setAddressError('');
    setAddressSaving(true);
    try {
      const res = await apiRequest('/api/addresses', {
        method: 'POST',
        body: {
          ...addressForm,
          isDefault: addresses.length === 0 ? true : addressForm.isDefault,
        },
        token: user.token,
      });
      const created = res.data;
      await loadAddresses();
      if (created?.id) setSelectedAddressId(created.id);
      setAddressForm({
        ...emptyAddressForm,
        name: user.name || '',
      });
      setShowAddressForm(false);
    } catch (error) {
      setAddressError(error.message);
    } finally {
      setAddressSaving(false);
    }
  };

  const handleCheckout = async () => {
    setOrderError('');

    if (!selectedAddress) {
      setOrderError('Pilih alamat pengiriman terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('/api/orders', {
        method: 'POST',
        body: {
          total,
          paymentMethod,
          deliveryMethod,
          catatan,
          addressId: selectedAddress.id,
          items: items.map((item) => ({
            productId: item.id,
            varian: item.varian || '',
            qty: item.qty,
            price: item.price,
          })),
        },
        token: user.token,
      });

      const order = res.data;
      const whatsappUrl = buildWhatsAppUrl(order.id, selectedAddress);

      if (whatsappEnabled) {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }

      setCompletedOrder({
        id: order.id,
        total: order.total ?? total,
        whatsappUrl,
      });
      clearCart();
    } catch (error) {
      setOrderError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (completedOrder) {
    return (
      <div className="min-h-screen bg-[#050912] px-4 py-16">
        <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-[#080d16] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-400/10 text-2xl text-emerald-300">
            ✓
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">
            Pesanan dibuat
          </span>
          <h1 className="mt-2 text-2xl font-extrabold text-white">Terima kasih!</h1>
          <p className="mt-3 text-sm text-white/50">
            Pesanan <span className="font-semibold text-white">#{completedOrder.id}</span> sudah
            masuk ke dashboard admin. Admin akan mengonfirmasi pembayaran dan pengiriman.
          </p>
          <p className="mt-2 text-lg font-bold text-cyan-300">
            {formatCurrency(completedOrder.total)}
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left text-xs text-white/55">
            <p>
              <span className="text-white/35">Pembayaran:</span>{' '}
              {isCOD ? 'COD (bayar saat bertemu)' : 'Transfer bank'}
            </p>
            <p className="mt-1">
              <span className="text-white/35">Pengiriman:</span>{' '}
              {isCOD ? 'COD Sukabumi' : 'Logistik paket (luar kota)'}
            </p>
          </div>

          <div className="mt-6 grid gap-3">
            <Link
              to="/pesanansaya"
              className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-extrabold text-[#04111c] transition-colors hover:bg-cyan-400"
            >
              Lihat Pesanan Saya
            </Link>
            {whatsappEnabled && (
              <a
                href={completedOrder.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-extrabold text-[#04111c] transition-colors hover:bg-emerald-400"
              >
                Buka chat WhatsApp
              </a>
            )}
            <Link
              to="/catalog"
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/70 transition-colors hover:text-white"
            >
              Kembali ke katalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 overflow-hidden bg-[#050912] animate-fade-in"
        onClick={closePanel}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
        <div className="absolute inset-0 hero-grid opacity-25" />
        <div className="absolute -left-24 top-1/4 h-[420px] w-[420px] rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[320px] w-[520px] rounded-full bg-indigo-500/15 blur-[120px]" />

        <div className="absolute inset-y-0 left-0 right-[576px] hidden items-center px-12 lg:flex xl:px-20">
          <div className="w-full max-w-md">
            <Logo size={38} />

            <span className="mt-9 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              Checkout HenGadget
            </span>

            <h2 className="mt-4 text-3xl font-extrabold leading-[1.1] tracking-tight text-white xl:text-[40px]">
              Pesanan siap.
              <br />
              <span className="text-cyan-300">Tinggal satu langkah.</span>
            </h2>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/45">
              Pilih alamat dan metode pemesanan. COD Sukabumi dibayar saat admin/worker
              bertemu Anda; pengiriman luar kota memakai logistik paket dengan transfer bank.
            </p>

            <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm5.8 14.13c-.24.68-1.42 1.3-1.96 1.35-.54.05-1.05.24-3.54-.74-2.99-1.18-4.87-4.26-5.02-4.46-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.29.59-.37.79-.37.2 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.83 2.03.9 2.18.07.15.12.32.02.52-.1.2-.15.32-.29.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.03 1.12 1 2.07 1.31 2.36 1.46.29.15.46.13.63-.08.17-.2.73-.85.93-1.14.2-.29.39-.24.66-.15.27.1 1.7.8 1.99.95.29.15.48.22.55.34.07.12.07.7-.17 1.38z" />
                </svg>
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                  Butuh bantuan?
                </p>
                <p className="text-sm font-semibold text-white">{displayPhone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-xl bg-[#080d16] border-l border-white/10 shadow-2xl flex flex-col ${
          closing ? 'animate-slide-out-right' : 'animate-slide-in-right'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Checkout"
      >
        <header className="flex items-start justify-between gap-4 px-6 py-5 border-b border-white/10">
          <div>
            <p className="text-cyan-300 text-[10px] font-bold uppercase tracking-[0.2em]">
              Keranjang · {totalItems} item
            </p>
            <h2 className="text-xl font-extrabold text-white mt-1">Checkout Pesanan</h2>
            <p className="text-white/40 text-xs mt-1">
              Periksa produk, alamat, dan metode pemesanan sebelum dikonfirmasi admin.
            </p>
          </div>
          <button
            onClick={closePanel}
            aria-label="Tutup checkout"
            className="w-9 h-9 rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {items.map((item) => (
            <div key={item.cartKey} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-[#eef1f3] via-[#dfe3e6] to-[#c4c9ce] shrink-0">
                  <img
                    src={assetUrl(item.image)}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                        {item.brand}
                      </p>
                      <p className="text-white font-semibold text-sm leading-snug truncate">
                        {item.name}
                      </p>
                      {item.varian && (
                        <p className="text-white/40 text-xs mt-0.5">
                          Varian: {item.varian}
                        </p>
                      )}
                      <p className="text-white/40 text-xs mt-0.5">
                        {formatCurrency(item.price)} / unit
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.cartKey)}
                      className="text-white/30 hover:text-red-300 text-xs transition-colors shrink-0"
                      aria-label={`Hapus ${item.name}`}
                    >
                      Hapus
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-semibold w-6 text-center">
                        {item.qty}
                      </span>
                    </div>
                    <span className="text-white font-bold text-sm">
                      {formatCurrency(item.price * item.qty)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Alamat pengiriman */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">Alamat Pengiriman</h3>
                <p className="text-[11px] text-white/40">
                  Alamat dipakai admin untuk pengiriman atau titik temu COD.
                </p>
              </div>
              {addresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAddressForm((value) => !value)}
                  className="shrink-0 text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                >
                  {showAddressForm ? 'Batal' : '+ Tambah'}
                </button>
              )}
            </div>

            {addressesLoading ? (
              <div className="h-10 flex items-center text-sm text-white/40">Memuat alamat...</div>
            ) : (
              <>
                {addresses.length > 0 && (
                  <div className="space-y-2">
                    {addresses.map((addr) => (
                      <button
                        type="button"
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                          selectedAddressId === addr.id
                            ? 'border-cyan-400 bg-cyan-400/10'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/25 hover:text-white'
                        }`}
                      >
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">
                            {addr.name} {addr.isDefault && '(default)'}
                          </p>
                          <p className="text-xs text-white/50">
                            {addr.address}, {addr.city}, {addr.province}
                            {addr.postalCode ? ` ${addr.postalCode}` : ''}
                          </p>
                          <p className="text-xs text-white/40">{addr.phone}</p>
                        </div>
                        {selectedAddressId === addr.id && (
                          <span className="w-4 h-4 rounded-full border-2 border-cyan-400 flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {(showAddressForm || addresses.length === 0) && (
                  <form
                    onSubmit={handleSaveAddress}
                    className="mt-3 space-y-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-4"
                  >
                    {addressError && (
                      <p className="text-xs text-red-300">{addressError}</p>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label>
                        <span className="mb-1 block text-[11px] font-semibold text-white/60">
                          Nama penerima *
                        </span>
                        <input
                          required
                          value={addressForm.name}
                          onChange={(event) => handleAddressField('name', event.target.value)}
                          className="input-field text-sm"
                          placeholder="Nama lengkap"
                        />
                      </label>
                      <label>
                        <span className="mb-1 block text-[11px] font-semibold text-white/60">
                          No. HP / WhatsApp *
                        </span>
                        <input
                          required
                          value={addressForm.phone}
                          onChange={(event) => handleAddressField('phone', event.target.value)}
                          className="input-field text-sm"
                          placeholder="62812xxxxxxx"
                        />
                      </label>
                    </div>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold text-white/60">
                        Alamat lengkap *
                      </span>
                      <textarea
                        required
                        rows={2}
                        value={addressForm.address}
                        onChange={(event) => handleAddressField('address', event.target.value)}
                        className="input-field resize-y text-sm"
                        placeholder="Jalan, RT/RW, kelurahan, kecamatan, patokan"
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label>
                        <span className="mb-1 block text-[11px] font-semibold text-white/60">Kota</span>
                        <input
                          value={addressForm.city}
                          onChange={(event) => handleAddressField('city', event.target.value)}
                          className="input-field text-sm"
                        />
                      </label>
                      <label>
                        <span className="mb-1 block text-[11px] font-semibold text-white/60">Provinsi</span>
                        <input
                          value={addressForm.province}
                          onChange={(event) => handleAddressField('province', event.target.value)}
                          className="input-field text-sm"
                        />
                      </label>
                      <label>
                        <span className="mb-1 block text-[11px] font-semibold text-white/60">Kode pos</span>
                        <input
                          value={addressForm.postalCode}
                          onChange={(event) => handleAddressField('postalCode', event.target.value)}
                          className="input-field text-sm"
                          placeholder="431xx"
                        />
                      </label>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-white/60">
                      <input
                        type="checkbox"
                        checked={addressForm.isDefault}
                        onChange={(event) => handleAddressField('isDefault', event.target.checked)}
                        className="h-4 w-4 accent-cyan-400"
                      />
                      Jadikan alamat utama
                    </label>
                    <button
                      type="submit"
                      disabled={addressSaving}
                      className="rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-bold text-[#04111c] transition-colors hover:bg-cyan-300 disabled:opacity-60"
                    >
                      {addressSaving ? 'Menyimpan...' : 'Simpan alamat'}
                    </button>
                  </form>
                )}
              </>
            )}
          </section>

          {/* Metode pemesanan */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="text-sm font-bold text-white mb-3">Metode Pemesanan</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setOrderType('cod_sukabumi')}
                className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                  isCOD
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/25 hover:text-white'
                }`}
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">COD Sukabumi</p>
                  <p className="text-xs text-white/50">
                    Bayar tunai saat admin/worker HenGadget bertemu Anda. Produk bisa dicek
                    langsung sebelum dibayar.
                  </p>
                </div>
                {isCOD && (
                  <span className="w-4 h-4 rounded-full border-2 border-amber-500 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setOrderType('logistik_paket')}
                className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                  !isCOD
                    ? 'border-cyan-400 bg-cyan-400/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/25 hover:text-white'
                }`}
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Logistik Paket — Luar Kota</p>
                  <p className="text-xs text-white/50">
                    Pembayaran transfer bank. Paket dikirim melalui jasa logistik setelah
                    pembayaran dikonfirmasi admin.
                  </p>
                </div>
                {!isCOD && (
                  <span className="w-4 h-4 rounded-full border-2 border-cyan-400 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  </span>
                )}
              </button>
            </div>
            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-[11px] text-white/50">
              Pembayaran: <span className="font-semibold text-white/80">{isCOD ? 'COD' : 'Transfer bank'}</span>
              {' · '}
              Pengiriman: <span className="font-semibold text-white/80">{isCOD ? 'COD Sukabumi' : 'Logistik paket'}</span>
            </div>
          </section>

          {/* Catatan */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="text-sm font-bold text-white mb-3">Catatan Pesanan</h3>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full input-field text-sm"
              placeholder="Contoh: Kirim ke kantor, tolong dibungkus rapi, atau patokan lokasi COD."
            />
          </section>
        </div>

        <footer className="border-t border-white/10 px-6 py-5 space-y-4 bg-[#070b14]">
          <div className="flex items-center justify-between">
            <span className="text-white/50 text-sm">Total {totalItems} item</span>
            <span className="text-2xl font-extrabold text-cyan-300">{formatCurrency(total)}</span>
          </div>

          {orderError && (
            <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {orderError}
            </p>
          )}

          {!selectedAddress && (
            <p className="text-xs text-red-300/80 text-center">
              Silakan pilih atau tambahkan alamat pengiriman terlebih dahulu.
            </p>
          )}

          <button
            onClick={handleCheckout}
            disabled={submitting || !selectedAddress}
            className={`w-full rounded-xl font-extrabold py-3.5 transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              !submitting && selectedAddress
                ? 'bg-emerald-500 hover:bg-emerald-400 text-[#04111c]'
                : 'border border-white/10 bg-white/5 text-white/40'
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm5.8 14.13c-.24.68-1.42 1.3-1.96 1.35-.54.05-1.05.24-3.54-.74-2.99-1.18-4.87-4.26-5.02-4.46-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.29.59-.37.79-.37.2 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.83 2.03.9 2.18.07.15.12.32.02.52-.1.2-.15.32-.29.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.03 1.12 1 2.07 1.31 2.36 1.46.29.15.46.13.63-.08.17-.2.73-.85.93-1.14.2-.29.39-.24.66-.15.27.1 1.7.8 1.99.95.29.15.48.22.55.34.07.12.07.7-.17 1.38z" />
            </svg>
            {submitting
              ? 'Membuat pesanan...'
              : whatsappEnabled
                ? 'Buat Pesanan via WhatsApp'
                : 'Buat Pesanan'}
          </button>

          {!whatsappEnabled && (
            <p className="text-xs text-amber-300/80 text-center">
              Checkout WhatsApp sedang nonaktif. Pesanan tetap tersimpan dan admin akan
              menghubungi Anda.
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={closePanel}
              className="text-white/50 hover:text-white text-sm font-medium transition-colors"
            >
              ← Kembali ke keranjang
            </button>
            <Link
              to="/catalog"
              className="text-cyan-300 hover:text-cyan-200 text-sm font-semibold transition-colors"
            >
              Tambah produk lain
            </Link>
          </div>
        </footer>
      </aside>
    </div>
  );
}
