import dbmod from '../../../lib/db';
const { writeDB } = dbmod;
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (req.headers.authorization !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  try {
    const file = path.join(process.cwd(), 'data', 'db.json');
    const obj = JSON.parse(fs.readFileSync(file, 'utf8'));
    await writeDB(obj); // writes to KV in prod
    return res.status(200).json({ ok: true, counts: { modules: obj.modules?.length || 0 } });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
