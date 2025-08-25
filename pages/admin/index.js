import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';

import adminGuard from '../../lib/adminGuard';
export const getServerSideProps = adminGuard;

export default function AdminHome() {
  const [mods, setMods] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const r = await fetch('/api/modules');
    const j = await r.json();
    setMods(j.modules || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function create() {
    setBusy(true);
    try {
      const r = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New module', description: '', isPublished: false })
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error('Create failed: ' + t);
      }
      const j = await r.json();
      if (!j?.module?.id) throw new Error('Create failed: no id in response');
      window.location.href = `/admin/modules/${j.module.id}`;
    } catch (e) {
      alert(e.message || 'Create failed');
      setBusy(false);
    }
  }

  async function patchModule(id, payload) {
    const r = await fetch(`/api/modules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      // credentials: 'include', // uncomment if admin runs on a different origin
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(await r.text());
    const { module } = await r.json();
    return module;
  }

  async function togglePublish(m) {
    // optimistic UI
    setMods(ms => ms.map(x => x.id === m.id ? { ...x, isPublished: !x.isPublished } : x));
    try {
      const next = !m.isPublished;
      const saved = await patchModule(m.id, { isPublished: next });
      // reconcile with server (in case other fields changed)
      setMods(ms => ms.map(x => x.id === m.id ? saved : x));
    } catch (e) {
      // rollback on error
      console.error('Publish toggle failed', e);
      setMods(ms => ms.map(x => x.id === m.id ? { ...x, isPublished: m.isPublished } : x));
      alert('Publish failed. Please try again.');
    }
  }

  return (
    <AdminLayout title="Modules">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Modules</h2>
          <button className="abtn primary" onClick={create} disabled={busy}>
            {busy ? 'Creating…' : 'New Module'}
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slides</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && mods.map(m => (
              <tr key={m.id}>
                <td>
                  <a className="abtn ghost" href={`/admin/modules/${m.id}`} style={{ padding: '6px 10px' }}>
                    {m.title || 'Untitled'}
                  </a>
                  
                </td>
                <td>{m.slides?.length || 0}</td>
                <td>{m.isPublished ? <span className="badge ok">Published</span> : <span className="badge">Draft</span>}</td>
                <td className="actions">
                  <span className="actions-wrap">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={!!m.isPublished}
                        onChange={() => togglePublish(m)}
                      />
                      <span className="help">Published</span>
                    </label>
                    <a href={`/admin/modules/${m.id}`} className="abtn">Edit</a>
                  </span>
                </td>
              </tr>
            ))}
            {!loading && mods.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <div className="help">
                    No modules yet. Click <span className="kbd">New Module</span> to get started.
                  </div>
                </td>
              </tr>
            )}
            {loading && (
              <tr><td colSpan={4}><div className="help">Loading…</div></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
