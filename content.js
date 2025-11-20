let snippets = [];
let activeEl = null;
let ui = null;
let filteredSuggestions = [];
let highlightIndex = -1;
const MAX_PREVIEW_LENGTH = 80;
const MENU_WIDTH = 380;
const MENU_MAX_HEIGHT = 400;

// Check if we're in an iframe
let inIframe = false;
try {
  inIframe = window.self !== window.top;
} catch (e) {
  inIframe = true;
}

console.log('Layla\'s Snips: Content script loaded', inIframe ? '(in iframe)' : '(main frame)');

// --- Snippet Storage Logic ---

function loadSnippets() {
  // CHANGED: Use chrome.storage.local for unlimited storage
  chrome.storage.local.get({ snippets: [] }, (cfg) => {
    snippets = cfg.snippets || [];
    console.log('Layla\'s Snips: Loaded', snippets.length, 'snippets');
  });
}
loadSnippets();

chrome.storage.onChanged.addListener((changes, area) => {
  // CHANGED: Listen to 'local' instead of 'sync'
  if (area === "local" && changes.snippets) {
    snippets = changes.snippets.newValue || [];
    hideSuggestion();
  }
});

// --- Utility Functions ---

function isEditable(el) {
  if (!el) return false;
  if (el.tagName === "TEXTAREA") return true;
  if (el.tagName === "INPUT" && (el.type === "text" || el.type === "search" || el.type === "email" || el.type === "url")) return true;
  if (el.isContentEditable) return true;
  if (el.getAttribute && el.getAttribute('contenteditable') === 'true') return true;
  
  // Salesforce-specific checks for rich text editors
  if (el.classList && (
    el.classList.contains('cke_editable') || 
    el.classList.contains('ql-editor') ||
    el.classList.contains('slds-rich-text-editor__textarea') ||
    el.classList.contains('cke_wysiwyg_div') ||
    el.classList.contains('cke_contents_ltr') ||
    el.classList.contains('cke_editable_themed')
  )) {
    return true;
  }
  
  // Check for role="textbox"
  if (el.getAttribute && el.getAttribute('role') === 'textbox') {
    return true;
  }
  
  // Check if it's a body with design mode on
  if (el.tagName === 'BODY' && el.ownerDocument && el.ownerDocument.designMode === 'on') {
    return true;
  }
  
  // Check if inside a contenteditable parent (Salesforce often nests editors)
  let parent = el.parentElement;
  while (parent) {
    if (parent.isContentEditable || parent.getAttribute('contenteditable') === 'true') {
      return true;
    }
    if (parent.classList && (
      parent.classList.contains('cke_editable') ||
      parent.classList.contains('ql-editor')
    )) {
      return true;
    }
    parent = parent.parentElement;
  }
  
  return false;
}

function getWordBeforeCaret(el) {
  let text = "";
  if (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && el.type === "text")) {
    const start = el.selectionStart;
    text = el.value.slice(0, start);
  } else if (el.isContentEditable || el.getAttribute('contenteditable') === 'true' || (el.tagName === 'BODY' && el.ownerDocument && el.ownerDocument.designMode === 'on')) {
    // CRITICAL: Use the correct window context for selection
    const win = el.ownerDocument.defaultView || window;
    const sel = win.getSelection();
    if (!sel || !sel.anchorNode) return "";
    
    try {
      const range = sel.getRangeAt(0).cloneRange();
      range.collapse(true);
      
      // Get the text node
      const node = range.startContainer;
      if (node.nodeType === 3) { // Text node
        text = node.textContent.substring(0, range.startOffset);
      } else {
        // Try to get text from the element
        const tempRange = el.ownerDocument.createRange();
        tempRange.selectNodeContents(el);
        tempRange.setEnd(range.startContainer, range.startOffset);
        text = tempRange.toString();
      }
    } catch (e) {
      console.log('Layla\'s Snips: Error getting text before caret:', e);
      return "";
    }
  }

  // Look for the last backslash followed by any characters
  const m = text.match(/(\\.*)$/);
  return m ? m[1].toLowerCase().trim() : "";
}

