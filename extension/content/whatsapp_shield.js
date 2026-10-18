// KAVACH Cyber Threat Intelligence — WhatsApp Web Scam & Spam Sentinel
// Native DOM Scraper & Phone Number / Message Scam Detector for web.whatsapp.com

(function () {
  if (!window.location.hostname.includes("web.whatsapp.com")) return;

  console.log("[KAVACH] WhatsApp Web Spam & Scam Sentinel Active");

  // High-risk international country codes commonly used in cross-border fraud targeting users
  const HIGH_RISK_COUNTRY_PREFIXES = [
    { prefix: "+92", country: "Pakistan (High Scam Risk)" },
    { prefix: "+234", country: "Nigeria (Financial Fraud Risk)" },
    { prefix: "+880", country: "Bangladesh (VoIP Abuse Risk)" },
    { prefix: "+855", country: "Cambodia (Cyber Syndicate Call-Center Risk)" },
    { prefix: "+62", country: "Indonesia (Task Scam Risk)" },
    { prefix: "+94", country: "Sri Lanka (Unverified Sender)" },
    { prefix: "+4470", country: "UK Premium Rate Number" },
    { prefix: "+254", country: "Kenya (SIM Swap / Fraud Risk)" }
  ];

  // Common WhatsApp Scam Triggers & Heuristics
  const WHATSAPP_SCAM_PATTERNS = [
    { regex: /(part-time\s+job|work\s+from\s+home|earn\s+₹\s*\d+|₹\s*2000\s*-\s*₹\s*5000|like\s+youtube\s+video|rate\s+hotel|google\s+review)/i, label: "Part-Time Job / Task Scam", weight: 45 },
    { regex: /(electricity\s+bill|power\s+will\s+be\s+disconnected|electricity\s+officer|contact\s+at\s*\d{10})/i, label: "Urgent Electricity Disconnection Threat Scam", weight: 50 },
    { regex: /(kbc|kaun\s+banega\s+crorepati|lottery\s+winner|lucky\s+draw|₹\s*25\s*lakh|congratulations\s+you\s+won)/i, label: "Lottery / Prize Fraud", weight: 50 },
    { regex: /(fedex|customs|parcel\s+seized|illegal\s+items|narcotics|police\s+case|arrest\s+warrant)/i, label: "Digital Arrest / Courier Customs Extortion", weight: 50 },
    { regex: /(install\s+apk|download\s+app|update\.apk|kavach\.apk|bank.*\.apk)/i, label: "Malicious APK Delivery Vector", weight: 50 },
    { regex: /(send\s+otp|share\s+code|screen\s+share|anydesk|teamviewer|rustdesk)/i, label: "Remote Access / OTP Theft Attempt", weight: 45 },
    { regex: /(join\s+telegram|t\.me\/|telegram\s+group|whatsapp\s+vip|crypto\s+profit)/i, label: "Off-Platform Telegram Redirection Scam", weight: 35 }
  ];

  let observer = null;

  function initWhatsAppSentinel() {
    scanActiveConversation();
    scanChatList();

    observer = new MutationObserver(debounce(() => {
      scanActiveConversation();
      scanChatList();
    }, 400));

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // 1. Scan Active Conversation Panel
  function scanActiveConversation() {
    const mainChat = document.querySelector("#main") || document.querySelector("div[data-testid='conversation-panel-wrapper']");
    if (!mainChat) return;

    // Extract Contact Name / Phone Number from header
    const headerTitleEl = mainChat.querySelector("header span[title]") || mainChat.querySelector("header div[role='button'] span");
    if (!headerTitleEl) return;

    const contactTitle = headerTitleEl.getAttribute("title") || headerTitleEl.textContent.trim();
    if (!contactTitle) return;

    // Check if title is an unsaved phone number (starts with + or contains digits)
    const isPhoneNumber = /^\+?[\d\s\-()]{7,20}$/.test(contactTitle.replace(/\s+/g, ""));
    const normalizedNumber = contactTitle.replace(/[^\d+]/g, "");

    // Check high-risk international prefix
    let foreignRiskMatch = null;
    if (isPhoneNumber || normalizedNumber.startsWith("+")) {
      foreignRiskMatch = HIGH_RISK_COUNTRY_PREFIXES.find(item => normalizedNumber.startsWith(item.prefix));
    }

    // Inspect incoming message bubbles
    const incomingMessages = mainChat.querySelectorAll("div.message-in");
    let detectedScams = [];
    let scamScore = 0;
    let hasApk = false;

    incomingMessages.forEach((msg) => {
      const textEl = msg.querySelector(".selectable-text") || msg;
      const text = textEl ? textEl.textContent.trim() : "";

      // Check text patterns
      WHATSAPP_SCAM_PATTERNS.forEach((pattern) => {
        if (pattern.regex.test(text) && !detectedScams.includes(pattern.label)) {
          detectedScams.push(pattern.label);
          scamScore += pattern.weight;
        }
      });

      // Check for attached APK documents
      if (/\.apk/i.test(text) || msg.querySelector("span[title*='.apk']")) {
        hasApk = true;
        scamScore += 50;
        if (!detectedScams.includes("Malicious APK File Attached")) {
          detectedScams.push("Malicious APK File Attached");
        }
      }

      // Check suspicious shortened links inside message
      const links = msg.querySelectorAll("a[href^='http']");
      links.forEach((a) => {
        const href = a.href;
        if (/bit\.ly|tinyurl\.com|t\.me|wa\.me|(?:\.xyz|\.top|\.ru|\.click)/i.test(href)) {
          scamScore += 25;
          if (!detectedScams.includes("Suspicious Redirect Link")) {
            detectedScams.push("Suspicious Redirect Link");
          }
          // Annotate link with red warning
          a.style.color = "#ea0038";
          a.style.fontWeight = "bold";
        }
      });
    });

    if (foreignRiskMatch) {
      scamScore += 35;
      detectedScams.unshift(`Foreign High-Risk Prefix: ${foreignRiskMatch.country}`);
    }

    const combinedChatText = Array.from(incomingMessages).map(m => m.textContent || "").join(" ");
    const allLinks = Array.from(mainChat.querySelectorAll("a[href^='http']")).map(a => a.href);

    // Query backend ML model
    chrome.runtime.sendMessage(
      {
        type: "SCAN_COMMS_ML",
        phone_number: contactTitle,
        message_text: combinedChatText.slice(0, 1500),
        links: allLinks,
      },
      (response) => {
        let isScam = scamScore >= 40 || foreignRiskMatch !== null || hasApk;
        let finalScore = scamScore;
        let reasons = detectedScams;

        if (!chrome.runtime.lastError && response && response.success && response.data) {
          const ml = response.data;
          if (ml.is_threat || ml.risk_score >= 50) {
            isScam = true;
            finalScore = Math.max(finalScore, ml.risk_score);
            reasons = Array.from(new Set([...reasons, ...(ml.indicators || [])]));
          }
        }

        if (isScam) {
          injectWhatsAppWarningBanner(mainChat, contactTitle, Math.min(100, Math.round(finalScore)), reasons);
        } else {
          mainChat.querySelector(".kavach-wa-banner")?.remove();
        }
      }
    );
  }

  // 2. Scan Sidebar Chat List Items
  function scanChatList() {
    const chatItems = document.querySelectorAll("div[data-testid='cell-frame-container'], div[role='row']");
    chatItems.forEach((item) => {
      if (item.dataset.kavachScanned) return;

      const titleEl = item.querySelector("span[title]");
      if (!titleEl) return;

      const title = titleEl.getAttribute("title") || titleEl.textContent.trim();
      const normalized = title.replace(/[^\d+]/g, "");

      const isHighRisk = HIGH_RISK_COUNTRY_PREFIXES.some(p => normalized.startsWith(p.prefix));
      if (isHighRisk) {
        item.dataset.kavachScanned = "true";
        const badge = document.createElement("span");
        badge.className = "kavach-wa-list-badge";
        badge.textContent = "⚠️ SCAM RISK";
        badge.title = "KAVACH Alert: Unknown high-risk international number";
        titleEl.parentNode.appendChild(badge);
      }
    });
  }

  // 3. Inject Native WhatsApp Safety Warning Banner
  function injectWhatsAppWarningBanner(mainChat, sender, score, reasons) {
    let existingBanner = mainChat.querySelector(".kavach-wa-banner");
    if (existingBanner) return;

    const banner = document.createElement("div");
    banner.className = "kavach-wa-banner";

    banner.innerHTML = `
      <div class="kavach-wa-header">
        <div class="kavach-wa-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea0038" stroke-width="2.3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v5M12 16v.5"/></svg>
          <strong>KAVACH Cyber Defense: WhatsApp Threat Alert</strong>
        </div>
        <span class="kavach-wa-badge">${score}/100 THREAT SCORE</span>
      </div>
      <p class="kavach-wa-desc">
        <strong>Sender:</strong> <span class="kavach-sender-num">${escapeHtml(sender)}</span><br>
        <strong>Detected Flags:</strong> ${escapeHtml(reasons.join(" • "))}
      </p>
      <div class="kavach-wa-actions">
        <button class="kavach-wa-btn kavach-btn-block-links" type="button">🛡️ Disarm Links &amp; Media</button>
        <button class="kavach-wa-btn kavach-btn-dismiss-wa" type="button">Dismiss</button>
      </div>
    `;

    // Insert banner right below the chat header
    const headerEl = mainChat.querySelector("header");
    if (headerEl && headerEl.nextSibling) {
      headerEl.parentNode.insertBefore(banner, headerEl.nextSibling);
    } else {
      mainChat.prepend(banner);
    }

    // Disarm links inside chat
    banner.querySelector(".kavach-btn-block-links")?.addEventListener("click", () => {
      const allLinks = mainChat.querySelectorAll("a[href^='http']");
      allLinks.forEach((a) => {
        a.href = "javascript:void(0)";
        a.style.pointerEvents = "none";
        a.style.color = "#8696a0";
        a.style.textDecoration = "line-through";
      });
      const btn = banner.querySelector(".kavach-btn-block-links");
      if (btn) {
        btn.textContent = "✓ All Links Neutralized";
        btn.style.background = "#00a884";
        btn.style.color = "#ffffff";
      }
    });

    banner.querySelector(".kavach-btn-dismiss-wa")?.addEventListener("click", () => {
      banner.remove();
    });
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function debounce(fn, delay) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), delay);
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWhatsAppSentinel);
  } else {
    initWhatsAppSentinel();
  }
})();
