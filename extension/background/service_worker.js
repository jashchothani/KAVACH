// ==========================================================================
// KAVACH Web Safety & Phishing Protection — Background Service Worker (MV3)
// Real-Time URL Heuristics, Threat Intel Scanning & Neural Shield Dispatch
// ==========================================================================

const DEFAULT_API_URL = "https://api.kavachcybertech.in/api/v1";
let activeBackendApi = DEFAULT_API_URL;

const BADGE_COLORS = {
  SAFE: "#10b981",
  SUSPICIOUS: "#f59e0b",
  "HIGH RISK": "#f97316",
  CRITICAL: "#ef4444",
  OFFLINE: "#64748b",
};

const urlSafetyCache = new Map();

// Initialize backend API URL from local storage
chrome.storage.local.get(["kavach_api_url"], (res) => {
  if (res.kavach_api_url) {
    activeBackendApi = res.kavach_api_url;
  } else {
    activeBackendApi = DEFAULT_API_URL;
    chrome.storage.local.set({ kavach_api_url: DEFAULT_API_URL });
  }
});

// React to storage changes for active API URL
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.kavach_api_url) {
    activeBackendApi = changes.kavach_api_url.newValue || DEFAULT_API_URL;
  }
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SET_API_URL") {
    activeBackendApi = message.apiUrl || DEFAULT_API_URL;
    sendResponse({ success: true, activeApiUrl: activeBackendApi });
    return true;
  }

  if (message.type === "CHECK_URL_SAFETY") {
    const targetUrl = message.url;
    if (urlSafetyCache.has(targetUrl)) {
      sendResponse({ success: true, data: urlSafetyCache.get(targetUrl) });
      return true;
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);

    fetch(`${activeBackendApi}/url/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: targetUrl }),
      signal: ctrl.signal,
    })
      .then((res) => {
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        urlSafetyCache.set(targetUrl, data);
        sendResponse({ success: true, data });
      })
      .catch((err) => {
        clearTimeout(timer);
        // Fallback to local heuristic evaluation
        const localData = localEvaluateUrl(targetUrl);
        urlSafetyCache.set(targetUrl, localData);
        sendResponse({ success: true, data: localData, fallback: true });
      });

    return true;
  }

  if (message.type === "SCAN_EMAIL_ML") {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);

    fetch(`${activeBackendApi}/ml/scan-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender_name: message.sender_name || "",
        sender_email: message.sender_email || "",
        subject: message.subject || "",
        body: message.body || "",
        links: message.links || [],
      }),
      signal: ctrl.signal,
    })
      .then((res) => {
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        sendResponse({ success: true, data });
      })
      .catch((err) => {
        clearTimeout(timer);
        sendResponse({ success: false, error: err.message });
      });

    return true;
  }

  if (message.type === "SCAN_COMMS_ML") {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);

    fetch(`${activeBackendApi}/ml/scan-comms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone_number: message.phone_number || "",
        message_text: message.message_text || "",
        links: message.links || [],
      }),
      signal: ctrl.signal,
    })
      .then((res) => {
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        sendResponse({ success: true, data });
      })
      .catch((err) => {
        clearTimeout(timer);
        sendResponse({ success: false, error: err.message });
      });

    return true;
  }
});

function localEvaluateUrl(urlStr) {
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
  }

  score = Math.min(100, score);
  const level = score >= 60 ? "CRITICAL" : score >= 30 ? "SUSPICIOUS" : "SAFE";

  return {
    domain,
    risk_score: score,
    risk_level: level,
    indicators: indicators.length > 0 ? indicators : ["Client heuristic inspection passed."],
    raksha_summary: score >= 60 ? "High threat score detected by local heuristics." : "Safe destination.",
  };
}

async function updateBadgeForTab(tabId, url) {
  if (!url || url.startsWith("chrome://") || url.startsWith("edge://") || url.startsWith("about:")) {
    chrome.action.setBadgeText({ tabId, text: "" });
    return;
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3500);

    const resp = await fetch(`${activeBackendApi}/url/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    let data;
    if (resp.ok) {
      data = await resp.json();
    } else {
      data = localEvaluateUrl(url);
    }

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
    const local = localEvaluateUrl(url);
    const level = local.risk_level || "SAFE";
    chrome.action.setBadgeText({ tabId, text: level === "SAFE" ? "✓" : "!" });
    chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLORS[level] || "#64748b" });
  }
}

function recordRecentThreat(threatItem) {
  chrome.storage.local.get(["recentThreats"], (res) => {
    let threats = res.recentThreats || [];
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
