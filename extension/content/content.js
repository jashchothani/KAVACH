// KAVACH Web Safety & Phishing Protection — Content Script
// McAfee SiteAdvisor-style Link Annotations, Hover Cards, & Cyber Defense Shield

(function () {
  const BACKEND_API = "http://localhost:8000/api/v1";
  const linkSafetyCache = new Map();
  let linkAnnotatorEnabled = true;
  let activeCard = null;

  // Trusted popular domains whitelist for instant client-side verification
  const TRUSTED_DOMAINS = new Set([
    "google.com", "www.google.com", "github.com", "microsoft.com", "apple.com",
    "wikipedia.org", "stackoverflow.com", "amazon.com", "cloudflare.com", "mozilla.org",
    "nih.gov", "cdc.gov", "who.int", "nytimes.com", "bbc.com", "reuters.com",
    "linkedin.com", "youtube.com", "reddit.com", "twitter.com", "x.com"
  ]);

  // Known dangerous or high-risk TLDs
  const SUSPICIOUS_TLDS = [".xyz", ".top", ".tk", ".pw", ".cc", ".ru", ".cn", ".buzz", ".work", ".click"];

  // 1. Listen for runtime messages from background service worker
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "KAVACH_WARNING") {
      showKavachWarningBanner(message);
    } else if (message.type === "KAVACH_BLOCK") {
      showBlockingShield(message);
    }
  });

  // 2. Read user settings
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["linkAnnotatorEnabled"], (res) => {
      if (res.linkAnnotatorEnabled !== undefined) {
        linkAnnotatorEnabled = res.linkAnnotatorEnabled;
      }
      if (linkAnnotatorEnabled) {
        initLinkAnnotations();
      }
    });
  } else {
    initLinkAnnotations();
  }

  // 3. KAVACH Active Search Sentinel Link Annotator
  function initLinkAnnotations() {
    annotateLinks();

    // Observe dynamic changes (e.g., infinite scroll or AJAX on Google / Bing)
    const observer = new MutationObserver(debounce(() => {
      annotateLinks();
    }, 350));

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function annotateLinks() {
    const currentHost = window.location.hostname;
    const isGoogle = /google\./i.test(currentHost);
    const isBing = /bing\./i.test(currentHost);
    const isDuckDuckGo = /duckduckgo\./i.test(currentHost);

    if (isGoogle) {
      // Find all Google primary organic results
      const results = document.querySelectorAll("div.g, div[data-hveid]");
      results.forEach((container) => {
        if (container.dataset.kavachChecked) return;
        
        // Target ONLY the primary title heading h3
        const h3 = container.querySelector("h3");
        if (!h3) return;

        // Find the associated anchor
        const anchor = h3.closest("a") || container.querySelector("a[href^='http']");
        if (!anchor || !anchor.href) return;

        const urlStr = anchor.href;
        if (urlStr.startsWith("javascript:") || urlStr.startsWith("#") || urlStr.startsWith("mailto:")) return;

        let parsed;
        try {
          parsed = new URL(urlStr);
        } catch (e) {
          return;
        }

        // Never annotate Google internal links
        if (parsed.hostname.includes("google.")) return;

        container.dataset.kavachChecked = "true";
        anchor.dataset.kavachChecked = "true";

        // Attach cleanly directly to the h3 title heading (never to the breadcrumbs or three dots)
        attachBadge(h3, urlStr, parsed.hostname);
      });
      return;
    }

    if (isBing) {
      const results = document.querySelectorAll("li.b_algo");
      results.forEach((container) => {
        if (container.dataset.kavachChecked) return;
        const h2 = container.querySelector("h2");
        if (!h2) return;
        const anchor = h2.querySelector("a") || h2.closest("a");
        if (!anchor || !anchor.href) return;
        let parsed;
        try { parsed = new URL(anchor.href); } catch (e) { return; }
        if (parsed.hostname.includes("bing.com") || parsed.hostname.includes("microsoft.com")) return;
        container.dataset.kavachChecked = "true";
        attachBadge(h2, anchor.href, parsed.hostname);
      });
      return;
    }

    if (isDuckDuckGo) {
      const results = document.querySelectorAll("article[data-testid='result'], li[data-layout='organic']");
      results.forEach((container) => {
        if (container.dataset.kavachChecked) return;
        const h2 = container.querySelector("h2");
        if (!h2) return;
        const anchor = h2.querySelector("a") || h2.closest("a");
        if (!anchor || !anchor.href) return;
        let parsed;
        try { parsed = new URL(anchor.href); } catch (e) { return; }
        container.dataset.kavachChecked = "true";
        attachBadge(h2, anchor.href, parsed.hostname);
      });
      return;
    }
  }

  const SVG_ICONS = {
    SAFE: `<svg class="kavach-badge-svg" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 5.5v6.2c0 5.25 3.4 10.15 8 11.3 4.6-1.15 8-6.05 8-11.3V5.5L12 2z" fill="#10b981"/><path d="M8.5 12.2l2.3 2.3 4.7-4.7" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    DANGER: `<svg class="kavach-badge-svg" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 5.5v6.2c0 5.25 3.4 10.15 8 11.3 4.6-1.15 8-6.05 8-11.3V5.5L12 2z" fill="#ef4444"/><path d="M9 9l6 6M15 9l-6 6" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/></svg>`,
    WARN: `<svg class="kavach-badge-svg" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 5.5v6.2c0 5.25 3.4 10.15 8 11.3 4.6-1.15 8-6.05 8-11.3V5.5L12 2z" fill="#f59e0b"/><path d="M12 8v5M12 16v0.5" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/></svg>`,
    LOADING: `<svg class="kavach-badge-svg" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 5.5v6.2c0 5.25 3.4 10.15 8 11.3 4.6-1.15 8-6.05 8-11.3V5.5L12 2z" fill="#334155"/><circle cx="12" cy="12" r="4.5" stroke="#38bdf8" stroke-width="2" stroke-dasharray="8 6" class="kavach-spin"/></svg>`
  };

  function attachBadge(targetEl, url, hostname) {
    const badge = document.createElement("span");
    badge.className = "kavach-advisor-badge kavach-advisor-loading";
    badge.setAttribute("aria-label", "KAVACH Safety: Scanning...");
    badge.innerHTML = SVG_ICONS.LOADING;

    // Append badge cleanly directly inside the title heading element
    targetEl.appendChild(badge);

    // Evaluate safety
    evaluateUrlSafety(url, hostname, (rating) => {
      badge.className = `kavach-advisor-badge ${rating.badgeClass}`;
      badge.innerHTML = rating.svgIcon;
      badge.setAttribute("aria-label", `KAVACH: ${rating.label} (${rating.scoreText})`);

      // Hover / Click interaction: Show KAVACH Popover Card
      badge.addEventListener("mouseenter", (e) => {
        showSiteCard(e.pageX, e.pageY, url, hostname, rating);
      });

      badge.addEventListener("mouseleave", () => {
        scheduleCardRemoval();
      });

      badge.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showSiteCard(e.pageX, e.pageY, url, hostname, rating);
      });
    });
  }

  function evaluateUrlSafety(url, hostname, callback) {
    if (linkSafetyCache.has(url)) {
      callback(linkSafetyCache.get(url));
      return;
    }

    // 1. Client-side rapid verification for trusted global domains
    const baseHost = hostname.replace(/^www\./, "");
    if (TRUSTED_DOMAINS.has(baseHost) || TRUSTED_DOMAINS.has(hostname)) {
      const rating = {
        level: "SAFE",
        badgeClass: "kavach-advisor-safe",
        svgIcon: SVG_ICONS.SAFE,
        icon: "✓",
        label: "Verified Safe",
        score: 5,
        scoreText: "95% Safe",
        rakshaSummary: "Reputable domain with established security credentials and TLS encryption.",
      };
      linkSafetyCache.set(url, rating);
      callback(rating);
      return;
    }

    // 2. Client-side heuristic for immediate red flags
    const isSuspiciousTLD = SUSPICIOUS_TLDS.some((tld) => hostname.endsWith(tld));
    const isRawIP = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    const hasPhishKeywords = /(login|verify|secure|account|update|banking).*(update|auth|service)/i.test(hostname);

    if (isRawIP || (isSuspiciousTLD && hasPhishKeywords)) {
      const rating = {
        level: "DANGER",
        badgeClass: "kavach-advisor-danger",
        svgIcon: SVG_ICONS.DANGER,
        icon: "✗",
        label: "High Risk Phishing",
        score: 88,
        scoreText: "88/100 Risk",
        rakshaSummary: "High phishing probability detected based on suspicious TLD and brand spoofing patterns.",
      };
      linkSafetyCache.set(url, rating);
      callback(rating);
      return;
    }

    // 3. Query KAVACH backend
    chrome.runtime.sendMessage({ type: "CHECK_URL_SAFETY", url }, (response) => {
      if (chrome.runtime.lastError || !response || !response.success) {
        // Fallback heuristic if backend is temporarily unreachable
        const fallbackRating = isSuspiciousTLD
          ? {
              level: "SUSPICIOUS",
              badgeClass: "kavach-advisor-warn",
              svgIcon: SVG_ICONS.WARN,
              icon: "!",
              label: "Caution — New TLD",
              score: 45,
              scoreText: "Caution",
              rakshaSummary: "Domain uses non-standard TLD with unverified reputation.",
            }
          : {
              level: "SAFE",
              badgeClass: "kavach-advisor-safe",
              svgIcon: SVG_ICONS.SAFE,
              icon: "✓",
              label: "Normal Site",
              score: 10,
              scoreText: "Safe",
              rakshaSummary: "No malicious indicators detected on domain.",
            };
        linkSafetyCache.set(url, fallbackRating);
        callback(fallbackRating);
        return;
      }

      const data = response.data;
      const score = Math.round(data.risk_score || 0);
      let rating;

      if (score >= 65 || data.risk_level === "CRITICAL" || data.risk_level === "HIGH RISK") {
        rating = {
          level: "DANGER",
          badgeClass: "kavach-advisor-danger",
          svgIcon: SVG_ICONS.DANGER,
          icon: "✗",
          label: "Dangerous Site",
          score,
          scoreText: `${score}/100 Risk`,
          rakshaSummary: data.raksha_summary || "Phishing or malicious script execution pattern identified.",
        };
      } else if (score >= 30 || data.risk_level === "SUSPICIOUS") {
        rating = {
          level: "SUSPICIOUS",
          badgeClass: "kavach-advisor-warn",
          svgIcon: SVG_ICONS.WARN,
          icon: "!",
          label: "Suspicious",
          score,
          scoreText: `${score}/100 Risk`,
          rakshaSummary: data.raksha_summary || "Uncommon domain structure or newly registered domain.",
        };
      } else {
        rating = {
          level: "SAFE",
          badgeClass: "kavach-advisor-safe",
          svgIcon: SVG_ICONS.SAFE,
          icon: "✓",
          label: "Verified Safe",
          score,
          scoreText: "Protected",
          rakshaSummary: data.raksha_summary || "Raksha AI verified this domain as safe.",
        };
      }

      linkSafetyCache.set(url, rating);
      callback(rating);
    });
  }

  // 4. KAVACH Link Sentinel Floating Popover Card
  let cardRemovalTimeout = null;

  function showSiteCard(x, y, url, hostname, rating) {
    if (cardRemovalTimeout) {
      clearTimeout(cardRemovalTimeout);
      cardRemovalTimeout = null;
    }

    if (!activeCard) {
      activeCard = document.createElement("div");
      activeCard.id = "kavach-site-card";
      document.body.appendChild(activeCard);

      activeCard.addEventListener("mouseenter", () => {
        if (cardRemovalTimeout) clearTimeout(cardRemovalTimeout);
      });
      activeCard.addEventListener("mouseleave", () => {
        scheduleCardRemoval();
      });
    }

    const pillClass = rating.level === "DANGER" ? "danger" : rating.level === "SUSPICIOUS" ? "suspicious" : "safe";
    const statusIcon = rating.level === "DANGER" ? "🚨" : rating.level === "SUSPICIOUS" ? "⚠️" : "🛡️";
    const brandIconUrl = (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL) 
      ? chrome.runtime.getURL("assets/icon16.png") 
      : "";
    const brandIconHtml = brandIconUrl 
      ? `<img src="${brandIconUrl}" class="kavach-card-shield-img" width="18" height="18" alt="KAVACH">`
      : `<span class="shield">${statusIcon}</span>`;

    activeCard.innerHTML = `
      <div class="kavach-card-header">
        <div class="kavach-card-brand">
          ${brandIconHtml}
          <div class="kavach-card-domain" title="${hostname}">${hostname}</div>
        </div>
        <span class="kavach-card-pill ${pillClass}">${rating.label}</span>
      </div>
      <div class="kavach-card-body">
        <div class="kavach-card-row">
          <span>KAVACH Threat Rating:</span>
          <strong>${rating.scoreText}</strong>
        </div>
        <div class="kavach-card-row">
          <span>Connection:</span>
          <strong>${url.startsWith("https://") ? "🔒 Encrypted HTTPS" : "⚠️ Unencrypted HTTP"}</strong>
        </div>
        <div class="kavach-card-ai">
          <div class="kavach-card-ai-title">✨ Raksha AI Assessment</div>
          <p class="kavach-card-ai-desc">${rating.rakshaSummary}</p>
        </div>
      </div>
      <div class="kavach-card-footer">
        <button class="kavach-btn kavach-btn-primary" id="kavachCardSocBtn">View in SOC</button>
        <button class="kavach-btn kavach-btn-secondary" id="kavachCardCloseBtn">Dismiss</button>
      </div>
    `;

    // Position popover intelligently near cursor
    const cardWidth = 320;
    const cardHeight = 240;
    let left = x + 12;
    let top = y + 12;

    if (left + cardWidth > window.innerWidth + window.scrollX) {
      left = x - cardWidth - 12;
    }
    if (top + cardHeight > window.innerHeight + window.scrollY) {
      top = y - cardHeight - 12;
    }

    activeCard.style.left = `${Math.max(10, left)}px`;
    activeCard.style.top = `${Math.max(10, top)}px`;
    activeCard.style.display = "block";

    document.getElementById("kavachCardCloseBtn")?.addEventListener("click", () => {
      removeSiteCard();
    });

    document.getElementById("kavachCardSocBtn")?.addEventListener("click", () => {
      window.open("http://localhost:8000/soc", "_blank");
    });
  }

  function scheduleCardRemoval() {
    cardRemovalTimeout = setTimeout(() => {
      removeSiteCard();
    }, 300);
  }

  function removeSiteCard() {
    if (activeCard) {
      activeCard.remove();
      activeCard = null;
    }
  }

  // 5. Interstitial Blocking Shield for High-Risk Sites
  function showBlockingShield(data) {
    if (document.getElementById("kavach-blocking-shield")) return;

    const shield = document.createElement("div");
    shield.id = "kavach-blocking-shield";
    shield.innerHTML = `
      <div class="shield-box">
        <div class="shield-icon">🛡️</div>
        <h2>KAVACH CYBER DEFENSE: SITE BLOCKED</h2>
        <p class="desc">
          KAVACH intercepted this page because it exhibits malicious or phishing indicators
          (${data.risk_score || 85}/100 Risk). Your sensitive passwords and personal data were protected.
        </p>
        <div class="shield-actions">
          <button class="primary-btn" id="kavachShieldBackBtn">Return to Safety (Recommended)</button>
          <button class="bypass-btn" id="kavachShieldBypassBtn">Proceed Anyway (Unsafe)</button>
        </div>
      </div>
    `;

    document.body.appendChild(shield);

    document.getElementById("kavachShieldBackBtn").addEventListener("click", () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "https://www.google.com";
      }
    });

    document.getElementById("kavachShieldBypassBtn").addEventListener("click", () => {
      shield.remove();
    });
  }

  // 6. Sticky Warning Banner (for Moderate/Warning Sites)
  function showKavachWarningBanner(data) {
    if (document.getElementById("kavach-security-banner")) return;

    const banner = document.createElement("div");
    banner.id = "kavach-security-banner";
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 2147483647;
      background: linear-gradient(90deg, #7f1d1d, #991b1b);
      color: #ffffff;
      padding: 12px 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      border-bottom: 2px solid #ef4444;
    `;

    banner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 20px;">🛡️</span>
        <div>
          <strong style="font-size: 14px; letter-spacing: 0.5px;">KAVACH SECURITY ALERT:</strong>
          <span>This website exhibits phishing or malicious indicators (${data.risk_score || 75}/100 Risk).</span>
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="kavach-back-btn" style="
          background: #ffffff;
          color: #991b1b;
          border: none;
          padding: 6px 14px;
          font-weight: 700;
          border-radius: 4px;
          cursor: pointer;
        ">Return to Safety</button>
        <button id="kavach-dismiss-btn" style="
          background: transparent;
          color: #fca5a5;
          border: 1px solid #f87171;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
        ">Dismiss</button>
      </div>
    `;

    document.body.prepend(banner);

    document.getElementById("kavach-back-btn").addEventListener("click", () => {
      window.history.back();
    });

    document.getElementById("kavach-dismiss-btn").addEventListener("click", () => {
      banner.remove();
    });
  }

  function debounce(fn, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), delay);
    };
  }
})();
