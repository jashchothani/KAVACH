/* KAVACH — shared behaviour: nav, reveal, counters, particle network, tilt, transitions */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Navbar ── */
  const nav = $('.nav'), burger = $('.burger'), links = $('.nav-links');
  const onScroll = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    nav && nav.classList.toggle('scrolled', y > 30);
    const p = $('#progress'); if (p) p.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    const t = $('.totop'); if (t) t.classList.toggle('show', y > 600);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (burger) burger.addEventListener('click', () => { burger.classList.toggle('open'); links.classList.toggle('open'); });
  const curPath = (location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/');
  $$('.nav-links a').forEach(a => {
    let target = (a.getAttribute('href') || '').replace(/\.html$/, '').replace(/\/$/, '') || '/';
    if (target === curPath) a.classList.add('active');
  });
  const totop = $('.totop'); if (totop) totop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  /* ── Page transitions ── */
  $$('a[href]').forEach(a => {
    const h = a.getAttribute('href');
    if (!h || h.startsWith('#') || h.startsWith('http') || h.startsWith('mailto') || a.target === '_blank' || a.hasAttribute('download')) return;
    a.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey) return;
      e.preventDefault(); document.body.classList.add('leaving');
      setTimeout(() => (location.href = h), 280);
    });
  });
  addEventListener('pageshow', e => e.persisted && document.body.classList.remove('leaving'));

  /* ── Scroll reveal ── */
  const io = new IntersectionObserver((es) => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach((el, i) => {
    if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', ((i % 4) * 0.09) + 's');
    io.observe(el);
  });

  /* ── Counters ── */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, to = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length,
      suf = el.dataset.suffix || '', pre = el.dataset.prefix || '', dur = 1800, t0 = performance.now();
    (function tick(t) {
      const k = Math.min((t - t0) / dur, 1), v = to * (1 - Math.pow(1 - k, 4));
      el.textContent = pre + v.toFixed(dec) + suf; if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }), { threshold: .5 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ── Meters & gauge ── */
  const mio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; mio.unobserve(e.target);
    $$('.meter .bar i', e.target).forEach(i => (i.style.width = i.dataset.w + '%'));
    const g = $('.gauge .bar', e.target);
    if (g) g.style.strokeDashoffset = 597 * (1 - parseFloat(g.dataset.v) / 100);
  }), { threshold: .3 });
  $$('[data-meters]').forEach(el => mio.observe(el));

  /* ── 3D tilt + spotlight cards ── */
  $$('.card').forEach(c => {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      c.style.setProperty('--mx', x + 'px'); c.style.setProperty('--my', y + 'px');
      if (!reduce && !c.hasAttribute('data-notilt')) {
        const rx = ((y / r.height) - .5) * -7, ry = ((x / r.width) - .5) * 7;
        c.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      }
    });
    c.addEventListener('pointerleave', () => (c.style.transform = ''));
  });

  /* ── Magnetic buttons ── */
  if (!reduce) $$('.btn-primary,.btn-ghost').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .15}px,${(e.clientY - r.top - r.height / 2) * .25 - 3}px)`;
    });
    b.addEventListener('pointerleave', () => (b.style.transform = ''));
  });

  /* ── Cursor glow ── */
  const glow = $('#cursor-glow');
  if (glow && matchMedia('(pointer:fine)').matches) {
    let gx = 0, gy = 0, tx = 0, ty = 0;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; });
    (function loop() { gx += (tx - gx) * .12; gy += (ty - gy) * .12; glow.style.left = gx + 'px'; glow.style.top = gy + 'px'; requestAnimationFrame(loop); })();
  }

  /* ── FAQ ── */
  $$('.faq').forEach(f => f.querySelector('button').addEventListener('click', () => {
    const open = f.classList.toggle('open'), a = f.querySelector('.a');
    a.style.maxHeight = open ? a.scrollHeight + 'px' : 0;
  }));

  /* ── Tabs ── */
  $$('[data-tabs]').forEach(w => {
    const tabs = $$('.tab', w), panels = $$('.panel', w);
    tabs.forEach((t, i) => t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.remove('on')); panels.forEach(x => x.classList.remove('on'));
      t.classList.add('on'); panels[i].classList.add('on');
    }));
  });

  /* ── Particle network background ── */
  const cv = $('#bg-canvas');
  if (cv && !reduce) {
    const ctx = cv.getContext('2d'); let W, H, pts = [], mx = -999, my = -999;
    const resize = () => {
      const d = Math.min(devicePixelRatio || 1, 2); W = cv.width = innerWidth * d; H = cv.height = innerHeight * d;
      cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
      const n = Math.min(110, Math.floor(innerWidth * innerHeight / 17000));
      pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35 * d, vy: (Math.random() - .5) * .35 * d, r: (Math.random() * 1.6 + .6) * d }));
    };
    resize(); addEventListener('resize', resize);
    addEventListener('pointermove', e => { const d = Math.min(devicePixelRatio || 1, 2); mx = e.clientX * d; my = e.clientY * d; });
    (function draw() {
      ctx.clearRect(0, 0, W, H);
      const d = Math.min(devicePixelRatio || 1, 2), L = 140 * d;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i]; p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
        const dx = p.x - mx, dy = p.y - my, dm = Math.hypot(dx, dy);
        if (dm < 160 * d) { p.x += dx / dm * 1.2; p.y += dy / dm * 1.2; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fillStyle = 'rgba(239,68,68,.7)'; ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j], dd = Math.hypot(p.x - q.x, p.y - q.y);
          if (dd < L) { ctx.strokeStyle = `rgba(220,38,38,${.22 * (1 - dd / L)})`; ctx.lineWidth = d * .7; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        }
        if (dm < 220 * d) { ctx.strokeStyle = `rgba(255,255,255,${.25 * (1 - dm / (220 * d))})`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mx, my); ctx.stroke(); }
      }
      requestAnimationFrame(draw);
    })();
  }

  /* ── Typewriter helper ── */
  window.typeWords = function (el, words, speed = 70, pause = 1600) {
    let w = 0, c = 0, del = false;
    (function step() {
      const word = words[w];
      el.textContent = word.slice(0, c);
      if (!del && c === word.length) { del = true; return setTimeout(step, pause); }
      if (del && c === 0) { del = false; w = (w + 1) % words.length; }
      c += del ? -1 : 1; setTimeout(step, del ? speed / 2 : speed);
    })();
  };

  /* ── Contact form demo ── */
  const cf = $('#contact-form');
  if (cf) cf.addEventListener('submit', e => {
    e.preventDefault(); const b = $('button', cf); b.disabled = true; b.textContent = 'Transmitting…';
    setTimeout(() => { $('.form-ok', cf).style.display = 'block'; b.textContent = 'Sent ✓'; cf.reset(); }, 1200);
  });

  /* ── Copy hash ── */
  $$('[data-copy]').forEach(b => b.addEventListener('click', () => {
    navigator.clipboard && navigator.clipboard.writeText(b.dataset.copy); const t = b.textContent; b.textContent = 'Copied ✓'; setTimeout(() => (b.textContent = t), 1500);
  }));
})();
