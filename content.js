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
    articles: ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'al', 'del']
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
    articles: ['the', 'a', 'an', 'this', 'that', 'these', 'those']
  }
};

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

// Function to analyze the entire page
function analyzePage(targetLanguage) {
  const results = {
    total: 0,
    correct: 0,
    issues: [],
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

  // Analyze each element
  elements.forEach(element => {
    const text = extractTextFromElement(element);
    
    if (!text) {
      return;
    }

    results.total++;

    const detection = detectLanguage(text);
    
    if (!detection) {
      // Could not determine language, count as correct if it's very short or ambiguous
      results.correct++;
      return;
    }

    if (detection.lang === targetLanguage) {
      results.correct++;
    } else {
      // Only report issues with reasonable confidence
      if (detection.confidence > 0.6) {
        results.issues.push({
          tag: element.tagName.toLowerCase(),
          text: text.substring(0, 200),
          detectedLang: detection.lang === 'es' ? 'Español' : 'English',
          confidence: detection.confidence,
          class: element.className || '',
          id: element.id || ''
        });
      } else {
        results.correct++;
      }
    }
  });

  return results;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'analyzePage') {
    const targetLanguage = request.language || 'es';
    const results = analyzePage(targetLanguage);
    sendResponse(results);
  }
  return true;
});

// Log when content script is loaded
console.log('Language Validator content script loaded');
