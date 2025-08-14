import { useEffect, useState } from 'react';

export default function PortalPage() {
  const [module, setModule] = useState(null);
  const [moduleId, setModuleId] = useState('');
  const [code, setCode] = useState('');

  async function load() {
    if (!moduleId) return;
    const url = `/api/modules/${moduleId}?publishedOnly=1`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setModule(data.module);
    } else {
      alert('Not found or unpublished.');
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Portal Debug</h1>
        <div className="row">
          <div>
            <label>Module ID</label>
            <input className="input" value={moduleId} onChange={e=>setModuleId(e.target.value)} placeholder="e.g. mod_welcome" />
          </div>
          <div>
            <label>Access Code (if set)</label>
            <input className="input" value={code} onChange={e=>setCode(e.target.value)} />
          </div>
        </div>
        <div style={{marginTop:8}}>
          <button className="btn" onClick={load}>Load</button>
        </div>
      </div>
      {module && (
        <div className="card" style={{marginTop:16}}>
          <pre>{JSON.stringify(module, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
