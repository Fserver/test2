// Content script for Language Validator extension
// This script analyzes page content and detects language

// Language detection patterns for Spanish and English
const languagePatterns = {
  es: {
    // Common Spanish words (high frequency)
    commonWords: [
      'el', 'la', 'los', 'las', 'de', 'que', 'y', 'a', 'en', 'un', 'una', 'uno',
      'es', 'ser', 'estar', 'tener', 'hacer', 'poder', 'decir', 'este', 'esta',
      'esto', 'ese', 'esa', 'eso', 'su', 'sus', 'mi', 'mis', 'tu', 'tus', 'se',
      'por', 'con', 'para', 'sin', 'sobre', 'entre', 'hasta', 'desde', 'cuando',
      'donde', 'como', 'pero', 'porque', 'si', 'no', 'tambien', 'solo', 'mas',
      'muy', 'bien', 'asi', 'aqui', 'ahora', 'despues', 'antes', 'durante',
      'todos', 'todas', 'todo', 'toda', 'algo', 'nada', 'alguien', 'nadie',
      'cada', 'otro', 'otra', 'otros', 'otras', 'mismo', 'misma', 'mismos',
      'grande', 'pequeno', 'bueno', 'malo', 'nuevo', 'viejo', 'primero', 'ultimo'
    ],
    // Spanish-specific characters and combinations
    specialChars: ['ñ', 'á', 'é', 'í', 'ó', 'ú', '¿', '¡'],
    // Spanish verb endings
    verbEndings: ['ar', 'er', 'ir', 'ado', 'ido', 'ando', 'iendo', 'aba', 'ia'],
    // Spanish articles and pronouns
    articles: ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'al', 'del'],
    // Semantic issues patterns (incomplete or unclear phrases)
    semanticIssues: [
      { pattern: /\b[a-zA-Z]+\s{2,}[a-zA-Z]+\b/g, type: 'spacing', message: 'Espacios excesivos entre palabras' },
      { pattern: /[0-9]{4,}/g, type: 'numbers', message: 'Números sin contexto claro' },
      { pattern: /\b(www\.|http[s]?:\/\/)\S*\b/g, type: 'urls', message: 'URLs sin texto descriptivo' },
      { pattern: /\b[A-Z]{5,}\b/g, type: 'caps', message: 'Posible uso excesivo de mayúsculas' },
      { pattern: /\.{3,}/g, type: 'ellipsis', message: 'Puntos suspensivos excesivos' },
      { pattern: /^\s*[aeiou]\s*$/i, type: 'fragment', message: 'Fragmento incompleto' }
    ],
    // Writing suggestions for Spanish
    writingSuggestions: [
      { issue: 'redundancia', keywords: ['actualmente', 'hoy en día', 'en la actualidad'], suggestion: 'Considera usar una sola expresión temporal' },
      { issue: 'dequeismo', pattern: /\bde que\b/g, suggestion: 'Verifica si es necesario "de que" o solo "que"' },
      { issue: 'quesuismo', pattern: /\bque su\b/g, suggestion: 'Verifica la construcción de la frase' }
    ]
  },
  en: {
    // Common English words (high frequency)
    commonWords: [
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it',
      'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but',
      'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will',
      'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out',
      'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can',
      'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into',
      'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than',
      'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
      'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way'
    ],
    // English-specific patterns
    specialChars: [],
    // Common English verb endings
    verbEndings: ['ing', 'ed', 'ly', 'tion', 'sion', 'ment', 'ness', 'ful', 'less'],
    // English articles and pronouns
    articles: ['the', 'a', 'an', 'this', 'that', 'these', 'those'],
    // Semantic issues patterns (incomplete or unclear phrases)
    semanticIssues: [
      { pattern: /\b[a-zA-Z]+\s{2,}[a-zA-Z]+\b/g, type: 'spacing', message: 'Excessive spaces between words' },
      { pattern: /[0-9]{4,}/g, type: 'numbers', message: 'Numbers without clear context' },
      { pattern: /\b(www\.|http[s]?:\/\/)\S*\b/g, type: 'urls', message: 'URLs without descriptive text' },
      { pattern: /\b[A-Z]{5,}\b/g, type: 'caps', message: 'Possible excessive use of capitals' },
      { pattern: /\.{3,}/g, type: 'ellipsis', message: 'Excessive ellipsis' },
      { pattern: /^\s*[aeiou]\s*$/i, type: 'fragment', message: 'Incomplete fragment' }
    ],
    // Writing suggestions for English
    writingSuggestions: [
      { issue: 'passive_voice', pattern: /\b(was|were|is|are|been)\s+\w+ed\b/g, suggestion: 'Consider using active voice for clarity' },
      { issue: 'wordiness', keywords: ['in order to', 'due to the fact that', 'at this point in time'], suggestion: 'Consider simplifying this phrase' },
      { issue: 'redundancy', keywords: ['absolutely certain', 'completely eliminate', 'totally obvious'], suggestion: 'Remove redundant intensifier' }
    ]
  }
};

