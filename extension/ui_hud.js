/**
 * ⚡ LINK4M PROMAX - SLEEK FLOATING BADGE ⚡
 * Ultra-clean, non-intrusive floating indicator.
 */

window.Link4MHUD = (function() {
  let badge = null;
  let textEl = null;
  let subTextEl = null;

  function initHUD() {
    if (document.getElementById('l4m-sleek-badge')) return;

    badge = document.createElement('div');
    badge.id = 'l4m-sleek-badge';
    badge.innerHTML = `
      <div class="l4m-badge-glow"></div>
      <div class="l4m-badge-icon">⚡</div>
      <div class="l4m-badge-content">
        <div class="l4m-badge-title" id="l4m-badge-title">LINK4M AUTO BYPASS</div>
        <div class="l4m-badge-status" id="l4m-badge-status">Đang chuẩn bị...</div>
      </div>
    `;

    document.body.appendChild(badge);
    textEl = document.getElementById('l4m-badge-status');
    subTextEl = document.getElementById('l4m-badge-title');
  }

  function setStatus(text, color = '#00f0ff') {
    if (!textEl) initHUD();
    if (textEl) {
      textEl.innerText = text;
      textEl.style.color = color;
    }
  }

  function log(msg, type = 'cyan') {
    console.log(`[Link4M Bypass] ${msg}`);
    const colors = {
      cyan: '#00f0ff',
      green: '#4ade80',
      orange: '#fb923c',
      purple: '#c084fc',
      red: '#f87171'
    };
    setStatus(msg, colors[type] || '#00f0ff');
  }

  return {
    init: initHUD,
    setStatus: setStatus,
    setDomain: () => {},
    setCode: () => {},
    showCaptchaAlert: () => {},
    log: log
  };
})();