function findMatchingSnippets(typedTrigger) {
  if (typedTrigger.length < 2 || typedTrigger[0] !== '\\') {
    return [];
  }
  const cleanTrigger = typedTrigger.slice(1).trim();

  return snippets
    .filter(s => s.trigger && s.trigger.toLowerCase().includes(cleanTrigger))
    .sort((a, b) => a.trigger.toLowerCase().indexOf(cleanTrigger) - b.trigger.toLowerCase().indexOf(cleanTrigger));
}

function getAbsoluteCaretPosition(el) {
  if (!el) return null;
  
  // CRITICAL: Use the correct window context
  const win = el.ownerDocument.defaultView || window;
  const sel = win.getSelection();
  if (!sel || !sel.rangeCount) return null;

  try {
    const r = sel.getRangeAt(0).cloneRange();
    r.collapse(true);
    
    // Create a temporary span to get position
    const span = el.ownerDocument.createElement('span');
    span.appendChild(el.ownerDocument.createTextNode('\u200b'));
    r.insertNode(span);
    const rect = span.getBoundingClientRect();
    
    // Clean up
    if (span.parentNode) {
      span.parentNode.removeChild(span);
      // Normalize to merge text nodes
      sel.anchorNode?.parentNode?.normalize();
    }
    
    // Convert to absolute position relative to the top window
    let finalLeft = rect.left;
    let finalTop = rect.top;
    let finalBottom = rect.bottom;
    
    // If element is in an iframe, we need to add the iframe's offset
    let currentWindow = win;
    try {
      while (currentWindow !== window.top) {
        const frameElement = currentWindow.frameElement;
        if (frameElement) {
          const frameRect = frameElement.getBoundingClientRect();
          finalLeft += frameRect.left;
          finalTop += frameRect.top;
          finalBottom += frameRect.top;
          currentWindow = currentWindow.parent;
        } else {
          break;
        }
      }
    } catch (e) {
      console.log('Layla\'s Snips: Could not calculate iframe offset:', e);
    }
    
    return {
      left: finalLeft,
      top: finalTop,
      bottom: finalBottom
    };
  } catch (e) {
    console.log('Layla\'s Snips: Error getting caret position:', e);
    return null;
  }
}

// --- UI Management ---

function getTopWindow() {
  try {
    return window.top;
  } catch (e) {
    return window;
  }
}

function ensureUI() {
  // CRITICAL: Always create UI in the TOP window, never in an iframe
  const topWindow = getTopWindow();
  const topDoc = topWindow.document;
  
  // Check if UI already exists in top window
  if (topDoc.getElementById('laylas-snips-ui')) {
    ui = topDoc.getElementById('laylas-snips-ui');
    return ui;
  }
  
  ui = topDoc.createElement("div");
  ui.id = "laylas-snips-ui";
  ui.style.cssText = `
    position: fixed;
    pointer-events: auto;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 2147483647;
    width: ${MENU_WIDTH}px;
    max-height: ${MENU_MAX_HEIGHT}px;
    overflow-y: auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Arial', sans-serif;
    color: #333;
    display: none;
    padding: 0;
  `;

  const container = topDoc.body || topDoc.documentElement;
  container.appendChild(ui);
  console.log('Layla\'s Snips: UI created in TOP window');
  return ui;
}

function hideSuggestion() {
  if (ui) {
    ui.style.display = "none";
    ui.innerHTML = '';
  }
  filteredSuggestions = [];
  highlightIndex = -1;
}

