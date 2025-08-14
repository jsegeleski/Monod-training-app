import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { nanoid } from '../../../lib/db';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

function loadDB() {
  return JSON.parse(readFileSync(DB_PATH, 'utf8'));
}
function saveDB(db) {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export default function handler(req, res) {
  const db = loadDB();
  if (req.method === 'GET') {
    const { publishedOnly } = req.query;
    let modules = db.modules;
    if (publishedOnly) modules = modules.filter(m => m.isPublished);
    return res.json({ modules });
  }
  if (req.method === 'POST') {
    const { title, description, isPublished, accessCode } = req.body || {};
    const id = 'mod_' + nanoid(8);
    const mod = { id, title: title || 'Untitled', description: description || '', isPublished: !!isPublished, accessCode: accessCode || '', slides: [] };
    db.modules.push(mod);
    saveDB(db);
    return res.status(201).json({ module: mod });
  }
  res.status(405).end();
}
