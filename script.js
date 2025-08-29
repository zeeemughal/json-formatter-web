document.addEventListener('DOMContentLoaded', function() {
    // Check for saved theme preference or use system preference
    const isDarkMode = localStorage.getItem('dark-theme') === 'true' || 
        (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDarkMode) {
        document.body.classList.add('dark-theme');
    }
    
    // Load saved JSON input if available
    const savedInput = localStorage.getItem('json-input');
    let initialInput = savedInput || JSON.stringify({
        "name": "JSON Formatter",
        "version": "1.0.0",
        "description": "Format, validate and convert JSON",
        "features": ["Format", "Minify", "Validate", "Convert"],
        "isAwesome": true,
        "stats": {
            "users": 10000,
            "rating": 4.9
        }
    }, null, 2);
    
    // Initialize CodeMirror editors
    const inputEditor = CodeMirror.fromTextArea(document.getElementById('json-input'), {
        lineNumbers: true,
        mode: 'application/json',
        theme: 'default',
        lineWrapping: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 2,
        tabSize: 2,
        extraKeys: {
            'Ctrl-Enter': formatJson,
            'Cmd-Enter': formatJson,
            'Ctrl-Z': () => inputEditor.undo(),
            'Cmd-Z': () => inputEditor.undo()
        },
        styleActiveLine: true,
        gutters: ["CodeMirror-linenumbers", "CodeMirror-lint-markers"]
    });
    
    // Set initial value and save changes to localStorage
    inputEditor.setValue(initialInput);
    inputEditor.on('change', function() {
        localStorage.setItem('json-input', inputEditor.getValue());
    });

    const outputEditor = CodeMirror.fromTextArea(document.getElementById('json-output'), {
        lineNumbers: true,
        mode: 'application/json',
        theme: 'default',
        lineWrapping: true,
        readOnly: false, // Allow editing for undo functionality
        styleActiveLine: true,
        extraKeys: {
            'Ctrl-Z': () => outputEditor.undo(),
            'Cmd-Z': () => outputEditor.undo()
        },
        gutters: ["CodeMirror-linenumbers", "CodeMirror-lint-markers"]
    });

    // Load saved output if available
    const savedOutput = localStorage.getItem('json-output');
    if (savedOutput) {
        outputEditor.setValue(savedOutput);
    }
    // Persist output on change
    outputEditor.on('change', function() {
        localStorage.setItem('json-output', outputEditor.getValue());
    });

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
        
        // Update editor themes
        inputEditor.setOption('theme', 'default');
        outputEditor.setOption('theme', 'default');
        
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
    
    // Undo buttons
    undoInputBtn.addEventListener('click', () => inputEditor.undo());
    undoOutputBtn.addEventListener('click', () => outputEditor.undo());
    
    // Save buttons
    saveInputBtn.addEventListener('click', () => saveToFile(inputEditor.getValue(), 'input.json'));
    saveOutputBtn.addEventListener('click', () => saveToFile(outputEditor.getValue(), 'output.json'));
    
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
            changeView(inputEditor, viewType);
            viewInputDropdown.classList.remove('show');
        });
    });
    
    document.querySelectorAll('#view-output-dropdown a').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewType = e.target.getAttribute('data-view');
            changeView(outputEditor, viewType);
            viewOutputDropdown.classList.remove('show');
        });
    });
    fileInput.addEventListener('change', handleFileUpload);

    // Format JSON
    function formatJson() {
        try {
            const input = inputEditor.getValue().trim();
            if (!input) {
                showNotification('Please enter some JSON to format', 'info');
                return;
            }
            
            const parsed = JSON.parse(input);
            const tabSize = tabSizeSelect.value === 'tab' ? '\t' : parseInt(tabSizeSelect.value);
            const formatted = JSON.stringify(parsed, null, tabSize);
            
            outputEditor.setValue(formatted);
            showNotification('JSON formatted successfully!', 'success');
        } catch (error) {
            showNotification('Invalid JSON: ' + error.message, 'error');
        }
    }

    // Minify JSON
    function minifyJson() {
        try {
            const input = inputEditor.getValue().trim();
            if (!input) {
                showNotification('Please enter some JSON to minify', 'info');
                return;
            }
            
            const parsed = JSON.parse(input);
            const minified = JSON.stringify(parsed);
            
            outputEditor.setValue(minified);
            showNotification('JSON minified successfully!', 'success');
        } catch (error) {
            showNotification('Invalid JSON: ' + error.message, 'error');
        }
    }

    // Validate JSON
    function validateJson() {
        try {
            const input = inputEditor.getValue().trim();
            if (!input) {
                showNotification('Please enter some JSON to validate', 'info');
                return;
            }
            
            JSON.parse(input);
            showNotification('✓ Valid JSON', 'success');
            
            // Clear any previous error markers
            outputEditor.setValue('');
            clearErrorMarkers(outputEditor);
        } catch (error) {
            showNotification('Invalid JSON: ' + error.message, 'error');
            
            // Display error in output editor with line highlighting
            const errorInfo = parseJsonError(error.message, inputEditor.getValue());
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
        outputEditor.setValue(errorMessage);
        
        // Highlight the error line in input editor
        const errorLine = errorInfo.line - 1; // CodeMirror uses 0-based line numbers
        
        // Clear any previous error markers
        clearErrorMarkers(inputEditor);
        
        // Add error marker
        inputEditor.addLineClass(errorLine, 'background', 'error-line');
        
        // Add error gutter marker
        const marker = document.createElement('div');
        marker.className = 'error-marker';
        marker.innerHTML = '⚠️';
        marker.title = errorInfo.message;
        inputEditor.setGutterMarker(errorLine, 'CodeMirror-lint-markers', marker);
        
        // Scroll to error line
        inputEditor.scrollIntoView({line: errorLine, ch: 0}, 100);
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
            const input = inputEditor.getValue().trim();
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
            
            outputEditor.setValue(converted);
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
    
    // JSON to YAML conversion
    function jsonToYaml(obj, indent = '') {
        let yaml = '';
        
        function parseValue(value, indent) {
            if (value === null) {
                return 'null';
            } else if (typeof value === 'string') {
                // Check if string needs quotes
                if (/[:\[\]{}\-,#\s]/.test(value) || value === '' || !isNaN(value)) {
                    return `"${value.replace(/"/g, '\\"')}"`;
                }
                return value;
            } else if (typeof value === 'number' || typeof value === 'boolean') {
                return String(value);
            } else if (Array.isArray(value)) {
                let result = '';
                value.forEach(item => {
                    if (typeof item === 'object' && item !== null) {
                        result += `\n${indent}- `;
                        const nestedIndent = indent + '  ';
                        if (Array.isArray(item)) {
                            result += parseValue(item, nestedIndent);
                        } else {
                            const objResult = parseObject(item, nestedIndent);
                            result += objResult.substring(nestedIndent.length);
                        }
                    } else {
                        result += `\n${indent}- ${parseValue(item, indent + '  ')}`;
                    }
                });
                return result || '[]';
            } else if (typeof value === 'object') {
                return parseObject(value, indent);
            }
            return '';
        }
        
        function parseObject(obj, indent) {
            let result = '';
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const value = obj[key];
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        result += `\n${indent}${key}:`;
                        const nested = parseObject(value, indent + '  ');
                        if (nested.trim()) {
                            result += nested;
                        }
                    } else if (Array.isArray(value)) {
                        result += `\n${indent}${key}:${parseValue(value, indent + '  ')}`;
                    } else {
                        result += `\n${indent}${key}: ${parseValue(value, indent + '  ')}`;
                    }
                }
            }
            return result;
        }
        
        yaml = parseObject(obj, indent);
        return yaml.substring(1); // Remove the first newline
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
                inputEditor.setValue(content);
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
            const output = outputEditor.getValue().trim();
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
    
    // Change view type
    // JSONEditor instances and containers
    let inputJsonEditor = null;
    let outputJsonEditor = null;
    const [inputWrapper, outputWrapper] = document.querySelectorAll('.editor-wrapper');
    const inputJsonHost = document.createElement('div');
    inputJsonHost.className = 'jsoneditor-host';
    inputJsonHost.style.display = 'none';
    inputWrapper.appendChild(inputJsonHost);
    const outputJsonHost = document.createElement('div');
    outputJsonHost.className = 'jsoneditor-host';
    outputJsonHost.style.display = 'none';
    outputWrapper.appendChild(outputJsonHost);

    function ensureJsonEditor(editorRef, hostEl, mode) {
        if (!editorRef.instance) {
            editorRef.instance = new JSONEditor(hostEl, {
                mode,
                onChange: () => {
                    try {
                        const data = editorRef.instance.get();
                        const jsonText = JSON.stringify(data, null, inputEditor.getOption('tabSize'));
                        editorRef.cm.setValue(jsonText);
                        localStorage.setItem(editorRef.storageKey, jsonText);
                    } catch (e) { /* ignore until valid */ }
                }
            });
        } else {
            editorRef.instance.updateOptions({ mode });
        }
    }

    inputJsonEditor = { instance: null, host: inputJsonHost, cm: inputEditor, storageKey: 'json-input' };
    outputJsonEditor = { instance: null, host: outputJsonHost, cm: outputEditor, storageKey: 'json-output' };

    function showCodeMirror(editorRef) {
        editorRef.host.style.display = 'none';
        editorRef.cm.getWrapperElement().style.display = '';
    }

    function showJsonEditor(editorRef) {
        editorRef.cm.getWrapperElement().style.display = 'none';
        editorRef.host.style.display = '';
    }

    function changeView(editor, viewType) {
        const isInput = editor === inputEditor;
        const ref = isInput ? inputJsonEditor : outputJsonEditor;
        const content = editor.getValue().trim();
        if (!content) {
            showNotification('No content to display', 'info');
            return;
        }

        try {
            let parsed;
            try {
                parsed = JSON.parse(content);
            } catch (e) {
                parsed = content;
            }

            switch (viewType) {
                case 'text': {
                    const displayContent = typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, editor.getOption('tabSize'));
                    showCodeMirror(ref);
                    editor.setOption('mode', 'text/plain');
                    editor.setValue(displayContent);
                    break;
                }
                case 'code': {
                    const displayContent = typeof parsed === 'string' ? (() => { try { return JSON.stringify(JSON.parse(parsed), null, editor.getOption('tabSize')); } catch { return parsed; } })() : JSON.stringify(parsed, null, editor.getOption('tabSize'));
                    showCodeMirror(ref);
                    editor.setOption('mode', 'application/json');
                    editor.setValue(displayContent);
                    break;
                }
                case 'table': {
                    if (typeof parsed !== 'object') { showNotification('Cannot display as table: not a valid object', 'error'); return; }
                    ensureJsonEditor(ref, ref.host, 'table');
                    ref.instance.set(parsed);
                    showJsonEditor(ref);
                    break;
                }
                case 'object': {
                    if (typeof parsed !== 'object') { showNotification('Cannot display as object: not a valid object', 'error'); return; }
                    ensureJsonEditor(ref, ref.host, 'tree');
                    ref.instance.set(parsed);
                    showJsonEditor(ref);
                    break;
                }
                default:
                    showNotification(`View type '${viewType}' not supported`, 'error');
                    return;
            }
            showNotification(`Changed view to ${viewType}`, 'success');
        } catch (error) {
            showNotification('Error changing view: ' + error.message, 'error');
        }
    }
    
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
        const tabSize = tabSizeSelect.value;
        inputEditor.setOption('indentUnit', tabSize === 'tab' ? '\t' : parseInt(tabSize));
        inputEditor.setOption('tabSize', tabSize === 'tab' ? 4 : parseInt(tabSize));
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

    // Focus input editor on load
    inputEditor.focus();
});
