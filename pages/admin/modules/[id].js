import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';

export default function ModuleEditor() {
  const router = useRouter();
  const { id } = router.query;

  const [mod, setMod] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    const r = await fetch(`/api/modules/${id}`);
    if (!r.ok) return;
    const j = await r.json();
    setMod(j.module);
  }

  function setField(k, v) { setMod(m => ({ ...m, [k]: v })); }

  function addSlide(type) {
    const slide = type === 'quiz'
      ? { id: 's'+Date.now(), type:'quiz', title:'Quick check', imageUrl:'', question:{ text:'', options:[{id:'a', text:'', isCorrect:true},{id:'b', text:'', isCorrect:false}] } }
      : { id: 's'+Date.now(), type:'content', title:'New slide', imageUrl:'', bodyHtml:'' };
    setMod(m => ({ ...m, slides: [...(m.slides||[]), slide] }));
  }

  function moveSlide(idx, dir) {
    setMod(m => {
      const arr = [...(m.slides||[])];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return m;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...m, slides: arr };
    });
  }

  function deleteSlide(idx) {
    if (!confirm('Delete this slide?')) return;
    setMod(m => {
      const arr = [...(m.slides||[])];
      arr.splice(idx,1);
      return { ...m, slides: arr };
    });
  }

  async function save(overrides = {}) {
  setBusy(true);
  setMsg('');

  const payload = {
    title: mod.title,
    description: mod.description,
    accessCode: mod.accessCode,
    isPublished: !!mod.isPublished,
    slides: Array.isArray(mod.slides) ? mod.slides : [],
    ...overrides, // <- force specific fields (like isPublished) to what we intend
  };

  const r = await fetch(`/api/modules/${mod.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  setBusy(false);

  if (r.ok) {
    const { module: saved } = await r.json();
    setMod(saved);
    setMsg('Saved');
  } else {
    setMsg('Save failed');
  }
}



  async function togglePublish() {
  const next = !mod.isPublished;
  setField('isPublished', next);     // optimistic UI
  await save({ isPublished: next }); // ensure server gets the same value
}


  async function destroy() {
    if (!confirm('Delete entire module?')) return;
    const r = await fetch(`/api/modules/${mod.id}`, { method: 'DELETE' });
    if (r.ok) router.push('/admin');
  }

  if (!mod) return <AdminLayout title="Loading…"><div className="card">Loading…</div></AdminLayout>;

  return (
    <AdminLayout title={`Edit: ${mod.title || 'Untitled'}`}>
      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
          <h2 style={{margin:0}}>Module settings</h2>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <label className="switch">
              <input type="checkbox" checked={!!mod.isPublished} onChange={togglePublish}/>
              <span className="help">Published</span>
            </label>
            <button className="abtn danger" onClick={destroy}>Delete</button>
            <button className="abtn primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          </div>
        </div>

        <div className="row">
          <div className="label">Title</div>
          <input className="input" value={mod.title || ''} onChange={e=>setField('title', e.target.value)} placeholder="Module title"/>
        </div>
        <div className="row">
          <div className="label">Description</div>
          <input className="input" value={mod.description || ''} onChange={e=>setField('description', e.target.value)} placeholder="Short description"/>
        </div>
        <div className="row">
          <div className="label">Access code</div>
          <input className="input" value={mod.accessCode || ''} onChange={e=>setField('accessCode', e.target.value)} placeholder="Optional (leave blank for open)"/>
        </div>
        {msg ? <div className="badge ok" style={{marginTop:12}}>✓ {msg}</div> : null}
      </div>

      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
          <h2 style={{margin:0}}>Slides</h2>
          <div style={{display:'flex', gap:8}}>
            <button className="abtn" onClick={()=>addSlide('content')}>+ Content</button>
            <button className="abtn" onClick={()=>addSlide('quiz')}>+ Quiz</button>
          </div>
        </div>

        <div className="slide-list">
          {(mod.slides||[]).map((s, i) => (
            <div key={s.id || i} className="slide-item">
              <div className="slide-head">
                <div className="slide-type">#{i+1} • {s.type === 'quiz' ? 'Quiz' : 'Content'}</div>
                <div className="slide-actions">
                  <button className="abtn" onClick={()=>moveSlide(i,-1)}>↑</button>
                  <button className="abtn" onClick={()=>moveSlide(i, 1)}>↓</button>
                  <button className="abtn danger" onClick={()=>deleteSlide(i)}>Delete</button>
                </div>
              </div>

              {s.type === 'content' ? (
                <div className="split" style={{marginTop:8}}>
                  <div>
                    <div className="row">
                      <div className="label">Title</div>
                      <input className="input" value={s.title || ''} onChange={e=>updateSlide(mod, setMod, i, { title: e.target.value })}/>
                    </div>
                    <div className="row">
                      <div className="label">Body (HTML OK)</div>
                      <textarea className="textarea" value={s.bodyHtml || ''} onChange={e=>updateSlide(mod, setMod, i, { bodyHtml: e.target.value })}/>
                    </div>
                  </div>
                  <div>
                    <div className="row">
                      <div className="label">Image URL</div>
                      <input className="input" value={s.imageUrl || ''} onChange={e=>updateSlide(mod, setMod, i, { imageUrl: e.target.value })}/>
                    </div>
                    <div className="help">Paste an image URL (Shopify Files or CDN). Leave blank if not needed.</div>
                  </div>
                </div>
              ) : (
                <div className="split" style={{marginTop:8}}>
                  <div>
                    <div className="row">
                      <div className="label">Question</div>
                      <input className="input" value={s.question?.text || ''} onChange={e=>{
                        const q = { ...(s.question||{}), text: e.target.value };
                        updateSlide(mod, setMod, i, { question: q });
                      }}/>
                    </div>
                    <div className="row">
                      <div className="label">Title (optional)</div>
                      <input className="input" value={s.title || ''} onChange={e=>updateSlide(mod, setMod, i, { title: e.target.value })}/>
                    </div>
                  </div>
                  <div>
                    <div className="row">
                      <div className="label">Image URL</div>
                      <input className="input" value={s.imageUrl || ''} onChange={e=>updateSlide(mod, setMod, i, { imageUrl: e.target.value })}/>
                    </div>
                    <div className="help">Optional: add an image above the question.</div>
                  </div>

                  <div style={{gridColumn:'1 / -1', marginTop:8}}>
                    <OptionsEditor slide={s} onChange={(opts)=> {
                      const q = { ...(s.question||{}), options: opts };
                      updateSlide(mod, setMod, i, { question: q });
                    }} />
                  </div>
                </div>
              )}
            </div>
          ))}
          {(mod.slides||[]).length === 0 && (
            <div className="help">No slides yet. Add a <span className="kbd">Content</span> slide or a <span className="kbd">Quiz</span> slide.</div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

/* ---------- helpers ---------- */
function updateSlide(mod, setMod, idx, patch) {
  setMod(m => {
    const arr = [...(m.slides||[])];
    arr[idx] = { ...(arr[idx]||{}), ...patch };
    return { ...m, slides: arr };
  });
}

function OptionsEditor({ slide, onChange }) {
  const opts = Array.isArray(slide?.question?.options) ? slide.question.options : [];

  function setOpt(i, patch) {
    const next = opts.map((o, idx) => idx === i ? { ...o, ...patch } : o);
    onChange(next);
  }
  function addOpt() {
    onChange([ ...opts, { id: Math.random().toString(36).slice(2,7), text:'', isCorrect:false } ]);
  }
  function delOpt(i) {
    onChange(opts.filter((_,idx)=> idx!==i));
  }
  function markCorrect(i) {
    onChange(opts.map((o, idx) => ({ ...o, isCorrect: idx===i })));
  }

  return (
    <div className="card" style={{background:'#0f1620', borderStyle:'solid'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
        <div className="label" style={{textTransform:'uppercase'}}>Options</div>
        <button className="abtn" type="button" onClick={addOpt}>+ Add option</button>
      </div>

      <div className="slide-list">
        {opts.map((o, i) => {
          const isCorrect = !!o.isCorrect;
          return (
            <div key={o.id || i} className={'opt-row' + (isCorrect ? ' correct' : '')}>
              <input
                className="input"
                placeholder={`Option ${i+1} text`}
                value={o.text || ''}
                onChange={e=>setOpt(i, { text: e.target.value })}
              />

              <button
                type="button"
                className="abtn"
                onClick={()=>markCorrect(i)}
                title="Mark as correct"
              >
                {isCorrect ? '✓ Correct' : 'Mark correct'}
              </button>

              <button
                type="button"
                className="abtn danger"
                onClick={()=>delOpt(i)}
                title="Remove option"
              >
                Remove
              </button>

              {/* subtle badge for clarity */}
              {isCorrect ? <div className="correct-pill" style={{gridColumn:'1 / -1'}}>This is the correct answer</div> : null}
            </div>
          );
        })}

        {opts.length === 0 && <div className="help">No options yet.</div>}
      </div>
    </div>
  );
}

