// pages/api/modules/[id].js
import dbmod from '../../../lib/db'; // CJS -> import default
const { readDB, writeDB } = dbmod;

function applyCORS(req, res) {
  const origin = req.headers.origin;
  const allowed = [process.env.STOREFRONT_ORIGIN, process.env.LOCAL_ORIGIN].filter(Boolean);
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  applyCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  const db = await readDB();
  const modules = db.modules || [];
  const idx = modules.findIndex(m => m.id === id);
  const found = idx >= 0 ? modules[idx] : null;

  if (req.method === 'GET') {
    if (!found) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({ module: found });
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    if (!found) return res.status(404).json({ error: 'Not found' });
    const patch = req.body || {};
    const updated = { ...found, ...patch, updatedAt: new Date().toISOString() };
    const next = { ...db, modules: modules.map(m => (m.id === id ? updated : m)) };
    await writeDB(next);
    return res.status(200).json({ module: updated });
  }

  if (req.method === 'DELETE') {
    if (!found) return res.status(404).json({ error: 'Not found' });
    const next = { ...db, modules: modules.filter(m => m.id !== id) };
    await writeDB(next);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
