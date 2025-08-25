// pages/admin/modules/new.js
import { useState } from 'react';
import Router from 'next/router';                       // <— needed for Router.push
import AdminLayout from '../../../components/admin/AdminLayout';
import adminGuard from '../../../lib/adminGuard';

export const getServerSideProps = adminGuard;          // only ONE export

export default function NewModule() {
  const [title, setTitle] = useState('New Training');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function createModule(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');

    try {
      const res = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, isPublished, accessCode })
      });
      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      Router.push(`/admin/modules/${data.module.id}`);
    } catch (e) {
      setErr('Create failed. ' + (e?.message || ''));
      setBusy(false);
    }
  }

  return (
    <AdminLayout title="New Module">
      <div className="card">
        <h1>New Module</h1>

        <form onSubmit={createModule} className="row">
          <div>
            <label>Title</label>
            <input className="input" value={title} onChange={e=>setTitle(e.target.value)} />
          </div>

          <div>
            <label>Description</label>
            <input className="input" value={description} onChange={e=>setDescription(e.target.value)} />
          </div>

          <div>
            <label>Access code (optional)</label>
            <input className="input" value={accessCode} onChange={e=>setAccessCode(e.target.value)} placeholder="e.g. STAFF2025" />
          </div>

          <div>
            <label>Published</label><br/>
            <input
              type="checkbox"
              checked={isPublished}
              onChange={e=>setIsPublished(e.target.checked)}
            /> Visible to staff
          </div>

          {err && (
            <div className="badge" style={{ borderColor:'#5a2430', color:'#ffb4b4' }}>
              ⚠ {err}
            </div>
          )}

          <div style={{ gridColumn: '1 / -1' }}>
            <button className="abtn primary" type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}