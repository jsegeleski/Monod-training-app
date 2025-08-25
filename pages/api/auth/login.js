// pages/api/auth/login.js
import { serialize } from 'cookie';

// Allow your storefront + local dev (for the embed)
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
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ ok: false, error: 'Server misconfigured' });
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: 'Invalid password' });
  }

  const isProd = process.env.NODE_ENV === 'production';
  const maxAge = 60 * 60 * 24 * 7; // 7 days

  // SAME-SITE cookie used by the admin dashboard
  const sameSiteAdmin = serialize('admin', '1', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge,
  });

  // CROSS-SITE cookie used by the embedded storefront (must be None; Secure)
  const crossSiteEmbed = serialize('admin_embed', '1', {
    httpOnly: true,
    secure: true,            // required for SameSite=None
    sameSite: 'none',
    path: '/',
    maxAge,
  });

  // Send both so either context can validate
  res.setHeader('Set-Cookie', [sameSiteAdmin, crossSiteEmbed]);

  return res.status(200).json({ ok: true });
}