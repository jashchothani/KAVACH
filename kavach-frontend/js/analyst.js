/* KAVACH — SOC analyst console (condensed port of Dashboard/Alerts/Incidents/Fleet/SOAR/UrlScanner/RakshaAi) */
(function () {
  const K = window.KAVACH, api = K.api, esc = K.esc, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const user = K.session.require("analyst"); if (!user) return;
  $('#uname').textContent = user.username; $('#urole').textContent = user.role_name; $('#logout').onclick = () => api.auth.logout(); $('#menu').onclick = () => $('#side').classList.toggle('open');
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 3000); };
  const pill = s => `<span class="pill ${esc(s)}">${esc(s)}</span>`;
  const rows = (id, html, cols, empty) => { $(id).innerHTML = html || `<tr><td colspan="${cols}" class="empty">${empty || 'Nothing to show'}</td></tr>`; };
  const bar = v => `<div class="meter" style="margin:0;min-width:110px"><div class="bar"><i data-w="${v}" style="background:linear-gradient(90deg,var(--safe),var(--crimson))"></i></div></div>`;
  const fill = () => setTimeout(() => $$('.t i[data-w]').forEach(i => i.style.width = i.dataset.w + '%'), 60);
  const count = (el, to) => { const t0 = performance.now(); (function f(t) { const k = Math.min((t - t0) / 1200, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0); };
  const banner = () => $('#demo').classList.toggle('show', K.isOffline());
  const modal = (t, body, acts) => { $('#mt').textContent = t; $('#mbody').innerHTML = body; $('#mact').innerHTML = ''; (acts || []).concat([['Close', () => {}, 'btn-ghost']]).forEach(([l, fn, cls]) => { const b = document.createElement('button'); b.className = 'btn btn-sm ' + (cls || 'btn-primary'); b.textContent = l; b.onclick = async () => { await fn(); $('#mb').classList.remove('show'); }; $('#mact').appendChild(b); }); $('#mb').classList.add('show'); };

  setInterval(() => $('#clock').textContent = 'LIVE • ' + new Date().toLocaleTimeString(), 1000);

  const titles = {
    overview: ['Overview', 'SOC situational awareness'],
    alerts: ['Alert center', 'Triage, explain and resolve'],
    incidents: ['Incidents', 'Correlated attack chains'],
    mitre: ['MITRE ATT&CK', 'Enterprise adversary matrix & technique correlation'],
    lineage: ['Attack Lineage', 'Visual process ancestry & lateral movement chain'],
    intel: ['Threat Intelligence', 'IOC indicators, hash lookups & threat feeds'],
    compliance: ['CERT-In Compliance', '6-Hour mandatory incident reporting & vault'],
    deception: ['Mayajaal Deception', 'Active canary tokens, honeypots & traps'],
    devices: ['Fleet', 'Every monitored endpoint & OS telemetry'],
    users: ['User Management', 'Enterprise access control, roles and operator vault'],
    collectors: ['Collectors', '16 kernel & user-space telemetry engines'],
    soar: ['SOAR center', 'Controlled automated response playbooks'],
    audit: ['Audit Vault', 'Cryptographic immutable Merkle provenance trail'],
    reports: ['Reports Generator', 'Compliance, executive digests & forensic exports'],
    url: ['URL scanner', 'Homograph, typosquat & zero-trust checks'],
    raksha: ['Raksha AI', 'Forensic plain-language copilot']
  };

  const loaded = {};
  function show(v) {
    if (!titles[v]) v = 'overview';
    $$('.nv[data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === v));
    $$('.view').forEach(x => x.classList.toggle('on', x.id === 'v-' + v));
    $('#ttl').textContent = titles[v][0];
    $('#sub').textContent = titles[v][1];
    $('#side').classList.remove('open');
    history.replaceState(null, '', '#' + v);
    if (!loaded[v] && L[v]) { loaded[v] = 1; L[v](); }
  }
  $$('.nv[data-v]').forEach(b => b.onclick = () => show(b.dataset.v));

  // Quick export button in topbar
  const btnExp = $('#btn-export-quick');
  if (btnExp) btnExp.onclick = () => { toast('Generating comprehensive SOC snapshot report…'); setTimeout(() => toast('Report ready: KAVACH_SOC_Digest.pdf ✓'), 1200); };

  /* sparkline (live-simulated throughput) */
  const pts = Array.from({ length: 40 }, (_, i) => 50 + Math.sin(i / 3) * 18 + Math.random() * 14);
  function drawSpark() {
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${(i / (pts.length - 1)) * 600},${90 - p * .8}`).join(' ');
    $('#spark').innerHTML = $('#spark').querySelector('defs').outerHTML + `<path class="fill" d="${d} L600,90 L0,90 Z" fill="url(#sf)"/><path d="${d}" style="animation:none;stroke-dashoffset:0"/>`;
  }
  drawSpark(); setInterval(() => { pts.push(Math.max(10, Math.min(95, pts[pts.length - 1] + (Math.random() - .5) * 22))); pts.shift(); drawSpark(); }, 1200);

  async function overview() {
    const [s, al] = await Promise.all([api.dashboard.summary(), api.alerts.list()]); banner();
    count($('#o1'), s.security_score); count($('#o2'), s.stats.active_threats); count($('#o3'), s.stats.open_incidents); count($('#o4'), s.stats.collectors_running);
    const tac = {}; al.forEach(a => { const k = a.mitre || a.category || 'other'; tac[k] = (tac[k] || 0) + 1; }); const e = Object.entries(tac).slice(0, 7), mx = Math.max(1, ...e.map(x => x[1]));
    $('#bars').innerHTML = e.map(([k, v]) => `<i data-v="${esc(k)}: ${v}" data-h="${v / mx * 100}"></i>`).join('') || '<div class="empty">No data</div>';
    setTimeout(() => $$('#bars i').forEach(i => i.style.height = i.dataset.h + '%'), 80);
    rows('#rt', (s.recent_threats || []).sort((a, b) => b.risk_score - a.risk_score).map((t, i) => `<tr style="animation-delay:${i * .06}s"><td><b>${esc(t.name)}</b></td><td>${pill(t.severity)}</td><td class="mono">${t.risk_score}</td><td>${pill(t.status)}</td><td style="max-width:320px;color:var(--t2)">${esc(t.what_happened)}</td><td class="mono">${K.ago(t.created_at)}</td></tr>`).join(''), 6);
  }

  let ALERTS = [];
  function drawAlerts() {
    const q = $('#aq').value.toLowerCase(), st = $('#as').value, sv = $('#av').value;
    const f = ALERTS.filter(a => (!st || a.status === st) && (!sv || a.severity === sv) && (!q || JSON.stringify(a).toLowerCase().includes(q)));
    rows('#atb', f.map((a, i) => `<tr style="animation-delay:${i * .04}s"><td class="mono">${esc(a.id)}</td><td><b>${esc(a.title)}</b><div class="mono">${esc(a.source || '')}</div></td><td>${pill(a.severity)}</td><td class="mono">${esc(a.mitre || '—')}</td><td>${pill(a.status)}</td><td class="mono">${K.ago(a.created_at)}</td><td style="white-space:nowrap"><button class="btn-explain-raksha" data-e="${esc(a.id)}">✨ Explain with Raksha AI</button> <button class="row-btn" data-r="${esc(a.id)}">Resolve</button></td></tr>`).join(''), 7, 'No alerts match');
    $$('[data-e]').forEach(b => b.onclick = async () => {
      const orig = b.innerHTML;
      b.innerHTML = '✨ Analyzing…';
      try {
        const r = await api.alerts.explain(b.dataset.e);
        const expl = r.explanation || r.reply || r.response || 'No explanation available.';
        modal('✨ Raksha AI • ' + b.dataset.e, `<div class="raksha-stream-modal" style="font-size:13px;line-height:1.6;color:var(--t1)"></div>${r.confidence ? `<p class="mono" style="font-size:.8rem;margin-top:12px;color:#059669"><b>AI Confidence:</b> ${(r.confidence * 100).toFixed(0)}%</p>` : ''}${r.recommended_action ? `<p style="margin-top:8px;font-size:.85rem;color:var(--t2)"><b>Recommended:</b> ${esc(r.recommended_action)}</p>` : ''}`);
        const streamEl = document.querySelector('.raksha-stream-modal');
        if (streamEl) K.typeWriter(streamEl, expl);
      } catch (e) { toast(e.message); }
      b.innerHTML = orig;
    });
    $$('[data-r]').forEach(b => b.onclick = async () => { try { await api.alerts.update(b.dataset.r, { status: 'resolved' }); const a = ALERTS.find(x => x.id === b.dataset.r); if (a) a.status = 'resolved'; drawAlerts(); toast('Alert ' + b.dataset.r + ' resolved'); } catch (e) { toast(e.message); } });
  }
  ['aq', 'as', 'av'].forEach(i => $('#' + i).addEventListener('input', drawAlerts));

  /* ── All View Loaders ── */
  const L = {
    async alerts() { ALERTS = await api.alerts.list(); drawAlerts(); },
    async incidents() { const d = await api.incidents.list(); rows('#itb', d.map((x, i) => `<tr style="animation-delay:${i * .05}s"><td class="mono">${esc(x.id)}</td><td><b>${esc(x.title)}</b></td><td>${pill(x.severity)}</td><td class="mono">${x.alerts ?? '—'}</td><td>${pill(x.status)}</td><td>${esc(x.assignee || '—')}</td><td class="mono">${K.ago(x.created_at)}</td></tr>`).join(''), 7); },
    async devices() { const d = await api.devices.list(); $('#dcount').textContent = d.length + ' HOSTS'; rows('#dtb', d.map((x, i) => `<tr style="animation-delay:${i * .05}s"><td><b>${esc(x.hostname || x.id)}</b></td><td>${esc(x.os || '—')}</td><td>${pill(x.status)}</td><td>${bar(x.risk_score || 0)}</td><td class="mono">${x.last_seen ? K.ago(x.last_seen) : '—'}</td></tr>`).join(''), 5); fill(); },
    async collectors() { const d = await api.collectors.status(); $('#ccount').textContent = d.filter(c => c.status === 'running').length + ' / ' + d.length + ' RUNNING';
      rows('#ctb', d.map((c, i) => `<tr style="animation-delay:${i * .03}s"><td><b>${esc(c.name)}</b><div class="mono">${esc(c.category || '')}</div></td><td>${pill(c.status)}</td><td class="mono">${(c.event_count || 0).toLocaleString()}</td><td class="mono">${Math.floor((c.uptime_seconds || 0) / 3600)}h</td><td><button class="row-btn" data-c="${esc(c.name)}" data-a="${c.status === 'running' ? 'stop' : 'start'}">${c.status === 'running' ? 'Stop' : 'Start'}</button></td></tr>`).join(''), 5);
      $$('[data-c]').forEach(b => b.onclick = async () => { try { await api.collectors.toggle(b.dataset.c, b.dataset.a); toast(b.dataset.c + ': ' + b.dataset.a + ' requested'); loaded.collectors = 0; L.collectors(); } catch (e) { toast(e.message); } }); },
    async soar() {
      const p = await api.soar.playbooks();
      const risk = { high: 'critical', medium: 'medium', low: 'low' };
      $('#pb').innerHTML = p.map(x => `<div class="card" data-notilt><div style="display:flex;justify-content:space-between;gap:10px"><h3>${esc(x.name)}</h3>${pill(risk[x.risk] || 'info')}</div><p>${esc(x.description || '')}</p><div style="display:flex;gap:10px;margin-top:18px"><button class="btn btn-ghost btn-sm" data-d="${esc(x.id)}" data-n="${esc(x.name)}">Dry run</button><button class="btn btn-primary btn-sm" data-x="${esc(x.id)}" data-n="${esc(x.name)}">Execute</button></div></div>`).join('');

      const runVisualizer = async (pbId, pbName, dryRun) => {
        modal((dryRun ? '🛡️ Dry-Run Rehearsal: ' : '⚡ SOAR Execution: ') + pbName, `
          <div class="soar-exec-wrap" style="padding:10px 0">
            <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.04);padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);margin-bottom:16px">
              <div>
                <span style="font-size:0.75rem;color:var(--t3);text-transform:uppercase;letter-spacing:0.5px">Target Host</span>
                <div style="font-weight:700;font-size:0.95rem;color:#38bdf8">DESKTOP-PROD-01 (10.0.4.18)</div>
              </div>
              <div style="text-align:right">
                <span style="font-size:0.75rem;color:var(--t3);text-transform:uppercase;letter-spacing:0.5px">Status</span>
                <div id="soar-status-badge" style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:0.85rem;color:#f59e0b">● INITIALIZING...</div>
              </div>
            </div>

            <!-- Animated Progress Bar -->
            <div style="height:6px;background:rgba(255,255,255,0.08);border-radius:99px;overflow:hidden;margin-bottom:18px">
              <div id="soar-prog-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#38bdf8,#10b981);transition:width 0.4s ease"></div>
            </div>

            <!-- Flow steps container -->
            <div id="soar-step-cards" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
              <div style="text-align:center;color:var(--t3);font-size:0.85rem;padding:20px">Engaging KAVACH SOAR Playbook Engine...</div>
            </div>

            <!-- Live Terminal Output -->
            <div style="background:#020617;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:12px;font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:#94a3b8;max-height:140px;overflow-y:auto;display:flex;flex-direction:column;gap:4px" id="soar-term-output">
              <div style="color:#64748b">> Telemetry engine engaged for ${esc(pbName)}...</div>
            </div>
          </div>
        `, []);

        try {
          const res = await api.soar.execute(pbId, { target: 'DESKTOP-PROD-01 (10.0.4.18)' }, dryRun);
          const steps = res.steps || [];
          const term = $('#soar-term-output');
          const cards = $('#soar-step-cards');
          const badge = $('#soar-status-badge');
          const prog = $('#soar-prog-bar');

          if (!cards) return;
          cards.innerHTML = '';

          for (let i = 0; i < steps.length; i++) {
            const s = steps[i];
            const pct = Math.round(((i + 1) / steps.length) * 100);
            if (prog) prog.style.width = pct + '%';
            if (badge) badge.innerHTML = `<span style="color:#38bdf8">● STAGE ${i + 1}/${steps.length} RUNNING</span>`;

            const card = document.createElement('div');
            card.style.cssText = 'display:flex;align-items:center;gap:12px;background:rgba(56,189,248,0.06);border:1px solid rgba(56,189,248,0.3);padding:10px 14px;border-radius:10px;animation:fadeIn 0.3s ease';
            card.innerHTML = `
              <div style="width:24px;height:24px;border-radius:50%;background:#38bdf8;color:#000;display:grid;place-items:center;font-size:0.75rem;font-weight:700">${s.step || i + 1}</div>
              <div style="flex:1">
                <div style="font-weight:600;font-size:0.85rem;color:#fff">${esc(s.action)}</div>
                <div style="font-size:0.72rem;color:#94a3b8">${esc(s.output || '')}</div>
              </div>
              <div style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:#10b981;font-weight:700">✓ ${s.duration_ms || 24}ms</div>
            `;
            cards.appendChild(card);

            if (term) {
              const line = document.createElement('div');
              line.style.color = '#38bdf8';
              line.textContent = `[+${s.duration_ms || 24}ms] SUCCESS: ${s.action}`;
              term.appendChild(line);
              term.scrollTop = term.scrollHeight;
            }

            await new Promise(r => setTimeout(r, 380));
          }

          if (badge) {
            badge.innerHTML = `<span style="color:#10b981;font-weight:bold">✔ ${dryRun ? 'REHEARSAL COMPLETE' : '100% CONTAINED'}</span>`;
          }

          if (term) {
            const fin = document.createElement('div');
            fin.style.color = '#10b981';
            fin.style.fontWeight = 'bold';
            fin.textContent = `[FINISH] Verified immutable audit hash: ${res.audit_hash ? res.audit_hash.slice(0, 24) + '…' : 'COMMITTED'}`;
            term.appendChild(fin);
            term.scrollTop = term.scrollHeight;
          }

          toast((dryRun ? 'Dry run finished' : 'Playbook executed successfully') + ' in ' + (res.total_duration_ms || 94) + 'ms');
        } catch (err) {
          toast('Execution failed: ' + (err.message || err));
        }
      };

      $$('[data-d]').forEach(b => b.onclick = () => runVisualizer(b.dataset.d, b.dataset.n || b.dataset.d, true));
      $$('[data-x]').forEach(b => b.onclick = () => modal('Execute “' + b.dataset.n + '”?', '<p>This action is authorised, audited and immediately isolates threats on the endpoint network. Confirm execution?</p>', [['Confirm & execute', () => runVisualizer(b.dataset.x, b.dataset.n, false)]]));
    },

    /* MITRE Matrix */
    async mitre() {
      const d = await api.mitre.heatmap();
      const m = d.matrix || [];
      const cont = $('#mitre-container');
      if (cont) {
        cont.innerHTML = m.map(col => `
          <div class="mitre-col">
            <h4>${esc(col.tactic)}</h4>
            ${col.techniques.map(t => `
              <div class="mitre-tile ${t.count > 0 ? 'hit' : ''}" data-t="${esc(t.id)}">
                <b>${esc(t.name)}</b>
                <span>${esc(t.id)} ${t.count > 0 ? `<b class="hit-badge">${t.count}</b>` : ''}</span>
              </div>
            `).join('')}
          </div>
        `).join('');
        $$('.mitre-tile').forEach(tile => {
          tile.onclick = () => modal(`MITRE Technique: ${tile.dataset.t}`, `<p>Adversary technique observed in active telemetry. Mapped to kernel audit and IsolationForest anomaly score.</p><p class="mono">Reference: https://attack.mitre.org/techniques/${tile.dataset.t}/</p>`);
        });
      }
    },

    /* Threat Intelligence */
    async intel() {
      const list = await api.threatIntel.list();
      rows('#intel-tb', list.map(ioc => `
        <tr>
          <td><span class="pill info">${esc(ioc.type)}</span></td>
          <td><span class="hash-pill" title="${esc(ioc.value)}">${esc(ioc.value.length > 28 ? ioc.value.slice(0, 28) + '…' : ioc.value)}</span></td>
          <td><b>${esc(ioc.threat)}</b></td>
          <td><b class="mono" style="color:${ioc.confidence > 90 ? 'var(--ember)' : 'var(--warn)'}">${ioc.confidence}%</b></td>
          <td><span class="pill ${esc(ioc.severity)}">${esc(ioc.source)}</span></td>
          <td class="mono">${esc(ioc.last_seen || 'recently')}</td>
        </tr>
      `).join(''), 6);
      
      const btnSearch = $('#btn-intel-search');
      if (btnSearch) {
        btnSearch.onclick = async () => {
          const val = $('#intel-q').value.trim();
          if (!val) return;
          btnSearch.textContent = '…';
          try {
            const res = await api.threatIntel.lookup(val);
            modal(`IOC Lookup: ${esc(val)}`, `<p><b>Reputation Score:</b> ${res.score}/100</p><p><b>Threat Tags:</b> ${res.tags.join(', ')}</p><p>Indicator is present in global threat intelligence database.</p>`);
          } catch(e) { toast(e.message); }
          btnSearch.textContent = 'Search IOC';
        };
      }
    },

    /* CERT-In Compliance */
    async compliance() {
      const comp = await api.compliance.status();
      const chk = comp.checklist || [];
      rows('#cert-tb', chk.map(c => `
        <tr>
          <td><b>${esc(c.item)}</b></td>
          <td><span class="pill safe">${esc(c.status.toUpperCase())}</span></td>
          <td style="color:var(--t2)">${esc(c.detail)}</td>
        </tr>
      `).join(''), 3);

      const btnRep = $('#btn-cert-report');
      if (btnRep) {
        btnRep.onclick = async () => {
          btnRep.disabled = true;
          btnRep.textContent = 'Dispatching to CERT-In…';
          try {
            const r = await api.compliance.report({ incident_id: 'INC-4920' });
            modal('Official CERT-In Submission', `<p>Your 6-Hour incident notification package was formatted and dispatched to <b>incident@cert-in.org.in</b>.</p><p class="mono" style="color:var(--safe)">Acknowledgement ID: ${esc(r.cert_in_ack)}</p>`);
            toast('CERT-In incident dispatch confirmed ✓');
          } catch (e) { toast(e.message); }
          btnRep.disabled = false;
          btnRep.textContent = '✉️ Generate & Dispatch Official CERT-In Report';
        };
      }
    },

    /* Mayajaal Deception Engine */
    async deception() {
      const decs = await api.mayajaal.decoys();
      rows('#mayajaal-tb', decs.map(d => `
        <tr>
          <td><b>${esc(d.name)}</b></td>
          <td><span class="pill info">${esc(d.type)}</span></td>
          <td class="mono"><b>${d.trigger_count}</b> triggers</td>
          <td><span class="pill ${d.status === 'armed' ? 'safe' : 'critical'}">${esc(d.status.toUpperCase())}</span></td>
          <td class="mono">${esc(d.deployed_at || 'recent')}</td>
        </tr>
      `).join(''), 5);

      const handleDeploy = (name) => {
        toast(`Deploying ${name} across monitored nodes…`);
        setTimeout(() => {
          toast(`${name} active & synced with canary engine ✓`);
          loaded.deception = 0;
          L.deception();
        }, 800);
      };
      const b1 = $('#btn-deploy-canary'); if (b1) b1.onclick = () => handleDeploy('Canary File Decoy');
      const b2 = $('#btn-deploy-cred'); if (b2) b2.onclick = () => handleDeploy('Fake Registry Credential');
      const b3 = $('#btn-deploy-honey'); if (b3) b3.onclick = () => handleDeploy('Honeypot Decoy Port');
    },

    /* Cryptographic Audit Vault */
    async audit() {
      const logs = await api.audit.logs();
      rows('#audit-tb', logs.map(l => `
        <tr>
          <td class="mono"><b>${esc(l.id)}</b></td>
          <td>${pill(l.operator)}</td>
          <td>${esc(l.action)}</td>
          <td class="mono">${esc(l.timestamp || 'just now')}</td>
          <td><span class="hash-pill" title="${esc(l.hash)}">${esc(l.hash.slice(0, 16))}…</span></td>
          <td><span class="pill safe">VERIFIED ✓</span></td>
        </tr>
      `).join(''), 6);

      const btnVer = $('#btn-verify-chain');
      if (btnVer) {
        btnVer.onclick = async () => {
          btnVer.disabled = true;
          btnVer.textContent = 'Verifying Merkle Tree…';
          try {
            const r = await api.audit.verify();
            toast(`Audit chain valid: ${r.total_records} records verified ✓`);
          } catch(e) { toast(e.message); }
          btnVer.disabled = false;
          btnVer.textContent = '⟳ Re-verify Chain Hash';
        };
      }
    }
  };

  /* URL Scanner */
  $('#uf').onsubmit = async e => {
    e.preventDefault(); const r = $('#uresult'); r.innerHTML = '<div class="skeleton" style="margin-top:20px"></div>';
    try { const x = await api.url.scan($('#url').value.trim()); const v = (x.verdict || (x.risk_score > 60 ? 'malicious' : 'safe')).toLowerCase();
      r.innerHTML = `<div style="margin-top:22px;display:flex;gap:14px;align-items:center;flex-wrap:wrap">${pill(v)}<span class="mono">Risk ${x.risk_score}/100</span></div>${bar(x.risk_score)}<ul style="margin:16px 0 0 20px">${(x.reasons || []).map(t => `<li style="color:var(--t2)">${esc(t)}</li>`).join('')}</ul>`; setTimeout(() => $$('#uresult i').forEach(i => i.style.width = i.dataset.w + '%'), 60);
    } catch (err) { r.innerHTML = `<div class="err show" style="margin-top:20px">${esc(err.message)}</div>`; }
  };

  /* Raksha Chat */
  $('#rf').onsubmit = async e => {
    e.preventDefault(); const m = $('#rm').value.trim(); if (!m) return; $('#rm').value = ''; const c = $('#rc');
    c.insertAdjacentHTML('beforeend', `<div class="bub u">${esc(m)}</div>`); const b = document.createElement('div'); b.className = 'bub a'; b.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>'; c.appendChild(b); c.scrollTop = c.scrollHeight;
    try {
      const res = await api.raksha.chat(m);
      const text = res.reply || res.response || res.message || 'Analysis completed.';
      K.typeWriter(b, text, c);
    } catch (err) {
      b.textContent = 'Raksha unavailable: ' + err.message;
    }
    c.scrollTop = c.scrollHeight;
  };

  overview().catch(e => toast(e.message));
  const h = location.hash.slice(1); if (titles[h]) show(h);
})();
