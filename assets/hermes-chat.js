// Hermes AI chat — real AI answers via an OpenAI-compatible API (FreeLLMAPI). No pre-loaded answers.
(function(){
  'use strict';
  // ===== Hermes AI — real answers from an AI API (OpenAI-compatible, e.g. FreeLLMAPI) =====
  // No pre-loaded answers. API keys live in the AI server / proxy — NEVER in this file,
  // because this file is public on the website. Endpoint/key/model can be changed from the
  // chat's Settings button; they are stored only in this browser (localStorage).
  const HERMES_SYSTEM = "You are Hermes, the friendly AI assistant on Mohit Verma's personal website (mohittt-vermaa.github.io). Mohit Verma is a Class 10 CBSE student and teen coder from Patna, India. He builds software, AI/ML tools and open-source projects: MLBox (an ML toolkit), ORF-5 (an OSINT framework), Class 10 Maths prep material, Jarvis-IG, and this very website. He is the author of the books 'AI is the Final Boss of 2077' and its sequel. His GitHub is github.com/mohittt-vermaa, Instagram @moverinn, LinkedIn linkedin.com/in/mohit-verma-a05570437. Answer questions about Mohit using these facts, and answer general questions helpfully too. Keep answers concise and clear. If you do not know something about Mohit, say so honestly instead of inventing details. Only the facts in this prompt are true about Mohit - do not add skills, programming languages, tools, clubs, achievements or links that are not stated here.";
  if(localStorage.getItem('hermes_cfg_v') !== '39'){ localStorage.removeItem('hermes_endpoint'); localStorage.removeItem('hermes_key'); localStorage.setItem('hermes_cfg_v', '39'); }
  const aiCfg = {
    endpoint: localStorage.getItem('hermes_endpoint') || 'https://hermes-api.mohitkumar190031.workers.dev/v1',
    key: localStorage.getItem('hermes_key') || '',
    model: localStorage.getItem('hermes_model') || 'openai/gpt-oss-120b'
  };
  let chatHistory = [];
  function aiHeaders(){ const h = {'Content-Type':'application/json'}; if(aiCfg.key) h['Authorization'] = 'Bearer ' + aiCfg.key; return h; }
  function aiBase(){ return aiCfg.endpoint.replace(/\/+$/,''); }

  // ===== Your API key (BYOK): chat directly with a provider's models =====
  // The key lives ONLY in this browser (localStorage) and is sent straight
  // from the browser to the provider — never to the Hermes server or to Muse.
  const BYOK_PROVIDERS = {
    groq: { label: 'Groq', base: 'https://api.groq.com/openai/v1' },
    google: { label: 'Google (Gemini)', base: 'https://generativelanguage.googleapis.com/v1beta/openai' },
    nvidia: { label: 'NVIDIA', base: 'https://integrate.api.nvidia.com/v1' },
    huggingface: { label: 'Hugging Face', base: 'https://router.huggingface.co/v1' },
    custom: { label: 'Custom (OpenAI-compatible)', base: '' }
  };
  const BYOK_SKIP = /(embed|rerank|retriev|whisper|tts|guard|moderation|image-gen|audio)/i;
  function loadByok(){ try{ return JSON.parse(localStorage.getItem('hermes_byok_v1') || 'null') || null; }catch(e){ return null; } }
  let byok = loadByok(); // {provider, key, base, models:[{id}]}
  function saveByok(){ if(byok) localStorage.setItem('hermes_byok_v1', JSON.stringify(byok)); else localStorage.removeItem('hermes_byok_v1'); }
  function byokModel(id){ return !!(byok && byok.models && byok.models.some(m => m.id === id)); }
  function byokBase(){ return (byok && byok.base) || (byok && BYOK_PROVIDERS[byok.provider] && BYOK_PROVIDERS[byok.provider].base) || ''; }
  function chatModelIds(ids){
    return ids.map(id => String(id).replace(/^models\//, '')).filter(id => id && !BYOK_SKIP.test(id)).sort().slice(0, 200);
  }
  async function askHermes(userText){
    chatHistory.push({role:'user', content:userText});
    try{
      const sysContent = HERMES_SYSTEM + '\n\nYou are currently running as the AI model "' + aiCfg.model + '". If the user asks which model you are, answer with exactly that model name.';
      const t0 = performance.now();
      const payload = {messages: [{role:'system', content:sysContent}].concat(chatHistory.slice(-12)), stream:false};
      if(aiCfg.model) payload.model = aiCfg.model;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 45000);
      let res;
      // A "Your API" model talks straight to its provider with your own key.
      const custom = byok && byokModel(aiCfg.model);
      const base = custom ? byokBase().replace(/\/+$/,'') : aiBase();
      const headers = custom ? {'Content-Type':'application/json', 'Authorization':'Bearer ' + byok.key} : aiHeaders();
      try{ res = await fetch(base + '/chat/completions', {method:'POST', headers, body: JSON.stringify(payload), signal: ctrl.signal}); } finally { clearTimeout(timer); }
      if(!res.ok){ let msg = 'HTTP ' + res.status; try{ const ed = await res.json(); const m = ed && (ed.error && (ed.error.message || ed.error) || ed.message); if(m) msg += ' — ' + String(m).slice(0, 90); }catch(_){} throw new Error(msg); }
      const data = await res.json();
      const text = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if(!text) throw new Error('Empty reply');
      chatHistory.push({role:'assistant', content:text});
      return { text, usage: data.usage || null, ms: Math.round(performance.now() - t0), actual: data.model || null };
    }catch(e){ chatHistory.pop(); throw e; }
  }

  // DOM creation - FIXED ORDER (no ReferenceError)
  const overlay = document.createElement('div');
  overlay.className = 'hc-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9997;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);opacity:0;pointer-events:none;transition:opacity .35s';

  const page = document.createElement('div');
  page.className = 'hc-page'; // sidebar closed by default per user request
  page.style.cssText = 'position:fixed;inset:0;z-index:9998;display:flex;flex-direction:column;background:radial-gradient(1100px 750px at 85% -10%,rgba(88,60,180,.28),transparent 60%),radial-gradient(900px 650px at 8% 108%,rgba(16,78,160,.20),transparent 60%),linear-gradient(180deg,#04060f 0%,#070b1a 55%,#04060f 100%);transform:translateY(100%);transition:transform .45s cubic-bezier(.2,.8,.2,1);visibility:hidden';

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
      ctx.clearRect(0,0,starCanvas.width,starCanvas.height);
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



  const box = document.createElement('div');
  box.className = 'hc-box';
  box.style.cssText = 'position:relative;z-index:2;flex:1;display:flex;flex-direction:column;min-height:0';
  box.innerHTML =
    '<div class="hc-nav" style="position:relative;z-index:3;display:flex;align-items:center;gap:12px;padding:14px 20px;background:#171717;border-bottom:1px solid rgba(255,255,255,.08)">' +
      '<div class="hc-logo" style="display:flex;align-items:center;gap:10px;font-weight:700;font-size:15px;color:#e8eaf2"><div class="hc-ava" style="width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:#2f2f2f;color:#ececec;font-weight:700;border-radius:50%">H</div>Hermes</div>' +
      '<span id="hcClock" style="position:absolute;left:50%;transform:translateX(-50%);font-size:13.5px;font-weight:600;color:#9aa3b8;font-variant-numeric:tabular-nums;letter-spacing:.04em"></span>' +
      '<div class="hc-nav-right" style="margin-left:auto;display:flex;gap:8px;align-items:center">' +
        '<button class="hc-icon-btn" id="hcSidebarBtn" aria-label="Menu" title="Menu"><svg viewBox="0 0 24 24" width="17" height="17" stroke="currentColor" fill="none" stroke-width="2"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="14" y2="17"/></svg></button>' +
        '<button class="hc-icon-btn" id="hcMuteBtn" aria-label="Mute music" title="Mute music"><svg viewBox="0 0 24 24" width="17" height="17" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/><path class="hc-snd-waves" d="M15.5 8.5a5 5 0 0 1 0 7"/><path class="hc-snd-waves" d="M18.6 5.4a9 9 0 0 1 0 13.2"/><line class="hc-snd-slash" x1="16" y1="9" x2="22" y2="15" style="display:none"/><line class="hc-snd-slash" x1="22" y1="9" x2="16" y2="15" style="display:none"/></svg></button>' +
        '<button class="hc-icon-btn" id="hcSettingsBtn" aria-label="Settings" title="Settings"><svg viewBox="0 0 24 24" width="17" height="17" stroke="currentColor" fill="none" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>' +
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
      '</aside>' +
      '<main class="hc-main" style="position:relative;z-index:2;flex:1;display:flex;flex-direction:column;min-width:0">' +
         '<div class="hc-body" id="hcBody" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:18px;padding:26px max(22px,calc(50% - 384px))"></div>' +
        '<div class="hc-composer-wrap" style="padding:10px 16px 18px;display:flex;justify-content:center"><div class="hc-composer" style="display:flex;flex-direction:column;width:100%;max-width:768px;padding:8px 10px 6px 16px;border-radius:24px;border:1px solid rgba(129,140,248,.40);background:#262145"><div style="display:flex;align-items:center;gap:8px;width:100%"><input id="hcInput" type="text" placeholder="Message Hermes…" autocomplete="off" maxlength="4000" style="flex:1;min-width:0;padding:11px 6px;border:none;background:transparent;color:#e8eaf2;font-size:14.5px;outline:none"><button class="hc-send" id="hcSend" aria-label="Send" style="width:42px;height:42px;border-radius:50%;border:none;background:#ececec;color:#000;display:grid;place-items:center;cursor:pointer"><svg viewBox="0 0 24 24" width="17" height="17" stroke="#000" fill="none" stroke-width="2.2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" style="fill-opacity:.9"/></svg></button></div><div style="display:flex;justify-content:flex-end;width:100%;padding:2px 2px 0 0"><div class="hc-model-picker" style="position:relative"><button id="hcModelBtn" type="button" style="display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:9px;border:none;background:transparent;color:#9aa3b8;font-size:12.5px;font-weight:600;cursor:pointer"><span id="hcModelName">GPT-OSS 120B</span><span style="opacity:.55;font-size:9px">\u25BC</span></button><div id="hcModelMenu" style="display:none;position:absolute;bottom:calc(100% + 8px);right:0;min-width:258px;background:#262626;border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:6px;z-index:60;box-shadow:0 18px 50px rgba(0,0,0,.55)"></div></div></div></div></div>' +
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


  // Elements
  const body = box.querySelector('#hcBody');
  const input = box.querySelector('#hcInput');
  const statusEl = box.querySelector('#hcStatus');
  const cardsEl = box.querySelector('#hcCards');
  const welcomeEl = box.querySelector('#hcWelcome');
  let wmEl = null;


  function setStatus(text, thinking){
    if(!statusEl) return;
    statusEl.textContent = text || '';
    statusEl.style.color = thinking ? '#ececec' : '#8e8e8e';
  }

  function mdToHtml(md){
    let s = String(md).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const blocks = [];
    s = s.replace(/```(\w*)\n?([\s\S]*?)```/g, (m, lang, code) => { blocks.push('<pre class="hc-pre"><code>' + code.replace(/\n+$/,'') + '</code></pre>'); return '\u0001' + (blocks.length - 1) + '\u0001'; });
    const inline = t => t
      .replace(/`([^`]+)`/g, '<code class="hc-code">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^\*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/&lt;(https?:\/\/[^&\s]+)&gt;/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/&lt;br\s*\/?&gt;/g, '<br>');
    // Markdown tables -> real tables (models love answering profiles as tables)
    {
      const L = s.split('\n');
      const cells = ln => ln.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const out = [];
      for(let i = 0; i < L.length; i++){
        const isSep = L[i + 1] && /^\|?[\s:|-]+\|?$/.test(L[i + 1].trim()) && L[i + 1].includes('-');
        if(L[i].trim().startsWith('|') && isSep){
          const head = cells(L[i]);
          const rows = [];
          let j = i + 2;
          while(j < L.length && L[j].trim().startsWith('|')){ rows.push(cells(L[j])); j++; }
          let t = '<div class="hc-table-wrap"><table class="hc-table"><thead><tr>' + head.map(c => '<th>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>';
          rows.forEach(r => { t += '<tr>' + head.map((_, k) => '<td>' + inline(r[k] || '') + '</td>').join('') + '</tr>'; });
          t += '</tbody></table></div>';
          blocks.push(t);
          out.push('\u0001' + (blocks.length - 1) + '\u0001');
          i = j - 1;
          continue;
        }
        out.push(L[i]);
      }
      s = out.join('\n');
    }
    let html = '', inUl = false, inOl = false;
    const closeLists = () => { if(inUl){ html += '</ul>'; inUl = false; } if(inOl){ html += '</ol>'; inOl = false; } };
    for(const rawLine of s.split('\n')){
      const line = rawLine.replace(/\s+$/,'');
      const ph = line.match(/^\u0001(\d+)\u0001$/);
      if(ph){ closeLists(); html += blocks[+ph[1]]; continue; }
      if(/^\s*[-•]\s+/.test(line)){ if(inOl){ html += '</ol>'; inOl = false; } if(!inUl){ html += '<ul>'; inUl = true; } html += '<li>' + inline(line.replace(/^\s*[-•]\s+/,'')) + '</li>'; continue; }
      if(/^\s*\d+[.)]\s+/.test(line)){ if(inUl){ html += '</ul>'; inUl = false; } if(!inOl){ html += '<ol>'; inOl = true; } html += '<li>' + inline(line.replace(/^\s*\d+[.)]\s+/,'')) + '</li>'; continue; }
      closeLists();
      const h = line.match(/^(#{1,3})\s+(.*)/);
      if(h){ const lvl = h[1].length + 2; html += '<h' + lvl + '>' + inline(h[2]) + '</h' + lvl + '>'; continue; }
      if(!line.trim()) continue;
      html += '<p>' + inline(line) + '</p>';
    }
    closeLists();
    return html;
  }

  function copyText(text, btn){
    const done = () => { btn.textContent = '✓ Copied'; setTimeout(() => { btn.textContent = '⧉ Copy'; }, 1500); };
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(() => legacyCopy(text, done));
    else legacyCopy(text, done);
  }
  function legacyCopy(text, done){
    try{
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove(); done();
    }catch(e){ done(); }
  }
  function addMsg(text, who, model, usage, ms){
    if(welcomeEl) welcomeEl.style.display = 'none';
    if(wmEl) wmEl.style.display = 'none';
    const m = document.createElement('div');
    m.className = 'hc-msg ' + who;
    m.style.cssText = who==='user' ? 'max-width:78%;padding:10px 16px;border-radius:24px;font-size:15px;line-height:1.65;white-space:pre-wrap;align-self:flex-end;background:#2f2f2f;border:1px solid rgba(255,255,255,.10);color:#fff;animation:hc-in .3s ease' : 'max-width:100%;padding:14px 16px;border-radius:18px;font-size:15px;line-height:1.7;align-self:stretch;background:#2a2a2a;border:1px solid rgba(255,255,255,.09);color:#ececec;animation:hc-in .3s ease';
    if(who === 'bot'){
      m.innerHTML = mdToHtml(text);
      if(model){
        const f = document.createElement('div');
        f.className = 'hc-msg-foot';
        const cp = document.createElement('button');
        cp.type = 'button';
        cp.className = 'hc-copy-btn';
        cp.textContent = '\u29C9 Copy';
        cp.addEventListener('click', () => copyText(text, cp));
        const ml = document.createElement('span');
        let label = modelName(model);
        if(model && aiCfg && aiCfg.model && model !== aiCfg.model) label += ' \u00b7 fallback';
        if(usage && (usage.prompt_tokens != null || usage.completion_tokens != null)) label += ' \u00B7 ' + (usage.prompt_tokens || 0) + ' in \u00B7 ' + (usage.completion_tokens || 0) + ' out';
        if(ms) label += ' \u00B7 ' + (ms / 1000).toFixed(1) + 's';
        ml.textContent = label;
        f.appendChild(cp);
        f.appendChild(ml);
        m.appendChild(f);
      }
    } else {
      m.textContent = text;
      const cp = document.createElement('button');
      cp.type = 'button';
      cp.className = 'hc-copy-btn';
      cp.textContent = '⧉ Copy';
      cp.style.cssText = 'display:block;margin:8px 0 0 auto';
      cp.addEventListener('click', () => copyText(text, cp));
      m.appendChild(cp);
    }
    body.appendChild(m);
    persistMsg(who, text, model, usage, ms);
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


  const MODELS = [
    { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', desc: 'Groq \u00B7 fastest' },
    { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', desc: 'Google \u00B7 balanced' },
    { id: 'z-ai/glm-5.3-flash', name: 'GLM 5.3 Flash', desc: 'NVIDIA \u00B7 backup' }
  ];
  function modelName(id){ const f = MODELS.find(m => m.id === id); if(f) return f.name; if(byokModel(id)) return String(id).split('/').pop(); return id; }
  if(!MODELS.some(m => m.id === aiCfg.model) && !byokModel(aiCfg.model)){ aiCfg.model = MODELS[0].id; localStorage.setItem('hermes_model', aiCfg.model); }
  const modelBtn = box.querySelector('#hcModelBtn');
  const modelNameEl = box.querySelector('#hcModelName');
  const modelMenu = box.querySelector('#hcModelMenu');
  function renderModelMenu(){
    if(modelNameEl) modelNameEl.textContent = modelName(aiCfg.model);
    if(!modelMenu) return;
    modelMenu.innerHTML = '';
    MODELS.forEach(mo => {
      const b = document.createElement('button');
      b.type = 'button';
      b.style.cssText = 'display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:10px 12px;border:none;border-radius:10px;background:' + (mo.id === aiCfg.model ? 'rgba(255,255,255,.08)' : 'transparent') + ';color:#ececec;cursor:pointer';
      b.innerHTML = '<span style="flex:1"><span style="display:block;font-size:13.5px;font-weight:600">' + mo.name + '</span><span style="display:block;font-size:11.5px;color:#9aa3b8;margin-top:1px">' + mo.desc + '</span></span>' + (mo.id === aiCfg.model ? '<span style="color:#fff;font-size:13px">\u2713</span>' : '');
      b.addEventListener('click', () => {
        aiCfg.model = mo.id;
        localStorage.setItem('hermes_model', aiCfg.model);
        modelMenu.style.display = 'none';
        renderModelMenu();
      });
      modelMenu.appendChild(b);
    });
    // Your API models (from your own key, set in Settings)
    const sec = document.createElement('div');
    sec.style.cssText = 'padding:8px 12px 4px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9aa3b8';
    sec.textContent = byok && byok.models && byok.models.length ? 'Your API · ' + (BYOK_PROVIDERS[byok.provider] ? BYOK_PROVIDERS[byok.provider].label : byok.provider) : 'Your API';
    modelMenu.appendChild(sec);
    if(byok && byok.models && byok.models.length){
      byok.models.forEach(mo => {
        const b = document.createElement('button');
        b.type = 'button';
        b.style.cssText = 'display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:10px 12px;border:none;border-radius:10px;background:' + (mo.id === aiCfg.model ? 'rgba(255,255,255,.08)' : 'transparent') + ';color:#ececec;cursor:pointer';
        b.innerHTML = '<span style="flex:1"><span style="display:block;font-size:13.5px;font-weight:600">' + mo.id.split('/').pop() + '</span><span style="display:block;font-size:11.5px;color:#9aa3b8;margin-top:1px">' + (BYOK_PROVIDERS[byok.provider] ? BYOK_PROVIDERS[byok.provider].label : byok.provider) + ' · your key</span></span>' + (mo.id === aiCfg.model ? '<span style="color:#fff;font-size:13px">✓</span>' : '');
        b.addEventListener('click', () => {
          aiCfg.model = mo.id;
          localStorage.setItem('hermes_model', aiCfg.model);
          modelMenu.style.display = 'none';
          renderModelMenu();
        });
        modelMenu.appendChild(b);
      });
    } else {
      const hint = document.createElement('button');
      hint.type = 'button';
      hint.style.cssText = 'display:block;width:100%;text-align:left;padding:10px 12px;border:none;border-radius:10px;background:transparent;color:#9aa3b8;font-size:12.5px;cursor:pointer';
      hint.textContent = 'Add your own API key in Settings ⚙';
      hint.addEventListener('click', () => {
        modelMenu.style.display = 'none';
        const p = document.getElementById('hcSettingsPanel');
        if(p){ p.style.display = 'block'; loadUsage(); }
      });
      modelMenu.appendChild(hint);
    }
  }
  if(modelBtn && modelMenu){
    modelBtn.addEventListener('click', (e) => { e.stopPropagation(); modelMenu.style.display = modelMenu.style.display === 'none' ? 'block' : 'none'; });
    document.addEventListener('click', (e) => { if(modelMenu.style.display !== 'none' && !modelMenu.contains(e.target)) modelMenu.style.display = 'none'; });
  }
  renderModelMenu();

  const clockEl = box.querySelector('#hcClock');
  if(clockEl){ const tick = () => { clockEl.textContent = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'}); }; tick(); setInterval(tick, 1000); }

  // Settings panel: lifetime per-model usage (all visitors), from the Worker
  const hcSettingsPanel = document.createElement('div');
  hcSettingsPanel.id = 'hcSettingsPanel';
  hcSettingsPanel.style.cssText = 'display:none;position:absolute;top:64px;right:14px;width:min(320px,calc(100vw - 28px));max-height:calc(100vh - 90px);overflow-y:auto;background:#262626;border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:18px;z-index:70;box-shadow:0 18px 50px rgba(0,0,0,.55)';
  hcSettingsPanel.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px"><span style="font-size:15px;font-weight:700;color:#fff">Settings</span><button id="hcSettingsClose" type="button" style="background:none;border:none;color:#9aa3b8;font-size:18px;cursor:pointer;padding:2px 6px" aria-label="Close settings">✕</button></div>' +
    '<div style="font-size:12px;color:#9aa3b8;margin-bottom:12px">Lifetime usage — all visitors</div>' +
    '<div id="hcUsageRows" style="display:flex;flex-direction:column;gap:8px">' +
      '<div style="display:flex;justify-content:space-between;font-size:13.5px"><span style="color:#e8eaf2">GPT-OSS 120B</span><b id="hcUseGpt" style="color:#fff">—</b></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:13.5px"><span style="color:#e8eaf2">GLM 5.3 Flash</span><b id="hcUseGlm" style="color:#fff">—</b></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:13.5px"><span style="color:#e8eaf2">Gemini 3.6 Flash</span><b id="hcUseGem" style="color:#fff">—</b></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:13.5px;border-top:1px solid rgba(255,255,255,.1);padding-top:8px"><span style="color:#e8eaf2">Total replies</span><b id="hcUseTotal" style="color:#fff">—</b></div>' +
    '</div>' +
    '<div id="hcUsageNote" style="font-size:11.5px;color:#8e8e8e;margin-top:12px;line-height:1.5">Chats are saved only in this browser, on this device.</div>' +
    '<div style="border-top:1px solid rgba(255,255,255,.1);margin-top:16px;padding-top:14px">' +
      '<div style="font-size:13px;font-weight:700;color:#fff">Your API key</div>' +
      '<div style="font-size:11.5px;color:#9aa3b8;margin:3px 0 10px;line-height:1.5">Chat directly with any model from your own key. The key stays in this browser only — it is never sent to the Hermes server.</div>' +
      '<select id="hcByokProvider" style="width:100%;padding:9px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:#171717;color:#ececec;font-size:13px;outline:none">' +
        '<option value="groq">Groq</option><option value="google">Google (Gemini)</option><option value="nvidia">NVIDIA</option><option value="huggingface">Hugging Face</option><option value="custom">Custom (OpenAI-compatible)</option>' +
      '</select>' +
      '<div id="hcByokHint" style="font-size:11.5px;color:#c9a86a;margin-top:8px;line-height:1.5"></div>' +
      '<input id="hcByokBase" type="url" placeholder="Base URL, e.g. https://api.example.com/v1" style="display:none;width:100%;margin-top:8px;padding:9px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:#171717;color:#ececec;font-size:13px;outline:none">' +
      '<div style="display:flex;gap:6px;margin-top:8px"><input id="hcByokKey" type="password" placeholder="Paste API key…" autocomplete="off" style="flex:1;min-width:0;padding:9px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:#171717;color:#ececec;font-size:13px;outline:none"><button id="hcByokShow" type="button" style="padding:0 10px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:#171717;color:#9aa3b8;font-size:12px;cursor:pointer">Show</button></div>' +
      '<div style="display:flex;gap:8px;margin-top:10px"><button id="hcByokLoad" type="button" style="flex:1;padding:9px 10px;border-radius:10px;border:none;background:#ececec;color:#000;font-size:13px;font-weight:700;cursor:pointer">Load models</button><button id="hcByokRemove" type="button" style="padding:9px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:transparent;color:#ececec;font-size:13px;cursor:pointer">Remove</button></div>' +
      '<div id="hcByokStatus" style="font-size:11.5px;color:#9aa3b8;margin-top:8px;line-height:1.5"></div>' +
    '</div>';
  page.appendChild(hcSettingsPanel);
  async function loadUsage(){
    const set = (id, v) => { const el = document.getElementById(id); if(el) el.textContent = v; };
    try{
      const r = await fetch((aiCfg.endpoint || '').replace(/\/$/, '') + '/usage', { headers: aiCfg.key ? { Authorization: 'Bearer ' + aiCfg.key } : {} });
      if(!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      const m = d.models || {};
      const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('en-IN') : '—');
      set('hcUseGpt', fmt(m['openai/gpt-oss-120b']));
      set('hcUseGlm', fmt(m['z-ai/glm-5.3-flash']));
      set('hcUseGem', fmt(m['gemini-3.6-flash']));
      set('hcUseTotal', fmt(d.total));
      const note = document.getElementById('hcUsageNote');
      if(note && d.note) note.textContent = d.note;
    }catch(e){
      set('hcUseGpt', '—'); set('hcUseGlm', '—'); set('hcUseGem', '—'); set('hcUseTotal', '—');
      const note = document.getElementById('hcUsageNote');
      if(note) note.textContent = 'Usage counts appear after the next Hermes server update.';
    }
  }
  const hcSettingsBtn = document.getElementById('hcSettingsBtn');
  if(hcSettingsBtn) hcSettingsBtn.addEventListener('click', () => {
    const open = hcSettingsPanel.style.display === 'block';
    hcSettingsPanel.style.display = open ? 'none' : 'block';
    if(!open) loadUsage();
  });
  const hcSettingsClose = document.getElementById('hcSettingsClose');
  if(hcSettingsClose) hcSettingsClose.addEventListener('click', () => { hcSettingsPanel.style.display = 'none'; });

  // Music mute toggle (the site's background music, controlled from the Hermes nav)
  const hcMuteBtn = document.getElementById('hcMuteBtn');
  function paintMute(){
    if(!hcMuteBtn) return;
    const au = document.getElementById('bgMusic');
    const m = !!(au && au.muted);
    hcMuteBtn.querySelectorAll('.hc-snd-waves').forEach(p=>{ p.style.display = m ? 'none' : ''; });
    hcMuteBtn.querySelectorAll('.hc-snd-slash').forEach(p=>{ p.style.display = m ? '' : 'none'; });
    hcMuteBtn.title = m ? 'Unmute music' : 'Mute music';
    hcMuteBtn.setAttribute('aria-label', hcMuteBtn.title);
    hcMuteBtn.style.opacity = m ? .55 : 1;
  }
  if(hcMuteBtn) hcMuteBtn.addEventListener('click', () => {
    const au = document.getElementById('bgMusic');
    if(!au) return;
    au.muted = !au.muted;
    paintMute();
  });
  paintMute();

  // Your API key (BYOK) wiring
  const byokProviderEl = document.getElementById('hcByokProvider');
  const byokBaseEl = document.getElementById('hcByokBase');
  const byokKeyEl = document.getElementById('hcByokKey');
  const byokShowEl = document.getElementById('hcByokShow');
  const byokLoadEl = document.getElementById('hcByokLoad');
  const byokRemoveEl = document.getElementById('hcByokRemove');
  const byokStatusEl = document.getElementById('hcByokStatus');
  function byokStatus(t){ if(byokStatusEl) byokStatusEl.textContent = t; }
  function byokHint(){
    const h = document.getElementById('hcByokHint');
    if(!h) return;
    const p = byokProviderEl ? byokProviderEl.value : 'groq';
    h.textContent = p === 'nvidia'
      ? 'NVIDIA blocks direct browser requests, so its models cannot load here. Your key is fine — use the built-in models, or Groq / Google with your own key.'
      : (p === 'huggingface' ? 'Hugging Face chat needs paid credits on your account — the free allowance runs out fast.' : '');
  }
  function byokFill(){
    if(byokProviderEl) byokProviderEl.value = (byok && byok.provider) || 'groq';
    if(byokBaseEl){ byokBaseEl.style.display = byokProviderEl && byokProviderEl.value === 'custom' ? 'block' : 'none'; byokBaseEl.value = (byok && byok.base) || ''; }
    if(byokKeyEl) byokKeyEl.value = (byok && byok.key) || '';
    byokStatus(byok && byok.models && byok.models.length ? byok.models.length + ' models loaded — pick one from the model menu below the chat box.' : '');
    byokHint();
  }
  if(byokProviderEl) byokProviderEl.addEventListener('change', () => { if(byokBaseEl) byokBaseEl.style.display = byokProviderEl.value === 'custom' ? 'block' : 'none'; byokHint(); });
  if(byokShowEl && byokKeyEl) byokShowEl.addEventListener('click', () => {
    const show = byokKeyEl.type === 'password';
    byokKeyEl.type = show ? 'text' : 'password';
    byokShowEl.textContent = show ? 'Hide' : 'Show';
  });
  if(byokLoadEl) byokLoadEl.addEventListener('click', async () => {
    const provider = byokProviderEl ? byokProviderEl.value : 'groq';
    const key = byokKeyEl ? byokKeyEl.value.trim() : '';
    const base = provider === 'custom' ? (byokBaseEl ? byokBaseEl.value.trim().replace(/\/+$/,'') : '') : BYOK_PROVIDERS[provider].base;
    if(!key){ byokStatus('Paste your API key first.'); return; }
    if(!base){ byokStatus('Enter the base URL for the custom endpoint.'); return; }
    byokStatus('Loading models…');
    try{
      const r = await fetch(base + '/models', { headers: { 'Authorization': 'Bearer ' + key } });
      if(!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      const ids = chatModelIds((d.data || []).map(m => m.id));
      if(!ids.length){ byokStatus('No chat models found for this key.'); return; }
      byok = { provider, key, base, models: ids.map(id => ({ id })) };
      saveByok();
      byokStatus(ids.length + ' models loaded — pick one from the model menu below the chat box.');
      renderModelMenu();
    }catch(e){
      const m = String(e.message || e);
      byokStatus(m.indexOf('Failed to fetch') !== -1 && provider === 'nvidia'
        ? 'NVIDIA blocks direct browser requests, so models cannot load here. Your key is fine — use the built-in models, or Groq / Google with your own key.'
        : 'Could not load models (' + m.slice(0, 60) + '). Check the key and try again.');
    }
  });
  if(byokRemoveEl) byokRemoveEl.addEventListener('click', () => {
    const wasCustom = byokModel(aiCfg.model);
    byok = null; saveByok();
    if(wasCustom){ aiCfg.model = MODELS[0].id; localStorage.setItem('hermes_model', aiCfg.model); }
    byokFill(); renderModelMenu();
    byokStatus('Key removed.');
  });
  byokFill();

  // Giant HERMES wordmark behind every empty (new) chat, OpenCode-style
  const hcMain = box.querySelector('.hc-main');
  if(hcMain){
    wmEl = document.createElement('div');
    wmEl.id = 'hcWatermark';
    wmEl.setAttribute('aria-hidden', 'true');
    wmEl.textContent = 'HERMES';
    wmEl.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding-bottom:12vh;pointer-events:none;user-select:none;z-index:0;font-family:"Courier New",monospace;font-weight:900;letter-spacing:.04em;text-transform:uppercase;font-size:clamp(64px,13vw,168px);color:rgba(255,255,255,.05)';
    hcMain.appendChild(wmEl);
    if(body){ body.style.position = 'relative'; body.style.zIndex = '1'; }
  }

  let hcBusy = false;
  async function answer(raw){
    if(!raw || !raw.trim() || hcBusy) return;
    const trimmed = raw.trim();
    addMsg(trimmed, 'user');
    hcBusy = true;
    showTyping();
    try{
      const usedModel = aiCfg.model;
      const r = await askHermes(trimmed);
      hideTyping();
      addMsg(r.text, 'bot', r.actual || usedModel, r.usage, r.ms);
    }catch(e){
      hideTyping();
      const custom = byok && byokModel(aiCfg.model);
      addMsg(custom
        ? "⚠️ Your API key call failed (" + String(e.message || e).slice(0, 60) + "). Check the key in Settings, or pick another model."
        : "⚠️ I can't reach the AI server right now. Hermes answers come from a real AI API — if you're Mohit, start the FreeLLMAPI server, or set the endpoint and key from the sidebar Settings. (Keys never live in this website's code.)", 'bot');
    }
    hcBusy = false;
  }


  // Suggestions
  const suggestions = [
    ["Who is Mohit Verma?","Teen coder from India — full intro"],
    ["What he learns?","Python, AI, ML, web dev & more"],
    ["His projects","mlbox, ORF-5, this website"],
    ["His books","AI is the Final Boss of 2077"],
    ["Contact him","Socials, blog, LinkedIn, Instagram"],
  ];
  if(cardsEl){
    suggestions.forEach(([title, sub])=>{
      const c = document.createElement('button');
      c.className = 'hc-card';
      c.style.cssText = 'padding:9px 15px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:#2f2f2f;color:#ececec;font-size:12.5px;cursor:pointer;transition:.2s';
      c.textContent = title;
      c.addEventListener('click',()=>{
        answer(title);
      });
      cardsEl.appendChild(c);
    });
  }

  // ===== Chat sessions — saved in this browser; sidebar Recent reopens them =====
  let hcChats = [];
  try{ hcChats = JSON.parse(localStorage.getItem('hermes_chats_v1') || '[]'); }catch(e){ hcChats = []; }
  let currentChatId = null;
  let loadingChat = false;
  function saveChats(){ try{ localStorage.setItem('hermes_chats_v1', JSON.stringify(hcChats.slice(0, 20))); }catch(e){} }
  function persistMsg(who, text, model, usage, ms){
    if(loadingChat) return;
    let chat = hcChats.find(c => c.id === currentChatId);
    if(!chat){
      if(who !== 'user') return;
      chat = { id: 'c' + Date.now(), title: text.length > 34 ? text.slice(0, 34) + '…' : text, msgs: [] };
      hcChats.unshift(chat);
      currentChatId = chat.id;
    }
    const entry = { who, text };
    if(model) entry.model = model;
    if(usage) entry.usage = usage;
    if(ms) entry.ms = ms;
    chat.msgs.push(entry);
    if(chat.msgs.length > 100) chat.msgs = chat.msgs.slice(-100);
    const i = hcChats.indexOf(chat);
    if(i > 0){ hcChats.splice(i, 1); hcChats.unshift(chat); }
    saveChats();
    renderRecent();
  }
  function renderRecent(){
    const el = document.getElementById('hcRecent');
    if(!el) return;
    el.innerHTML = '';
    hcChats.forEach(chat => {
      const active = chat.id === currentChatId;
      const d = document.createElement('div');
      d.className = 'hc-recent';
      d.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:12.5px;color:' + (active ? '#fff' : '#b4b4b4') + ';background:' + (active ? 'rgba(255,255,255,.09)' : 'transparent') + ';padding:8px 10px 8px 14px;border-radius:10px;cursor:pointer;margin-bottom:2px';
      const t = document.createElement('span');
      t.style.cssText = 'flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
      t.textContent = chat.title;
      t.addEventListener('click', () => loadChat(chat.id));
      const x = document.createElement('button');
      x.title = 'Delete chat';
      x.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';
      x.style.cssText = 'background:none;border:none;color:#b4b4b4;cursor:pointer;padding:6px;border-radius:8px;flex:0 0 auto;display:grid;place-items:center';
      x.addEventListener('click', (e) => { e.stopPropagation(); deleteChat(chat.id); });
      d.appendChild(t);
      d.appendChild(x);
      el.appendChild(d);
    });
    if(hcChats.length){
      const clr = document.createElement('button');
      clr.textContent = 'Clear all chats';
      clr.style.cssText = 'background:none;border:none;color:#8e8e8e;cursor:pointer;font-size:11.5px;padding:8px 14px;text-align:left;width:100%';
      clr.addEventListener('click', () => { hcChats = []; saveChats(); resetChat(); renderRecent(); });
      el.appendChild(clr);
    }
  }
  function loadChat(id){
    const chat = hcChats.find(c => c.id === id);
    if(!chat) return;
    currentChatId = id;
    chatHistory = chat.msgs.map(m => ({ role: m.who === 'user' ? 'user' : 'assistant', content: m.text }));
    if(body){
      body.querySelectorAll('.hc-msg, .hc-typing').forEach(m => m.remove());
      if(welcomeEl) welcomeEl.style.display = 'none';
      if(wmEl) wmEl.style.display = 'none';
      loadingChat = true;
      chat.msgs.forEach(m => addMsg(m.text, m.who, m.model, m.usage, m.ms));
      loadingChat = false;
      body.scrollTop = body.scrollHeight;
    }
    page.classList.remove('sidebar-open');
    renderRecent();
  }
  function deleteChat(id){
    hcChats = hcChats.filter(c => c.id !== id);
    saveChats();
    if(id === currentChatId) resetChat();
    renderRecent();
  }
  renderRecent();

  function open(){
    overlay.style.opacity='1';
    overlay.style.pointerEvents='auto';
    page.style.transform='translateY(0)';
    page.style.visibility='visible';
    if(input) setTimeout(()=>input.focus(),400);
  }
  function close(){
    overlay.style.opacity='0';
    overlay.style.pointerEvents='none';
    page.style.transform='translateY(100%)';
    setTimeout(()=>{ page.style.visibility='hidden'; },450);
  }

  function resetChat(){
    if(body){
      // Keep the welcome screen, remove messages
      const msgs = body.querySelectorAll('.hc-msg, .hc-typing');
      msgs.forEach(m=>m.remove());
      if(welcomeEl) welcomeEl.style.display='flex';
      if(wmEl) wmEl.style.display='flex';
      chatHistory = [];
      currentChatId = null;
      page.classList.remove('sidebar-open');
      renderRecent();
    }
    if(input){ input.value=''; setTimeout(()=>input.focus(), 60); }
  }

  // Events
  const newChatBtn = document.getElementById('hcNewChat');
  if(newChatBtn) newChatBtn.addEventListener('click', resetChat);

  const sidebarBtn = document.getElementById('hcSidebarBtn');
  if(sidebarBtn) sidebarBtn.addEventListener('click', ()=>{ page.classList.toggle('sidebar-open'); });

  const searchBtn = document.getElementById('hcSearchBtn');
  if(searchBtn) searchBtn.addEventListener('click', ()=>{ if(input) input.focus(); });


  const closeBtn = document.getElementById('hcCloseBtn');
  if(closeBtn) closeBtn.addEventListener('click', close);
  if(overlay) overlay.addEventListener('click', close);

  const sendBtn = document.getElementById('hcSend');
  if(sendBtn) sendBtn.addEventListener('click', ()=>{ const v=input.value; answer(v); input.value=''; });
  if(input) input.addEventListener('keydown', e=>{ if(e.key==='Enter'){ const v=input.value; answer(v); input.value=''; } });

  // Triggers - FIXED: support both mobile and desktop
  // Mobile Hermes "H" button: injected here so it appears even when the
  // cached index.html is older than this JS (JS is versioned, HTML is not).
  // Also strips the music-wave pill border here, same reason.
  (function(){
    const wave = document.getElementById('musicWave');
    if(wave){ wave.style.background = 'transparent'; wave.style.border = 'none'; wave.style.boxShadow = 'none'; }
    if(!wave || document.querySelector('.hermes-nav-btn')) return;
    const st = document.createElement('style');
    st.textContent = '.hermes-nav-btn{display:none}@media(max-width:900px){.hermes-nav-btn{display:grid;place-items:center;width:34px;height:34px;flex:0 0 auto;border-radius:50%;background:#171717;border:1px solid rgba(255,255,255,.22);color:#fff;font-weight:800;font-size:15px;text-decoration:none}#musicWave{max-width:200px;min-width:0;margin:0 8px}}';
    document.head.appendChild(st);
    const a = document.createElement('a');
    a.href = '#'; a.className = 'hermes-nav-btn';
    a.setAttribute('data-open-hermes', '');
    a.setAttribute('aria-label', 'Open Hermes chat'); a.title = 'Hermes';
    a.textContent = 'H';
    wave.insertAdjacentElement('afterend', a);
  })();
  const triggers = document.querySelectorAll('#openHermesChat, [data-open-hermes]');
  triggers.forEach(t=>t.addEventListener('click', e=>{ e.preventDefault(); open(); }));

  // Also add global function for debugging
  window.openHermesChat = open;
  window.closeHermesChat = close;

  console.log('Hermes chat fixed and ready — triggers:', triggers.length);
})();
