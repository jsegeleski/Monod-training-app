import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');
const loadDB = () => JSON.parse(readFileSync(DB_PATH, 'utf8'));
const saveDB = (db) => writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS,HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default function handler(req, res) {
  setCORS(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'HEAD')  return res.status(200).end();

  const { id } = req.query;
  const db = loadDB();
  const idx = db.modules.findIndex(m => m.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  if (req.method === 'GET') {
    const { publishedOnly } = req.query;
    const mod = db.modules[idx];
    if (publishedOnly && !mod.isPublished) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({ module: mod });
  }

  if (req.method === 'PUT') {
    const { module } = req.body || {};
    if (!module || module.id !== id) return res.status(400).json({ error: 'Invalid payload' });
    db.modules[idx] = module;
    saveDB(db);
    return res.status(200).json({ module });
  }

  if (req.method === 'DELETE') {
    db.modules.splice(idx, 1);
    saveDB(db);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
