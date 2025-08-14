import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');
function loadDB() { return JSON.parse(readFileSync(DB_PATH, 'utf8')); }
function saveDB(db) { writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }

// ✨ Add CORS helper
function allowCORS(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return true; }
  return false;
}

export default function handler(req, res) {
  if (allowCORS(req, res)) return;

  const { id } = req.query;
  const db = loadDB();
  const idx = db.modules.findIndex(m => m.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  if (req.method === 'GET') {
    const { publishedOnly } = req.query;
    const mod = db.modules[idx];
    if (publishedOnly && !mod.isPublished) return res.status(404).json({ error: 'Not found' });
    return res.json({ module: mod });
  }

  if (req.method === 'PUT') {
    const { module } = req.body || {};
    if (!module || module.id !== id) return res.status(400).json({ error: 'Invalid payload' });
    db.modules[idx] = module;
    saveDB(db);
    return res.json({ module });
  }

  if (req.method === 'DELETE') {
    db.modules.splice(idx, 1);
    saveDB(db);
    return res.json({ ok: true });
  }

  res.status(405).end();
}
