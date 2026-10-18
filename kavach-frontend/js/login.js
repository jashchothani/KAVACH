/* KAVACH — User Login: credentials → OTP → strictly /dashboard */
(function () {
  const $ = s => document.querySelector(s), K = window.KAVACH, api = K.api;
  let ident = '', timer = null, left = 0;

  // already signed in as user → go straight to /dashboard
  if (K.session.token() && K.session.user()) {
    location.replace('/dashboard');
    return;
  }

  const go = n => {
    document.querySelectorAll('.step-pane').forEach((p, i) => p.classList.toggle('on', i === n - 1));
    document.querySelectorAll('.stepper i').forEach((b, i) => b.classList.toggle('on', i < n));
    hideErr();
  };
  const showErr = m => { const e = $('#err'); e.textContent = m; e.classList.remove('show'); void e.offsetWidth; e.classList.add('show'); };
  const hideErr = () => $('#err').classList.remove('show');
  const syncBanner = () => $('#demo').classList.toggle('show', K.isOffline());
  const busy = (b, on, txt) => { b.disabled = on; if (txt) b.dataset.t = b.dataset.t || b.innerHTML, b.innerHTML = on ? txt : b.dataset.t; };

  $('#eye').onclick = () => { const p = $('#pass'); p.type = p.type === 'password' ? 'text' : 'password'; $('#eye').textContent = p.type === 'password' ? 'SHOW' : 'HIDE'; };

  /* OTP inputs */
  const box = $('#otp');
  for (let i = 0; i < 6; i++) box.insertAdjacentHTML('beforeend', '<input inputmode="numeric" maxlength="1" autocomplete="one-time-code" aria-label="Digit ' + (i + 1) + '">');
  const ins = [...box.children], code = () => ins.map(i => i.value).join('');
  ins.forEach((inp, i) => {
    inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, '').slice(-1); if (inp.value && ins[i + 1]) ins[i + 1].focus(); $('#b2').disabled = code().length !== 6; });
    inp.addEventListener('keydown', e => { if (e.key === 'Backspace' && !inp.value && ins[i - 1]) ins[i - 1].focus(); });
    inp.addEventListener('paste', e => { e.preventDefault(); const d = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6); d.split('').forEach((c, k) => ins[k].value = c); (ins[Math.min(d.length, 5)]).focus(); $('#b2').disabled = d.length !== 6; });
  });

  function startTimer() {
    clearInterval(timer); left = 60; $('#resend').style.display = 'none';
    timer = setInterval(() => { left--; $('#tm').textContent = left > 0 ? 'Resend in ' + left + 's' : ''; if (left <= 0) { clearInterval(timer); $('#resend').style.display = 'inline'; } }, 1000);
    $('#tm').textContent = 'Resend in 60s';
  }

  $('#f1').addEventListener('submit', async e => {
    e.preventDefault(); ident = $('#ident').value.trim(); const b = $('#b1'); busy(b, true, 'Verifying…');
    try {
      const r = await api.auth.loginInit(ident, $('#pass').value.trim());
      syncBanner(); $('#mail').textContent = r.full_email || r.email || ident;
      go(2); startTimer(); ins[0].focus();
    } catch (err) { showErr(err.network ? 'Cannot reach the KAVACH server.' : err.message || 'Invalid credentials.'); }
    finally { busy(b, false, 1); }
  });

  $('#f2').addEventListener('submit', async e => {
    e.preventDefault(); const b = $('#b2'); busy(b, true, 'Verifying…');
    try {
      const res = await api.auth.verifyOtp(ident, code());
      K.session.save(res);
      const u = K.session.user();
      $('#who').textContent = 'Signed in as ' + u.username;
      go(3);
      // Strictly redirect to User Dashboard
      setTimeout(() => (location.href = '/dashboard'), 1200);
    } catch (err) { showErr(err.message || 'Invalid or expired code.'); ins.forEach(i => (i.value = '')); ins[0].focus(); busy(b, false, 1); b.disabled = true; }
  });

  $('#resend').onclick = async () => { try { await api.auth.requestOtp(ident); startTimer(); } catch (e) { showErr(e.message); } };
  $('#back').onclick = () => { clearInterval(timer); go(1); };

})();
