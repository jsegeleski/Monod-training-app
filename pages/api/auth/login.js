// pages/api/auth/login.js
import { setCookie } from '../../../lib/cookies';

// Allow your storefront + local dev
const ALLOWED_ORIGINS = [
  process.env.STOREFRONT_ORIGIN,   // e.g. https://www.monodsports.com
  process.env.LOCAL_ORIGIN         // e.g. http://localhost:3000
].filter(Boolean);

function applyCORS(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  // help caches vary by origin
  res.setHeader('Vary', 'Origin');

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default function handler(req, res) {
  applyCORS(req, res);

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { password } = req.body || {};
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ ok: false, error: 'Server misconfigured' });
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: 'Invalid password' });
  }

  // Cross-site cookie -> must be SameSite=None; Secure
  res.setHeader(
    'Set-Cookie',
    `admin_auth=true; Path=/; Secure; SameSite=None; Max-Age=${60 * 60 * 8}`
  );

  return res.status(200).json({ ok: true });
}
