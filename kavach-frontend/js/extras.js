(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* active link + mobile CTA + stagger index */
  const f = location.pathname.split('/').pop() || 'index.html', ul = $('#links'), b = $('#burger');
  $$('#links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === f));
  if (ul) {
    $$('#links li').forEach((li, i) => li.firstElementChild && li.firstElementChild.style.setProperty('--k', i));
    const li = document.createElement('li'); li.className = 'm-cta'; li.style.setProperty('--k', 7);
    li.innerHTML = '<a class="btn btn-download" href="/download">Download Agent ↓</a><a class="btn" href="/login">Sign in</a><a class="btn btn-fill" href="/get-started">Get Started <span class="ar">→</span></a>'; ul.appendChild(li);
    li.querySelectorAll('a').forEach(a => a.style.setProperty('--k', 7));
  }
  const close = () => { ul && ul.classList.remove('open'); b && b.classList.remove('open'); document.body.classList.remove('menu-open') };
  if (b) b.onclick = () => { const o = !ul.classList.contains('open'); ul.classList.toggle('open', o); b.classList.toggle('open', o); document.body.classList.toggle('menu-open', o) };
  ul && ul.addEventListener('click', e => { if (e.target.closest('a')) close() });
  addEventListener('keydown', e => { if (e.key === 'Escape') close() });
  addEventListener('resize', () => { if (innerWidth > 1180) close() });

  /* signature */
  const sg = $('#sign'), sb = $('.sign-b');
  if (sg && sb) {
    let i = 0; const t = sb.textContent; sb.textContent = '';
    t.split(' ').forEach(w => { const wd = document.createElement('span'); wd.className = 'wd'; [...w].forEach(c => { const s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', i++); s.textContent = c; wd.appendChild(s) }); sb.appendChild(wd) });
    let vis = false, timer;
    new IntersectionObserver(es => es.forEach(e => {
      vis = e.isIntersecting; if (vis) sg.classList.add('in');
      clearInterval(timer); if (vis && !reduce) timer = setInterval(() => {
        const h = document.createElement('span'); h.className = 'fh'; h.textContent = '♥';
        h.style.cssText = `left:${Math.random() * 100}%;font-size:${10 + Math.random() * 20}px;--d:${5 + Math.random() * 4}s;--x:${(Math.random() - .5) * 120}px;--r:${(Math.random() - .5) * 60}deg`;
        $('.sign-hearts').appendChild(h); setTimeout(() => h.remove(), 9500)
      }, 650)
    }), { threshold: .25 }).observe(sg);
  }

  /* page leave transition */
  const lv = document.createElement('div'); lv.id = 'leave'; document.body.appendChild(lv);
  addEventListener('pageshow', e => { if (e.persisted) lv.classList.remove('on') });
  document.addEventListener('click', e => {
    const a = e.target.closest('a'); if (!a || reduce || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    const h = a.getAttribute('href'); if (!h || h[0] === '#' || a.target || /^(https?:|mailto:|tel:|javascript:)/.test(h) || !/\.html($|[?#])/.test(h)) return;
    e.preventDefault(); lv.classList.add('on'); setTimeout(() => location.href = h, 480)
  });
})();
