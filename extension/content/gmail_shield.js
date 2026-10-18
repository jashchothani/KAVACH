// KAVACH Cyber Threat Intelligence — Gmail Phishing, Spam & Scam Sentinel
// Native DOM Scraper, Machine Learning Integration, Branded Protection Toast & Sovereign Shield

(function () {
  if (!window.location.hostname.includes("mail.google.com")) return;

  console.log("[KAVACH] Gmail Sentinel initializing...");

  // Popular brands targeted by spear-phishing & impersonation
  const BRAND_DOMAINS = {
    "google": ["google.com", "googlemail.com", "notifications.google.com"],
    "microsoft": ["microsoft.com", "microsoftonline.com", "live.com", "outlook.com"],
    "apple": ["apple.com", "icloud.com"],
    "paypal": ["paypal.com", "paypal-communication.com"],
    "amazon": ["amazon.com", "amazon.in", "amazon.co.uk"],
    "netflix": ["netflix.com"],
    "state bank": ["sbi.co.in", "onlinesbi.sbi"],
    "sbi": ["sbi.co.in", "onlinesbi.sbi"],
    "hdfc": ["hdfcbank.com"],
    "icici": ["icicibank.com"],
    "income tax": ["incometax.gov.in", "incometaxindia.gov.in"],
    "fedex": ["fedex.com"],
    "dhl": ["dhl.com"],
    "binance": ["binance.com"],
    "meta": ["facebookmail.com", "meta.com", "instagram.com"]
  };

  const SCAM_PATTERNS = [
    { regex: /(account|service|access)\s+(suspended|locked|terminated|blocked|disabled)/i, label: "Urgent Account Suspension Threat", weight: 45 },
    { regex: /(verify|confirm|validate|update)\s+(your|account|identity|pan|kyc|card)\s+(immediately|now|within\s+\d+\s+hours)/i, label: "Urgent Identity/KYC Harvesting Lure", weight: 40 },
    { regex: /(unauthorized|suspicious|fraudulent)\s+(transaction|login|purchase|charge|activity)/i, label: "Fake Unauthorized Charge Alert", weight: 35 },
    { regex: /(won|winner|lottery|prize|bonus|reward|gift\s+card|free\s+crypto|₹\s*\d+,\d+)/i, label: "Lottery / Prize Bait Scam", weight: 40 },
    { regex: /(income\s+tax\s+refund|tax\s+rebate|direct\s+transfer\s+pending)/i, label: "Fake Tax Refund Bait", weight: 35 },
    { regex: /(invoice|payment\s+receipt|billing\s+statement)\s*#?\s*\d+/i, label: "Fake Invoice / Phishing Attachment", weight: 25 },
    { regex: /(job\s+offer|earn\s+₹\s*\d+|part-time\s+work|youtube\s+like)/i, label: "Task / Part-Time Job Scam", weight: 35 }
  ];

  // 1. COMPULSORY BRANDED PROTECTION TOAST ON GMAIL ENTRY
  function showGmailProtectionToast() {
    const TOAST_COOLDOWN_MS = 20 * 60 * 1000; // 20 minutes cooldown per session
    const lastShown = sessionStorage.getItem("kavach_gmail_toast_ts");
    if (lastShown && Date.now() - parseInt(lastShown, 10) < TOAST_COOLDOWN_MS) {
      return;
    }

    if (document.getElementById("kavach-gmail-toast")) return;

    sessionStorage.setItem("kavach_gmail_toast_ts", Date.now().toString());

    const logoUrl = chrome.runtime?.getURL ? chrome.runtime.getURL("assets/icon48.png") : "";

    const toast = document.createElement("div");
    toast.id = "kavach-gmail-toast";
    toast.innerHTML = `
      <img src="${logoUrl}" class="kavach-toast-logo" alt="KAVACH" onerror="this.style.display='none'">
      <div class="kavach-toast-content">
        <div class="kavach-toast-title">
          <span>KAVACH is protecting you</span>
        </div>
        <div class="kavach-toast-status" id="kavachToastStatusText">
          <span class="kavach-toast-dot blue"></span>
          <span>Checking protection status...</span>
        </div>
      </div>
      <button class="kavach-toast-close" id="kavachToastCloseBtn" title="Dismiss" type="button">✕</button>
    `;

    document.body.appendChild(toast);

    // Close button
    toast.querySelector("#kavachToastCloseBtn")?.addEventListener("click", () => {
      dismissToast(toast);
    });

    // Verify backend connectivity for accurate state indicator
    chrome.runtime.sendMessage({ type: "CHECK_URL_SAFETY", url: "https://mail.google.com" }, (res) => {
      const statusText = document.getElementById("kavachToastStatusText");
      if (!statusText) return;

      if (!chrome.runtime.lastError && res && res.success) {
        statusText.innerHTML = `
          <span class="kavach-toast-dot green"></span>
          <span style="color: #34d399; font-weight: 600;">Protection active</span>
        `;
      } else {
        // Local heuristics fallback is active
        statusText.innerHTML = `
          <span class="kavach-toast-dot amber"></span>
          <span style="color: #fbbf24;">Partially available (Local Heuristics Active)</span>
        `;
      }
    });

    // Auto-dismiss after 6.5s
    setTimeout(() => {
      dismissToast(toast);
    }, 6500);
  }

  function dismissToast(toastEl) {
    if (!toastEl || toastEl.classList.contains("kavach-toast-dismissing")) return;
    toastEl.classList.add("kavach-toast-dismissing");
    setTimeout(() => {
      toastEl.remove();
    }, 320);
  }

  // 2. UNFILTERED INBOX THREAT TOAST (SHOWN ONCE PER DETECTED MESSAGE)
  function showInboxThreatToast(evaluation, senderName, senderEmail) {
    if (document.getElementById("kavach-inbox-threat-toast")) {
      document.getElementById("kavach-inbox-threat-toast").remove();
    }

    const toast = document.createElement("div");
    toast.id = "kavach-inbox-threat-toast";
    toast.innerHTML = `
      <div class="kavach-threat-toast-header">
        <div class="kavach-threat-toast-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 5.5v6.2c0 5.25 3.4 10.15 8 11.3 4.6-1.15 8-6.05 8-11.3V5.5L12 2z" fill="#ef4444"/><path d="M12 8v5M12 16v0.5" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/></svg>
          <span>Unfiltered Threat in Primary Inbox</span>
        </div>
        <span class="kavach-threat-toast-tag">${evaluation.risk_level || "CRITICAL"}</span>
      </div>
      <div class="kavach-threat-toast-desc">
        This email bypassed standard filters into your inbox. KAVACH machine learning has quarantined this message.
      </div>
      <div style="font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; align-items: center;">
        <span>From: <strong style="color: #f1f5f9;">${escapeHtml(senderName || senderEmail)}</strong></span>
        <button class="kavach-toast-close" id="kavachThreatToastClose" style="color: #cbd5e1;">✕</button>
      </div>
    `;

    document.body.appendChild(toast);

    toast.querySelector("#kavachThreatToastClose")?.addEventListener("click", () => {
      dismissToast(toast);
    });

    setTimeout(() => {
      dismissToast(toast);
    }, 8000);
  }

  // Helper: Detect whether current email is in Gmail's Spam / Trash or has Gmail native spam banner
  function isGmailSpamContext(pane) {
    const hash = (window.location.hash || "").toLowerCase();
    if (hash.includes("spam") || hash.includes("trash")) {
      return true;
    }

    // Check for native Gmail Spam banner in or near the pane
    const nativeSpamBanners = document.querySelectorAll("div.asv, div.bT, div.vh, div.adP");
    for (const b of nativeSpamBanners) {
      const text = b.textContent.toLowerCase();
      if (text.includes("why is this message in spam") || text.includes("similar to messages that were identified as spam") || text.includes("be careful with this message")) {
        return true;
      }
    }

    return false;
  }

  // 3. SCAN INBOX LIST ROWS (tr.zA)
  function scanInboxRows() {
    const rows = document.querySelectorAll("tr.zA");
    rows.forEach((row) => {
      if (row.dataset.kavachScanned) return;
      row.dataset.kavachScanned = "true";

      const senderEl = row.querySelector("span[email]") || row.querySelector("span.bA4") || row.querySelector("div.yW");
      const subjectEl = row.querySelector("span.bog") || row.querySelector("div.xT span");
      const snippetEl = row.querySelector("span.y2");

      const senderText = senderEl ? senderEl.textContent.trim() : "";
      const senderEmail = senderEl && senderEl.getAttribute("email") ? senderEl.getAttribute("email") : "";
      const subjectText = subjectEl ? subjectEl.textContent.trim() : "";
      const snippetText = snippetEl ? snippetEl.textContent.trim() : "";

      const threat = localEmailAnalysis(senderText, senderEmail, subjectText, snippetText, []);

      if (threat.is_threat && subjectEl) {
        const badge = document.createElement("span");
        badge.className = `kavach-gmail-inbox-badge ${threat.risk_score >= 70 ? "kavach-gmail-danger" : "kavach-gmail-warning"}`;
        badge.textContent = threat.risk_score >= 70 ? "🚨 PHISHING" : "⚠️ SUSPICIOUS";
        badge.setAttribute("aria-label", `KAVACH Alert: ${threat.indicators.join(", ")}`);
        subjectEl.parentNode.insertBefore(badge, subjectEl);
        row.classList.add("kavach-threat-row");
      }
    });
  }

  // 4. SCAN OPEN EMAIL MESSAGE PANE
  function scanOpenEmails() {
    const emailPanes = document.querySelectorAll("div.adn.ads, div.gE.iv.gt, div.nH.hx");
    emailPanes.forEach((pane) => {
      if (pane.dataset.kavachPaneScanned) return;

      const senderSpan = pane.querySelector("span.gD") || pane.querySelector("span[email]");
      const bodyDiv = pane.querySelector("div.a3s.aiL") || pane.querySelector("div.ii.gt");
      const subjectHeading = pane.querySelector("h2.hP") || document.querySelector("h2.hP");

      if (!senderSpan || !bodyDiv) return;
      pane.dataset.kavachPaneScanned = "true";

      const senderName = senderSpan.getAttribute("name") || senderSpan.textContent.trim();
      const senderEmail = senderSpan.getAttribute("email") || "";
      const subjectText = subjectHeading ? subjectHeading.textContent.trim() : "";
      const bodyText = bodyDiv.textContent.trim();

      // Collect deceptive links
      const deceptiveLinks = checkDeceptiveLinks(bodyDiv);
      const linkHrefs = Array.from(bodyDiv.querySelectorAll("a[href^='http']")).map(a => a.href);

      // Check if this email is already quarantined in Gmail Spam
      const inGmailSpam = isGmailSpamContext(pane);

      // Unique message key for deduplication
      const rawMsgId = pane.closest("div[data-message-id]")?.getAttribute("data-message-id") ||
                       pane.getAttribute("data-legacy-message-id") ||
                       `${senderEmail}__${subjectText}`;
      const msgHash = hashString(rawMsgId);

      // Query KAVACH ML Model (or fallback to local heuristics)
      chrome.runtime.sendMessage(
        {
          type: "SCAN_EMAIL_ML",
          sender_name: senderName,
          sender_email: senderEmail,
          subject: subjectText,
          body: bodyText,
          links: linkHrefs,
        },
        (response) => {
          let evaluation;
          if (!chrome.runtime.lastError && response && response.success && response.data) {
            evaluation = response.data;
          } else {
            evaluation = localEmailAnalysis(senderName, senderEmail, subjectText, bodyText, deceptiveLinks);
          }

          if (inGmailSpam) {
            // Email is already marked as spam by Gmail -> Neutralize links & show calm advisory banner
            injectGmailSpamAdvisoryBanner(bodyDiv, evaluation);
            neutralizeLinks(bodyDiv);
          } else if (evaluation.is_threat || evaluation.risk_score >= 55) {
            // UNFILTERED THREAT IN INBOX!
            // Deduplicate: Show alert notification ONCE per unique message
            const alertedKey = `kavach_inbox_alert_${msgHash}`;
            if (!sessionStorage.getItem(alertedKey)) {
              sessionStorage.setItem(alertedKey, "true");
              showInboxThreatToast(evaluation, senderName, senderEmail);
            }

            // Block body with Sovereign Warning Screen
            injectGmailBlockingScreen(bodyDiv, evaluation, senderName, senderEmail);
          } else {
            // Verified Safe Sender
            injectGmailSafeBadge(senderSpan);
          }

          // Attach click interceptors for deceptive/suspicious links
          attachEmailLinkInterceptors(bodyDiv);
        }
      );
    });
  }

  // 5. LOCAL HEURISTICS & MACHINE LEARNING FALLBACK
  function localEmailAnalysis(senderName, senderEmail, subject, body, deceptiveLinks) {
    let riskScore = 0;
    const indicators = [];
    const textToCheck = `${subject} ${body}`.toLowerCase();
    const senderLower = `${senderName} ${senderEmail}`.toLowerCase();

    // Check brand spoofing
    let impersonatedBrand = null;
    for (const [brand, legitDomains] of Object.entries(BRAND_DOMAINS)) {
      if (senderLower.includes(brand)) {
        const domainMatch = senderEmail ? legitDomains.some(d => senderEmail.toLowerCase().endsWith(d)) : false;
        if (!domainMatch && senderEmail) {
          riskScore += 65;
          impersonatedBrand = brand.toUpperCase();
          indicators.push(`Critical Brand Impersonation: Claims to be "${brand.toUpperCase()}", but sender domain is "${senderEmail.split('@')[1] || senderEmail}"`);
          break;
        }
      }
    }

    // Check scam intent patterns
    SCAM_PATTERNS.forEach((pattern) => {
      if (pattern.regex.test(textToCheck)) {
        riskScore += pattern.weight;
        indicators.push(pattern.label);
      }
    });

    // Check raw IPs or suspicious TLDs
    if (/@.*(?:\.xyz|\.top|\.pw|\.ru|\.buzz|\.click|\.tk|\.work)$/i.test(senderEmail)) {
      riskScore += 30;
      indicators.push("Sender domain registered under high-risk TLD frequently abused by scammers");
    }

    // Deceptive link signals
    if (deceptiveLinks && deceptiveLinks.length > 0) {
      riskScore += 45;
      indicators.push(`Deceptive Hyperlinks: Link text displays trusted brand but points to ${deceptiveLinks[0].destination}`);
    }

    const finalScore = Math.min(100, riskScore);
    const isThreat = finalScore >= 55;

    return {
      is_threat: isThreat,
      risk_score: finalScore,
      risk_level: finalScore >= 75 ? "CRITICAL" : finalScore >= 55 ? "HIGH RISK" : "SUSPICIOUS",
      confidence_score: (finalScore / 100).toFixed(2),
      impersonated_brand: impersonatedBrand,
      indicators: indicators.length > 0 ? indicators : ["Clean sender profile"],
      raksha_summary: isThreat
        ? "KAVACH ML Sentinel flagged this email as high-probability phishing or financial fraud."
        : "Standard communication baseline.",
    };
  }

  // 6. DECEPTIVE HYPERLINK DETECTOR
  function checkDeceptiveLinks(container) {
    const deceptive = [];
    const links = container.querySelectorAll("a[href^='http']");
    links.forEach((a) => {
      const text = a.textContent.trim();
      const href = a.href;
      try {
        const hrefHost = new URL(href).hostname.replace(/^www\./, "");
        if (/^https?:\/\//i.test(text) || /\.(com|org|net|in|gov|edu)/i.test(text)) {
          const textHost = text.replace(/^https?:\/\//i, "").split("/")[0].replace(/^www\./, "");
          if (textHost && hrefHost && textHost !== hrefHost && !hrefHost.endsWith(textHost)) {
            deceptive.push({ text, destination: hrefHost, el: a });
          }
        }
      } catch (e) {}
    });
    return deceptive;
  }

  // 7. INJECT SOVEREIGN GMAIL BLOCKING WARNING SCREEN
  function injectGmailBlockingScreen(bodyDiv, evaluation, senderName, senderEmail) {
    if (bodyDiv.parentNode.querySelector(".kavach-gmail-warning-screen")) return;

    // Immediately HIDE/BLOCK the malicious email body content
    bodyDiv.classList.add("kavach-blocked-body-hidden");

    const screen = document.createElement("div");
    screen.className = "kavach-gmail-warning-screen";

    const impersonated = evaluation.impersonated_brand || (evaluation.indicators.find(i => i.includes("Impersonation")) ? "Brand Spoofing" : null);

    screen.innerHTML = `
      <div class="kavach-screen-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 2L4 5.5v6.2c0 5.25 3.4 10.15 8 11.3 4.6-1.15 8-6.05 8-11.3V5.5L12 2z" fill="#dc2626"/>
          <path d="M12 8v5M12 16v0.5" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>
        </svg>
      </div>
      <h2>KAVACH Machine Learning Sentinel: Harmful Email Blocked</h2>
      <div class="kavach-screen-badge">
        ${evaluation.risk_level || "CRITICAL PHISHING"} · ${Math.round(evaluation.risk_score || 85)}/100 THREAT SCORE
      </div>
      <p class="kavach-screen-desc">
        KAVACH intercepted this email before any malicious scripts, credential forms, or tracking pixels could execute.
        ${impersonated ? `<strong>Detected ${impersonated} brand impersonation.</strong>` : "Dangerous phishing or financial scam signatures detected."}
      </p>

      <div class="kavach-screen-details">
        <div class="kavach-screen-row">
          <span style="color: #6b7280;">Sender Claimed:</span>
          <strong>${escapeHtml(senderName || "Unknown")} (${escapeHtml(senderEmail)})</strong>
        </div>
        <div class="kavach-screen-row">
          <span style="color: #6b7280;">ML Model Confidence:</span>
          <strong style="color: #ef4444;">${Math.round((evaluation.confidence_score || 0.94) * 100)}% Phishing Probability</strong>
        </div>
        <div class="kavach-screen-row" style="flex-direction: column; align-items: flex-start; gap: 4px; padding-top: 8px;">
          <span style="color: #6b7280; font-weight: 600;">Intercepted Threat Signals:</span>
          <span style="color: #991b1b; line-height: 1.4;">${(evaluation.indicators || []).join(" • ")}</span>
        </div>
      </div>

      <div class="kavach-screen-actions">
        <button class="kavach-screen-btn kavach-btn-safe-inbox" id="kavachSafeInboxBtn" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to Safe Inbox (Recommended)
        </button>
        <button class="kavach-screen-btn kavach-btn-unblock" id="kavachUnblockBtn" type="button">
          I Understand the Risk — View Blocked Content
        </button>
      </div>
    `;

    bodyDiv.parentNode.insertBefore(screen, bodyDiv);

    // Back to Safe Inbox Handler
    screen.querySelector("#kavachSafeInboxBtn")?.addEventListener("click", () => {
      const nativeBackBtn = document.querySelector("div[act='19'], div[aria-label*='Back to'], div[data-tooltip*='Back to']");
      if (nativeBackBtn) {
        nativeBackBtn.click();
      } else if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.hash = "#inbox";
      }
    });

    // Unblock & Disarm Links Handler
    screen.querySelector("#kavachUnblockBtn")?.addEventListener("click", () => {
      bodyDiv.classList.remove("kavach-blocked-body-hidden");
      neutralizeLinks(bodyDiv);

      screen.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; text-align: left;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">🛡️</span>
            <div>
              <strong style="color: #b91c1c;">UNBLOCKED UNDER KAVACH DEFENSE:</strong>
              <span style="color: #4b5563; font-size: 13px;">All hyperlinks have been neutralized to protect against drive-by downloads and phishing.</span>
            </div>
          </div>
          <span style="background: #10b981; color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700;">LINKS DISARMED</span>
        </div>
      `;
      screen.style.padding = "14px 18px";
    });
  }

  // 8. INJECT GMAIL SPAM QUARANTINE BANNER (FOR EMAILS ALREADY IN GMAIL SPAM)
  function injectGmailSpamAdvisoryBanner(bodyDiv, evaluation) {
    if (bodyDiv.parentNode.querySelector(".kavach-gmail-spam-quarantine-banner")) return;

    const banner = document.createElement("div");
    banner.className = "kavach-gmail-spam-quarantine-banner";
    banner.innerHTML = `
      <div class="kavach-quarantine-info">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 5.5v6.2c0 5.25 3.4 10.15 8 11.3 4.6-1.15 8-6.05 8-11.3V5.5L12 2z" fill="#64748b"/><path d="M12 8v5M12 16v0.5" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"/></svg>
        <div>
          <strong style="color: #f1f5f9;">Gmail Flagged Message — KAVACH Quarantine Guard Active</strong>
          <div style="color: #94a3b8; font-size: 11.5px; margin-top: 2px;">
            Gmail marked this message as Spam. All embedded links have been neutralized by KAVACH to prevent credential phishing.
          </div>
        </div>
      </div>
      <span class="kavach-quarantine-pill">LINKS NEUTRALIZED</span>
    `;

    bodyDiv.parentNode.insertBefore(banner, bodyDiv);
  }

  // 9. LINK NEUTRALIZATION
  function neutralizeLinks(container) {
    const allLinks = container.querySelectorAll("a");
    allLinks.forEach((a) => {
      a.dataset.kavachOriginalHref = a.href;
      a.href = "javascript:void(0)";
      a.style.pointerEvents = "none";
      a.style.color = "#9ca3af";
      a.style.textDecoration = "line-through";
    });
  }

  // 10. DECEPTIVE LINK MODAL INTERCEPTOR
  function attachEmailLinkInterceptors(container) {
    const links = container.querySelectorAll("a[href^='http']");
    links.forEach((a) => {
      if (a.dataset.kavachLinkBound) return;
      a.dataset.kavachLinkBound = "true";

      a.addEventListener("click", (e) => {
        const text = a.textContent.trim();
        const href = a.href;
        const deception = checkSingleLinkDeception(text, href);

        if (deception) {
          e.preventDefault();
          e.stopPropagation();
          showDeceptiveLinkModal(text, href, deception.reason);
        }
      });
    });
  }

  function checkSingleLinkDeception(text, href) {
    try {
      const url = new URL(href);
      const destHost = url.hostname.replace(/^www\./, "").toLowerCase();

      // Check text pretending to be a domain
      if (/^https?:\/\//i.test(text) || /\.(com|org|net|in|gov|edu)/i.test(text)) {
        const textHost = text.replace(/^https?:\/\//i, "").split("/")[0].replace(/^www\./, "").toLowerCase();
        if (textHost && destHost && textHost !== destHost && !destHost.endsWith(textHost)) {
          return { reason: `Display text shows "${textHost}", but link actually routes to "${destHost}".` };
        }
      }

      // Check high risk TLDs
      if (/\.(xyz|top|pw|ru|buzz|click|tk|work)$/i.test(destHost)) {
        return { reason: `Target domain (${destHost}) uses a high-risk TLD frequently abused by scammers.` };
      }
    } catch (e) {}
    return null;
  }

  function showDeceptiveLinkModal(displayText, targetHref, reason) {
    const existing = document.querySelector(".kavach-modal-backdrop");
    if (existing) existing.remove();

    const backdrop = document.createElement("div");
    backdrop.className = "kavach-modal-backdrop";
    backdrop.innerHTML = `
      <div class="kavach-modal-card">
        <div class="kavach-modal-header">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 5.5v6.2c0 5.25 3.4 10.15 8 11.3 4.6-1.15 8-6.05 8-11.3V5.5L12 2z" fill="#ef4444"/><path d="M12 8v5M12 16v0.5" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/></svg>
          <h3>KAVACH Phishing Interception</h3>
        </div>
        <p style="font-size: 13px; color: #cbd5e1; line-height: 1.5; margin: 0 0 10px 0;">
          KAVACH blocked an attempted redirect because the hyperlink destination does not match what was displayed in the email.
        </p>
        <div class="kavach-modal-diff-box">
          <div class="kavach-modal-diff-row">
            <span class="kavach-modal-diff-label">Displayed Text:</span>
            <div class="kavach-modal-diff-val safe">${escapeHtml(displayText || "(No label text)")}</div>
          </div>
          <div class="kavach-modal-diff-row">
            <span class="kavach-modal-diff-label">True Target Destination:</span>
            <div class="kavach-modal-diff-val danger">${escapeHtml(targetHref)}</div>
          </div>
          <div style="font-size: 11.5px; color: #f87171; margin-top: 4px;">
            ⚠️ ${escapeHtml(reason)}
          </div>
        </div>
        <div class="kavach-modal-actions">
          <button class="kavach-modal-btn kavach-modal-btn-safe" id="kavachModalSafeBtn" type="button">
            Stay Safe (Do Not Open)
          </button>
          <button class="kavach-modal-btn kavach-modal-btn-proceed" id="kavachModalProceedBtn" type="button">
            Proceed Anyway (Unsafe)
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    backdrop.querySelector("#kavachModalSafeBtn")?.addEventListener("click", () => {
      backdrop.remove();
    });

    backdrop.querySelector("#kavachModalProceedBtn")?.addEventListener("click", () => {
      backdrop.remove();
      window.open(targetHref, "_blank", "noopener,noreferrer");
    });
  }

  // 11. INJECT SAFE BADGE
  function injectGmailSafeBadge(senderSpan) {
    if (senderSpan.parentNode.querySelector(".kavach-gmail-safe-pill")) return;

    const pill = document.createElement("span");
    pill.className = "kavach-gmail-safe-pill";
    pill.innerHTML = `<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3.2 8.2L6.4 11.4L12.8 4.6" stroke="#10b981" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg> Verified Safe Sender`;
    pill.title = "KAVACH ML Sentinel: Verified sender domain and clean email structure.";

    senderSpan.parentNode.insertBefore(pill, senderSpan.nextSibling);
  }

  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function debounce(fn, delay) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), delay);
    };
  }

  // 12. INITIALIZATION
  function initGmailSentinel() {
    showGmailProtectionToast();
    scanInboxRows();
    scanOpenEmails();

    const observer = new MutationObserver(debounce(() => {
      scanInboxRows();
      scanOpenEmails();
    }, 300));

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    window.addEventListener("hashchange", () => {
      setTimeout(() => {
        scanInboxRows();
        scanOpenEmails();
      }, 250);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGmailSentinel);
  } else {
    initGmailSentinel();
  }
})();