// Function to analyze semantic issues and provide writing suggestions
function analyzeSemantics(text, targetLanguage) {
  const issues = [];
  const patterns = languagePatterns[targetLanguage];
  
  if (!patterns) {
    return issues;
  }
  
  // Check semantic issues
  if (patterns.semanticIssues) {
    for (const semanticIssue of patterns.semanticIssues) {
      const matches = text.match(semanticIssue.pattern);
      if (matches && matches.length > 0) {
        issues.push({
          type: 'semantic',
          subtype: semanticIssue.type,
          message: semanticIssue.message,
          match: matches[0].substring(0, 50),
          severity: 'warning'
        });
      }
    }
  }
  
  // Check writing suggestions
  if (patterns.writingSuggestions) {
    for (const suggestion of patterns.writingSuggestions) {
      let found = false;
      
      // Check by keywords
      if (suggestion.keywords) {
        for (const keyword of suggestion.keywords) {
          if (text.toLowerCase().includes(keyword.toLowerCase())) {
            found = true;
            break;
          }
        }
      }
      
      // Check by pattern
      if (suggestion.pattern && !found) {
        const matches = text.match(suggestion.pattern);
        if (matches && matches.length > 0) {
          found = true;
        }
      }
      
      if (found) {
        issues.push({
          type: 'suggestion',
          subtype: suggestion.issue,
          message: suggestion.suggestion,
          match: '',
          severity: 'info'
        });
      }
    }
  }
  
  // Check for incomplete sentences (basic heuristic)
  const trimmedText = text.trim();
  if (trimmedText.length > 10) {
    const hasEndPunctuation = /[.!?]$/.test(trimmedText);
    const startsWithCapital = /^[A-ZÁÉÍÓÚÑ]/.test(trimmedText);
    
    if (!hasEndPunctuation && !trimmedText.endsWith(':') && !trimmedText.endsWith(',')) {
      // Check if it looks like a complete thought
      const wordCount = trimmedText.split(/\s+/).length;
      if (wordCount > 5 && !startsWithCapital) {
        issues.push({
          type: 'semantic',
          subtype: 'incomplete',
          message: targetLanguage === 'es' ? 'Posible frase incompleta o sin contexto' : 'Possible incomplete or out-of-context phrase',
          match: trimmedText.substring(0, 50) + '...',
          severity: 'warning'
        });
      }
    }
  }
  
  return issues;
}

