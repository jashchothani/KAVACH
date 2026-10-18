/* KAVACH — SOC overview: every figure and chart is computed from live API responses. */
(function () {
  const K = window.KAVACH, api = K.api, esc = K.esc, $ = s => document.querySelector(s), lc = s => String(s || '').toLowerCase();
  const SEV = { critical: '#E5484D', high: '#F97316', medium: '#F5B544', low: '#38BDF8', info: '#8A90A0' }, ST = { open: '#E5484D', investigating: '#F5B544', contained: '#38BDF8', resolved: '#2FA66A', closed: '#2FA66A' };
  const list = d => Array.isArray(d) ? d : (d && (d.items || d.alerts || d.incidents || d.data)) || [];
  const empty = m => `<div class="ov-empty"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6z"/></svg>${m}</div>`;
  const cnt = (el, to, dec) => {
    if (!el) return;
    to = Number(to) || 0;
    const t0 = performance.now(), from = parseFloat(el.dataset.v) || 0;
    el.dataset.v = to;
    (function f(t) {
      const p = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - p, 3);
      el.textContent = (from + (to - from) * e).toFixed(dec || 0);
      if (p < 1) requestAnimationFrame(f);
    })(t0);
  };
  const tally = (arr, fn) => arr.reduce((m, x) => { const k = lc(fn(x)) || 'unknown'; m[k] = (m[k] || 0) + 1; return m; }, {});

  function timeline(alerts) {
    const el = $('#ov-line');
    if (!el) return;
    const now = Date.now(), H = 36e5, B = Array(24).fill(0);
    alerts.forEach(a => { const i = 23 - Math.floor((now - new Date(a.created_at)) / H); if (i >= 0 && i < 24) B[i]++; });
    if (!B.some(Boolean)) { el.innerHTML = empty('No alerts raised in the last 24 hours'); return; }
    const w = 640, h = 210, p = 28, mx = Math.max(3, ...B), X = i => p + i * (w - 2 * p) / 23, Y = v => h - p - v * (h - 2 * p) / mx;
    const pts = B.map((v, i) => [X(i), Y(v)]); let d = `M${pts[0]}`; for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], c = (x0 + x1) / 2; d += ` C${c},${y0} ${c},${y1} ${x1},${y1}`; }
    const grid = [0, .5, 1].map(f => `<line x1="${p}" x2="${w - p}" y1="${Y(mx * f)}" y2="${Y(mx * f)}" class="gl"/><text x="${p - 6}" y="${Y(mx * f) + 4}" class="ax" text-anchor="end">${Math.round(mx * f)}</text>`).join('');
    const lab = [0, 6, 12, 18, 23].map(i => `<text x="${X(i)}" y="${h - 8}" class="ax" text-anchor="middle">${i === 23 ? 'now' : '-' + (23 - i) + 'h'}</text>`).join('');
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="lg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#E5484D" stop-opacity=".45"/><stop offset="1" stop-color="#E5484D" stop-opacity="0"/></linearGradient></defs>${grid}${lab}<path d="${d} L${X(23)},${h - p} L${X(0)},${h - p}Z" fill="url(#lg)" class="area"/><path d="${d}" class="ln"/>${pts.map((q, i) => `<circle cx="${q[0]}" cy="${q[1]}" r="3.5" class="dot" style="animation-delay:${i * 30 + 600}ms"><title>${B[i]} alert(s) · ${23 - i}h ago</title></circle>`).join('')}</svg>`;
  }
  function donut(el, map, colors, label) {
    if (!el) return;
    const e = Object.entries(map).sort((a, b) => b[1] - a[1]), tot = e.reduce((s, x) => s + x[1], 0);
    if (!tot) { el.innerHTML = empty('No data yet'); return; }
    let off = 0; const seg = e.map(([k, v]) => { const f = v / tot * 100, s = `<circle r="15.9" cx="18" cy="18" fill="none" stroke="${colors[k] || '#8A90A0'}" stroke-width="3.4" stroke-dasharray="0 100" data-d="${Math.max(f - .8, .2)} 100" stroke-dashoffset="${-off}"/>`; off += f; return s; }).join('');
    el.innerHTML = `<div class="dn"><svg viewBox="0 0 36 36">${seg}</svg><div><b>${tot}</b><small>${label}</small></div></div><ul class="lg">${e.map(([k, v]) => `<li><i style="background:${colors[k] || '#8A90A0'}"></i>${esc(k)}<b>${v}</b></li>`).join('')}</ul>`;
    requestAnimationFrame(() => setTimeout(() => el.querySelectorAll('circle').forEach(c => c.setAttribute('stroke-dasharray', c.dataset.d)), 60));
  }
  function bars(el, rows, msg) {
    if (!el) return;
    if (!rows.length) { el.innerHTML = empty(msg); return; }
    const mx = Math.max(...rows.map(r => r.v));
    el.innerHTML = rows.map((r, i) => `<div class="hb"><span title="${esc(r.t || r.l)}">${esc(r.l)}</span><div><i style="--w:${r.v / mx * 100}%;background:${r.c || '#E5484D'};animation-delay:${i * 70}ms"></i></div><b>${r.v}</b></div>`).join('');
  }
  async function load() {
    const st = $('#ov-state');
    if (st) { st.className = 'ov-state'; st.textContent = ''; }
    const R = await Promise.allSettled([api.dashboard.summary(), api.alerts.list(), api.incidents.list(), api.collectors.status(), api.mitre.heatmap(), api.soar.stats(), api.devices.list()]);
    if (R.every(r => r.status === 'rejected')) {
      if (st) { st.className = 'ov-state show'; st.textContent = 'Cannot reach the KAVACH backend. No data is shown until the API responds.'; }
      return;
    }
    const v = i => R[i].status === 'fulfilled' ? R[i].value : null;
    const S = v(0) || {}, A = list(v(1)), I = list(v(2)), C = list(v(3)), M = v(4) || {}, SO = v(5) || {}, D = list(v(6));
    const open = A.filter(a => !['resolved', 'closed', 'false_positive'].includes(lc(a.status)));
    const crit = open.filter(a => lc(a.severity) === 'critical');
    const run = C.filter(c => lc(c.status) === 'running').length;
    const oi = I.filter(i => !['resolved', 'closed'].includes(lc(i.status)));
    const score = S.security_score != null ? S.security_score : null;

    cnt($('#k-open'), open.length);
    cnt($('#k-crit'), crit.length);
    cnt($('#k-inc'), oi.length);
    cnt($('#k-dev'), (S.stats && S.stats.monitored_devices) != null ? S.stats.monitored_devices : D.length);
    const kCol = $('#k-col');
    if (kCol) {
      kCol.innerHTML = C.length ? `<span id="k-colv">0</span><small>/${C.length}</small>` : '—';
      if (C.length) cnt($('#k-colv'), run);
    }
    if (score != null) cnt($('#k-score'), score); else if ($('#k-score')) $('#k-score').textContent = '—';
    const kCrit = $('#k-crit');
    if (kCrit && kCrit.closest('.ov-k')) kCrit.closest('.ov-k').classList.toggle('hot', crit.length > 0);

    const bell = $('#bell-n'); if (bell) { bell.textContent = crit.length || open.length; bell.style.display = open.length ? '' : 'none'; }
    const nb = $('#nb-alerts'); if (nb) { nb.textContent = open.length; nb.style.display = open.length ? '' : 'none'; }
    
    timeline(A);
    donut($('#ov-sev'), tally(open, a => a.severity), SEV, 'open alerts');
    donut($('#ov-inc'), tally(I, i => i.status), ST, 'incidents');

    // MITRE techniques mapping (handles direct alert tags and heatmap tactics/matrix)
    const mt = {};
    A.forEach(a => {
      const tag = a.mitre || a.mitre_technique_id || (a.mitre_technique_name ? a.mitre_technique_name.slice(0, 20) : null);
      if (tag) mt[tag] = (mt[tag] || 0) + 1;
    });
    let rows = Object.entries(mt).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([l, v]) => ({ l, v }));
    const tacticsList = Array.isArray(M.tactics) ? M.tactics : (Array.isArray(M.matrix) ? M.matrix : []);
    if (!rows.length && tacticsList.length) {
      rows = tacticsList.flatMap(t => (t.techniques || []).map(x => ({ l: x.id + ' ' + (x.name || ''), t: x.name, v: x.count || 0 }))).filter(r => r.v).sort((a, b) => b.v - a.v).slice(0, 7);
    }
    bars($('#ov-mitre'), rows, 'No MITRE-tagged detections yet');

    // Alert sources (sensors / engines)
    bars($('#ov-src'), Object.entries(tally(A, a => a.source || a.collector || 'Host Sensor')).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([l, v]) => ({ l, v, c: '#3B82F6' })), 'No alert sources yet');

    // Collectors grid
    const ovCol = $('#ov-col');
    if (ovCol) {
      ovCol.innerHTML = C.length ? C.map((c, i) => `<div class="col ${lc(c.status)}" style="animation-delay:${i * 35}ms" title="${esc(c.name)} · ${esc(c.status)}"><i></i><span>${esc(c.name)}</span><small>${(c.event_count || 0).toLocaleString()}</small></div>`).join('') : empty('No collectors reporting');
    }

    // SOAR Automation stats
    const sx = [
      ['Playbooks', SO.total_playbooks],
      ['Executions', SO.total_executions],
      ['Containments', SO.active_containments],
      ['Avg duration (s)', SO.avg_duration_sec],
      ['Success rate %', SO.automated_success_rate_pct != null ? `${SO.automated_success_rate_pct}%` : null]
    ].filter(x => x[1] != null);
    const ovSoar = $('#ov-soar');
    if (ovSoar) {
      ovSoar.innerHTML = sx.length ? sx.map(x => `<div><b>${x[1]}</b><span>${x[0]}</span></div>`).join('') : empty('SOAR statistics unavailable');
    }

    // Recent alerts
    const rec = [...A].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8);
    const ovRecent = $('#ov-recent');
    if (ovRecent) {
      ovRecent.innerHTML = rec.length ? rec.map((a, i) => `<tr style="animation-delay:${i * 45}ms"><td><span class="pill ${esc(lc(a.severity))}">${esc(a.severity || '—')}</span></td><td><b>${esc(a.title || a.name || a.id)}</b></td><td class="mono">${esc(a.source || a.collector || 'Host Sensor')}</td><td class="mono">${esc(a.mitre || a.mitre_technique_id || '—')}</td><td>${esc(a.status || '—')}</td><td class="mono">${K.ago(a.created_at)}</td></tr>`).join('') : `<tr><td colspan="6">${empty('No alerts recorded')}</td></tr>`;
    }
    const ovUpd = $('#ov-upd');
    if (ovUpd) ovUpd.textContent = 'Updated ' + new Date().toLocaleTimeString();
  }
  window.SOCOverview = { load };
  setInterval(() => { if (!document.hidden && $('#v-overview.on')) load(); }, 15000);
})();
