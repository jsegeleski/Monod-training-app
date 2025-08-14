import { useEffect, useState } from 'react';
import Router, { useRouter } from 'next/router';
import { requireAdmin } from '../../../lib/adminGuard';

export async function getServerSideProps(ctx) {
  const guard = requireAdmin(ctx);
  if (guard) return guard;
  const { id } = ctx.params;
  const base = process.env.APP_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/modules/${id}`);
  if (res.status !== 200) return { notFound: true };
  const data = await res.json();
  return { props: { initialModule: data.module } };
}

function emptyContentSlide() {
  return { id: 's_'+Math.random().toString(36).slice(2,8), type:'content', title:'New Slide', bodyHtml:'', imageUrl:'' };
}
function emptyQuizSlide() {
  return {
    id: 's_'+Math.random().toString(36).slice(2,8),
    type: 'quiz',
    title: 'New Quiz',
    question: { text: '', options: [
      { id: 'o1', text:'', isCorrect:false },
      { id: 'o2', text:'', isCorrect:false },
      { id: 'o3', text:'', isCorrect:false }
    ]},
    imageUrl:''
  };
}

export default function EditModule({ initialModule }) {
  const [mod, setMod] = useState(initialModule);
  const router = useRouter();

  function updateField(key, value) {
    setMod({...mod, [key]: value});
  }

  function addSlide(kind) {
    const slide = kind === 'quiz' ? emptyQuizSlide() : emptyContentSlide();
    setMod({...mod, slides: [...(mod.slides||[]), slide]});
  }

  function removeSlide(idx) {
    const slides = [...mod.slides];
    slides.splice(idx,1);
    setMod({...mod, slides});
  }

  function moveSlide(idx, dir) {
    const slides = [...mod.slides];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= slides.length) return;
    const [s] = slides.splice(idx,1);
    slides.splice(newIdx,0,s);
    setMod({...mod, slides});
  }

  function updateSlide(idx, patch) {
    const slides = [...mod.slides];
    slides[idx] = {...slides[idx], ...patch};
    setMod({...mod, slides});
  }

  async function save() {
    const res = await fetch(`/api/modules/${mod.id}`, {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ module: mod })
    });
    if (res.ok) alert('Saved!');
  }

  async function del() {
    if (!confirm('Delete this module?')) return;
    const res = await fetch(`/api/modules/${mod.id}`, { method: 'DELETE' });
    if (res.ok) Router.push('/admin');
  }

  return (
    <div className="container">
      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h1>Edit Module</h1>
          <div style={{display:'flex', gap:8}}>
            <button className="btn" onClick={save}>Save</button>
            <button className="btn danger" onClick={del}>Delete</button>
          </div>
        </div>

        <div className="row">
          <div>
            <label>Title</label>
            <input className="input" value={mod.title} onChange={e=>updateField('title', e.target.value)} />
          </div>
          <div>
            <label>Description</label>
            <input className="input" value={mod.description} onChange={e=>updateField('description', e.target.value)} />
          </div>
          <div>
            <label>Access code (optional)</label>
            <input className="input" value={mod.accessCode||''} onChange={e=>updateField('accessCode', e.target.value)} />
          </div>
          <div>
            <label>Published</label><br/>
            <input type="checkbox" checked={!!mod.isPublished} onChange={e=>updateField('isPublished', e.target.checked)} /> Visible to staff
          </div>
        </div>

        <hr className="sep" />

        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h2>Slides</h2>
          <div style={{display:'flex', gap:8}}>
            <button className="btn" onClick={()=>addSlide('content')}>+ Content</button>
            <button className="btn" onClick={()=>addSlide('quiz')}>+ Quiz</button>
          </div>
        </div>

        {(mod.slides||[]).map((s, idx) => (
          <div key={s.id} className="card" style={{marginTop:12}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h3>#{idx+1} — {s.type === 'quiz' ? 'Quiz' : 'Content'}</h3>
              <div style={{display:'flex', gap:8}}>
                <button className="btn" onClick={()=>moveSlide(idx,-1)}>↑</button>
                <button className="btn" onClick={()=>moveSlide(idx, 1)}>↓</button>
                <button className="btn danger" onClick={()=>removeSlide(idx)}>Remove</button>
              </div>
            </div>
            {s.type === 'content' && (
              <div className="row">
                <div>
                  <label>Title</label>
                  <input className="input" value={s.title} onChange={e=>updateSlide(idx, { title: e.target.value })} />
                </div>
                <div>
                  <label>Image URL (optional)</label>
                  <input className="input" value={s.imageUrl||''} onChange={e=>updateSlide(idx, { imageUrl: e.target.value })} />
                </div>
                <div style={{gridColumn:'1 / -1'}}>
                  <label>Body (HTML ok)</label>
                  <textarea rows={6} className="input" value={s.bodyHtml||''} onChange={e=>updateSlide(idx, { bodyHtml: e.target.value })} />
                </div>
              </div>
            )}
            {s.type === 'quiz' && (
              <div className="row">
                <div>
                  <label>Quiz Title</label>
                  <input className="input" value={s.title} onChange={e=>updateSlide(idx, { title: e.target.value })} />
                </div>
                <div>
                  <label>Image URL (optional)</label>
                  <input className="input" value={s.imageUrl||''} onChange={e=>updateSlide(idx, { imageUrl: e.target.value })} />
                </div>
                <div style={{gridColumn:'1 / -1'}}>
                  <label>Question</label>
                  <input className="input" value={s.question?.text||''} onChange={e=>{
                    const q = {...(s.question||{ text:'', options:[] }), text: e.target.value};
                    updateSlide(idx, { question: q });
                  }} />
                </div>
                <div style={{gridColumn:'1 / -1'}}>
                  <label>Options (mark the correct one)</label>
                  {(s.question?.options||[]).map((o, oi) => (
                    <div key={o.id} style={{display:'grid', gridTemplateColumns:'20px 1fr 100px', gap:8, alignItems:'center', marginTop:6}}>
                      <input type="checkbox" checked={!!o.isCorrect} onChange={e=>{
                        const q = {...s.question};
                        const opts = [...q.options];
                        opts[oi] = {...opts[oi], isCorrect: e.target.checked};
                        q.options = opts;
                        updateSlide(idx, { question: q });
                      }}/>
                      <input className="input" value={o.text} onChange={e=>{
                        const q = {...s.question};
                        const opts = [...q.options];
                        opts[oi] = {...opts[oi], text: e.target.value};
                        q.options = opts;
                        updateSlide(idx, { question: q });
                      }} />
                      <button className="btn danger" onClick={(e)=>{
                        e.preventDefault();
                        const q = {...s.question};
                        q.options = (q.options||[]).filter((x,ii)=>ii!==oi);
                        updateSlide(idx, { question: q });
                      }}>Remove</button>
                    </div>
                  ))}
                  <div style={{marginTop:8}}>
                    <button className="btn" onClick={(e)=>{
                      e.preventDefault();
                      const q = {...(s.question||{options:[]})};
                      q.options = [...(q.options||[]), { id: 'o'+Math.random().toString(36).slice(2,6), text:'', isCorrect:false }];
                      updateSlide(idx, { question: q });
                    }}>+ Option</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        <div style={{marginTop:16, display:'flex', gap:8}}>
          <button className="btn primary" onClick={save}>Save Changes</button>
          <a className="btn ghost" href="/admin">Back</a>
          <a className="btn" href="/portal?moduleId=${encodeURIComponent(initialModule?.id||'')}" target="_blank" rel="noreferrer">Preview Portal</a>
        </div>
      </div>
    </div>
  );
}
