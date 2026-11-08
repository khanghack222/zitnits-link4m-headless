/**
 * ⚡ LINK4M EXTENSION POPUP CONTROLLER ⚡
 */

document.addEventListener('DOMContentLoaded', () => {
  chrome.runtime.sendMessage({ type: 'GET_QUEST_STATE' }, (resp) => {
    if (resp && resp.quest) {
      const q = resp.quest;
      document.getElementById('pop-status').innerText = q.status || 'Chờ link...';
      document.getElementById('pop-domain').innerText = q.targetDomain || '--';
      document.getElementById('pop-code').innerText = q.code || '--';
    }
  });

  document.getElementById('btn-reload').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) chrome.tabs.reload(tabs[0].id);
    });
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'RESET_QUEST' }, () => {
      window.close();
    });
  });
});
