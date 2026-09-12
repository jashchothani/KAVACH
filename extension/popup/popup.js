const BACKEND_API = "http://localhost:8000/api/v1";

document.addEventListener("DOMContentLoaded", async () => {
  const targetUrlEl = document.getElementById("targetUrl");
  const verdictCardEl = document.getElementById("verdictCard");
  const statusBadgeEl = document.getElementById("statusBadge");
  const scoreValEl = document.getElementById("scoreVal");
  const indicatorListEl = document.getElementById("indicatorList");
  const aiSummaryEl = document.getElementById("aiSummary");
  const backendStatusEl = document.getElementById("backendStatus");
  const rescanBtn = document.getElementById("rescanBtn");
  const openDashboardBtn = document.getElementById("openDashboardBtn");

  async function inspectCurrentTab() {
    statusBadgeEl.textContent = "SCANNING...";
    verdictCardEl.className = "verdict-card";

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

    // Skip chrome:// and internal pages
    if (currentUrl.startsWith("chrome://") || currentUrl.startsWith("edge://") || currentUrl.startsWith("about:")) {
      statusBadgeEl.textContent = "SYSTEM";
      scoreValEl.textContent = "0";
      verdictCardEl.className = "verdict-card safe";
      indicatorListEl.innerHTML = "<li class='indicator-item'>Internal browser system page.</li>";
      aiSummaryEl.textContent = "Internal browser page is isolated and secure.";
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
      backendStatusEl.className = "backend-pill";
      backendStatusEl.innerHTML = "<span class='dot'></span> Online";

      // Render verdict
      const level = data.risk_level || "SAFE";
      statusBadgeEl.textContent = level;
      scoreValEl.textContent = Math.round(data.risk_score || 0);

      const levelClass = level.toLowerCase().replace(" ", "-");
      verdictCardEl.className = `verdict-card ${levelClass}`;

      // Render indicators
      indicatorListEl.innerHTML = "";
      const indicators = data.indicators || [];
      if (indicators.length === 0) {
        indicatorListEl.innerHTML = "<li class='indicator-item'>No structural risks or phishing signals detected.</li>";
      } else {
        indicators.forEach((ind) => {
          const li = document.createElement("li");
          li.className = "indicator-item";
          li.textContent = ind;
          indicatorListEl.appendChild(li);
        });
      }

      // Render Raksha AI summary
      aiSummaryEl.textContent = data.raksha_summary || "Raksha AI verified this website.";
    } catch (err) {
      backendStatusEl.className = "backend-pill offline";
      backendStatusEl.innerHTML = "<span class='dot'></span> Offline";
      statusBadgeEl.textContent = "OFFLINE";
      scoreValEl.textContent = "--";
      indicatorListEl.innerHTML =
        "<li class='indicator-item'>KAVACH backend not reachable on :8000. Start backend stack to inspect.</li>";
      aiSummaryEl.textContent =
        "KAVACH Backend is offline. Run 'python scripts/start_backend.py' to enable real-time URL and phishing protection.";
    }
  }

  rescanBtn.addEventListener("click", inspectCurrentTab);

  openDashboardBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: "http://localhost:5173/dashboard" });
  });

  await inspectCurrentTab();
});
