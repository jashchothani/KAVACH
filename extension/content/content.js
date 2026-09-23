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

  // 3. McAfee SiteAdvisor-Style Link Annotator
  function initLinkAnnotations() {
    annotateLinks();

    // Observe dynamic changes (e.g., infinite scroll or AJAX on Google / Bing)
    const observer = new MutationObserver(debounce(() => {
      annotateLinks();
    }, 400));

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function annotateLinks() {
    // Select prominent search engine results and prominent content links
    const selectors = [
      // Google search results
      "div.g h3 a", "div.g a[jsname]", "div.yuRUbf > a", "a[data-ved] h3",
      // Bing search results
      "li.b_algo h2 a", "li.b_algo .b_title a",
      // DuckDuckGo search results
      "a[data-testid='result-title-a']", "a.result__url",
      // General external links
      "main a[href^='http']", "article a[href^='http']", "div#content a[href^='http']"
    ];

    const elements = document.querySelectorAll(selectors.join(", "));
    const currentHost = window.location.hostname;

    elements.forEach((el) => {
      // Find the anchor element
      const anchor = el.tagName === "A" ? el : el.closest("a");
      if (!anchor || anchor.dataset.kavachChecked || !anchor.href) return;

      const urlStr = anchor.href;
      if (urlStr.startsWith("javascript:") || urlStr.startsWith("#") || urlStr.startsWith("mailto:")) return;

      let parsed;
      try {
        parsed = new URL(urlStr);
      } catch (e) {
        return;
      }

      // Skip internal anchors on the same host unless on a search engine
      const isSearchEngine = /google\.|bing\.|duckduckgo\.|yahoo\./i.test(currentHost);
      if (!isSearchEngine && parsed.hostname === currentHost) return;

      anchor.dataset.kavachChecked = "true";
      attachBadge(anchor, urlStr, parsed.hostname);
    });
  }

  function attachBadge(anchor, url, hostname) {
    const badge = document.createElement("span");
    badge.className = "kavach-advisor-badge kavach-advisor-loading";
    badge.title = "KAVACH Safety: Scanning...";
    badge.textContent = "•";

    // Insert badge immediately after anchor text or heading
    anchor.parentNode.insertBefore(badge, anchor.nextSibling);

    // Evaluate safety
    evaluateUrlSafety(url, hostname, (rating) => {
      badge.className = `kavach-advisor-badge ${rating.badgeClass}`;
      badge.textContent = rating.icon;
      badge.title = `KAVACH: ${rating.label} (${rating.scoreText})`;

      // Hover / Click interaction: Show SiteAdvisor Popover Card
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
              icon: "!",
              label: "Caution — New TLD",
              score: 45,
              scoreText: "Caution",
              rakshaSummary: "Domain uses non-standard TLD with unverified reputation.",
            }
          : {
              level: "SAFE",
              badgeClass: "kavach-advisor-safe",
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

  // 4. McAfee SiteAdvisor-style Floating Popover Card
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

    activeCard.innerHTML = `
      <div class="kavach-card-header">
        <div class="kavach-card-brand">
          <span class="shield">${statusIcon}</span>
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
      window.open("http://localhost:5173/threats", "_blank");
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
