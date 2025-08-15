// lib/db.js (CommonJS)
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

let kv = null;
try {
  // lazy require so local dev doesn't need @vercel/kv installed first
  kv = require('@vercel/kv').kv;
} catch (_) {}

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');
const isProd = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

// Ensure a sane default shape
const emptyDB = { modules: [] };

async function readFileJSON() {
  try {
    const raw = await fsp.readFile(DB_PATH, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    // if file missing, create it locally for dev
    await writeFileJSON(emptyDB);
    return emptyDB;
  }
}

async function writeFileJSON(data) {
  await fsp.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fsp.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  return data;
}

async function readDB() {
  if (!isProd) {
    const obj = await readFileJSON();
    return { ...emptyDB, ...obj, modules: obj.modules || [] };
  }
  const data = (await kv.get('training_db_v1')) || emptyDB;
  return { ...emptyDB, ...data, modules: data.modules || [] };
}

async function writeDB(data) {
  const next = { ...emptyDB, ...data, modules: data.modules || [] };
  if (!isProd) return writeFileJSON(next);
  await kv.set('training_db_v1', next);
  return next;
}

function nanoid(size = 10) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let id = '';
  for (let i = 0; i < size; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

module.exports = { readDB, writeDB, nanoid };
