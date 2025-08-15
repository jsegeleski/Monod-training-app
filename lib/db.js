// lib/db.js
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

let redis = null;
try {
  const { Redis } = require('@upstash/redis');
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (_) {}

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');
// On Vercel, prefer Redis; locally fall back to file.
const useRedis = !!(process.env.VERCEL && redis);
const KV_KEY = 'training_db_v1';
const emptyDB = { modules: [] };

async function readFileJSON() {
  try {
    const raw = await fsp.readFile(DB_PATH, 'utf8');
    return JSON.parse(raw || '{}');
  } catch {
    return emptyDB;
  }
}
async function writeFileJSON(obj) {
  await fsp.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fsp.writeFile(DB_PATH, JSON.stringify(obj, null, 2), 'utf8');
  return obj;
}

async function readDB() {
  if (!useRedis) {
    const obj = await readFileJSON();
    return { ...emptyDB, ...obj, modules: obj.modules || [] };
  }
  const data = await redis.get(KV_KEY);
  return { ...emptyDB, ...(data || {}), modules: (data && data.modules) || [] };
}

async function writeDB(next) {
  const data = { ...emptyDB, ...next, modules: next.modules || [] };
  if (!useRedis) return writeFileJSON(data);
  await redis.set(KV_KEY, data);
  return data;
}

function nanoid(size = 10) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let id = '';
  for (let i = 0; i < size; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

module.exports = { readDB, writeDB, nanoid };
