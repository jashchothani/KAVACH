/* KAVACH — API client. REAL DATA ONLY: every call goes to the FastAPI backend (/api/v1). Resilient direct fallback & zero data loss. */
(function () {
  const isFile = location.protocol === 'file:';
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  
  // Resolves to local FastAPI on port 8000 for file/dev, and relative /api/v1 for all browser deployments (Nginx reverse proxy)
  let defaultBase = '/api/v1';
  let directFallback = 'http://127.0.0.1:8000/api/v1';

  if (isFile) {
    defaultBase = 'http://127.0.0.1:8000/api/v1';
    directFallback = 'http://127.0.0.1:8000/api/v1';
  } else if (isLocal && location.port !== '' && location.port !== '80' && location.port !== '443') {
    // If browsing local static dev server (e.g. Live Server port 5500, Vite 5173, etc.), route directly to FastAPI backend on 8000
    defaultBase = 'http://127.0.0.1:8000/api/v1';
    directFallback = 'http://127.0.0.1:8000/api/v1';
  } else {
    // Production Nginx reverse proxy
    defaultBase = '/api/v1';
    directFallback = `${location.protocol}//${location.hostname}:8000/api/v1`;
  }

  window.KAVACH_CONFIG = Object.assign({
    apiBase: defaultBase,
    directBase: directFallback,
    timeout: 30000
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
      // Automatic fallback to direct backend if proxy gave 502, 404, or network error
      const directUrl = C.directBase + path + q;
      if ((err.network || err.status === 502 || err.status === 404 || err.status === 504) && C.directBase && primaryUrl !== directUrl) {
        try {
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
    compliance: { frameworks: () => get('/compliance/frameworks') },
    reports: { executive: (p = '7d') => get('/reports/executive', { period: p }), generate: b => post('/reports/generate', b) },
    network: { topology: () => get('/network/topology') },
    threatIntel: { feeds: () => get('/threat-intel/feeds'), lookup: (v, t = 'ip') => get('/threat-intel/lookup', { value: v, type: t }) },
    sandbox: { submit: (f, b) => {
      const fd = new FormData();
      fd.append('file', f);
      if (b && b.analysis_type) fd.append('analysis_type', b.analysis_type);
      const headers = { 'X-Request-ID': 'web-' + Math.random().toString(36).slice(2, 10) };
      const t = session.token();
      if (t) headers.Authorization = 'Bearer ' + t;
      return fetch(C.apiBase + '/sandbox/submit', { method: 'POST', headers, body: fd }).then(async r => {
        if (!r.ok) {
          let d = {};
          try { d = await r.json(); } catch {}
          throw new Error((d.error && (d.error.message || d.error.detail)) || d.detail || ('HTTP ' + r.status));
        }
        return r.json();
      });
    }, results: id => get('/sandbox/results/' + id), list: (limit = 50) => get('/sandbox/samples', { limit }) },
    ai: { query: (q, ctx) => post('/raksha/query', { question: q, context: ctx }), feedback: b => post('/raksha/feedback', b) },
    ws: {
      connect(onMsg, onErr) {
        let wsUrl;
        if (C.apiBase.startsWith('http://') || C.apiBase.startsWith('https://')) {
          const u = new URL(C.apiBase);
          wsUrl = (u.protocol === 'https:' ? 'wss://' : 'ws://') + u.host + '/ws/events';
        } else {
          const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
          wsUrl = `${proto}//${location.host}/ws/events`;
        }
        const t = session.token();
        if (t) wsUrl += '?token=' + encodeURIComponent(t);
        try {
          const ws = new WebSocket(wsUrl);
          ws.onmessage = e => { try { onMsg && onMsg(JSON.parse(e.data)); } catch {} };
          ws.onerror = onErr || (() => {});
          return ws;
        } catch (e) {
          onErr && onErr(e);
          return null;
        }
      }
    }
  };

  window.KAVACH = { api, session, config: C, isOffline: () => offline };
})();
