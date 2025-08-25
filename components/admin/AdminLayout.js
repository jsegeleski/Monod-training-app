// components/admin/AdminLayout.js
import Head from 'next/head';

export default function AdminLayout({ title = 'Training Admin', children }) {
  return (
    <div className="admin-wrap">
      <Head>
        <title>{title}</title>
        <link rel="stylesheet" href="/admin.css" />
      </Head>

      <header className="admin-header">
        <div className="admin-title">Training Admin</div>
        <div className="admin-actions">
          <a className="abtn ghost" href="/admin">Modules</a>
          <a className="abtn" href="/" target="_blank" rel="noreferrer">View Embed</a>
        </div>
      </header>

      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}