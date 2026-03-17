// Popup script for Language Validator extension

let currentResults = null;

document.addEventListener('DOMContentLoaded', function() {
  const languageSelect = document.getElementById('languageSelect');
  const validateBtn = document.getElementById('validateBtn');
  const clearHighlightsBtn = document.getElementById('clearHighlightsBtn');
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');
  const languageTab = document.getElementById('languageTab');
  const semanticTab = document.getElementById('semanticTab');
  const suggestionsTab = document.getElementById('suggestionsTab');
  const totalElements = document.getElementById('totalElements');
  const correctElements = document.getElementById('correctElements');
  const issuesCount = document.getElementById('issuesCount');
  
  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      
      // Update active tab
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      // Show corresponding content
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      if (tabName === 'language') {
        languageTab.classList.add('active');
      } else if (tabName === 'semantic') {
        semanticTab.classList.add('active');
      } else if (tabName === 'suggestions') {
        suggestionsTab.classList.add('active');
      }
    });
  });

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
    languageTab.innerHTML = '';
    semanticTab.innerHTML = '';
    suggestionsTab.innerHTML = '';

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
          languageTab.innerHTML = `
            <div class="result-item result-error">
              Error: No se pudo analizar la página. Recarga la página e inténtalo de nuevo.
            </div>
          `;
          totalElements.textContent = '0';
          correctElements.textContent = '0';
          issuesCount.textContent = '0';
          return;
        }
        
        currentResults = response;
        displayResults(response);
      });
    });
  });
  
  // Clear highlights button
  clearHighlightsBtn.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'clearAllHighlights' });
    });
  });

  function displayResults(data) {
    totalElements.textContent = data.total;
    correctElements.textContent = data.correct;
    const totalIssues = (data.issues ? data.issues.length : 0) + (data.semanticIssues ? data.semanticIssues.length : 0);
    issuesCount.textContent = totalIssues;
    
    // Language issues tab
    let languageHtml = '';
    
    // Summary
    const percentage = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    let summaryClass = 'result-success';
    let summaryMessage = '';
    
    if (percentage === 100 && (!data.issues || data.issues.length === 0)) {
      summaryMessage = `✅ ¡Perfecto! Todo el contenido está en ${data.language === 'es' ? 'español' : 'inglés'}.`;
    } else if (percentage >= 80) {
      summaryClass = 'result-warning';
      summaryMessage = `⚠️ La mayoría del contenido está en ${data.language === 'es' ? 'español' : 'inglés'} (${percentage}%).`;
    } else {
      summaryClass = 'result-error';
      summaryMessage = `❌ Solo el ${percentage}% del contenido está en ${data.language === 'es' ? 'español' : 'inglés'}.`;
    }
    
    languageHtml += `<div class="result-item ${summaryClass}">${summaryMessage}</div>`;
    
    // Language issues
    if (data.issues && data.issues.length > 0) {
      languageHtml += '<h4 style="margin: 15px 0 10px; font-size: 14px; color: #555;">Elementos con idioma incorrecto:</h4>';
      
      data.issues.forEach(issue => {
        const truncatedText = issue.text.length > 100 ? issue.text.substring(0, 100) + '...' : issue.text;
        languageHtml += `
          <div class="issue-item">
            <div class="issue-header">
              <div class="issue-title">
                <span class="semantic-badge badge-language">Idioma</span>
                &lt;${issue.tag}&gt;
              </div>
              <div class="issue-actions">
                <button class="issue-btn btn-highlight" onclick="toggleHighlight('${issue.id}', this)">
                  🔍 Resaltar
                </button>
              </div>
            </div>
            <div class="issue-text">"${escapeHtml(truncatedText)}"</div>
            <div class="issue-meta">Detectado como: ${issue.detectedLang} | Confianza: ${(issue.confidence * 100).toFixed(0)}%</div>
            ${issue.semanticIssues && issue.semanticIssues.length > 0 ? `
              <div class="suggestion-box">
                <strong>💡 Sugerencias adicionales:</strong><br>
                ${issue.semanticIssues.map(s => `• ${s.message}`).join('<br>')}
              </div>
            ` : ''}
          </div>
        `;
      });
    }
    
    if (data.issues && data.issues.length === 0) {
      languageHtml += '<div class="result-item result-success">✨ No se encontraron problemas de idioma.</div>';
    }
    
    languageTab.innerHTML = languageHtml;
    
    // Semantic issues tab
    let semanticHtml = '';
    if (data.semanticIssues && data.semanticIssues.length > 0) {
      semanticHtml += '<h4 style="margin: 15px 0 10px; font-size: 14px; color: #555;">Problemas semánticos y de escritura:</h4>';
      
      data.semanticIssues.forEach(issue => {
        const truncatedText = issue.text.length > 100 ? issue.text.substring(0, 100) + '...' : issue.text;
        semanticHtml += `
          <div class="issue-item">
            <div class="issue-header">
              <div class="issue-title">
                <span class="semantic-badge badge-semantic">Semántica</span>
                &lt;${issue.tag}&gt;
              </div>
              <div class="issue-actions">
                <button class="issue-btn btn-highlight" onclick="toggleHighlight('${issue.id}', this)">
                  🔍 Resaltar
                </button>
              </div>
            </div>
            <div class="issue-text">"${escapeHtml(truncatedText)}"</div>
        `;
        
        if (issue.semanticIssues && issue.semanticIssues.length > 0) {
          issue.semanticIssues.forEach(semIssue => {
            semanticHtml += `
              <div class="suggestion-box">
                <strong>${semIssue.type === 'suggestion' ? '💡 Sugerencia' : '⚠️ Problema'}:</strong> ${semIssue.message}
                ${semIssue.match ? `<br><small>Encontrado: "${escapeHtml(semIssue.match)}"</small>` : ''}
              </div>
            `;
          });
        }
        
        semanticHtml += '</div>';
      });
    } else {
      semanticHtml = '<div class="result-item result-success">✨ No se encontraron problemas semánticos.</div>';
    }
    
    semanticTab.innerHTML = semanticHtml;
    
    // Suggestions tab - aggregate all suggestions
    let suggestionsHtml = '';
    const allSuggestions = [];
    
    // Collect suggestions from language issues
    if (data.issues) {
      data.issues.forEach(issue => {
        if (issue.semanticIssues) {
          issue.semanticIssues.forEach(semIssue => {
            if (semIssue.type === 'suggestion') {
              allSuggestions.push({
                text: issue.text,
                suggestion: semIssue.message,
                tag: issue.tag
              });
            }
          });
        }
      });
    }
    
    // Collect suggestions from semantic issues
    if (data.semanticIssues) {
      data.semanticIssues.forEach(issue => {
        if (issue.semanticIssues) {
          issue.semanticIssues.forEach(semIssue => {
            if (semIssue.type === 'suggestion') {
              allSuggestions.push({
                text: issue.text,
                suggestion: semIssue.message,
                tag: issue.tag
              });
            }
          });
        }
      });
    }
    
    if (allSuggestions.length > 0) {
      suggestionsHtml += '<h4 style="margin: 15px 0 10px; font-size: 14px; color: #555;">Sugerencias de mejora:</h4>';
      
      allSuggestions.forEach((item, index) => {
        const truncatedText = item.text.length > 100 ? item.text.substring(0, 100) + '...' : item.text;
        suggestionsHtml += `
          <div class="issue-item">
            <div class="issue-title">
              <span class="semantic-badge badge-suggestion">Sugerencia</span>
              &lt;${item.tag}&gt;
            </div>
            <div class="issue-text">"${escapeHtml(truncatedText)}"</div>
            <div class="suggestion-box">
              <strong>💡 ${item.suggestion}</strong>
            </div>
          </div>
        `;
      });
    } else {
      suggestionsHtml = '<div class="result-item result-info">ℹ️ No hay sugerencias de mejora en este momento.</div>';
    }
    
    suggestionsTab.innerHTML = suggestionsHtml;
  }
  
  // Helper function to escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});

// Global function to toggle highlight (called from inline onclick)
function toggleHighlight(issueId, btn) {
  const isHighlighted = btn.classList.contains('btn-unhighlight');
  
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { 
      action: 'highlightElement', 
      issueId: issueId, 
      enable: !isHighlighted 
    }, function(response) {
      if (response && response.success) {
        if (!isHighlighted) {
          btn.textContent = '❌ Quitar resaltado';
          btn.classList.remove('btn-highlight');
          btn.classList.add('btn-unhighlight');
        } else {
          btn.textContent = '🔍 Resaltar';
          btn.classList.remove('btn-unhighlight');
          btn.classList.add('btn-highlight');
        }
      }
    });
  });
}
