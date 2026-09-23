// KAVACH Web Safety & Phishing Protection — Popup Controller

const BACKEND_API = "http://localhost:8000/api/v1";

document.addEventListener("DOMContentLoaded", async () => {
  // Elements - Tab 1
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

  // Elements - Tab 2 (Scanner)
  const manualUrlInput = document.getElementById("manualUrlInput");
  const manualScanBtn = document.getElementById("manualScanBtn");
  const scanResultCard = document.getElementById("scanResultCard");
  const scanResultDomain = document.getElementById("scanResultDomain");
  const scanResultBadge = document.getElementById("scanResultBadge");
  const scanResultScore = document.getElementById("scanResultScore");
  const scanResultSummary = document.getElementById("scanResultSummary");
  const scanResultIndicators = document.getElementById("scanResultIndicators");

  // Elements - Tab 3 (Settings)
  const linkAnnotatorToggle = document.getElementById("linkAnnotatorToggle");
  const strictShieldToggle = document.getElementById("strictShieldToggle");
  const recentThreatsList = document.getElementById("recentThreatsList");

  // Elements - Footer
  const rescanBtn = document.getElementById("rescanBtn");
  const openSocBtn = document.getElementById("openSocBtn");

  // 1. Setup Tab Switching
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
    chrome.storage.local.get(["linkAnnotatorEnabled", "strictPhishingShield", "recentThreats"], (res) => {
      if (res.linkAnnotatorEnabled !== undefined) {
        linkAnnotatorToggle.checked = res.linkAnnotatorEnabled;
      }
      if (res.strictPhishingShield !== undefined) {
        strictShieldToggle.checked = res.strictPhishingShield;
      }
      renderRecentThreats(res.recentThreats || []);
    });

    linkAnnotatorToggle.addEventListener("change", (e) => {
      chrome.storage.local.set({ linkAnnotatorEnabled: e.target.checked });
    });

    strictShieldToggle.addEventListener("change", (e) => {
      chrome.storage.local.set({ strictPhishingShield: e.target.checked });
    });
  }

  function renderRecentThreats(threats) {
    if (!threats || threats.length === 0) {
      recentThreatsList.innerHTML = `<li class="threat-empty">No suspicious or phishing sites intercepted recently.</li>`;
      return;
    }
    recentThreatsList.innerHTML = "";
    threats.slice(0, 10).forEach((t) => {
      const li = document.createElement("li");
      li.className = "threat-item";
      li.innerHTML = `
        <span style="font-weight: 700; color: #f87171;">${escapeHtml(t.domain)}</span>
        <span style="color: #94a3b8;">Risk: ${Math.round(t.risk_score)}/100</span>
      `;
      recentThreatsList.appendChild(li);
    });
  }

  // 3. Current Tab Inspection
  async function inspectCurrentTab() {
    statusBadgeEl.textContent = "SCANNING...";
    verdictTitleEl.textContent = "Analyzing site telemetry...";
    verdictSubtitleEl.textContent = "Querying KAVACH Neural Engine";
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

    // Check HTTPS
    if (currentUrl.startsWith("https://")) {
      schemeIconEl.textContent = "🔒";
      checkSslVal.textContent = "TLS Valid";
      checkSslVal.style.color = "#10b981";
    } else {
      schemeIconEl.textContent = "⚠️";
      checkSslVal.textContent = "Unencrypted";
      checkSslVal.style.color = "#f59e0b";
    }

    // Skip internal browser system pages
    if (currentUrl.startsWith("chrome://") || currentUrl.startsWith("edge://") || currentUrl.startsWith("about:")) {
      statusBadgeEl.textContent = "SYSTEM";
      scoreValEl.textContent = "0";
      verdictTitleEl.textContent = "Browser System Page";
      verdictSubtitleEl.textContent = "Isolated local system environment";
      verdictCardEl.className = "verdict-banner safe";
      gaugeProgressEl.setAttribute("stroke-dasharray", "0, 100");
      indicatorListEl.innerHTML = "<li class='indicator-item'>Internal browser sandboxed page.</li>";
      aiSummaryEl.textContent = "Internal browser page is isolated and verified safe from external web threats.";
      backendStatusEl.className = "backend-status";
      statusTextEl.textContent = "Online";
      checkDomainVal.textContent = "Internal";
      checkHeuristicsVal.textContent = "Clean";
      checkAiVal.textContent = "Verified";
      return;
    }

    try {
      const resp = await fetch(`${BACKEND_API}/url/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: currentUrl }),
      });

      if (!resp.ok) {
        throw new Error(`Server returned HTTP ${resp.status}`);
      }

      const data = await resp.json();
      backendStatusEl.className = "backend-status";
      statusTextEl.textContent = "Online";

      const score = Math.round(data.risk_score || 0);
      scoreValEl.textContent = score;
      gaugeProgressEl.setAttribute("stroke-dasharray", `${score}, 100`);

      const level = data.risk_level || "SAFE";
      statusBadgeEl.textContent = level;

      if (score >= 65 || level === "CRITICAL" || level === "HIGH RISK") {
        verdictCardEl.className = "verdict-banner danger";
        verdictTitleEl.textContent = "Malicious or Phishing Threat";
        verdictSubtitleEl.textContent = "Dangerous indicators detected on this destination";
        checkDomainVal.textContent = "High Risk";
        checkDomainVal.style.color = "#ef4444";
        checkHeuristicsVal.textContent = "Flagged";
        checkHeuristicsVal.style.color = "#ef4444";
        checkAiVal.textContent = "Warning";
        checkAiVal.style.color = "#ef4444";
      } else if (score >= 30 || level === "SUSPICIOUS") {
        verdictCardEl.className = "verdict-banner suspicious";
        verdictTitleEl.textContent = "Suspicious Domain / Caution";
        verdictSubtitleEl.textContent = "Uncommon patterns or new registration detected";
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
      backendStatusEl.className = "backend-status offline";
      statusTextEl.textContent = "Offline";
      statusBadgeEl.textContent = "OFFLINE";
      scoreValEl.textContent = "--";
      verdictTitleEl.textContent = "KAVACH Daemon Offline";
      verdictSubtitleEl.textContent = "Start backend stack to enable real-time detection";
      verdictCardEl.className = "verdict-banner";
      gaugeProgressEl.setAttribute("stroke-dasharray", "0, 100");
      indicatorListEl.innerHTML =
        "<li class='indicator-item'>KAVACH API offline on :8000. Start backend stack with start_backend.bat.</li>";
      aiSummaryEl.textContent =
        "KAVACH Backend is offline. Run 'start_backend.bat' to enable real-time phishing protection, link verification, and Raksha AI threat assessment.";
    }
  }

  // 4. Quick URL Scanner (Tab 2)
  manualScanBtn.addEventListener("click", async () => {
    const inputUrl = manualUrlInput.value.trim();
    if (!inputUrl) return;

    manualScanBtn.disabled = true;
    manualScanBtn.textContent = "Scanning...";

    try {
      const resp = await fetch(`${BACKEND_API}/url/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputUrl }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const data = await resp.json();
      scanResultCard.style.display = "flex";
      scanResultDomain.textContent = data.domain || inputUrl;

      const score = Math.round(data.risk_score || 0);
      scanResultScore.textContent = `${score}/100 Risk (${data.risk_level || "SAFE"})`;
      scanResultBadge.textContent = data.risk_level || "SAFE";

      if (score >= 65) {
        scanResultBadge.style.background = "rgba(239, 68, 68, 0.2)";
        scanResultBadge.style.color = "#f87171";
      } else if (score >= 30) {
        scanResultBadge.style.background = "rgba(245, 158, 11, 0.2)";
        scanResultBadge.style.color = "#fbbf24";
      } else {
        scanResultBadge.style.background = "rgba(16, 185, 129, 0.2)";
        scanResultBadge.style.color = "#34d399";
      }

      scanResultSummary.textContent = data.raksha_summary || "Scan completed.";

      scanResultIndicators.innerHTML = "";
      (data.indicators || []).forEach((ind) => {
        const li = document.createElement("li");
        li.className = "indicator-item";
        li.textContent = ind;
        scanResultIndicators.appendChild(li);
      });
    } catch (err) {
      alert(`Unable to scan URL: ${err.message}. Ensure KAVACH backend is running.`);
    } finally {
      manualScanBtn.disabled = false;
      manualScanBtn.textContent = "Analyze";
    }
  });

  // 5. Actions
  rescanBtn.addEventListener("click", inspectCurrentTab);

  openSocBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: "http://localhost:5173/dashboard" });
  });

  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Initial load
  await inspectCurrentTab();
});
