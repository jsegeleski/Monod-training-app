(function(){
  // Create a shadow root to avoid theme CSS collisions
  const script = document.currentScript;
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

  // Per-module progress (0-100)
  function getProgressPct(mod) {
    const p = loadProgress(mod.id);
    if (!mod?.slides?.length) return 0;
    const idx = Math.max(0, (p?.idx ?? 0));
    const pct = Math.round(((idx+1) / mod.slides.length) * 100);
    return Math.min(100, Math.max(0, pct));
  }
  function isCompleted(mod) {
    return getProgressPct(mod) >= 100;
  }

    function renderManagerGate() {
    root.innerHTML = '';
    const card = el('div', { class: 'training-card' }, [
      el('div', { class: 'training-hero' }, [
        el('h2', {}, [document.createTextNode('Staff Training')]),
        el('p', {}, [document.createTextNode('Manager access required to start a session.')])
      ]),
      el('div', { class: 'training-body' }, [
        el('input', { type:'password', class:'btn', id:'mgr-pass', placeholder:'Manager password' }),
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
    const res = await fetch(host + '/api/modules?publishedOnly=1');
    const data = await res.json();
    const mods = (data.modules || []).slice(); // copy

    const card = el('div', { class: 'training-card' });
    card.appendChild(el('div', { class: 'training-hero' }, [
      el('h2', {}, [document.createTextNode('Select modules for today')]),
      el('p', {}, [document.createTextNode('Choose the modules this trainee must complete.')])
    ]));

    const grid = el('div', { class: 'training-grid cols-2' },
      mods.map(m => {
        const c = el('div', { class: 'module-card' }, [
          el('div', { class: 'title' }, [document.createTextNode(m.title)]),
          el('div', { class: 'muted' }, [document.createTextNode(m.description || '')]),
        ]);
        c.addEventListener('click', () => {
          c.classList.toggle('selected');
        });
        return c;
      })
    );

    const actions = el('div', { class: 'training-actions' }, [
      el('button', { class:'btn ghost', id:'cancel' }, [document.createTextNode('Back')]),
      el('button', { class:'btn primary', id:'start' }, [document.createTextNode('Start Session')]),
    ]);

    card.appendChild(grid);
    card.appendChild(actions);
    root.appendChild(card);

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
      setSession({ selected, startedAt: Date.now() });
      renderTraineeWelcome(selected);
    });
  }

    async function renderTraineeWelcome(selectedIds) {
    root.innerHTML = '';
    const res = await fetch(host + '/api/modules?publishedOnly=1');
    const data = await res.json();
    const all = data.modules || [];
    const mods = all.filter(m => selectedIds.includes(m.id));

    const card = el('div', { class: 'training-card' });
    card.appendChild(el('div', { class: 'training-hero' }, [
      el('h2', {}, [document.createTextNode('Welcome to training')]),
      el('p', {}, [document.createTextNode('Work through the modules below. You can return home anytime.')])
    ]));

    const grid = el('div', { class: 'training-grid cols-2' },
      mods.map(m => {
        const pct = getProgressPct(m);
        const done = pct >= 100;
        const c = el('div', { class: 'module-card' + (done ? ' completed' : '') }, [
          el('div', { class:'title' }, [document.createTextNode(m.title)]),
          el('div', { class:'muted' }, [document.createTextNode(m.description || '')]),
          el('div', { class:'progress-wrap' }, [
            el('div', { class:'progress-chip' }, [document.createTextNode(done ? 'Completed' : `Progress ${pct}%`)]),
            (function(){
              const bar = el('div', { class:'progress-bar' }, el('div', { style:`width:${pct}%` }));
              return bar;
            })()
          ]),
          el('div', {}, [
            el('button', { class:'btn primary' }, [document.createTextNode(done ? 'Review' : 'Begin')])
          ])
        ]);
        c.querySelector('button').addEventListener('click', () => startSlides(m));
        return c;
      })
    );

    const actions = el('div', { class:'training-actions' }, [
      el('button', { class:'btn ghost', id:'reset-session' }, [document.createTextNode('Reset Session')])
    ]);

    actions.querySelector('#reset-session').addEventListener('click', () => {
      if (!confirm('Reset selected modules & progress for this session?')) return;
      // Clear per-module local progress and session selection
      mods.forEach(m => localStorage.removeItem('training_progress::' + m.id));
      clearSession();
      renderManagerGate();
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
    const { idx, lastCheckpoint } = state;
    const slide = module.slides[idx];
    root.innerHTML = '';

    const homeBtn = el('button', { class:'btn ghost', id:'home-btn' }, [document.createTextNode('Home')]);
homeBtn.addEventListener('click', () => {
  const sess = getSession();
  if (sess?.selected?.length) return renderTraineeWelcome(sess.selected);
  // Fallback to module list if no session
  init(true);
});
const header = el('div', { class: 'training-header' }, [
  el('div', { class: 'training-title' }, [document.createTextNode(module.title)]),
  el('div', {}, [homeBtn])
]);

    const progress = ProgressBar(module.slides.length, idx+1);

    const body = el('div', { class: 'training-body' });
    const card = el('div', { class: 'training-card' });

    if (slide.type === 'content') {
      const listWrap = el('div', { class: 'list' });
      if (slide.imageUrl) {
        body.appendChild(el('img', { class: 'training-image', src: slide.imageUrl, alt: slide.title }));
      }
      body.appendChild(el('h3', {}, [document.createTextNode(slide.title)]));
      const content = el('div', { html: slide.bodyHtml || '' });
      listWrap.appendChild(content);
      body.appendChild(listWrap);
      card.appendChild(header);
      card.appendChild(progress);
      card.appendChild(body);
      const actions = el('div', { class: 'training-actions' }, [
        el('button', { class: 'btn ghost' }, [document.createTextNode('Back')]),
        el('button', { class: 'btn primary' }, [document.createTextNode(idx === module.slides.length -1 ? 'Finish' : 'Next')])
      ]);
      actions.children[0].addEventListener('click', ()=>{
        const prev = Math.max(0, idx-1);
        const newState = { idx: prev, lastCheckpoint };
        saveProgress(module.id, prev);
        renderSlide(module, newState);
      });
      actions.children[1].addEventListener('click', ()=>{
        const next = Math.min(module.slides.length-1, idx+1);
        const newState = { idx: next, lastCheckpoint };
        saveProgress(module.id, next);
        if (idx === module.slides.length - 1) return renderCompletion(module);
        renderSlide(module, newState);
      });
      card.appendChild(actions);
      root.appendChild(card);
    } else if (slide.type === 'quiz') {
      card.appendChild(header);
      card.appendChild(progress);
      const q = slide.question || { text:'', options:[] };
      body.appendChild(el('h3', {}, [document.createTextNode(slide.title)]));
      body.appendChild(el('div', { class: 'muted' }, [document.createTextNode(q.text || '')]));
      if (slide.imageUrl) body.appendChild(el('img', { class: 'training-image', src: slide.imageUrl, alt: slide.title }));
      const optsWrap = el('div', { class: 'training-grid' }, q.options.map(o => {
        const opt = el('div', { class: 'option' }, [document.createTextNode(o.text)]);
        opt.addEventListener('click', ()=>{
          // evaluate
          const isCorrect = !!o.isCorrect;
          if (isCorrect) {
            opt.classList.add('correct');
          } else {
            opt.classList.add('wrong');
          }
          setTimeout(()=>{
            if (isCorrect) {
              const next = Math.min(module.slides.length-1, idx+1);
              const newState = { idx: next, lastCheckpoint: next }; // set new checkpoint after a passed quiz
              saveProgress(module.id, next);
              if (idx === module.slides.length - 1) return renderCompletion(module);
              renderSlide(module, newState);
            } else {
              // go back to last checkpoint (section start)
              const back = lastCheckpoint;
              const newState = { idx: back, lastCheckpoint };
              saveProgress(module.id, back);
              renderSlide(module, newState);
            }
          }, 300);
        });
        return opt;
      }));
      body.appendChild(optsWrap);
      card.appendChild(body);
      const actions = el('div', { class: 'training-actions' }, [
        el('button', { class: 'btn ghost' }, [document.createTextNode('Back')])
      ]);
      actions.children[0].addEventListener('click', ()=>{
        const prev = Math.max(0, idx-1);
        const newState = { idx: prev, lastCheckpoint };
        saveProgress(module.id, prev);
        renderSlide(module, newState);
      });
      card.appendChild(actions);
      root.appendChild(card);
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
    // Determine the last checkpoint (first slide after the previous quiz)
    let lastCheckpoint = 0;
    const progress = loadProgress(mod.id);
    let idx = progress ? progress.idx : 0;
    if (idx > 0) {
      // Set checkpoint as first slide after the previous quiz before idx
      for (let i = 0, sectionStart = 0; i <= idx; i++) {
        if (mod.slides[i]?.type === 'quiz') sectionStart = i + 1;
        lastCheckpoint = sectionStart;
      }
    } else {
      lastCheckpoint = 0;
    }
    renderSlide(mod, { idx, lastCheckpoint });
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
