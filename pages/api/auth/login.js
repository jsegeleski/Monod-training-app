import { serialize } from 'cookie';

const ALLOWED_ORIGINS = [process.env.STOREFRONT_ORIGIN, process.env.LOCAL_ORIGIN].filter(Boolean);

function applyCORS(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default function handler(req, res) {
  applyCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body || {};
  if (!process.env.ADMIN_PASSWORD) return res.status(500).json({ ok:false, error:'Server misconfigured' });
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ ok:false, error:'Invalid password' });

  // Always set Secure (Vercel is HTTPS) and SameSite=None to keep Safari happy after POST.
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  const admin = serialize('admin', '1', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge
  });

  // Optional: a non-HttpOnly mirror so you can **see** it in Safari DevTools Storage if needed.
  const adminClient = serialize('admin_client', '1', {
    httpOnly: false,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge
  });

  res.setHeader('Set-Cookie', [admin, adminClient]);
  // Avoid bfcache weirdness in Safari
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  return res.status(200).json({ ok: true });
}