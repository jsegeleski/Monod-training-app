import Link from 'next/link';
import { requireAdmin } from '../../lib/adminGuard';

export async function getServerSideProps(ctx) {
  const guard = requireAdmin(ctx);
  if (guard) return guard;
  const base = process.env.APP_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/modules`);
  const data = await res.json();
  return { props: { modules: data.modules } };
}

export default function AdminHome({ modules }) {
  return (
    <div className="container">
      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h1>Training Admin</h1>
          <Link className="btn primary" href="/admin/modules/new">+ New Module</Link>
        </div>
        <table className="table" style={{marginTop:12}}>
          <thead><tr><th>Title</th><th>Description</th><th>Published</th><th>Slides</th><th>Actions</th></tr></thead>
          <tbody>
            {modules.map(m => (
              <tr key={m.id}>
                <td>{m.title}</td>
                <td><small className="muted">{m.description}</small></td>
                <td>{m.isPublished ? 'Yes' : 'No'}</td>
                <td>{m.slides?.length || 0}</td>
                <td>
                  <Link className="btn" href={`/admin/modules/${m.id}`}>Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <hr className="sep" />
        <small className="muted">Embed on Shopify with <code>&lt;script src=\"/embed.js\"&gt;</code> — see README.</small>
      </div>
    </div>
  );
}
