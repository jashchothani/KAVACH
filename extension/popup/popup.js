// ==========================================================================
// KAVACH Web, Gmail & WhatsApp Threat Sentinel — Unified Popup Controller
// Sovereign Threat Detection, Raksha AI Intelligence & Live API Integration
// ==========================================================================

const CLOUD_API_URL = "https://api.kavachcybertech.in/api/v1";
const LOCAL_API_URL = "http://localhost:8000/api/v1";
let activeApiUrl = CLOUD_API_URL;

document.addEventListener("DOMContentLoaded", async () => {
  // --- Tab 1 Elements (Web Shield) ---
  const targetUrlEl = document.getElementById("targetUrl");
  const schemeIconEl = document.getElementById("schemeIcon");
  const copyUrlBtn = document.getElementById("copyUrlBtn");
  const verdictCardEl = document.getElementById("verdictCard");
  const gaugeProgressEl = document.getElementById("gaugeProgress");
  const scoreValEl = document.getElementById("scoreVal");
  const statusBadgeEl = document.getElementById("statusBadge");
  const verdictTitleEl = document.getElementById("verdictTitle");
  const verdictSubtitleEl = document.getElementById("verdictSubtitle");
  const indicatorListEl = document.getElementById("indicatorList");
  const aiSummaryEl = document.getElementById("aiSummary");
  const backendStatusEl = document.getElementById("backendStatus");
  const statusTextEl = document.getElementById("statusText");

  // Checklist elements
  const checkSslVal = document.getElementById("checkSslVal");
  const checkDomainVal = document.getElementById("checkDomainVal");
  const checkHeuristicsVal = document.getElementById("checkHeuristicsVal");
  const checkAiVal = document.getElementById("checkAiVal");

  // --- Theme Toggle Elements ---
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const themeToggleIcon = document.getElementById("themeToggleIcon");

  // --- Tab 2 Elements (Gmail & WhatsApp) ---
  const gmailShieldToggle = document.getElementById("gmailShieldToggle");
  const whatsappShieldToggle = document.getElementById("whatsappShieldToggle");

  // --- Tab 3 Elements (Universal Scanner) ---
  const scannerTypeBtns = document.querySelectorAll(".scanner-type-btn");
  const manualInput = document.getElementById("manualInput");
  const manualScanBtn = document.getElementById("manualScanBtn");
  const scanResultCard = document.getElementById("scanResultCard");
  const scanResultTarget = document.getElementById("scanResultTarget");
  const scanResultBadge = document.getElementById("scanResultBadge");
  const scanResultScore = document.getElementById("scanResultScore");
  const scanResultSummary = document.getElementById("scanResultSummary");
  const scanResultIndicators = document.getElementById("scanResultIndicators");
  let activeScanType = "url";

  // --- Tab 4 Elements (Settings & Events) ---
  const linkAnnotatorToggle = document.getElementById("linkAnnotatorToggle");
  const strictShieldToggle = document.getElementById("strictShieldToggle");
  const recentThreatsList = document.getElementById("recentThreatsList");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");

  // --- Tab 5 Elements (Diagnostics & API Selector) ---
  const radioServerCloud = document.getElementById("radioServerCloud");
  const radioServerLocal = document.getElementById("radioServerLocal");
  const customApiInput = document.getElementById("customApiInput");
  const saveCustomApiBtn = document.getElementById("saveCustomApiBtn");
  const apiLiveBadge = document.getElementById("apiLiveBadge");
  const runDiagnosticsBtn = document.getElementById("runDiagnosticsBtn");

  // --- Footer Elements ---
  const rescanBtn = document.getElementById("rescanBtn");
  const openSocBtn = document.getElementById("openSocBtn");

  // ========================================================================
  // 1. Theme Management (Light Theme Default)
  // ========================================================================
  function initTheme() {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["kavach_theme"], (res) => {
        const theme = res.kavach_theme || "light";
        applyTheme(theme);
      });
    } else {
      applyTheme("light");
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (themeToggleIcon) {
      themeToggleIcon.textContent = theme === "dark" ? "☀️" : "🌙";
      themeToggleBtn.title = theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme";
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ kavach_theme: next });
      }
    });
  }

  // ========================================================================
  // 2. API Server Configuration & Storage
  // ========================================================================
  async function initApiServer() {
    return new Promise((resolve) => {
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["kavach_api_url"], (res) => {
          if (res.kavach_api_url) {
            activeApiUrl = res.kavach_api_url;
          } else {
            activeApiUrl = CLOUD_API_URL;
            chrome.storage.local.set({ kavach_api_url: CLOUD_API_URL });
          }
          syncApiRadioUi();
          resolve();
        });
      } else {
        activeApiUrl = CLOUD_API_URL;
        syncApiRadioUi();
        resolve();
      }
    });
  }

  function syncApiRadioUi() {
    if (activeApiUrl === CLOUD_API_URL) {
      if (radioServerCloud) radioServerCloud.checked = true;
    } else if (activeApiUrl === LOCAL_API_URL) {
      if (radioServerLocal) radioServerLocal.checked = true;
    } else {
      if (radioServerCloud) radioServerCloud.checked = false;
      if (radioServerLocal) radioServerLocal.checked = false;
      if (customApiInput) customApiInput.value = activeApiUrl;
    }
  }

  function setApiServer(newUrl) {
    activeApiUrl = newUrl.replace(/\/+$/, "");
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ kavach_api_url: activeApiUrl });
    }
    // Notify background worker
    try {
      chrome.runtime.sendMessage({ type: "SET_API_URL", apiUrl: activeApiUrl });
    } catch (e) {}

    syncApiRadioUi();
    checkServerHealth();
  }

  if (radioServerCloud) {
    radioServerCloud.addEventListener("change", () => {
      if (radioServerCloud.checked) setApiServer(CLOUD_API_URL);
    });
  }

  if (radioServerLocal) {
    radioServerLocal.addEventListener("change", () => {
      if (radioServerLocal.checked) setApiServer(LOCAL_API_URL);
    });
  }

  if (saveCustomApiBtn && customApiInput) {
    saveCustomApiBtn.addEventListener("click", () => {
      const val = customApiInput.value.trim();
      if (!val) return;
      setApiServer(val);
      saveCustomApiBtn.textContent = "Saved!";
      setTimeout(() => {
        saveCustomApiBtn.textContent = "Connect";
      }, 1500);
    });
  }

  // ========================================================================
  // 3. Navigation Tabs
  // ========================================================================
  document.querySelectorAll(".nav-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-tab").forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      const targetPane = document.getElementById(btn.dataset.tab);
      if (targetPane) targetPane.classList.add("active");

      if (btn.dataset.tab === "diagnosticsSection") {
        runDiagnostics();
      }
    });
  });

  // ========================================================================
  // 4. Copy URL Button
  // ========================================================================
  if (copyUrlBtn) {
    copyUrlBtn.addEventListener("click", () => {
      const text = targetUrlEl ? targetUrlEl.textContent : "";
      if (text && !text.startsWith("Inspecting") && !text.startsWith("Unable")) {
        navigator.clipboard.writeText(text).then(() => {
          copyUrlBtn.innerHTML = "✓";
          copyUrlBtn.style.color = "var(--accent-safe)";
          setTimeout(() => {
            copyUrlBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
            copyUrlBtn.style.color = "";
          }, 1500);
        });
      }
    });
  }

  // ========================================================================
  // 5. Settings Toggles
  // ========================================================================
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(
      [
        "linkAnnotatorEnabled",
        "strictPhishingShield",
        "gmailShieldEnabled",
        "whatsappShieldEnabled",
        "recentThreats",
      ],
      (res) => {
        if (res.linkAnnotatorEnabled !== undefined && linkAnnotatorToggle) {
          linkAnnotatorToggle.checked = res.linkAnnotatorEnabled;
        }
        if (res.strictPhishingShield !== undefined && strictShieldToggle) {
          strictShieldToggle.checked = res.strictPhishingShield;
        }
        if (res.gmailShieldEnabled !== undefined && gmailShieldToggle) {
          gmailShieldToggle.checked = res.gmailShieldEnabled;
        }
        if (res.whatsappShieldEnabled !== undefined && whatsappShieldToggle) {
          whatsappShieldToggle.checked = res.whatsappShieldEnabled;
        }
        renderRecentThreats(res.recentThreats || []);
      }
    );

    if (linkAnnotatorToggle) {
      linkAnnotatorToggle.addEventListener("change", (e) => {
        chrome.storage.local.set({ linkAnnotatorEnabled: e.target.checked });
      });
    }

    if (strictShieldToggle) {
      strictShieldToggle.addEventListener("change", (e) => {
        chrome.storage.local.set({ strictPhishingShield: e.target.checked });
      });
    }

    if (gmailShieldToggle) {
      gmailShieldToggle.addEventListener("change", (e) => {
        chrome.storage.local.set({ gmailShieldEnabled: e.target.checked });
      });
    }

    if (whatsappShieldToggle) {
      whatsappShieldToggle.addEventListener("change", (e) => {
        chrome.storage.local.set({ whatsappShieldEnabled: e.target.checked });
      });
    }
  }

  function renderRecentThreats(threats) {
    if (!recentThreatsList) return;
    if (!threats || threats.length === 0) {
      recentThreatsList.innerHTML = `<li class="threat-empty">No suspicious domains or scam numbers intercepted recently. System secure!</li>`;
      return;
    }
    recentThreatsList.innerHTML = "";
    threats.slice(0, 10).forEach((t) => {
      const li = document.createElement("li");
      li.className = "threat-item";
      li.innerHTML = `
        <span style="font-weight: 700; color: var(--accent-red);">${escapeHtml(t.domain || t.target || "Threat")}</span>
        <span style="color: var(--text-muted); font-size: 10px;">Risk: ${Math.round(t.risk_score || 85)}/100 · ${escapeHtml(t.type || "Flagged")}</span>
      `;
      recentThreatsList.appendChild(li);
    });
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", () => {
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ recentThreats: [] }, () => {
          renderRecentThreats([]);
        });
      }
    });
  }

  // ========================================================================
  // 6. Real-time Backend Health & Latency Monitor
  // ========================================================================
  async function checkServerHealth() {
    if (backendStatusEl) {
      backendStatusEl.className = "backend-status";
      statusTextEl.textContent = "Connecting...";
    }
    if (apiLiveBadge) {
      apiLiveBadge.textContent = "PINGING...";
      apiLiveBadge.style.color = "var(--text-muted)";
    }

    const t0 = performance.now();
    try {
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 4500);

      const resp = await fetch(`${activeApiUrl}/health`, {
        signal: ctrl.signal,
        headers: { "Accept": "application/json" },
      });
      clearTimeout(timeoutId);

      const latency = Math.round(performance.now() - t0);

      if (resp.ok) {
        const isCloud = activeApiUrl.includes("kavachcybertech.in");
        const serverLabel = isCloud ? "Cloud" : "Local";

        if (backendStatusEl) {
          backendStatusEl.className = "backend-status";
          statusTextEl.textContent = `${serverLabel} · ${latency}ms`;
          backendStatusEl.title = `Connected to ${activeApiUrl} (${latency}ms roundtrip)`;
        }
        if (apiLiveBadge) {
          apiLiveBadge.textContent = `LIVE · ${latency}ms`;
          apiLiveBadge.style.color = "var(--accent-safe)";
        }
        return { ok: true, latency };
      } else {
        throw new Error(`HTTP ${resp.status}`);
      }
    } catch (err) {
      if (backendStatusEl) {
        backendStatusEl.className = "backend-status warn";
        statusTextEl.textContent = "Local Heuristics";
        backendStatusEl.title = `Cannot reach ${activeApiUrl} — using client-side heuristic engine`;
      }
      if (apiLiveBadge) {
        apiLiveBadge.textContent = "OFFLINE";
        apiLiveBadge.style.color = "var(--accent-warn)";
      }
      return { ok: false, error: err.message };
    }
  }

  if (backendStatusEl) {
    backendStatusEl.addEventListener("click", () => {
      checkServerHealth();
    });
  }

  // ========================================================================
  // 7. Active Tab Telemetry & Inspection
  // ========================================================================
  async function inspectCurrentTab() {
    statusBadgeEl.textContent = "SCANNING...";
    verdictTitleEl.textContent = "Analyzing destination telemetry...";
    verdictSubtitleEl.textContent = "Querying KAVACH Neural Shield";
    verdictCardEl.className = "verdict-banner";
    scoreValEl.textContent = "--";
    gaugeProgressEl.setAttribute("stroke-dasharray", "0, 100");

    let tabs;
    try {
      tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    } catch (e) {
      targetUrlEl.textContent = "Unable to read active tab";
      return;
    }

    if (!tabs || tabs.length === 0 || !tabs[0].url) {
      targetUrlEl.textContent = "Chrome Internal / New Tab";
      schemeIconEl.textContent = "⚪";
      verdictCardEl.className = "verdict-banner safe";
      statusBadgeEl.textContent = "SYSTEM";
      verdictTitleEl.textContent = "Internal Browser Space";
      verdictSubtitleEl.textContent = "Browser system page";
      scoreValEl.textContent = "0";
      gaugeProgressEl.setAttribute("stroke-dasharray", "0, 100");
      aiSummaryEl.textContent = "System tab is inherently secure.";
      indicatorListEl.innerHTML = "<li class='indicator-item'>Internal browser component. No external network traffic.</li>";
      checkSslVal.textContent = "N/A";
      checkDomainVal.textContent = "System";
      checkHeuristicsVal.textContent = "Clean";
      checkAiVal.textContent = "Idle";
      return;
    }

    const currentUrl = tabs[0].url;
    targetUrlEl.textContent = currentUrl;

    if (currentUrl.startsWith("https://")) {
      schemeIconEl.textContent = "🔒";
      checkSslVal.textContent = "TLS Valid";
      checkSslVal.style.color = "var(--accent-safe)";
    } else if (currentUrl.startsWith("http://")) {
      schemeIconEl.textContent = "⚠️";
      checkSslVal.textContent = "Insecure HTTP";
      checkSslVal.style.color = "var(--accent-warn)";
    } else {
      schemeIconEl.textContent = "🌐";
      checkSslVal.textContent = "Local / Scheme";
      checkSslVal.style.color = "var(--text-muted)";
    }

    // Call API Server for Real Threat Scan
    try {
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 4000);

      const resp = await fetch(`${activeApiUrl}/url/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: currentUrl }),
        signal: ctrl.signal,
      });
      clearTimeout(timeoutId);

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      const score = Math.round(data.risk_score || 0);
      const level = data.risk_level || "SAFE";

      scoreValEl.textContent = score;
      gaugeProgressEl.setAttribute("stroke-dasharray", `${score}, 100`);
      statusBadgeEl.textContent = level;

      if (score >= 60 || level === "CRITICAL" || level === "HIGH RISK") {
        verdictCardEl.className = "verdict-banner danger";
        verdictTitleEl.textContent = "High-Risk Threat / Phishing";
        verdictSubtitleEl.textContent = "Severe security indicators or malicious patterns found";
        checkDomainVal.textContent = "Flagged";
        checkDomainVal.style.color = "var(--accent-danger)";
        checkHeuristicsVal.textContent = "Flagged";
        checkHeuristicsVal.style.color = "var(--accent-danger)";
        checkAiVal.textContent = "Threat";
        checkAiVal.style.color = "var(--accent-danger)";
      } else if (score >= 30 || level === "SUSPICIOUS") {
        verdictCardEl.className = "verdict-banner warn";
        verdictTitleEl.textContent = "Suspicious Domain / Caution";
        verdictSubtitleEl.textContent = "Unusual patterns or new registration detected";
        checkDomainVal.textContent = "Caution";
        checkDomainVal.style.color = "var(--accent-warn)";
        checkHeuristicsVal.textContent = "Unusual";
        checkHeuristicsVal.style.color = "var(--accent-warn)";
        checkAiVal.textContent = "Monitored";
        checkAiVal.style.color = "var(--accent-warn)";
      } else {
        verdictCardEl.className = "verdict-banner safe";
        verdictTitleEl.textContent = "Verified Safe Destination";
        verdictSubtitleEl.textContent = "Protected by KAVACH Neural Shield";
        checkDomainVal.textContent = "Reputable";
        checkDomainVal.style.color = "var(--accent-safe)";
        checkHeuristicsVal.textContent = "Clean";
        checkHeuristicsVal.style.color = "var(--accent-safe)";
        checkAiVal.textContent = "Safe";
        checkAiVal.style.color = "var(--accent-safe)";
      }

      // Render indicators
      indicatorListEl.innerHTML = "";
      const indicators = data.indicators || [];
      if (indicators.length === 0) {
        indicatorListEl.innerHTML = "<li class='indicator-item'>No phishing signals, homograph tricks, or brand spoofs detected.</li>";
      } else {
        indicators.forEach((ind) => {
          const li = document.createElement("li");
          li.className = "indicator-item";
          li.textContent = ind;
          indicatorListEl.appendChild(li);
        });
      }

      // Render Raksha AI summary
      aiSummaryEl.textContent = data.raksha_summary || "Raksha AI evaluated this website and verified baseline security.";
    } catch (err) {
      // Offline fallback: perform local client-side heuristics
      const localResult = evaluateLocalUrl(currentUrl);

      scoreValEl.textContent = localResult.score;
      gaugeProgressEl.setAttribute("stroke-dasharray", `${localResult.score}, 100`);
      statusBadgeEl.textContent = localResult.level;

      if (localResult.score >= 60) {
        verdictCardEl.className = "verdict-banner danger";
        verdictTitleEl.textContent = "Potential Phishing Destination";
        verdictSubtitleEl.textContent = localResult.subtitle;
        checkDomainVal.textContent = "Suspicious";
        checkDomainVal.style.color = "var(--accent-danger)";
      } else {
        verdictCardEl.className = "verdict-banner safe";
        verdictTitleEl.textContent = "Website Monitored Locally";
        verdictSubtitleEl.textContent = "Local heuristic checks clean (Backend offline)";
        checkDomainVal.textContent = "Verified";
        checkDomainVal.style.color = "var(--accent-safe)";
      }

      indicatorListEl.innerHTML = "";
      localResult.indicators.forEach((ind) => {
        const li = document.createElement("li");
        li.className = "indicator-item";
        li.textContent = ind;
        indicatorListEl.appendChild(li);
      });

      aiSummaryEl.textContent = localResult.summary;
    }
  }

  // ========================================================================
  // 8. Scanner Type Selector & Engine
  // ========================================================================
  scannerTypeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      scannerTypeBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeScanType = btn.dataset.type;

      if (activeScanType === "url") {
        manualInput.placeholder = "https://example.com/login";
      } else if (activeScanType === "email") {
        manualInput.placeholder = "support@service-update-verify.com";
      } else if (activeScanType === "phone") {
        manualInput.placeholder = "+92 300 1234567 or +234 801 2345678";
      }
    });
  });

  manualScanBtn.addEventListener("click", async () => {
    const query = manualInput.value.trim();
    if (!query) return;

    manualScanBtn.disabled = true;
    manualScanBtn.textContent = "Scanning...";

    try {
      let resultData;
      if (activeScanType === "url") {
        resultData = await scanUrlQuery(query);
      } else if (activeScanType === "email") {
        resultData = await scanEmailQuery(query);
      } else if (activeScanType === "phone") {
        resultData = await scanPhoneQuery(query);
      }

      renderScanResult(resultData, query);
    } catch (err) {
      alert(`Scan failed: ${err.message}`);
    } finally {
      manualScanBtn.disabled = false;
      manualScanBtn.textContent = "Analyze";
    }
  });

  async function scanUrlQuery(url) {
    try {
      const resp = await fetch(`${activeApiUrl}/url/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {}
    return evaluateLocalUrl(url);
  }

  async function scanEmailQuery(email) {
    try {
      const resp = await fetch(`${activeApiUrl}/ml/scan-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender_email: email, body: email }),
      });
      if (resp.ok) {
        const ml = await resp.json();
        return {
          target: email,
          risk_score: ml.risk_score,
          risk_level: ml.risk_level,
          raksha_summary: ml.raksha_summary,
          indicators: ml.indicators,
        };
      }
    } catch (e) {}

    return localScanEmail(email);
  }

  async function scanPhoneQuery(phone) {
    return localScanPhone(phone);
  }

  function localScanEmail(email) {
    const emailNorm = email.toLowerCase().trim();
    const domainMatch = emailNorm.match(/@([a-z0-9.-]+\.[a-z]{2,})/);
    const domain = domainMatch ? domainMatch[1] : emailNorm;

    const indicators = [];
    let score = 5;

    const brands = ["google", "microsoft", "paypal", "apple", "amazon", "netflix", "sbi", "hdfc", "incometax"];
    for (const b of brands) {
      if (domain.includes(b) && !domain.endsWith(`.${b}.com`) && domain !== `${b}.com` && !domain.endsWith(`.${b}.in`)) {
        score += 65;
        indicators.push(`Brand Impersonation: domain contains '${b}' but is not the authentic company domain.`);
      }
    }

    if (/(security|verify|support|account|update|alert|billing|auth)/.test(emailNorm)) {
      score += 20;
      indicators.push("Uses high-urgency security or verification keywords.");
    }

    if (/\.(xyz|top|ru|tk|ml|ga|cf|gq|work|click|country|buzz)$/.test(domain)) {
      score += 30;
      indicators.push(`Unusual or high-risk domain extension (.${domain.split(".").pop()}).`);
    }

    score = Math.min(100, score);
    const level = score >= 65 ? "CRITICAL PHISHING" : score >= 35 ? "SUSPICIOUS" : "SAFE";

    return {
      target: email,
      risk_score: score,
      risk_level: level,
      raksha_summary:
        score >= 65
          ? "High-risk sender pattern detected. Do not click links or respond with OTPs/passwords."
          : "Sender address does not show obvious known spoofing signatures. Exercise normal caution.",
      indicators: indicators.length > 0 ? indicators : ["Standard sender address syntax. No obvious spoofing signatures."],
    };
  }

  function localScanPhone(phone) {
    const cleaned = phone.replace(/[\s\-\(\)]/g, "");
    let score = 5;
    const indicators = [];

    const highRiskPrefixes = [
      { prefix: "+92", country: "Pakistan (+92)" },
      { prefix: "+234", country: "Nigeria (+234)" },
      { prefix: "+880", country: "Bangladesh (+880)" },
      { prefix: "+855", country: "Cambodia (+855)" },
      { prefix: "+62", country: "Indonesia (+62)" },
      { prefix: "+94", country: "Sri Lanka (+94)" },
      { prefix: "+4470", country: "UK Premium Rate Number (+4470)" },
      { prefix: "+254", country: "Kenya (+254)" },
    ];

    const foundPrefix = highRiskPrefixes.find((p) => cleaned.startsWith(p.prefix));
    if (foundPrefix) {
      score += 75;
      indicators.push(`High-Risk Origin: Prefix matches ${foundPrefix.country}.`);
      indicators.push("Frequently observed in unsolicited Telegram/WhatsApp part-time job & investment fraud.");
    } else {
      indicators.push("Phone number prefix does not match known high-density international scam blocks.");
    }

    score = Math.min(100, score);
    const level = score >= 65 ? "HIGH-RISK SCAM" : score >= 30 ? "SUSPICIOUS" : "NORMAL";

    return {
      target: phone,
      risk_score: score,
      risk_level: level,
      raksha_summary:
        score >= 65
          ? "Scam alert! This number matches origin networks associated with mass WhatsApp tasks, lottery scams, and APK dropper campaigns."
          : "No immediate threat signature found on this telephone prefix. Never share OTPs or install APKs sent via chat.",
      indicators,
    };
  }

  function evaluateLocalUrl(urlStr) {
    let score = 5;
    const indicators = [];
    let domain = urlStr;

    try {
      const parsed = new URL(urlStr.startsWith("http") ? urlStr : `https://${urlStr}`);
      domain = parsed.hostname;

      if (parsed.protocol === "http:") {
        score += 25;
        indicators.push("Unencrypted HTTP transmission (no TLS certificate).");
      }

      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
        score += 60;
        indicators.push("Raw IP address used as website host (typical phishing behavior).");
      }

      if (domain.includes("xn--")) {
        score += 50;
        indicators.push("Punycode / Homograph domain trick detected (character spoofing).");
      }

      if (/\.(xyz|top|ru|tk|ml|ga|cf|gq|work|click)$/.test(domain)) {
        score += 25;
        indicators.push(`High-risk domain extension (.${domain.split(".").pop()}).`);
      }

      const brands = ["google", "microsoft", "paypal", "apple", "amazon", "netflix", "sbi", "hdfc", "incometax"];
      for (const b of brands) {
        if (domain.includes(b) && !domain.endsWith(`.${b}.com`) && domain !== `${b}.com` && !domain.endsWith(`.${b}.in`)) {
          score += 60;
          indicators.push(`Potential brand impersonation: domain resembles '${b}'.`);
        }
      }
    } catch (e) {
      score += 15;
      indicators.push("Invalid or irregular URL syntax.");
    }

    score = Math.min(100, score);
    const level = score >= 60 ? "CRITICAL" : score >= 30 ? "SUSPICIOUS" : "SAFE";

    return {
      domain,
      risk_score: score,
      risk_level: level,
      subtitle: score >= 60 ? "Heuristic threat signatures detected" : "No obvious threat indicators found",
      indicators: indicators.length > 0 ? indicators : ["Standard domain structure. No obvious spoofing signatures."],
      summary:
        score >= 60
          ? "KAVACH local heuristic engine detected suspicious URL attributes consistent with phishing or spoofing."
          : "Verified baseline safety with client-side heuristic inspection.",
    };
  }

  function renderScanResult(data, query) {
    scanResultCard.style.display = "flex";
    scanResultTarget.textContent = data.target || data.domain || query;

    const score = Math.round(data.risk_score || 0);
    scanResultScore.textContent = `${score}/100`;
    scanResultBadge.textContent = data.risk_level || "SAFE";

    if (score >= 65 || (data.risk_level && data.risk_level.includes("HIGH")) || (data.risk_level && data.risk_level.includes("CRITICAL"))) {
      scanResultBadge.style.background = "var(--accent-danger-bg)";
      scanResultBadge.style.color = "var(--accent-danger)";
      scanResultCard.style.borderColor = "var(--border-crimson)";
    } else if (score >= 30) {
      scanResultBadge.style.background = "var(--accent-warn-bg)";
      scanResultBadge.style.color = "var(--accent-warn)";
      scanResultCard.style.borderColor = "var(--accent-warn-border)";
    } else {
      scanResultBadge.style.background = "var(--accent-safe-bg)";
      scanResultBadge.style.color = "var(--accent-safe)";
      scanResultCard.style.borderColor = "var(--accent-safe-border)";
    }

    scanResultSummary.textContent = data.raksha_summary || "Scan completed.";

    scanResultIndicators.innerHTML = "";
    (data.indicators || []).forEach((ind) => {
      const li = document.createElement("li");
      li.className = "indicator-item";
      li.textContent = ind;
      scanResultIndicators.appendChild(li);
    });

    // Save to recent threats if elevated risk
    if (score >= 40 && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["recentThreats"], (res) => {
        const list = res.recentThreats || [];
        list.unshift({
          domain: data.target || data.domain || query,
          risk_score: score,
          type: activeScanType.toUpperCase(),
          time: new Date().toLocaleTimeString(),
        });
        chrome.storage.local.set({ recentThreats: list.slice(0, 15) });
      });
    }
  }

  // ========================================================================
  // 9. Diagnostics Engine & Telemetry Health
  // ========================================================================
  async function runDiagnostics() {
    const manifest = chrome.runtime?.getManifest ? chrome.runtime.getManifest() : { version: "2.1.0" };
    const diagManifestVer = document.getElementById("diagManifestVer");
    if (diagManifestVer) diagManifestVer.textContent = `MV3 · v${manifest.version || "2.1.0"}`;

    const diagWorkerStatus = document.getElementById("diagWorkerStatus");
    if (diagWorkerStatus) diagWorkerStatus.textContent = "ACTIVE";

    const diagApiStatus = document.getElementById("diagApiStatus");
    const diagApiLatency = document.getElementById("diagApiLatency");
    const diagDbStatus = document.getElementById("diagDbStatus");
    const diagMlStatus = document.getElementById("diagMlStatus");
    const diagAiProvider = document.getElementById("diagAiProvider");

    if (diagApiStatus) {
      diagApiStatus.textContent = "Pinging...";
      diagApiStatus.style.color = "var(--accent-cyan)";
    }

    const startTime = performance.now();
    try {
      const resp = await fetch(`${activeApiUrl}/health`);
      const latency = Math.round(performance.now() - startTime);
      if (diagApiLatency) diagApiLatency.textContent = `${latency} ms`;

      if (resp.ok) {
        const data = await resp.json();
        if (diagApiStatus) {
          diagApiStatus.textContent = "ONLINE";
          diagApiStatus.style.color = "var(--accent-safe)";
        }
        if (diagDbStatus) {
          diagDbStatus.textContent = data.database === "healthy" ? "HEALTHY (SQLite)" : (data.database || "Degraded");
          diagDbStatus.style.color = data.database === "healthy" ? "var(--accent-safe)" : "var(--accent-warn)";
        }
        if (diagMlStatus) {
          diagMlStatus.textContent = data.ml ? data.ml.toUpperCase() : "OPERATIONAL";
          diagMlStatus.style.color = "var(--accent-safe)";
        }
        if (diagAiProvider) {
          diagAiProvider.textContent = data.raksha_ai || "Raksha Neural v2.1";
          diagAiProvider.style.color = "var(--accent-safe)";
        }
      } else {
        throw new Error(`HTTP ${resp.status}`);
      }
    } catch (err) {
      if (diagApiLatency) diagApiLatency.textContent = "Timeout";
      if (diagApiStatus) {
        diagApiStatus.textContent = "OFFLINE (Local Mode)";
        diagApiStatus.style.color = "var(--accent-warn)";
      }
      if (diagDbStatus) {
        diagDbStatus.textContent = "Local Client Cache";
        diagDbStatus.style.color = "var(--text-muted)";
      }
      if (diagMlStatus) {
        diagMlStatus.textContent = "Local Heuristics Active";
        diagMlStatus.style.color = "var(--accent-warn)";
      }
      if (diagAiProvider) {
        diagAiProvider.textContent = "Local Heuristic Parser";
        diagAiProvider.style.color = "var(--text-muted)";
      }
    }
  }

  if (runDiagnosticsBtn) {
    runDiagnosticsBtn.addEventListener("click", runDiagnostics);
  }

  // ========================================================================
  // 10. Action Handlers & Boot
  // ========================================================================
  if (rescanBtn) {
    rescanBtn.addEventListener("click", inspectCurrentTab);
  }

  if (openSocBtn) {
    openSocBtn.addEventListener("click", () => {
      const socUrl = activeApiUrl.includes("kavachcybertech.in")
        ? "https://kavachcybertech.in/soc.html"
        : "http://localhost:5173/dashboard";
      chrome.tabs.create({ url: socUrl });
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Initialize theme, API server, server health, and inspect current tab
  initTheme();
  await initApiServer();
  checkServerHealth();
  await inspectCurrentTab();
});