function renderSuggestions(position) {
  const menu = ensureUI();

  if (filteredSuggestions.length === 0) {
    return hideSuggestion();
  }

  console.log('Layla\'s Snips: Rendering', filteredSuggestions.length, 'suggestions at position:', position);

  // Clear previous content
  menu.innerHTML = '';

  filteredSuggestions.forEach((snippet, index) => {
    const item = document.createElement('div');
    item.dataset.index = index;
    item.style.cssText = `
      padding: 12px 16px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      border-bottom: 1px solid #eee;
      transition: background-color 0.15s;
      user-select: none;
    `;

    if (index === highlightIndex) {
      item.style.backgroundColor = '#e3f2fd';
    }

    // Trigger and Handle (on same line)
    const triggerText = document.createElement('div');
    triggerText.textContent = `\\${snippet.trigger}`;
    if (snippet.handle) {
      triggerText.textContent += ` - ${snippet.handle}`;
    }
    triggerText.style.cssText = `
      font-weight: 600;
      color: #0066a1;
      margin-bottom: 6px;
      pointer-events: none;
    `;

    item.appendChild(triggerText);

    // Body preview
    const bodyPreview = document.createElement('div');
    // Strip HTML tags for preview
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = snippet.body || '';
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    const previewText = plainText.substring(0, MAX_PREVIEW_LENGTH) + (plainText.length > MAX_PREVIEW_LENGTH ? '...' : '');
    bodyPreview.textContent = previewText.replace(/\n/g, ' ');
    bodyPreview.style.cssText = `
      font-size: 13px;
      color: #666;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      pointer-events: none;
    `;

    item.appendChild(bodyPreview);

    // Mouse events
    item.addEventListener('mouseenter', (e) => {
      highlightIndex = index;
      renderSuggestions(position);
    });

    item.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Layla\'s Snips: Item mousedown:', snippet.trigger);
      insertSnippet(snippet);
    });

    menu.appendChild(item);
  });

  // Footer
  const footer = document.createElement('div');
  footer.style.cssText = `
    padding: 8px 16px;
    background: #f5f5f5;
    font-size: 12px;
    color: #666;
    border-top: 1px solid #ddd;
    pointer-events: none;
  `;
  footer.textContent = `↑ ↓ to navigate • Enter/Tab to select • Esc to dismiss`;
  menu.appendChild(footer);

  // SMART POSITIONING: Ensure menu is always fully visible on screen
  if (position) {
    menu.style.display = 'block';
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate approximate menu height based on number of items
    // Each item is ~60px + footer is ~40px
    const estimatedMenuHeight = Math.min(MENU_MAX_HEIGHT, filteredSuggestions.length * 60 + 40);
    
    // Calculate available space in all directions
    const spaceBelow = viewportHeight - position.bottom;
    const spaceAbove = position.top;
    const spaceRight = viewportWidth - position.left;
    
    // Determine vertical position (above or below)
    let finalTop;
    if (spaceBelow >= estimatedMenuHeight) {
      // Enough space below - show below
      finalTop = position.bottom + 5;
      console.log('Layla\'s Snips: Showing menu BELOW cursor');
    } else if (spaceAbove >= estimatedMenuHeight) {
      // Not enough space below, but enough above - show above
      finalTop = position.top - estimatedMenuHeight - 5;
      console.log('Layla\'s Snips: Showing menu ABOVE cursor');
    } else {
      // Not enough space either way - use the side with more space
      if (spaceAbove > spaceBelow) {
        finalTop = 10; // Pin to top with small margin
        console.log('Layla\'s Snips: Pinning menu to TOP of viewport');
      } else {
        finalTop = position.bottom + 5;
        console.log('Layla\'s Snips: Showing menu BELOW cursor (will scroll)');
      }
    }
    
    // Determine horizontal position (ensure it doesn't go off right edge)
    let finalLeft = position.left;
    if (spaceRight < MENU_WIDTH) {
      // Not enough space on right - align to right edge of viewport
      finalLeft = viewportWidth - MENU_WIDTH - 10;
      console.log('Layla\'s Snips: Adjusting menu LEFT to fit in viewport');
    }
    
    // Make sure menu doesn't go off left edge
    if (finalLeft < 10) {
      finalLeft = 10;
    }
    
    // Make sure menu doesn't go off top edge
    if (finalTop < 10) {
      finalTop = 10;
    }
    
    menu.style.left = finalLeft + 'px';
    menu.style.top = finalTop + 'px';
    
    console.log('Layla\'s Snips: Final position - left:', finalLeft, 'top:', finalTop);
  }
}

// --- Snippet Insertion ---

