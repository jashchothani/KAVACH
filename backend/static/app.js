/* ═══════════════════════════════════════════════════════════════════════════
   KAVACH — AI-Driven SOAR-XDR Platform
   Frontend Application (SPA)
   ═══════════════════════════════════════════════════════════════════════════ */

const API_BASE = '/api/v1';
let jwtToken = localStorage.getItem('kavach_token') || '';
let currentUser = null;
let pending2faToken = '';
let pendingVerifyEmail = '';
let charts = {};
let wsConnection = null;
let chartLoadPromise = null;

function loadChartJs() {
    if (window.Chart) return Promise.resolve();
    if (chartLoadPromise) return chartLoadPromise;
    chartLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Chart library unavailable'));
        document.head.appendChild(script);
    });
    return chartLoadPromise;
}

// ═══════════════════════════════════════════════════════════════════════════
// SPA ROUTER
// ═══════════════════════════════════════════════════════════════════════════

function navigateTo(page) {
    document.querySelectorAll('.auth-page, .app-layout').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(`page-${page}`);
    if (target) {
        target.classList.remove('hidden');
        if (['login', 'register', 'forgot', '2fa', 'verify-email'].includes(page)) {
            initThreeBackground(page);
        }
    }
    window.location.hash = page;
}

function showSection(section) {
    document.querySelectorAll('.page-content > section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(`section-${section}`);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-section="${section}"]`);
    if (navItem) navItem.classList.add('active');

    const titles = {
        overview: 'Dashboard', alerts: 'Security Alerts', devices: 'Devices',
        incidents: 'Incidents', mitre: 'MITRE ATT&CK', iocs: 'IOC Analysis',
        logs: 'Log Viewer', playbooks: 'Playbooks', ml: 'ML Engine',
        chat: 'AI Assistant', awareness: 'Awareness', settings: 'Settings'
    };
    document.getElementById('topbar-title').textContent = titles[section] || 'Dashboard';
    document.getElementById('topbar-breadcrumb').textContent = titles[section] || 'Overview';

    // Update URL hash to reflect active SPA section
    window.location.hash = section;

    // Load data for specific sections
    if (section === 'overview') loadDashboard();
    else if (section === 'alerts') loadAlerts();
    else if (section === 'devices') loadDevices();
    else if (section === 'incidents') loadIncidents();
    else if (section === 'mitre') loadMitreHeatmap();
    else if (section === 'iocs') loadIOCs();
    else if (section === 'playbooks') loadPlaybooks();
    else if (section === 'ml') loadMLStatus();
    else if (section === 'awareness') loadAwareness();
    else if (section === 'settings') loadSettings();
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// ═══════════════════════════════════════════════════════════════════════════
// THREE.JS 3D BACKGROUND
// ═══════════════════════════════════════════════════════════════════════════

let threeScenes = {};

function initThreeBackground(pageId) {
    const containerId = `three-canvas-${pageId}`;
    const container = document.getElementById(containerId);
    if (!container || threeScenes[containerId]) return;
    if (typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // --- Lights (Required for glassmorphism / shiny physical materials) ---
    const cyanLight = new THREE.PointLight(0x00f0ff, 2.5, 30);
    cyanLight.position.set(-6, 5, 4);
    scene.add(cyanLight);

    const magentaLight = new THREE.PointLight(0xff3366, 2.5, 30);
    magentaLight.position.set(6, -5, 4);
    scene.add(magentaLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    // --- Floating particles ---
    const particleCount = 80;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
        const isRed = Math.random() > 0.6;
        colors[i * 3] = isRed ? 0.55 : 0.75;
        colors[i * 3 + 1] = isRed ? 0.1 : 0.75;
        colors[i * 3 + 2] = isRed ? 0.1 : 0.80;
        sizes[i] = Math.random() * 3 + 1;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // --- Abstract Flowing Wave Ribbons (iOS Wallpaper style) ---
    const waves = [];
    for (let w = 0; w < 2; w++) {
        const points = [];
        for (let i = 0; i < 5; i++) {
            points.push(new THREE.Vector3(
                (i - 2) * 5,
                Math.sin(i * 1.5 + w * Math.PI) * 2.2,
                (Math.random() - 0.5) * 2 - 1.5
            ));
        }
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.07, 8, false);
        const tubeMat = new THREE.MeshPhysicalMaterial({
            color: w === 0 ? 0xff00bb : 0x00e1ff,
            roughness: 0.1,
            metalness: 0.8,
            emissive: w === 0 ? 0x2b0020 : 0x001d2b,
            transparent: true,
            opacity: 0.35
        });
        const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
        scene.add(tubeMesh);
        waves.push(tubeMesh);
    }

    // --- Glassmorphic Floating Spheres ---
    const glassSpheres = [];
    const sphereColors = [0xff3366, 0x00f0ff, 0xffaa00];
    for (let i = 0; i < 3; i++) {
        const size = Math.random() * 0.9 + 0.6;
        const geo = new THREE.SphereGeometry(size, 32, 32);
        const mat = new THREE.MeshPhysicalMaterial({
            color: sphereColors[i],
            transparent: true,
            opacity: 0.12,
            roughness: 0.05,
            metalness: 0.1,
            transmission: 0.75,
            ior: 1.45,
            thickness: 0.4
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
            (Math.random() - 0.5) * 8 + (i === 0 ? -3 : (i === 1 ? 3 : 0)),
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 3 - 2
        );
        scene.add(mesh);
        glassSpheres.push({
            mesh,
            speedX: (Math.random() - 0.5) * 0.006,
            speedY: (Math.random() - 0.5) * 0.006,
            rotSpeed: (Math.random() - 0.5) * 0.008
        });
    }

    // --- KAVACH 3D Token & Shield (Assembled in a Group) ---
    const tokenGroup = new THREE.Group();

    // Texture loader
    const textureLoader = new THREE.TextureLoader();
    const tokenTexture = textureLoader.load('/static/cyber_shield_texture.jpg');

    // 3D Cyber Emblem Cylinder Token
    const tokenGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.15, 64);
    const sideMat = new THREE.MeshBasicMaterial({ color: 0x1a0707, transparent: true, opacity: 0.8 });
    const capMat = new THREE.MeshBasicMaterial({ map: tokenTexture });
    const tokenMesh = new THREE.Mesh(tokenGeo, [sideMat, capMat, capMat]);
    tokenMesh.rotation.x = Math.PI / 2.5;
    tokenGroup.add(tokenMesh);

    // Shield wireframe
    const shieldGeo = new THREE.IcosahedronGeometry(2.3, 1);
    const shieldMat = new THREE.MeshBasicMaterial({
        color: 0x8B1A1A,
        wireframe: true,
        transparent: true,
        opacity: 0.12
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    tokenGroup.add(shield);

    // Orbiting rings
    const ringGeo = new THREE.TorusGeometry(3.2, 0.02, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x8B1A1A, transparent: true, opacity: 0.15 });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 3;
    tokenGroup.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo, ringMat.clone());
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.y = Math.PI / 6;
    tokenGroup.add(ring2);

    scene.add(tokenGroup);

    // --- Responsive Token Group Positioning ---
    function updateTokenPosition() {
        const width = container.clientWidth;
        const height = container.clientHeight;
        const aspect = width / height;

        if (aspect < 1.1) {
            // Portrait / Mobile viewports: Position token above center card
            tokenGroup.position.set(0, 2.3, 0);
            tokenGroup.scale.setScalar(0.72);
        } else {
            // Landscape / Desktop viewports: Offset token to left side
            tokenGroup.position.set(-3.0, 0.5, 0);
            tokenGroup.scale.setScalar(1.0);
        }
    }
    updateTokenPosition();

    camera.position.z = 8;

    threeScenes[containerId] = true;

    function animate() {
        if (!document.getElementById(containerId)) return;
        requestAnimationFrame(animate);
        const t = Date.now() * 0.001;

        // Rotate particles
        particles.rotation.y = t * 0.05;
        particles.rotation.x = Math.sin(t * 0.03) * 0.1;

        // Animate glass spheres
        glassSpheres.forEach(s => {
            s.mesh.position.x += s.speedX;
            s.mesh.position.y += s.speedY;
            s.mesh.rotation.y += s.rotSpeed;
            // bounce check
            if (Math.abs(s.mesh.position.x) > 6) s.speedX *= -1;
            if (Math.abs(s.mesh.position.y) > 4) s.speedY *= -1;
        });

        // Rotate and wobble 3D token group
        shield.rotation.y = t * 0.15;
        shield.rotation.x = Math.sin(t * 0.1) * 0.2;
        tokenMesh.rotation.y = t * 0.25;
        tokenMesh.rotation.x = Math.PI / 2.5 + Math.sin(t * 0.5) * 0.05;
        ring1.rotation.z = t * 0.1;
        ring2.rotation.z = -t * 0.08;

        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        if (!container.clientWidth) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        updateTokenPosition();
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

function showToast(title, message, type = 'info') {
    const container = document.getElementById('toast-container');
    const icons = { success: '✅', danger: '🚨', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('removing'); setTimeout(() => toast.remove(), 300); }, 5000);
}

// ═══════════════════════════════════════════════════════════════════════════
// API HELPERS
// ═══════════════════════════════════════════════════════════════════════════

async function apiFetch(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (jwtToken) headers['Authorization'] = `Bearer ${jwtToken}`;
    try {
        const resp = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
        if (resp.status === 401) {
            jwtToken = '';
            localStorage.removeItem('kavach_token');
            navigateTo('login');
            showToast('Session Expired', 'Please sign in again', 'warning');
            return null;
        }
        return resp;
    } catch (e) {
        showToast('Connection Error', 'Cannot reach KAVACH server', 'danger');
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// OTP INPUT LOGIC
// ═══════════════════════════════════════════════════════════════════════════

function setupOTPInputs(containerId) {
    const inputs = document.querySelectorAll(`#${containerId} .otp-input`);
    inputs.forEach((input, idx) => {
        input.value = '';
        input.addEventListener('input', (e) => {
            const val = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = val;
            if (val && idx < inputs.length - 1) inputs[idx + 1].focus();
            e.target.classList.toggle('filled', !!val);
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && idx > 0) {
                inputs[idx - 1].focus();
                inputs[idx - 1].value = '';
                inputs[idx - 1].classList.remove('filled');
            }
        });
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const paste = (e.clipboardData.getData('text') || '').replace(/[^0-9]/g, '').slice(0, 6);
            paste.split('').forEach((ch, i) => {
                if (inputs[i]) { inputs[i].value = ch; inputs[i].classList.add('filled'); }
            });
            if (inputs[paste.length - 1]) inputs[paste.length - 1].focus();
        });
    });
}

function getOTPValue(containerId) {
    return Array.from(document.querySelectorAll(`#${containerId} .otp-input`)).map(i => i.value).join('');
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTH: LOGIN
// ═══════════════════════════════════════════════════════════════════════════

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    btn.classList.add('loading');
    btn.disabled = true;

    const resp = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            username: document.getElementById('login-username').value,
            password: document.getElementById('login-password').value
        })
    });

    btn.classList.remove('loading');
    btn.disabled = false;

    if (!resp) return;
    const data = await resp.json();

    if (resp.ok) {
        if (data.status === 'pending_2fa') {
            pending2faToken = data.pending_2fa_token;
            navigateTo('2fa');
            setupOTPInputs('twofa-otp-group');
            setTimeout(() => document.querySelector('#twofa-otp-group .otp-input').focus(), 300);
        } else if (data.access_token) {
            jwtToken = data.access_token;
            localStorage.setItem('kavach_token', jwtToken);
            currentUser = { username: data.username, role: data.role };
            showToast('Welcome!', `Signed in as ${data.username}`, 'success');
            enterDashboard();
        }
    } else {
        showToast('Login Failed', data.detail || data.message || 'Invalid credentials', 'danger');
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// AUTH: REGISTER
// ═══════════════════════════════════════════════════════════════════════════

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    if (pw !== confirm) {
        const err = document.getElementById('reg-password-error');
        err.textContent = 'Passwords do not match';
        err.classList.add('visible');
        return;
    }
    document.getElementById('reg-password-error').classList.remove('visible');

    const btn = document.getElementById('register-btn');
    btn.classList.add('loading');
    btn.disabled = true;

    const resp = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
            username: document.getElementById('reg-username').value,
            email: document.getElementById('reg-email').value,
            password: pw,
            role: document.getElementById('reg-role').value
        })
    });

    btn.classList.remove('loading');
    btn.disabled = false;

    if (!resp) return;
    const data = await resp.json();

    if (resp.ok && data.access_token) {
        jwtToken = data.access_token;
        localStorage.setItem('kavach_token', jwtToken);
        currentUser = { username: data.username, role: data.role };
        showToast('Account Created!', `Welcome to KAVACH, ${data.username}`, 'success');
        enterDashboard();
    } else {
        showToast('Registration Failed', data.detail || data.message || 'Could not create account', 'danger');
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// AUTH: FORGOT PASSWORD
// ═══════════════════════════════════════════════════════════════════════════

let forgotEmail = '';

document.getElementById('forgot-step1').addEventListener('submit', async (e) => {
    e.preventDefault();
    forgotEmail = document.getElementById('forgot-email').value;
    const resp = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail })
    });
    if (resp && resp.ok) {
        document.getElementById('forgot-step1').classList.add('hidden');
        document.getElementById('forgot-step2').classList.remove('hidden');
        updateWizard(2);
        setupOTPInputs('forgot-otp-group');
        setTimeout(() => document.querySelector('#forgot-otp-group .otp-input').focus(), 300);
        showToast('Code Sent', 'Check your email for the reset code', 'success');
    } else {
        showToast('Error', 'Could not send reset code', 'danger');
    }
});

