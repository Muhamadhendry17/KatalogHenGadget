const jsonHeaders = { Accept: 'application/json' };

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

  const response = await fetch(path, {
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
