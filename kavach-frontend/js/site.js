(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const root = document.documentElement, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const FRAG = "precision highp float;varying vec2 vUv;uniform float t,light;uniform vec2 res,mouse;uniform vec3 base,c0,c1,c2,c3;\nfloat hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\nfloat noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}\nfloat fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.02+vec2(3.1,1.7);a*=.5;}return v;}\nvoid main(){vec2 uv=vUv;vec2 p=uv*vec2(res.x/res.y,1.)*1.5;float tt=t*.07;\n vec2 q=vec2(fbm(p+tt),fbm(p+vec2(5.2,1.3)-tt));\n vec2 r=vec2(fbm(p+3.*q+vec2(1.7,9.2)+tt*1.5),fbm(p+3.*q+vec2(8.3,2.8)-tt));\n float f=fbm(p+3.*r);\n vec3 col=mix(base,c0,smoothstep(.15,.8,f));\n col=mix(col,c1,smoothstep(.3,.95,length(q))*.8);\n col=mix(col,c2,smoothstep(.4,1.,r.x)*.7);\n vec2 g=vec2(.8+.05*sin(t*.3),.38+.06*cos(t*.25));\n col+=c3*smoothstep(.5,0.,distance(uv*vec2(res.x/res.y,1.),g*vec2(res.x/res.y,1.)))*(.34-light*.1);\n col+=c3*smoothstep(.4,0.,distance(uv,mouse))*.2;\n float v=smoothstep(1.25,.15,distance(uv,vec2(.5)));col=mix(base,col,.4+.6*v);\n col+=(hash(uv*res+fract(t))-.5)*.03;gl_FragColor=vec4(col,1.);}";

  /* grain */
  (() => { const c = document.createElement('canvas'); c.width = c.height = 160; const x = c.getContext('2d'), d = x.createImageData(160, 160); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255 } x.putImageData(d, 0, 0); root.style.setProperty('--grain', `url(${c.toDataURL()})`) })();

  /* theme with circular reveal */
  function setTheme(t) { root.dataset.theme = t; try { localStorage.setItem('kavach-theme', t) } catch (e) { } const m = $('meta[name=theme-color]'); if (m) m.content = t === 'light' ? '#F4F5F8' : '#05080E' }
  setTheme(root.dataset.theme || 'dark');
  $('#theme').onclick = e => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    if (!document.startViewTransition || reduce) { setTheme(next); return }
    const x = e.clientX, y = e.clientY, r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(() => setTheme(next)).ready.then(() => root.animate({ clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] }, { duration: 750, easing: 'cubic-bezier(.65,0,.35,1)', pseudoElement: '::view-transition-new(root)' })).catch(() => { })
  };

  /* WebGL hero: fluid gradient + particle network */
  const PAL = {
    dark: [['#05080E', '#0E4A5C', '#1A3A66', '#0A2A3A', '#D4688C'], ['#090608', '#8A1C22', '#3A1219', '#4A0F16', '#E5484D'], ['#060810', '#1E3FA0', '#0F6A85', '#2A2560', '#8C93E0']],
    light: [['#EEF1F6', '#BCD8EE', '#E8C8D6', '#D4E4F0', '#F4B6C6'], ['#F5EFEE', '#F2C4BE', '#F7E0D4', '#EBD3D8', '#F0A8A8'], ['#EEF0F7', '#BCCBF2', '#BFE2EA', '#DAD6F0', '#B8BFF0']]
  };
  function initGL(h) {
    const bg = h.querySelector('.hbg'); if (!bg || typeof THREE === 'undefined' || reduce) return;
    try {
      const cv = bg.querySelector('canvas'), pr = Math.min(devicePixelRatio || 1, 1.5), idx = +bg.dataset.pal || 0, C = x => new THREE.Color(x);
      const rn = new THREE.WebGLRenderer({ canvas: cv, antialias: false }); rn.setPixelRatio(pr);
      const sc = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10); cam.position.z = 5;
      const u = { t: { value: 0 }, light: { value: 0 }, res: { value: new THREE.Vector2(1, 1) }, mouse: { value: new THREE.Vector2(.7, .5) } };
      const K = ['base', 'c0', 'c1', 'c2', 'c3']; K.forEach((k, i) => u[k] = { value: C(PAL.dark[idx][i]) });
      const mat = new THREE.ShaderMaterial({ uniforms: u, depthTest: false, depthWrite: false, vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}', fragmentShader: FRAG });
      const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); q.frustumCulled = false; q.renderOrder = -1; sc.add(q);
      const N = 70, pos = new Float32Array(N * 3), vel = [], MAXL = N * 6;
      for (let i = 0; i < N; i++) { vel.push([(Math.random() - .5) * .0007, (Math.random() - .5) * .0007]); pos[i * 3] = (Math.random() - .5) * 3; pos[i * 3 + 1] = Math.random() * 2 - 1 }
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pm = new THREE.PointsMaterial({ size: 2.4 * pr, sizeAttenuation: false, transparent: true, opacity: .7, depthTest: false }), pts = new THREE.Points(pg, pm); pts.renderOrder = 2;
      const lp = new Float32Array(MAXL * 6), lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3)); lg.setDrawRange(0, 0);
      const lm = new THREE.LineBasicMaterial({ transparent: true, opacity: .14, depthTest: false }), lines = new THREE.LineSegments(lg, lm); lines.renderOrder = 1;
      const grp = new THREE.Group(); grp.add(lines, pts); sc.add(grp);
      let asp = 1, W = 1, H = 1;
      const size = () => { W = h.clientWidth; H = h.clientHeight; rn.setSize(W, H, false); asp = W / H; cam.left = -asp; cam.right = asp; cam.updateProjectionMatrix(); u.res.value.set(W, H) };
      new ResizeObserver(size).observe(h); size();
      const mt = new THREE.Vector2(.7, .5); addEventListener('mousemove', e => mt.set(e.clientX / innerWidth, 1 - Math.min(e.clientY, H) / H));
      let vis = true; new IntersectionObserver(e => vis = e[0].isIntersecting).observe(h);
      const clock = new THREE.Clock();
      (function frame() {
        requestAnimationFrame(frame); if (!vis || document.hidden) return;
        const L = root.dataset.theme === 'light', pal = PAL[L ? 'light' : 'dark'][idx];
        K.forEach((k, i) => u[k].value.lerp(C(pal[i]), .06)); u.light.value += ((L ? 1 : 0) - u.light.value) * .06; u.t.value = clock.getElapsedTime(); u.mouse.value.lerp(mt, .05);
        const col = L ? 0x2A3140 : 0xffffff; pm.color.setHex(col); lm.color.setHex(col); pm.opacity = L ? .55 : .7; lm.opacity = L ? .18 : .14;
        for (let i = 0; i < N; i++) { pos[i * 3] += vel[i][0]; pos[i * 3 + 1] += vel[i][1]; if (pos[i * 3] > asp + .1) pos[i * 3] = -asp - .1; if (pos[i * 3] < -asp - .1) pos[i * 3] = asp + .1; if (pos[i * 3 + 1] > 1.1) pos[i * 3 + 1] = -1.1; if (pos[i * 3 + 1] < -1.1) pos[i * 3 + 1] = 1.1 }
        pg.attributes.position.needsUpdate = true;
        let n = 0; for (let i = 0; i < N && n < MAXL; i++)for (let j = i + 1; j < N && n < MAXL; j++) { const dx = pos[i * 3] - pos[j * 3], dy = pos[i * 3 + 1] - pos[j * 3 + 1]; if (dx * dx + dy * dy < .05) { lp.set([pos[i * 3], pos[i * 3 + 1], 0, pos[j * 3], pos[j * 3 + 1], 0], n * 6); n++ } }
        lg.setDrawRange(0, n * 2); lg.attributes.position.needsUpdate = true;
        grp.position.x += ((mt.x - .5) * -.06 - grp.position.x) * .05; grp.position.y += ((mt.y - .5) * -.06 - grp.position.y) * .05;
        rn.render(sc, cam)
      })();
      bg.classList.add('gl');
    } catch (err) { console.warn('WebGL unavailable, using CSS gradients', err) }
  }
  $$('.page-hero').forEach(initGL);

  /* split words */
  function split(el) { let i = 0; (function walk(n) { [...n.childNodes].forEach(c => { if (c.nodeType === 3) { const f = document.createDocumentFragment(); c.textContent.split(/(\s+)/).forEach(t => { if (t === '') return; if (/^\s+$/.test(t)) f.appendChild(document.createTextNode(' ')); else { const w = document.createElement('span'); w.className = 'w'; const s = document.createElement('span'); s.style.setProperty('--i', i++); s.textContent = t; w.appendChild(s); f.appendChild(w) } }); c.replaceWith(f) } else if (c.nodeType === 1) walk(c) }) })(el) }
  $$('.sw').forEach(split);

  /* counters */
  function count(el) {
    if (el.dataset.done) return; el.dataset.done = 1;
    const raw = el.dataset.count, end = +raw, dec = (raw.split('.')[1] || '').length, pre = el.dataset.prefix || '', t0 = performance.now();
    (function f(t) { const p = Math.min((t - t0) / 2000, 1), v = end * (1 - Math.pow(1 - p, 4)); el.textContent = pre + v.toFixed(dec); if (p < 1) requestAnimationFrame(f) })(t0)
  }

  /* reveal observer (starts after curtain lifts) */
  function startObs() {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; const el = e.target; io.unobserve(el);
      const sib = el.parentElement ? [...el.parentElement.children].filter(c => c.classList.contains('reveal')) : [], d = Math.max(0, sib.indexOf(el)) * 90;
      if (!el.classList.contains('sw') && d) { el.style.transitionDelay = d + 'ms'; setTimeout(() => el.style.transitionDelay = '', 1500 + d) }
      el.classList.add('in'); if (el.matches('[data-count]')) count(el); el.querySelectorAll('[data-count]').forEach(count)
    }), { threshold: .15, rootMargin: '0px 0px -4% 0px' });
    $$('.reveal,.sw,[data-count]').forEach(e => io.observe(e));
  }

  /* preloader */
  let seen = false; try { seen = sessionStorage.getItem('kv-seen') } catch (e) { }
  const DUR = reduce ? 150 : (seen ? 450 : 1000), t0 = performance.now(); let fin = false;
  (function pl(t) { const p = Math.min((t - t0) / DUR, 1), e = 1 - Math.pow(1 - p, 3); $('#prebar').style.transform = `scaleX(${e})`; $('#pren').textContent = Math.round(e * 100) + '%'; if (p < 1) requestAnimationFrame(pl); else finish() })(t0);
  function finish() { if (fin) return; fin = true; try { sessionStorage.setItem('kv-seen', '1') } catch (e) { } $('#pre').classList.add('done'); document.body.classList.remove('lock'); document.body.classList.add('ready'); setTimeout(startObs, 350); setTimeout(() => $('#pre') && $('#pre').remove(), 1400) }
  setTimeout(finish, 4000);

  /* tabs */
  $$('[data-tabs]').forEach(w => { const tb = $$('.tabs .tab'), pn = [...w.children].filter(c => c.classList.contains('panel')); tb.forEach((t, i) => t.onclick = () => { tb.forEach((x, n) => x.classList.toggle('on', n === i)); pn.forEach((p, n) => p.classList.toggle('on', n === i)) }) });
  /* faq */
  $$('.faq').forEach(q => q.querySelector('button').onclick = () => { const a = q.querySelector('.a'), o = q.classList.toggle('open'); a.style.maxHeight = o ? a.scrollHeight + 'px' : 0 });
  /* copy */
  $$('[data-copy]').forEach(b => b.onclick = () => { try { navigator.clipboard.writeText(b.dataset.copy) } catch (e) { } const o = b.textContent; b.textContent = 'Copied ✓'; setTimeout(() => b.textContent = o, 1600) });
  /* contact form */
  const cf = $('#contact-form'); if (cf) cf.addEventListener('submit', e => { e.preventDefault(); cf.querySelector('.form-ok').classList.add('show'); cf.querySelectorAll('input,textarea').forEach(i => i.value = '') });

  /* Raksha live chat demo */
  const ch = $('#chat');
  if (ch) {
    const S = [['u', 'Why was WS-0492 isolated?'], ['a', 'Word launched PowerShell and then contacted an unfamiliar server, a classic phishing pattern (MITRE T1059.001).'], ['u', 'Was any data lost?'], ['a', 'No. KAVACH contained it in 14 ms, before any file was touched. It is safe to reconnect after review.']];
    let go = false; new IntersectionObserver((es, o) => { if (es[0].isIntersecting && !go) { go = true; o.disconnect(); run() } }, { threshold: .3 }).observe(ch);
    function run() {
      let t = 400; S.forEach(([k, txt]) => {
        const m = document.createElement('div'); m.className = 'msg ' + k;
        if (k === 'u') { setTimeout(() => { m.textContent = txt; ch.appendChild(m); requestAnimationFrame(() => m.classList.add('on')) }, t); t += 1200 }
        else { const ty = document.createElement('div'); ty.className = 'msg a typing on'; ty.innerHTML = '<i></i><i></i><i></i>'; setTimeout(() => ch.appendChild(ty), t); t += 1000;
          setTimeout(() => { ty.remove(); ch.appendChild(m); requestAnimationFrame(() => m.classList.add('on')); let i = 0; const iv = setInterval(() => { m.textContent = txt.slice(0, ++i); if (i >= txt.length) clearInterval(iv) }, 16) }, t); t += txt.length * 16 + 700 }
      });
      setTimeout(() => { if (!reduce) run2() }, t + 4000);
      function run2() { ch.innerHTML = ''; run() }
    }
  }

  /* scroll effects */
  const nav = $('#nav'), prog = $('#progress'), topb = $('#totop'), hc = $('.page-hero .container'), tl = $('.tl'); let tick = false;
  function onS() {
    tick = false; const y = scrollY, h = root.scrollHeight - innerHeight;
    prog.style.width = (h > 0 ? y / h * 100 : 0) + '%'; nav.classList.toggle('scrolled', y > 30); topb.classList.toggle('show', y > 700);
    if (hc && y < innerHeight && !reduce) { hc.style.transform = `translateY(${y * .22}px)`; hc.style.opacity = Math.max(0, 1 - y / (innerHeight * .8)) }
    if (tl) { const r = tl.getBoundingClientRect(); tl.style.setProperty('--fill', Math.min(1, Math.max(0, (innerHeight * .65 - r.top) / r.height)).toFixed(3)) }
  }
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(onS) } }, { passive: true }); onS();
  topb.onclick = () => scrollTo({ top: 0, behavior: 'smooth' });

  /* spotlight cards + magnetic buttons */
  $$('.card').forEach(c => c.addEventListener('mousemove', e => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px') }));
  if (fine && !reduce) $$('.btn').forEach(b => { if (b.closest('#links')) return; b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px,${(e.clientY - r.top - r.height / 2) * .35}px)` }); b.addEventListener('mouseleave', () => b.style.transform = '') });
})();
