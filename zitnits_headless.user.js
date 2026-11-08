// ==UserScript==
// @name         Zitnits Link4M Auto-Solver & Headless API Timer
// @namespace    https://github.com/khanghack222/zitnits-link4m-headless
// @version      4.5.0
// @description  Tự động đào trang tài trợ từ Link4M bằng OCR, tự kích hoạt đếm ngược What-On qua API thuần ngầm 100%, tự nạp mã và mở khóa link đích.
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
// @connect      img.link4m.net
// @connect      *
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @require      https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js
// @run-at       document-start
// @downloadURL  https://raw.githubusercontent.com/khanghack222/zitnits-link4m-headless/main/zitnits_headless.user.js
// @updateURL    https://raw.githubusercontent.com/khanghack222/zitnits-link4m-headless/main/zitnits_headless.user.js
// ==/UserScript==

(function () {
  'use strict';

  const host = window.location.hostname;
  const path = window.location.pathname;
  const isLink4M = (host.includes('link4m.') || host.includes('link1s.')) && path.includes('/go/');

  /* =========================================================================
   * MODULE 1: LINK4M GATEWAY PAGE (/go/*)
   * ========================================================================= */
  if (isLink4M) {
    console.log('%c[Zitnits] Link4M Auto-Solver Active', 'color: #00f0ff; font-weight: bold;');

    // 1. Hook XHR & Fetch để bắt chính xác Link Đích
    (function hookDestination() {
      const origOpen = XMLHttpRequest.prototype.open;
      const origSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function (m, u, ...rest) {
        this._req_url = u;
        return origOpen.call(this, m, u, ...rest);
      };
      XMLHttpRequest.prototype.send = function (...args) {
        this.addEventListener('load', function () {
          try {
            if (this._req_url && (this._req_url.includes('/links/get-link-info') || this._req_url.includes('checkPassword'))) {
              const res = JSON.parse(this.responseText);
              if (res && res.url && typeof res.url === 'string' && res.url.startsWith('http') && !res.url.includes('link4m.com')) {
                console.log('%c[Zitnits] REAL DESTINATION: ' + res.url, 'color: #00ffaa; font-weight: bold;');
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
          const u = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
          if (u.includes('/links/get-link-info')) {
            const clone = resp.clone();
            clone.json().then((data) => {
              if (data && data.url && data.url.startsWith('http') && !data.url.includes('link4m.com')) {
                window.location.href = data.url;
              }
            }).catch(() => {});
          }
        } catch (e) {}
        return resp;
      };
    })();

    // 2. HUD Cyberpunk Giao diện
    const style = document.createElement('style');
    style.textContent = `
      #zitnits-auto-hud {
        position: fixed;
        top: 18px;
        right: 18px;
        z-index: 2147483647;
        width: 350px;
        background: rgba(10, 14, 24, 0.96);
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
      .zh-status { background: rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 8px 10px; font-size: 12px; display: flex; align-items: center; gap: 8px; margin-top: 6px; }
      .zh-dot { width: 8px; height: 8px; border-radius: 50%; background: #ffaa00; box-shadow: 0 0 8px #ffaa00; flex-shrink: 0; }
      .zh-dot.ready { background: #00ffaa; box-shadow: 0 0 8px #00ffaa; }
      .zh-dot.working { background: #00f0ff; box-shadow: 0 0 8px #00f0ff; animation: zhPulse 1s infinite; }
      @keyframes zhPulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
      .zh-bar { width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; margin-top: 8px; display: none; }
      .zh-bar-in { width: 0%; height: 100%; background: linear-gradient(90deg, #00f0ff, #00ffaa); transition: width 1s linear; }
      .modal-backdrop, .modal.fade.show { display: none !important; opacity: 0 !important; }
    `;
    (document.head || document.documentElement).appendChild(style);

    let hudEls = {};
    let isSubmitted = false;
    let autoSolved = false;

    function mountHUD() {
      if (document.getElementById('zitnits-auto-hud')) return;
      const hud = document.createElement('div');
      hud.id = 'zitnits-auto-hud';
      hud.innerHTML = `
        <div class="zh-hdr">
          <h4>⚡ Zitnits Auto-Solver</h4>
          <span class="zh-ver">v4.5 OCR+API</span>
        </div>
        <div class="zh-row">
          <span style="opacity:0.8;">Mã nhiệm vụ:</span>
          <span class="zh-code" id="zh-code">Đang tự động đào...</span>
        </div>
        <div class="zh-status">
          <div class="zh-dot working" id="zh-dot"></div>
          <span id="zh-text">Đang nhận diện web tài trợ qua OCR...</span>
        </div>
        <div class="zh-bar" id="zh-bar">
          <div class="zh-bar-in" id="zh-bar-in"></div>
        </div>
        <div style="font-size:11px; opacity:0.6; margin-top:10px; border-top:1px solid rgba(255,255,255,0.08); padding-top:6px; text-align:center;">
          Tự động tìm web tài trợ -> chạy ngầm API What-On -> nạp mã!
        </div>
      `;
      document.body.appendChild(hud);
      hudEls.text = document.getElementById('zh-text');
      hudEls.code = document.getElementById('zh-code');
      hudEls.dot = document.getElementById('zh-dot');
      hudEls.bar = document.getElementById('zh-bar');
      hudEls.barIn = document.getElementById('zh-bar-in');
    }

    function updateHUD(text, code, state, pct) {
      if (hudEls.text && text) hudEls.text.textContent = text;
      if (hudEls.code && code) hudEls.code.textContent = code;
      if (hudEls.dot && state) hudEls.dot.className = 'zh-dot ' + state;
      if (pct !== undefined && hudEls.bar && hudEls.barIn) {
        hudEls.bar.style.display = 'block';
        hudEls.barIn.style.width = pct + '%';
      }
    }

    function fillPassword(code) {
      if (!code) return;
      const inputs = document.querySelectorAll('input#password-2, input#password, input[name="password"], input[type="password"]');
      for (const inp of inputs) {
        if (inp.value !== code) {
          inp.value = code;
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      updateHUD('ĐÃ NẠP MÃ [' + code + ']! Bạn hãy tick Captcha...', code, 'ready', 100);
    }

    // 3. TỰ ĐỘNG ĐÀO TRANG TÀI TRỢ BẰNG OCR TESSERACT
    async function autoDiscoverSponsorSite() {
      if (autoSolved) return;

      // Tìm ảnh hướng dẫn (1_63.jpg hoặc các ảnh minh họa trong link4m)
      const imgs = Array.from(document.querySelectorAll('img[src*="/uploads/advertiser/"]'));
      let targetImgUrl = null;
      for (const img of imgs) {
        const src = img.getAttribute('src');
        if (src && !src.includes('button-lay-ma')) {
          targetImgUrl = src;
          break;
        }
      }

      if (!targetImgUrl) return;
      autoSolved = true;
      console.log('[Zitnits] Found Advertiser Screenshot Image:', targetImgUrl);
      updateHUD('Phát hiện ảnh minh họa! Đang OCR bóc tên miền...', null, 'working');

      try {
        if (typeof Tesseract === 'undefined') {
          console.warn('[Zitnits] Tesseract not ready yet');
          return;
        }
        const worker = await Tesseract.createWorker('eng');
        const ret = await worker.recognize(targetImgUrl);
        await worker.terminate();

        const text = ret.data.text;
        console.log('[Zitnits] OCR Raw Result:', text);

        // Bóc tách URL/Domain từ kết quả OCR (ví dụ: tylenhacai100.io, what-on, v.v.)
        const domainMatch = text.match(/(?:https?:\/\/)?([a-zA-Z0-9-]+\.(?:io|com|net|vn|org|info|cc|app|tv|me))/i);
        if (domainMatch && domainMatch[1]) {
          let domain = domainMatch[1].toLowerCase().replace(/1oo/g, '100'); // Sửa lỗi OCR số 0 thành chữ o
          let sponsorUrl = 'https://' + domain;
          console.log('%c[Zitnits] DISCOVERED SPONSOR DOMAIN: ' + sponsorUrl, 'color: #00ffaa; font-weight: bold;');
          updateHUD(`Đã tìm ra web: ${domain}! Đang lấy API What-On...`, null, 'working', 20);

          // BƯỚC TIẾP: GỌI THẲNG API NHÀ TÀI TRỢ CHẠY NGẦM
          executeHeadlessSponsorAPI(sponsorUrl);
        } else {
          updateHUD('OCR chưa bắt được domain chuẩn, đang thử fallback...', null, 'working');
        }
      } catch (err) {
        console.error('[Zitnits] OCR Error:', err);
      }
    }

    // 4. CHẠY NGẦM BỘ ĐẾM WHAT-ON BẰNG API THUẦN (100% HEADLESS)
    function executeHeadlessSponsorAPI(siteUrl) {
      GM_xmlhttpRequest({
        method: 'GET',
        url: siteUrl,
        onload: function (resp) {
          const html = resp.responseText;
          // Tìm thẻ script s1.what-on.com/widget/service-v2.js?key=...
          const scMatch = html.match(/src=["']([^"']*what-on\.com\/widget\/[^"']+)["']/i);
          if (scMatch && scMatch[1]) {
            let scUrl = scMatch[1];
            if (scUrl.startsWith('//')) scUrl = 'https:' + scUrl;
            const keyMatch = scUrl.match(/key=([A-Za-z0-9_-]+)/);
            const key = keyMatch ? keyMatch[1] : '';

            GM_xmlhttpRequest({
              method: 'GET',
              url: scUrl,
              headers: { 'Referer': siteUrl + '/' },
              onload: function (scResp) {
                const js = scResp.responseText;
                // Universal Regex bóc session (24 hex) và token (32 hex)
                const sessMatch = js.match(/['"`]\s*([a-f0-9]{24})\s*['"`]/);
                const tokenRaw = js.match(/var\s+\w+\s*=\s*['"`]((\\x[0-9a-fA-F]{2}){32})['"`]/);
                let token = '';
                if (tokenRaw) {
                  const hex = tokenRaw[1].replace(/\\x/g, '');
                  let str = '';
                  for (let i = 0; i < hex.length; i += 2) str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
                  token = str;
                } else {
                  const tHex = js.match(/['"`]\s*([a-f0-9]{32})\s*['"`]/);
                  token = tHex ? tHex[1] : '';
                }

                const sessionId = sessMatch ? sessMatch[1] : '';
                if (sessionId && token && key) {
                  console.log(`[Zitnits] Starting Headless Session: ${sessionId}, Token: ${token}, Key: ${key}`);

                  // POST /widget/client.js bắt đầu tính giờ
                  const cId = 'c_' + Math.random().toString(36).substring(2, 9);
                  GM_xmlhttpRequest({
                    method: 'POST',
                    url: 'https://s1.what-on.com/widget/client.js',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': siteUrl + '/' },
                    data: `traffic_session=${sessionId}&key=${key}&client_id=${cId}`,
                    onload: function () {
                      let sec = 60;
                      const timerId = setInterval(() => {
                        const pct = Math.round(((60 - sec) / 76) * 100);
                        updateHUD(`Đang chạy ngầm API What-On: còn ${sec}s...`, null, 'working', pct);
                        sec--;
                        if (sec < 0) {
                          clearInterval(timerId);
                          updateHUD('Đang chốt Step 1...', null, 'working', 80);
                          // Step 1
                          GM_xmlhttpRequest({
                            method: 'GET',
                            url: `https://s1.what-on.com/widget/get_quest_code.html?code=${token}&traffic_session=${sessionId}&key=${key}&client_id=${cId}`,
                            headers: { 'Referer': siteUrl + '/' },
                            onload: function (s1Res) {
                              try {
                                const d1 = JSON.parse(s1Res.responseText);
                                const qId = d1.id;
                                if (d1.success && qId) {
                                  let s2 = 15;
                                  const t2Id = setInterval(() => {
                                    updateHUD(`Đang chạy ngầm Step 2: còn ${s2}s...`, null, 'working', 85 + (15 - s2));
                                    s2--;
                                    if (s2 < 0) {
                                      clearInterval(t2Id);
                                      // Step 2 LẤY MÃ
                                      GM_xmlhttpRequest({
                                        method: 'GET',
                                        url: `https://s1.what-on.com/widget/get_quest_code.html?id=${qId}&code=${token}&traffic_session=${sessionId}&key=${key}&client_id=${cId}`,
                                        headers: { 'Referer': siteUrl + '/' },
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
          }
        }
      });
    }

    // 5. Theo dõi Captcha và tự nộp link
    function monitorCaptcha() {
      if (isSubmitted) return;

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
        isSubmitted = true;
        updateHUD('Captcha hoàn tất! Đang gửi yêu cầu...', null, 'ready');

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
          if (btn && btn.offsetParent !== null) btn.click();
        }
      }
    }

    setInterval(() => {
      const backdrops = document.querySelectorAll('.modal-backdrop');
      for (const bd of backdrops) bd.remove();
      document.body.style.overflow = 'auto';

      mountHUD();
      autoDiscoverSponsorSite();
      monitorCaptcha();
    }, 500);

    return;
  }
})();
