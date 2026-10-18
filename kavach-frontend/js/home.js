/* KAVACH — home + Raksha demo animations */
(function () {
  const $ = s => document.querySelector(s);
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* typed headline */
  const t = $('#typed'); if (t) { t.textContent = ''; window.typeWords(t, ['understands', 'correlates', 'responds', 'protects']); }

  /* marquee */
  const mq = $('#mq');
  if (mq) {
    const items = ['Process Lineage', 'Network Sockets', 'DNS Entropy', 'Registry Watch', 'Canary Decoys', 'USB Watchdog', 'MITRE ATT&CK', 'IsolationForest ML', 'SOAR Playbooks', 'URL Shield', 'Raksha AI', 'Immutable Audit'];
    const row = items.map(i => `<span>${i}</span>`).join('');
    mq.innerHTML = row + row;
  }

  /* live terminal */
  const term = $('#term');
  if (term) {
    const script = [
      ['c-g', '✓ All 16 collectors nominal. Zero active breaches.'],
      ['c-m', '[14:02:11] ingest.proc  → 1,284 events/s'],
      ['c-y', '⚠ INCOMING: Encoded PowerShell (MITRE T1059.001) targeting WS-0492…'],
      ['c-r', '✖ ml.isolation_forest anomaly=0.93 • parent=winword.exe → powershell.exe'],
      ['c-b', '⚡ SOAR TRIGGERED: Host WS-0492 isolated • PID 4920 terminated in 14ms'],
      ['c-g', '✓ SYSTEM RESTORED: Endpoint WS-0492 re-baselined. Threat neutralised.']
    ];
    (async function loop() {
      for (;;) {
        term.innerHTML = '';
        for (const [c, txt] of script) {
          const l = document.createElement('span'); l.className = 'l ' + c; term.appendChild(l);
          for (let i = 0; i <= txt.length; i += 2) { l.textContent = txt.slice(0, i); await sleep(14); }
          l.textContent = txt; await sleep(650);
        }
        await sleep(3000);
      }
    })();
  }

  /* attack chain + risk */
  const chain = $('#chain');
  if (chain) {
    const ev = [['🧾', 'Process Activity: wscript.exe spawned', 28], ['🌍', 'Network Anomaly: outbound connection to unknown ASN', 49], ['⌨️', 'Suspicious PowerShell Execution: encoded command', 71], ['📡', 'Threat Correlated: potential C2 beaconing', 88], ['🛡️', 'Risk Elevated: isolation playbook triggered', 96]];
    chain.innerHTML = ev.map(e => `<div class="card" data-notilt style="padding:14px 18px;display:flex;gap:14px;align-items:center;opacity:.35;transition:.5s"><span style="font-size:1.3rem">${e[0]}</span><span style="font-size:.9rem">${e[1]}</span></div>`).join('');
    const kids = [...chain.children], bar = $('#risk'), rb = $('#riskbar'), rv = $('#riskv'), note = $('#chainnote');
    (async function loop() {
      for (;;) {
        kids.forEach(k => { k.style.opacity = .35; k.style.borderColor = ''; });
        rb.style.width = '12%'; rv.textContent = 12; bar.textContent = 'RISK LOW'; bar.style.cssText = 'padding:6px 12px;border-radius:8px;font-size:.74rem;background:rgba(34,197,94,.12);color:var(--safe)'; note.textContent = 'Monitoring… all collectors nominal.';
        await sleep(1800);
        for (let i = 0; i < ev.length; i++) {
          kids[i].style.opacity = 1; kids[i].style.borderColor = 'var(--cborder)'; rb.style.width = ev[i][2] + '%'; rv.textContent = ev[i][2];
          if (i >= 2) { bar.textContent = i === 4 ? 'CONTAINED' : 'RISK ELEVATED'; bar.style.background = 'rgba(220,38,38,.15)'; bar.style.color = 'var(--ember)'; }
          note.textContent = ev[i][1]; await sleep(1500);
        }
        await sleep(3200);
      }
    })();
  }

  /* Raksha chat demo */
  const chat = $('#chat');
  if (chat) {
    const convo = [
      ['u', 'Why was WS-0492 isolated?'],
      ['a', 'A Word document launched an encoded PowerShell command, then the machine contacted an untrusted server. That pattern matches a known attack technique (T1059.001), so I isolated it to stop the spread.'],
      ['u', 'Is anything else at risk?'],
      ['a', 'No lateral movement was seen. The device was re-baselined and all files are intact. No action is needed from you.']
    ];
    (async function loop() {
      for (;;) {
        chat.innerHTML = '';
        for (const [who, txt] of convo) {
          const b = document.createElement('div'); b.className = 'bub ' + who; chat.appendChild(b);
          if (who === 'a') { b.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>'; await sleep(1100); b.textContent = ''; for (let i = 0; i <= txt.length; i += 2) { b.textContent = txt.slice(0, i); await sleep(10); } }
          else { b.textContent = txt; }
          b.textContent = txt; await sleep(900);
        }
        await sleep(4500);
      }
    })();
  }
})();
