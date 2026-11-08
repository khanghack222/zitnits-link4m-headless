/**
 * ⚡ LINK4M AUTO BYPASS PROMAX - UNIFIED CONTENT ENGINE v3.0 ⚡
 * Handles both Sponsor Quest Mode (What-on/Gtraffic/Layma) & Direct Captcha Mode.
 * Fully wired to background worker with auto-fill and instant auto-redirect.
 */

(function() {
  'use strict';

  console.log('[Link4M ProMax] Engine loaded on:', window.location.href);

  // Database of known campaign domains
  const KNOWN_CAMPAIGNS = {
    "789club": "khovatlieunoithatdanang.com",
    "van phu pham da nang": "khovatlieunoithatdanang.com",
    "văn phòng phẩm đà nẵng": "khovatlieunoithatdanang.com",
    "h19": "memberqq.me",
    "luck8": "ayoslots.co",
    "keonhacai": "recsport.tv",
    "keo nha cai": "recsport.tv",
    "kèo nhà cái": "recsport.tv",
    "nohu": "aviator-slot.games",
    "nohu90": "aviator-slot.games",
    "ex88": "ex8898.com",
    "ao88": "d55slot.vip",
    "nh88": "preciouscollection.co.in",
    "mm88": "preciouscollection.co.in",
    "uy88": "santuy88slot.net",
    "hitclub": "hitclube.cc",
    "agobet": "agobet.cc"
  };

  let isRedirecting = false;
  let isSubmitted = false;
  let detectedDomain = null;
  let sponsorTabOpened = false;

  // 1. Inject Floating Modern HUD
  function injectHUD() {
    if (document.getElementById('l4m-promax-hud')) return;
    if (!document.body || !document.head) {
      setTimeout(injectHUD, 80);
      return;
    }

    const style = document.createElement('style');
    style.textContent = `
      #l4m-promax-hud {
        position: fixed !important;
        top: 14px !important;
        right: 14px !important;
        z-index: 2147483647 !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 6px !important;
        min-width: 280px !important;
        max-width: 360px !important;
        padding: 12px 16px !important;
        background: rgba(15, 23, 42, 0.96) !important;
        backdrop-filter: blur(14px) !important;
        border: 1px solid #00f0ff !important;
        border-radius: 12px !important;
        box-shadow: 0 8px 30px rgba(0, 240, 255, 0.35) !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
        color: #ffffff !important;
        font-size: 13px !important;
        pointer-events: auto !important;
        transition: all 0.3s ease !important;
      }
      .l4m-header {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        font-weight: 800 !important;
        color: #00f0ff !important;
        font-size: 13px !important;
        border-bottom: 1px solid rgba(255,255,255,0.1) !important;
        padding-bottom: 6px !important;
      }
      .l4m-status {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        font-weight: 600 !important;
        font-size: 13px !important;
        color: #f1f5f9 !important;
      }
      .l4m-sub {
        font-size: 11px !important;
        color: #94a3b8 !important;
      }
      .l4m-action-btn {
        margin-top: 4px !important;
        background: linear-gradient(135deg, #00f0ff, #0284c7) !important;
        color: #0f172a !important;
        border: none !important;
        border-radius: 6px !important;
        padding: 6px 12px !important;
        font-weight: 700 !important;
        font-size: 12px !important;
        cursor: pointer !important;
        text-align: center !important;
        transition: all 0.2s ease !important;
      }
      .l4m-action-btn:hover {
        filter: brightness(1.15) !important;
        transform: translateY(-1px) !important;
      }
      .l4m-captcha-glow {
        outline: 3px solid #00f0ff !important;
        box-shadow: 0 0 25px rgba(0, 240, 255, 0.7) !important;
        border-radius: 8px !important;
        animation: l4m-pulse 1.5s infinite !important;
      }
      @keyframes l4m-pulse {
        0%, 100% { box-shadow: 0 0 15px rgba(0, 240, 255, 0.5); }
        50% { box-shadow: 0 0 30px rgba(0, 240, 255, 0.9); }
      }
    `;
    document.head.appendChild(style);

    const hud = document.createElement('div');
    hud.id = 'l4m-promax-hud';
    hud.innerHTML = `
      <div class="l4m-header">
        <span>⚡ LINK4M PROMAX</span>
        <span style="font-size: 11px; color: #4ade80;">v3.0</span>
      </div>
      <div class="l4m-status">
        <span id="l4m-hud-icon">🔍</span>
        <span id="l4m-hud-msg">Đang quét nhiệm vụ...</span>
      </div>
      <div class="l4m-sub" id="l4m-hud-sub">Tự động nhận diện tài trợ & vượt link</div>
      <button id="l4m-hud-btn" class="l4m-action-btn" style="display: none;"></button>
    `;
    document.body.appendChild(hud);
  }

  function setHUD(msg, sub = '', color = '#00f0ff', icon = '⚡') {
    injectHUD();
    const msgEl = document.getElementById('l4m-hud-msg');
    const subEl = document.getElementById('l4m-hud-sub');
    const iconEl = document.getElementById('l4m-hud-icon');
    if (msgEl) {
      msgEl.innerText = msg;
      msgEl.style.color = color;
    }
    if (subEl && sub) subEl.innerText = sub;
    if (iconEl && icon) iconEl.innerText = icon;
  }

  function showActionBtn(text, onClick) {
    const btn = document.getElementById('l4m-hud-btn');
    if (btn) {
      btn.innerText = text;
      btn.style.display = 'block';
      btn.onclick = onClick;
    }
  }

  // 2. Destination Redirect
  function onDestination(url) {
    if (isRedirecting) return;
    isRedirecting = true;
    console.log('[Link4M ProMax] 🎉 DESTINATION DETECTED:', url);
    setHUD('🎉 ĐÃ CÓ LINK ĐÍCH!', 'Đang chuyển hướng ngay...', '#4ade80', '🚀');
    setTimeout(() => {
      window.location.href = url;
    }, 250);
  }

  // 3. Listen for Messages from Background Worker
  try {
    chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
      if (req.type === 'FILL_CODE_AND_SUBMIT') {
        const code = req.code;
        console.log('[Link4M ProMax] Received extracted code:', code);
        fillCode(code);
        sendResponse({ ok: true });
      } else if (req.type === 'STATUS_UPDATE') {
        if (req.detail) {
          setHUD(req.detail, 'Tiến trình nhà tài trợ đang chạy ngầm...', '#38bdf8', '⏳');
        }
        sendResponse({ ok: true });
      }
    });
  } catch (e) {}

  // 4. Fill Code & Highlight Captcha
  function fillCode(code) {
    const inputs = document.querySelectorAll("input[name='password'], #password-2, #password, .password");
    inputs.forEach(inp => {
      inp.value = code;
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    });

    setHUD(`🎉 ĐÃ ĐIỀN MÃ: ${code}`, '👉 Hãy tick vào ô reCAPTCHA bên dưới để hoàn tất!', '#4ade80', '✅');

    const rc = document.querySelector('#recaptcha, .g-recaptcha, iframe[src*="recaptcha"], [id*="recaptcha"]');
    if (rc) {
      rc.classList.add('l4m-captcha-glow');
      rc.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // 5. Unmask Sponsor Quest & Domains
  function scanSponsorQuest() {
    const pageText = document.body ? document.body.innerText : '';

    // A. Check known keyword patterns
    for (const [kw, dom] of Object.entries(KNOWN_CAMPAIGNS)) {
      if (pageText.toLowerCase().includes(kw.toLowerCase())) {
        return { keyword: kw, domain: dom, url: `https://${dom}` };
      }
    }

    // B. Check regex for Step 2 keyword
    const kwMatch = pageText.match(/(?:Gõ tìm từ khóa|tìm từ khóa|từ khóa:?)\s*([A-Za-z0-9_\-\s]{3,30})/i);
    if (kwMatch && kwMatch[1]) {
      const kw = kwMatch[1].trim();
      const cleaned = kw.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const [k, d] of Object.entries(KNOWN_CAMPAIGNS)) {
        if (cleaned.includes(k.replace(/[^a-z0-9]/g, ''))) {
          return { keyword: kw, domain: d, url: `https://${d}` };
        }
      }
      return { keyword: kw, domain: null, url: `https://www.google.com/search?q=${encodeURIComponent(kw)}` };
    }

    // C. Check regex for masked domain
    const domMatch = pageText.match(/([a-zA-Z0-9\-]{3,})\.(?:co|c)\*+\.([a-zA-Z]{2,4})/i) ||
                     pageText.match(/([a-zA-Z0-9\-]{3,})\.(?:co|c)\*+(?![a-zA-Z0-9])/i) ||
                     pageText.match(/([a-zA-Z0-9\-]{3,}\.(?:com|net|org|vn|co|vip|games|cc|me))/i);
    if (domMatch && domMatch[1]) {
      const d = domMatch[1].toLowerCase().replace(/\*+/g, 'm');
      const fullDom = d.includes('.') ? d : `${d}.com`;
      if (!fullDom.includes('link4m') && !fullDom.includes('google')) {
        return { keyword: fullDom, domain: fullDom, url: `https://${fullDom}` };
      }
    }

    return null;
  }

  // 6. Submit Link4M Form & Trigger API
  function triggerSubmission() {
    if (isSubmitted) return;
    isSubmitted = true;
    setHUD('Đang lấy link đích từ server...', 'Vui lòng chờ...', '#38bdf8', '⏳');

    const form = document.querySelector('#main-form, #main-form-2');
    let codeVal = '';
    const passInput = document.querySelector("input[name='password'], #password-2, #password, .password");
    if (passInput) codeVal = passInput.value;

    let validToken = '';
    document.querySelectorAll('[name="g-recaptcha-response"], [name="cf-turnstile-response"]').forEach(el => {
      if (el.value && el.value.length > 20) validToken = el.value;
    });

    // Try direct fetch to /links/get-link-info
    try {
      if (form) {
        const formData = new FormData(form);
        if (codeVal) formData.set('password', codeVal);
        if (validToken) formData.set('g-recaptcha-response', validToken);

        const params = new URLSearchParams(formData).toString();
        const apiDomain = window.api_domain || 'https://s1.link4m.app';

        fetch(`${apiDomain}/links/get-link-info`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: params
        }).then(r => r.json()).then(res => {
          if (res && res.success && res.url) {
            onDestination(res.url);
          }
        }).catch(() => {});

        // Also try check-captcha
        fetch(`${apiDomain}/links/check-captcha`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: params
        }).then(r => r.json()).then(res => {
          if (res && res.success && res.url) {
            onDestination(res.url);
          }
        }).catch(() => {});
      }
    } catch (e) {}

    // Click submit buttons
    if (form) {
      const sBtn = form.querySelector('button[type="submit"], input[type="submit"], #btn-main, .get-link');
      if (sBtn) sBtn.click();
    }
  }

  // 7. Core Watcher Loop
  function startWatcher() {
    injectHUD();

    // Clean up popups
    document.querySelectorAll('#ad_banner, .modal-backdrop, [class*="overlay"]').forEach(el => el.remove());

    // Register with background
    try {
      chrome.runtime.sendMessage({ type: 'LINK4M_STARTED' });
    } catch (e) {}

    // Check stored code if already solved
    try {
      chrome.storage.local.get(['l4m_quest_code'], function(res) {
        if (res && res.l4m_quest_code) {
          fillCode(res.l4m_quest_code);
          chrome.storage.local.remove(['l4m_quest_code']);
        }
      });
    } catch (e) {}

    let scanAttempts = 0;
    const watcher = setInterval(() => {
      if (isRedirecting) {
        clearInterval(watcher);
        return;
      }

      // Check window.destination_url
      if (window.destination_url && window.destination_url.startsWith('http') && !window.destination_url.includes('link4m')) {
        onDestination(window.destination_url);
        return;
      }

      // Check .get-link href
      const btns = document.querySelectorAll('.get-link, a#get-link, a[href*="download"], #btn-get-link, .btn-success');
      btns.forEach(btn => {
        const href = btn.getAttribute('href') || '';
        if (href.startsWith('http') && !href.includes('link4m') && !href.includes('about:blank')) {
          onDestination(href);
          return;
        }
        if (!btn.classList.contains('disabled') && !btn.hasAttribute('disabled')) {
          btn.click();
        }
      });

      // Check if reCAPTCHA token is solved
      let hasToken = false;
      document.querySelectorAll('[name="g-recaptcha-response"], [name="cf-turnstile-response"]').forEach(el => {
        if (el.value && el.value.length > 20) hasToken = true;
      });

      if (hasToken && !isSubmitted) {
        triggerSubmission();
      }

      // Detect Sponsor Quest vs Direct Mode
      scanAttempts++;
      if (!detectedDomain && scanAttempts < 30) {
        const quest = scanSponsorQuest();
        if (quest) {
          detectedDomain = quest.domain || quest.keyword;
          setHUD(`Nhiệm vụ: ${quest.keyword}`, 'Đang mở tab nhà tài trợ để tự động lấy mã...', '#c084fc', '🎯');

          if (!sponsorTabOpened) {
            sponsorTabOpened = true;
            showActionBtn(`🌐 Mở tab tài trợ ngay (${quest.keyword})`, () => {
              chrome.runtime.sendMessage({
                type: 'OPEN_SPONSOR_TAB',
                domain: quest.domain,
                url: quest.url
              });
            });

            // Auto-open after 2s
            setTimeout(() => {
              chrome.runtime.sendMessage({
                type: 'OPEN_SPONSOR_TAB',
                domain: quest.domain,
                url: quest.url
              });
            }, 2000);
          }
        } else {
          const hasPassword = document.querySelector("input[name='password'], #password-2, #password, .password");
          if (!hasPassword && scanAttempts > 6) {
            setHUD('Chế độ Direct (Không có nhiệm vụ)', 'Hãy tick vào ô reCAPTCHA bên dưới để mở link!', '#fb923c', '⚡');
            const rc = document.querySelector('#recaptcha, .g-recaptcha, iframe[src*="recaptcha"]');
            if (rc) rc.classList.add('l4m-captcha-glow');
          }
        }
      }
    }, 400);
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startWatcher);
  } else {
    startWatcher();
  }

})();