// Function to detect language of a text
function detectLanguage(text, minLength = 3) {
  if (!text || text.trim().length < minLength) {
    return null;
  }

  const cleanText = text.toLowerCase().trim();
  const words = cleanText.split(/\s+/).filter(word => word.length >= 2);
  
  if (words.length === 0) {
    return null;
  }

  let spanishScore = 0;
  let englishScore = 0;

  // Check for special characters
  for (const char of text) {
    if (languagePatterns.es.specialChars.includes(char)) {
      spanishScore += 2;
    }
  }

  // Check each word
  for (const word of words) {
    // Remove punctuation
    const cleanWord = word.replace(/[^\w]/g, '');
    
    if (languagePatterns.es.commonWords.includes(cleanWord)) {
      spanishScore += 1.5;
    }
    if (languagePatterns.en.commonWords.includes(cleanWord)) {
      englishScore += 1.5;
    }

    // Check verb endings
    for (const ending of languagePatterns.es.verbEndings) {
      if (cleanWord.endsWith(ending) && cleanWord.length > ending.length + 2) {
        spanishScore += 0.5;
        break;
      }
    }
    for (const ending of languagePatterns.en.verbEndings) {
      if (cleanWord.endsWith(ending) && cleanWord.length > ending.length + 2) {
        englishScore += 0.5;
        break;
      }
    }
  }

  // Check articles (strong indicator)
  const firstWord = words[0] ? words[0].replace(/[^\w]/g, '') : '';
  if (languagePatterns.es.articles.includes(firstWord)) {
    spanishScore += 2;
  }
  if (languagePatterns.en.articles.includes(firstWord)) {
    englishScore += 2;
  }

  // Determine language based on scores
  if (spanishScore === 0 && englishScore === 0) {
    return null;
  }

  if (spanishScore > englishScore) {
    return { lang: 'es', confidence: spanishScore / (spanishScore + englishScore + 0.1) };
  } else if (englishScore > spanishScore) {
    return { lang: 'en', confidence: englishScore / (spanishScore + englishScore + 0.1) };
  } else {
    return null;
  }
}

// Function to extract text content from elements
function extractTextFromElement(element) {
  // Skip script, style, and other non-content elements
  const skipTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'SVG', 'CANVAS'];
  if (skipTags.includes(element.tagName)) {
    return null;
  }

  // Get direct text content (not from children)
  let text = '';
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent;
    }
  }

  text = text.trim();
  
  // Filter out very short texts or just numbers/symbols
  if (text.length < 3 || /^[\d\s\W]+$/.test(text)) {
    return null;
  }

  return text;
}

// Store for highlighted elements and issue tracking
let highlightedElements = [];
let allIssuesMap = new Map(); // Map to store all issues with unique IDs
let currentTargetLanguage = 'es';

// Function to analyze the entire page
function analyzePage(targetLanguage) {
  currentTargetLanguage = targetLanguage;
  const results = {
    total: 0,
    correct: 0,
    issues: [],
    semanticIssues: [],
    language: targetLanguage
  };

  // Get all text-containing elements
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        const text = node.textContent.trim();
        if (text.length < 3) {
          return NodeFilter.FILTER_REJECT;
        }
        // Skip whitespace-only nodes
        if (/^\s*$/.test(text)) {
          return NodeFilter.FILTER_REJECT;
        }
        // Skip script and style content
        const parent = node.parentElement;
        if (parent && ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const analyzedNodes = new Set();
  const elements = [];

  // Collect text nodes
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    
    if (parent && !analyzedNodes.has(parent)) {
      analyzedNodes.add(parent);
      elements.push(parent);
    }
  }

  // Also check specific elements that might contain important text
  const importantSelectors = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'span', 'div', 'li', 'td', 'th',
    'button', 'input[type="submit"]', 'input[type="button"]',
    'label', 'a', 'strong', 'em', 'blockquote', 'cite'
  ];

  importantSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      if (!analyzedNodes.has(el)) {
        analyzedNodes.add(el);
        elements.push(el);
      }
    });
  });

  // Clear previous issues map
  allIssuesMap.clear();
  let issueCounter = 0;

  // Analyze each element
  elements.forEach(element => {
    const text = extractTextFromElement(element);
    
    if (!text) {
      return;
    }

    results.total++;

    const detection = detectLanguage(text);
    const semantics = analyzeSemantics(text, targetLanguage);
    
    // Create unique ID for this element's issues
    const elementId = `${element.tagName}-${issueCounter++}`;
    
    if (!detection) {
      // Could not determine language, count as correct if it's very short or ambiguous
      results.correct++;
      return;
    }

    if (detection.lang === targetLanguage) {
      // Language is correct, but check for semantic issues
      if (semantics && semantics.length > 0) {
        const issueData = {
          id: elementId,
          tag: element.tagName.toLowerCase(),
          text: text.substring(0, 200),
          type: 'semantic',
          semanticIssues: semantics,
          class: element.className || '',
          id: element.id || '',
          highlighted: false,
          element: element // Store reference for highlighting
        };
        results.semanticIssues.push(issueData);
        allIssuesMap.set(elementId, issueData);
      } else {
        results.correct++;
      }
    } else {
      // Only report issues with reasonable confidence
      if (detection.confidence > 0.6) {
        const issueData = {
          id: elementId,
          tag: element.tagName.toLowerCase(),
          text: text.substring(0, 200),
          detectedLang: detection.lang === 'es' ? 'Español' : 'English',
          confidence: detection.confidence,
          class: element.className || '',
          id: element.id || '',
          type: 'language',
          highlighted: false,
          element: element, // Store reference for highlighting
          semanticIssues: semantics && semantics.length > 0 ? semantics : undefined
        };
        results.issues.push(issueData);
        allIssuesMap.set(elementId, issueData);
      } else {
        // Language unclear but check semantics
        if (semantics && semantics.length > 0) {
          const issueData = {
            id: elementId,
            tag: element.tagName.toLowerCase(),
            text: text.substring(0, 200),
            type: 'semantic',
            semanticIssues: semantics,
            class: element.className || '',
            id: element.id || '',
            highlighted: false,
            element: element
          };
          results.semanticIssues.push(issueData);
          allIssuesMap.set(elementId, issueData);
        } else {
          results.correct++;
        }
      }
    }
  });

  return results;
}

