// pages/api/modules/index.js (CommonJS to match lib/db.js)
const { readDB, writeDB, nanoid } = require('../../../lib/db');

function applyCORS(req, res) {
  const origin = req.headers.origin;
  const allowed = [
    process.env.STOREFRONT_ORIGIN,  // e.g. https://www.monodsports.com
    process.env.LOCAL_ORIGIN        // e.g. http://localhost:3000
  ].filter(Boolean);

  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    // fallback for same-origin calls
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  applyCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const db = await readDB();
    let modules = db.modules || [];
    if (req.query.publishedOnly) modules = modules.filter(m => m.isPublished);
    return res.status(200).json({ modules });
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const db = await readDB();
      const id = 'mod_' + nanoid(8);
      const now = new Date().toISOString();

      const mod = {
        id,
        title: body.title || 'Untitled',
        description: body.description || '',
        isPublished: !!body.isPublished,
        accessCode: body.accessCode || '',
        slides: [],
        createdAt: now,
        updatedAt: now
      };

      const next = { ...db, modules: [mod, ...(db.modules || [])] };
      await writeDB(next);
      return res.status(201).json({ module: mod });
    } catch (e) {
      return res.status(500).json({ error: String(e) });
    }
  }

  return res.status(405).end();
};