document.getElementById('forgot-step2').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = getOTPValue('forgot-otp-group');
    if (code.length < 6) { showToast('Invalid', 'Please enter 6-digit code', 'warning'); return; }
    document.getElementById('forgot-step2').classList.add('hidden');
    document.getElementById('forgot-step3').classList.remove('hidden');
    updateWizard(3);
    window._forgotOTP = code;
});

document.getElementById('forgot-step3').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPass = document.getElementById('forgot-newpass').value;
    const confirmPass = document.getElementById('forgot-confirm').value;
    if (newPass !== confirmPass) { showToast('Mismatch', 'Passwords do not match', 'warning'); return; }

    const resp = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail, otp: window._forgotOTP, new_password: newPass })
    });
    if (resp && resp.ok) {
        showToast('Password Reset!', 'You can now sign in with your new password', 'success');
        navigateTo('login');
    } else {
        showToast('Error', 'Could not reset password', 'danger');
    }
});

function updateWizard(step) {
    document.querySelectorAll('#forgot-wizard .wizard-step').forEach((el, i) => {
        el.classList.remove('active', 'completed');
        if (i + 1 < step) el.classList.add('completed');
        else if (i + 1 === step) el.classList.add('active');
    });
    document.querySelectorAll('#forgot-wizard .wizard-line').forEach((el, i) => {
        el.classList.toggle('active', i + 1 < step);
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTH: 2FA VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════

document.getElementById('twofa-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = getOTPValue('twofa-otp-group');
    if (code.length < 6) { showToast('Invalid', 'Enter all 6 digits', 'warning'); return; }

    const resp = await apiFetch('/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ pending_2fa_token: pending2faToken, code })
    });

    if (!resp) return;
    const data = await resp.json();
    if (resp.ok && data.access_token) {
        jwtToken = data.access_token;
        localStorage.setItem('kavach_token', jwtToken);
        currentUser = { username: data.username, role: data.role };
        showToast('Verified!', '2FA authentication successful', 'success');
        enterDashboard();
    } else {
        showToast('Invalid Code', data.detail || 'Verification failed', 'danger');
    }
});



// ═══════════════════════════════════════════════════════════════════════════
// AUTH: EMAIL VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════

document.getElementById('verify-email-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = getOTPValue('verify-otp-group');
    if (code.length < 6) { showToast('Invalid', 'Enter all 6 digits', 'warning'); return; }

    const resp = await apiFetch('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email: pendingVerifyEmail, otp: code })
    });

    if (resp && resp.ok) {
        showToast('Email Verified!', 'Your email has been confirmed', 'success');
        enterDashboard();
    } else {
        showToast('Error', 'Verification failed', 'danger');
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD ENTRY
// ═══════════════════════════════════════════════════════════════════════════

async function enterDashboard() {
    navigateTo('dashboard');

    // Load user profile
    const meResp = await apiFetch('/auth/me');
    if (meResp && meResp.ok) {
        currentUser = await meResp.json();
        document.getElementById('sidebar-username').textContent = currentUser.username;
        document.getElementById('sidebar-role').textContent = currentUser.role?.replace('_', ' ');
        document.getElementById('sidebar-avatar').textContent = (currentUser.username || 'U')[0].toUpperCase();
    }

    // Respect hash routing on refresh / direct link
    const currentHash = window.location.hash.replace('#', '');
    const validSections = [
        'overview', 'alerts', 'devices', 'incidents', 'mitre', 
        'iocs', 'logs', 'playbooks', 'ml', 'chat', 'awareness', 'settings'
    ];
    const initialSection = validSections.includes(currentHash) ? currentHash : 'overview';
    showSection(initialSection);
    connectWebSocket();
}

function handleLogout() {
    jwtToken = '';
    localStorage.removeItem('kavach_token');
    currentUser = null;
    if (wsConnection) { wsConnection.close(); wsConnection = null; }
    showToast('Signed Out', 'You have been logged out', 'info');
    navigateTo('login');
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD DATA
// ═══════════════════════════════════════════════════════════════════════════

async function loadDashboard() {
    const resp = await apiFetch('/dashboard/summary');
    if (!resp || !resp.ok) return;
    const data = await resp.json();

    // Stats
    document.getElementById('stat-alerts').textContent = data.overview?.total_alerts ?? 0;
    document.getElementById('stat-devices').textContent = data.overview?.total_devices ?? 0;
    document.getElementById('stat-incidents').textContent = data.overview?.total_incidents ?? 0;
    document.getElementById('stat-cpu').textContent = (data.system?.cpu_percent ?? 0) + '%';
    document.getElementById('stat-memory').textContent = (data.system?.memory_percent ?? 0) + '%';

    // Alert badge
    document.getElementById('sidebar-alert-count').textContent = data.overview?.total_alerts ?? 0;

    // Charts are non-essential and loaded only when the dashboard is opened.
    try { await loadChartJs(); } catch (error) { console.warn(error); return; }

    // Severity Chart
    renderSeverityChart(data.overview?.severity_counts || {});
    renderStatusChart(data.overview?.status_counts || {});
    renderMitreChart(data.mitre_heatmap || []);
    renderCollectorChart(data.collectors || []);
    renderRecentAlerts(data.recent_alerts || []);
    renderLiveActivityChart(data.recent_alerts || []);
}

// ═══════════════════════════════════════════════════════════════════════════
// CHART.JS CHARTS
// ═══════════════════════════════════════════════════════════════════════════

const chartColors = {
    critical: '#ff1744', high: '#ff9100', medium: '#ffea00',
    low: '#00b0ff', info: '#94a3b8',
    new: '#ad1457', investigating: '#ff9100', resolved: '#00e676',
    false_positive: '#64748b', escalated: '#d500f9'
};

function destroyChart(id) {
    if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

function renderLiveActivityChart(recentAlerts = []) {
    destroyChart('live-activity');
    const ctx = document.getElementById('chart-live-activity');
    if (!ctx) return;

    const pointsCount = 15;
    const labels = [];
    const telemetryData = [];
    const alertData = [];

    let now = Date.now();
    for (let i = pointsCount - 1; i >= 0; i--) {
        let t = new Date(now - i * 4000);
        labels.push(t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        telemetryData.push(Math.floor(Math.random() * 15) + 30);
        alertData.push(0);
    }

    if (recentAlerts && recentAlerts.length > 0) {
        recentAlerts.forEach(alert => {
            const idx = Math.floor(Math.random() * pointsCount);
            alertData[idx] = (alertData[idx] || 0) + (alert.risk_score > 70 ? 2 : 1);
        });
    }

    const telGradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    telGradient.addColorStop(0, 'rgba(0, 240, 255, 0.15)');
    telGradient.addColorStop(1, 'rgba(0, 240, 255, 0.0)');

    const alertGradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    alertGradient.addColorStop(0, 'rgba(255, 23, 68, 0.15)');
    alertGradient.addColorStop(1, 'rgba(255, 23, 68, 0.0)');

    charts['live-activity'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Telemetry Rate / s',
                    data: telemetryData,
                    borderColor: '#00f0ff',
                    borderWidth: 2,
                    pointBackgroundColor: '#00f0ff',
                    pointBorderColor: '#00f0ff',
                    pointRadius: 2,
                    pointHoverRadius: 5,
                    fill: true,
                    backgroundColor: telGradient,
                    tension: 0.4
                },
                {
                    label: 'Alert Intensity',
                    data: alertData,
                    borderColor: '#ff1744',
                    borderWidth: 2,
                    pointBackgroundColor: '#ff1744',
                    pointBorderColor: '#ff1744',
                    pointRadius: 2,
                    pointHoverRadius: 5,
                    fill: true,
                    backgroundColor: alertGradient,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#94a3b8', font: { family: "'Inter', sans-serif" } }
                },
                tooltip: {
                    backgroundColor: 'rgba(11, 18, 36, 0.9)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#94a3b8',
                    borderColor: '#142340',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(20, 35, 64, 0.3)' },
                    ticks: { color: '#94a3b8', font: { family: "'Inter', sans-serif" } }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(20, 35, 64, 0.3)' },
                    ticks: { color: '#94a3b8', font: { family: "'Inter', sans-serif" } }
                }
            }
        }
    });

    if (window.liveChartInterval) clearInterval(window.liveChartInterval);
    window.liveChartInterval = setInterval(() => {
        const chart = charts['live-activity'];
        if (!chart) return;

        let timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        chart.data.labels.shift();
        chart.data.labels.push(timeStr);

        chart.data.datasets[0].data.shift();
        chart.data.datasets[0].data.push(Math.floor(Math.random() * 15) + 30);

        chart.data.datasets[1].data.shift();
        const wsAlertsCount = window.pendingAlertsCount || 0;
        chart.data.datasets[1].data.push(wsAlertsCount);
        window.pendingAlertsCount = 0;

        chart.update('none');
    }, 4000);
}

function renderSeverityChart(counts) {
    destroyChart('severity');
    const labels = Object.keys(counts);
    const values = Object.values(counts);
    if (!labels.length) return;

    const ctx = document.getElementById('chart-severity');
    if (!ctx) return;
    charts['severity'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
            datasets: [{
                data: values,
                backgroundColor: labels.map(l => chartColors[l] || '#94a3b8'),
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10, color: '#94a3b8', font: { size: 12, family: "'Inter', sans-serif" } }
                }
            }
        }
    });
}

