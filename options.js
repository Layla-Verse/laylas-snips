console.log('╔═══════════════════════════════════════╗');
console.log('║   LAYLA\'S SNIPS - OPTIONS.JS LOADED  ║');
console.log('╚═══════════════════════════════════════╝');

const STORAGE_KEY = 'snippets';
let snippets = [];
let currentSnipIndex = null;
let statusMessage, snipCount, addBtn, saveBtn, exportBtn, importBtn, importFileInput, debugBtn, clearStorageBtn;
let triggersList, snipEditor, noSelection, deleteSnipBtn;
let snipTriggerInput, snipHandleInput, snipBodyEditor;
let expandAllToggle, shortcutsPanel;

// Utility: Strip HTML tags and return plain text
function stripHtml(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
}

// Search filter state
let searchQuery = '';

function filterSnippetsBySearch(snips, query) {
    if (!query || query.trim() === '') {
        return snips;
    }
    
    const lowerQuery = query.toLowerCase().trim();
    
    return snips.filter(snip => {
        const triggerMatch = (snip.trigger || '').toLowerCase().includes(lowerQuery);
        const handleMatch = (snip.handle || '').toLowerCase().includes(lowerQuery);
        const bodyMatch = stripHtml(snip.body || '').toLowerCase().includes(lowerQuery);
        
        return triggerMatch || handleMatch || bodyMatch;
    });
}

function initElements() {
    console.log('→ Initializing elements...');
    
    // Status and counts
    statusMessage = document.getElementById('status-message');
    snipCount = document.getElementById('snip-count');
    
    // Buttons
    addBtn = document.getElementById('add-new-btn');
    saveBtn = document.getElementById('save-all-btn');
    deleteSnipBtn = document.getElementById('delete-snip-btn');
    exportBtn = document.getElementById('export-btn');
    importBtn = document.getElementById('import-btn');
    importFileInput = document.getElementById('import-file-input');
    debugBtn = document.getElementById('debug-btn');
    clearStorageBtn = document.getElementById('clear-storage-btn');
    expandAllToggle = document.getElementById('expand-all-toggle');
    
    // Search elements
    const searchInput = document.getElementById('trigger-search');
    const searchClearBtn = document.getElementById('search-clear-btn');
    
    // Panels and editors
    triggersList = document.getElementById('triggers-list');
    snipEditor = document.getElementById('snip-editor');
    noSelection = document.getElementById('no-selection');
    shortcutsPanel = document.getElementById('shortcuts-panel');
    
    // Input fields
    snipTriggerInput = document.getElementById('snip-trigger');
    snipHandleInput = document.getElementById('snip-handle');
    snipBodyEditor = document.getElementById('snip-body-editor');
    
    console.log('✓ All elements initialized');
    return true;
}

function updateSnipCount() {
    const count = snippets.length;
    snipCount.textContent = `${count} snip${count !== 1 ? 's' : ''}`;
}

