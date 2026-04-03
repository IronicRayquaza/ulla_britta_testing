document.getElementById('capture-visible').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  setLoading(true);
  chrome.runtime.sendMessage({ action: 'capture_visible', tabId: tab.id }, () => {
    window.close();
  });
});

document.getElementById('capture-full').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  setLoading(true);
  chrome.runtime.sendMessage({ action: 'capture_full', tabId: tab.id }, () => {
    window.close();
  });
});

function setLoading(isLoading) {
  const btns = document.querySelectorAll('button');
  btns.forEach(btn => {
    btn.disabled = isLoading;
    if (isLoading) {
      if (!btn.dataset.originalHtml) {
        btn.dataset.originalHtml = btn.innerHTML;
      }
      btn.innerHTML = `<svg class="spin" style="width:16px;height:16px;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke-width="4" stroke="currentColor" style="opacity: 0.25;"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" style="opacity: 0.75; stroke: none;"></path></svg><span>Capturing...</span>`;
    } else {
      if (btn.dataset.originalHtml) {
        btn.innerHTML = btn.dataset.originalHtml;
      }
    }
  });
}