function htmlToPlainText(html) {
  // Create a temporary div to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Replace ALL block elements with newlines before them
  const blockElements = temp.querySelectorAll('div, p, h1, h2, h3, h4, h5, h6, li, tr');
  blockElements.forEach(el => {
    // Add newline before block element if it has a previous sibling
    if (el.previousSibling && el.previousSibling.nodeType !== 8) { // 8 = comment node
      el.insertAdjacentText('beforebegin', '\n');
    }
  });
  
  // Replace <br> tags with newlines
  temp.querySelectorAll('br').forEach(br => {
    br.replaceWith('\n');
  });
  
  // Get text content
  let text = temp.textContent || temp.innerText || '';
  
  // Clean up ONLY:
  // - Remove spaces immediately before/after newlines
  // - Limit to max 2 consecutive newlines
  text = text.replace(/ \n/g, '\n'); // Remove spaces before newlines
  text = text.replace(/\n /g, '\n'); // Remove spaces after newlines  
  text = text.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
  
  // Trim leading/trailing whitespace
  text = text.trim();
  
  return text;
}

// Helper function to convert HTML to plain text with line breaks (for Smartsheets)
// Smartsheets needs PURE plain text - no HTML tags at all, just text with line breaks
function convertToPlainTextWithBreaks(html) {
  // Use our existing htmlToPlainText function which properly preserves line breaks
  return htmlToPlainText(html);
}

// Detect if we're in Smartsheets or Google Sheets
// Both need plain text with line breaks because they strip HTML on save/enter
function isSmartsheet() {
  const hostname = window.location.hostname;
  return hostname.includes('smartsheet.com');
}

function isGoogleSheets() {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  return hostname.includes('docs.google.com') && pathname.includes('/spreadsheets/');
}

