// components/admin/AdminLayout.js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function AdminLayout({ title = 'Training Admin', children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);   // mounted & checked
  const [authed, setAuthed] = useState(false); // result of cookie check

  useEffect(() => {
    // Client-only auth check
    if (typeof document === 'undefined') return;

    try {
      const hasCookie = document.cookie
        .split('; ')
        .some(c => c.startsWith('admin_auth='));
      setAuthed(hasCookie);
      setReady(true);

      if (!hasCookie) {
        // Use router.replace to avoid an extra history entry
        router.replace('/admin/login');
      }
    } catch (e) {
      setAuthed(false);
      setReady(true);
      router.replace('/admin/login');
    }
  }, [router]);

  // Optional tiny loading state while we determine auth client-side
  if (!ready) {
    return (
      <div className="admin-wrap">
        <Head>
          <title>{title}</title>
          <link rel="stylesheet" href="/admin.css" />
        </Head>
        <main className="admin-main">
          <div className="card">Loading…</div>
        </main>
      </div>
    );
  }

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
        {authed ? children : <div className="card">Redirecting…</div>}
      </main>
    </div>
  );
}