function renderStatusChart(counts) {
    destroyChart('status');
    const labels = Object.keys(counts);
    const values = Object.values(counts);
    if (!labels.length) return;

    const ctx = document.getElementById('chart-status');
    if (!ctx) return;
    charts['status'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(l => l.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())),
            datasets: [{
                label: 'Count',
                data: values,
                backgroundColor: labels.map(l => chartColors[l] || '#00f0ff'),
                borderRadius: 6,
                borderSkipped: false,
                maxBarThickness: 48
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { color: 'rgba(20, 35, 64, 0.3)' } },
                x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { display: false } }
            }
        }
    });
}

function renderMitreChart(heatmap) {
    destroyChart('mitre');
    if (!heatmap.length) return;

    const top10 = heatmap.slice(0, 10);
    const ctx = document.getElementById('chart-mitre');
    if (!ctx) return;
    charts['mitre'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top10.map(h => h.technique_id || h.mitre_technique_id || '?'),
            datasets: [{
                label: 'Occurrences',
                data: top10.map(h => h.count || 0),
                backgroundColor: '#00f0ff',
                borderRadius: 4,
                maxBarThickness: 32
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(20, 35, 64, 0.3)' } },
                y: { ticks: { color: '#94a3b8', font: { size: 11, family: "'JetBrains Mono', monospace" } }, grid: { display: false } }
            }
        }
    });
}

