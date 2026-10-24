/* KAVACH — API client. REAL DATA ONLY: every call goes to the FastAPI backend (/api/v1). Resilient direct fallback & zero data loss. */
(function () {
  const isFile = location.protocol === 'file:';
  // Authoritative production backend hosted on AWS EC2
  const directBackend = 'https://api.kavachcybertech.in/api/v1';
  const defaultBase = isFile ? directBackend : (location.hostname.endsWith('kavachcybertech.in') ? '/api/v1' : directBackend);

  window.KAVACH_CONFIG = Object.assign({
    apiBase: defaultBase,
    directBase: directBackend,
    timeout: 45000
  }, window.KAVACH_CONFIG || {});
})();
(function () {
  const C = window.KAVACH_CONFIG, TOKEN = 'kavach_token', USER = 'kavach_user';
  let offline = false;
  const normalizeRole = r => { r = (r || 'user').toLowerCase().trim(); return ['layman', 'layman_user', 'member', 'student'].includes(r) ? 'user' : r; };
  const isAdminRole = r => ['admin', 'super_admin', 'owner'].includes((r || '').toLowerCase().trim());
  const isAnalystRole = r => isAdminRole(r) || ['soc_analyst', 'security_analyst', 'analyst', 'incident_responder', 'security_manager', 'auditor'].includes((r || '').toLowerCase().trim());
  const roleName = r => { r = normalizeRole(r); return isAdminRole(r) ? 'Super Administrator' : ['soc_analyst', 'analyst', 'security_analyst'].includes(r) ? 'SOC Analyst' : r === 'incident_responder' ? 'Incident Responder' : r === 'security_manager' ? 'Security Manager' : r === 'auditor' ? 'Auditor' : 'User'; };
  const isHtml = location.protocol === 'file:' || location.pathname.endsWith('.html');
  const pathFor = (clean, file) => isHtml ? file : clean;

  const session = {
    token: () => localStorage.getItem(TOKEN),
    user: () => { try { return JSON.parse(localStorage.getItem(USER)); } catch { return null; } },
    save(res) { localStorage.setItem(TOKEN, res.access_token); localStorage.setItem(USER, JSON.stringify({ username: res.username, email: res.email, role: normalizeRole(res.role), role_name: roleName(res.role), permissions: res.permissions || [] })); },
    clear() { localStorage.removeItem(TOKEN); localStorage.removeItem(USER); },
    /* kind: 'user' | 'analyst' | 'admin' — redirects to the right login when the session is missing or too weak */
    require(kind) {
      const u = session.user();
      const login = (kind === 'user' || kind === false) ? pathFor('/login', 'login.html') : pathFor('/admin-login', 'admin-login.html');
      if (!session.token() || !u) { location.replace(login); return null; }
      if (kind === 'admin' && !isAdminRole(u.role)) { location.replace(isAnalystRole(u.role) ? pathFor('/soc', 'soc.html') : pathFor('/user', 'user.html')); return null; }
      if (kind === 'analyst' && !isAnalystRole(u.role)) { location.replace(pathFor('/user', 'user.html')); return null; }
      return u;
    }
  };

  async function rawFetch(targetUrl, method, headers, body, timeoutMs) {
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const res = await fetch(targetUrl, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: ctl.signal });
      if (res.status === 401 && !targetUrl.includes('/auth/')) {
        const u = session.user();
        session.clear();
        location.replace(u && isAnalystRole(u.role) ? pathFor('/admin-login', 'admin-login.html') : pathFor('/login', 'login.html'));
      }
      if (!res.ok) {
        let d = {};
        try { d = await res.json(); } catch {}
        const msg = (d.error && (d.error.message || d.error.detail)) || d.detail || d.message || (res.status === 401 ? 'Invalid username/email, password, or security code.' : ('HTTP ' + res.status));
        const e = new Error(msg);
        e.status = res.status;
        throw e;
      }
      offline = false;
      return res.status === 204 ? null : await res.json();
    } catch (e) {
      if (e.status === undefined) { e.network = true; offline = true; }
      throw e;
    } finally {
      clearTimeout(to);
    }
  }

  async function request(method, path, body, params) {
    let q = '';
    if (params) {
      const sp = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== ''));
      if ([...sp].length) q = '?' + sp;
    }
    const headers = { 'Content-Type': 'application/json', 'X-Request-ID': 'web-' + Math.random().toString(36).slice(2, 10) };
    const t = session.token();
    if (t) headers.Authorization = 'Bearer ' + t;

    const primaryUrl = C.apiBase + path + q;
    try {
      return await rawFetch(primaryUrl, method, headers, body, C.timeout);
    } catch (err) {
      // Automatic fallback to direct backend if proxy gave 502 or network error
      if ((err.network || err.status === 502) && C.directBase && !primaryUrl.startsWith(C.directBase)) {
        try {
          const directUrl = C.directBase + path + q;
          return await rawFetch(directUrl, method, headers, body, C.timeout);
        } catch (err2) {
          throw err2;
        }
      }
      throw err;
    }
  }
  const get = (p, q) => request('GET', p, null, q), post = (p, b) => request('POST', p, b), patch = (p, b) => request('PATCH', p, b), del = p => request('DELETE', p);
  const api = {
    auth: {
      loginInit: (id, pw) => post('/auth/login-init', { username_or_email: id, password: pw }),
      requestOtp: id => post('/auth/request-otp', { username_or_email: id }),
      verifyOtp: (id, code) => post('/auth/verify-otp', { username_or_email: id, otp_code: code }),
      mobileChallengeStatus: id => get('/auth/mobile-challenge/status/' + encodeURIComponent(id)),
      forgotPassword: email => post('/auth/forgot-password', { email }),
      resetPassword: (email, code, pw) => post('/auth/reset-password', { email, reset_code: code, new_password: pw }),
      logout: async () => { try { await post('/auth/logout'); } catch {} const u = session.user(); session.clear(); location.href = u && isAnalystRole(u.role) ? '/admin-login' : '/login'; }
    },
    dashboard: { summary: () => get('/dashboard/summary'), scan: () => post('/dashboard/scan') },
    system: { livePosture: () => get('/system/live-posture'), runHealthCheck: () => post('/system/run-health-check') },
    alerts: { list: (status, limit = 200) => get('/alerts', { status, limit }), update: (id, b) => patch('/alerts/' + id, b), explain: id => post(`/alerts/${id}/explain`) },
    incidents: { list: (limit = 100) => get('/incidents', { limit }), update: (id, b) => patch('/incidents/' + id, b) },
    devices: { list: (limit = 100) => get('/devices', { limit }), register: d => post('/devices', d), isolate: id => post(`/devices/${id}/isolate`) },
    users: { list: () => get('/users'), create: u => post('/users', u), toggleStatus: id => patch(`/users/${id}/status`), delete: id => del(`/users/${id}`) },
    collectors: { status: () => get('/collectors/status'), toggle: (n, action) => post(`/collectors/${n}/toggle`, { action }) },
    threats: { list: (limit = 100) => get('/threats', { limit }) },
    url: { scan: u => post('/url/scan', { url: u }), history: (limit = 20) => get('/url/history', { limit }) },
    soar: { playbooks: () => get('/soar/playbooks'), execute: (id, params = {}, dry = false) => post('/soar/execute', { playbook_id: id, params, dry_run: dry }), stats: () => get('/soar/stats') },
    sandbox: { detonations: () => get('/sandbox/detonations'), submit: b => post('/sandbox/submit', b) },
    admin: { endpointsPosture: () => get('/admin/endpoints-posture'), accountsPosture: () => get('/admin/accounts-posture'), policies: () => get('/admin/policies'), updatePolicies: p => patch('/admin/policies', p) },
    raksha: { chat: (m, ctx = '') => post('/raksha/chat', { message: m, context: ctx }) },
    mitre: { heatmap: () => get('/mitre/heatmap') },
    threatIntel: { list: () => get('/threat-intel/indicators'), lookup: v => post('/threat-intel/lookup', { value: v }) },
    compliance: { status: () => get('/compliance/cert-in/status'), report: d => post('/compliance/cert-in/report', d) },
    mayajaal: { decoys: () => get('/mayajaal/decoys'), deploy: type => post('/mayajaal/deploy', { type }) },
    attackGraph: { data: id => get(`/attack-graph/incident/${id}`) },
    audit: { logs: () => get('/audit/logs'), verify: () => post('/audit/verify-chain') },
    enrollment: { devices: () => get('/enrollment/devices') },
    monitoring: { activity: (limit = 50) => get('/monitoring/activity', { limit }) },
    logs: { list: (stream, limit = 100) => get('/logs', { stream, limit }) },
    ml: { status: () => get('/ml/status') },
    account: {
      request: data => post('/account/request', data),
      status: id => get('/account/status/' + encodeURIComponent(id)),
      adminQueue: () => get('/account/requests/admin-queue'),
      adminReview: (id, action, notes, rejection_reason) => post(`/account/requests/${id}/admin-review`, { action, notes, rejection_reason }),
      analystQueue: () => get('/account/requests/analyst-queue'),
      analystReview: (id, action, notes, rejection_reason) => post(`/account/requests/${id}/analyst-review`, { action, notes, rejection_reason }),
      workload: () => get('/account/analysts/workload'),
      inviteAnalyst: data => post('/account/analysts/invite', data),
      users: params => get('/account/users', params),
      suspend: (id, reason) => post(`/account/users/${id}/suspend`, { reason }),
      reactivate: id => post(`/account/users/${id}/reactivate`, {})
    }
  };
  window.KAVACH = { api, session, isAnalystRole, isAdminRole, roleName, normalizeRole, isOffline: () => offline,
    esc: s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    ago: iso => { const m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000)); return isNaN(m) ? '—' : m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; } };
})();