function insertSnippet(snippet) {
  console.log('Layla\'s Snips: Inserting snippet:', snippet.trigger);

  if (!activeEl) {
    console.log('Layla\'s Snips: No active element');
    hideSuggestion();
    return;
  }

  const typedTrigger = getWordBeforeCaret(activeEl);
  const triggerLength = typedTrigger.length;

  // Handle textarea/input - use PLAIN TEXT
  if (activeEl.tagName === "TEXTAREA" || (activeEl.tagName === "INPUT" && activeEl.type === "text")) {
    // Convert HTML to plain text with preserved line breaks
    let body = htmlToPlainText(snippet.body);

    // Replace ${date} and ${date:format}
    const dateRegex = /\$\{date(?::([^}]+))?\}/g;
    body = body.replace(dateRegex, (match, format) => {
      const now = new Date();
      if (format) {
        // Handle all date formats
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const yyyy = now.getFullYear();
        const yy = String(yyyy).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const monthName = monthNames[now.getMonth()];
        const monthShortName = monthShort[now.getMonth()];
        
        return format
          .replace('YYYY', yyyy)
          .replace('YY', yy)
          .replace('MMMM', monthName)
          .replace('MMM', monthShortName)
          .replace('MM', mm)
          .replace('DD', dd);
      }
      return now.toLocaleDateString();
    });

    // Replace ${url}
    body = body.replace(/\$\{url\}/g, window.location.href);

    // Replace ${title}
    body = body.replace(/\$\{title\}/g, document.title);

    // Check for ${cursor} placeholder
    const cursorIndex = body.indexOf('${cursor}');
    const hasCursorPlaceholder = cursorIndex !== -1;
    
    if (hasCursorPlaceholder) {
      body = body.replace(/\$\{cursor\}/g, '');
    }

    const start = activeEl.selectionStart;
    const text = activeEl.value;
    const before = text.slice(0, start - triggerLength);
    const after = text.slice(start);
    
    activeEl.value = before + body + after;
    
    let caret;
    if (hasCursorPlaceholder) {
      caret = before.length + cursorIndex;
    } else {
      caret = before.length + body.length;
    }
    
    activeEl.setSelectionRange(caret, caret);
    activeEl.dispatchEvent(new Event('input', { bubbles: true }));
    activeEl.dispatchEvent(new Event('change', { bubbles: true }));
    activeEl.focus();
    console.log('Layla\'s Snips: Snippet inserted (plain text with preserved formatting)');
  }
  // Handle contenteditable
  else if (activeEl.isContentEditable || activeEl.getAttribute('contenteditable') === 'true' || (activeEl.tagName === 'BODY' && activeEl.ownerDocument && activeEl.ownerDocument.designMode === 'on')) {
    // CRITICAL: Use the correct window context
    const win = activeEl.ownerDocument.defaultView || window;
    const sel = win.getSelection();
    if (!sel || !sel.rangeCount) {
      console.log('Layla\'s Snips: No selection');
      hideSuggestion();
      return;
    }

    try {
      const range = sel.getRangeAt(0);
      
      // Delete the trigger text
      if (range.startContainer.nodeType === 3 && range.startOffset >= triggerLength) {
        const textNode = range.startContainer;
        const startOffset = range.startOffset - triggerLength;
        
        const deleteRange = activeEl.ownerDocument.createRange();
        deleteRange.setStart(textNode, startOffset);
        deleteRange.setEnd(textNode, range.startOffset);
        deleteRange.deleteContents();
        
        // NEW: Create HTML content with formatting preserved
        // We use the ORIGINAL snippet.body (not the converted plain text)
        // But we still need to replace variables
        let htmlBody = snippet.body;
        
        // Replace date variables in HTML
        const dateRegex = /\$\{date(?::([^}]+))?\}/g;
        htmlBody = htmlBody.replace(dateRegex, (match, format) => {
          const now = new Date();
          if (format) {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                               'July', 'August', 'September', 'October', 'November', 'December'];
            const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            const yyyy = now.getFullYear();
            const yy = String(yyyy).slice(-2);
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const monthName = monthNames[now.getMonth()];
            const monthShortName = monthShort[now.getMonth()];
            
            return format
              .replace('YYYY', yyyy)
              .replace('YY', yy)
              .replace('MMMM', monthName)
              .replace('MMM', monthShortName)
              .replace('MM', mm)
              .replace('DD', dd);
          }
          return now.toLocaleDateString();
        });
        
        // Replace other variables
        htmlBody = htmlBody.replace(/\$\{url\}/g, window.location.href);
        htmlBody = htmlBody.replace(/\$\{title\}/g, document.title);
        
        // SMARTSHEETS & GOOGLE SHEETS FIX: Both strip HTML on save/enter, create text nodes with <br> tags instead of complex HTML
        if (isSmartsheet() || isGoogleSheets()) {
          // Convert HTML to plain text
          const plainText = htmlToPlainText(htmlBody);
          
          // Create a simple fragment with text and <br> tags
          const lines = plainText.split('\n');
          const tempContainer = activeEl.ownerDocument.createElement('div');
          
          lines.forEach((line, index) => {
            if (index > 0) {
              tempContainer.appendChild(activeEl.ownerDocument.createElement('br'));
            }
            if (line.trim()) {
              tempContainer.appendChild(activeEl.ownerDocument.createTextNode(line));
            }
          });
          
          htmlBody = tempContainer.innerHTML;
        }
        
        // Check for cursor placeholder
        const htmlCursorIndex = htmlBody.indexOf('${cursor}');
        const htmlHasCursor = htmlCursorIndex !== -1;
        
        if (htmlHasCursor) {
          htmlBody = htmlBody.replace(/\$\{cursor\}/g, '');
        }
        
        // Create a temporary container to parse HTML
        const tempDiv = activeEl.ownerDocument.createElement('div');
        tempDiv.innerHTML = htmlBody;
        
        // Helper function to insert HTML content
        function insertHTMLFragment(htmlContent) {
          const tempContainer = activeEl.ownerDocument.createElement('div');
          tempContainer.innerHTML = htmlContent;
          const fragment = activeEl.ownerDocument.createDocumentFragment();
          
          while (tempContainer.firstChild) {
            fragment.appendChild(tempContainer.firstChild);
          }
          
          return fragment;
        }
        
        if (htmlHasCursor) {
          const beforeCursor = htmlBody.substring(0, htmlCursorIndex);
          const afterCursor = htmlBody.substring(htmlCursorIndex);
          
          // Insert content before cursor
          const beforeFragment = insertHTMLFragment(beforeCursor);
          deleteRange.insertNode(beforeFragment);
          
          // Create marker for cursor position
          const marker = activeEl.ownerDocument.createElement('span');
          marker.textContent = '\u200b';
          deleteRange.collapse(false);
          deleteRange.insertNode(marker);
          
          // Insert content after cursor
          const afterFragment = insertHTMLFragment(afterCursor);
          deleteRange.collapse(false);
          deleteRange.insertNode(afterFragment);
          
          // Position cursor at marker
          const newRange = activeEl.ownerDocument.createRange();
          newRange.selectNodeContents(marker);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
          
          marker.remove();
        } else {
          // Insert HTML content
          const fragment = insertHTMLFragment(htmlBody);
          deleteRange.insertNode(fragment);
          deleteRange.collapse(false);
          sel.removeAllRanges();
          sel.addRange(deleteRange);
        }
      } else {
        // Fallback for non-text nodes - insert HTML
        const tempDiv = activeEl.ownerDocument.createElement('div');
        let htmlBody = snippet.body;
        
        // Replace variables
        const dateRegex = /\$\{date(?::([^}]+))?\}/g;
        htmlBody = htmlBody.replace(dateRegex, (match, format) => {
          const now = new Date();
          if (format) {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                               'July', 'August', 'September', 'October', 'November', 'December'];
            const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            const yyyy = now.getFullYear();
            const yy = String(yyyy).slice(-2);
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const monthName = monthNames[now.getMonth()];
            const monthShortName = monthShort[now.getMonth()];
            
            return format
              .replace('YYYY', yyyy)
              .replace('YY', yy)
              .replace('MMMM', monthName)
              .replace('MMM', monthShortName)
              .replace('MM', mm)
              .replace('DD', dd);
          }
          return now.toLocaleDateString();
        });
        
        htmlBody = htmlBody.replace(/\$\{url\}/g, window.location.href);
        htmlBody = htmlBody.replace(/\$\{title\}/g, document.title);
        htmlBody = htmlBody.replace(/\$\{cursor\}/g, '');
        
        // SMARTSHEETS & GOOGLE SHEETS FIX: Both strip HTML on save/enter, create text nodes with <br> tags instead of complex HTML
        if (isSmartsheet() || isGoogleSheets()) {
          // Convert HTML to plain text
          const plainText = htmlToPlainText(htmlBody);
          
          // Create a simple fragment with text and <br> tags
          const lines = plainText.split('\n');
          const tempContainer = activeEl.ownerDocument.createElement('div');
          
          lines.forEach((line, index) => {
            if (index > 0) {
              tempContainer.appendChild(activeEl.ownerDocument.createElement('br'));
            }
            if (line.trim()) {
              tempContainer.appendChild(activeEl.ownerDocument.createTextNode(line));
            }
          });
          
          htmlBody = tempContainer.innerHTML;
        }
        
        tempDiv.innerHTML = htmlBody;
        const fragment = activeEl.ownerDocument.createDocumentFragment();
        while (tempDiv.firstChild) {
          fragment.appendChild(tempDiv.firstChild);
        }
        
        range.insertNode(fragment);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      
      // Trigger events
      activeEl.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      activeEl.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      activeEl.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, cancelable: true }));
      
      // CKEditor support
      const iframeWin = activeEl.ownerDocument.defaultView;
      if (iframeWin && typeof iframeWin.CKEDITOR !== 'undefined') {
        for (let instanceName in iframeWin.CKEDITOR.instances) {
          const editor = iframeWin.CKEDITOR.instances[instanceName];
          if (editor && editor.editable() && editor.editable().$ === activeEl) {
            console.log('Layla\'s Snips: Triggering CKEditor events');
            editor.fire('change');
            editor.fire('saveSnapshot');
            break;
          }
        }
      }
      
      activeEl.focus();
      console.log('Layla\'s Snips: Snippet inserted (rich text with HTML formatting)');
    } catch (e) {
      console.error('Layla\'s Snips: Error inserting snippet:', e);
    }
  }

  hideSuggestion();
}