function renderCollectorChart(collectors) {
    destroyChart('collectors');
    if (!collectors.length) return;

    const ctx = document.getElementById('chart-collectors');
    if (!ctx) return;
    charts['collectors'] = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: collectors.map(c => c.name || '?'),
            datasets: [{
                label: 'Events Collected',
                data: collectors.map(c => c.events_collected || 0),
                backgroundColor: 'rgba(0, 240, 255, 0.1)',
                borderColor: '#00f0ff',
                pointBackgroundColor: '#00f0ff',
                pointBorderColor: '#fff',
                pointRadius: 4,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: { display: false },
                    grid: { color: 'rgba(20, 35, 64, 0.3)' },
                    angleLines: { color: 'rgba(20, 35, 64, 0.3)' },
                    pointLabels: { color: '#94a3b8', font: { size: 10 } }
                }
            }
        }
    });
}

function renderRecentAlerts(alerts) {
    const tbody = document.getElementById('recent-alerts-body');
    if (!tbody) return;
    if (!alerts.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding:40px;">No alerts detected yet</td></tr>';
        return;
    }
    tbody.innerHTML = alerts.map(a => `
        <tr>
            <td><span class="badge badge-${a.severity} badge-dot">${a.severity}</span></td>
            <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;">${escHtml(a.title)}</td>
            <td><code style="font-size:11px;">${a.mitre_technique || '—'}</code></td>
            <td><strong>${a.risk_score?.toFixed(0) || 0}</strong></td>
            <td><span class="badge badge-${a.status === 'new' ? 'new' : a.status === 'resolved' ? 'success' : 'info'}">${a.status}</span></td>
            <td style="font-size:12px;color:var(--text-muted);">${formatTime(a.created_at)}</td>
        </tr>
    `).join('');
}

