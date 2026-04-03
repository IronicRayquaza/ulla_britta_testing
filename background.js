chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'capture_visible') {
    chrome.scripting.executeScript({
      target: { tabId: request.tabId },
      func: () => {
        const style = document.createElement('style');
        style.id = 'temp-4k-hide-scroll';
        style.textContent = '::-webkit-scrollbar { display: none !important; } html, body { scrollbar-width: none !important; overflow: hidden !important; }';
        document.head.appendChild(style);
        return true;
      }
    }).then(() => {
      // Small timeout for layout to settle without scrollbars
      setTimeout(() => {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
          chrome.scripting.executeScript({
            target: { tabId: request.tabId },
            func: () => {
               const el = document.getElementById('temp-4k-hide-scroll');
               if (el) el.remove();
            }
          });
          downloadImage(dataUrl, 'screenshot_visible.png');
          sendResponse({ success: true });
        });
      }, 50);
    });
    return true;
  }

  if (request.action === 'capture_full') {
    chrome.scripting.executeScript({
      target: { tabId: request.tabId },
      files: ['content.js']
    }).then(() => {
      chrome.tabs.sendMessage(request.tabId, { action: 'start_full_capture' });
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'store_part') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      sendResponse({ dataUrl });
    });
    return true;
  }

  if (request.action === 'capture_complete') {
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'open_editor') {
    chrome.tabs.create({ url: 'editor.html' });
    sendResponse({ success: true });
    return true;
  }
});

function downloadImage(dataUrl, filename) {
  const date = new Date();
  const timestamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}-${String(date.getSeconds()).padStart(2, '0')}`;
  const finalFilename = filename.replace('.png', `_${timestamp}.png`);
  
  chrome.downloads.download({
    url: dataUrl,
    filename: `4K_Screenshots/${finalFilename}`,
    saveAs: false
  });

  // Save to storage and open editor
  chrome.storage.local.set({ latestScreenshot: dataUrl }, () => {
    chrome.tabs.create({ url: 'editor.html' });
  });
}