// --- Event Handlers ---

function setupEventListeners(doc) {
  const docLocation = doc.location?.href || 'unknown';
  console.log('Layla\'s Snips: Setting up event listeners on', docLocation);
  
  doc.addEventListener("focusin", (e) => {
    const target = e.target;
    
    if (isEditable(target)) {
      activeEl = target;
      console.log('Layla\'s Snips: Active element set:', target.tagName, target.className || '');
      return;
    }
    
    const editableChild = target.querySelector('[contenteditable="true"]');
    if (editableChild) {
      activeEl = editableChild;
      console.log('Layla\'s Snips: Active element set (child):', editableChild.tagName);
      return;
    }
    
    if (doc.body && doc.body.tagName === 'BODY' && doc.designMode === 'on') {
      activeEl = doc.body;
      console.log('Layla\'s Snips: Active element set (body with designMode)');
      return;
    }
    
    activeEl = null;
  }, true);

  doc.addEventListener("focusout", (e) => {
    setTimeout(() => {
      if (!ui || ui.style.display === 'none') {
        if (doc.activeElement !== activeEl) {
          activeEl = null;
        }
      }
    }, 350);
  }, true);

  doc.addEventListener("keydown", (e) => {
    if (!activeEl || filteredSuggestions.length === 0 || !ui || ui.style.display === "none") return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();
      highlightIndex = (highlightIndex + 1) % filteredSuggestions.length;
      renderSuggestions(getAbsoluteCaretPosition(activeEl));
      return false;
    } 
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      highlightIndex = (highlightIndex - 1 + filteredSuggestions.length) % filteredSuggestions.length;
      renderSuggestions(getAbsoluteCaretPosition(activeEl));
      return false;
    }
    else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      e.stopPropagation();
      if (highlightIndex >= 0 && highlightIndex < filteredSuggestions.length) {
        insertSnippet(filteredSuggestions[highlightIndex]);
      }
      return false;
    }
    else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      hideSuggestion();
      return false;
    }
  }, true);

  function handleInput(e) {
    let target = e.target;
    
    if (!isEditable(target)) {
      if (activeEl && isEditable(activeEl)) {
        target = activeEl;
      } else {
        hideSuggestion();
        return;
      }
    }
    
    if (activeEl !== target && isEditable(target)) {
      activeEl = target;
      console.log('Layla\'s Snips: Active element updated:', target.tagName);
    }

    const typedTrigger = getWordBeforeCaret(activeEl);
    
    if (typedTrigger.length === 0 || typedTrigger[0] !== '\\') {
      hideSuggestion();
      return;
    }

    filteredSuggestions = findMatchingSnippets(typedTrigger);
    
    if (filteredSuggestions.length === 0) {
      hideSuggestion();
      return;
    }
    
    console.log('Layla\'s Snips: Found', filteredSuggestions.length, 'matches for', typedTrigger);
    
    if (highlightIndex === -1 || highlightIndex >= filteredSuggestions.length) {
      highlightIndex = 0;
    }
    
    const position = getAbsoluteCaretPosition(activeEl);
    if (position) {
      renderSuggestions(position);
    } else {
      console.log('Layla\'s Snips: Could not get caret position');
      hideSuggestion();
    }
  }

  doc.addEventListener("input", handleInput, true);
  doc.addEventListener("keyup", (e) => {
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
      handleInput(e);
    }
  }, true);
}

