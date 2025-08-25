// pages/admin/modules/new.js
import { useState } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import adminGuard from '../../../lib/adminGuard';

export const getServerSideProps = adminGuard;


export async function getServerSideProps(ctx) {
  const guard = requireAdmin(ctx);
  if (guard) return guard;
  return { props: {} };
}

export default function NewModule() {
  const [title, setTitle] = useState('New Training');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [accessCode, setAccessCode] = useState('');

  async function createModule(e) {
    e.preventDefault();
    const res = await fetch('/api/modules', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ title, description, isPublished, accessCode })
    });
    const data = await res.json();
    Router.push(`/admin/modules/${data.module.id}`);
  }

  return (
    <div className="container">
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
            <input type="checkbox" checked={isPublished} onChange={e=>setIsPublished(e.target.checked)} /> Visible to staff
          </div>
          <div style={{gridColumn: '1 / -1'}}>
            <button className="btn primary" type="submit">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}
