const jsonHeaders = { Accept: 'application/json' };

/**
 * Basis URL API. Kosong berarti memakai origin yang sama (mis. saat dev
 * dengan proxy Vite atau saat server menyajikan build klien).
 * Isi VITE_API_BASE_URL di produksi bila API berada di domain terpisah.
 */
export const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || '')
  .trim()
  .replace(/\/+$/, '');

export function apiUrl(path) {
  const value = String(path || '');
  if (!value) return API_BASE_URL;
  if (/^https?:\/\//i.test(value)) return value;
  return `${API_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`;
}

/**
 * Ubah path aset relatif (/assets/..., /uploads/...) menjadi URL absolut
 * bila API berada di domain lain. URL eksternal & data/blob dibiarkan.
 */
export function assetUrl(path) {
  const value = String(path || '').trim();
  if (!value) return '';
  if (/^(https?:)?\/\//i.test(value)) return value;
  if (/^(data|blob):/i.test(value)) return value;
  return apiUrl(value);
}

/**
 * Pemanggil API terpusat. Otomatis menangani JSON, FormData, dan token admin.
 */
export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, token, headers = {}, ...rest } = options;
  const requestHeaders = { ...jsonHeaders, ...headers };
  let payload = body;

  if (token) requestHeaders.Authorization = `Bearer ${token}`;

  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const response = await fetch(apiUrl(path), {
    method,
    headers: requestHeaders,
    body: payload,
    ...rest,
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    const error = new Error(data.message || `Permintaan gagal (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {});