// ═══════════════════════════════════════════════════════════════════════════
// ALERTS SECTION
// ═══════════════════════════════════════════════════════════════════════════

async function loadAlerts() {
    const severity = document.getElementById('alert-filter-severity')?.value || '';
    const status = document.getElementById('alert-filter-status')?.value || '';
    let qs = '?limit=100';
    if (severity) qs += `&severity=${severity}`;
    if (status) qs += `&status=${status}`;

    const resp = await apiFetch(`/alerts${qs}`);
    if (!resp || !resp.ok) return;
    const data = await resp.json();

    const tbody = document.getElementById('alerts-table-body');
    const alerts = data.alerts || [];
    if (!alerts.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted" style="padding:40px;">No alerts found</td></tr>';
        return;
    }
    tbody.innerHTML = alerts.map(a => `
        <tr>
            <td><span class="badge badge-${a.severity} badge-dot">${a.severity}</span></td>
            <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;">${escHtml(a.title)}</td>
            <td style="font-size:12px;">${a.source_collector || '—'}</td>
            <td><code style="font-size:11px;">${a.mitre_technique_id || '—'}</code></td>
            <td><strong>${a.risk_score?.toFixed(0) || 0}</strong></td>
            <td><span class="badge badge-${a.status === 'new' ? 'new' : a.status === 'resolved' ? 'success' : 'info'}">${a.status}</span></td>
            <td style="font-size:12px;color:var(--text-muted);">${formatTime(a.created_at)}</td>
            <td>
                <button class="btn btn-ghost btn-sm" onclick="viewAlert('${a.id}')">View</button>
            </td>
        </tr>
    `).join('');
}

