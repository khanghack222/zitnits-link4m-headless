/**
 * ⚡ SPONSOR ANTI-AFK & INCOGNITO BYPASS PATCH ⚡
 * Runs at document_start in the MAIN world to neutralize widget pauses.
 */

(function() {
  try {
    // 1. Bypass incognito detection
    if (window.navigator && window.navigator.webkitTemporaryStorage) {
      window.navigator.webkitTemporaryStorage.queryUsageAndQuota = function(callback) {
        if (typeof callback === 'function') {
          callback(0, 100 * 1024 * 1024 * 1024); // 100GB fake quota
        }
      };
    }

    // 2. Prevent timer freeze on tab switch (Page Visibility API override)
    Object.defineProperty(document, 'hidden', {
      get: () => false,
      configurable: true
    });
    Object.defineProperty(document, 'visibilityState', {
      get: () => 'visible',
      configurable: true
    });

    // 3. Keep pageYOffset moving smoothly so mouse_scroll / scroll checks pass
    let dynamicScrollY = 800;
    Object.defineProperty(window, 'pageYOffset', {
      get: () => {
        dynamicScrollY += (Math.random() > 0.5 ? 5 : -3);
        return dynamicScrollY;
      },
      configurable: true
    });

    // 4. Dispatch artificial scroll pulses every 300ms
    setInterval(() => {
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('mousemove'));
    }, 350);

  } catch (err) {
    console.debug('[Link4M Bypass] Patch error:', err);
  }
})();
