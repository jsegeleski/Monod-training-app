// pages/admin/login.js
import Head from 'next/head';
import { useState } from 'react';
import { parse } from 'cookie';

export async function getServerSideProps(ctx) {
  const cookies = parse(ctx.req?.headers?.cookie || '');
  const authed =
    cookies.admin === '1' ||
    cookies.admin_auth === 'true' ||
    cookies.admin_client === '1';

  // Avoid bfcache weirdness and stale screens
  ctx.res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (authed) {
    return { redirect: { destination: '/admin', permanent: false } };
  }
  return { props: {} };
}

export default function AdminLogin() {
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',                 // keep for Safari
        body: JSON.stringify({ password: pw }),
      });
      if (!res.ok) {
        setErr('Incorrect password');
        setBusy(false);
        return;
      }

      // Hard navigation + cache buster to avoid Safari bfcache restoring login
      window.location.assign('/admin?ts=' + Date.now());
    } catch (e) {
      setErr(e?.message || 'Login failed');
      setBusy(false);
    }
  }

  return (
    <div className="admin-wrap">
      <Head>
        <title>Admin Login</title>
        <link rel="stylesheet" href="/admin.css" />
      </Head>

      <main className="admin-main">
        <div className="login-split">
          {/* Left: hero image (hardcoded Shopify URL) */}
          <div
            className="login-hero"
            style={{
              backgroundImage: "url('https://cdn.shopify.com/s/files/1/0654/3881/0355/files/6U7A5031.webp?v=1755386447')"
            }}
            aria-hidden="true"
          />

          {/* Right: form panel */}
          <div className="login-panel">
            <h1 className="login-title">Staff Training Admin Dashboard</h1>
            <p className="help login-sub">Manager access to edit staff training portal</p>

            <form onSubmit={submit} className="login-form">
              <label className="sr-only" htmlFor="pw">Manager password</label>
              <input
                id="pw"
                className="input"
                type="password"
                value={pw}
                onChange={e=>setPw(e.target.value)}
                placeholder="Manager password"
                autoFocus
                autoComplete="current-password"
              />
              {err ? (
                <div className="badge" style={{borderColor:'#5a2430', color:'#ffb4b4'}}>
                  ⚠ {err}
                </div>
              ) : null}

              <button className="abtn primary" disabled={busy} type="submit">
                {busy ? 'Signing in…' : 'Continue'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}