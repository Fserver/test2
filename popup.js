// Popup script for Language Validator extension

document.addEventListener('DOMContentLoaded', function() {
  const languageSelect = document.getElementById('languageSelect');
  const validateBtn = document.getElementById('validateBtn');
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');
  const resultList = document.getElementById('resultList');
  const totalElements = document.getElementById('totalElements');
  const correctElements = document.getElementById('correctElements');

  // Load saved language preference
  chrome.storage.sync.get(['selectedLanguage'], function(result) {
    if (result.selectedLanguage) {
      languageSelect.value = result.selectedLanguage;
    }
  });

  // Save language preference when changed
  languageSelect.addEventListener('change', function() {
    chrome.storage.sync.set({ selectedLanguage: languageSelect.value });
  });

  // Validate button click handler
  validateBtn.addEventListener('click', function() {
    const selectedLanguage = languageSelect.value;
    
    // Show loading, hide previous results
    loading.classList.remove('hidden');
    results.classList.add('hidden');
    resultList.innerHTML = '';

    // Get current tab
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const currentTab = tabs[0];
      
      // Send message to content script to analyze the page
      chrome.tabs.sendMessage(currentTab.id, { 
        action: 'analyzePage', 
        language: selectedLanguage 
      }, function(response) {
        loading.classList.add('hidden');
        results.classList.remove('hidden');
        
        if (chrome.runtime.lastError || !response) {
          resultList.innerHTML = `
            <div class="result-item result-error">
              Error: No se pudo analizar la página. Recarga la página e inténtalo de nuevo.
            </div>
          `;
          totalElements.textContent = '0';
          correctElements.textContent = '0';
          return;
        }
        
        displayResults(response);
      });
    });
  });

  function displayResults(data) {
    totalElements.textContent = data.total;
    correctElements.textContent = data.correct;
    
    let html = '';
    
    // Summary
    const percentage = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    let summaryClass = 'result-success';
    let summaryMessage = '';
    
    if (percentage === 100) {
      summaryMessage = `✅ ¡Perfecto! Todo el contenido está en ${data.language === 'es' ? 'español' : 'inglés'}.`;
    } else if (percentage >= 80) {
      summaryClass = 'result-warning';
      summaryMessage = `⚠️ La mayoría del contenido está en ${data.language === 'es' ? 'español' : 'inglés'} (${percentage}%).`;
    } else {
      summaryClass = 'result-error';
      summaryMessage = `❌ Solo el ${percentage}% del contenido está en ${data.language === 'es' ? 'español' : 'inglés'}.`;
    }
    
    html += `<div class="result-item ${summaryClass}">${summaryMessage}</div>`;
    
    // Detailed results (limit to first 20 issues)
    if (data.issues && data.issues.length > 0) {
      html += '<h4 style="margin: 15px 0 10px; font-size: 14px; color: #555;">Elementos con problemas:</h4>';
      
      data.issues.slice(0, 20).forEach(issue => {
        const truncatedText = issue.text.length > 100 ? issue.text.substring(0, 100) + '...' : issue.text;
        html += `
          <div class="result-item result-error">
            <strong>${issue.tag}</strong>: "${truncatedText}"<br>
            <small style="color: #666;">Detectado como: ${issue.detectedLang}</small>
          </div>
        `;
      });
      
      if (data.issues.length > 20) {
        html += `<div class="result-item result-warning">... y ${data.issues.length - 20} elementos más con problemas.</div>`;
      }
    }
    
    // If no issues
    if (data.issues && data.issues.length === 0) {
      html += '<div class="result-item result-success">✨ No se encontraron problemas de idioma.</div>';
    }
    
    resultList.innerHTML = html;
  }
});
