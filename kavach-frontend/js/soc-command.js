/* ==========================================================================
   KAVACH — Military-Grade SOC Command Center Engine
   Powers:
   1. Live Packet Transmission Canvas with particles, protocols & telemetry
   2. Continuous 16-Engine Log Streaming & JSON Inspector
   3. Real-Time TCP / UDP / ICMP Flow Trend Chart
   4. Host CPU & RAM Telemetry & Core Activity
   5. File Modification (FIM) Window
   6. Network Router Connected Devices & Radar Scanner
   7. Attack Correlation Matrix
   8. Threat Intelligence Enrichment
   9. Multi-Tiered Alert Notifications & Hardware USB Insertion Chimes
   ========================================================================== */

(function () {
  'use strict';

  // ── Web Audio API Synthetic Cyber Chime ──────────────────────────────────
  let audioCtx = null;
  let soundMuted = false;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playCyberChime(type = 'alert') {
    if (soundMuted) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === 'usb') {
        // Futuristic two-tone USB insertion chime (C5 -> G5)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'critical') {
        // High-urgency alert ping
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.25);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else {
        // Subtle cyber blip
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  // ── 1. Live Packet Transmission Canvas Flow Visualizer ───────────────────
  let canvas, ctx;
  let packets = [];
  let animId = null;
  let isPaused = false;
  let activeFilter = 'all';
  let speedMultiplier = 1;
  let packetCounter = 24810;
  let throughputMB = 142.6;

  const SOURCES = [
    { id: 'src-1', label: 'SOC Analyst (192.168.1.10)', y: 0.15, color: '#38bdf8' },
    { id: 'src-2', label: 'Core Router (192.168.1.1)', y: 0.32, color: '#00f0ff' },
    { id: 'src-3', label: 'Database Tier (10.0.1.55)', y: 0.50, color: '#10b981' },
    { id: 'src-4', label: 'External C2 (185.220.101.5)', y: 0.68, color: '#ef4444' },
    { id: 'src-5', label: 'USB Port 3 (SanDisk 64GB)', y: 0.85, color: '#ec4899' },
  ];

  const DESTINATIONS = [
    { id: 'dst-1', label: 'Zero-Trust Firewall', y: 0.15, color: '#00f0ff' },
    { id: 'dst-2', label: '16-Engine Inspector', y: 0.32, color: '#3b82f6' },
    { id: 'dst-3', label: 'Threat Intel Cloud', y: 0.50, color: '#8b5cf6' },
    { id: 'dst-4', label: 'SOAR Sandbox Hub', y: 0.68, color: '#f59e0b' },
    { id: 'dst-5', label: 'CERT-In Audit Vault', y: 0.85, color: '#10b981' },
  ];

  const PROTOCOLS = [
    { name: 'TCP', port: '443', tag: 'TLS 1.3', color: '#00f0ff' },
    { name: 'TCP', port: '8000', tag: 'HTTP/2', color: '#38bdf8' },
    { name: 'UDP', port: '53', tag: 'DNS', color: '#f59e0b' },
    { name: 'UDP', port: '123', tag: 'NTP', color: '#fbbf24' },
    { name: 'ICMP', port: '0', tag: 'Echo', color: '#a78bfa' },
    { name: 'TCP', port: '22', tag: 'SSH-2.0', color: '#34d399' },
    { name: 'TCP', port: '445', tag: 'SMB Probe', color: '#ef4444', isThreat: true },
  ];

  function spawnPacket() {
    if (isPaused) return;

    // Pick random source & destination
    const src = SOURCES[Math.floor(Math.random() * SOURCES.length)];
    const dst = DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)];
    const proto = PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)];

    // Apply active filter
    if (activeFilter !== 'all' && proto.name.toLowerCase() !== activeFilter.toLowerCase()) {
      return;
    }

    packets.push({
      src,
      dst,
      proto,
      t: 0,
      speed: (0.005 + Math.random() * 0.007) * speedMultiplier,
      size: 3 + Math.random() * 2.5,
      trail: [],
      bytes: Math.floor(64 + Math.random() * 1440),
    });

    packetCounter += Math.floor(1 + Math.random() * 4);
    const counterEl = document.getElementById('pkt-live-pps');
    if (counterEl) counterEl.textContent = packetCounter.toLocaleString() + ' pps';
  }

  function initPacketCanvas() {
    canvas = document.getElementById('packet-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = 380;
    }
    resize();
    window.addEventListener('resize', resize);

    // Initial packet burst
    for (let i = 0; i < 16; i++) {
      spawnPacket();
      if (packets[i]) packets[i].t = Math.random();
    }

    // Continuous spawn loop
    setInterval(spawnPacket, 140);

    function animate() {
      if (!ctx || !canvas) return;
      if (canvas.parentElement && canvas.parentElement.clientWidth > 0 && Math.abs(canvas.width - canvas.parentElement.clientWidth) > 4) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = 380;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;
      const srcX = 40;
      const dstX = w - 40;

      // Draw Source Nodes
      SOURCES.forEach((s) => {
        const sy = h * s.y;
        // Node Glow
        ctx.beginPath();
        ctx.arc(srcX, sy, 8, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Node Label
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(s.label, srcX + 16, sy + 4);
      });

      // Draw Destination Nodes
      DESTINATIONS.forEach((d) => {
        const dy = h * d.y;
        ctx.beginPath();
        ctx.arc(dstX, dy, 8, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.shadowColor = d.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.fillStyle = '#cbd5e1';
        ctx.textAlign = 'right';
        ctx.fillText(d.label, dstX - 16, dy + 4);
        ctx.textAlign = 'left';
      });

      // Draw static transmission guide lines
      ctx.lineWidth = 1;
      SOURCES.forEach((s) => {
        const sy = h * s.y;
        DESTINATIONS.forEach((d) => {
          const dy = h * d.y;
          ctx.beginPath();
          ctx.moveTo(srcX, sy);
          ctx.bezierCurveTo(w * 0.35, sy, w * 0.65, dy, dstX, dy);
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.035)';
          ctx.stroke();
        });
      });

      // Update & Draw Packets
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        if (!isPaused) p.t += p.speed;

        const sy = h * p.src.y;
        const dy = h * p.dst.y;

        // Cubic Bezier interpolation
        const cx1 = w * 0.35;
        const cy1 = sy;
        const cx2 = w * 0.65;
        const cy2 = dy;

        const t = p.t;
        const invT = 1 - t;
        const curX =
          invT * invT * invT * srcX +
          3 * invT * invT * t * cx1 +
          3 * invT * t * t * cx2 +
          t * t * t * dstX;
        const curY =
          invT * invT * invT * sy +
          3 * invT * invT * t * cy1 +
          3 * invT * t * t * cy2 +
          t * t * t * dy;

        // Particle trail
        p.trail.push({ x: curX, y: curY });
        if (p.trail.length > 8) p.trail.shift();

        // Draw trail
        ctx.beginPath();
        for (let j = 0; j < p.trail.length; j++) {
          const pt = p.trail[j];
          if (j === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = p.proto.color;
        ctx.lineWidth = p.size * 0.7;
        ctx.globalAlpha = 0.4;
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Draw Packet Glowing Head
        ctx.beginPath();
        ctx.arc(curX, curY, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.proto.isThreat ? '#ef4444' : p.proto.color;
        ctx.shadowColor = p.proto.isThreat ? '#ef4444' : p.proto.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Packet Protocol Tag badge above packet
        if (curX > w * 0.25 && curX < w * 0.75) {
          ctx.font = '700 9px "JetBrains Mono", monospace';
          ctx.fillStyle = p.proto.isThreat ? '#fca5a5' : '#ffffff';
          ctx.fillText(`${p.proto.name}:${p.proto.port}`, curX - 12, curY - 8);
        }

        // Particle arrived at destination
        if (p.t >= 1) {
          // Destination arrival pulse
          ctx.beginPath();
          ctx.arc(dstX, dy, 16, 0, Math.PI * 2);
          ctx.strokeStyle = p.proto.color;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          packets.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(animate);
    }

    animate();
  }

  // ── 2. Continuous 16-Engine Live Log Streaming ───────────────────────────
  const ENGINES = [
    { name: 'process', label: 'PROCESS', icon: '⚡', colorClass: 'process' },
    { name: 'network', label: 'NETWORK', icon: '🌐', colorClass: 'network' },
    { name: 'fim', label: 'FIM', icon: '📁', colorClass: 'fim' },
    { name: 'login', label: 'LOGIN', icon: '🔑', colorClass: 'process' },
    { name: 'powershell', label: 'POWERSHELL', icon: '📜', colorClass: 'powershell' },
    { name: 'sysmon', label: 'SYSMON', icon: '👁️', colorClass: 'process' },
    { name: 'eventlog', label: 'EVENTLOG', icon: '📋', colorClass: 'network' },
    { name: 'dns', label: 'DNS', icon: '📡', colorClass: 'dns' },
    { name: 'registry', label: 'REGISTRY', icon: '⚙️', colorClass: 'fim' },
    { name: 'usb', label: 'USB_GUARD', icon: '🔌', colorClass: 'usb' },
    { name: 'defender', label: 'DEFENDER', icon: '🛡️', colorClass: 'defender' },
    { name: 'schtasks', label: 'SCHTASKS', icon: '⏱️', colorClass: 'process' },
    { name: 'software', label: 'SOFTWARE', icon: '📦', colorClass: 'network' },
    { name: 'sysinfo', label: 'SYSINFO', icon: '💻', colorClass: 'defender' },
    { name: 'canary', label: 'CANARY', icon: '🪤', colorClass: 'canary' },
    { name: 'service', label: 'SERVICE', icon: '🔧', colorClass: 'process' },
  ];

  const LOG_TEMPLATES = [
    { engine: 'process', sev: 'critical', msg: 'psutil: Observed powershell.exe -NoP -NonI -W Hidden -enc SQBFAFgA... (PID 7210) — Parent: winword.exe' },
    { engine: 'network', sev: 'critical', msg: 'psutil: Socket open to 185.220.101.5:443 [SYN_SENT] — Threat Intel: Tor Exit Node (Cobalt Strike C2)' },
    { engine: 'fim', sev: 'warning', msg: 'watchdog: Modified critical host config: C:\\Windows\\System32\\drivers\\etc\\hosts (Hash: 9b2d...)' },
    { engine: 'usb', sev: 'info', msg: 'WMI: Removable Media Storage plugged into Hub 02 (SanDisk Ultra 64GB, VID: 0781, PID: 5583)' },
    { engine: 'login', sev: 'warning', msg: 'EventLog 4625: Failed RDP credential validation for user "Administrator" from 194.26.29.112' },
    { engine: 'powershell', sev: 'critical', msg: 'ScriptBlock 4104: Obfuscated AMSI memory bypass detected in non-interactive pipeline' },
    { engine: 'sysmon', sev: 'critical', msg: 'Sysmon Event 10: LSASS process memory read access request from mimikatz.exe (PID 8192)' },
    { engine: 'dns', sev: 'warning', msg: 'Sysmon 22: DNS lookup for DGA domain "x891kz-c2-beacon.top" resolved to 104.21.45.19' },
    { engine: 'canary', sev: 'critical', msg: 'Honeyfile tripwire C:\\KAVACH\\canary\\q4_executive_salaries.xlsx accessed by process cmd.exe' },
    { engine: 'defender', sev: 'info', msg: 'Event 1116: Quarantined Trojan:Win32/Wacatac.B!ml in C:\\Users\\Admin\\Downloads' },
    { engine: 'schtasks', sev: 'warning', msg: 'schtasks: Daily persistent task "GoogleUpdateTaskMachineUA" created with cmd.exe target' },
    { engine: 'registry', sev: 'warning', msg: 'winreg: Run key persistence created at HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' },
    { engine: 'sysinfo', sev: 'info', msg: 'psutil: Host CPU spike detected on Core 3 (94.2%) — Real-time telemetry nominal' },
    { engine: 'service', sev: 'info', msg: 'psutil: Background daemon "WindowsTelemetryBridge" listening on socket port 9999' },
    { engine: 'eventlog', sev: 'info', msg: 'Security 7045: New Windows Service "KavachSvcUpdate" registered successfully' },
    { engine: 'software', sev: 'audit', msg: 'Registry: Verified cryptographic digital signature for KAVACH_Agent_Installer_v2.4.exe' },
  ];

  let logEntriesCount = 0;
  let autoScrollLogs = true;

  function appendLogEntry(template) {
    const stream = document.getElementById('engine-log-stream');
    if (!stream) return;

    const eng = ENGINES.find((e) => e.name === template.engine) || ENGINES[0];
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');

    const row = document.createElement('div');
    row.className = `log-entry-row ${template.sev}`;
    row.dataset.engine = template.engine;
    row.dataset.sev = template.sev;

    row.innerHTML = `
      <span class="log-time">${timeStr}</span>
      <span class="log-engine-badge ${eng.colorClass}">${eng.icon} ${eng.label}</span>
      <span class="pill ${template.sev}" style="font-size:0.6rem;padding:1px 6px">${template.sev}</span>
      <span class="log-msg" title="${template.msg}">${template.msg}</span>
      <button class="log-json-btn" data-raw='${JSON.stringify({ timestamp: now.toISOString(), engine: eng.name, severity: template.sev, summary: template.msg })}'>JSON</button>
    `;

    stream.appendChild(row);
    logEntriesCount++;

    // Cap at 200 rows in DOM
    if (stream.children.length > 200) {
      stream.removeChild(stream.firstChild);
    }

    if (autoScrollLogs) {
      stream.scrollTop = stream.scrollHeight;
    }

    // Update active micro-ribbon ticker
    const tickerEl = document.getElementById('micro-ribbon-text');
    if (tickerEl) {
      tickerEl.textContent = `[${timeStr}] [${eng.label}] ${template.msg}`;
    }
  }

  function initLogStream() {
    // Initial batch of 12 logs
    for (let i = 0; i < 12; i++) {
      appendLogEntry(LOG_TEMPLATES[i % LOG_TEMPLATES.length]);
    }

    // Continuous streaming every 850ms
    setInterval(() => {
      const tmpl = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
      appendLogEntry(tmpl);
    }, 850);

    // Bind log toolbar controls
    const filterSelect = document.getElementById('log-engine-filter');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        const rows = document.querySelectorAll('.log-entry-row');
        rows.forEach((r) => {
          if (val === 'all' || r.dataset.engine === val) {
            r.style.display = 'flex';
          } else {
            r.style.display = 'none';
          }
        });
      });
    }

    const searchInput = document.getElementById('log-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('.log-entry-row');
        rows.forEach((r) => {
          r.style.display = r.textContent.toLowerCase().includes(q) ? 'flex' : 'none';
        });
      });
    }

    const clearBtn = document.getElementById('btn-clear-logs');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const stream = document.getElementById('engine-log-stream');
        if (stream) stream.innerHTML = '';
      });
    }

    const autoscrollBtn = document.getElementById('btn-autoscroll-toggle');
    if (autoscrollBtn) {
      autoscrollBtn.addEventListener('click', () => {
        autoScrollLogs = !autoScrollLogs;
        autoscrollBtn.textContent = autoScrollLogs ? 'Auto-Scroll: ON' : 'Auto-Scroll: OFF';
      });
    }

    // Raw JSON click inspection handler
    document.addEventListener('click', (e) => {
      if (e.target && e.target.classList.contains('log-json-btn')) {
        const raw = e.target.dataset.raw;
        if (window.KAVACH && window.KAVACH.modal) {
          window.KAVACH.modal('Raw Engine Telemetry Log JSON', `<pre style="background:#020714;padding:14px;border-radius:8px;font-family:'JetBrains Mono';font-size:0.75rem;color:#38bdf8;overflow-x:auto">${JSON.stringify(JSON.parse(raw), null, 2)}</pre>`);
        } else {
          alert(raw);
        }
      }
    });
  }

  // ── 3. Real-Time TCP / UDP / ICMP Packet Flow Trend Chart ────────────────
  const flowHistory = Array.from({ length: 24 }, (_, i) => ({
    tcp: 45 + Math.sin(i / 2) * 20 + Math.random() * 15,
    udp: 18 + Math.cos(i / 2) * 8 + Math.random() * 10,
  }));

  function drawFlowChart() {
    const svg = document.getElementById('packet-trend-svg');
    if (!svg) return;

    const w = 480;
    const h = 180;
    const pts = flowHistory;
    const maxVal = 95;

    // Build TCP Spline path
    const tcpPath = pts
      .map((p, i) => {
        const x = (i / (pts.length - 1)) * w;
        const y = h - (p.tcp / maxVal) * (h - 20) - 10;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    // Build UDP Spline path
    const udpPath = pts
      .map((p, i) => {
        const x = (i / (pts.length - 1)) * w;
        const y = h - (p.udp / maxVal) * (h - 20) - 10;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    // TCP Area Fill
    const tcpArea = `${tcpPath} L ${w} ${h} L 0 ${h} Z`;

    svg.innerHTML = `
      <defs>
        <linearGradient id="cyan-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#00f0ff" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <path class="spline-area-fill" d="${tcpArea}"/>
      <path class="spline-path-main" d="${tcpPath}"/>
      <path class="spline-path-udp" d="${udpPath}"/>
    `;
  }

  function initFlowChart() {
    drawFlowChart();
    setInterval(() => {
      flowHistory.push({
        tcp: Math.max(20, Math.min(92, flowHistory[flowHistory.length - 1].tcp + (Math.random() - 0.5) * 16)),
        udp: Math.max(8, Math.min(48, flowHistory[flowHistory.length - 1].udp + (Math.random() - 0.5) * 10)),
      });
      flowHistory.shift();
      drawFlowChart();
    }, 2000);
  }

  // ── 4. System Telemetry Monitor (CPU & RAM) ──────────────────────────────
  function initSystemMonitor() {
    const cpuEl = document.getElementById('sys-cpu-val');
    const ramEl = document.getElementById('sys-ram-val');
    const coreContainer = document.getElementById('sys-cores-strip');

    setInterval(() => {
      const cpu = Math.floor(28 + Math.random() * 24);
      const ram = (6.2 + Math.random() * 0.4).toFixed(1);

      if (cpuEl) cpuEl.textContent = `${cpu}%`;
      if (ramEl) ramEl.textContent = `${ram} / 16.0 GB`;

      if (coreContainer) {
        const cores = Array.from({ length: 8 }, () => Math.floor(15 + Math.random() * 65));
        coreContainer.innerHTML = cores
          .map(
            (c, i) => `
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">
            <div style="width:100%;height:44px;background:rgba(255,255,255,0.05);border-radius:4px;display:flex;align-items:flex-end;overflow:hidden">
              <div style="width:100%;height:${c}%;background:linear-gradient(180deg,#00f0ff,#3b82f6);transition:height 0.8s ease"></div>
            </div>
            <span style="font-size:0.6rem;color:#64748b;font-family:'JetBrains Mono'">C${i + 1}</span>
          </div>
        `
          )
          .join('');
      }
    }, 2500);
  }

  // ── 5. File Modification (FIM) Window ────────────────────────────────────
  const FIM_SAMPLE_DATA = [
    { file: 'hosts', path: 'C:\\Windows\\System32\\drivers\\etc\\hosts', action: 'modified', proc: 'svchost.exe (1420)', hash: '8f4a...21c0', time: '12s ago' },
    { file: 'payload.ps1', path: 'C:\\Users\\Admin\\AppData\\Local\\Temp\\payload.ps1', action: 'ransom', proc: 'powershell.exe (7210)', hash: 'e3b0...1402', time: '48s ago' },
    { file: 'confidential_salaries.xlsx', path: 'C:\\KAVACH\\canary\\confidential_salaries.xlsx', action: 'created', proc: 'canary_tripwire', hash: 'a1b2...9901', time: '2m ago' },
    { file: 'updater_svc.bat', path: 'C:\\ProgramData\\svchost_updater.bat', action: 'deleted', proc: 'soar_containment', hash: 'd41d...8401', time: '5m ago' },
  ];

  function renderFimTable() {
    const tbody = document.getElementById('fim-table-body');
    if (!tbody) return;

    tbody.innerHTML = FIM_SAMPLE_DATA.map(
      (item, idx) => `
      <tr>
        <td>
          <b style="color:#ffffff">${item.file}</b>
          <div style="font-size:0.68rem;color:#64748b">${item.path}</div>
        </td>
        <td><span class="action-tag ${item.action}">${item.action}</span></td>
        <td><span style="color:#38bdf8">${item.proc}</span></td>
        <td><code style="color:#94a3b8;font-size:0.7rem">${item.hash}</code></td>
        <td style="color:#64748b">${item.time}</td>
        <td>
          <button class="sim-btn danger" style="padding:3px 8px;font-size:0.65rem" onclick="window.KAVACH && window.KAVACH.toast ? window.KAVACH.toast('File quarantined: ${item.file} ✓') : alert('Quarantined!')">Quarantine</button>
        </td>
      </tr>
    `
    ).join('');
  }

  // ── 6. Network Window (Connected Router Devices & Radar Scanner) ─────────
  const ROUTER_DEVICES = [
    { name: 'Cisco Gateway Router', ip: '192.168.1.1', mac: 'E4:AA:5D:12:00:01', vendor: 'Cisco GbE', rx: '18.4 MB/s', ping: '0.8ms', status: 'Secured', isSafe: true },
    { name: 'SOC Analyst Workstation', ip: '192.168.1.10', mac: '00:1A:2B:66:33:14', vendor: 'ThinkPad P1', rx: '4.2 MB/s', ping: '1.2ms', status: 'Active (Self)', isSafe: true },
    { name: 'Core Database Server', ip: '192.168.1.50', mac: '00:50:56:8C:99:55', vendor: 'Dell R750', rx: '62.1 MB/s', ping: '0.4ms', status: 'Secured', isSafe: true },
    { name: 'Corporate Finance Laptop', ip: '192.168.1.104', mac: '00:1A:2B:44:88:92', vendor: 'HP EliteBook', rx: '1.1 MB/s', ping: '3.4ms', status: 'Monitored', isSafe: true },
    { name: 'Smart Security Cam #04', ip: '192.168.1.120', mac: 'B8:27:EB:11:22:33', vendor: 'Hikvision', rx: '820 KB/s', ping: '4.8ms', status: 'Isolated VLAN', isSafe: true },
    { name: 'Android Device (Guest)', ip: '192.168.1.145', mac: '74:D4:35:88:99:AA', vendor: 'Samsung S24', rx: '340 KB/s', ping: '12.1ms', status: 'Monitored', isSafe: true },
    { name: 'Suspicious Unknown Probe', ip: '192.168.1.210', mac: 'UNKNOWN:MAC:XX', vendor: 'Raspberry Pi', rx: '9.4 MB/s', ping: '1.9ms', status: 'Port Scanning', isThreat: true },
  ];

  function renderRouterDevices() {
    const tbody = document.getElementById('router-devices-body');
    if (!tbody) return;

    tbody.innerHTML = ROUTER_DEVICES.map(
      (d) => `
      <tr>
        <td>
          <b style="color:${d.isThreat ? '#fca5a5' : '#ffffff'}">${d.name}</b>
          <div style="font-size:0.68rem;color:#64748b">${d.vendor} • ${d.mac}</div>
        </td>
        <td><code style="color:#38bdf8">${d.ip}</code></td>
        <td><span style="color:#94a3b8">${d.rx}</span></td>
        <td><span style="color:#7dd3fc">${d.ping}</span></td>
        <td>
          <span class="pill ${d.isThreat ? 'critical' : 'safe'}" style="font-size:0.65rem">${d.status}</span>
        </td>
        <td>
          <button class="sim-btn ${d.isThreat ? 'danger' : ''}" style="padding:3px 8px;font-size:0.65rem" onclick="window.KAVACH && window.KAVACH.toast ? window.KAVACH.toast('${d.name} isolated from subnet ✓') : alert('Host isolated!')">${d.isThreat ? 'Sever Connection' : 'Inspect'}</button>
        </td>
      </tr>
    `
    ).join('');
  }

  // ── 7. Multi-Tiered Alert Notifications & Hardware USB Chimes ────────────
  function triggerUsbInsertionAlert() {
    playCyberChime('usb');

    const toast = document.getElementById('hw-usb-toast');
    if (!toast) return;

    toast.classList.add('show');

    // Add log entry into stream
    appendLogEntry({
      engine: 'usb',
      sev: 'info',
      msg: 'WMI: Removable Media Storage plugged into Hub 02 (SanDisk Ultra 64GB, VID: 0781, PID: 5583) — Read-Only Mode Enforced',
    });

    if (window.KAVACH && window.KAVACH.toast) {
      window.KAVACH.toast('⚡ USB Mass Storage Connected: SanDisk Ultra 64GB (Verified Clean)');
    }

    setTimeout(() => {
      toast.classList.remove('show');
    }, 6000);
  }

  function triggerRansomwareSimAlert() {
    playCyberChime('critical');

    appendLogEntry({
      engine: 'fim',
      sev: 'critical',
      msg: 'RANSOMWARE CANARY TRIPPED: Multiple .locked files created in AppData — Automated SOAR Playbook Severed Process (PID 7210)',
    });

    FIM_SAMPLE_DATA.unshift({
      file: 'q4_balance_sheet.xlsx.locked',
      path: 'C:\\Users\\Admin\\Documents\\q4_balance_sheet.xlsx.locked',
      action: 'ransom',
      proc: 'ransomware_sim.exe (9104)',
      hash: 'cf23...9188',
      time: 'Just now',
    });
    renderFimTable();

    if (window.KAVACH && window.KAVACH.toast) {
      window.KAVACH.toast('🚨 CRITICAL: Canary Ransomware Detection Enforced! Host isolated.');
    }
  }

  function triggerPortScanSimAlert() {
    playCyberChime('critical');

    appendLogEntry({
      engine: 'network',
      sev: 'critical',
      msg: 'PORT SCAN DETECTED: Rapid SYN packets across 1,024 ports from 192.168.1.210 — WFP Rule Ingress Drop Deployed',
    });

    if (window.KAVACH && window.KAVACH.toast) {
      window.KAVACH.toast('⚠️ Network Intrusion: SYN Scan Intercepted from 192.168.1.210');
    }
  }

  // ── 8. Master Initialization ─────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initPacketCanvas();
    initLogStream();
    initFlowChart();
    initSystemMonitor();
    renderFimTable();
    renderRouterDevices();

    // Bind Simulator Buttons
    const simUsb = document.getElementById('btn-sim-usb');
    if (simUsb) simUsb.addEventListener('click', triggerUsbInsertionAlert);

    const topSimUsb = document.getElementById('top-btn-sim-usb');
    if (topSimUsb) topSimUsb.addEventListener('click', triggerUsbInsertionAlert);

    const simRansom = document.getElementById('btn-sim-ransom');
    if (simRansom) simRansom.addEventListener('click', triggerRansomwareSimAlert);

    const simScan = document.getElementById('btn-sim-scan');
    if (simScan) simScan.addEventListener('click', triggerPortScanSimAlert);

    // Bind Protocol Filters
    document.querySelectorAll('.pkt-filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pkt-filter-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter || 'all';
      });
    });

    // Pause/Resume Packet Flow
    const pauseBtn = document.getElementById('btn-packet-pause');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        pauseBtn.textContent = isPaused ? '▶ Resume' : '⏸ Pause';
      });
    }

    // Audio Mute Toggle
    const soundBtn = document.getElementById('btn-toggle-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        soundMuted = !soundMuted;
        soundBtn.textContent = soundMuted ? '🔇 Audio Muted' : '🔊 Audio Active';
      });
    }

    // Global simulation triggers for external use
    window.KAVACH_SIMULATE = {
      usb: triggerUsbInsertionAlert,
      ransomware: triggerRansomwareSimAlert,
      portScan: triggerPortScanSimAlert,
    };
  });
})();