// Setup on main document
setupEventListeners(document);

// Setup on iframes
function setupIframeListeners() {
  const iframes = document.querySelectorAll('iframe');
  console.log('Layla\'s Snips: Found', iframes.length, 'iframes');
  
  iframes.forEach((iframe, index) => {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc && iframeDoc.readyState === 'complete') {
        console.log('Layla\'s Snips: Setting up listeners in iframe', index);
        setupEventListeners(iframeDoc);
        
        if (iframeDoc.designMode === 'on' || iframeDoc.body?.isContentEditable) {
          console.log('Layla\'s Snips: Found editable iframe body at index', index);
        }
      } else if (iframeDoc) {
        iframe.addEventListener('load', () => {
          console.log('Layla\'s Snips: Iframe', index, 'loaded');
          const loadedDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (loadedDoc) {
            setupEventListeners(loadedDoc);
          }
        });
      }
    } catch (e) {
      console.log('Layla\'s Snips: Cannot access iframe', index, ':', e.message);
    }
  });
}

setupIframeListeners();

// Monitor for new iframes
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.tagName === 'IFRAME') {
        console.log('Layla\'s Snips: New iframe detected');
        setTimeout(() => setupIframeListeners(), 100);
      } else if (node.querySelectorAll) {
        const iframes = node.querySelectorAll('iframe');
        if (iframes.length > 0) {
          console.log('Layla\'s Snips: New iframes detected in added node');
          setTimeout(() => setupIframeListeners(), 100);
        }
      }
    });
  });
});

observer.observe(document.body || document.documentElement, {
  childList: true,
  subtree: true
});

console.log('Layla\'s Snips: Event listeners registered and iframe monitoring active');
