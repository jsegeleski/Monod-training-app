import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { nanoid } from '../../../lib/db';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');
const loadDB = () => JSON.parse(readFileSync(DB_PATH, 'utf8'));
const saveDB = (db) => writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default function handler(req, res) {
  setCORS(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'HEAD')  return res.status(200).end();

  const db = loadDB();

  if (req.method === 'GET') {
    const { publishedOnly } = req.query;
    let modules = db.modules;
    if (publishedOnly) modules = modules.filter(m => m.isPublished);
    return res.status(200).json({ modules });
  }

  if (req.method === 'POST') {
    const { title, description, isPublished, accessCode } = req.body || {};
    const id = 'mod_' + nanoid(8);
    const mod = { id, title: title || 'Untitled', description: description || '', isPublished: !!isPublished, accessCode: accessCode || '', slides: [] };
    db.modules.push(mod);
    saveDB(db);
    return res.status(201).json({ module: mod });
  }

  return res.status(405).end();
}
