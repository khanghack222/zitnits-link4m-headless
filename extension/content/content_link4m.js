/**
 * Zitnits Link4M Bypass Master - Content Script for Link4M Domains (/go/*)
 * 1. Injects inject_link4m.js to intercept final destination URLs.
 * 2. Mounts Cyber HUD overlay.
 * 3. Retrieves sponsor code from background storage and auto-fills.
 * 4. Cleans obstructive modals and backdrops.
 * 5. Watches for user Captcha solving:
 *    - Immediately triggers form submission / checkPassword()
 *    - Captures destination URL from XHR/Fetch response /links/get-link-info
 *    - NEVER clicks generic links to prevent redirecting to link4m.com!
 */

(function () {
  const path = window.location.pathname;
  if (!path.includes("/go/")) return;

  console.log("%c[Zitnits Link4M] Initialized on Gateway /go/", "color: #00f0ff; font-weight: bold;");

  // 1. Injected MAIN script
  try {
    const s = document.createElement("script");
    s.src = chrome.runtime.getURL("inject/inject_link4m.js");
    s.onload = function () { this.remove(); };
    (document.head || document.documentElement).appendChild(s);
  } catch (e) {}

  let hudEls = { code: null, status: null, dot: null };
  let isSubmitted = false;
  let activeCode = "";

  function mountHUD() {
    if (document.getElementById("zitnits-hud-container")) return;

    const hud = document.createElement("div");
    hud.id = "zitnits-hud-container";
    hud.innerHTML = `
      <div class="zitnits-hud-header">
        <div class="zitnits-hud-title"><span>⚡</span> Zitnits Bypass Master</div>
        <span class="zitnits-hud-badge">V4 HEADLESS</span>
      </div>
      <div class="zitnits-hud-body">
        <div class="zitnits-hud-row">
          <span class="zitnits-label">Mã nhiệm vụ</span>
          <span class="zitnits-value" id="zitnits-hud-code">Chờ mã...</span>
        </div>
        <div class="zitnits-status-box">
          <div class="zitnits-pulse-dot" id="zitnits-hud-dot"></div>
          <span id="zitnits-hud-status">Đang đợi mã nhiệm vụ...</span>
        </div>
      </div>
      <div class="zitnits-hud-footer">
        Bạn chỉ cần giải Captcha — Mọi thao tác còn lại tự động 100%!
      </div>
    `;
    document.body.appendChild(hud);
    hudEls.code = document.getElementById("zitnits-hud-code");
    hudEls.status = document.getElementById("zitnits-hud-status");
    hudEls.dot = document.getElementById("zitnits-hud-dot");
  }

  function updateHUD(status, code, dotState) {
    if (hudEls.status && status) hudEls.status.textContent = status;
    if (hudEls.code && code) hudEls.code.textContent = code;
    if (hudEls.dot && dotState) hudEls.dot.className = "zitnits-pulse-dot " + dotState;
  }

  function fillCode(code) {
    if (!code) return false;
    activeCode = code;
    const inputs = document.querySelectorAll(
      'input#password-2, input#password, input[name="password"], input[type="password"]'
    );
    let filled = false;
    for (const inp of inputs) {
      if (inp.value !== code) {
        inp.value = code;
        inp.dispatchEvent(new Event("input", { bubbles: true }));
        inp.dispatchEvent(new Event("change", { bubbles: true }));
        filled = true;
      }
    }
    if (filled) {
      updateHUD("Đã nạp mã: [" + code + "]. Chờ giải Captcha...", code, "solving");
    }
    return filled;
  }

  function syncCode() {
    chrome.runtime.sendMessage({ type: "GET_LATEST_CODE" }, (res) => {
      if (res && res.code) fillCode(res.code);
    });
    chrome.storage.local.get(["last_sponsor_code"], (data) => {
      if (data && data.last_sponsor_code) fillCode(data.last_sponsor_code);
    });
  }

  function isCaptchaSolved() {
    const recaptchaResponses = document.querySelectorAll('[name="g-recaptcha-response"]');
    for (const el of recaptchaResponses) {
      if (el.value && el.value.trim().length > 20) return true;
    }
    const recaptchaAnchor = document.querySelector("#recaptcha-anchor, .recaptcha-checkbox-checked");
    if (recaptchaAnchor && (recaptchaAnchor.getAttribute("aria-checked") === "true" || recaptchaAnchor.classList.contains("recaptcha-checkbox-checked"))) {
      return true;
    }
    const cfTokens = document.querySelectorAll('[name="cf-turnstile-response"]');
    for (const el of cfTokens) {
      if (el.value && el.value.trim().length > 20) return true;
    }
    return false;
  }

  function submitStep() {
    if (isSubmitted) return;

    if (isCaptchaSolved()) {
      isSubmitted = true;
      console.log("[Zitnits Link4M] Captcha Solved! Submitting...");
      updateHUD("Captcha xong! Đang mở khóa link...", activeCode, "ready");

      if (activeCode) fillCode(activeCode);

      try {
        if (typeof window.checkPassword === "function") window.checkPassword();
      } catch (e) {}

      // Click specific submit buttons only (NEVER touch anchor tags with href)
      const submitButtons = [
        document.querySelector("button#submit-form"),
        document.querySelector("button.get-link"),
        document.querySelector("#btn-main"),
        document.querySelector("form#main-form-2 button[type='submit']")
      ];
      for (const btn of submitButtons) {
        if (btn && btn.offsetParent !== null) {
          try { btn.click(); } catch (e) {}
        }
      }

      // Check a.get-link ONLY if it has a valid destination URL (exclude link4m.com)
      let attempts = 0;
      const pollId = setInterval(() => {
        attempts++;
        const targetBtn = document.querySelector("a.get-link:not(.disabled)");
        if (targetBtn) {
          const href = targetBtn.getAttribute("href");
          if (href && href !== "#" && !href.startsWith("javascript:") && !href.includes("link4m.com") && href.startsWith("http")) {
            clearInterval(pollId);
            handleFinalDestination(href);
            return;
          }
        }
        if (attempts > 25) clearInterval(pollId);
      }, 500);
    }
  }

  function handleFinalDestination(destUrl) {
    if (!destUrl || destUrl.includes("link4m.com")) return;
    updateHUD("Đã mở khóa! Đang chuyển hướng...", activeCode, "ready");
    chrome.runtime.sendMessage({
      type: "DESTINATION_UNLOCKED",
      url: destUrl,
      sourceUrl: window.location.href
    });
    setTimeout(() => { window.location.href = destUrl; }, 600);
  }

  window.addEventListener("ZITNITS_DESTINATION_URL", (evt) => {
    if (evt.detail && evt.detail.url) {
      handleFinalDestination(evt.detail.url);
    }
  });

  function cleanModals() {
    const overlays = document.querySelectorAll(".modal-backdrop, div[style*='z-index: 2147483640']");
    for (const ov of overlays) ov.remove();
    document.body.style.overflow = "auto";
  }

  function cycle() {
    cleanModals();
    syncCode();
    submitStep();
  }

  window.addEventListener("DOMContentLoaded", () => {
    mountHUD();
    syncCode();
  });
  window.addEventListener("load", () => {
    mountHUD();
    syncCode();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.last_sponsor_code) {
      if (changes.last_sponsor_code.newValue) fillCode(changes.last_sponsor_code.newValue);
    }
  });

  setInterval(cycle, 350);
})();
