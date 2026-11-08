/**
 * ⚡ LINK4M CONTENT SPONSOR AUTOMATION ⚡
 * Handles Step 1, Anti-AFK countdown, internal article navigation, and Step 2 code extraction.
 */

(function() {
  console.log('[Link4M Bypass] Sponsor script loaded on:', window.location.href);

  let hudPill = null;
  let isStep1Done = false;
  let isStep2Done = false;
  let codeExtracted = null;

  function createSponsorHUD() {
    if (document.getElementById('link4m-sponsor-hud')) return;
    if (!document.body) {
      setTimeout(createSponsorHUD, 100);
      return;
    }
    hudPill = document.createElement('div');
    hudPill.id = 'link4m-sponsor-hud';
    hudPill.innerHTML = `
      <div class="hud-pulse"></div>
      <div class="hud-title">LINK4M PROMAX:</div>
      <div class="hud-text" id="l4m-hud-status">Đang tìm nút Lấy Mã...</div>
    `;
    document.body.appendChild(hudPill);
  }

  function updateHUD(text) {
    const el = document.getElementById('l4m-hud-status');
    if (el) el.innerText = text;
  }

  // Intercept network responses for widget get_quest_code
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const resp = await originalFetch.apply(this, args);
    try {
      const url = args[0] ? (typeof args[0] === 'string' ? args[0] : args[0].url) : '';
      if (url && url.includes('get_quest_code')) {
        const clone = resp.clone();
        clone.json().then(data => handleQuestResponse(data)).catch(() => {});
      }
    } catch (e) {}
    return resp;
  };

  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url) {
    this._l4m_url = url;
    return originalXhrOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function() {
    this.addEventListener('load', function() {
      try {
        if (this._l4m_url && this._l4m_url.includes('get_quest_code')) {
          const data = JSON.parse(this.responseText);
          handleQuestResponse(data);
        }
      } catch (e) {}
    });
    return originalXhrSend.apply(this, arguments);
  };

  function handleQuestResponse(data) {
    if (!data || !data.success) return;

    // Step 1 network confirmed
    if (data.id && !isStep1Done) {
      isStep1Done = true;
      console.log('[Link4M Sponsor] Step 1 Network confirmed! ID:', data.id);
      updateHUD('✅ Bước 1 hoàn thành! Đang chuyển trang bài viết...');
      chrome.runtime.sendMessage({ type: 'SPONSOR_STEP1_COMPLETED' });

      // Navigate to internal article after 1.5s
      setTimeout(navigateToInternalArticle, 1500);
    }
    // Step 2 code confirmed
    else if (data.html) {
      const txt = String(data.html).trim();
      if (!txt.includes('Vui lòng') && !txt.includes('click') && txt.length > 0) {
        onCodeFound(txt);
      }
    }
  }

  function onCodeFound(code) {
    if (codeExtracted) return;
    codeExtracted = code;
    console.log('[Link4M Sponsor] 🎉 CODE EXTRACTED:', code);
    updateHUD(`🎉 Đã lấy mã: ${code}! Đang gửi về Link4M...`);

    // Copy to clipboard
    try {
      navigator.clipboard.writeText(code);
    } catch (e) {}

    chrome.runtime.sendMessage({
      type: 'SPONSOR_CODE_EXTRACTED',
      code: code
    });
  }

  // Find Step 1 or Step 2 button
  function findTrafficButton() {
    // 1. Direct IDs or classes
    const explicit = document.querySelector('#traffic-button, .whatoncode, button.whatoncode, #fC6by7 button, #traffic_button, [id*="traffic_"] button');
    if (explicit) return explicit;

    // 2. Query all buttons & links by text
    const candidates = Array.from(document.querySelectorAll('button, a, div[role="button"], span'));
    for (const el of candidates) {
      const text = (el.innerText || el.textContent || '').trim().toUpperCase();
      if (text.includes('LẤY MÃ') || text.includes('LAY MA') || text.includes('GET CODE') || text.includes('LẤY CODE') || text.includes('NHẬN MÃ')) {
        return el;
      }
    }
    return null;
  }

  // Find suitable internal article link on same origin
  function navigateToInternalArticle() {
    const curHost = window.location.hostname;
    const curPath = window.location.pathname;

    const links = Array.from(document.querySelectorAll('a[href]'));
    let bestLink = null;

    for (const a of links) {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) continue;

      try {
        const u = new URL(href, window.location.origin);
        if (u.hostname === curHost && u.pathname !== curPath && u.pathname.length > 3) {
          // Exclude contact / terms / policy pages
          if (!/lien-he|contact|chinh-sach|terms|privacy|gioi-thieu/i.test(u.pathname)) {
            bestLink = u.href;
            break;
          }
        }
      } catch (e) {}
    }

    if (bestLink) {
      console.log('[Link4M Sponsor] Navigating to subpage:', bestLink);
      window.location.href = bestLink;
    } else {
      console.log('[Link4M Sponsor] Reloading current page with hash for step 2...');
      window.location.hash = '#l4m-step2-' + Date.now();
      window.location.reload();
    }
  }

  // Monitor DOM text for countdown or code
  function monitorDOM() {
    const whaton = document.querySelector('.whatoncode, .whatoncode-wrapper, [class*="traffic"]');
    if (whaton) {
      const text = whaton.innerText || '';

      // Check code
      const m = text.match(/Mã\s*(?:KM)?:?\s*([A-Za-z0-9_\-]+)/i);
      if (m && m[1] && m[1].length >= 4) {
        onCodeFound(m[1].trim());
        return;
      }

      // Check step 1 completed in DOM
      if ((text.includes('click') || text.includes('bài viết')) && !isStep1Done) {
        isStep1Done = true;
        updateHUD('✅ Bước 1 xong! Đang chuyển bài viết...');
        setTimeout(navigateToInternalArticle, 1500);
        return;
      }

      // Check countdown progress
      const timerMatch = text.match(/(\d+)\s*s/i);
      if (timerMatch) {
        updateHUD(`⏳ Đang đếm ngược: ${timerMatch[1]}s...`);
        chrome.runtime.sendMessage({
          type: 'SPONSOR_STEP1_PROGRESS',
          text: `Đang đếm ngược: ${timerMatch[1]}s...`
        });
      }
    }
  }

  // Main automation loop
  function initAutomation() {
    createSponsorHUD();

    // Check if we are in Step 2 via localStorage
    let isStep2 = false;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.includes('_quest')) {
          const val = localStorage.getItem(k);
          if (val && val.includes('traffic_session')) {
            isStep2 = true;
            break;
          }
        }
      }
    } catch (e) {}

    if (isStep2) {
      updateHUD('⚡ [Bước 2/2] Đang tìm nút Bước 2 để lấy mã...');
    }

    let searchAttempts = 0;
    const interval = setInterval(() => {
      searchAttempts++;
      monitorDOM();

      const btn = findTrafficButton();
      if (btn && !btn.dataset.l4mClicked) {
        btn.dataset.l4mClicked = 'true';
        updateHUD('🚀 Đã tìm thấy nút Lấy Mã! Đang kích hoạt...');

        // Smooth scroll to button
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
          btn.click();
          console.log('[Link4M Sponsor] Clicked traffic button!');
          updateHUD('⏳ Đã nhấn Lấy Mã! Đang đếm ngược...');
        }, 800);
      }

      // If code found, stop loop
      if (codeExtracted) {
        clearInterval(interval);
      }

      // Stop after 250s timeout
      if (searchAttempts > 500) {
        clearInterval(interval);
      }
    }, 500);
  }

  // Wait for document ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutomation);
  } else {
    initAutomation();
  }
})();
