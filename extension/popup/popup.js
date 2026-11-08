/**
 * Zitnits Link4M Bypass Master - Popup Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const currentCodeInput = document.getElementById("currentCodeInput");
  const copyCodeBtn = document.getElementById("copyCodeBtn");
  const manualCodeInput = document.getElementById("manualCodeInput");
  const saveManualCodeBtn = document.getElementById("saveManualCodeBtn");

  const autoFillToggle = document.getElementById("autoFillToggle");
  const autoSubmitToggle = document.getElementById("autoSubmitToggle");
  const autoRedirectToggle = document.getElementById("autoRedirectToggle");
  const blockAdsToggle = document.getElementById("blockAdsToggle");

  const historyList = document.getElementById("historyList");
  const clearHistoryBtn = document.getElementById("clearHistoryBtn");

  // Load Initial Settings & Code
  chrome.storage.local.get(
    [
      "last_sponsor_code",
      "autoFillCode",
      "autoSubmitOnCaptcha",
      "autoRedirect",
      "blockAds",
      "bypassedHistory"
    ],
    (data) => {
      if (data.last_sponsor_code) {
        currentCodeInput.value = data.last_sponsor_code;
      }

      autoFillToggle.checked = data.autoFillCode !== false;
      autoSubmitToggle.checked = data.autoSubmitOnCaptcha !== false;
      autoRedirectToggle.checked = data.autoRedirect !== false;
      blockAdsToggle.checked = data.blockAds !== false;

      renderHistory(data.bypassedHistory || []);
    }
  );

  // Copy code to clipboard
  copyCodeBtn.addEventListener("click", () => {
    const code = currentCodeInput.value;
    if (code && code !== "Chưa có mã...") {
      navigator.clipboard.writeText(code).then(() => {
        copyCodeBtn.style.color = "#00ffaa";
        setTimeout(() => {
          copyCodeBtn.style.color = "";
        }, 1200);
      });
    }
  });

  // Save manual code
  saveManualCodeBtn.addEventListener("click", () => {
    const code = manualCodeInput.value.trim();
    if (code) {
      chrome.storage.local.set({
        last_sponsor_code: code,
        last_code_timestamp: Date.now()
      }, () => {
        currentCodeInput.value = code;
        manualCodeInput.value = "";
        saveManualCodeBtn.textContent = "Đã lưu!";
        setTimeout(() => {
          saveManualCodeBtn.textContent = "Lưu & Nạp";
        }, 1200);
      });
    }
  });

  // Toggle handlers
  autoFillToggle.addEventListener("change", (e) => {
    chrome.storage.local.set({ autoFillCode: e.target.checked });
  });

  autoSubmitToggle.addEventListener("change", (e) => {
    chrome.storage.local.set({ autoSubmitOnCaptcha: e.target.checked });
  });

  autoRedirectToggle.addEventListener("change", (e) => {
    chrome.storage.local.set({ autoRedirect: e.target.checked });
  });

  blockAdsToggle.addEventListener("change", (e) => {
    chrome.storage.local.set({ blockAds: e.target.checked });
  });

  // Clear history
  clearHistoryBtn.addEventListener("click", () => {
    chrome.storage.local.set({ bypassedHistory: [] }, () => {
      renderHistory([]);
    });
  });

  // Render history entries
  function renderHistory(items) {
    historyList.innerHTML = "";
    if (!items || items.length === 0) {
      historyList.innerHTML = '<div class="empty-state">Chưa có link nào được mở khóa</div>';
      return;
    }

    items.forEach((item) => {
      const div = document.createElement("div");
      div.className = "history-item";

      const a = document.createElement("a");
      a.className = "history-url";
      a.href = item.destUrl;
      a.target = "_blank";
      a.textContent = item.destUrl;

      const time = document.createElement("span");
      time.className = "history-time";
      const d = new Date(item.timestamp);
      time.textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")} - ${d.toLocaleDateString()}`;

      div.appendChild(a);
      div.appendChild(time);
      historyList.appendChild(div);
    });
  }
});
