import { useState } from 'react';

export default function Login() {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
    if (res.ok) {
      window.location.href = '/admin';
    } else {
      setError('Invalid password.');
    }
  }
  return (
    <div className="container" style={{maxWidth: 480}}>
      <div className="card">
        <h1>Admin Login</h1>
        <form onSubmit={handleSubmit}>
          <label>Password</label>
          <input className="input" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Enter admin password" />
          <div style={{display:'flex', gap:8, marginTop:12}}>
            <button className="btn primary" type="submit">Sign in</button>
            {error && <span style={{color:'var(--err)'}}>{error}</span>}
          </div>
        </form>
        <hr className="sep" />
        <small className="muted">Set <code>ADMIN_PASSWORD</code> in your <code>.env</code> file.</small>
      </div>
    </div>
  );
}
