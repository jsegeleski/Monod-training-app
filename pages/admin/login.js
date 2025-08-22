import { useRef, useState } from 'react';
import Head from 'next/head';

export default function Login() {
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const formRef = useRef(null);

  async function submit(e) {
    if (e) e.preventDefault();
    if (busy) return;

    setBusy(true);
    setErr('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: pw }),
      });

      if (!res.ok) {
        setErr('Incorrect password');
        setBusy(false);
        return;
      }

      // single, reliable redirect
      window.location.replace('/admin');
    } catch (e) {
      setErr(e.message || 'Login failed');
      setBusy(false);
    }
  }

  return (
    <div className="admin-wrap">
      <Head>
        <title>Admin Login</title>
        {/* fix attribute name */}
        <link rel="stylesheet" href="/admin.css" />
      </Head>

      <main className="admin-main">
        <div className="card" style={{ maxWidth: 420, margin: '10vh auto 0' }}>
          <h2 style={{ margin: '0 0 6px' }}>Sign in</h2>
          <p className="help" style={{ margin: '0 0 16px' }}>
            Enter manager/admin password
          </p>

          <form
            ref={formRef}
            onSubmit={submit}
            className="slide-list"
            onKeyDown={(e) => {
              // capture Enter anywhere inside the form
              if (e.key === 'Enter') {
                e.preventDefault();
                // ask the browser to submit this form
                formRef.current?.requestSubmit();
              }
            }}
          >
            <input
              className="input"
              type="password"
              name="password"
              autoFocus
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Password"
            />

            {err ? (
              <div className="badge" style={{ borderColor: '#5a2430', color: '#ffb4b4' }}>
                ⚠ {err}
              </div>
            ) : null}

            {/* real submit control so browsers reliably submit on Enter */}
            <button type="submit" className="abtn primary" disabled={busy}>
              {busy ? 'Signing in…' : 'Continue'}
            </button>
            <input type="submit" hidden aria-hidden="true" tabIndex={-1} />
          </form>
        </div>
      </main>
    </div>
  );
}