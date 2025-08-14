(function(){
  // Create a shadow root to avoid theme CSS collisions
  const script = document.currentScript;
  const heroBg = script?.dataset?.bg || script?.dataset?.hero || "";
  const moduleId = script?.dataset?.module || "";
  const accessCodeInitial = script?.dataset?.access || "";
  const host = new URL(script.src).origin;

  const container = document.createElement('div');
  const shadow = container.attachShadow({ mode: 'open' });
  document.currentScript.parentNode.insertBefore(container, document.currentScript);

  const root = document.createElement('div');
  root.className = 'training-root';
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = host + '/embed.css';
  shadow.appendChild(style);
  shadow.appendChild(root);

  const el = (tag, attrs={}, children=[]) => {
    const n = document.createElement(tag);
    Object.entries(attrs||{}).forEach(([k,v])=>{
      if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = v;
      else n.setAttribute(k, v);
    });
    (Array.isArray(children)?children:[children]).forEach(c=>{ if (c) n.appendChild(c); });
    return n;
  };

  function saveProgress(moduleId, idx) {
    const key = 'training_progress::' + moduleId;
    const data = { moduleId, idx, at: Date.now() };
    localStorage.setItem(key, JSON.stringify(data));
  }
  function loadProgress(moduleId) {
    try {
      const key = 'training_progress::' + moduleId;
      const data = JSON.parse(localStorage.getItem(key) || 'null');
      if (!data) return null;
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - data.at > THIRTY_DAYS) return null;
      return data;
    } catch { return null; }
  }

    // Session storage keys
  const SKEY = 'training_session::v1';
  function getSession() {
    try { return JSON.parse(localStorage.getItem(SKEY) || 'null'); } catch { return null; }
  }
  function setSession(obj) { localStorage.setItem(SKEY, JSON.stringify(obj || null)); }
  function clearSession() { localStorage.removeItem(SKEY); }
  function clearAllProgress() {
  try {
    // Remove all localStorage keys created by the training app
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith('training_progress::')) {
        localStorage.removeItem(k);
      }
    }
  } catch (e) {
    console.error('[training] clearAllProgress error', e);
  }
}


  // Per-module progress (0-100)
  function getProgressPct(mod) {
  if (!mod?.slides?.length) return 0;

  const p = loadProgress(mod.id);          // <- returns null if nothing saved
  if (!p) return 0;                         // <- show 0% if no stored progress

  const idx = Math.max(0, Number(p.idx || 0));
  const pct = Math.round(((idx + 1) / mod.slides.length) * 100);
  return Math.min(100, Math.max(0, pct));
}

function isCompleted(mod) {
  const p = loadProgress(mod.id);
  if (!p) return false;                     // no record -> not completed
  const lastIndex = (mod?.slides?.length || 1) - 1;
  return Number(p.idx) >= lastIndex;
}


    function renderManagerGate() {
    root.innerHTML = '';
    const card = el('div', { class: 'training-card' }, [
      el('div', { class: 'training-hero' }, [
        el('h2', {}, [document.createTextNode('Staff Training')]),
        el('p', {}, [document.createTextNode('Manager access required to start a session.')])
      ]),
      el('div', { class: 'training-body' }, [
        el('input', { type:'password', class:'input', id:'mgr-pass', placeholder:'Manager password' }),
        el('div', { class: 'training-actions' }, [
          el('button', { class:'btn primary', id:'mgr-continue' }, [document.createTextNode('Continue')])
        ])
      ])
    ]);
    root.appendChild(card);
    card.querySelector('#mgr-continue').addEventListener('click', async () => {
      const val = card.querySelector('#mgr-pass').value || '';
      // Validate against server admin the simplest way: call /admin (CORS, but we only need same pw)
      // We can't read admin env here, so just post to login and check 200.
      try {
        const res = await fetch(host + '/api/auth/login', {
          method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password: val })
        });
        if (!res.ok) { alert('Incorrect password'); return; }
        // Do not keep cookie; this cookie is httpOnly and domain-bound. We only need to know it passed.
        setSession({ selected: [], startedAt: Date.now() });
        renderManagerPicker();
      } catch {
        alert('Could not validate password. Check network.');
      }
    });
  }

