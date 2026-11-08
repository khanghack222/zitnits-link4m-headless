// ==UserScript==
// @name         Zitnits Link4M Headless API Timer & Auto-Bypass
// @namespace    https://github.com/khanghack222/zitnits-link4m-headless
// @version      4.0.0
// @description  Bypass Link4M hoàn hảo: Chạy ngầm timer What-On bằng API thuần không cần render, tự động nạp mã, tự động nhận link đích ngay khi giải captcha.
// @author       Zitnits
// @match        *://*.link4m.net/*
// @match        *://*.link4m.co/*
// @match        *://*.link4m.app/*
// @match        *://*.link1s.com/*
// @match        *://*.link1s.net/*
// @match        *://*/*
// @connect      s1.what-on.com
// @connect      what-on.com
// @connect      s1.link4m.app
// @connect      link4m.net
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_setClipboard
// @grant        GM_notification
// @grant        unsafeWindow
// @run-at       document-start
// @downloadURL  https://raw.githubusercontent.com/khanghack222/zitnits-link4m-headless/main/zitnits_headless.user.js
// @updateURL    https://raw.githubusercontent.com/khanghack222/zitnits-link4m-headless/main/zitnits_headless.user.js
// ==/UserScript==

(function () {
  'use strict';

  const host = window.location.hostname;
  const pathname = window.location.pathname;
  const isLink4M = (host.includes('link4m.') || host.includes('link1s.')) && pathname.includes('/go/');

  /* =========================================================================
   * MODULE 1: LINK4M GATEWAY PAGE (/go/*)
   * ========================================================================= */
  if (isLink4M) {
    console.log('%c[Zitnits Headless] Engine Active on Link4M Gateway', 'color: #00f0ff; font-weight: bold;');

    // 1. Hook XMLHttpRequest & Fetch để bắt chính xác Link Đích (KHÔNG BAO GIỜ bị redirect nhầm sang link4m.com)
    (function hookDestination() {
      const origOpen = XMLHttpRequest.prototype.open;
      const origSend = XMLHttpRequest.prototype.send;

      XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        this._req_url = url;
        return origOpen.call(this, method, url, ...rest);
      };

      XMLHttpRequest.prototype.send = function (...args) {
        this.addEventListener('load', function () {
          try {
            if (this._req_url && (this._req_url.includes('/links/get-link-info') || this._req_url.includes('checkPassword'))) {
              const res = JSON.parse(this.responseText);
              if (res && res.url && typeof res.url === 'string' && res.url.startsWith('http')) {
                console.log('%c[Zitnits Headless] REAL DESTINATION CAPTURED: ' + res.url, 'color: #00ffaa; font-weight: bold; font-size: 14px;');
                updateHUD('MỞ KHÓA THÀNH CÔNG! Đang chuyển hướng...', null, 'ready');
                setTimeout(() => {
                  window.location.href = res.url;
                }, 400);
              }
            }
          } catch (e) {}
        });
        return origSend.apply(this, args);
      };

      const origFetch = window.fetch;
      window.fetch = async function (...args) {
        const resp = await origFetch.apply(this, args);
        try {
          const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
          if (url.includes('/links/get-link-info')) {
            const clone = resp.clone();
            clone.json().then((data) => {
              if (data && data.url && data.url.startsWith('http')) {
                console.log('[Zitnits Headless] Destination captured via fetch:', data.url);
                window.location.href = data.url;
              }
            }).catch(() => {});
          }
        } catch (e) {}
        return resp;
      };
    })();

    // 2. HUD Giao diện Neon chuyên nghiệp
    const style = document.createElement('style');
    style.textContent = `
      #zitnits-headless-hud {
        position: fixed;
        top: 18px;
        right: 18px;
        z-index: 2147483647;
        width: 330px;
        background: rgba(12, 16, 26, 0.96);
        backdrop-filter: blur(12px);
        border: 1px solid #00f0ff;
        border-radius: 10px;
        box-shadow: 0 0 25px rgba(0, 240, 255, 0.45);
        color: #e0f4ff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        padding: 14px;
        box-sizing: border-box;
      }
      .zh-hdr { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,240,255,0.25); padding-bottom: 8px; margin-bottom: 10px; }
      .zh-hdr h4 { margin: 0; color: #00f0ff; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; }
      .zh-ver { background: #00f0ff; color: #000; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; }
      .zh-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
      .zh-code { font-family: Consolas, monospace; font-size: 15px; font-weight: 800; color: #00ffaa; background: rgba(0,255,170,0.12); border: 1px dashed rgba(0,255,170,0.5); padding: 3px 8px; border-radius: 4px; }
      .zh-status-box { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 8px 10px; font-size: 12px; display: flex; align-items: center; gap: 8px; margin-top: 6px; }
      .zh-dot { width: 8px; height: 8px; border-radius: 50%; background: #ffaa00; box-shadow: 0 0 8px #ffaa00; flex-shrink: 0; }
      .zh-dot.ready { background: #00ffaa; box-shadow: 0 0 8px #00ffaa; }
      .zh-dot.working { background: #00f0ff; box-shadow: 0 0 8px #00f0ff; animation: zhPulse 1s infinite; }
      @keyframes zhPulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
      .zh-progress-bar { width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; margin-top: 8px; display: none; }
      .zh-progress-inner { width: 0%; height: 100%; background: linear-gradient(90deg, #00f0ff, #00ffaa); transition: width 1s linear; }
      .modal-backdrop, .modal.fade.show { display: none !important; opacity: 0 !important; }
    `;
    (document.head || document.documentElement).appendChild(style);

    let hudEls = {};
    let isFormSubmitted = false;
    let activeCode = '';

    function mountHUD() {
      if (document.getElementById('zitnits-headless-hud')) return;
      const hud = document.createElement('div');
      hud.id = 'zitnits-headless-hud';
      hud.innerHTML = `
        <div class="zh-hdr">
          <h4>⚡ Zitnits Headless</h4>
          <span class="zh-ver">v4.0 API</span>
        </div>
        <div class="zh-row">
          <span style="opacity:0.8;">Mã nhiệm vụ:</span>
          <span class="zh-code" id="zh-code-val">Chờ lấy mã...</span>
        </div>
        <div class="zh-status-box">
          <div class="zh-dot working" id="zh-dot"></div>
          <span id="zh-status-text">Đang kết nối API nhiệm vụ...</span>
        </div>
        <div class="zh-progress-bar" id="zh-prog-bar">
          <div class="zh-progress-inner" id="zh-prog-inner"></div>
        </div>
        <div style="font-size:11px; opacity:0.6; margin-top:10px; border-top:1px solid rgba(255,255,255,0.08); padding-top:6px; text-align:center;">
          Bạn chỉ cần giải Captcha — Còn lại tự động 100%!
        </div>
      `;
      document.body.appendChild(hud);
      hudEls.status = document.getElementById('zh-status-text');
      hudEls.code = document.getElementById('zh-code-val');
      hudEls.dot = document.getElementById('zh-dot');
      hudEls.bar = document.getElementById('zh-prog-bar');
      hudEls.inner = document.getElementById('zh-prog-inner');
    }

    function updateHUD(text, code, state, percent) {
      if (hudEls.status && text) hudEls.status.textContent = text;
      if (hudEls.code && code) hudEls.code.textContent = code;
      if (hudEls.dot && state) hudEls.dot.className = 'zh-dot ' + state;
      if (percent !== undefined && hudEls.bar && hudEls.inner) {
        hudEls.bar.style.display = 'block';
        hudEls.inner.style.width = percent + '%';
      }
    }

    // 3. Tự điền mã vào ô mật khẩu
    function fillPassword(code) {
      if (!code) return false;
      activeCode = code;
      const inputs = document.querySelectorAll('input#password-2, input#password, input[name="password"], input[type="password"]');
      let filled = false;
      for (const inp of inputs) {
        if (inp.value !== code) {
          inp.value = code;
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
          filled = true;
        }
      }
      if (filled) {
        updateHUD('ĐÃ NẠP MÃ [' + code + ']! Chờ bạn tick Captcha...', code, 'ready', 100);
      }
      return filled;
    }

    // 4. Theo dõi Captcha và tự nộp link
    function monitorCaptcha() {
      if (isFormSubmitted) return;

      const recaptchas = document.querySelectorAll('[name="g-recaptcha-response"]');
      let solved = false;
      for (const el of recaptchas) {
        if (el.value && el.value.trim().length > 20) {
          solved = true;
          break;
        }
      }

      const turnstiles = document.querySelectorAll('[name="cf-turnstile-response"]');
      for (const el of turnstiles) {
        if (el.value && el.value.trim().length > 20) {
          solved = true;
          break;
        }
      }

      const anchor = document.querySelector('#recaptcha-anchor, .recaptcha-checkbox-checked');
      if (anchor && (anchor.getAttribute('aria-checked') === 'true' || anchor.classList.contains('recaptcha-checkbox-checked'))) {
        solved = true;
      }

      if (solved) {
        isFormSubmitted = true;
        console.log('[Zitnits Headless] User Solved Captcha! Submitting...');
        updateHUD('Captcha hoàn tất! Đang gửi yêu cầu...', null, 'ready');

        // Điền lại mã một lần nữa cho chắc
        if (activeCode) fillPassword(activeCode);

        // Gọi hàm submit của Link4M
        try {
          if (typeof unsafeWindow.checkPassword === 'function') {
            unsafeWindow.checkPassword();
          }
        } catch (e) {}

        // Click các nút submit hợp lệ (TUYỆT ĐỐI KHÔNG CLICK a[href*="http"] ĐỂ TRÁNH BỊ VĂNG VỀ LINK4M.COM)
        const submitBtns = [
          document.querySelector('button#submit-form'),
          document.querySelector('button.get-link'),
          document.querySelector('#btn-main'),
          document.querySelector('form#main-form-2 button[type="submit"]')
        ];
        for (const btn of submitBtns) {
          if (btn && btn.offsetParent !== null) {
            btn.click();
          }
        }

        // Theo dõi nút a.get-link khi server cấp link đích thực
        let checks = 0;
        const linkCheckId = setInterval(() => {
          checks++;
          const targetBtn = document.querySelector('a.get-link:not(.disabled)');
          if (targetBtn) {
            const dest = targetBtn.getAttribute('href');
            if (dest && dest !== '#' && !dest.startsWith('javascript:') && !dest.includes('link4m.com')) {
              clearInterval(linkCheckId);
              updateHUD('Đang chuyển hướng link đích...', null, 'ready');
              window.location.href = dest;
              return;
            }
          }
          if (checks > 20) clearInterval(linkCheckId);
        }, 500);
      }
    }

    // Lắng nghe mã từ Storage hoặc cross-tab
    try {
      if (typeof GM_addValueChangeListener === 'function') {
        GM_addValueChangeListener('headless_sponsor_code', (k, oldVal, newVal) => {
          if (newVal) fillPassword(newVal);
        });
      }
    } catch (e) {}

    setInterval(() => {
      // Dọn dẹp backdrop quảng cáo
      const backdrops = document.querySelectorAll('.modal-backdrop');
      for (const bd of backdrops) bd.remove();
      document.body.style.overflow = 'auto';

      mountHUD();

      // Kiểm tra storage
      try {
        const stored = GM_getValue('headless_sponsor_code', '');
        if (stored) fillPassword(stored);
      } catch (e) {}

      monitorCaptcha();
    }, 400);

    return;
  }

  /* =========================================================================
   * MODULE 2: ADVERTISER / SPONSOR WEB (WHAT-ON HEADLESS API RUNNER)
   * ========================================================================= */
  // Khi người dùng hoặc extension mở trang tài trợ có nhúng widget What-On:
  console.log('[Zitnits Headless] Advertiser site probe active...');

  // 1. Bypass Incognito & Quota probe
  try {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate = async () => ({ quota: 120 * 1024 * 1024 * 1024, usage: 50 * 1024 * 1024 });
    }
    if (navigator.webkitTemporaryStorage && navigator.webkitTemporaryStorage.queryUsageAndQuota) {
      navigator.webkitTemporaryStorage.queryUsageAndQuota = (cb) => {
        if (typeof cb === 'function') cb(50 * 1024 * 1024, 120 * 1024 * 1024 * 1024);
      };
    }
    Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
    Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
  } catch (e) {}

  // 2. Headless API Runner: Bắt parameters từ thẻ script s1.what-on.com/widget/service-v2.js?key=...
  let apiRunning = false;

  function probeWhatOnScript() {
    if (apiRunning) return;

    const scripts = document.querySelectorAll('script[src*="what-on.com/widget"]');
    for (const sc of scripts) {
      const src = sc.getAttribute('src');
      const urlMatch = src.match(/key=([A-Za-z0-9_-]+)/);
      if (urlMatch && urlMatch[1]) {
        apiRunning = true;
        const key = urlMatch[1];
        console.log('%c[Zitnits Headless] Found What-On Widget Key: ' + key, 'color: #00ffaa; font-weight: bold;');
        startHeadlessAPITimer(key, src);
        break;
      }
    }
  }

  // Tải service script để bóc tách token & session id, sau đó gọi thẳng API server-side
  function startHeadlessAPITimer(key, scriptUrl) {
    console.log('[Zitnits Headless] Initiating pure API countdown...');

    GM_xmlhttpRequest({
      method: 'GET',
      url: scriptUrl.startsWith('//') ? 'https:' + scriptUrl : scriptUrl,
      headers: { 'Referer': window.location.href },
      onload: function (resp) {
        const text = resp.responseText;
        // Bóc tách v59d84 (session) và b59e0e (token)
        const sessionMatch = text.match(/v59d84\s*=\s*['"]([a-f0-9]+)['"]/);
        const codeMatch = text.match(/b59e0e\s*=\s*['"]([a-f0-9]+)['"]/);
        const domainMatch = text.match(/v59e25\s*=\s*['"]([^'"]+)['"]/);

        const sessionId = sessionMatch ? sessionMatch[1] : '';
        const tokenCode = codeMatch ? codeMatch[1] : '';
        const apiDomain = domainMatch ? domainMatch[1] : 's1.what-on.com';

        if (sessionId && tokenCode) {
          console.log(`[Zitnits Headless] Parameters: session=${sessionId}, token=${tokenCode}`);

          // BƯỚC 1: Bắn POST /widget/client.js để Server bắt đầu tính giờ t0
          const clientId = 'c_' + Math.random().toString(36).substring(2, 10);
          GM_xmlhttpRequest({
            method: 'POST',
            url: `https://${apiDomain}/widget/client.js`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Referer': window.location.href
            },
            data: `traffic_session=${sessionId}&key=${key}&client_id=${clientId}&pathname=${encodeURIComponent(window.location.pathname)}&hostname=${window.location.hostname}`,
            onload: function (clientRes) {
              console.log('%c[Zitnits Headless] Server Timer Started! Waiting 60s...', 'color: #00ffaa; font-weight: bold;');
              showTimerNotice(60);

              // BƯỚC 2: Chờ đúng 61 giây (Server-side timer)
              setTimeout(() => {
                console.log('[Zitnits Headless] 60s elapsed! Requesting Step 1 Quest ID...');

                GM_xmlhttpRequest({
                  method: 'GET',
                  url: `https://${apiDomain}/widget/get_quest_code.html?code=${tokenCode}&traffic_session=${sessionId}&key=${key}&client_id=${clientId}`,
                  headers: { 'Referer': window.location.href },
                  onload: function (step1Res) {
                    try {
                      const data1 = JSON.parse(step1Res.responseText);
                      console.log('[Zitnits Headless] Step 1 response:', data1);

                      const questId = data1.id || (data1.quest_info && data1.quest_info.id);
                      if (data1.success && questId) {
                        console.log('%c[Zitnits Headless] Step 1 passed! Waiting 15s for Step 2...', 'color: #00ffaa;');
                        showTimerNotice(15);

                        // BƯỚC 3: Chờ tiếp 16 giây cho Step 2
                        setTimeout(() => {
                          GM_xmlhttpRequest({
                            method: 'GET',
                            url: `https://${apiDomain}/widget/get_quest_code.html?id=${questId}&code=${tokenCode}&traffic_session=${sessionId}&key=${key}&client_id=${clientId}`,
                            headers: { 'Referer': window.location.href },
                            onload: function (step2Res) {
                              try {
                                const data2 = JSON.parse(step2Res.responseText);
                                console.log('[Zitnits Headless] Step 2 response:', data2);
                                if (data2.success && data2.html) {
                                  // data2.html chính là MÃ 6 KÝ TỰ!
                                  const finalCode = data2.html.trim();
                                  saveAndBroadcastCode(finalCode);
                                }
                              } catch (e) {}
                            }
                          });
                        }, 16000);
                      }
                    } catch (e) {}
                  }
                });
              }, 61000);
            }
          });
        }
      }
    });
  }

  function saveAndBroadcastCode(code) {
    console.log('%c[Zitnits Headless] FINAL CODE UNLOCKED: ' + code, 'color: #00ffaa; font-weight: bold; font-size: 16px;');
    try { GM_setValue('headless_sponsor_code', code); } catch (e) {}
    try { GM_setClipboard(code); } catch (e) {}

    // Thông báo toast
    const toast = document.createElement('div');
    toast.innerHTML = `⚡ <b>Zitnits Headless:</b> Đã lấy xong mã <b>[${code}]</b>! Đang tự động nạp về tab Link4M!`;
    Object.assign(toast.style, {
      position: 'fixed', bottom: '20px', right: '20px', zIndex: '2147483647',
      background: '#0c101a', color: '#00ffaa', border: '1px solid #00ffaa',
      padding: '12px 18px', borderRadius: '8px', fontFamily: 'sans-serif',
      boxShadow: '0 0 20px rgba(0,255,170,0.6)'
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 7000);
  }

  function showTimerNotice(seconds) {
    let rem = seconds;
    const box = document.createElement('div');
    box.id = 'zh-timer-notice';
    Object.assign(box.style, {
      position: 'fixed', bottom: '20px', left: '20px', zIndex: '2147483647',
      background: 'rgba(10,15,25,0.95)', color: '#00f0ff', border: '1px solid #00f0ff',
      padding: '10px 16px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '13px',
      boxShadow: '0 0 15px rgba(0,240,255,0.4)'
    });
    document.body.appendChild(box);

    const intId = setInterval(() => {
      box.textContent = `⚡ Zitnits API Timer: Còn ${rem}s (Chạy ngầm API thuần)...`;
      rem--;
      if (rem < 0) {
        clearInterval(intId);
        box.remove();
      }
    }, 1000);
  }

  // Quét DOM tìm script What-On
  setInterval(probeWhatOnScript, 1000);
  window.addEventListener('load', probeWhatOnScript);
})();
