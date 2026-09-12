const BACKEND_API = "http://localhost:8000/api/v1";

const BADGE_COLORS = {
  SAFE: "#16a34a",
  SUSPICIOUS: "#ca8a04",
  "HIGH RISK": "#ea580c",
  CRITICAL: "#dc2626",
  OFFLINE: "#64748b",
};

async function updateBadgeForTab(tabId, url) {
  if (!url || url.startsWith("chrome://") || url.startsWith("edge://") || url.startsWith("about:")) {
    chrome.action.setBadgeText({ tabId, text: "" });
    return;
  }

  try {
    const resp = await fetch(`${BACKEND_API}/url/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!resp.ok) return;

    const data = await resp.json();
    const level = data.risk_level || "SAFE";
    const color = BADGE_COLORS[level] || "#64748b";

    let badgeText = "OK";
    if (level === "CRITICAL") badgeText = "CRIT";
    else if (level === "HIGH RISK") badgeText = "RISK";
    else if (level === "SUSPICIOUS") badgeText = "WARN";

    chrome.action.setBadgeText({ tabId, text: badgeText });
    chrome.action.setBadgeBackgroundColor({ tabId, color });

    // Notify content script if high risk or critical
    if (level === "CRITICAL" || level === "HIGH RISK") {
      chrome.tabs.sendMessage(tabId, {
        type: "KAVACH_WARNING",
        url,
        risk_score: data.risk_score,
        risk_level: level,
        indicators: data.indicators,
        summary: data.raksha_summary,
      }).catch(() => {
        // Tab might not have content script ready yet, which is safe to ignore
      });
    }
  } catch (err) {
    chrome.action.setBadgeText({ tabId, text: "" });
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    updateBadgeForTab(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url) {
      updateBadgeForTab(activeInfo.tabId, tab.url);
    }
  } catch (e) {}
});
