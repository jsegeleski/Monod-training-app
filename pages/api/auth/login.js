import { setCookie } from '../../../lib/cookies';

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS,HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body || {};
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: 'Invalid password' });
  }

  // NOTE: No HttpOnly so the client-side AdminLayout can read it.
  // Keep it SameSite=Lax + Secure (Vercel is HTTPS) and short-lived.
  res.setHeader(
    'Set-Cookie',
    `admin_auth=true; Path=/; Secure; SameSite=Lax; Max-Age=${60 * 60 * 8}`
  );
  return res.status(200).json({ ok: true });
}


