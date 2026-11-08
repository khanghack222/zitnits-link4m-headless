// ==UserScript==
// @name         Zitnits Link4M Headless API Timer & Auto-Bypass
// @namespace    https://github.com/khanghack222/zitnits-link4m-headless
// @version      4.1.0
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
    console.log('%c[Zitnits Headless] Active on Link4M Gateway', 'color: #00f0ff; font-weight: bold;');

    // 1. Hook XHR & Fetch để bắt chính xác Link Đích (TUYỆT ĐỐI KHÔNG BỊ VĂNG VỀ LINK4M.COM)
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
              if (res && res.url && typeof res.url === 'string' && res.url.startsWith('http') && !res.url.includes('link4m.com')) {
                console.log('%c[Zitnits Headless] DESTINATION UNLOCKED: ' + res.url, 'color: #00ffaa; font-weight: bold; font-size: 15px;');
                updateHUD('MỞ KHÓA THÀNH CÔNG! Đang chuyển hướng...', null, 'ready');
                setTimeout(() => { window.location.href = res.url; }, 400);
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
              if (data && data.url && data.url.startsWith('http') && !data.url.includes('link4m.com')) {
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
        width: 340px;
        background: rgba(12, 16, 26, 0.97);
        backdrop-filter: blur(14px);
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
      .zh-hdr h4 { margin: 0; color: #00f0ff; font-size: 14px; font-weight: 700; }
      .zh-ver { background: #00f0ff; color: #000; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; }
      .zh-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
      .zh-code { font-family: Consolas, monospace; font-size: 15px; font-weight: 800; color: #00ffaa; background: rgba(0,255,170,0.12); border: 1px dashed rgba(0,255,170,0.5); padding: 3px 8px; border-radius: 4px; }
      .zh-status-box { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 8px 10px; font-size: 12px; display: flex; align-items: center; gap: 8px; margin-top: 6px; }
      .zh-dot { width: 8px; height: 8px; border-radius: 50%; background: #ffaa00; box-shadow: 0 0 8px #ffaa00; flex-shrink: 0; }
      .zh-dot.ready { background: #00ffaa; box-shadow: 0 0 8px #00ffaa; }
      .zh-dot.working { background: #00f0ff; box-shadow: 0 0 8px #00f0ff; animation: zhPulse 1.2s infinite; }
      @keyframes zhPulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
      .zh-fast-action { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
      .zh-input-row { display: flex; gap: 6px; }
      .zh-input-row input { flex: 1; background: #161c28; border: 1px solid #28364f; border-radius: 4px; color: #fff; padding: 5px 8px; font-size: 12px; outline: none; }
      .zh-input-row input:focus { border-color: #00f0ff; }
      .zh-btn { background: rgba(0,240,255,0.15); border: 1px solid #00f0ff; color: #00f0ff; border-radius: 4px; padding: 5px 10px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
      .zh-btn:hover { background: #00f0ff; color: #000; }
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
          <span class="zh-ver">v4.1 API</span>
        </div>
        <div class="zh-row">
          <span style="opacity:0.8;">Mã nhiệm vụ:</span>
          <span class="zh-code" id="zh-code-val">Chờ mã...</span>
        </div>
        <div class="zh-status-box">
          <div class="zh-dot working" id="zh-dot"></div>
          <span id="zh-status-text">Mở tab nhà tài trợ để chạy API ngầm hoặc nhập URL...</span>
        </div>
        <div class="zh-fast-action">
          <div class="zh-input-row">
            <input type="text" id="zh-sponsor-url" placeholder="Dán link web tài trợ (nếu có)...">
            <button class="zh-btn" id="zh-run-api-btn">Chạy API</button>
          </div>
          <div class="zh-input-row">
            <input type="text" id="zh-manual-code" placeholder="Hoặc dán mã tay...">
            <button class="zh-btn" id="zh-save-code-btn">Nạp ngay</button>
          </div>
        </div>
        <div style="font-size:11px; opacity:0.6; margin-top:10px; border-top:1px solid rgba(255,255,255,0.08); padding-top:6px; text-align:center;">
          Mở tab web tài trợ -> API tự đếm ngầm và gửi mã về đây!
        </div>
      `;
      document.body.appendChild(hud);
      hudEls.status = document.getElementById('zh-status-text');
      hudEls.code = document.getElementById('zh-code-val');
      hudEls.dot = document.getElementById('zh-dot');

      // Nút chạy API từ URL trang tài trợ
      document.getElementById('zh-run-api-btn').addEventListener('click', () => {
        const url = document.getElementById('zh-sponsor-url').value.trim();
        if (url) {
          updateHUD('Đang phân tích link tài trợ & gọi API...', null, 'working');
          triggerRemoteSponsorAPI(url);
        }
      });

      // Nút nạp mã thủ công
      document.getElementById('zh-save-code-btn').addEventListener('click', () => {
        const c = document.getElementById('zh-manual-code').value.trim();
        if (c) fillPassword(c);
      });
    }

    function updateHUD(text, code, state) {
      if (hudEls.status && text) hudEls.status.textContent = text;
      if (hudEls.code && code) hudEls.code.textContent = code;
      if (hudEls.dot && state) hudEls.dot.className = 'zh-dot ' + state;
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
        updateHUD('ĐÃ NẠP MÃ [' + code + ']! Bạn hãy tick Captcha...', code, 'ready');
      }
      return filled;
    }

    // 4. Gọi API ngầm What-On trực tiếp từ tab Link4M nếu có URL trang tài trợ
    function triggerRemoteSponsorAPI(targetUrl) {
      GM_xmlhttpRequest({
        method: 'GET',
        url: targetUrl,
        onload: function (pageRes) {
          const html = pageRes.responseText;
          const matchScript = html.match(/src=["']([^"']*what-on\.com\/widget\/[^"']+)["']/i);
          if (matchScript && matchScript[1]) {
            let scUrl = matchScript[1];
            if (scUrl.startsWith('//')) scUrl = 'https:' + scUrl;
            const keyMatch = scUrl.match(/key=([A-Za-z0-9_-]+)/);
            const key = keyMatch ? keyMatch[1] : '';

            GM_xmlhttpRequest({
              method: 'GET',
              url: scUrl,
              headers: { 'Referer': targetUrl },
              onload: function (scRes) {
                const jsText = scRes.responseText;
                const sessMatch = jsText.match(/v59d84\s*=\s*['"]([a-f0-9]+)['"]/);
                const codeMatch = jsText.match(/b59e0e\s*=\s*['"]([a-f0-9]+)['"]/);
                const sessionId = sessMatch ? sessMatch[1] : '';
                const token = codeMatch ? codeMatch[1] : '';

                if (sessionId && token && key) {
                  const clientId = 'c_' + Math.random().toString(36).substring(2, 9);
                  // BẮT ĐẦU TÍNH GIỜ: POST /widget/client.js
                  GM_xmlhttpRequest({
                    method: 'POST',
                    url: 'https://s1.what-on.com/widget/client.js',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': targetUrl },
                    data: `traffic_session=${sessionId}&key=${key}&client_id=${clientId}`,
                    onload: function () {
                      let sec = 60;
                      const timerId = setInterval(() => {
                        updateHUD(`Đang chạy ngầm API What-On: còn ${sec}s...`, null, 'working');
                        sec--;
                        if (sec < 0) {
                          clearInterval(timerId);
                          updateHUD('Hết 60s! Đang lấy quest_id...', null, 'working');
                          // GỌI STEP 1
                          GM_xmlhttpRequest({
                            method: 'GET',
                            url: `https://s1.what-on.com/widget/get_quest_code.html?code=${token}&traffic_session=${sessionId}&key=${key}&client_id=${clientId}`,
                            headers: { 'Referer': targetUrl },
                            onload: function (s1Res) {
                              try {
                                const d1 = JSON.parse(s1Res.responseText);
                                const qId = d1.id;
                                if (d1.success && qId) {
                                  let s2 = 15;
                                  const t2Id = setInterval(() => {
                                    updateHUD(`Đang chạy ngầm Step 2: còn ${s2}s...`, null, 'working');
                                    s2--;
                                    if (s2 < 0) {
                                      clearInterval(t2Id);
                                      // GỌI STEP 2 LẤY MÃ
                                      GM_xmlhttpRequest({
                                        method: 'GET',
                                        url: `https://s1.what-on.com/widget/get_quest_code.html?id=${qId}&code=${token}&traffic_session=${sessionId}&key=${key}&client_id=${clientId}`,
                                        headers: { 'Referer': targetUrl },
                                        onload: function (s2Res) {
                                          try {
                                            const d2 = JSON.parse(s2Res.responseText);
                                            if (d2.success && d2.html) {
                                              fillPassword(d2.html.trim());
                                            }
                                          } catch (e) {}
                                        }
                                      });
                                    }
                                  }, 1000);
                                }
                              } catch (e) {}
                            }
                          });
                        }
                      }, 1000);
                    }
                  });
                }
              }
            });
          } else {
            updateHUD('Không tìm thấy script What-On trên URL này!', null, 'working');
          }
        }
      });
    }

    // 5. Theo dõi Captcha và tự nộp link
    function monitorCaptcha() {
      if (isFormSubmitted) return;

      const recaptchas = document.querySelectorAll('[name="g-recaptcha-response"]');
      let solved = false;
      for (const el of recaptchas) {
        if (el.value && el.value.trim().length > 20) { solved = true; break; }
      }
      const turnstiles = document.querySelectorAll('[name="cf-turnstile-response"]');
      for (const el of turnstiles) {
        if (el.value && el.value.trim().length > 20) { solved = true; break; }
      }
      const anchor = document.querySelector('#recaptcha-anchor, .recaptcha-checkbox-checked');
      if (anchor && (anchor.getAttribute('aria-checked') === 'true' || anchor.classList.contains('recaptcha-checkbox-checked'))) {
        solved = true;
      }

      if (solved) {
        isFormSubmitted = true;
        console.log('[Zitnits Headless] Captcha Solved! Submitting...');
        updateHUD('Captcha hoàn tất! Đang gửi yêu cầu...', null, 'ready');

        if (activeCode) fillPassword(activeCode);

        try {
          if (typeof unsafeWindow.checkPassword === 'function') unsafeWindow.checkPassword();
        } catch (e) {}

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

        // Bắt nút a.get-link nếu nó được cập nhật link đích thực
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

    // Lắng nghe mã từ Storage cross-tab
    try {
      if (typeof GM_addValueChangeListener === 'function') {
        GM_addValueChangeListener('headless_sponsor_code', (k, oldVal, newVal) => {
          if (newVal) fillPassword(newVal);
        });
      }
    } catch (e) {}

    setInterval(() => {
      const backdrops = document.querySelectorAll('.modal-backdrop');
      for (const bd of backdrops) bd.remove();
      document.body.style.overflow = 'auto';

      mountHUD();

      try {
        const stored = GM_getValue('headless_sponsor_code', '');
        if (stored) fillPassword(stored);
      } catch (e) {}

      monitorCaptcha();
    }, 400);

    return;
  }

  /* =========================================================================
   * MODULE 2: TRANG NHÀ TÀI TRỢ (WHAT-ON AUTO-API RUNNER)
   * ========================================================================= */
  console.log('[Zitnits Headless] Sponsor tab monitor active...');

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

  let apiTriggered = false;

  function probeAdvertiserScript() {
    if (apiTriggered) return;

    // Tìm thẻ script What-On
    const scripts = document.querySelectorAll('script[src*="what-on.com/widget"]');
    for (const sc of scripts) {
      const src = sc.getAttribute('src');
      const urlMatch = src && src.match(/key=([A-Za-z0-9_-]+)/);
      if (urlMatch && urlMatch[1]) {
        apiTriggered = true;
        const key = urlMatch[1];
        console.log('%c[Zitnits Headless] Found What-On Script with Key: ' + key, 'color: #00ffaa; font-weight: bold;');
        runHeadlessSponsorTimer(key, src);
        break;
      }
    }

    // Dự phòng: Tự động click nút LẤY MÃ nếu có trên DOM
    const buttons = document.querySelectorAll('button, a, div[onclick]');
    for (const b of buttons) {
      const txt = (b.innerText || b.textContent || '').trim().toLowerCase();
      if ((txt.includes('lấy mã') || txt.includes('lay ma') || txt.includes('get code')) && !b.__zit_c) {
        b.__zit_c = true;
        try { b.click(); } catch (e) {}
      }
    }
  }

  function runHeadlessSponsorTimer(key, scriptUrl) {
    let fullUrl = scriptUrl;
    if (fullUrl.startsWith('//')) fullUrl = 'https:' + fullUrl;

    GM_xmlhttpRequest({
      method: 'GET',
      url: fullUrl,
      headers: { 'Referer': window.location.href },
      onload: function (resp) {
        const text = resp.responseText;
        const sessionMatch = text.match(/v59d84\s*=\s*['"]([a-f0-9]+)['"]/);
        const codeMatch = text.match(/b59e0e\s*=\s*['"]([a-f0-9]+)['"]/);
        const domainMatch = text.match(/v59e25\s*=\s*['"]([^'"]+)['"]/);

        const sessionId = sessionMatch ? sessionMatch[1] : '';
        const tokenCode = codeMatch ? codeMatch[1] : '';
        const apiDomain = domainMatch ? domainMatch[1] : 's1.what-on.com';

        if (sessionId && tokenCode) {
          console.log(`[Zitnits Headless] Calling client.js for session ${sessionId}...`);
          const clientId = 'c_' + Math.random().toString(36).substring(2, 10);

          // BƯỚC 1: POST /widget/client.js bắt đầu tính giờ
          GM_xmlhttpRequest({
            method: 'POST',
            url: `https://${apiDomain}/widget/client.js`,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': window.location.href },
            data: `traffic_session=${sessionId}&key=${key}&client_id=${clientId}&pathname=${encodeURIComponent(window.location.pathname)}&hostname=${window.location.hostname}`,
            onload: function () {
              console.log('%c[Zitnits Headless] What-On Timer Started via API! (60s)', 'color: #00ffaa; font-weight: bold;');
              showTimerNotice(60);

              setTimeout(() => {
                // BƯỚC 2: GET /widget/get_quest_code.html
                GM_xmlhttpRequest({
                  method: 'GET',
                  url: `https://${apiDomain}/widget/get_quest_code.html?code=${tokenCode}&traffic_session=${sessionId}&key=${key}&client_id=${clientId}`,
                  headers: { 'Referer': window.location.href },
                  onload: function (s1Res) {
                    try {
                      const d1 = JSON.parse(s1Res.responseText);
                      const qId = d1.id;
                      if (d1.success && qId) {
                        showTimerNotice(15);
                        setTimeout(() => {
                          // BƯỚC 3: GET /widget/get_quest_code.html?id=... (LẤY MÃ)
                          GM_xmlhttpRequest({
                            method: 'GET',
                            url: `https://${apiDomain}/widget/get_quest_code.html?id=${qId}&code=${tokenCode}&traffic_session=${sessionId}&key=${key}&client_id=${clientId}`,
                            headers: { 'Referer': window.location.href },
                            onload: function (s2Res) {
                              try {
                                const d2 = JSON.parse(s2Res.responseText);
                                if (d2.success && d2.html) {
                                  broadcastCode(d2.html.trim());
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

  function broadcastCode(code) {
    console.log('%c[Zitnits Headless] CODE ACQUIRED: ' + code, 'color: #00ffaa; font-weight: bold; font-size: 16px;');
    try { GM_setValue('headless_sponsor_code', code); } catch (e) {}
    try { GM_setClipboard(code); } catch (e) {}

    const toast = document.createElement('div');
    toast.innerHTML = `⚡ <b>Zitnits Headless:</b> Đã lấy mã <b>[${code}]</b>! Đang tự động nạp sang tab Link4M!`;
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
      box.textContent = `⚡ Zitnits API Timer: Còn ${rem}s (Chạy ngầm API What-On)...`;
      rem--;
      if (rem < 0) {
        clearInterval(intId);
        box.remove();
      }
    }, 1000);
  }

  setInterval(probeAdvertiserScript, 900);
  window.addEventListener('load', probeAdvertiserScript);
})();