async function renderManagerPicker() {
  root.innerHTML = '';

  // Fetch published modules
  const res = await fetch(host + '/api/modules?publishedOnly=1');
  const data = await res.json();
  const mods = (data.modules || []).slice();

  // Card
  const card = el('div', { class: 'training-card' });

  // Hero
  card.appendChild(
    el('div', { class: 'training-hero' }, [
      el('h2', {}, [document.createTextNode('Select modules for today')]),
      el('p', {}, [document.createTextNode('Choose the modules this trainee must complete.')]),
    ])
  );

  // Trainee name input
  const nameWrap = el('div', { class: 'training-body' }, [
    el('input', { type:'text', class:'input', id:'trainee-name', placeholder:"Trainee's name (optional)" })
  ]);
  card.appendChild(nameWrap);

  // Module grid (click to toggle)
  const grid = el('div', { class: 'training-grid cols-2' },
    mods.map(m => {
      const c = el('div', { class: 'module-card' }, [
        el('div', { class: 'title' }, [document.createTextNode(m.title)]),
        el('div', { class: 'muted' }, [document.createTextNode(m.description || '')]),
      ]);
      c.addEventListener('click', () => c.classList.toggle('selected'));
      return c;
    })
  );
  card.appendChild(grid);

  // Actions
  const actions = el('div', { class: 'training-actions' }, [
    el('button', { class: 'btn ghost', id: 'cancel' }, [document.createTextNode('Back')]),
    el('button', { class: 'btn primary', id: 'start' }, [document.createTextNode('Start Session')]),
  ]);
  card.appendChild(actions);

  // Wire buttons
  actions.querySelector('#cancel').addEventListener('click', () => {
    clearSession();
    renderManagerGate();
  });

  actions.querySelector('#start').addEventListener('click', () => {
    const selected = [];
    Array.from(grid.children).forEach((node, i) => {
      if (node.classList.contains('selected')) selected.push(mods[i].id);
    });
    if (!selected.length) { alert('Select at least one module.'); return; }
    const traineeName = (card.querySelector('#trainee-name')?.value || '').trim();
    setSession({ selected, traineeName, startedAt: Date.now() });
    renderTraineeWelcome(selected);
  });

  // Mount
  root.appendChild(card);
}


    async function renderTraineeWelcome(selectedIds) {
  root.innerHTML = '';

  // Load published modules and filter to the manager’s selection
  const res = await fetch(host + '/api/modules?publishedOnly=1');
  const data = await res.json();
  const all = data.modules || [];
  const mods = all.filter(m => selectedIds.includes(m.id));

  // Trainee name (optional) from session
  const sess = getSession();
  const nameSuffix = sess?.traineeName ? ` — ${sess.traineeName}` : '';

  // Card container (define BEFORE appending children)
  const card = el('div', { class: 'training-card' });

  // Hero
  const hero = el('div', {
  class: 'training-hero' + (heroBg ? ' banner' : ''),
  style: heroBg ? `background-image:url('${heroBg}')` : ''
}, [
  el('h2', {}, [document.createTextNode(`Welcome to training${nameSuffix}`)]),
  el('p', {}, [document.createTextNode('Work through the modules below. You can return home anytime.')])
]);
card.appendChild(hero);


  // Grid of selected modules with compact progress UI
  const grid = el('div', { class: 'training-grid cols-2' },
    mods.map(m => {
      const pct = getProgressPct(m);
      const done = pct >= 100;

      const c = el('div', { class: 'module-card' + (done ? ' completed' : '') }, [
        el('div', { class: 'title' }, [document.createTextNode(m.title)]),
        el('div', { class: 'muted' }, [document.createTextNode(m.description || '')]),
        el('div', { class: 'progress-wrap' }, [
          el('div', { class: 'progress-bar' }, el('div', { style: `width:${pct}%` })),
          el('div', { class: 'progress-chip' }, [document.createTextNode(done ? 'Completed' : `${pct}%`)]),
        ]),
        el('div', {}, [
          el('button', { class: 'btn primary' }, [document.createTextNode(done ? 'Review' : 'Begin')]),
        ]),
      ]);

      c.querySelector('button').addEventListener('click', () => startSlides(m));
      return c;
    })
  );

  // Actions (Reset Session)
  const actions = el('div', { class: 'training-actions' }, [
    el('button', { class: 'btn ghost', id: 'reset-session' }, [document.createTextNode('Reset Session')]),
  ]);

  // Manager-verified reset: clears per-module progress + session (incl. trainee name)
  actions.querySelector('#reset-session').addEventListener('click', async () => {
  const pw = prompt('Manager password to reset this session:');
  if (!pw) return;
  try {
    const res = await fetch(host + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw })
    });
    if (!res.ok) { alert('Incorrect password.'); return; }

    clearAllProgress();   // <-- clears ALL module progress
    clearSession();       // <-- clears trainee name + selected modules

    alert('Session reset.');
    renderManagerGate();
  } catch (e) {
    console.error('[training] reset error', e);
    alert('Network issue while resetting. Try again.');
  }
});


  card.appendChild(grid);
  card.appendChild(actions);
  root.appendChild(card);
}




  // UI helpers
  function ProgressBar(total, current) {
    const pct = total > 0 ? Math.round((current/total)*100) : 0;
    const wrap = el('div', { class: 'training-progress' }, el('div', { style: 'width:'+pct+'%' }));
    return wrap;
  }

  function renderModuleList(modules) {
    root.innerHTML = '';
    const card = el('div', { class: 'training-card' }, [
      el('div', { class: 'training-header' }, [
        el('div', { class: 'training-title' }, [document.createTextNode('Training Modules')]),
        el('div', { class: 'muted' }, [document.createTextNode('Pick a module to start or resume.')])
      ]),
      el('div', { class: 'training-grid cols-2' },
        modules.map(m => {
          const c = el('div', { class: 'module-card' }, [
            el('div', { class: 'title' }, [document.createTextNode(m.title)]),
            el('div', { class: 'muted' }, [document.createTextNode(m.description || '')]),
            el('div', { class: 'muted' }, [document.createTextNode('Slides: ' + (m.slides?.length || 0))]),
            el('div', {}, [
              el('button', { class: 'btn primary' }, [document.createTextNode('Open')])
            ])
          ]);
          c.querySelector('button').addEventListener('click', ()=>{
            loadModule(m.id, accessCodeInitial);
          });
          return c;
        })
      )
    ]);
    root.appendChild(card);
  }

  function renderSlide(module, state) {
  try {
    const total = Array.isArray(module?.slides) ? module.slides.length : 0;
    if (total === 0) {
      root.innerHTML = '<div class="training-card">This module has no slides yet.</div>';
      return;
    }

    const idx = Math.max(0, Math.min(Number(state?.idx ?? 0), total - 1));
    const lastCheckpoint = Math.max(0, Math.min(Number(state?.lastCheckpoint ?? 0), total - 1));
    const slide = module.slides[idx];

    root.innerHTML = '';

    // Header (define button BEFORE using it)
    const homeBtn = el('button', { class: 'btn ghost', id: 'home-btn' }, [document.createTextNode('Home')]);
    homeBtn.addEventListener('click', () => {
      const sess = getSession();
      if (sess?.selected?.length) return renderTraineeWelcome(sess.selected);
      init(true);
    });

    const header = el('div', { class: 'training-header' }, [
      el('div', { class: 'training-title' }, [document.createTextNode(module.title || 'Training')]),
      el('div', {}, [homeBtn]),
    ]);

    const progress = ProgressBar(total, idx + 1);
    const body = el('div', { class: 'training-body' });
    const card = el('div', { class: 'training-card' });

    // CONTENT SLIDE
    if (slide?.type === 'content') {
      if (slide.imageUrl) body.appendChild(el('img', { class: 'training-image', src: slide.imageUrl, alt: slide.title || '' }));
      // Optional little "Quiz" chip
body.appendChild(el('div', { class: 'quiz-label' }, [document.createTextNode('Quiz')]));
// Make the QUESTION the prominent heading
body.appendChild(el('h3', {}, [document.createTextNode(q.text || slide.title || 'Question')]));


      card.appendChild(header);
      card.appendChild(progress);
      card.appendChild(body);

      const actions = el('div', { class: 'training-actions' }, [
        el('button', { class: 'btn ghost' }, [document.createTextNode('Back')]),
        el('button', { class: 'btn primary' }, [document.createTextNode(idx === total - 1 ? 'Finish' : 'Next')]),
      ]);

      // Back
      actions.children[0].addEventListener('click', () => {
        const prev = Math.max(0, idx - 1);
        saveProgress(module.id, prev);
        renderSlide(module, { idx: prev, lastCheckpoint });
      });

      // Next / Finish
      actions.children[1].addEventListener('click', () => {
        if (idx === total - 1) return renderCompletion(module);
        const next = Math.min(total - 1, idx + 1);
        saveProgress(module.id, next);
        renderSlide(module, { idx: next, lastCheckpoint });
      });

      card.appendChild(actions);
      root.appendChild(card);
      return;
    }

    // QUIZ SLIDE
    if (slide?.type === 'quiz') {
      const q = slide.question || { text: '', options: [] };

      card.appendChild(header);
      card.appendChild(progress);

      body.appendChild(el('h3', {}, [document.createTextNode(slide.title || '')]));
      body.appendChild(el('div', { class: 'muted' }, [document.createTextNode(q.text || '')]));
      if (slide.imageUrl) body.appendChild(el('img', { class: 'training-image', src: slide.imageUrl, alt: slide.title || '' }));

      const optsWrap = el('div', { class: 'training-grid' },
        (q.options || []).map(o => {
          const opt = el('div', { class: 'option' }, [document.createTextNode(o.text || '')]);
          opt.addEventListener('click', () => {
            const isCorrect = !!o.isCorrect;
            opt.classList.add(isCorrect ? 'correct' : 'wrong');
            setTimeout(() => {
              if (isCorrect) {
                const next = Math.min(total - 1, idx + 1);
                saveProgress(module.id, next);
                if (idx === total - 1) return renderCompletion(module);
                renderSlide(module, { idx: next, lastCheckpoint: next });
              } else {
                const back = Math.max(0, Math.min(lastCheckpoint, total - 1));
                saveProgress(module.id, back);
                renderSlide(module, { idx: back, lastCheckpoint });
              }
            }, 250);
          });
          return opt;
        })
      );
      body.appendChild(optsWrap);

      const actions = el('div', { class: 'training-actions' }, [
        el('button', { class: 'btn ghost' }, [document.createTextNode('Back')]),
      ]);
      actions.children[0].addEventListener('click', () => {
        const prev = Math.max(0, idx - 1);
        saveProgress(module.id, prev);
        renderSlide(module, { idx: prev, lastCheckpoint });
      });

      card.appendChild(body);
      card.appendChild(actions);
      root.appendChild(card);
      return;
    }

    // Unknown slide type fallback
    root.innerHTML = '<div class="training-card">Unsupported slide type.</div>';
  } catch (e) {
    console.error('[training] renderSlide error:', e);
    root.innerHTML = '<div class="training-card">Something went wrong rendering this slide.</div>';
  }
}


  function renderCompletion(module) {
    root.innerHTML = '';
    const card = el('div', { class: 'training-card' }, [
      el('div', { class: 'training-header' }, [
        el('div', { class: 'training-title' }, [document.createTextNode('All done ✅')]),
        el('div', { class: 'muted' }, [document.createTextNode(module.title)]),
      ]),
      el('div', { class: 'training-body' }, [
        el('p', {}, [document.createTextNode('Nice work. You can close this window or jump back to modules.')]),
        el('div', { class: 'training-actions' }, [
          el('button', { class: 'btn' }, [document.createTextNode('Back to modules')])
        ])
      ])
    ]);
    card.querySelector('button').addEventListener('click', init);
    root.appendChild(card);
  }

  async function loadModule(moduleId, accessCode) {
    // Fetch module
    const url = host + '/api/modules/' + encodeURIComponent(moduleId) + '?publishedOnly=1';
    const res = await fetch(url);
    if (!res.ok) {
      root.innerHTML = '<div class="training-card">Module not found or unpublished.</div>';
      return;
    }
    const data = await res.json();
    const mod = data.module;

    // Access code gate (optional)
    if (mod.accessCode && mod.accessCode !== accessCode) {
      // show prompt
      root.innerHTML = '';
      const card = el('div', { class: 'training-card' }, [
        el('div', { class: 'training-header' }, [
          el('div', { class: 'training-title' }, [document.createTextNode(mod.title)]),
          el('div', { class: 'muted' }, [document.createTextNode('Access required')])
        ]),
        el('div', { class: 'training-body' }, [
          el('p', {}, [document.createTextNode('Enter the access code shared by your manager:')]),
          el('input', { type:'password', class:'btn', id:'access-input', placeholder:'Access code' }),
          el('div', { class: 'training-actions' }, [
            el('button', { class: 'btn primary', id:'access-continue' }, [document.createTextNode('Continue')])
          ])
        ])
      ]);
      root.appendChild(card);
      card.querySelector('#access-continue').addEventListener('click', ()=>{
        const value = card.querySelector('#access-input').value;
        if (value === mod.accessCode) {
          startSlides(mod);
        } else {
          alert('Incorrect code.');
        }
      });
      return;
    }
    startSlides(mod);
  }

  function startSlides(mod) {
  try {
    if (!mod || !Array.isArray(mod.slides) || mod.slides.length === 0) {
      console.error('[training] startSlides: invalid module or no slides', mod);
      root.innerHTML = '<div class="training-card">This module has no slides yet.</div>';
      return;
    }

    // Determine last checkpoint (first slide after the previous quiz)
    let lastCheckpoint = 0;
    const progress = loadProgress(mod.id);
    let idx = progress ? Number(progress.idx) : 0;
    if (Number.isNaN(idx)) idx = 0;

    if (idx > 0) {
      let sectionStart = 0;
      for (let i = 0; i <= Math.min(idx, mod.slides.length - 1); i++) {
        if (mod.slides[i] && mod.slides[i].type === 'quiz') sectionStart = i + 1;
        lastCheckpoint = sectionStart;
      }
    }

    // Clamp idx to bounds
    idx = Math.max(0, Math.min(idx, mod.slides.length - 1));

    renderSlide(mod, { idx, lastCheckpoint });
  } catch (e) {
    console.error('[training] startSlides error:', e);
    root.innerHTML = '<div class="training-card">Something went wrong starting this module.</div>';
  }
}


  async function init() {
    // If a moduleId is specified, load directly. Otherwise list modules.
    if (moduleId) {
      await loadModule(moduleId, accessCodeInitial || '');
      return;
    }
    const res = await fetch(host + '/api/modules?publishedOnly=1');
    const data = await res.json();
    renderModuleList(data.modules || []);
  }

  // Start
  init();
    async function init(forceList=false) {
    // If a specific moduleId was provided, jump straight to it (backwards compatible)
    if (moduleId && !forceList) {
      await loadModule(moduleId, accessCodeInitial || '');
      return;
    }
    // New flow: manager gate → picker → trainee home
    const sess = getSession();
    if (!sess || !Array.isArray(sess.selected) || !sess.selected.length) {
      renderManagerGate();
    } else {
      renderTraineeWelcome(sess.selected);
    }
  }

})();
