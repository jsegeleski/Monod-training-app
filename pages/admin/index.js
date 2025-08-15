import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminHome() {
  const [mods, setMods] = useState([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch('/api/modules');
    const j = await r.json();
    setMods(j.modules || []);
  }
  useEffect(() => { load(); }, []);

  async function create() {
  setBusy(true);
  try {
    const r = await fetch('/api/modules', {
      method: 'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ title:'New module', description:'', isPublished:false })
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


  async function togglePublish(m) {
    const updated = { ...m, isPublished: !m.isPublished };
    await fetch(`/api/modules/${m.id}`, {
      method: 'PUT',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ module: updated })
    });
    await load();
  }

  return (
    <AdminLayout title="Modules">
      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
          <h2 style={{margin:0}}>Modules</h2>
          <button className="abtn primary" onClick={create} disabled={busy}>{busy ? 'Creating…' : 'New Module'}</button>
        </div>

        <table className="table">
          <thead>
            <tr><th>Title</th><th>Slides</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {mods.map(m => (
              <tr key={m.id}>
                <td>
                  <a className="abtn ghost" href={`/admin/modules/${m.id}`} style={{padding:'6px 10px'}}>{m.title || 'Untitled'}</a>
                  <div className="help">{m.description}</div>
                </td>
                <td>{m.slides?.length || 0}</td>
                <td>{m.isPublished ? <span className="badge ok">Published</span> : <span className="badge">Draft</span>}</td>
                <td className="actions">
  <span className="actions-wrap">
    <label className="switch">
      <input type="checkbox" checked={!!m.isPublished} onChange={()=>togglePublish(m)} />
      <span className="help">Published</span>
    </label>
    <a href={`/admin/modules/${m.id}`} className="abtn">Edit</a>
  </span>
</td>

              </tr>
            ))}
            {mods.length === 0 && (
              <tr><td colSpan={4}><div className="help">No modules yet. Click <span className="kbd">New Module</span> to get started.</div></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
