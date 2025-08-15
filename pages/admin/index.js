import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminHome() {
  const [mods, setMods] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const r = await fetch('/api/modules');
    const j = await r.json();
    setMods(j.modules || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function create() {
    setBusy(true);
    try {
      const r = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New module', description: '', isPublished: false })
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error('Create failed: ' + t);
      }
      const j = await r.json();
      if (!j?.module?.id) throw new Error('Create failed: no id in response');
      window.location.href = `/admin/modules/${j.module.id}`;
    } catch (e) {
      alert(e.message || 'Create failed');
      setBusy(false);
    }
  }

  async function patchModule(id, payload) {
    const r = await fetch(`/api/modules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      // credentials: 'include', // uncomment if admin runs on a different origin
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(await r.text());
    const { module } = await r.json();
    return module;
  }

  async function togglePublish(m) {
    // optimistic UI
    setMods(ms => ms.map(x => x.id === m.id ? { ...x, isPublished: !x.isPublished } : x));
    try {
      const next = !m.isPublished;
      const saved = await patchModule(m.id, { isPublished: next });
      // reconcile with server (in case other fields changed)
      setMods(ms => ms.map(x => x.id === m.id ? saved : x));
    } catch (e) {
      // rollback on error
      console.error('Publish toggle failed', e);
      setMods(ms => ms.map(x => x.id === m.id ? { ...x, isPublished: m.isPublished } : x));
      alert('Publish failed. Please try again.');
    }
  }

  return (
    <AdminLayout title="Modules">
      <div className="card">
  <h2 style={{ margin: 0 }}>Slides</h2>

  <div className="slide-list" style={{ marginTop: 8 }}>
    {(mod.slides || []).map((s, i) => (
      <div key={s.id || i} className="slide-item">
        <div className="slide-head">
          <div className="slide-type">#{i + 1} • {s.type === 'quiz' ? 'Quiz' : 'Content'}</div>
          <div className="slide-actions">
            <button className="abtn" onClick={() => moveSlide(i, -1)}>↑</button>
            <button className="abtn" onClick={() => moveSlide(i, 1)}>↓</button>
            <button className="abtn danger" onClick={() => deleteSlide(i)}>Delete</button>
          </div>
        </div>

        {s.type === 'content' ? (
          // ===== CONTENT SLIDE: Full-width fields, URL under Title, Body below =====
          <div style={{ marginTop: 8 }}>
            <div className="row">
              <div className="label">Title</div>
              <input
                className="input"
                style={{ width: '100%' }}
                value={s.title || ''}
                onChange={e => updateSlide(mod, setMod, i, { title: e.target.value })}
              />
            </div>

            <div className="row">
              <div className="label">Image URL</div>
              <input
                className="input"
                style={{ width: '100%' }}
                value={s.imageUrl || ''}
                onChange={e => updateSlide(mod, setMod, i, { imageUrl: e.target.value })}
                placeholder="Paste an image URL (Shopify Files or CDN). Leave blank if not needed."
              />
            </div>

            <div className="row">
              <div className="label">Body (HTML OK)</div>
              <textarea
                className="textarea"
                style={{ width: '100%', minHeight: 220 }}
                value={s.bodyHtml || ''}
                onChange={e => updateSlide(mod, setMod, i, { bodyHtml: e.target.value })}
              />
            </div>
          </div>
        ) : (
          // ===== QUIZ SLIDE (unchanged layout) =====
          <div className="split" style={{ marginTop: 8 }}>
            <div>
              <div className="row">
                <div className="label">Question</div>
                <input
                  className="input"
                  value={s.question?.text || ''}
                  onChange={e => {
                    const q = { ...(s.question || {}), text: e.target.value };
                    updateSlide(mod, setMod, i, { question: q });
                  }}
                />
              </div>
              <div className="row">
                <div className="label">Title (optional)</div>
                <input
                  className="input"
                  value={s.title || ''}
                  onChange={e => updateSlide(mod, setMod, i, { title: e.target.value })}
                />
              </div>
            </div>
            <div>
              <div className="row">
                <div className="label">Image URL</div>
                <input
                  className="input"
                  value={s.imageUrl || ''}
                  onChange={e => updateSlide(mod, setMod, i, { imageUrl: e.target.value })}
                />
              </div>
              <div className="help">Optional: add an image above the question.</div>
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
              <OptionsEditor
                slide={s}
                onChange={(opts) => {
                  const q = { ...(s.question || {}), options: opts };
                  updateSlide(mod, setMod, i, { question: q });
                }}
              />
            </div>
          </div>
        )}
      </div>
    ))}

    {(mod.slides || []).length === 0 && (
      <div className="help">
        No slides yet. Add a <span className="kbd">Content</span> slide or a <span className="kbd">Quiz</span> slide.
      </div>
    )}
  </div>

  {/* Moved here: always appears after the newest slide */}
  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
    <button className="abtn" onClick={() => addSlide('content')}>+ Content</button>
    <button className="abtn" onClick={() => addSlide('quiz')}>+ Quiz</button>
  </div>
</div>

    </AdminLayout>
  );
}
