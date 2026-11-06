const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map();

function keyFor(req) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  return `${req.ip || 'unknown'}|${email}`;
}

function prune(now) {
  for (const [key, bucket] of attempts) {
    if (now - bucket.start >= WINDOW_MS) attempts.delete(key);
  }
}

export function loginRateLimit(req, res, next) {
  const now = Date.now();
  if (attempts.size > 5000) prune(now);

  const key = keyFor(req);
  const bucket = attempts.get(key);

  if (!bucket || now - bucket.start >= WINDOW_MS) {
    attempts.set(key, { count: 1, start: now });
    return next();
  }

  if (bucket.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((bucket.start + WINDOW_MS - now) / 1000);
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({
      success: false,
      message: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.',
    });
  }

  bucket.count += 1;
  return next();
}

export function clearLoginAttempts(req) {
  attempts.delete(keyFor(req));
}