function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type || 'success'} show`;
    setTimeout(() => statusMessage.classList.remove('show'), 4000);
}

function renderTriggersList() {
    console.log('→ Rendering triggers list');
    triggersList.innerHTML = '';
    
    if (!snippets || snippets.length === 0) {
        triggersList.innerHTML = `
            <div style="padding: 2rem 1rem; text-align: center; color: #718096;">
                <p>No snips yet</p>
                <p style="font-size: 0.85rem; margin-top: 0.5rem;">Click "Add New Snip" to get started</p>
            </div>
        `;
        updateSnipCount();
        return;
    }

    // Filter snippets based on search query
    const filteredSnippets = filterSnippetsBySearch(snippets, searchQuery);
    
    if (filteredSnippets.length === 0) {
        triggersList.innerHTML = `
            <div style="padding: 2rem 1rem; text-align: center; color: #718096;">
                <p>No results found</p>
                <p style="font-size: 0.85rem; margin-top: 0.5rem;">Try a different search term</p>
            </div>
        `;
        updateSnipCount();
        return;
    }

    // Group snippets by trigger (case-insensitive)
    const groups = {};
    filteredSnippets.forEach((snip, origIndex) => {
        // Find the original index in the full snippets array
        const index = snippets.indexOf(snip);
        
        const trigger = snip.trigger || 'untitled';
        const triggerLower = trigger.toLowerCase();
        if (!groups[triggerLower]) {
            groups[triggerLower] = {
                displayTrigger: trigger,
                snips: []
            };
        }
        groups[triggerLower].snips.push({ ...snip, index });
    });

    // Sort triggers alphabetically
    const sortedTriggers = Object.keys(groups).sort((a, b) => 
        a.toLowerCase().localeCompare(b.toLowerCase())
    );

    // Render each group
    sortedTriggers.forEach(triggerLower => {
        const group = groups[triggerLower];
        const displayTrigger = group.displayTrigger;
        const groupSnips = group.snips;
        
        // Create group container
        const groupDiv = document.createElement('div');
        groupDiv.className = 'trigger-group';
        
        // Create group header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'trigger-group-header';
        
        const toggle = document.createElement('span');
        toggle.className = 'trigger-toggle collapsed';
        toggle.textContent = '▼';
        
        const triggerName = document.createElement('span');
        triggerName.className = 'trigger-name';
        triggerName.textContent = `\\${displayTrigger}`;
        
        const triggerCount = document.createElement('span');
        triggerCount.className = 'trigger-count';
        triggerCount.textContent = groupSnips.length.toString();
        
        headerDiv.appendChild(toggle);
        headerDiv.appendChild(triggerName);
        headerDiv.appendChild(triggerCount);
        
        // Create snip items container
        const itemsDiv = document.createElement('div');
        itemsDiv.className = 'snip-items';
        
        // Auto-expand groups when searching
        if (searchQuery && searchQuery.trim() !== '') {
            itemsDiv.classList.add('expanded');
            toggle.classList.remove('collapsed');
        }
        
        // Add snip items
        groupSnips.forEach(snip => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'snip-item';
            itemDiv.dataset.index = snip.index;
            
            if (currentSnipIndex === snip.index) {
                itemDiv.classList.add('selected');
            }
            
            const handle = document.createElement('div');
            handle.className = 'snip-handle';
            
            // Smart handle display
            const hasValidHandle = snip.handle && 
                                   snip.handle.trim() !== '' && 
                                   snip.handle.toLowerCase() !== 'untitled' && 
                                   snip.handle.toLowerCase() !== 'new snip';
            
            const hasBody = snip.body && stripHtml(snip.body).trim() !== '';
            
            if (hasValidHandle) {
                // Saved handle - normal display
                handle.textContent = snip.handle;
            } else if (hasBody) {
                // Show preview of snippet body (first ~30 chars) - no italics
                const bodyPreview = stripHtml(snip.body || '').trim();
                handle.textContent = bodyPreview.substring(0, 30) + (bodyPreview.length > 30 ? '...' : '');
                handle.style.opacity = '0.8';
            } else {
                // Empty snip - show placeholder - gray but no italics
                handle.textContent = 'New Snip (unsaved)';
                handle.style.opacity = '0.5';
                handle.style.color = '#a0aec0';
            }
            
            itemDiv.appendChild(handle);
            
            // Click to select snip
            itemDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                selectSnip(snip.index);
            });
            
            itemsDiv.appendChild(itemDiv);
        });
        
        // Toggle group expansion
        headerDiv.addEventListener('click', () => {
            const isExpanded = itemsDiv.classList.contains('expanded');
            if (isExpanded) {
                itemsDiv.classList.remove('expanded');
                toggle.classList.add('collapsed');
            } else {
                itemsDiv.classList.add('expanded');
                toggle.classList.remove('collapsed');
            }
        });
        
        groupDiv.appendChild(headerDiv);
        groupDiv.appendChild(itemsDiv);
        triggersList.appendChild(groupDiv);
    });
    
    updateSnipCount();
}

function selectSnip(index) {
    console.log('→ Selecting snip:', index);
    currentSnipIndex = index;
    
    const snip = snippets[index];
    
    // Update UI
    noSelection.style.display = 'none';
    snipEditor.classList.add('active');
    deleteSnipBtn.style.display = 'inline-flex';
    
    // Populate fields
    snipTriggerInput.value = snip.trigger || '';
    snipHandleInput.value = snip.handle || '';
    snipBodyEditor.innerHTML = snip.body || '';
    
    // Update selected state in triggers list
    document.querySelectorAll('.snip-item').forEach(item => {
        if (parseInt(item.dataset.index) === index) {
            item.classList.add('selected');
            // Expand parent group if collapsed
            const itemsDiv = item.closest('.snip-items');
            if (itemsDiv && !itemsDiv.classList.contains('expanded')) {
                itemsDiv.classList.add('expanded');
                const header = itemsDiv.previousElementSibling;
                if (header) {
                    const toggle = header.querySelector('.trigger-toggle');
                    if (toggle) toggle.classList.remove('collapsed');
                }
            }
        } else {
            item.classList.remove('selected');
        }
    });
}

function deselectSnip() {
    currentSnipIndex = null;
    noSelection.style.display = 'flex';
    snipEditor.classList.remove('active');
    deleteSnipBtn.style.display = 'none';
    
    // Clear fields
    snipTriggerInput.value = '';
    snipHandleInput.value = '';
    snipBodyEditor.innerHTML = '';
    
    // Remove selected state
    document.querySelectorAll('.snip-item.selected').forEach(item => {
        item.classList.remove('selected');
    });
}

function addNewSnip() {
    console.log('→ Adding new snip');
    
    const newSnip = {
        trigger: '',
        handle: 'New Snip',
        body: ''
    };
    
    snippets.push(newSnip);
    renderTriggersList();
    selectSnip(snippets.length - 1);
    
    // Focus on trigger input
    snipTriggerInput.focus();
    
    showStatus('✅ New snip created! Don\'t forget to save.', 'success');
}

function deleteCurrentSnip() {
    if (currentSnipIndex === null) return;
    
    const confirmed = confirm('Delete this snip permanently?');
    if (!confirmed) return;
    
    console.log('→ Deleting snip at index:', currentSnipIndex);
    
    snippets.splice(currentSnipIndex, 1);
    
    // Save to storage
    chrome.storage.local.set({ snippets }, () => {
        console.log('✓ Snip deleted and saved');
        deselectSnip();
        renderTriggersList();
        showStatus('✅ Snip deleted!', 'success');
    });
}

function getCurrentSnipData() {
    if (currentSnipIndex === null) return null;
    
    // Save innerHTML to preserve formatting (bold, italic, etc.)
    // We'll clean it when inserting, not when saving
    return {
        trigger: snipTriggerInput.value.trim(),
        handle: snipHandleInput.value.trim() || 'Untitled',
        body: snipBodyEditor.innerHTML
    };
}

function saveCurrentSnipToMemory() {
    if (currentSnipIndex === null) return;
    
    const data = getCurrentSnipData();
    if (data) {
        snippets[currentSnipIndex] = data;
    }
}

function saveAllSnips() {
    console.log('→ Saving all snips');
    
    // Save current snip to memory first
    saveCurrentSnipToMemory();
    
    // Validate that all snips have at least a trigger and body
    const validSnips = snippets.filter(snip => 
        snip.trigger && snip.trigger.trim() && snip.body && snip.body.trim()
    );
    
    if (validSnips.length !== snippets.length) {
        const removed = snippets.length - validSnips.length;
        if (!confirm(`${removed} snip(s) are missing a trigger or body and will be removed. Continue?`)) {
            return;
        }
        snippets = validSnips;
    }
    
    // Save to storage
    chrome.storage.local.set({ snippets }, () => {
        console.log('✓ All snips saved:', snippets.length);
        
        // Re-render to update any changes
        const prevIndex = currentSnipIndex;
        renderTriggersList();
        if (prevIndex !== null && prevIndex < snippets.length) {
            selectSnip(prevIndex);
        } else {
            deselectSnip();
        }
        
        showStatus('✅ All changes saved!', 'success');
    });
}

function loadSnips() {
    console.log('→ Loading snips from storage');
    
    chrome.storage.local.get({ snippets: [] }, (cfg) => {
        snippets = cfg.snippets || [];
        console.log('✓ Loaded', snippets.length, 'snips');
        
        // Migrate old format to new format if needed
        let needsMigration = false;
        snippets = snippets.map(snip => {
            if (!snip.handle) {
                needsMigration = true;
                return {
                    trigger: snip.trigger,
                    handle: snip.trigger || 'Untitled',
                    body: snip.body
                };
            }
            // Remove description field if it exists
            return {
                trigger: snip.trigger,
                handle: snip.handle,
                body: snip.body
            };
        });
        
        if (needsMigration) {
            console.log('→ Migrated old format to new format');
            chrome.storage.local.set({ snippets });
        }
        
        renderTriggersList();
        deselectSnip();
    });
}

function exportSnips() {
    console.log('→ Exporting snips');
    
    if (snippets.length === 0) {
        alert('No snippets to export!');
        return;
    }
    
    const dataStr = JSON.stringify(snippets, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `laylas-snips-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    showStatus('✅ Snippets exported!', 'success');
}

