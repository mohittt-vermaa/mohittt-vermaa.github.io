// Hermes AI chat — real AI answers via an OpenAI-compatible API (FreeLLMAPI). No pre-loaded answers.
(function(){
  'use strict';
  // ===== Hermes AI — real answers from an AI API (OpenAI-compatible, e.g. FreeLLMAPI) =====
  // No pre-loaded answers. API keys live in the AI server / proxy — NEVER in this file,
  // because this file is public on the website. Endpoint/key/model can be changed from the
  // chat's Settings button; they are stored only in this browser (localStorage).
  const HERMES_SYSTEM = "You are Hermes, the friendly AI assistant on Mohit Verma's personal website (mohittt-vermaa.github.io). Mohit Verma is a Class 10 CBSE student and teen coder from Patna, India. He builds software, AI/ML tools and open-source projects: MLBox (an ML toolkit), ORF-5 (an OSINT framework), Class 10 Maths prep material, Jarvis-IG, and this very website. He is the author of the books 'AI is the Final Boss of 2077' and its sequel. His GitHub is github.com/mohittt-vermaa, Instagram @moverinn, LinkedIn linkedin.com/in/mohit-verma-a05570437. Answer questions about Mohit using these facts, and answer general questions helpfully too. Keep answers concise and clear. If you do not know something about Mohit, say so honestly instead of inventing details.";
  const aiCfg = {
    endpoint: localStorage.getItem('hermes_endpoint') || 'http://127.0.0.1:31415/v1',
    key: localStorage.getItem('hermes_key') || '',
    model: localStorage.getItem('hermes_model') || ''
  };
  let chatHistory = [];
  let knownModels = [];
  function aiHeaders(){ const h = {'Content-Type':'application/json'}; if(aiCfg.key) h['Authorization'] = 'Bearer ' + aiCfg.key; return h; }
  function aiBase(){ return aiCfg.endpoint.replace(/\/+$/,''); }
  async function discoverModels(){
    try{
      const r = await fetch(aiBase() + '/models', {headers: aiHeaders()});
      if(!r.ok) return false;
      const d = await r.json();
      const ids = (d.data || []).map(m => m.id).filter(Boolean);
      if(!ids.length) return false;
      knownModels = ids;
      if(typeof modelSel !== 'undefined' && modelSel){
        modelSel.innerHTML = '';
        ids.forEach(id => { const o = document.createElement('option'); o.value = id; o.textContent = id; modelSel.appendChild(o); });
        if(aiCfg.model && ids.includes(aiCfg.model)) modelSel.value = aiCfg.model;
        else { aiCfg.model = ids[0]; modelSel.value = ids[0]; }
      } else if(!aiCfg.model || !ids.includes(aiCfg.model)) aiCfg.model = ids[0];
      return true;
    }catch(e){ return false; }
  }
  async function askHermes(userText){
    chatHistory.push({role:'user', content:userText});
    try{
      if(knownModels.length && aiCfg.model && !knownModels.includes(aiCfg.model)) aiCfg.model = knownModels[0];
      const payload = {messages: [{role:'system', content:HERMES_SYSTEM}].concat(chatHistory.slice(-12)), stream:false};
      if(aiCfg.model) payload.model = aiCfg.model;
      const res = await fetch(aiBase() + '/chat/completions', {method:'POST', headers: aiHeaders(), body: JSON.stringify(payload)});
      if(!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const text = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if(!text) throw new Error('Empty reply');
      chatHistory.push({role:'assistant', content:text});
      return text;
    }catch(e){ chatHistory.pop(); throw e; }
  }

  // DOM creation - FIXED ORDER (no ReferenceError)
  const overlay = document.createElement('div');
  overlay.className = 'hc-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9997;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);opacity:0;pointer-events:none;transition:opacity .35s';

  const page = document.createElement('div');
  page.className = 'hc-page'; // sidebar closed by default per user request
  page.style.cssText = 'position:fixed;inset:0;z-index:9998;display:flex;flex-direction:column;background:#212121;transform:translateY(100%);transition:transform .45s cubic-bezier(.2,.8,.2,1);visibility:hidden';

  const stars = document.createElement('div');
  stars.className = 'hc-stars';
  stars.style.cssText = 'position:absolute;inset:0;z-index:1;opacity:1;pointer-events:none;background:transparent;overflow:hidden';

  // 5K stars canvas for Hermes chat background (only dark space stars as requested)
  const starCanvas = document.createElement('canvas');
  starCanvas.width = 800;
  starCanvas.height = 600;
  starCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stars.appendChild(starCanvas);
  // Draw 5K stars on canvas
  try{
    const ctx = starCanvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio||1, 2);
    function resizeHCStars(){
      starCanvas.width = stars.clientWidth * dpr;
      starCanvas.height = stars.clientHeight * dpr;
      ctx.fillStyle='#212121';
      ctx.fillRect(0,0,starCanvas.width,starCanvas.height);
      // 5K stars
      for(let i=0;i<5000;i++){
        const x=Math.random()*starCanvas.width;
        const y=Math.random()*starCanvas.height;
        const r=Math.random()<0.02 ? (1.5+Math.random()*1.5)*dpr : (0.5+Math.random()*0.8)*dpr;
        const alpha=0.5+Math.random()*0.5;
        ctx.globalAlpha=alpha;
        // color variation
        const colRand=Math.random();
        if(colRand<0.7) ctx.fillStyle='#ffffff';
        else if(colRand<0.85) ctx.fillStyle='#a78bfa';
        else if(colRand<0.95) ctx.fillStyle='#f9a8d4';
        else ctx.fillStyle='#8b5cf6';
        ctx.beginPath();
        ctx.arc(x,y,r,0,Math.PI*2);
        ctx.fill();
      }
      ctx.globalAlpha=1;
    }
    resizeHCStars();
    window.addEventListener('resize', resizeHCStars);
  }catch(e){ console.error('HC stars canvas error', e); }


  // Dashboard - defined BEFORE use
  const dash = document.createElement('div');
  dash.className = 'hc-dash';
  const pct = 87;
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const bars = [34,52,41,66,58,86,47].map(h => '<i style="height:'+h+'%;flex:1;border-radius:4px 4px 2px 2px;background:linear-gradient(180deg,#ececec,#5f5f5f);opacity:.9;min-height:8px;display:block"></i>').join('');
  const dayLbl = days.map(d => '<span style="flex:1;text-align:center;font-size:9.5px;color:#6b7280;text-transform:uppercase">'+d+'</span>').join('');
  dash.innerHTML =
    '<div class="hc-dash-grid">' +
      '<div class="hc-tile"><div class="t-label">Hermes Status<span>Live</span></div><div class="t-big">Online</div><div class="t-sub">Offline chat active — 50+ answers, fully in-browser.</div></div>' +
      '<div class="hc-tile"><div class="t-label">Website Efficiency</div><div class="hc-ring" style="--p:'+pct+'%"><b>'+pct+'%</b></div><div class="t-sub" style="text-align:center">Your device runs this site smoothly</div></div>' +
      '<div class="hc-tile"><div class="t-label">Projects<span>GitHub</span></div><div class="t-big">5+</div><div class="t-row"><div><b>mlbox</b><span>ML toolkit</span></div><div><b>ORF-5</b><span>OSINT</span></div></div></div>' +
      '<div class="hc-tile"><div class="t-label">Weekly Activity<span>This Week</span></div><div class="hc-bars" style="display:flex;gap:7px;align-items:flex-end;height:74px;margin-top:12px">'+bars+'</div><div class="hc-days" style="display:flex;gap:7px;margin-top:6px">'+dayLbl+'</div></div>' +
      '<div class="hc-tile"><div class="t-label">Tasks<span>Today</span></div><div class="hc-task done"><div class="tk">✓</div>Website updates<span class="st">Done</span></div><div class="hc-task done"><div class="tk">✓</div>Daily automation<span class="st">Done</span></div><div class="hc-task"><div class="tk"></div>Content drafts<span class="st">Pending</span></div></div>' +
      '<div class="hc-tile"><div class="t-label">Current Mode</div><div class="t-big" style="font-size:22px">Focus</div><div class="t-sub">Ask me anything — model switcher up top (Hermes 1 / Mini / Pro).</div></div>' +
    '</div>';

  const box = document.createElement('div');
  box.className = 'hc-box';
  box.style.cssText = 'position:relative;z-index:2;flex:1;display:flex;flex-direction:column;min-height:0';
  box.innerHTML =
    '<div class="hc-nav" style="position:relative;z-index:3;display:flex;align-items:center;gap:12px;padding:14px 20px;background:#212121;border-bottom:1px solid rgba(255,255,255,.08)">' +
      '<div class="hc-logo" style="display:flex;align-items:center;gap:10px;font-weight:700;font-size:15px;color:#e8eaf2"><div class="hc-ava" style="width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:#2f2f2f;color:#ececec;font-weight:700;border-radius:50%">H</div>Hermes</div>' +
      '<div class="hc-nav-right" style="margin-left:auto;display:flex;gap:8px;align-items:center">' +
        '<button class="hc-icon-btn" id="hcSidebarBtn" aria-label="Menu" title="Menu"><svg viewBox="0 0 24 24" width="17" height="17" stroke="currentColor" fill="none" stroke-width="2"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="14" y2="17"/></svg></button>' +
        '<button class="hc-icon-btn" id="hcCloseBtn" aria-label="Back to site" title="Back"><svg viewBox="0 0 24 24" width="17" height="17" stroke="currentColor" fill="none" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
      '</div>' +
    '</div>' +
    '<div style="display:flex;flex:1;min-height:0">' +
      '<aside class="hc-sidebar" id="hcSidebar" style="position:relative;z-index:3;width:250px;flex:0 0 250px;display:flex;flex-direction:column;gap:6px;padding:16px 12px;background:#171717;border-right:1px solid rgba(255,255,255,.06)">' +
        '<button class="hc-side-btn" id="hcNewChat" style="display:flex;align-items:center;gap:11px;padding:11px 14px;border-radius:13px;background:transparent;color:#c9cede;font-size:13.5px;cursor:pointer;width:100%"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>New Chat</button>' +
        '<button class="hc-side-btn" id="hcSearchBtn" style="display:flex;align-items:center;gap:11px;padding:11px 14px;border-radius:13px;background:transparent;color:#c9cede;font-size:13.5px;cursor:pointer;width:100%"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Search</button>' +
        '<div class="hc-side-label" style="font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:#6b7280;padding:12px 14px 4px">Recent</div>' +
        '<div id="hcRecent"></div>' +
        '<div style="margin-top:auto"></div>' +
        '<button class="hc-side-btn" id="hcSettings" style="display:flex;align-items:center;gap:11px;padding:11px 14px;border-radius:13px;background:transparent;color:#c9cede;font-size:13.5px;cursor:pointer;width:100%">⚙️ Settings</button>' +
      '</aside>' +
      '<main class="hc-main" style="position:relative;z-index:2;flex:1;display:flex;flex-direction:column;min-width:0">' +
        '<div class="hc-model-bar" style="display:flex;align-items:center;gap:10px;padding:9px 20px;border-bottom:1px solid rgba(255,255,255,.08);background:#212121"><select class="hc-model-select" id="hcModel" style="padding:8px 13px;border-radius:11px;border:1px solid rgba(255,255,255,.14);background:#2f2f2f;color:#ececec;font-size:12.5px"><option value="hermes-1">Hermes 1</option><option value="hermes-mini">Hermes Mini</option><option value="hermes-pro">Hermes Pro</option></select><span class="hc-model-tag" id="hcModelTag" style="display:none"></span><span id="hcStatus" style="display:none"></span></div>' +
        '<div class="hc-body" id="hcBody" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:18px;padding:26px max(22px,calc(50% - 384px))"><div class="hc-welcome" id="hcWelcome" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px 20px;min-height:52vh"><h1 style="font-size:clamp(26px,6vw,40px);font-weight:600;color:#ececec;margin:0 0 26px;letter-spacing:-.01em">Where should we begin?</h1><div class="hc-cards" id="hcCards" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;max-width:640px;width:100%"></div></div></div>' +
        '<div class="hc-composer-wrap" style="padding:10px 16px 18px;display:flex;justify-content:center"><div class="hc-composer" style="display:flex;align-items:center;gap:8px;width:100%;max-width:768px;padding:8px 10px 8px 16px;border-radius:26px;border:1px solid rgba(255,255,255,.14);background:#2f2f2f"><input id="hcInput" type="text" placeholder="Message Hermes…" autocomplete="off" maxlength="300" style="flex:1;min-width:0;padding:11px 6px;border:none;background:transparent;color:#e8eaf2;font-size:14.5px;outline:none"><button class="hc-send" id="hcSend" aria-label="Send" style="width:42px;height:42px;border-radius:50%;border:none;background:#ececec;color:#000;display:grid;place-items:center;cursor:pointer"><svg viewBox="0 0 24 24" width="17" height="17" stroke="#000" fill="none" stroke-width="2.2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" style="fill-opacity:.9"/></svg></button></div></div>' +
      '</main>' +
    '</div>';

  document.body.appendChild(overlay);
  document.body.appendChild(page);
  page.appendChild(stars);
  page.appendChild(box);

  const glitchEl = document.createElement('div');
  glitchEl.className = 'glitch-overlay';
  glitchEl.style.cssText = 'position:fixed;inset:0;z-index:10001;pointer-events:none;opacity:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,0.03) 0 2px,transparent 2px 4px);transition:opacity .2s';
  document.body.appendChild(glitchEl);

  // Append dash to body after box creation
  const hcBodyEl = box.querySelector('#hcBody');
  if(hcBodyEl){
    // Insert dash before welcome? Actually welcome is inside body, dash should be separate view
    hcBodyEl.appendChild(dash);
    dash.style.display = 'none';
  }

  // Elements
  const body = box.querySelector('#hcBody');
  const input = box.querySelector('#hcInput');
  const statusEl = box.querySelector('#hcStatus');
  const modelSel = box.querySelector('#hcModel');
  const modelTag = box.querySelector('#hcModelTag');
  const cardsEl = box.querySelector('#hcCards');
  const welcomeEl = box.querySelector('#hcWelcome');


  function setStatus(text, thinking){
    if(!statusEl) return;
    statusEl.textContent = text || '';
    statusEl.style.color = thinking ? '#ececec' : '#8e8e8e';
  }

  function addMsg(text, who){
    if(welcomeEl) welcomeEl.style.display = 'none';
    if(dash) dash.style.display = 'none';
    const m = document.createElement('div');
    m.className = 'hc-msg ' + who;
    m.style.cssText = who==='user' ? 'max-width:78%;padding:10px 16px;border-radius:24px;font-size:15px;line-height:1.7;white-space:pre-wrap;align-self:flex-end;background:#2f2f2f;color:#fff;animation:hc-in .3s ease' : 'max-width:100%;padding:4px 2px;font-size:15px;line-height:1.7;white-space:pre-wrap;align-self:stretch;background:transparent;border:none;color:#ececec;animation:hc-in .3s ease';
    m.textContent = text;
    body.appendChild(m);
    body.scrollTop = body.scrollHeight;
  }

  function showTyping(){
    const t = document.createElement('div');
    t.className = 'hc-typing';
    t.id = 'hcTyping';
    t.style.cssText = 'align-self:flex-start;display:flex;gap:4px;padding:13px 6px;background:transparent;border:none';
    t.innerHTML = '<span style="width:7px;height:7px;border-radius:50%;background:#b4b4b4;animation:hc-dot 1.2s infinite"></span><span style="width:7px;height:7px;border-radius:50%;background:#b4b4b4;animation:hc-dot 1.2s .15s infinite"></span><span style="width:7px;height:7px;border-radius:50%;background:#b4b4b4;animation:hc-dot 1.2s .3s infinite"></span>';
    body.appendChild(t);
    body.scrollTop = body.scrollHeight;
  }
  function hideTyping(){
    const t = document.getElementById('hcTyping');
    if(t) t.remove();
  }


  if(modelSel){
    modelSel.addEventListener('change', ()=>{
      if(knownModels.includes(modelSel.value)){ aiCfg.model = modelSel.value; localStorage.setItem('hermes_model', aiCfg.model); }
    });
  }

  let hcBusy = false;
  async function answer(raw){
    if(!raw || !raw.trim() || hcBusy) return;
    const trimmed = raw.trim();
    addMsg(trimmed, 'user');
    hcBusy = true;
    showTyping();
    try{
      if(!knownModels.length) await discoverModels();
      const reply = await askHermes(trimmed);
      hideTyping();
      addMsg(reply, 'bot');
    }catch(e){
      hideTyping();
      addMsg("⚠️ I can't reach the AI server right now. Hermes answers come from a real AI API — if you're Mohit, start the FreeLLMAPI server, or set the endpoint and key from the sidebar Settings. (Keys never live in this website's code.)", 'bot');
    }
    hcBusy = false;
  }


  // Suggestions
  const suggestions = [
    ["Who is Mohit Verma?","Teen coder from India — full intro"],
    ["What he learns?","Python, AI, ML, web dev & more"],
    ["Dashboard","Live status, efficiency, projects"],
    ["His projects","mlbox, ORF-5, this website"],
    ["The Earth & astronaut","How the 3D scene works"],
    ["Contact him","Socials, blog, LinkedIn, Instagram"],
  ];
  if(cardsEl){
    suggestions.forEach(([title, sub])=>{
      const c = document.createElement('button');
      c.className = 'hc-card';
      c.style.cssText = 'padding:14px 16px;border-radius:16px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.02);color:#ececec;font-size:13.5px;cursor:pointer;text-align:left;transition:.2s';
      c.textContent = title;
      c.addEventListener('click',()=>{
        trackRecent(title);
        if(title==='Dashboard'){
          if(welcomeEl) welcomeEl.style.display='none';
          if(dash) dash.style.display='block';
        }else{
          answer(title);
        }
      });
      cardsEl.appendChild(c);
    });
  }

  // Recent
  const recent = [];
  function trackRecent(q){
    const label = q.length>34 ? q.slice(0,34)+'…' : q;
    if(!recent.includes(label)){
      recent.unshift(label);
      if(recent.length>6) recent.pop();
      renderRecent();
    }
  }
  function renderRecent(){
    const el = document.getElementById('hcRecent');
    if(!el) return;
    el.innerHTML='';
    recent.forEach(r=>{
      const d=document.createElement('div');
      d.className='hc-recent';
      d.style.cssText='font-size:12.5px;color:#b4b4b4;padding:8px 14px;border-radius:10px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
      d.textContent=r;
      d.addEventListener('click',()=>{ if(input){ input.value=r; input.focus(); } });
      el.appendChild(d);
    });
  }

  function open(){
    overlay.style.opacity='1';
    overlay.style.pointerEvents='auto';
    page.style.transform='translateY(0)';
    page.style.visibility='visible';
    if(input) setTimeout(()=>input.focus(),400);
    discoverModels();
  }
  function close(){
    overlay.style.opacity='0';
    overlay.style.pointerEvents='none';
    page.style.transform='translateY(100%)';
    setTimeout(()=>{ page.style.visibility='hidden'; },450);
  }

  function resetChat(){
    if(body){
      // Keep welcome and dash, remove messages
      const msgs = body.querySelectorAll('.hc-msg, .hc-typing');
      msgs.forEach(m=>m.remove());
      if(welcomeEl) welcomeEl.style.display='flex';
      if(dash) dash.style.display='none';
      chatHistory = [];
    }
    if(input) input.value='';
  }

  // Events
  const newChatBtn = document.getElementById('hcNewChat');
  if(newChatBtn) newChatBtn.addEventListener('click', resetChat);

  const sidebarBtn = document.getElementById('hcSidebarBtn');
  if(sidebarBtn) sidebarBtn.addEventListener('click', ()=>{ page.classList.toggle('sidebar-open'); });

  const searchBtn = document.getElementById('hcSearchBtn');
  if(searchBtn) searchBtn.addEventListener('click', ()=>{ if(input) input.focus(); });

  const settingsBtn = document.getElementById('hcSettings');
  if(settingsBtn) settingsBtn.addEventListener('click', ()=>{
    const ep = prompt('Hermes AI endpoint (OpenAI-compatible base URL):', aiCfg.endpoint);
    if(ep === null) return;
    const ky = prompt('API key (kept only in this browser — never in the website code):', aiCfg.key);
    if(ky === null) return;
    const md = prompt('Model name (blank = auto-pick from the server):', aiCfg.model);
    if(md === null) return;
    aiCfg.endpoint = ep.trim() || aiCfg.endpoint;
    aiCfg.key = ky.trim();
    aiCfg.model = md.trim();
    localStorage.setItem('hermes_endpoint', aiCfg.endpoint);
    localStorage.setItem('hermes_key', aiCfg.key);
    localStorage.setItem('hermes_model', aiCfg.model);
    knownModels = [];
    discoverModels();
    addMsg('⚙️ Settings saved in this browser. Endpoint: ' + aiCfg.endpoint, 'bot');
  });

  const closeBtn = document.getElementById('hcCloseBtn');
  if(closeBtn) closeBtn.addEventListener('click', close);
  if(overlay) overlay.addEventListener('click', close);

  const sendBtn = document.getElementById('hcSend');
  if(sendBtn) sendBtn.addEventListener('click', ()=>{ const v=input.value; trackRecent(v); answer(v); input.value=''; });
  if(input) input.addEventListener('keydown', e=>{ if(e.key==='Enter'){ const v=input.value; trackRecent(v); answer(v); input.value=''; } });

  // Triggers - FIXED: support both mobile and desktop
  const triggers = document.querySelectorAll('#openHermesChat, [data-open-hermes]');
  triggers.forEach(t=>t.addEventListener('click', e=>{ e.preventDefault(); open(); }));

  // Also add global function for debugging
  window.openHermesChat = open;
  window.closeHermesChat = close;

  console.log('Hermes chat fixed and ready — triggers:', triggers.length);
})();
