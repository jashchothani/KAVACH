const BACKEND_API = "http://localhost:8000/api/v1";

const BADGE_COLORS = {
  SAFE: "#16a34a",
  SUSPICIOUS: "#ca8a04",
  "HIGH RISK": "#ea580c",
  CRITICAL: "#dc2626",
  OFFLINE: "#64748b",
};

const urlSafetyCache = new Map();

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CHECK_URL_SAFETY") {
    const targetUrl = message.url;
    if (urlSafetyCache.has(targetUrl)) {
      sendResponse({ success: true, data: urlSafetyCache.get(targetUrl) });
      return true;
    }

    fetch(`${BACKEND_API}/url/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: targetUrl }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        urlSafetyCache.set(targetUrl, data);
        sendResponse({ success: true, data });
      })
      .catch((err) => {
        sendResponse({ success: false, error: err.message });
      });

    return true; // Keep message channel open for asynchronous response
  }
});

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
    urlSafetyCache.set(url, data);

    const level = data.risk_level || "SAFE";
    const color = BADGE_COLORS[level] || "#64748b";

    let badgeText = "✓";
    if (level === "CRITICAL") badgeText = "✗";
    else if (level === "HIGH RISK") badgeText = "!";
    else if (level === "SUSPICIOUS") badgeText = "?";

    chrome.action.setBadgeText({ tabId, text: badgeText });
    chrome.action.setBadgeBackgroundColor({ tabId, color });

    // Store in recent threats feed if risk detected
    if (data.risk_score >= 30) {
      recordRecentThreat({
        url,
        domain: data.domain || new URL(url).hostname,
        risk_score: data.risk_score,
        risk_level: level,
        timestamp: new Date().toISOString(),
      });
    }

    // Check user preference for strict blocking shield
    chrome.storage.local.get(["strictPhishingShield"], (settings) => {
      const strict = settings.strictPhishingShield || false;
      const shouldBlock = (strict && data.risk_score >= 60) || data.risk_score >= 75;

      if (shouldBlock) {
        chrome.tabs.sendMessage(tabId, {
          type: "KAVACH_BLOCK",
          url,
          risk_score: data.risk_score,
          risk_level: level,
          indicators: data.indicators,
          summary: data.raksha_summary,
        }).catch(() => {});
      } else if (level === "CRITICAL" || level === "HIGH RISK" || level === "SUSPICIOUS") {
        chrome.tabs.sendMessage(tabId, {
          type: "KAVACH_WARNING",
          url,
          risk_score: data.risk_score,
          risk_level: level,
          indicators: data.indicators,
          summary: data.raksha_summary,
        }).catch(() => {});
      }
    });
  } catch (err) {
    chrome.action.setBadgeText({ tabId, text: "" });
  }
}

function recordRecentThreat(threatItem) {
  chrome.storage.local.get(["recentThreats"], (res) => {
    let threats = res.recentThreats || [];
    // Deduplicate by domain
    threats = threats.filter((t) => t.domain !== threatItem.domain);
    threats.unshift(threatItem);
    if (threats.length > 20) threats = threats.slice(0, 20);
    chrome.storage.local.set({ recentThreats: threats });
  });
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
