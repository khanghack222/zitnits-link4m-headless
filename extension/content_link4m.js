/**
 * ⚡ LINK4M AUTO BYPASS PROMAX - ENHANCED CONTENT SCRIPT ⚡
 * Seamlessly handles:
 *  1. Direct Mode (Links with only reCAPTCHA and no sponsor quest - e.g. /go/F2EnICG)
 *  2. Sponsor Quest Mode (Links requiring What-on / Gtraffic / Layma pass codes)
 *  3. Instant auto-redirect the moment destination is unlocked.
 */

(function() {
  console.log('[Link4M Bypass] Content script active on:', window.location.href);

  let currentSponsorDomain = null;
  let receivedCode = null;
  let isSubmitted = false;
  let isRedirecting = false;
  let pageMode = 'DETECTING'; // 'DIRECT' or 'SPONSOR'

  // Initialize UI HUD
  if (window.Link4MHUD && typeof window.Link4MHUD.init === 'function') {
    window.Link4MHUD.init();
    window.Link4MHUD.setStatus('Đang phân tích trang...');
  }

  // --- 1. Network Interception for API Responses ---
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url) {
    this._l4m_url = url;
    return originalXhrOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function() {
    this.addEventListener('load', function() {
      try {
        if (!this._l4m_url) return;

        // Check advertise response
        if (this._l4m_url.includes('get-advertise')) {
          const res = JSON.parse(this.responseText);
          if (res && res.success && res.data && res.data.html) {
            handleSponsorCampaign(res.data.html);
          } else {
            console.log('[Link4M Bypass] Không có nhiệm vụ tài trợ -> Chế độ link trực tiếp.');
            enableDirectMode();
          }
        }

        // Check captcha verification response
        if (this._l4m_url.includes('check-captcha') || this._l4m_url.includes('get-link-info')) {
          const res = JSON.parse(this.responseText);
          console.log('[Link4M Bypass] Nhận phản hồi API:', res);
          if (res && res.success && res.url) {
            onDestinationFound(res.url);
          }
        }
      } catch (e) {}
    });
    return originalXhrSend.apply(this, arguments);
  };

  // --- 2. Mode Handlers ---

  function enableDirectMode() {
    if (pageMode === 'DIRECT') return;
    pageMode = 'DIRECT';

    if (window.Link4MHUD) {
      window.Link4MHUD.setStatus('Chế độ: Link trực tiếp');
      window.Link4MHUD.setDomain('Không có (Bỏ qua tài trợ)');
      window.Link4MHUD.setCode('Không cần mã');
      window.Link4MHUD.log('Link không yêu cầu mã! Chỉ cần tích Captcha.', 'green');
    }

    // Scroll to reCAPTCHA so user can click it effortlessly
    scrollToCaptcha();
  }

  function handleSponsorCampaign(htmlContent) {
    pageMode = 'SPONSOR';
    if (window.Link4MHUD) {
      window.Link4MHUD.setStatus('Nhiệm vụ nhà tài trợ');
      window.Link4MHUD.log('Đã phát hiện chiến dịch quảng cáo', 'cyan');
    }

    const candidates = typeof unmaskDomainCandidates === 'function' ? unmaskDomainCandidates(htmlContent) : [];
    if (candidates && candidates.length > 0) {
      currentSponsorDomain = candidates[0];
      if (window.Link4MHUD) {
        window.Link4MHUD.setDomain(currentSponsorDomain);
        window.Link4MHUD.log(`Tìm thấy domain: ${currentSponsorDomain}`, 'green');
      }
      autoOpenSponsor();
    } else {
      const mKw = htmlContent.match(/từ kho[áa]\s*[:\-]?\s*<strong[^>]*>([^<]+)<\/strong>/i);
      if (mKw && mKw[1] && window.Link4MHUD) {
        window.Link4MHUD.log(`Từ khoá tìm kiếm: "${mKw[1].trim()}"`, 'purple');
      }
    }
  }

  function autoOpenSponsor() {
    if (!currentSponsorDomain) return;
    if (window.Link4MHUD) {
      window.Link4MHUD.setStatus('Mở trang tài trợ...');
      window.Link4MHUD.log(`Mở trang chạy ngầm: ${currentSponsorDomain}`, 'cyan');
    }

    chrome.runtime.sendMessage({
      type: 'OPEN_SPONSOR_TAB',
      domain: currentSponsorDomain
    }, (resp) => {
      if (resp && resp.success && window.Link4MHUD) {
        window.Link4MHUD.setStatus('Đang đếm ngược lấy mã...');
      }
    });
  }

  function scrollToCaptcha() {
    setTimeout(() => {
      const captchaEl = document.querySelector('#recaptcha, .g-recaptcha, iframe[src*="recaptcha"]');
      if (captchaEl) {
        captchaEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        captchaEl.style.outline = '3px solid #00f0ff';
        captchaEl.style.borderRadius = '8px';
        captchaEl.style.transition = 'all 0.3s ease';
      }
    }, 600);
  }

  // --- 3. Fill Code (for Sponsor Mode) ---
  function fillCode(code) {
    receivedCode = code;
    if (window.Link4MHUD) {
      window.Link4MHUD.setCode(code);
      window.Link4MHUD.log(`Đã nhận mã: ${code}`, 'green');
    }

    const inputs = document.querySelectorAll("input[name='password'], #password-2, #password, .password");
    inputs.forEach(inp => {
      inp.value = code;
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Remove ad overlays
    document.querySelectorAll('#ad_banner, .modal-backdrop, [class*="overlay"]').forEach(el => el.remove());

    verifyCaptchaAndSubmit();
  }

  // --- 4. Captcha Verification & Submission ---
  function verifyCaptchaAndSubmit() {
    if (isSubmitted || isRedirecting) return;

    let token = '';
    document.querySelectorAll('[name="g-recaptcha-response"], [name="cf-turnstile-response"]').forEach(el => {
      if (el.value && el.value.length > 20) token = el.value;
    });

    try {
      if (window.grecaptcha && typeof window.grecaptcha.getResponse === 'function') {
        const t = window.grecaptcha.getResponse();
        if (t && t.length > 20) token = t;
      }
    } catch (e) {}

    const hasCaptcha = document.querySelector('.g-recaptcha, #recaptcha, #recaptcha-2');

    if (hasCaptcha && !token) {
      if (window.Link4MHUD) {
        window.Link4MHUD.showCaptchaAlert(true);
        window.Link4MHUD.setStatus('⚠️ Vui lòng tick Captcha');
        window.Link4MHUD.log('Vui lòng tích vào ô reCAPTCHA trên màn hình...', 'orange');
      }
      scrollToCaptcha();
    } else {
      if (window.Link4MHUD) {
        window.Link4MHUD.showCaptchaAlert(false);
        window.Link4MHUD.log('Captcha đã sẵn sàng! Đang mở khóa link...', 'green');
      }
      submitForm();
    }
  }

  function submitForm() {
    if (isSubmitted) return;
    isSubmitted = true;
    if (window.Link4MHUD) {
      window.Link4MHUD.setStatus('Đang gửi...');
    }

    // Trigger main-form submit
    const f2 = document.querySelector('#main-form-2');
    if (f2) {
      const btn = f2.querySelector('button[type="submit"], input[type="submit"], #btn-main-2, .btn, .get-link');
      if (btn) btn.click();
    }

    const f1 = document.querySelector('#main-form');
    if (f1) {
      const btn = f1.querySelector('button[type="submit"], input[type="submit"], #btn-main, .btn, .get-link');
      if (btn) btn.click();
    }

    // Also trigger global functions if available
    try {
      if (typeof window.checkPassword === 'function') window.checkPassword();
      if (typeof window.checkCaptcha === 'function') window.checkCaptcha();
    } catch (e) {}
  }

  // --- 5. Destination Detection & Instant Auto-Redirect ---
  function onDestinationFound(destUrl) {
    if (isRedirecting) return;
    isRedirecting = true;

    console.log('[Link4M Bypass] 🎉 DESTINATION DETECTED:', destUrl);
    if (window.Link4MHUD) {
      window.Link4MHUD.setStatus('🎉 ĐÃ CÓ LINK ĐÍCH!');
      window.Link4MHUD.log(`Chuyển hướng ngay: ${destUrl}`, 'green');
    }

    chrome.runtime.sendMessage({
      type: 'LINK4M_COMPLETED',
      destinationUrl: destUrl
    });

    // Instant redirect
    setTimeout(() => {
      window.location.href = destUrl;
    }, 400);
  }

  // Watch for .get-link unlock or destination URL
  setInterval(() => {
    if (isRedirecting) return;

    // Check window.destination_url
    if (window.destination_url && window.destination_url.startsWith('http') && !window.destination_url.includes('link4m')) {
      onDestinationFound(window.destination_url);
      return;
    }

    // Check .get-link anchor
    const getLinkBtns = document.querySelectorAll('.get-link, a#get-link, a[href*="download"], #btn-get-link, .btn-success');
    getLinkBtns.forEach(btn => {
      const href = btn.getAttribute('href') || '';
      if (href.startsWith('http') && !href.includes('link4m') && !href.includes('about:blank')) {
        onDestinationFound(href);
        return;
      }
      // If button has become active (not disabled), auto-click it
      if (!btn.classList.contains('disabled') && !btn.hasAttribute('disabled')) {
        btn.click();
      }
    });

    // Check if captcha is checked in Direct Mode
    let hasToken = false;
    document.querySelectorAll('[name="g-recaptcha-response"]').forEach(el => {
      if (el.value && el.value.length > 20) hasToken = true;
    });

    if (hasToken && pageMode === 'DIRECT' && !isSubmitted) {
      if (window.Link4MHUD) {
        window.Link4MHUD.log('✅ Đã nhận Captcha! Đang lấy link đích...', 'green');
      }
      submitForm();
    }
  }, 400);

  // --- 6. Initial Page Inspection ---
  setTimeout(() => {
    // Check if page is already in Direct Mode
    const hasPasswordInput = document.querySelector("input[name='password'], #password-2, #password, .password");
    const hasRecaptcha = document.querySelector("#recaptcha, .g-recaptcha");

    if (!hasPasswordInput && hasRecaptcha) {
      enableDirectMode();
    } else if (hasPasswordInput) {
      pageMode = 'SPONSOR';
      if (window.Link4MHUD) {
        window.Link4MHUD.setStatus('Chờ nhập mã tài trợ...');
      }
    }
  }, 1000);

  // Listen to messages from background worker
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'STATUS_UPDATE' && window.Link4MHUD) {
      window.Link4MHUD.log(msg.detail, 'cyan');
    } else if (msg.type === 'FILL_CODE_AND_SUBMIT') {
      fillCode(msg.code);
    }
  });

})();
