// pages/admin/login.js
import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: pw }),
      });
      if (!res.ok) { setErr('Incorrect password'); setBusy(false); return; }

      // give the browser a beat to commit Set-Cookie, then do a client nav
      await new Promise(r => setTimeout(r, 150));
      router.replace('/admin'); // client-side navigation
    } catch (e) {
      setErr(e.message || 'Login failed');
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
            <h1 className="login-title">Staff Training</h1>
            <p className="help login-sub">Manager access required to start a session.</p>

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