function importSnips() {
    console.log('→ Import button clicked');
    importFileInput.click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('→ File selected:', file.name, file.type);
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            let importedSnips = [];
            
            // Try JSON first
            if (file.name.endsWith('.json')) {
                console.log('→ Parsing JSON file');
                importedSnips = JSON.parse(content);
                console.log(`✓ JSON imported: ${importedSnips.length} snips`);
            }
            // Try CSV
            else if (file.name.endsWith('.csv')) {
                console.log('→ Parsing CSV file');
                
                // Normalize line endings (Windows \r\n to Unix \n)
                let normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                
                // Basic CSV parser - split by lines that are NOT inside quotes
                const rows = [];
                let currentRow = '';
                let insideQuotes = false;
                
                for (let i = 0; i < normalizedContent.length; i++) {
                    const char = normalizedContent[i];
                    
                    if (char === '"') {
                        insideQuotes = !insideQuotes;
                        currentRow += char;
                    } else if (char === '\n' && !insideQuotes) {
                        if (currentRow.trim()) {
                            rows.push(currentRow.trim());
                        }
                        currentRow = '';
                    } else {
                        currentRow += char;
                    }
                }
                if (currentRow.trim()) rows.push(currentRow.trim());
                
                // Detect headers
                const firstLine = rows[0].toLowerCase();
                const hasHeaders = firstLine.includes('trigger') || firstLine.includes('handle') || firstLine.includes('body');
                const startIdx = hasHeaders ? 1 : 0;
                
                // Parse individual CSV row
                const parseCSVRow = (row) => {
                    const cells = [];
                    let currentCell = '';
                    let insideQuotes = false;
                    
                    for (let i = 0; i < row.length; i++) {
                        const char = row[i];
                        
                        if (char === '"') {
                            insideQuotes = !insideQuotes;
                        } else if (char === ',' && !insideQuotes) {
                            cells.push(currentCell.replace(/^"|"$/g, '').trim());
                            currentCell = '';
                        } else {
                            currentCell += char;
                        }
                    }
                    cells.push(currentCell.replace(/^"|"$/g, '').trim());
                    return cells;
                };
                
                importedSnips = [];
                
                for (let i = startIdx; i < rows.length; i++) {
                    const cells = parseCSVRow(rows[i]);
                    
                    if (hasHeaders) {
                        // Parse with headers
                        const headers = parseCSVRow(rows[0]);
                        const row = {};
                        headers.forEach((header, idx) => {
                            row[header.toLowerCase()] = cells[idx] || '';
                        });
                        
                        const trigger = row.trigger || '';
                        const handle = row.handle || trigger || 'Imported';
                        let body = row.body || '';
                        
                        if (!trigger || !body) continue;
                        
                        // Convert line breaks to <br>
                        body = body.replace(/\n/g, '<br>');
                        
                        importedSnips.push({
                            trigger: trigger,
                            handle: handle,
                            body: body
                        });
                    } else {
                        // No headers format: [trigger, handle, body]
                        if (cells.length < 3) continue;
                        
                        const trigger = cells[0].trim();
                        const handle = cells[1].trim() || trigger;
                        let body = cells[2].trim();
                        
                        if (!trigger || !body) continue;
                        
                        // Convert line breaks to <br>
                        body = body.replace(/\n/g, '<br>');
                        
                        importedSnips.push({
                            trigger: trigger,
                            handle: handle,
                            body: body
                        });
                    }
                }
                
                console.log(`✓ CSV imported: ${importedSnips.length} snips`);
            } else {
                throw new Error('Unsupported file type. Please use .json or .csv files.');
            }
            
            if (!Array.isArray(importedSnips)) {
                throw new Error('Invalid format: expected array of snippets');
            }
            
            if (importedSnips.length === 0) {
                throw new Error('No valid snippets found in file');
            }
            
            console.log('→ Imported', importedSnips.length, 'snippets');
            
            // Merge with existing snippets
            snippets = [...snippets, ...importedSnips];
            
            // Save to storage
            chrome.storage.local.set({ snippets }, () => {
                console.log('✓ Imported snippets saved');
                renderTriggersList();
                deselectSnip();
                showStatus(`✅ Imported ${importedSnips.length} snippets!`, 'success');
            });
            
        } catch (error) {
            console.error('Error importing file:', error);
            showStatus(`⚠️ Error importing file: ${error.message}`, 'error');
        }
    };
    
    reader.onerror = function() {
        console.error('Error reading file');
        showStatus('⚠️ Error reading file!', 'error');
    };
    
    reader.readAsText(file);
    event.target.value = '';
}

