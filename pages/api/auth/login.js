import { setCookie } from '../../../lib/cookies';

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS,HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body || {};
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: 'Invalid password' });
  }

  // Set a same-origin cookie for admin
  res.setHeader(
    'Set-Cookie',
    `admin_auth=true; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 8}`
  );
  return res.status(200).json({ ok: true });
}

