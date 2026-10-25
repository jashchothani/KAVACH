/* KAVACH — shared auth controller: credentials → OTP → role-based redirect. Real backend only. */
(function () {
  const $ = s => document.querySelector(s), K = window.KAVACH, api = K.api, staff = document.body.dataset.mode === 'staff';
  const isHtml = location.protocol === 'file:' || location.pathname.endsWith('.html');
  const home = r => isHtml
    ? (K.isAdminRole(r) ? 'admin.html' : K.isAnalystRole(r) ? 'soc.html' : 'dashboard.html')
    : (K.isAdminRole(r) ? '/admin' : K.isAnalystRole(r) ? '/soc' : '/dashboard');
  const u0 = K.session.user();
  if (K.session.token() && u0) {
    const h = home(u0.role);
    if (staff ? !h.includes('dashboard') : h.includes('dashboard')) { location.replace(h); return; }
  }
  /* theme (shared with the website) */
  const root = document.documentElement; let th = 'dark'; try { th = localStorage.getItem('kavach-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'); } catch (e) {}
  root.dataset.theme = th; const setT = t => { root.dataset.theme = th = t; try { localStorage.setItem('kavach-theme', t); } catch (e) {} };
  $('#theme').onclick = e => { const n = th === 'dark' ? 'light' : 'dark'; if (!document.startViewTransition) return setT(n); const r = e.currentTarget.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
    document.startViewTransition(() => setT(n)).ready.then(() => root.animate({ clipPath: [`circle(0 at ${cx}px ${cy}px)`, `circle(${R}px at ${cx}px ${cy}px)`] }, { duration: 750, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' })); };
  /* animated network background */
  const cv = $('#net'), x = cv.getContext('2d'); let W, H, P = [], mx = -1e3, my = -1e3;
  const size = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; P = Array.from({ length: Math.min(90, W * H / 17000 | 0) }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35 })); };
  addEventListener('resize', size); addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }); size();
  (function loop() {
    x.clearRect(0, 0, W, H); const c = getComputedStyle(root).getPropertyValue('--node') || '200,39,45';
    P.forEach((p, i) => { p.x = (p.x + p.vx + W) % W; p.y = (p.y + p.vy + H) % H; x.fillStyle = `rgba(${c},.7)`; x.beginPath(); x.arc(p.x, p.y, 1.6, 0, 6.3); x.fill();
      for (let j = i + 1; j < P.length; j++) { const q = P[j], d = Math.hypot(p.x - q.x, p.y - q.y); if (d < 130) { x.strokeStyle = `rgba(${c},${.16 * (1 - d / 130)})`; x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(q.x, q.y); x.stroke(); } }
      const m = Math.hypot(p.x - mx, p.y - my); if (m < 170) { x.strokeStyle = `rgba(${c},${.4 * (1 - m / 170)})`; x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(mx, my); x.stroke(); } });
    requestAnimationFrame(loop);
  })();
  /* flow */
  let ident = '', timer, pollTimer = null;
  const pollMobileApproval = (chId) => {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(async () => {
      try {
        const ch = await api.auth.mobileChallengeStatus(chId);
        if (ch && ch.status === 'APPROVED' && ch.access_token) {
          clearInterval(pollTimer);
          clearInterval(timer);
          if (staff && !K.isAnalystRole(ch.role)) {
            err('Access denied: this portal is for SOC analysts and administrators.');
            return;
          }
          K.session.save(ch);
          const u = K.session.user();
          $('#who').textContent = 'Signed in as ' + u.username + ' · ' + u.role_name;
          go(3);
          setTimeout(() => location.href = home(u.role), 1000);
        } else if (ch && (ch.status === 'EXPIRED' || ch.status === 'REJECTED')) {
          clearInterval(pollTimer);
          const mb = $('#mobile-prompt-box');
          if (mb) mb.style.display = 'none';
        }
      } catch (e) {}
    }, 1500);
  };

  const go = n => {
    if (n === 1 && pollTimer) clearInterval(pollTimer);
    document.querySelectorAll('.pane').forEach((p, i) => p.classList.toggle('on', i === n - 1));
    document.querySelectorAll('.steps i').forEach((b, i) => b.classList.toggle('on', i < n));
    $('#err').classList.remove('show');
  };
  const err = m => { const e = $('#err'); e.textContent = m; e.classList.remove('show'); void e.offsetWidth; e.classList.add('show'); };
  const busy = (b, on, t) => { b.dataset.t = b.dataset.t || b.innerHTML; b.disabled = on; b.innerHTML = on ? '<span class="sp"></span>' + t : b.dataset.t; };
  $('#eye').onclick = () => { const p = $('#pass'); p.type = p.type === 'password' ? 'text' : 'password'; $('#eye').textContent = p.type === 'password' ? 'SHOW' : 'HIDE'; };
  const box = $('#otp'); for (let i = 0; i < 6; i++) box.insertAdjacentHTML('beforeend', `<input inputmode="numeric" maxlength="1" placeholder=" " autocomplete="one-time-code" aria-label="Digit ${i + 1}">`);
  const ins = [...box.children], code = () => ins.map(i => i.value).join(''), sync = () => $('#b2').disabled = code().length !== 6;
  ins.forEach((inp, i) => { inp.oninput = () => { inp.value = inp.value.replace(/\D/g, '').slice(-1); if (inp.value && ins[i + 1]) ins[i + 1].focus(); sync(); };
    inp.onkeydown = e => { if (e.key === 'Backspace' && !inp.value && ins[i - 1]) ins[i - 1].focus(); };
    inp.onpaste = e => { e.preventDefault(); const d = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6); d.split('').forEach((c, k) => ins[k].value = c); ins[Math.min(d.length, 5)].focus(); sync(); }; });
  const tick = () => { clearInterval(timer); let l = 60; $('#resend').style.display = 'none'; $('#tm').textContent = 'Resend in 60s'; timer = setInterval(() => { l--; $('#tm').textContent = l > 0 ? 'Resend in ' + l + 's' : ''; if (l <= 0) { clearInterval(timer); $('#resend').style.display = 'inline'; } }, 1000); };
  
  $('#f1').onsubmit = async e => {
    e.preventDefault();
    ident = $('#ident').value.trim();
    const b = $('#b1');
    busy(b, true, 'Verifying…');
    try {
      const r = await api.auth.loginInit(ident, $('#pass').value);
      const emailDisplay = r.full_email || r.email || ident;
      $('#mail').textContent = emailDisplay;

      if (r.match_number && r.challenge_id) {
        let twoFaWrap = $('#twofa-dual-wrap');
        const pane2 = document.querySelectorAll('.pane')[1];
        if (!twoFaWrap) {
          const origH2 = pane2.querySelector('h2');
          const origSub = pane2.querySelector('p.sub');
          if (origH2) origH2.style.display = 'none';
          if (origSub) origSub.style.display = 'none';

          const avatarChar = (emailDisplay || 'K').trim().charAt(0).toUpperCase();

          pane2.insertAdjacentHTML('afterbegin', `
            <div id="twofa-dual-wrap" class="google-verify-card">
              <!-- Google-Style Header (Ref Image 5) -->
              <div class="google-brand-header">
                <img src="assets/logo.png" alt="KAVACH">
              </div>
              <h2 class="google-verify-title">Verify it’s you</h2>
              <p class="google-verify-sub">KAVACH wants to make sure it’s you trying to access your security console</p>

              <!-- Account Pill Chip -->
              <div class="google-account-pill">
                <span class="google-avatar">${avatarChar}</span>
                <span class="google-account-email">${emailDisplay}</span>
                <svg class="google-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
              </div>

              <!-- Main Mobile Prompt View (Google Phone Illustration) -->
              <div id="view-mobile" style="text-align:center">
                <div class="google-phone-art">
                  <div class="google-signal-ring"></div>
                  <svg class="google-phone-svg" viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="14" y="8" width="72" height="124" rx="14" fill="#FFFFFF" stroke="#0F172A" stroke-width="3"/>
                    <rect x="38" y="14" width="24" height="3" rx="1.5" fill="#475569"/>
                    <rect x="18" y="22" width="64" height="98" rx="6" fill="#F8FAFC"/>
                    <rect x="22" y="38" width="56" height="44" rx="7" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2"/>
                    <circle cx="30" cy="48" r="4.5" fill="#C8272D"/>
                    <rect x="38" y="46" width="28" height="4" rx="2" fill="#334155"/>
                    <rect x="28" y="56" width="44" height="3" rx="1.5" fill="#94A3B8"/>
                    <rect x="40" y="66" width="32" height="11" rx="5.5" fill="#10B981"/>
                    <path d="M52 71.5l2.5 2.5 4.5-4.5" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>

                <div class="google-check-phone-title">Check your KAVACH App</div>
                <div class="google-check-phone-desc">KAVACH sent a notification to your phone. Tap Yes on the notification, then tap <strong style="color:var(--t1)">${r.match_number}</strong> on your phone to continue.</div>

                <div id="mobile-match-num" style="font-size:3.8rem;font-weight:700;color:var(--t1);letter-spacing:2px;margin:14px 0 6px;line-height:1;font-family:'Google Sans',Roboto,Inter,sans-serif">${r.match_number}</div>

                <div>
                  <button type="button" id="btn-switch-to-email" class="google-try-another-btn">More ways to sign in</button>
                </div>
              </div>
            </div>
          `);

          const viewMob = $('#view-mobile');
          const f2 = $('#f2');
          const metaP = pane2.querySelector('p.meta');
          const switchToEm = $('#btn-switch-to-email');

          let emailOtpDispatched = false;

          const showMob = () => {
            viewMob.style.display = 'block';
            f2.style.display = 'none';
            if (metaP) metaP.style.display = 'none';
          };

          const showEm = async () => {
            viewMob.style.display = 'none';
            f2.style.display = 'block';
            if (metaP) metaP.style.display = 'block';

            // Add Return to phone link if not already present
            let backToMob = $('#back-to-phone-prompt');
            if (!backToMob) {
              f2.insertAdjacentHTML('afterend', `
                <div id="back-to-phone-prompt" style="text-align:center;margin-top:10px">
                  <button type="button" id="btn-return-to-phone" class="google-try-another-btn" style="font-size:0.8rem">← Back to phone verification</button>
                </div>
              `);
              $('#btn-return-to-phone').onclick = showMob;
            } else {
              backToMob.style.display = 'block';
            }

            ins[0].focus();

            // Strictly send email OTP ONLY when the user clicks 'Try another way'
            if (!emailOtpDispatched) {
              emailOtpDispatched = true;
              try {
                let note = $('#email-otp-notice');
                if (!note) {
                  f2.insertAdjacentHTML('afterbegin', '<div id="email-otp-notice" style="font-size:0.8rem;color:#0284c7;text-align:center;margin-bottom:12px;font-weight:600;padding:6px 12px;background:rgba(2,132,199,0.08);border-radius:8px;border:1px solid rgba(2,132,199,0.2)">Sending verification code…</div>');
                  note = $('#email-otp-notice');
                }
                note.style.color = '#0284c7';
                note.textContent = 'Sending verification code to ' + emailDisplay + '…';
                await api.auth.requestOtp(ident);
                note.style.color = '#059669';
                note.textContent = '✓ Verification code sent to ' + emailDisplay;
                tick();
              } catch (ex) {
                emailOtpDispatched = false;
                err(ex.message || 'Failed to dispatch email verification code.');
              }
            }
          };

          if (switchToEm) switchToEm.onclick = showEm;

          // Default strictly to Google phone verification
          showMob();
        } else {
          twoFaWrap.style.display = 'block';
          const viewMob = $('#view-mobile');
          if (viewMob) viewMob.style.display = 'block';
          const f2 = $('#f2');
          if (f2) f2.style.display = 'none';
        }

        const mn = $('#mobile-match-num');
        if (mn) mn.textContent = r.match_number;
        pollMobileApproval(r.challenge_id);
      }

      go(2);
      sync();
      ins.forEach(i => i.value = '');
    } catch (er) {
      err(er.network ? 'Cannot reach the KAVACH server. Check your connection and try again.' : er.message || 'Invalid credentials.');
    } finally {
      busy(b, false);
    }
  };


  $('#f2').onsubmit = async e => {
    e.preventDefault();
    const b = $('#b2');
    busy(b, true, 'Verifying…');
    try {
      const res = await api.auth.verifyOtp(ident, code());
      if (staff && !K.isAnalystRole(res.role)) {
        busy(b, false);
        err('Access denied: this portal is for SOC analysts and administrators. Use the user sign-in instead.');
        return;
      }
      K.session.save(res);
      const u = K.session.user();
      $('#who').textContent = 'Signed in as ' + u.username + ' · ' + u.role_name;
      go(3);
      setTimeout(() => location.href = home(u.role), 1200);
    } catch (er) {
      err(er.message || 'Invalid or expired code.');
      ins.forEach(i => i.value = '');
      ins[0].focus();
      busy(b, false);
      b.disabled = true;
    }
  };

  $('#resend').onclick = async () => {
    try {
      await api.auth.requestOtp(ident);
      ins.forEach(i => i.value = '');
      sync();
      ins[0].focus();
      tick();
    } catch (er) { err(er.message); }
  };
  $('#back').onclick = () => { clearInterval(timer); go(1); };

  /* WebGL fluid gradient (same shader family as the website hero) */
  (function () {
    const c = $('#gl'), gl = c.getContext('webgl', { antialias: false }); if (!gl || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const PAL = { dark: [['#090608', '#8A1C22', '#3A1219', '#4A0F16', '#E5484D'], ['#05080E', '#0E4A5C', '#1A3A66', '#0A2A3A', '#D4688C'], ['#060810', '#1E3FA0', '#0F6A85', '#2A2560', '#8C93E0']],
      light: [['#F5EFEE', '#F2C4BE', '#F7E0D4', '#EBD3D8', '#F0A8A8'], ['#EEF1F6', '#BCD8EE', '#E8C8D6', '#D4E4F0', '#F4B6C6'], ['#EEF0F7', '#BCCBF2', '#BFE2EA', '#DAD6F0', '#B8BFF0']] };
    const rgb = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16) / 255);
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}'));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, `precision highp float;varying vec2 vUv;uniform float t,light;uniform vec2 res,mouse;uniform vec3 base,c0,c1,c2,c3;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.02+vec2(3.1,1.7);a*=.5;}return v;}
void main(){vec2 uv=vUv;vec2 p=uv*vec2(res.x/res.y,1.)*1.5;float tt=t*.07;
vec2 q=vec2(fbm(p+tt),fbm(p+vec2(5.2,1.3)-tt));vec2 r=vec2(fbm(p+3.*q+vec2(1.7,9.2)+tt*1.5),fbm(p+3.*q+vec2(8.3,2.8)-tt));float f=fbm(p+3.*r);
vec3 col=mix(base,c0,smoothstep(.15,.8,f));col=mix(col,c1,smoothstep(.3,.95,length(q))*.8);col=mix(col,c2,smoothstep(.4,1.,r.x)*.7);
vec2 g=vec2(.5+.12*sin(t*.3),.5+.1*cos(t*.25));col+=c3*smoothstep(.55,0.,distance(uv*vec2(res.x/res.y,1.),g*vec2(res.x/res.y,1.)))*(.34-light*.1);
col+=c3*smoothstep(.4,0.,distance(uv,mouse))*.2;float v=smoothstep(1.25,.15,distance(uv,vec2(.5)));col=mix(base,col,.4+.6*v);col+=(hash(uv*res+fract(t))-.5)*.03;gl_FragColor=vec4(col,1.);}`));
    gl.linkProgram(pr); gl.useProgram(pr); const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    const U = n => gl.getUniformLocation(pr, n), K5 = ['base', 'c0', 'c1', 'c2', 'c3'], cur = K5.map(() => [0, 0, 0]); let lt = 0, idx = staff ? 0 : 0, m = [.5, .5], mt = [.5, .5], t0 = performance.now(), sw = t0;
    const rs = () => { const d = Math.min(devicePixelRatio || 1, 1.25); c.width = innerWidth * d | 0; c.height = innerHeight * d | 0; gl.viewport(0, 0, c.width, c.height); }; rs(); addEventListener('resize', rs);
    addEventListener('pointermove', e => { mt = [e.clientX / innerWidth, 1 - e.clientY / innerHeight]; });
    (function fr(now) { requestAnimationFrame(fr); if (document.hidden) return; const L = root.dataset.theme === 'light'; if (now - sw > 9000) { idx = (idx + 1) % 3; sw = now; }
      const pal = PAL[L ? 'light' : 'dark'][staff && !L ? (idx === 1 ? 2 : idx) : idx]; K5.forEach((k, i) => { const tg = rgb(pal[i]); cur[i] = cur[i].map((v, n) => v + (tg[n] - v) * .03); gl.uniform3fv(U(k), cur[i]); });
      lt += ((L ? 1 : 0) - lt) * .06; m = m.map((v, i) => v + (mt[i] - v) * .05); gl.uniform1f(U('t'), (now - t0) / 1000); gl.uniform1f(U('light'), lt); gl.uniform2f(U('res'), c.width, c.height); gl.uniform2f(U('mouse'), m[0], m[1]); gl.drawArrays(gl.TRIANGLES, 0, 3); })(t0);
  })();
  /* card tilt + spotlight, magnetic buttons */
  const card = $('#card'); addEventListener('pointermove', e => { const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height, near = px > -.4 && px < 1.4 && py > -.4 && py < 1.4;
    card.style.setProperty('--ry', near ? (px - .5) * 7 + 'deg' : '0deg'); card.style.setProperty('--rx', near ? (.5 - py) * 7 + 'deg' : '0deg'); card.style.setProperty('--mx', px * 100 + '%'); card.style.setProperty('--my', py * 100 + '%'); });
  document.querySelectorAll('[data-mag]').forEach(b => { b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .12}px,${(e.clientY - r.top - r.height / 2) * .3 - 2}px)`; }); b.addEventListener('pointerleave', () => b.style.transform = ''); });
})();
