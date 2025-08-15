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

  // inside export default async function handler(req, res) { ... }

if (req.method === 'GET') {
  if (!found) return res.status(404).json({ error: 'Not found' });
  return res.status(200).json({ module: found });
}

// Accept POST, PATCH, or PUT for updates
if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
  if (!found) return res.status(404).json({ error: 'Not found' });

  // Expect JSON
  const patch = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  // Only merge known fields; avoid nuking the object if any are undefined
  const updated = {
    ...found,
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.description !== undefined ? { description: patch.description } : {}),
    ...(patch.isPublished !== undefined ? { isPublished: !!patch.isPublished } : {}),
    ...(patch.accessCode !== undefined ? { accessCode: patch.accessCode } : {}),
    ...(patch.slides !== undefined ? { slides: Array.isArray(patch.slides) ? patch.slides : found.slides } : {}),
    updatedAt: new Date().toISOString()
  };

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
