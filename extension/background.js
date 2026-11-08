/**
 * Zitnits Link4M Bypass Master - Service Worker Background
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log("[Zitnits] Extension installed and ready.");
  // Initialize default options
  chrome.storage.local.get(
    [
      "autoFillCode",
      "autoSubmitOnCaptcha",
      "autoRedirect",
      "blockAds",
      "pulseScroll",
      "bypassedHistory",
      "last_sponsor_code"
    ],
    (result) => {
      chrome.storage.local.set({
        autoFillCode: result.autoFillCode ?? true,
        autoSubmitOnCaptcha: result.autoSubmitOnCaptcha ?? true,
        autoRedirect: result.autoRedirect ?? true,
        blockAds: result.blockAds ?? true,
        pulseScroll: result.pulseScroll ?? true,
        bypassedHistory: result.bypassedHistory || [],
        last_sponsor_code: result.last_sponsor_code || ""
      });
    }
  );
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SPONSOR_CODE_FOUND") {
    const code = message.code;
    const domain = message.domain || (sender.tab ? new URL(sender.tab.url).hostname : "");
    console.log(`[Zitnits] Captured Sponsor Code: ${code} from ${domain}`);

    chrome.storage.local.set({
      last_sponsor_code: code,
      last_code_timestamp: Date.now(),
      last_code_domain: domain
    });

    // Notify user via Chrome notification if available
    try {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "Zitnits Link4M: Đã lấy mã nhiệm vụ!",
        message: `Mã [${code}] đã được sao chép và tự động nạp cho Link4M!`,
        priority: 2
      });
    } catch (e) {
      // Ignore if notifications blocked
    }

    // Set badge text
    if (sender.tab && sender.tab.id) {
      chrome.action.setBadgeText({ text: "CODE", tabId: sender.tab.id });
      chrome.action.setBadgeBackgroundColor({ color: "#00ffaa", tabId: sender.tab.id });
    }

    sendResponse({ success: true });
    return true;
  }

  if (message.type === "DESTINATION_UNLOCKED") {
    const destUrl = message.url;
    const sourceUrl = message.sourceUrl || (sender.tab ? sender.tab.url : "");
    console.log(`[Zitnits] Destination URL Unlocked: ${destUrl}`);

    chrome.storage.local.get(["bypassedHistory", "autoRedirect"], (data) => {
      const history = data.bypassedHistory || [];
      history.unshift({
        destUrl,
        sourceUrl,
        timestamp: Date.now()
      });
      // Keep last 30 entries
      if (history.length > 30) history.pop();

      chrome.storage.local.set({ bypassedHistory: history });

      if (data.autoRedirect !== false && sender.tab && sender.tab.id) {
        chrome.tabs.update(sender.tab.id, { url: destUrl });
      }
    });

    sendResponse({ success: true });
    return true;
  }

  if (message.type === "GET_LATEST_CODE") {
    chrome.storage.local.get(["last_sponsor_code", "last_code_timestamp"], (data) => {
      sendResponse({
        code: data.last_sponsor_code || "",
        timestamp: data.last_code_timestamp || 0
      });
    });
    return true;
  }
});
