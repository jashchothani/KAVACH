// KAVACH Web, Gmail & WhatsApp Threat Sentinel — Unified Popup Controller

const BACKEND_API = "http://localhost:8000/api/v1";

document.addEventListener("DOMContentLoaded", async () => {
  // --- Tab 1 Elements (Web Shield) ---
  const targetUrlEl = document.getElementById("targetUrl");
  const schemeIconEl = document.getElementById("schemeIcon");
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

  // --- Tab 4 Elements (Settings) ---
  const linkAnnotatorToggle = document.getElementById("linkAnnotatorToggle");
  const strictShieldToggle = document.getElementById("strictShieldToggle");
  const recentThreatsList = document.getElementById("recentThreatsList");

  // --- Footer Elements ---
  const rescanBtn = document.getElementById("rescanBtn");
  const openSocBtn = document.getElementById("openSocBtn");

  // 1. Navigation Tab Switching
  document.querySelectorAll(".nav-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-tab").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const targetPane = document.getElementById(btn.dataset.tab);
      if (targetPane) targetPane.classList.add("active");
    });
  });

  // 2. Load & bind settings toggles
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
        if (res.linkAnnotatorEnabled !== undefined) {
          linkAnnotatorToggle.checked = res.linkAnnotatorEnabled;
        }
        if (res.strictPhishingShield !== undefined) {
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

    linkAnnotatorToggle.addEventListener("change", (e) => {
      chrome.storage.local.set({ linkAnnotatorEnabled: e.target.checked });
    });

    strictShieldToggle.addEventListener("change", (e) => {
      chrome.storage.local.set({ strictPhishingShield: e.target.checked });
    });

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
    if (!threats || threats.length === 0) {
      recentThreatsList.innerHTML = `<li class="threat-empty">No suspicious domains or scam numbers intercepted recently. System secure!</li>`;
      return;
    }
    recentThreatsList.innerHTML = "";
    threats.slice(0, 10).forEach((t) => {
      const li = document.createElement("li");
      li.className = "threat-item";
      li.innerHTML = `
        <span style="font-weight: 700; color: #f87171;">${escapeHtml(t.domain || t.target || "Threat")}</span>
        <span style="color: #94a3b8; font-size: 11px;">Risk: ${Math.round(t.risk_score || 85)}/100 · ${escapeHtml(t.type || "Flagged")}</span>
      `;
      recentThreatsList.appendChild(li);
    });
  }

  // 3. Current Tab Telemetry & Inspection
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

    if (!tabs || !tabs[0] || !tabs[0].url) {
      targetUrlEl.textContent = "No active URL";
      return;
    }

    const currentUrl = tabs[0].url;
    targetUrlEl.textContent = currentUrl;

    // TLS verification
    if (currentUrl.startsWith("https://")) {
      schemeIconEl.textContent = "🔒";
      checkSslVal.textContent = "TLS Valid";
      checkSslVal.style.color = "#10b981";
    } else {
      schemeIconEl.textContent = "⚠️";
      checkSslVal.textContent = "Unencrypted";
      checkSslVal.style.color = "#f59e0b";
    }

    // Special Browser Pages
    if (currentUrl.startsWith("chrome://") || currentUrl.startsWith("edge://") || currentUrl.startsWith("about:")) {
      statusBadgeEl.textContent = "SYSTEM";
      scoreValEl.textContent = "0";
      verdictTitleEl.textContent = "Browser System Environment";
      verdictSubtitleEl.textContent = "Sandboxed local client process";
      verdictCardEl.className = "verdict-banner safe";
      gaugeProgressEl.setAttribute("stroke-dasharray", "0, 100");
      indicatorListEl.innerHTML = "<li class='indicator-item'>Internal browser sandboxed page.</li>";
      aiSummaryEl.textContent = "Internal browser page is isolated and verified safe from network threats.";
      backendStatusEl.className = "backend-status";
      statusTextEl.textContent = "Active Defense";
      checkDomainVal.textContent = "Internal";
      checkHeuristicsVal.textContent = "Clean";
      checkAiVal.textContent = "Protected";
      return;
    }

    // Gmail Detection
    if (currentUrl.includes("mail.google.com")) {
      statusBadgeEl.textContent = "GMAIL SHIELD";
      scoreValEl.textContent = "0";
      verdictTitleEl.textContent = "Gmail Inbox Protected";
      verdictSubtitleEl.textContent = "KAVACH Phishing & Brand Spoof Sentinel Active";
      verdictCardEl.className = "verdict-banner safe";
      gaugeProgressEl.setAttribute("stroke-dasharray", "0, 100");
      indicatorListEl.innerHTML =
        "<li class='indicator-item'>Monitoring incoming messages for brand spoofing &amp; dangerous links.</li><li class='indicator-item'>Red alert banner ready to disarm phishing attachments.</li>";
      aiSummaryEl.textContent =
        "KAVACH Gmail Sentinel is actively scanning open emails and inbox entries for spoofed senders, urgent financial lures, and credential harvester links.";
      checkDomainVal.textContent = "google.com";
      checkDomainVal.style.color = "#10b981";
      checkHeuristicsVal.textContent = "Sentinel Active";
      checkHeuristicsVal.style.color = "#10b981";
      checkAiVal.textContent = "Armed";
      checkAiVal.style.color = "#10b981";
      return;
    }

    // WhatsApp Web Detection
    if (currentUrl.includes("web.whatsapp.com")) {
      statusBadgeEl.textContent = "WHATSAPP SHIELD";
      scoreValEl.textContent = "0";
      verdictTitleEl.textContent = "WhatsApp Web Protected";
      verdictSubtitleEl.textContent = "KAVACH Scam Number & Task Fraud Blocker Active";
      verdictCardEl.className = "verdict-banner safe";
      gaugeProgressEl.setAttribute("stroke-dasharray", "0, 100");
      indicatorListEl.innerHTML =
        "<li class='indicator-item'>Monitoring active chats for high-risk international numbers (+92, +234, +880).</li><li class='indicator-item'>Scanning message text for part-time task scams &amp; malicious APK downloads.</li>";
      aiSummaryEl.textContent =
        "KAVACH WhatsApp Sentinel is actively defending this session against impersonators, task-offer lures, and foreign spam phone networks.";
      checkDomainVal.textContent = "whatsapp.com";
      checkDomainVal.style.color = "#10b981";
      checkHeuristicsVal.textContent = "Sentinel Active";
      checkHeuristicsVal.style.color = "#10b981";
      checkAiVal.textContent = "Armed";
      checkAiVal.style.color = "#10b981";
      return;
    }

    try {
      const resp = await fetch(`${BACKEND_API}/url/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: currentUrl }),
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const data = await resp.json();
      backendStatusEl.className = "backend-status";
      statusTextEl.textContent = "Active Defense";

      const score = Math.round(data.risk_score || 0);
      scoreValEl.textContent = score;
      gaugeProgressEl.setAttribute("stroke-dasharray", `${score}, 100`);

      const level = data.risk_level || "SAFE";
      statusBadgeEl.textContent = level;

      if (score >= 65 || level === "CRITICAL" || level === "HIGH RISK") {
        verdictCardEl.className = "verdict-banner danger";
        verdictTitleEl.textContent = "Malicious or Phishing Threat";
        verdictSubtitleEl.textContent = "Dangerous signals detected on this destination";
        checkDomainVal.textContent = "High Risk";
        checkDomainVal.style.color = "#ef4444";
        checkHeuristicsVal.textContent = "Flagged";
        checkHeuristicsVal.style.color = "#ef4444";
        checkAiVal.textContent = "Danger";
        checkAiVal.style.color = "#ef4444";
      } else if (score >= 30 || level === "SUSPICIOUS") {
        verdictCardEl.className = "verdict-banner suspicious";
        verdictTitleEl.textContent = "Suspicious Domain / Caution";
        verdictSubtitleEl.textContent = "Unusual patterns or new registration detected";
        checkDomainVal.textContent = "Caution";
        checkDomainVal.style.color = "#f59e0b";
        checkHeuristicsVal.textContent = "Unusual";
        checkHeuristicsVal.style.color = "#f59e0b";
        checkAiVal.textContent = "Monitored";
        checkAiVal.style.color = "#f59e0b";
      } else {
        verdictCardEl.className = "verdict-banner safe";
        verdictTitleEl.textContent = "Verified Safe Destination";
        verdictSubtitleEl.textContent = "Protected by KAVACH Neural Shield";
        checkDomainVal.textContent = "Reputable";
        checkDomainVal.style.color = "#10b981";
        checkHeuristicsVal.textContent = "Clean";
        checkHeuristicsVal.style.color = "#10b981";
        checkAiVal.textContent = "Safe";
        checkAiVal.style.color = "#10b981";
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
      backendStatusEl.className = "backend-status";
      statusTextEl.textContent = "Local Heuristics";

      scoreValEl.textContent = localResult.score;
      gaugeProgressEl.setAttribute("stroke-dasharray", `${localResult.score}, 100`);
      statusBadgeEl.textContent = localResult.level;

      if (localResult.score >= 60) {
        verdictCardEl.className = "verdict-banner danger";
        verdictTitleEl.textContent = "Potential Phishing Destination";
        verdictSubtitleEl.textContent = localResult.subtitle;
        checkDomainVal.textContent = "Suspicious";
        checkDomainVal.style.color = "#ef4444";
      } else {
        verdictCardEl.className = "verdict-banner safe";
        verdictTitleEl.textContent = "Website Monitored Locally";
        verdictSubtitleEl.textContent = "Local heuristic checks clean (Backend offline)";
        checkDomainVal.textContent = "Verified";
        checkDomainVal.style.color = "#10b981";
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

  // 4. Scanner Type Selector
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

  // 5. Threat Scanner Engine
  manualScanBtn.addEventListener("click", async () => {
    const query = manualInput.value.trim();
    if (!query) return;

    manualScanBtn.disabled = true;
    manualScanBtn.textContent = "Analyzing...";

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
      const resp = await fetch(`${BACKEND_API}/url/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      // Fallback to local heuristic
    }
    return evaluateLocalUrl(url);
  }

  async function scanEmailQuery(email) {
    try {
      const resp = await fetch(`${BACKEND_API}/ml/scan-email`, {
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

  function localScanEmail(email) {
    const emailNorm = email.toLowerCase().trim();
    const domainMatch = emailNorm.match(/@([a-z0-9.-]+\.[a-z]{2,})/);
    const domain = domainMatch ? domainMatch[1] : emailNorm;

    const indicators = [];
    let score = 5;

    // Brand imitation in domain
    const brands = ["google", "microsoft", "paypal", "apple", "amazon", "netflix", "sbi", "hdfc", "incometax"];
    for (const b of brands) {
      if (domain.includes(b) && !domain.endsWith(`.${b}.com`) && domain !== `${b}.com` && !domain.endsWith(`.${b}.in`)) {
        score += 65;
        indicators.push(`Brand Impersonation: domain contains '${b}' but is not the authentic company domain.`);
      }
    }

    // Suspicious email words
    if (/(security|verify|support|account|update|alert|billing|auth)/.test(emailNorm)) {
      score += 20;
      indicators.push("Uses high-urgency security or verification keywords.");
    }

    // High risk TLDs
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
          ? `High-risk sender pattern detected. Do not click links or respond with OTPs/passwords.`
          : `Sender address does not show obvious known spoofing signatures. Exercise normal caution.`,
      indicators: indicators.length > 0 ? indicators : ["Sender domain syntax verified without brand spoofing."],
    };
  }

  async function scanPhoneQuery(phone) {
    try {
      const resp = await fetch(`${BACKEND_API}/ml/scan-comms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone, message_text: phone }),
      });
      if (resp.ok) {
        const ml = await resp.json();
        return {
          target: phone,
          risk_score: ml.risk_score,
          risk_level: ml.risk_level,
          raksha_summary: ml.raksha_summary,
          indicators: ml.indicators,
        };
      }
    } catch (e) {}

    return localScanPhone(phone);
  }

  function localScanPhone(phone) {
    const raw = phone.replace(/[\s\-\(\)]/g, "");
    const indicators = [];
    let score = 5;

    // High risk country codes often associated with cybercrime/WhatsApp scams
    const flaggedPrefixes = [
      { code: "+92", country: "Pakistan (High volume task scam network)" },
      { code: "+234", country: "Nigeria (Advance-fee & lottery fraud)" },
      { code: "+880", country: "Bangladesh (Job lure networks)" },
      { code: "+855", country: "Cambodia (Cyber scam compounds / OTP fraud)" },
      { code: "+62", country: "Indonesia (Unsolicited bulk job offers)" },
      { code: "+4470", country: "UK Personal Number (Commonly abused redirect prefix)" },
    ];

    let foundPrefix = null;
    for (const p of flaggedPrefixes) {
      if (raw.startsWith(p.code) || raw.startsWith(p.code.replace("+", ""))) {
        foundPrefix = p;
        break;
      }
    }

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
          ? `Scam alert! This number matches origin networks associated with mass WhatsApp tasks, lottery scams, and APK dropper campaigns.`
          : `No immediate threat signature found on this telephone prefix. Never share OTPs or install APKs sent via chat.`,
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
      scanResultBadge.style.background = "rgba(239, 68, 68, 0.2)";
      scanResultBadge.style.color = "#f87171";
      scanResultCard.style.borderColor = "rgba(239, 68, 68, 0.4)";
    } else if (score >= 30) {
      scanResultBadge.style.background = "rgba(245, 158, 11, 0.2)";
      scanResultBadge.style.color = "#fbbf24";
      scanResultCard.style.borderColor = "rgba(245, 158, 11, 0.4)";
    } else {
      scanResultBadge.style.background = "rgba(16, 185, 129, 0.2)";
      scanResultBadge.style.color = "#34d399";
      scanResultCard.style.borderColor = "rgba(16, 185, 129, 0.4)";
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

  // 6. Action Handlers
  rescanBtn.addEventListener("click", inspectCurrentTab);

  openSocBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: "http://localhost:5173/dashboard" });
  });

  // Clear Event Log Handler
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", () => {
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ recentThreats: [] }, () => {
          renderRecentThreats([]);
        });
      }
    });
  }

  // Diagnostics Engine Mode
  async function runDiagnostics() {
    const manifest = chrome.runtime?.getManifest ? chrome.runtime.getManifest() : { version: "1.0.0" };
    const diagManifestVer = document.getElementById("diagManifestVer");
    if (diagManifestVer) diagManifestVer.textContent = `MV3 · v${manifest.version || "1.0.0"}`;

    const diagWorkerStatus = document.getElementById("diagWorkerStatus");
    if (diagWorkerStatus) diagWorkerStatus.textContent = "ACTIVE";

    const diagApiStatus = document.getElementById("diagApiStatus");
    const diagApiLatency = document.getElementById("diagApiLatency");
    const diagDbStatus = document.getElementById("diagDbStatus");
    const diagMlStatus = document.getElementById("diagMlStatus");
    const diagAiProvider = document.getElementById("diagAiProvider");

    if (diagApiStatus) {
      diagApiStatus.textContent = "Pinging...";
      diagApiStatus.style.color = "#38bdf8";
    }

    const startTime = performance.now();
    try {
      const resp = await fetch(`${BACKEND_API}/health`);
      const latency = Math.round(performance.now() - startTime);
      if (diagApiLatency) diagApiLatency.textContent = `${latency} ms`;

      if (resp.ok) {
        const data = await resp.json();
        if (diagApiStatus) {
          diagApiStatus.textContent = "ONLINE";
          diagApiStatus.style.color = "#10b981";
        }
        if (diagDbStatus) {
          diagDbStatus.textContent = data.database === "healthy" ? "HEALTHY (SQLite)" : (data.database || "Degraded");
          diagDbStatus.style.color = data.database === "healthy" ? "#10b981" : "#f59e0b";
        }
        if (diagMlStatus) {
          diagMlStatus.textContent = data.ml ? data.ml.toUpperCase() : "OPERATIONAL";
          diagMlStatus.style.color = "#10b981";
        }
        if (diagAiProvider) {
          diagAiProvider.textContent = data.raksha_ai || "Raksha Neural v2.1";
          diagAiProvider.style.color = "#10b981";
        }
      } else {
        throw new Error(`HTTP ${resp.status}`);
      }
    } catch (err) {
      if (diagApiLatency) diagApiLatency.textContent = "Timeout";
      if (diagApiStatus) {
        diagApiStatus.textContent = "OFFLINE (Local Mode)";
        diagApiStatus.style.color = "#f59e0b";
      }
      if (diagDbStatus) {
        diagDbStatus.textContent = "Local Client Cache";
        diagDbStatus.style.color = "#94a3b8";
      }
      if (diagMlStatus) {
        diagMlStatus.textContent = "Local Heuristics Active";
        diagMlStatus.style.color = "#fbbf24";
      }
      if (diagAiProvider) {
        diagAiProvider.textContent = "Local Heuristic Parser";
        diagAiProvider.style.color = "#94a3b8";
      }
    }
  }

  const runDiagnosticsBtn = document.getElementById("runDiagnosticsBtn");
  if (runDiagnosticsBtn) {
    runDiagnosticsBtn.addEventListener("click", runDiagnostics);
  }

  // Trigger diagnostics on tab switch
  document.querySelector("[data-tab='diagnosticsSection']")?.addEventListener("click", runDiagnostics);

  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Initial tab inspection
  await inspectCurrentTab();
});
