import { serialize } from 'cookie';

export default function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body || {};
  if (!process.env.ADMIN_PASSWORD) return res.status(500).json({ ok:false, error:'Server misconfigured' });
  if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ ok:false, error:'Invalid password' });

  const maxAge = 60 * 60 * 24 * 7; // 7 days

  // Compute parent domain for cross-subdomain cookie (e.g. ".example.com")
  const host = (req.headers.host || '').split(':')[0];
  const parts = host.split('.');
  const parentDomain = parts.length >= 2 ? `.${parts.slice(-2).join('.')}` : undefined;

  const cookies = [];

  // 1) LAX cookie (host-only). Great for same-host navigation.
  cookies.push(serialize('admin_lax', '1', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge,
  }));

  // 2) Cross-subdomain cookie (.example.com) with SameSite=None for cases you shift between apex/www
  if (parentDomain && parentDomain.includes('.')) {
    cookies.push(serialize('admin_wide', '1', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: parentDomain,
      path: '/',
      maxAge,
    }));
  }

  // Optional visible mirror to help debugging
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