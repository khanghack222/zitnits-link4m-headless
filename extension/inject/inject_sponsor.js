/**
 * Zitnits Link4M Bypass Master - Injected into MAIN world of sponsor/advertiser sites
 * 1. Bypasses incognito/quota detection (detectIncognito / storage probe)
 * 2. Simulates human interactions (scroll, mousemove, visibility) so timers don't freeze
 * 3. Hooks fetch and XMLHttpRequest to capture verification code directly from network payloads
 */

(function () {
  if (window.__zitnits_sponsor_injected) return;
  window.__zitnits_sponsor_injected = true;

  console.log("%c[Zitnits Sponsor] Stealth Hooks & Anti-Freeze Loaded", "color: #00ffaa; font-weight: bold;");

  // --- 1. BYPASS INCOGNITO & STORAGE PROBES ---
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const origEstimate = navigator.storage.estimate.bind(navigator.storage);
      navigator.storage.estimate = async function () {
        try {
          const res = await origEstimate();
          return {
            quota: 120 * 1024 * 1024 * 1024, // 120 GB
            usage: res.usage || 1024 * 1024 * 50
          };
        } catch {
          return { quota: 120 * 1024 * 1024 * 1024, usage: 1024 * 1024 * 50 };
        }
      };
    }

    if (navigator.webkitTemporaryStorage && navigator.webkitTemporaryStorage.queryUsageAndQuota) {
      navigator.webkitTemporaryStorage.queryUsageAndQuota = function (cb, err) {
        if (typeof cb === "function") {
          cb(1024 * 1024 * 50, 120 * 1024 * 1024 * 1024);
        }
      };
    }
  } catch (e) {}

  // --- 2. PREVENT TIMER PAUSING ON TAB SWITCH ---
  try {
    Object.defineProperty(document, "hidden", { get: () => false, configurable: true });
    Object.defineProperty(document, "visibilityState", { get: () => "visible", configurable: true });
    Object.defineProperty(document, "webkitVisibilityState", { get: () => "visible", configurable: true });

    window.addEventListener("visibilitychange", (e) => e.stopImmediatePropagation(), true);
    window.addEventListener("webkitvisibilitychange", (e) => e.stopImmediatePropagation(), true);
    window.addEventListener("blur", (e) => e.stopImmediatePropagation(), true);
  } catch (e) {}

  // --- 3. PULSE SIMULATION (Scroll & Mouse to keep countdown running) ---
  setInterval(() => {
    try {
      window.dispatchEvent(new Event("scroll"));
      document.dispatchEvent(new Event("scroll"));
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 200 + Math.random() * 50, clientY: 300 + Math.random() * 50 }));
    } catch (e) {}
  }, 1800);

  // --- 4. NETWORK SNIFFER FOR CODES ---
  function dispatchFoundCode(code, source) {
    if (!code || typeof code !== "string") return;
    const clean = code.trim();
    // Codes are typically 4 to 12 alphanumeric characters
    if (/^[A-Za-z0-9]{4,12}$/.test(clean)) {
      console.log(`%c[Zitnits Sponsor] Intercepted Code via ${source}: [${clean}]`, "color: #00ffaa; font-weight: bold; font-size: 14px;");
      window.dispatchEvent(new CustomEvent("ZITNITS_SPONSOR_CODE", {
        detail: { code: clean, source: source }
      }));
    }
  }

  function parseTextForCode(text, url) {
    if (!text || typeof text !== "string") return;
    // Check JSON response for common keys
    try {
      if (text.startsWith("{") || text.startsWith("[")) {
        const obj = JSON.parse(text);
        const candidates = [obj.code, obj.pass, obj.password, obj.key, obj.token, obj.result, obj.data?.code, obj.data?.token];
        for (const c of candidates) {
          if (c && typeof c === "string" && /^[A-Za-z0-9]{4,12}$/.test(c.trim())) {
            dispatchFoundCode(c, "JSON-API: " + url);
            return;
          }
        }
      }
    } catch (e) {}

    // Regex match patterns like "Mã của bạn: UNexnj" or "code=UNexnj"
    const match = text.match(/(?:mã|code|pass|password|token)[\s:=_-]*([A-Za-z0-9]{5,10})/i);
    if (match && match[1]) {
      dispatchFoundCode(match[1], "REGEX-MATCH");
    }
  }

  // Hook Fetch
  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await origFetch.apply(this, args);
    try {
      const url = typeof args[0] === "string" ? args[0] : (args[0]?.url || "");
      if (url.includes("traffic") || url.includes("code") || url.includes("widget") || url.includes("what-on") || url.includes("service")) {
        const clone = response.clone();
        clone.text().then((txt) => parseTextForCode(txt, url)).catch(() => {});
      }
    } catch (e) {}
    return response;
  };

  // Hook XMLHttpRequest
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._zitnits_url = url;
    return origOpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener("load", function () {
      try {
        const url = this._zitnits_url || "";
        if (typeof url === "string" && (url.includes("traffic") || url.includes("code") || url.includes("widget") || url.includes("what-on") || url.includes("service"))) {
          parseTextForCode(this.responseText, url);
        }
      } catch (e) {}
    });
    return origSend.apply(this, args);
  };
})();