// Function to highlight an element in the DOM
function highlightElement(issueId, enable = true) {
  const issueData = allIssuesMap.get(issueId);
  if (!issueData || !issueData.element) {
    return false;
  }

  const element = issueData.element;
  
  if (enable) {
    // Add highlight style
    const originalBg = element.style.backgroundColor;
    const originalBorder = element.style.border;
    
    element.setAttribute('data-original-bg', originalBg);
    element.setAttribute('data-original-border', originalBorder);
    element.setAttribute('data-issue-id', issueId);
    
    element.style.backgroundColor = '#ffeb3b';
    element.style.border = '2px solid #f44336';
    element.style.outline = '2px solid #f44336';
    element.style.outlineOffset = '2px';
    element.style.transition = 'all 0.3s ease';
    
    issueData.highlighted = true;
    
    // Scroll into view smoothly
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    // Remove highlight
    const originalBg = element.getAttribute('data-original-bg');
    const originalBorder = element.getAttribute('data-original-border');
    
    element.style.backgroundColor = originalBg || '';
    element.style.border = originalBorder || '';
    element.style.outline = '';
    element.style.outlineOffset = '';
    
    element.removeAttribute('data-original-bg');
    element.removeAttribute('data-original-border');
    element.removeAttribute('data-issue-id');
    
    issueData.highlighted = false;
  }
  
  return true;
}

// Function to clear all highlights
function clearAllHighlights() {
  allIssuesMap.forEach((issueData, issueId) => {
    if (issueData.highlighted) {
      highlightElement(issueId, false);
    }
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'analyzePage') {
    const targetLanguage = request.language || 'es';
    const results = analyzePage(targetLanguage);
    // Don't send element references in response
    const cleanResults = {
      ...results,
      issues: results.issues.map(i => ({ ...i, element: undefined })),
      semanticIssues: results.semanticIssues.map(i => ({ ...i, element: undefined }))
    };
    sendResponse(cleanResults);
  } else if (request.action === 'highlightElement') {
    const success = highlightElement(request.issueId, request.enable);
    sendResponse({ success });
  } else if (request.action === 'clearAllHighlights') {
    clearAllHighlights();
    sendResponse({ success: true });
  }
  return true;
});

// Log when content script is loaded
console.log('Language Validator content script loaded');
