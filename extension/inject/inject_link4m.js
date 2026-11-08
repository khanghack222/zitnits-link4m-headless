/**
 * Zitnits Link4M Bypass Master - Injected into MAIN world of Link4M
 * 1. Intercepts XMLHttpRequest and Fetch calls to /links/get-link-info and form submissions
 * 2. Directly catches final destination URL from server response
 * 3. Removes ad blocking inhibitors and anti-devtools hooks
 */

(function () {
  if (window.__zitnits_link4m_injected) return;
  window.__zitnits_link4m_injected = true;

  console.log("%c[Zitnits Link4M] MAIN Hook Active", "color: #00e5ff; font-weight: bold;");

  function notifyDestinationUrl(url) {
    if (!url || typeof url !== "string") return;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      console.log(`%c[Zitnits Link4M] Destination Captured: ${url}`, "color: #00ffaa; font-weight: bold; font-size: 14px;");
      window.dispatchEvent(new CustomEvent("ZITNITS_DESTINATION_URL", {
        detail: { url: url }
      }));
    }
  }

  // Intercept fetch responses
  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await origFetch.apply(this, args);
    try {
      const url = typeof args[0] === "string" ? args[0] : (args[0]?.url || "");
      if (url.includes("/links/get-link-info") || url.includes("checkPassword") || url.includes("get-link")) {
        const clone = response.clone();
        clone.json().then((data) => {
          if (data && data.url) {
            notifyDestinationUrl(data.url);
          }
        }).catch(() => {});
      }
    } catch (e) {}
    return response;
  };

  // Intercept XHR responses
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._zitnits_request_url = url;
    return origOpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener("load", function () {
      try {
        const url = this._zitnits_request_url || "";
        if (typeof url === "string" && (url.includes("/links/get-link-info") || url.includes("checkPassword") || url.includes("get-link"))) {
          const data = JSON.parse(this.responseText);
          if (data && data.url) {
            notifyDestinationUrl(data.url);
          }
        }
      } catch (e) {}
    });
    return origSend.apply(this, args);
  };

  // Neutralize aggressive popups & window.open redirects from Link4M ads
  const origWindowOpen = window.open;
  window.open = function (url, name, specs) {
    if (typeof url === "string" && !url.includes("link4m.") && !url.includes("google.") && !url.includes("recaptcha")) {
      console.log("[Zitnits Link4M] Blocked ad popup window:", url);
      return null;
    }
    return origWindowOpen.call(this, url, name, specs);
  };
})();
