/**
 * Kimi Vision - Background Service Worker
 * Handles extension lifecycle and background tasks
 */

// Install event
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Kimi Vision installed');
    
    // Open options page on first install
    chrome.runtime.openOptionsPage();
  }
});

// Message handling from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureScreenshot') {
    captureActiveTabScreenshot()
      .then(dataUrl => sendResponse({ success: true, dataUrl }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async
  }
});

// Capture screenshot of active tab
async function captureActiveTabScreenshot() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab) {
    throw new Error('No active tab found');
  }
  
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
    format: 'png',
    quality: 90
  });
  
  return dataUrl;
}

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'capture_and_analyze') {
    // Trigger capture from keyboard shortcut
    chrome.action.openPopup();
  }
});