async function viewAlert(id) {
    const resp = await apiFetch(`/alerts/${id}`);
    if (!resp || !resp.ok) return;
    const a = await resp.json();

    document.getElementById('modal-alert-title').textContent = a.title || 'Alert Details';
    document.getElementById('modal-alert-body').innerHTML = `
        <div style="display:grid;grid-template-columns:auto 1fr;gap:8px 16px;font-size:13px;">
            <strong>Severity:</strong> <span class="badge badge-${a.severity}">${a.severity}</span>
            <strong>Risk Score:</strong> <span>${a.risk_score}</span>
            <strong>Status:</strong> <span>${a.status}</span>
            <strong>Source:</strong> <span>${a.source_collector || '—'}</span>
            <strong>MITRE:</strong> <span>${a.mitre_technique_id || '—'} ${a.mitre_technique_name || ''}</span>
            <strong>Device:</strong> <span>${a.device_id || '—'}</span>
            <strong>Created:</strong> <span>${formatTime(a.created_at)}</span>
        </div>
        ${a.description ? `<p style="margin-top:16px;font-size:13px;color:var(--text-secondary);">${escHtml(a.description)}</p>` : ''}
        ${a.ai_explanation ? `<div style="margin-top:16px;padding:12px;background:var(--bg-code);border-radius:8px;font-size:13px;white-space:pre-wrap;">${escHtml(a.ai_explanation)}</div>` : ''}
    `;
    document.getElementById('modal-explain-btn').onclick = () => explainAlert(id);
    openModal('alert-modal');
}

