document.addEventListener('DOMContentLoaded', function() {
    // Check for saved theme preference or use system preference
    const isDarkMode = localStorage.getItem('dark-theme') === 'true' || 
        (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDarkMode) {
        document.body.classList.add('dark-theme');
    }
    
    // Load saved JSON input if available (start empty if none)
    const savedInput = localStorage.getItem('json-input');
    let initialInput = (savedInput !== null) ? savedInput : '';
    
    // JSONEditor-only implementation (no CodeMirror)

    // Create JSONEditor hosts and instances
    const [inputWrapper, outputWrapper] = document.querySelectorAll('.editor-wrapper');
    const inputJsonHost = document.createElement('div');
    inputJsonHost.className = 'jsoneditor-host';
    inputWrapper.appendChild(inputJsonHost);
    const outputJsonHost = document.createElement('div');
    outputJsonHost.className = 'jsoneditor-host';
    outputWrapper.appendChild(outputJsonHost);

    const inputJE = new JSONEditor(inputJsonHost, {
        mode: 'code',
        history: true,
        onEvent: function(node, event) {
            if (event.type === 'change') {
                localStorage.setItem('json-input', getJEText(inputJE));
            }
        }
    });
    
    const outputJE = new JSONEditor(outputJsonHost, {
        mode: 'code',
        history: true,
        onEvent: function(node, event) {
            if (event.type === 'change') {
                localStorage.setItem('json-output', getJEText(outputJE));
            }
        }
    });

    // Sample JSON used by the Sample button
    const sampleJson = {
        name: "JSON Formatter",
        version: "1.0.0",
        description: "Format, validate and convert JSON",
        features: ["Format", "Minify", "Validate", "Convert"],
        isAwesome: true,
        stats: { users: 10000, rating: 4.9 }
    };
    const sampleJsonStr = JSON.stringify(sampleJson, null, 2);

    // Helpers
    function getJEText(je) { try { return je.getText(); } catch { try { return JSON.stringify(je.get()); } catch { return ''; } } }
    function setJEText(je, text) { try { je.setText(text); } catch { try { je.set(JSON.parse(text)); } catch { /* ignore */ } } }
    function getJEJson(je) { try { return je.get(); } catch { try { return JSON.parse(getJEText(je)); } catch { return null; } } }

    // Initialize editors
    setJEText(inputJE, initialInput);
    // Start with empty output
    setJEText(outputJE, '');
    // Clear any saved output from localStorage to prevent it from reappearing
    localStorage.removeItem('json-output');

    // Persist changes are now handled by onEvent callbacks

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.querySelector('.theme-icon');
    
    // Set initial theme icon
    themeIcon.textContent = isDarkMode ? '☀️' : '🌙';
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('dark-theme', isDark);
        
        themeIcon.textContent = isDark ? '☀️' : '🌙';
        
        // JSONEditor styles follow CSS variables; nothing to change
        
        // Update control buttons styling if needed
        const controlButtons = document.querySelectorAll('.control-btn');
        controlButtons.forEach(btn => {
            btn.style.borderColor = isDark ? getComputedStyle(document.documentElement).getPropertyValue('--button-border') : 'transparent';
        });
    });

    // DOM Elements
    const uploadBtn = document.getElementById('upload-json');
    const validateBtn = document.getElementById('validate-json');
    const formatBtn = document.getElementById('format-json');
    const minifyBtn = document.getElementById('minify-json');
    const convertBtn = document.getElementById('convert-json');
    const downloadBtn = document.getElementById('download-json');
    const tabSizeSelect = document.getElementById('tab-size');
    const undoInputBtn = document.getElementById('undo-input');
    const undoOutputBtn = document.getElementById('undo-output');
    const saveInputBtn = document.getElementById('save-input');
    const saveOutputBtn = document.getElementById('save-output');
    const viewInputBtn = document.getElementById('view-input-btn');
    const viewOutputBtn = document.getElementById('view-output-btn');
    const viewInputDropdown = document.getElementById('view-input-dropdown');
    const viewOutputDropdown = document.getElementById('view-output-dropdown');
    
    // Create hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Event Listeners
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);
    validateBtn.addEventListener('click', validateJson);
    formatBtn.addEventListener('click', formatJson);
    minifyBtn.addEventListener('click', minifyJson);
    convertBtn.addEventListener('click', toggleConvertDropdown);
    downloadBtn.addEventListener('click', downloadJson);
    tabSizeSelect.addEventListener('change', updateTabSize);
    
    // Undo & Copy & Sample
    undoInputBtn.addEventListener('click', () => inputJE.undo());
    undoOutputBtn.addEventListener('click', () => outputJE.undo());
    const copyInputBtn = document.getElementById('copy-input');
    const copyOutputBtn = document.getElementById('copy-output');
    if (copyInputBtn) copyInputBtn.addEventListener('click', async () => { await navigator.clipboard.writeText(getJEText(inputJE)); showNotification('Copied input to clipboard', 'success'); });
    if (copyOutputBtn) copyOutputBtn.addEventListener('click', async () => { await navigator.clipboard.writeText(getJEText(outputJE)); showNotification('Copied output to clipboard', 'success'); });
    const sampleBtn = document.getElementById('sample-input');
    if (sampleBtn) sampleBtn.addEventListener('click', () => {
        setJEText(inputJE, sampleJsonStr);
        showNotification('Sample JSON inserted', 'success');
    });
    
    // Save buttons
    saveInputBtn.addEventListener('click', () => saveToFile(getJEText(inputJE), 'input.json'));
    saveOutputBtn.addEventListener('click', () => saveToFile(getJEText(outputJE), 'output.json'));
    
    // View dropdown toggles
    viewInputBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        viewInputDropdown.classList.toggle('show');
        viewOutputDropdown.classList.remove('show');
    });
    
    viewOutputBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        viewOutputDropdown.classList.toggle('show');
        viewInputDropdown.classList.remove('show');
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.matches('#view-input-btn') && !e.target.matches('#view-output-btn')) {
            viewInputDropdown.classList.remove('show');
            viewOutputDropdown.classList.remove('show');
        }
    });
    
    // View options event listeners
    document.querySelectorAll('#view-input-dropdown a').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewType = e.target.getAttribute('data-view');
            changeView('input', viewType);
            viewInputDropdown.classList.remove('show');
        });
    });
    
    document.querySelectorAll('#view-output-dropdown a').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewType = e.target.getAttribute('data-view');
            changeView('output', viewType);
            viewOutputDropdown.classList.remove('show');
        });
    });
    // (fileInput change already attached above)

    // Format JSON
    function formatJson() {
        try {
            const input = getJEText(inputJE).trim();
            if (!input) {
                showNotification('Please enter some JSON to format', 'info');
                return;
            }
            
            const parsed = JSON.parse(input);
            const tabSize = tabSizeSelect.value === 'tab' ? '\t' : parseInt(tabSizeSelect.value);
            const formatted = JSON.stringify(parsed, null, tabSize);
            
            setJEText(outputJE, formatted);
            showNotification('JSON formatted successfully!', 'success');
        } catch (error) {
            showNotification('Invalid JSON: ' + error.message, 'error');
        }
    }

    // Minify JSON
    function minifyJson() {
        try {
            const input = getJEText(inputJE).trim();
            if (!input) {
                showNotification('Please enter some JSON to minify', 'info');
                return;
            }
            
            const parsed = JSON.parse(input);
            const minified = JSON.stringify(parsed);
            
            setJEText(outputJE, minified);
            showNotification('JSON minified successfully!', 'success');
        } catch (error) {
            showNotification('Invalid JSON: ' + error.message, 'error');
        }
    }

    // Validate JSON
    function validateJson() {
        try {
            const input = getJEText(inputJE).trim();
            if (!input) {
                showNotification('Please enter some JSON to validate', 'info');
                return;
            }
            
            JSON.parse(input);
            showNotification('✓ Valid JSON', 'success');
            
            // Clear any previous error text
            setJEText(outputJE, '');
        } catch (error) {
            showNotification('Invalid JSON: ' + error.message, 'error');
            
            // Display error in output editor with line highlighting
            const errorInfo = parseJsonError(error.message, getJEText(inputJE));
            displayErrorInOutput(errorInfo);
        }
    }
    
    // Parse JSON error message to get line and position
    function parseJsonError(errorMessage, jsonText) {
        let lineNumber = 1;
        let columnNumber = 0;
        
        // Extract position from error message
        const positionMatch = errorMessage.match(/position\s+(\d+)/i);
        if (positionMatch && positionMatch[1]) {
            const position = parseInt(positionMatch[1], 10);
            
            // Calculate line and column from position
            const lines = jsonText.substring(0, position).split('\n');
            lineNumber = lines.length;
            columnNumber = lines[lines.length - 1].length + 1;
        }
        
        return {
            message: errorMessage,
            line: lineNumber,
            column: columnNumber
        };
    }
    
    // Display error in output editor
    function displayErrorInOutput(errorInfo) {
        // Create VS Code style error message
        const errorMessage = `Error: ${errorInfo.message}\nAt line ${errorInfo.line}, column ${errorInfo.column}`;
        
        // Set error message in output editor
        setJEText(outputJE, errorMessage);

        // CodeMirror is hidden; skip line/gutter highlighting to avoid confusion
    }
    
    // Clear error markers
    function clearErrorMarkers(editor) {
        for (let i = 0; i < editor.lineCount(); i++) {
            editor.removeLineClass(i, 'background', 'error-line');
            editor.setGutterMarker(i, 'CodeMirror-lint-markers', null);
        }
    }

    // Toggle convert dropdown
    function toggleConvertDropdown(e) {
        e.stopPropagation();
        const dropdown = document.getElementById('convert-dropdown');
        const isShowing = dropdown.classList.contains('show');
        
        // Close all dropdowns first
        document.querySelectorAll('.convert-dropdown.show, .view-dropdown.show').forEach(el => {
            if (el !== dropdown) el.classList.remove('show');
        });
        
        // Toggle the clicked dropdown
        if (!isShowing) {
            dropdown.classList.add('show');
            // Close when clicking outside
            const closeDropdown = (e) => {
                if (!dropdown.contains(e.target) && e.target.id !== 'convert-json') {
                    dropdown.classList.remove('show');
                    document.removeEventListener('click', closeDropdown);
                }
            };
            // Add a small delay to avoid immediate closing
            setTimeout(() => {
                document.addEventListener('click', closeDropdown);
            }, 10);
        } else {
            dropdown.classList.remove('show');
        }
    }

    // Handle conversion format selection
    document.querySelectorAll('#convert-dropdown a').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const format = e.target.getAttribute('data-format');
            convertJson(format);
            document.getElementById('convert-dropdown').classList.remove('show');
        });
    });
    
    // Convert JSON to other formats
    function convertJson(format) {
        try {
            const input = getJEText(inputJE).trim();
            if (!input) {
                showNotification(`Please enter some JSON to convert to ${format.toUpperCase()}`, 'info');
                return;
            }
            
            const parsed = JSON.parse(input);
            let converted = '';
            
            switch(format) {
                case 'xml':
                    converted = jsonToXml(parsed);
                    break;
                case 'yaml':
                    converted = jsonToYaml(parsed);
                    break;
                case 'csv':
                    converted = jsonToCsv(parsed);
                    break;
                default:
                    showNotification(`Conversion to ${format} not supported`, 'error');
                    return;
            }
            
            setJEText(outputJE, converted);
            showNotification(`JSON converted to ${format.toUpperCase()} successfully!`, 'success');
        } catch (error) {
            showNotification('Invalid JSON: ' + error.message, 'error');
        }
    }
    
    // JSON to XML conversion
    function jsonToXml(obj, rootName = 'root') {
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n`;
        
        function parseObject(obj, indent = '  ') {
            let xmlString = '';
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const value = obj[key];
                    if (value === null) {
                        xmlString += `${indent}<${key}/>\n`;
                    } else if (Array.isArray(value)) {
                        xmlString += `${indent}<${key}>\n`;
                        value.forEach(item => {
                            if (typeof item === 'object' && item !== null) {
                                xmlString += `${indent}  <item>\n${parseObject(item, indent + '    ')}${indent}  </item>\n`;
                            } else {
                                xmlString += `${indent}  <item>${escapeXml(String(item))}</item>\n`;
                            }
                        });
                        xmlString += `${indent}</${key}>\n`;
                    } else if (typeof value === 'object') {
                        xmlString += `${indent}<${key}>\n${parseObject(value, indent + '  ')}${indent}</${key}>\n`;
                    } else {
                        xmlString += `${indent}<${key}>${escapeXml(String(value))}</${key}>\n`;
                    }
                }
            }
            return xmlString;
        }
        
        function escapeXml(unsafe) {
            return unsafe.replace(/[<>&'"]/g, function(c) {
                switch (c) {
                    case '<': return '&lt;';
                    case '>': return '&gt;';
                    case '&': return '&amp;';
                    case '\'': return '&apos;';
                    case '"': return '&quot;';
                }
                return c;
            });
        }
        
        xml += parseObject(obj);
        xml += `</${rootName}>`;
        return xml;
    }
    
    // JSON to YAML conversion - Simple implementation
    function jsonToYaml(obj) {
        // Handle primitive types
        if (obj === null || obj === undefined) return 'null';
        if (typeof obj === 'string') return JSON.stringify(obj);
        if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
        
        // Handle arrays
        if (Array.isArray(obj)) {
            if (obj.length === 0) return '[]';
            return '\n' + obj.map(item => {
                const value = jsonToYaml(item);
                if (typeof item === 'object' && item !== null) {
                    // For objects in arrays, we need to handle indentation
                    const lines = value.split('\n');
                    return '- ' + lines[0] + 
                           (lines.length > 1 ? '\n  ' + lines.slice(1).join('\n  ') : '');
                }
                return '- ' + value;
            }).join('\n');
        }
        
        // Handle objects
        let yaml = '';
        const entries = Object.entries(obj);
        
        for (let i = 0; i < entries.length; i++) {
            const [key, value] = entries[i];
            const isLast = i === entries.length - 1;
            const needsQuotes = !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key);
            const formattedKey = needsQuotes ? `"${key}"` : key;
            
            if (value === null || value === undefined) {
                yaml += `${formattedKey}: null${isLast ? '' : '\n'}`;
            } else if (Array.isArray(value)) {
                yaml += `${formattedKey}:`;
                const arrayYaml = jsonToYaml(value);
                if (arrayYaml === '[]') {
                    yaml += ' []';
                } else {
                    yaml += arrayYaml;
                }
                if (!isLast) yaml += '\n';
            } else if (typeof value === 'object') {
                yaml += `${formattedKey}:`;
                const nestedYaml = jsonToYaml(value);
                if (nestedYaml === '{}') {
                    yaml += ' {}';
                } else {
                    // Add proper indentation for nested objects
                    const lines = nestedYaml.split('\n');
                    yaml += ' ' + lines[0];
                    for (let j = 1; j < lines.length; j++) {
                        yaml += '\n  ' + lines[j];
                    }
                }
                if (!isLast) yaml += '\n';
            } else {
                yaml += `${formattedKey}: ${jsonToYaml(value)}`;
                if (!isLast) yaml += '\n';
            }
        }
        
        return yaml;
    }
    
    // JSON to CSV conversion
    function jsonToCsv(obj) {
        if (!Array.isArray(obj)) {
            // If not an array, wrap in array
            obj = [obj];
        }
        
        if (obj.length === 0) {
            return '';
        }
        
        // Get headers from the first object
        const headers = Object.keys(obj[0]);
        let csv = headers.join(',') + '\n';
        
        // Add rows
        obj.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                if (value === null || value === undefined) {
                    return '';
                } else if (typeof value === 'object') {
                    return '"' + JSON.stringify(value).replace(/"/g, '""') + '"';
                } else {
                    // Escape quotes and wrap in quotes if contains comma or newline
                    const stringValue = String(value);
                    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
                        return '"' + stringValue.replace(/"/g, '""') + '"';
                    }
                    return stringValue;
                }
            });
            csv += values.join(',') + '\n';
        });
        
        return csv;
    }

    // Handle file upload
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                // Validate JSON
                JSON.parse(content);
                setJEText(inputJE, content);
                showNotification('File loaded successfully!', 'success');
            } catch (error) {
                showNotification('Invalid JSON file: ' + error.message, 'error');
            }
        };
        reader.onerror = function() {
            showNotification('Error reading file', 'error');
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }

    // Download JSON
    function downloadJson() {
        try {
            const output = getJEText(outputJE).trim();
            if (!output) {
                showNotification('No JSON to download', 'info');
                return;
            }
            
            saveToFile(output, 'formatted.json');
            showNotification('JSON downloaded successfully', 'success');
        } catch (error) {
            showNotification('Error downloading JSON: ' + error.message, 'error');
        }
    }
    
    // Save content to file
    function saveToFile(content, filename) {
        const blob = new Blob([content], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Change view using JSONEditor only
    function changeView(pane, viewType) {
        const isInputPane = pane === 'input';
        const je = isInputPane ? inputJE : outputJE;
        const text = getJEText(je).trim();
        let data;
        try { data = JSON.parse(text); } catch { data = text; }

        const modeMap = { text: 'text', code: 'code', object: 'tree', table: 'table' };
        const mode = modeMap[viewType];
        if (!mode) { showNotification(`View type '${viewType}' not supported`, 'error'); return; }

        if (!text) {
            // No content: set sensible defaults per mode
            if (mode === 'table') data = [];
            else if (mode === 'tree') data = {};
            else data = '';
        } else if (mode === 'table') {
            // Coerce to array for table view
            if (!Array.isArray(data)) {
                data = [typeof data === 'object' ? data : { value: data }];
            }
        }

        try {
            je.updateOptions({ mode });
            if (typeof data === 'string' && (mode === 'text' || mode === 'code')) {
                setJEText(je, data);
            } else {
                je.set(data);
            }
            // Persist selected view per pane
            localStorage.setItem(isInputPane ? 'view-input' : 'view-output', viewType);
            showNotification(`Changed view to ${viewType}`, 'success');
        } catch (e) {
            showNotification('Error changing view: ' + e.message, 'error');
        }
    }

    // Restore last selected views on load
    const lastInputView = localStorage.getItem('view-input') || 'code';
    const lastOutputView = localStorage.getItem('view-output') || 'code';
    changeView('input', lastInputView);
    changeView('output', lastOutputView);
    
    // Convert object to HTML table
    function objectToTable(obj) {
        if (Array.isArray(obj)) {
            if (obj.length === 0) return '<div class="empty-array">Empty Array []</div>';
            
            // Check if array contains objects
            if (typeof obj[0] === 'object' && obj[0] !== null) {
                // Get all possible keys from all objects
                const keys = new Set();
                obj.forEach(item => {
                    if (item && typeof item === 'object') {
                        Object.keys(item).forEach(key => keys.add(key));
                    }
                });
                
                const keysArray = Array.from(keys);
                
                let html = '<table class="json-table"><thead><tr>';
                keysArray.forEach(key => {
                    html += `<th>${escapeHtml(key)}</th>`;
                });
                html += '</tr></thead><tbody>';
                
                obj.forEach(item => {
                    html += '<tr>';
                    keysArray.forEach(key => {
                        const value = item && typeof item === 'object' ? item[key] : undefined;
                        html += `<td>${formatTableValue(value)}</td>`;
                    });
                    html += '</tr>';
                });
                
                html += '</tbody></table>';
                return html;
            } else {
                // Simple array of primitives
                let html = '<table class="json-table"><thead><tr><th>Index</th><th>Value</th></tr></thead><tbody>';
                
                obj.forEach((item, index) => {
                    html += `<tr><td>${index}</td><td>${formatTableValue(item)}</td></tr>`;
                });
                
                html += '</tbody></table>';
                return html;
            }
        } else {
            // Object
            let html = '<table class="json-table"><thead><tr><th>Key</th><th>Value</th></tr></thead><tbody>';
            
            Object.entries(obj).forEach(([key, value]) => {
                html += `<tr><td>${escapeHtml(key)}</td><td>${formatTableValue(value)}</td></tr>`;
            });
            
            html += '</tbody></table>';
            return html;
        }
    }
    
    // Format value for table display
    function formatTableValue(value) {
        if (value === undefined || value === null) {
            return '<span class="null-value">null</span>';
        } else if (typeof value === 'object') {
            return `<span class="object-value">${Array.isArray(value) ? 'Array' : 'Object'} [${Object.keys(value).length} items]</span>`;
        } else if (typeof value === 'string') {
            return escapeHtml(value);
        } else {
            return String(value);
        }
    }
    
    // Convert object to tree view
    function objectToTreeView(obj) {
        function buildTree(value, depth = 0) {
            const indent = '  '.repeat(depth);
            
            if (value === null || value === undefined) {
                return `<span class="null-value">null</span>`;
            } else if (Array.isArray(value)) {
                if (value.length === 0) return '[]';
                
                let result = `<details open><summary>Array [${value.length}]</summary><div class="tree-content">`;
                value.forEach((item, index) => {
                    result += `<div class="tree-item"><span class="tree-key">${index}:</span> ${buildTree(item, depth + 1)}</div>`;
                });
                result += '</div></details>';
                return result;
            } else if (typeof value === 'object') {
                const keys = Object.keys(value);
                if (keys.length === 0) return '{}';
                
                let result = `<details open><summary>Object {${keys.length}}</summary><div class="tree-content">`;
                keys.forEach(key => {
                    result += `<div class="tree-item"><span class="tree-key">${escapeHtml(key)}:</span> ${buildTree(value[key], depth + 1)}</div>`;
                });
                result += '</div></details>';
                return result;
            } else if (typeof value === 'string') {
                return `<span class="string-value">&quot;${escapeHtml(value)}&quot;</span>`;
            } else if (typeof value === 'number') {
                return `<span class="number-value">${value}</span>`;
            } else if (typeof value === 'boolean') {
                return `<span class="boolean-value">${value}</span>`;
            } else {
                return String(value);
            }
        }
        
        return `<div class="json-tree">${buildTree(obj)}</div>`;
    }
    
    // Escape HTML
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Update tab size
    function updateTabSize() {
        // No CodeMirror; tab size is used during formatJson via select value
    }

    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remove notification after delay
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // No CodeMirror focus
});
