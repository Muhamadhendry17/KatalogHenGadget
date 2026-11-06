export const DEFAULT_WHATSAPP_NUMBER = '6287777747462';

/** Ubah nomor lokal/format bebas menjadi format wa.me (62...). */
export function normalizeWhatsAppNumber(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return DEFAULT_WHATSAPP_NUMBER;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
}

/** Tampilan nomor yang nyaman dibaca, mis. +62 877-7774-7462. */
export function formatPhoneNumber(value) {
  const digits = normalizeWhatsAppNumber(value);
  const local = digits.startsWith('62') ? digits.slice(2) : digits;
  const parts = local.match(/(\d{3})(\d{4})(\d+)/);
  if (!parts) return `+${digits}`;
  return `+62 ${parts[1]}-${parts[2]}-${parts[3]}`;
}