function debugStorage() {
    console.log('╔═══════════════════════════════════════╗');
    console.log('║     DEBUG STORAGE CLICKED!           ║');
    console.log('╚═══════════════════════════════════════╝');
    
    chrome.storage.local.get(null, (allData) => {
        console.log('→ All storage data:', allData);
        
        if (allData.snippets) {
            const snippets = allData.snippets;
            let message = `Storage contains ${snippets.length} snippet(s):\n\n`;
            
            snippets.forEach((snip, idx) => {
                message += `${idx + 1}. Trigger: "${snip.trigger}"\n`;
                message += `   Handle: "${snip.handle}"\n`;
                message += `   Body preview: "${snip.body.substring(0, 50)}..."\n\n`;
            });
            
            alert(message);
            console.log('→ Snippet details:', snippets);
        } else {
            alert('No snippets found in storage!');
            console.log('→ No snippets key in storage');
        }
    });
}

function clearAllStorage() {
    console.log('╔═══════════════════════════════════════╗');
    console.log('║     CLEAR STORAGE CLICKED!           ║');
    console.log('╚═══════════════════════════════════════╝');
    
    const confirmed = confirm(
        '⚠️ WARNING ⚠️\n\n' +
        'This will permanently delete ALL snippets from storage.\n\n' +
        'Are you sure you want to continue?'
    );
    
    if (!confirmed) {
        console.log('→ Clear cancelled by user');
        return;
    }
    
    chrome.storage.local.clear(() => {
        console.log('✓ Storage cleared successfully!');
        
        snippets = [];
        deselectSnip();
        renderTriggersList();
        
        showStatus('✅ All storage cleared!', 'success');
    });
}

