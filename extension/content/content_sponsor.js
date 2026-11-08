/**
 * Zitnits Link4M Bypass Master - Content Script for Sponsor/Advertiser Sites
 * Runs on <all_urls> at document_start:
 * 1. Injects inject_sponsor.js into MAIN execution context.
 * 2. Monitors the DOM for quest widgets (buttons like 'LẤY MÃ', countdown timers, and generated codes).
 * 3. Auto-clicks buttons to trigger countdown if not already triggered.
 * 4. Extracts the final code, sends it to background.js, and copies it to clipboard.
 */

(function () {
  // Ignore Link4M itself (Link4M has its own specialized content script)
  const host = window.location.hostname;
  if (host.includes("link4m.") || host.includes("link1s.")) return;

  // 1. Inject MAIN world script
  try {
    const s = document.createElement("script");
    s.src = chrome.runtime.getURL("inject/inject_sponsor.js");
    s.onload = function () {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(s);
  } catch (e) {
    console.warn("[Zitnits Sponsor] Could not inject MAIN script:", e);
  }

  let capturedCode = null;

  function reportCode(code, source) {
    if (!code || capturedCode === code) return;
    const clean = code.trim();
    if (!/^[A-Za-z0-9]{4,12}$/.test(clean)) return;

    capturedCode = clean;
    console.log(`[Zitnits Sponsor Content] FOUND CODE: [${clean}] (via ${source})`);

    // Copy to clipboard
    try {
      navigator.clipboard.writeText(clean).catch(() => {});
    } catch (e) {}

    // Send to background service worker
    chrome.runtime.sendMessage({
      type: "SPONSOR_CODE_FOUND",
      code: clean,
      domain: window.location.hostname,
      source: source
    });

    // Display inline cyber toast
    showToast(clean);
  }

  // Listen for events from injected MAIN script
  window.addEventListener("ZITNITS_SPONSOR_CODE", (evt) => {
    if (evt.detail && evt.detail.code) {
      reportCode(evt.detail.code, evt.detail.source || "DOM-EVENT");
    }
  });

  // 2. Scan DOM for countdown buttons or codes
  function scanDOM() {
    if (capturedCode) return;

    // Scan for code elements with specific classes or IDs
    const codeSelectors = [
      ".whatoncode",
      "#whatoncode",
      ".traffic-code",
      "#traffic-code",
      "[id*='traffic_code']",
      "[class*='traffic_code']",
      "[id*='layma_code']",
      "[class*='code-value']",
      ".layma_code",
      "#layma_code"
    ];

    for (const sel of codeSelectors) {
      const els = document.querySelectorAll(sel);
      for (const el of els) {
        const txt = el.innerText || el.textContent || el.value;
        if (txt) {
          const match = txt.match(/([A-Za-z0-9]{5,10})/);
          if (match && match[1] && !/waiting|giay|second|loading|cho/i.test(match[1])) {
            reportCode(match[1], "DOM-SELECTOR: " + sel);
            return;
          }
        }
      }
    }

    // Scan for "LẤY MÃ" or "GET CODE" buttons and trigger them if not clicked
    const buttons = document.querySelectorAll("button, a, div[onclick], span[onclick], input[type='button']");
    for (const b of buttons) {
      const txt = (b.innerText || b.textContent || b.value || "").trim().toLowerCase();
      if ((txt.includes("lấy mã") || txt.includes("lay ma") || txt.includes("get code") || txt.includes("bấm để lấy")) && !b.__zitnits_clicked) {
        b.__zitnits_clicked = true;
        console.log("[Zitnits Sponsor] Auto-clicking mission button:", b);
        try {
          b.click();
        } catch (e) {}
      }
    }
  }

  // Toast UI notification in sponsor page
  function showToast(code) {
    try {
      const toast = document.createElement("div");
      toast.id = "zitnits-sponsor-toast";
      toast.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:20px;">⚡</span>
          <div>
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:1px; opacity:0.8;">Zitnits Link4M Bypass</div>
            <div style="font-size:15px; font-weight:bold; color:#00ffaa;">Đã lấy mã: <span style="background:#003322; padding:2px 8px; border-radius:4px; border:1px solid #00ffaa;">${code}</span></div>
          </div>
        </div>
      `;
      Object.assign(toast.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: "2147483647",
        background: "rgba(10, 15, 25, 0.95)",
        color: "#fff",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "12px 18px",
        borderRadius: "8px",
        border: "1px solid #00ffaa",
        boxShadow: "0 0 20px rgba(0, 255, 170, 0.4)",
        transition: "all 0.3s ease"
      });
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 7000);
    } catch (e) {}
  }

  // Periodically scan DOM
  const intervalId = setInterval(scanDOM, 800);
  window.addEventListener("DOMContentLoaded", scanDOM);
  window.addEventListener("load", scanDOM);

  // Stop scanning after 3 minutes
  setTimeout(() => clearInterval(intervalId), 180000);
})();
