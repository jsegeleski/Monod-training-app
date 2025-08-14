import { setCookie } from '../../../lib/cookies';

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS,HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default function handler(req, res) {
  setCORS(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'HEAD')    return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).end();

  const { password } = req.body || {};
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false });
  }
  // Cookie is fine to set; third‑party cookie may be ignored in Shopify, but we only need the 200
  setCookie(res, 'admin_auth', 'true', 2);
  res.json({ ok: true });
}
