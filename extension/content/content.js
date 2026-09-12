chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "KAVACH_WARNING") {
    showKavachWarningBanner(message);
  }
});

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
        <span>This website exhibits high-risk phishing or malicious indicators (${data.risk_score}/100).</span>
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
