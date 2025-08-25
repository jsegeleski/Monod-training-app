import { serialize } from 'cookie';

export default function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body || {};
  if (!process.env.ADMIN_PASSWORD) return res.status(500).json({ ok:false, error:'Server misconfigured' });
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ ok:false, error:'Invalid password' });

  const maxAge = 60 * 60 * 24 * 7; // 7 days
  const host = (req.headers.host || '').split(':')[0];      // strip port if any
  const parts = host.split('.');
  const topLevel =
    parts.length >= 2 ? `.${parts.slice(-2).join('.')}` : undefined; // ".example.com"

  const cookies = [];

  // Host-only (always)
  cookies.push(serialize('admin', '1', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge,
  }));

  // Parent-domain (if we can compute one, helps www <-> apex)
  if (topLevel && topLevel.includes('.')) {
    cookies.push(serialize('admin_wide', '1', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      domain: topLevel,                   // <- covers both www and apex
      maxAge,
    }));
  }

  // Optional visible mirror for debugging
  cookies.push(serialize('admin_client', '1', {
    httpOnly: false,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge,
  }));

  res.setHeader('Set-Cookie', cookies);
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(200).json({ ok: true });
}