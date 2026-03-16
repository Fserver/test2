// Background service worker for Language Validator extension

// Listen for installation
chrome.runtime.onInstalled.addListener(function(details) {
  console.log('Language Validator installed', details.reason);
  
  // Set default language preference
  if (details.reason === 'install') {
    chrome.storage.sync.set({ selectedLanguage: 'es' });
  }
});

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getLanguagePreference') {
    chrome.storage.sync.get(['selectedLanguage'], function(result) {
      sendResponse({ language: result.selectedLanguage || 'es' });
    });
    return true;
  }
});

console.log('Language Validator background service worker loaded');