function setupFormattingToolbar() {
    const toolbarBtns = document.querySelectorAll('.toolbar-btn');
    
    toolbarBtns.forEach(btn => {
        // Prevent mousedown from stealing focus from editor
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const command = btn.dataset.command;
            
            // Execute the formatting command
            const success = document.execCommand(command, false, null);
            
            if (success) {
                console.log(`Executed ${command} successfully`);
            } else {
                console.warn(`Failed to execute ${command}`);
            }
            
            // Return focus to editor
            snipBodyEditor.focus();
        });
    });
    
    // Color palette buttons
    const colorBtns = document.querySelectorAll('.color-btn');
    colorBtns.forEach(btn => {
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const color = btn.dataset.color;
            
            // Apply highlight color
            snipBodyEditor.focus();
            const success = document.execCommand('hiliteColor', false, color);
            
            if (success) {
                console.log(`Applied highlight color: ${color}`);
                
                // Visual feedback - briefly highlight the active button
                colorBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                setTimeout(() => btn.classList.remove('active'), 300);
            } else {
                console.warn(`Failed to apply highlight color: ${color}`);
            }
            
            snipBodyEditor.focus();
        });
    });
}

function setupShortcutsPanel() {
    // Shortcut section headers - collapsible
    const sectionHeaders = document.querySelectorAll('.shortcut-section-header');
    sectionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const toggle = header.querySelector('.shortcut-section-toggle');
            const items = header.nextElementSibling;
            
            if (items && items.classList.contains('shortcut-section-items')) {
                items.classList.toggle('collapsed');
                toggle.classList.toggle('collapsed');
            }
        });
    });
    
    // Shortcut items - click to insert into editor AT CURSOR POSITION
    const shortcutItems = document.querySelectorAll('.shortcut-item');
    shortcutItems.forEach(item => {
        item.addEventListener('mousedown', (e) => {
            // Prevent the click from stealing focus
            e.preventDefault();
        });
        
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const shortcut = item.dataset.shortcut;
            if (shortcut && currentSnipIndex !== null) {
                console.log('Inserting shortcut:', shortcut);
                
                // The editor should already be focused, but let's make sure
                // Use a small timeout to ensure focus is set
                setTimeout(() => {
                    snipBodyEditor.focus();
                    
                    // Insert at current cursor position
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        
                        // Delete any selected content
                        range.deleteContents();
                        
                        // Create text node and insert
                        const textNode = document.createTextNode(shortcut);
                        range.insertNode(textNode);
                        
                        // Move cursor after the inserted text
                        range.setStartAfter(textNode);
                        range.collapse(true);
                        
                        // Update selection
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                    
                    snipBodyEditor.focus();
                    showStatus(`✅ Inserted ${shortcut}`, 'success');
                }, 50);
            }
        });
    });
}