async function explainAlert(id) {
    showToast('AI Analysis', 'Generating AI explanation...', 'info');
    const resp = await apiFetch(`/alerts/${id}/explain`);
    if (resp && resp.ok) {
        const data = await resp.json();
        const container = document.getElementById('modal-alert-body');
        container.innerHTML += `<div style="margin-top:16px;padding:12px;background:var(--primary-50);border:1px solid var(--primary-200);border-radius:8px;font-size:13px;white-space:pre-wrap;">${escHtml(data.explanation || '')}</div>`;
        showToast('Done', 'AI explanation generated', 'success');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// DEVICES SECTION
// ═══════════════════════════════════════════════════════════════════════════

async function loadDevices() {
    const resp = await apiFetch('/devices');
    if (!resp || !resp.ok) return;
    const data = await resp.json();

    const grid = document.getElementById('device-grid');
    const devices = data.devices || [];
    if (!devices.length) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💻</div><div class="empty-state-title">No devices monitored</div><div class="empty-state-text">Devices will appear here when agents start reporting telemetry</div></div>';
        return;
    }
    grid.innerHTML = devices.map(d => {
        const risk = d.risk_score || 0;
        const riskClass = risk >= 70 ? 'high' : risk >= 30 ? 'medium' : 'low';
        const isActive = d.status === 'active';
        return `
            <div class="device-card">
                <div class="device-status-dot ${isActive ? 'active' : 'offline'}"></div>
                <div class="device-info">
                    <div class="device-name">${escHtml(d.hostname)}</div>
                    <div class="device-meta">${d.ip_address || 'N/A'} • ${d.os_name || 'Unknown OS'}</div>
                </div>
                <div class="device-risk ${riskClass}">${risk.toFixed(0)}</div>
            </div>
        `;
    }).join('');
}

// ═══════════════════════════════════════════════════════════════════════════
// INCIDENTS, IOCs, PLAYBOOKS, ML, AWARENESS, LOGS, SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

async function loadIncidents() {
    const resp = await apiFetch('/incidents');
    if (!resp || !resp.ok) return;
    const data = await resp.json();
    const tbody = document.getElementById('incidents-table-body');
    const items = data.incidents || [];
    if (!items.length) { tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding:40px;">No incidents</td></tr>'; return; }
    tbody.innerHTML = items.map(i => `
        <tr>
            <td><span class="badge badge-${i.severity}">${i.severity}</span></td>
            <td>${escHtml(i.title)}</td>
            <td><span class="badge badge-${i.status === 'open' ? 'new' : 'success'}">${i.status}</span></td>
            <td>${i.alert_count || '—'}</td>
            <td style="font-size:12px;">${formatTime(i.created_at)}</td>
        </tr>
    `).join('');
}

async function loadIOCs() {
    const resp = await apiFetch('/threats/ioc');
    if (!resp || !resp.ok) return;
    const data = await resp.json();
    const tbody = document.getElementById('iocs-table-body');
    const items = data.iocs || [];
    if (!items.length) { tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding:40px;">No IOCs found</td></tr>'; return; }
    tbody.innerHTML = items.map(i => `
        <tr>
            <td><span class="badge badge-info">${i.ioc_type}</span></td>
            <td class="text-mono" style="font-size:12px;">${escHtml(i.value || i.ioc_value || '')}</td>
            <td>${i.source || '—'}</td>
            <td><span class="badge badge-${i.severity || 'info'}">${i.severity || 'info'}</span></td>
            <td style="font-size:12px;">${formatTime(i.created_at)}</td>
        </tr>
    `).join('');
}

async function loadMitreHeatmap() {
    const resp = await apiFetch('/mitre/heatmap');
    if (!resp || !resp.ok) return;
    const data = await resp.json();
    destroyChart('mitre-full');
    const heatmap = data.heatmap || [];
    if (!heatmap.length) return;
    const ctx = document.getElementById('chart-mitre-full');
    if (!ctx) return;
    charts['mitre-full'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: heatmap.map(h => `${h.technique_id || h.mitre_technique_id || '?'}`),
            datasets: [{
                label: 'Detections',
                data: heatmap.map(h => h.count || 0),
                backgroundColor: '#8B1A1A',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true }, y: { ticks: { font: { size: 11, family: "'JetBrains Mono', monospace" } } } }
        }
    });
}

async function loadPlaybooks() {
    const resp = await apiFetch('/playbooks');
    if (!resp || !resp.ok) return;
    const data = await resp.json();
    const grid = document.getElementById('playbooks-grid');
    const playbooks = data.playbooks || [];
    grid.innerHTML = playbooks.map(p => `
        <div class="card">
            <div class="card-header"><div class="card-title"><span class="card-icon">📖</span> ${escHtml(p.name || p.id)}</div></div>
            <div class="card-body">
                <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">${escHtml(p.description || '')}</p>
                <div style="font-size:12px;color:var(--text-muted);">Steps: ${p.steps?.length || 0} • Severity: ${p.severity || '—'}</div>
            </div>
        </div>
    `).join('');
}

async function loadMLStatus() {
    const resp = await apiFetch('/ml/status');
    if (!resp || !resp.ok) return;
    const data = await resp.json();
    document.getElementById('ml-model-name').textContent = data.model_name || '—';
    document.getElementById('ml-model-size').textContent = data.size_bytes ? (data.size_bytes / 1024).toFixed(0) + ' KB' : '—';
    document.getElementById('ml-last-trained').textContent = data.last_trained ? formatTime(data.last_trained) : 'Never';
    document.getElementById('ml-contamination').textContent = data.contamination ?? '—';
}

async function retrainModel() {
    showToast('ML Engine', 'Requesting model retraining...', 'info');
    const resp = await apiFetch('/ml/train', { method: 'POST' });
    if (resp && resp.ok) {
        const data = await resp.json();
        showToast('Model Retrained', `Trained on ${data.stats?.samples_count || 0} samples`, 'success');
        loadMLStatus();
    } else {
        const err = resp ? await resp.json() : {};
        showToast('Training Failed', err.detail || 'No training data available', 'danger');
    }
}

async function loadAwareness() {
    const tipResp = await apiFetch('/awareness/tips');
    if (tipResp && tipResp.ok) {
        const data = await tipResp.json();
        document.getElementById('awareness-tip').innerHTML = `
            <h3 style="font-size:var(--font-size-lg);font-weight:700;margin-bottom:8px;">${escHtml(data.daily_tip?.title || 'Security Tip')}</h3>
            <p style="font-size:var(--font-size-sm);color:var(--text-secondary);line-height:1.6;">${escHtml(data.daily_tip?.description || data.daily_tip?.tip || '')}</p>
        `;
    }
    const quizResp = await apiFetch('/awareness/quiz');
    if (quizResp && quizResp.ok) {
        const data = await quizResp.json();
        const q = data.quiz || data;
        if (q.question) {
            const opts = q.options || [];
            document.getElementById('awareness-quiz').innerHTML = `
                <p style="font-weight:600;margin-bottom:16px;">${escHtml(q.question)}</p>
                <div style="display:flex;flex-direction:column;gap:8px;">
                    ${opts.map((o, i) => `<button class="btn btn-secondary btn-sm" onclick="answerQuiz(${q.id || 0},${i})" style="text-align:left;">${escHtml(o)}</button>`).join('')}
                </div>
            `;
        }
    }
}

async function answerQuiz(quizId, answer) {
    const resp = await apiFetch(`/awareness/quiz/${quizId}/answer?answer=${answer}`, { method: 'POST' });
    if (resp && resp.ok) {
        const data = await resp.json();
        showToast(data.correct ? '✅ Correct!' : '❌ Wrong', data.explanation || '', data.correct ? 'success' : 'warning');
    }
}

async function loadLogs() {
    const query = document.getElementById('log-search')?.value || '';
    const severity = document.getElementById('log-severity-filter')?.value || '';
    let qs = '?limit=50';
    if (query) qs += `&query=${encodeURIComponent(query)}`;
    if (severity) qs += `&severity=${severity}`;

    const resp = await apiFetch(`/logs/search${qs}`);
    if (!resp || !resp.ok) return;
    const data = await resp.json();
    const viewer = document.getElementById('log-viewer');
    const logs = data.results || [];
    if (!logs.length) { viewer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📜</div><div class="empty-state-title">No logs found</div></div>'; return; }
    viewer.innerHTML = logs.map(l => `
        <div class="log-entry">
            <span class="log-time">${formatTime(l.timestamp || l.created_at)}</span>
            <span class="log-level ${(l.severity || 'info').toLowerCase()}">${(l.severity || 'INFO').toUpperCase()}</span>
            <span class="log-text">${escHtml(l.title || l.event_type || JSON.stringify(l).slice(0, 120))}</span>
        </div>
    `).join('');
}

async function loadSettings() {
    if (currentUser) {
        document.getElementById('settings-username').textContent = currentUser.username || '—';
        document.getElementById('settings-email').textContent = currentUser.email || '—';
        document.getElementById('settings-role').textContent = currentUser.role || '—';
    }
}

async function setup2FA() {
    const resp = await apiFetch('/auth/2fa/setup', { method: 'POST' });
    if (resp && resp.ok) {
        const data = await resp.json();
        document.getElementById('qr-code-container').classList.remove('hidden');
        if (data.qr_code) document.getElementById('qr-code-img').src = data.qr_code;
        document.getElementById('totp-secret').textContent = `Secret: ${data.secret || ''}`;
        showToast('2FA Setup', 'Scan the QR code with your authenticator app', 'success');
    } else {
        showToast('Error', 'Could not setup 2FA', 'danger');
    }
}

async function generateReport() {
    showToast('Report', 'Generating SOC report & PDF...', 'info');
    const resp = await apiFetch('/reports/soc');
    if (resp && resp.ok) {
        const data = await resp.json();
        showToast('Report Ready', 'SOC report and PDF generated successfully', 'success');
        if (data.pdf_url) {
            const link = document.createElement('a');
            link.href = data.pdf_url;
            link.download = data.pdf_url.split('/').pop();
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } else {
        showToast('Error', 'Could not generate report', 'danger');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// AI CHAT
// ═══════════════════════════════════════════════════════════════════════════

async function sendChat() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';

    const messages = document.getElementById('chat-messages');
    messages.innerHTML += `<div class="chat-msg user">${escHtml(msg)}</div>`;
    messages.scrollTop = messages.scrollHeight;

    let answer = '';
    if (window.puter?.ai?.chat) {
        try {
            const response = await puter.ai.chat(msg, { model: 'gemini-3.7-flash' });
            answer = typeof response === 'string' ? response : response?.message?.content || response?.text || '';
        } catch (error) { console.warn('Puter AI unavailable, using backend chat', error); }
    }

    if (!answer) {
        const endpoint = currentUser?.role === 'soc_analyst' ? '/chatbot/soc' : '/chatbot/layman';
        const resp = await apiFetch(endpoint, { method: 'POST', body: JSON.stringify({ message: msg }) });
        if (resp && resp.ok) {
            const data = await resp.json();
            answer = data.response || data.reply || '';
        }
    }
    messages.innerHTML += `<div class="chat-msg assistant">${escHtml(answer || 'Sorry, I could not process that request.')}</div>`;
    messages.scrollTop = messages.scrollHeight;
}

// ═══════════════════════════════════════════════════════════════════════════
// WEBSOCKET LIVE EVENTS
// ═══════════════════════════════════════════════════════════════════════════

function connectWebSocket() {
    if (wsConnection) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/v1/dashboard/live`;

    try {
        wsConnection = new WebSocket(wsUrl);
        wsConnection.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // Increment pending alerts count for real-time line chart plot
                window.pendingAlertsCount = (window.pendingAlertsCount || 0) + 1;
                
                if (data.severity === 'critical' || data.severity === 'high') {
                    showToast('🚨 Live Alert', data.title || 'New security event detected', 'danger');
                    document.getElementById('notification-dot').style.display = 'block';
                }
            } catch (e) { /* ignore parse errors */ }
        };
        wsConnection.onclose = () => {
            wsConnection = null;
            setTimeout(connectWebSocket, 5000);
        };
    } catch (e) { /* WebSocket not available */ }
}

// ═══════════════════════════════════════════════════════════════════════════
// MODAL HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function escHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

function formatTime(isoStr) {
    if (!isoStr) return '—';
    try {
        const d = new Date(isoStr);
        const now = new Date();
        const diff = (now - d) / 1000;
        if (diff < 60) return 'Just now';
        if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
        if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return String(isoStr).slice(0, 16); }
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

(function init() {
    const hash = window.location.hash.replace('#', '') || '';

    if (jwtToken) {
        // Validate existing token
        apiFetch('/auth/me').then(resp => {
            if (resp && resp.ok) {
                resp.json().then(user => {
                    currentUser = user;
                    enterDashboard();
                });
            } else {
                jwtToken = '';
                localStorage.removeItem('kavach_token');
                navigateTo('login');
            }
        });
    } else {
        navigateTo(hash || 'login');
    }
})();
