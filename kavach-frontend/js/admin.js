/* KAVACH — admin console. All data comes from the API; empty/unavailable states are shown honestly. */
(function () {
  const K = window.KAVACH, api = K.api, esc = K.esc, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)], lc = s => String(s || '').toLowerCase();
  const user = K.session.require('admin'); if (!user) return;
  const root = document.documentElement; let th = 'light'; try { th = localStorage.getItem('kavach-theme') || th; } catch (e) {} root.dataset.theme = th;
  $('#theme').onclick = () => { th = root.dataset.theme = th === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('kavach-theme', th); } catch (e) {} };
  $('#uname').textContent = user.username; $('#urole').textContent = user.role_name; $('#logout').onclick = () => api.auth.logout(); $('#menu').onclick = () => $('#side').classList.toggle('open');
  const cv = $('#net'), x = cv.getContext('2d'); let W, H, P = []; const size = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; P = Array.from({ length: Math.min(50, W * H / 30000 | 0) }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3 })); }; size(); addEventListener('resize', size);
  (function f() { x.clearRect(0, 0, W, H); P.forEach((p, i) => { p.x = (p.x + p.vx + W) % W; p.y = (p.y + p.vy + H) % H; x.fillStyle = 'rgba(200,39,45,.55)'; x.beginPath(); x.arc(p.x, p.y, 1.4, 0, 6.3); x.fill(); for (let j = i + 1; j < P.length; j++) { const d = Math.hypot(p.x - P[j].x, p.y - P[j].y); if (d < 120) { x.strokeStyle = `rgba(200,39,45,${.12 * (1 - d / 120)})`; x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(P[j].x, P[j].y); x.stroke(); } } }); requestAnimationFrame(f); })();
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 3000); };
  const err = m => { const e = $('#err'); e.textContent = m || ''; e.classList.toggle('show', !!m); };
  const L = d => Array.isArray(d) ? d : (d && (d.items || d.data || d.users || d.endpoints || d.logs)) || [];
  const pill = s => `<span class="pill ${esc(lc(s))}">${esc(s || '—')}</span>`;
  const rows = (id, arr, cols, fn, msg) => { $(id).innerHTML = arr.length ? arr.map((r, i) => fn(r).replace('<tr>', `<tr style="animation-delay:${Math.min(i, 14) * 35}ms">`)).join('') : `<tr><td colspan="${cols}"><div class="empty">${msg}</div></td></tr>`; };
  const cnt = (el, to) => { const t0 = performance.now(); (function s(t) { const p = Math.min(1, (t - t0) / 900); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(s); })(t0); };
  const tally = (a, fn) => a.reduce((m, r) => { const k = lc(fn(r)) || 'unknown'; m[k] = (m[k] || 0) + 1; return m; }, {});
  const COL = ['#E5484D', '#3B82F6', '#2FA66A', '#F5B544', '#8B5CF6', '#38BDF8', '#F97316'];
  const donut = (id, map, label) => { const e = Object.entries(map).sort((a, b) => b[1] - a[1]), t = e.reduce((s, r) => s + r[1], 0), el = $(id); if (!t) { el.innerHTML = '<div class="empty">No data yet</div>'; return; } let o = 0;
    el.innerHTML = `<div class="dn"><svg viewBox="0 0 36 36">${e.map(([k, v], i) => { const f = v / t * 100, s = `<circle r="15.9" cx="18" cy="18" fill="none" stroke="${COL[i % 7]}" stroke-width="3.4" stroke-dasharray="0 100" data-d="${Math.max(f - .8, .2)} 100" stroke-dashoffset="${-o}"/>`; o += f; return s; }).join('')}</svg><div><b>${t}</b><small>${label}</small></div></div><ul class="lgd">${e.map(([k, v], i) => `<li><i style="background:${COL[i % 7]}"></i>${esc(k.replace(/_/g, ' '))}<b>${v}</b></li>`).join('')}</ul>`;
    setTimeout(() => el.querySelectorAll('circle').forEach(c => c.setAttribute('stroke-dasharray', c.dataset.d)), 60); };
  const bars = (id, r, msg) => { const el = $(id); if (!r.length) { el.innerHTML = `<div class="empty">${msg}</div>`; return; } const m = Math.max(...r.map(a => a.v), 1); el.innerHTML = r.map((a, i) => `<div class="hb"><span title="${esc(a.l)}">${esc(a.l)}</span><div><i style="--w:${a.v / m * 100}%;background:${a.c || COL[i % 7]};animation-delay:${i * 70}ms"></i></div><b>${a.v}</b></div>`).join(''); };
  const modal = (html, ok) => { $('#md').innerHTML = html + '<div class="ac"><button class="btn ghost" id="mc">Cancel</button><button class="btn" id="mo">Confirm</button></div>'; $('#mb').classList.add('show'); $('#mc').onclick = () => $('#mb').classList.remove('show'); $('#mo').onclick = async () => { try { await ok(); $('#mb').classList.remove('show'); } catch (e) { toast(e.message); } }; };
  const T = { overview: ['Overview', 'Live health of your fleet, accounts and audit trail'], endpoints: ['Endpoints', 'Fleet governance and containment'], accounts: ['Accounts', 'Identity and access control'], policies: ['Policies', 'Platform-wide security configuration'], collectors: ['Collectors', 'Telemetry sensor daemons'], soar: ['SOAR playbooks', 'Automated response orchestration'], sandbox: ['Sandbox', 'Isolated detonation'], url: ['URL scanner', 'Zero-trust link inspection'], audit: ['Audit trail', 'Immutable activity provenance'] };
  let D = { end: [], acc: [], aud: [] }, cur = 'overview', pol = {};
  const ld = {
    async endpoints() { D.end = L(await api.admin.endpointsPosture()); rows('#t-end', D.end, 7, e => `<tr><td><b>${esc(e.hostname)}</b><div class="mono">${esc(e.department || '')}</div></td><td class="mono">${esc(e.ip || '—')}</td><td>${esc(e.os || '—')}</td><td><b>${e.security_score != null ? e.security_score : '—'}</b></td><td>${pill(e.status)}</td><td class="mono">${esc(e.last_seen && /\d{4}-/.test(e.last_seen) ? K.ago(e.last_seen) : e.last_seen || '—')}</td><td>${e.is_local ? '' : `<button class="sb dg" data-iso="${esc(e.id)}">${lc(e.status) === 'isolated' ? 'Release' : 'Isolate'}</button>`}</td></tr>`, 'No endpoints enrolled yet'); },
    async accounts() {
      const [reqsRes, analystsRes, usersRes] = await Promise.allSettled([
        api.account.adminQueue(),
        api.account.workload(),
        api.account.users()
      ]);
      const reqs = reqsRes.status === 'fulfilled' ? L(reqsRes.value) : [];
      const cntEl = $('#cnt-pend-reqs'); if (cntEl) cntEl.textContent = reqs.length + ' Pending';
      rows('#t-reqs', reqs, 6, r => `<tr>
        <td><b>${esc(r.full_name || r.username)}</b><div class="mono">${esc(r.email)}</div></td>
        <td>${esc(r.organization_name || '—')}</td>
        <td>${esc(r.department || '—')}</td>
        <td><small style="max-width:220px;display:inline-block;overflow:hidden;text-overflow:ellipsis">${esc(r.justification || '—')}</small></td>
        <td class="mono">${K.ago(r.created_at)}</td>
        <td style="text-align:right;white-space:nowrap">
          <button class="sb" data-appr-req="${esc(r.id)}" style="background:rgba(46,160,67,0.2);color:#3fb950;border-color:rgba(46,160,67,0.4)">Approve &amp; Assign</button>
          <button class="sb dg" data-rej-req="${esc(r.id)}">Reject</button>
        </td>
      </tr>`, 'No pending user registration requests. All caught up!');

      const analysts = analystsRes.status === 'fulfilled' ? L(analystsRes.value) : [];
      rows('#t-analysts', analysts, 6, a => `<tr>
        <td><b>${esc(a.full_name || a.username)}</b><div class="mono">${esc(a.email)}</div></td>
        <td>${esc(a.department || 'SOC Operations')}</td>
        <td><span class="pill ${a.active_review_load > 0 ? 'warn' : 'ok'}">${a.active_review_load} active</span></td>
        <td>${pill(a.is_2fa_enabled ? 'ok' : 'bad').replace(/>.*?</, `>${a.is_2fa_enabled ? 'Enforced' : 'Pending'}<`)}</td>
        <td>${pill(a.status)}</td>
        <td class="mono">${a.last_login ? K.ago(a.last_login) : 'Never'}</td>
      </tr>`, 'No SOC analysts provisioned yet');

      const usersData = usersRes.status === 'fulfilled' ? usersRes.value : {};
      D.acc = L(usersData);
      rows('#t-acc', D.acc, 6, u => `<tr>
        <td><b>${esc(u.full_name || u.username)}</b><div class="mono">${esc(u.email || '')}</div></td>
        <td>${esc(u.role)}</td>
        <td>${pill(u.is_active ? 'ok' : 'bad').replace(/>.*?</, `>${u.is_active ? 'Active' : 'Disabled'}<`)}</td>
        <td><b>—</b></td>
        <td>${pill(u.status)}</td>
        <td style="text-align:right;white-space:nowrap">
          ${lc(u.status) === 'active' ? `<button class="sb dg" data-susp-user="${esc(u.id)}">Suspend</button>` : `<button class="sb" data-react-user="${esc(u.id)}" style="background:rgba(46,160,67,0.2);color:#3fb950;border-color:rgba(46,160,67,0.4)">Reactivate</button>`}
        </td>
      </tr>`, 'No accounts found');
    },
    async policies() { pol = await api.admin.policies() || {}; $('#pol').innerHTML = Object.entries(pol).map(([k, v]) => `<div class="pi"><label>${esc(k.replace(/_/g, ' '))}</label>${typeof v === 'boolean' ? `<span class="tg"><input type="checkbox" data-k="${esc(k)}" ${v ? 'checked' : ''}><s></s></span>` : `<input type="text" data-k="${esc(k)}" data-t="${Array.isArray(v) ? 'a' : typeof v}" value="${esc(Array.isArray(v) ? v.join(', ') : v)}">`}</div>`).join('') || '<div class="empty">No policies returned</div>'; },
    async collectors() { const c = L(await api.collectors.status()); rows('#t-col', c, 5, r => `<tr><td class="mono"><b>${esc(r.name)}</b></td><td>${pill(r.status)}</td><td>${(r.event_count || 0).toLocaleString()}</td><td class="mono">${r.last_heartbeat ? K.ago(r.last_heartbeat) : '—'}</td><td><button class="sb" data-co="${esc(r.name)}" data-a="${lc(r.status) === 'running' ? 'stop' : 'start'}">${lc(r.status) === 'running' ? 'Stop' : 'Start'}</button></td></tr>`, 'No collectors reporting'); },
    async soar() { const p = L(await api.soar.playbooks()); rows('#t-soar', p, 5, r => `<tr><td><b>${esc(r.name)}</b><div class="mono">${esc(r.description || '')}</div></td><td>${esc(r.category || '—')}</td><td>${pill(r.risk)}</td><td>${r.execution_count != null ? r.execution_count : '—'}</td><td style="white-space:nowrap"><button class="sb" data-pb="${esc(r.id)}" data-dry="1">Dry run</button> <button class="sb dg" data-pb="${esc(r.id)}">Execute</button></td></tr>`, 'No playbooks available'); },
    async sandbox() { const s = L(await api.sandbox.detonations()); rows('#t-sb', s, 5, r => `<tr><td class="mono">${esc(r.target)}</td><td>${pill(r.verdict)}</td><td>${r.risk_score != null ? r.risk_score : '—'}</td><td>${esc(r.submitted_by || '—')}</td><td class="mono">${r.detonated_at ? K.ago(r.detonated_at) : '—'}</td></tr>`, 'No detonations yet'); },
    async audit() { D.aud = L(await api.audit.logs()); rows('#t-aud', D.aud, 4, a => `<tr><td>${esc(a.operator)}</td><td>${esc(a.action)}</td><td class="mono">${K.ago(a.timestamp)}</td><td class="mono" title="${esc(a.hash)}">${esc((a.hash || '').slice(0, 16))}…</td></tr>`, 'No audit records yet'); },
    async overview() {
      const R = await Promise.allSettled([api.admin.endpointsPosture(), api.admin.accountsPosture(), api.audit.logs(), api.collectors.status(), api.admin.policies()]);
      if (R.every(r => r.status === 'rejected')) { err('Cannot reach the KAVACH server. No data is shown until the API responds.'); return; } err('');
      const v = i => R[i].status === 'fulfilled' ? L(R[i].value) : [], E = v(0), A = v(1), AU = v(2), C = v(3);
      const iso = E.filter(e => lc(e.status) === 'isolated').length, nm = A.filter(u => !u.mfa_enabled).length, sus = A.filter(u => lc(u.status) !== 'active').length, run = C.filter(c => lc(c.status) === 'running').length;
      const avg = E.filter(e => e.security_score != null); const k = [['Endpoints', E.length], ['Isolated', iso, iso], ['Accounts', A.length], ['Without MFA', nm, nm], ['Suspended', sus], ['Collectors up', run]];
      $('#kp').innerHTML = k.map(a => `<div class="k ${a[2] ? 'hot' : ''}"><span>${a[0]}</span><b>0</b></div>`).join(''); $$('#kp b').forEach((b, i) => cnt(b, k[i][1]));
      if (avg.length) $('#kp').insertAdjacentHTML('beforeend', `<div class="k"><span>Avg score</span><b>${Math.round(avg.reduce((s, e) => s + e.security_score, 0) / avg.length)}</b></div>`);
      donut('#d-fleet', tally(E, e => e.status), 'endpoints'); donut('#d-role', tally(A, u => u.role_name || u.role), 'accounts');
      donut('#d-sec', A.length ? Object.fromEntries(Object.entries({ 'mfa enabled': A.length - nm, 'no mfa': nm, suspended: sus }).filter(r => r[1])) : {}, 'accounts');
      bars('#b-score', E.filter(e => e.security_score != null).sort((a, b) => a.security_score - b.security_score).slice(0, 7).map(e => ({ l: e.hostname, v: e.security_score, c: e.security_score >= 80 ? '#2FA66A' : e.security_score >= 60 ? '#F5B544' : '#E5484D' })), 'No scored endpoints yet');
      bars('#b-os', Object.entries(tally(E, e => e.os)).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([l, v]) => ({ l, v })), 'No endpoints enrolled yet');
      rows('#t-recent', AU.slice(0, 6), 3, a => `<tr><td>${esc(a.operator)}</td><td>${esc(a.action)}</td><td class="mono">${K.ago(a.timestamp)}</td></tr>`, 'No audit events yet');
    }
  };
  const show = v => { cur = v; $$('.nv').forEach(b => b.classList.toggle('on', b.dataset.v === v)); $$('.view').forEach(s => s.classList.toggle('on', s.id === 'v-' + v)); $('#ttl').textContent = T[v][0]; $('#sub').textContent = T[v][1]; $('#side').classList.remove('open'); load(); };
  const load = async () => { if (!ld[cur]) return; try { await ld[cur](); if (cur !== 'overview') err(''); $('#upd').textContent = 'Updated ' + new Date().toLocaleTimeString(); } catch (e) { err(e.network ? 'Cannot reach the KAVACH server.' : e.message); } };
  $$('.nv').forEach(b => b.onclick = () => show(b.dataset.v)); $('#rf').onclick = load;
  document.addEventListener('click', async e => { const b = e.target.closest('button'); if (!b) return; try {
    if (b.dataset.iso) { await api.devices.isolate(b.dataset.iso); toast('Containment state updated'); load(); }
    if (b.dataset.tg) { await api.users.toggleStatus(b.dataset.tg); toast('Account status updated'); load(); }
    if (b.dataset.apprReq) {
      b.disabled = true;
      try {
        const res = await api.account.adminReview(b.dataset.apprReq, 'APPROVE');
        toast(res.message || 'Request approved and auto-assigned to SOC analyst');
        load();
      } catch (err) { toast(err.message); b.disabled = false; }
    }
    if (b.dataset.rejReq) {
      modal('<h3>Reject Account Request</h3><p style="color:var(--t2)">Specify a reason for rejecting this candidate:</p><div class="f"><label>Rejection Reason</label><input id="rej-reason" placeholder="e.g. Ineligible corporate domain" required></div>', async () => {
        const reason = ($('#rej-reason').value || '').trim();
        const res = await api.account.adminReview(b.dataset.rejReq, 'REJECT', null, reason);
        toast(res.message || 'Request rejected');
        load();
      });
    }
    if (b.dataset.suspUser) {
      modal('<h3>Suspend User Account</h3><p style="color:var(--t2)">Session tokens will be immediately revoked:</p><div class="f"><label>Suspension Reason</label><input id="susp-reason" placeholder="e.g. Host credential anomaly" required></div>', async () => {
        const reason = ($('#susp-reason').value || '').trim();
        await api.account.suspend(b.dataset.suspUser, reason);
        toast('Account suspended and session revoked');
        load();
      });
    }
    if (b.dataset.reactUser) {
      b.disabled = true;
      try {
        await api.account.reactivate(b.dataset.reactUser);
        toast('Account reactivated');
        load();
      } catch (err) { toast(err.message); b.disabled = false; }
    }
    if (b.dataset.rm) modal('<h3>Delete account?</h3><p style="color:var(--t2)">This permanently removes access for <b>' + esc(b.dataset.rm) + '</b>.</p>', async () => { await api.users.delete(b.dataset.rm); toast('Account deleted'); load(); });
    if (b.dataset.co) { await api.collectors.toggle(b.dataset.co, b.dataset.a); toast('Collector ' + b.dataset.a + ' requested'); load(); }
    if (b.dataset.pb) { const r = await api.soar.execute(b.dataset.pb, {}, !!b.dataset.dry); toast(r.message || r.status || 'Playbook submitted'); }
  } catch (er) { toast(er.message); } });

  const btnInv = $('#btn-invite-analyst');
  if (btnInv) {
    btnInv.onclick = () => modal('<h3>Provision SOC Analyst</h3><div class="f"><label>Username</label><input id="a1" placeholder="analyst_ops" required></div><div class="f"><label>Full Name</label><input id="a2" placeholder="Vikram Malhotra" required></div><div class="f"><label>Official Email</label><input id="a3" type="email" placeholder="v.malhotra@kavach.io" required></div><div class="f"><label>Initial Password</label><input id="a4" type="password" placeholder="Min 12 chars, upper, lower, symbol" required></div><div class="f"><label>Department</label><input id="a5" value="Cyber Defense Operations"></div>',
      async () => {
        await api.account.inviteAnalyst({
          username: $('#a1').value.trim(),
          full_name: $('#a2').value.trim(),
          email: $('#a3').value.trim(),
          password: $('#a4').value,
          department: $('#a5').value.trim()
        });
        toast('SOC Analyst provisioned and active');
        load();
      });
  }

  $('#nu').onclick = () => modal('<h3>New account</h3><div class="f"><label>Username</label><input id="n1"></div><div class="f"><label>Full name</label><input id="n2"></div><div class="f"><label>Email</label><input id="n3" type="email"></div><div class="f"><label>Role</label><select id="n4"><option value="user">User</option><option value="soc_analyst">SOC analyst</option><option value="incident_responder">Incident responder</option><option value="auditor">Auditor</option><option value="admin">Administrator</option></select></div>',
    async () => { await api.users.create({ username: $('#n1').value.trim(), full_name: $('#n2').value.trim(), email: $('#n3').value.trim(), role: $('#n4').value }); toast('Account created'); load(); });
  $('#sp').onclick = async () => { const p = {}; $$('#pol [data-k]').forEach(i => { const k = i.dataset.k; p[k] = i.type === 'checkbox' ? i.checked : i.dataset.t === 'a' ? i.value.split(',').map(s => s.trim()).filter(Boolean) : i.dataset.t === 'number' ? Number(i.value) : i.value; });
    try { await api.admin.updatePolicies(p); toast('Policies saved'); } catch (e) { toast(e.message); } };
  $('#sf').onsubmit = async e => { e.preventDefault(); try { await api.sandbox.submit({ target: $('#st').value.trim(), target_type: /^https?:/i.test($('#st').value) ? 'url' : 'file' }); toast('Submitted'); load(); } catch (er) { toast(er.message); } };
  $('#uf').onsubmit = async e => { e.preventDefault(); try { const r = await api.url.scan($('#ui').value.trim()), bad = ['malicious', 'phishing', 'suspicious'].includes(lc(r.verdict)); $('#ur').innerHTML = `<div class="verd ${bad ? 'bad' : 'ok'}"><b>${bad ? '⚠ ' : '✓ '}${esc(r.verdict)}</b> ${r.risk_score != null ? '· risk ' + r.risk_score + '/100' : ''}<ul>${(r.reasons || []).map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>`; } catch (er) { toast(er.message); } };
  $('#vc').onclick = async () => { try { const r = await api.audit.verify(); toast(r.chain_valid ? `Chain valid · ${r.total_records} records` : 'Chain INVALID — possible tampering'); } catch (e) { toast(e.message); } };
  show('overview'); setInterval(() => !document.hidden && cur === 'overview' && load(), 30000);
})();