function setupExpandAllToggle() {
    expandAllToggle.addEventListener('change', (e) => {
        const shouldExpand = e.target.checked;
        const allGroups = document.querySelectorAll('.trigger-group');
        
        allGroups.forEach(group => {
            const itemsDiv = group.querySelector('.snip-items');
            const toggle = group.querySelector('.trigger-toggle');
            
            if (shouldExpand) {
                itemsDiv.classList.add('expanded');
                toggle.classList.remove('collapsed');
            } else {
                itemsDiv.classList.remove('expanded');
                toggle.classList.add('collapsed');
            }
        });
    });
}

function attachEventListeners() {
    console.log('→ Attaching event listeners...');
    
    addBtn.addEventListener('click', (e) => {
        e.preventDefault();
        addNewSnip();
    });
    
    saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        saveAllSnips();
    });
    
    deleteSnipBtn.addEventListener('click', (e) => {
        e.preventDefault();
        deleteCurrentSnip();
    });
    
    exportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        exportSnips();
    });
    
    importBtn.addEventListener('click', (e) => {
        e.preventDefault();
        importSnips();
    });
    
    importFileInput.addEventListener('change', handleFileImport);
    
    debugBtn.addEventListener('click', (e) => {
        e.preventDefault();
        debugStorage();
    });
    
    clearStorageBtn.addEventListener('click', (e) => {
        e.preventDefault();
        clearAllStorage();
    });
    
    // Search functionality
    const searchInput = document.getElementById('trigger-search');
    const searchClearBtn = document.getElementById('search-clear-btn');
    
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        
        // Show/hide clear button
        if (searchQuery.trim() !== '') {
            searchClearBtn.classList.add('visible');
        } else {
            searchClearBtn.classList.remove('visible');
        }
        
        renderTriggersList();
    });
    
    searchClearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        searchInput.value = '';
        searchQuery = '';
        searchClearBtn.classList.remove('visible');
        renderTriggersList();
        searchInput.focus();
    });
    
    setupFormattingToolbar();
    setupShortcutsPanel();
    setupExpandAllToggle();
    
    // Auto-save current snip when fields change
    const autoSaveFields = [snipTriggerInput, snipHandleInput, snipBodyEditor];
    autoSaveFields.forEach(field => {
        field.addEventListener('input', () => {
            if (currentSnipIndex !== null) {
                saveCurrentSnipToMemory();
                // Update the triggers list to reflect changes
                renderTriggersList();
                // Re-select to maintain selection
                document.querySelectorAll('.snip-item').forEach(item => {
                    if (parseInt(item.dataset.index) === currentSnipIndex) {
                        item.classList.add('selected');
                    }
                });
            }
        });
    });
    
    console.log('✓ Event listeners attached');
}

function init() {
    console.log('→ Starting initialization...');
    
    if (!initElements()) {
        console.error('❌ Failed to initialize elements');
        return;
    }
    
    attachEventListeners();
    loadSnips();
    
    console.log('✓ Initialization complete!');
    console.log('╔═══════════════════════════════════════╗');
    console.log('║   READY! NEW UI LOADED               ║');
    console.log('╚═══════════════════════════════════════╝');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
