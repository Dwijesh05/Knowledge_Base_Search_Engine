// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Global variables
let uploadedDocuments = [];
let apiKey = localStorage.getItem('googleApiKey') || '';
let selectedModel = localStorage.getItem('selectedModel') || 'gemini-2.5-flash';

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const queryInput = document.getElementById('queryInput');
const searchButton = document.getElementById('searchButton');
const loadingIndicator = document.getElementById('loadingIndicator');
const responseContainer = document.getElementById('responseContainer');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyButton = document.getElementById('saveApiKey');
const toastContainer = document.getElementById('toastContainer');
const querySuggestions = document.getElementById('querySuggestions');
const modelSelect = document.getElementById('modelSelect');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (apiKey) {
        apiKeyInput.value = apiKey;
    }
    
    if (selectedModel) {
        modelSelect.value = selectedModel;
    }
    
    // Load documents from localStorage
    const savedDocuments = localStorage.getItem('uploadedDocuments');
    if (savedDocuments) {
        uploadedDocuments = JSON.parse(savedDocuments);
        renderFileList();
    }
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show/hide tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById(`${tabName}-tab`).style.display = 'block';
    });
});

// Model selection
modelSelect.addEventListener('change', () => {
    selectedModel = modelSelect.value;
    localStorage.setItem('selectedModel', selectedModel);
    showToast(`Model changed to ${selectedModel}`, 'success');
});

// API Key management
saveApiKeyButton.addEventListener('click', () => {
    apiKey = apiKeyInput.value.trim();
    if (apiKey) {
        localStorage.setItem('googleApiKey', apiKey);
        showToast('API key saved successfully!', 'success');
    } else {
        showToast('Please enter a valid API key', 'error');
    }
});

// File upload handling
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

async function handleFiles(files) {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            showToast(`File "${file.name}" exceeds 10MB limit`, 'error');
            continue;
        }
        
        // Check if file already exists
        if (uploadedDocuments.some(doc => doc.name === file.name)) {
            showToast(`File "${file.name}" already exists`, 'error');
            continue;
        }
        
        // Process based on file type
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            await processTextFile(file);
        } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            await processPDFFile(file);
        } else {
            showToast(`Unsupported file type: ${file.name}. Only PDF and TXT files are supported.`, 'error');
        }
    }
}

async function processTextFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        const document = {
            id: Date.now() + Math.random(),
            name: file.name,
            type: 'txt',
            content: content,
            uploadDate: new Date().toISOString(),
            size: file.size,
            pages: 1
        };
        
        uploadedDocuments.push(document);
        saveDocuments();
        renderFileList();
        showToast(`File "${file.name}" uploaded successfully`, 'success');
    };
    reader.readAsText(file);
}

async function processPDFFile(file) {
    // Show processing indicator
    const processingId = Date.now();
    renderFileList();
    addProcessingIndicator(file.name, processingId);
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
        let fullText = '';
        
        // Extract text from all pages
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }
        
        // Remove processing indicator
        removeProcessingIndicator(processingId);
        
        const document = {
            id: Date.now() + Math.random(),
            name: file.name,
            type: 'pdf',
            content: fullText,
            uploadDate: new Date().toISOString(),
            size: file.size,
            pages: pdf.numPages
        };
        
        uploadedDocuments.push(document);
        saveDocuments();
        renderFileList();
        showToast(`PDF "${file.name}" processed successfully (${pdf.numPages} pages)`, 'success');
        
    } catch (error) {
        console.error('Error processing PDF:', error);
        removeProcessingIndicator(processingId);
        showToast(`Error processing PDF "${file.name}": ${error.message}`, 'error');
    }
}

function addProcessingIndicator(fileName, processingId) {
    const processingItem = document.createElement('div');
    processingItem.id = `processing-${processingId}`;
    processingItem.className = 'file-item';
    processingItem.innerHTML = `
        <div class="file-icon">
            <i class="bi bi-hourglass-split"></i>
        </div>
        <div class="flex-grow-1">
            <div>${fileName}</div>
            <div class="file-meta">
                <i class="bi bi-arrow-repeat me-1"></i>Processing PDF...
            </div>
        </div>
    `;
    
    const emptyState = fileList.querySelector('.empty-state');
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    fileList.appendChild(processingItem);
}

function removeProcessingIndicator(processingId) {
    const processingItem = document.getElementById(`processing-${processingId}`);
    if (processingItem) {
        processingItem.remove();
    }
}

function renderFileList() {
    if (uploadedDocuments.length === 0) {
        fileList.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-inbox"></i>
                <p>No documents uploaded yet</p>
            </div>
        `;
        querySuggestions.style.display = 'none';
        return;
    }
    
    querySuggestions.style.display = 'flex';
    
    fileList.innerHTML = uploadedDocuments.map(doc => {
        const iconClass = doc.type === 'pdf' ? 'bi-file-earmark-pdf' : 'bi-file-earmark-text';
        const badgeClass = doc.type === 'pdf' ? 'badge-pdf' : 'badge-txt';
        const fileType = doc.type.toUpperCase();
        const sizeText = formatFileSize(doc.size);
        const pagesText = doc.pages > 1 ? ` • ${doc.pages} pages` : '';
        
        return `
            <div class="file-item">
                <div class="file-icon ${doc.type}">
                    <i class="bi ${iconClass}"></i>
                </div>
                <div class="flex-grow-1">
                    <div>
                        ${doc.name}
                        <span class="file-badge ${badgeClass}">${fileType}</span>
                    </div>
                    <div class="file-meta">
                        ${sizeText}${pagesText}
                    </div>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="removeDocument('${doc.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
    }).join('');
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function saveDocuments() {
    localStorage.setItem('uploadedDocuments', JSON.stringify(uploadedDocuments));
}

function removeDocument(docId) {
    uploadedDocuments = uploadedDocuments.filter(doc => doc.id != docId);
    saveDocuments();
    renderFileList();
    showToast('Document removed', 'success');
}

// Query handling
searchButton.addEventListener('click', processQuery);
queryInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        processQuery();
    }
});

function setQuery(query) {
    queryInput.value = query;
    processQuery();
}

async function processQuery() {
    const query = queryInput.value.trim();
    
    if (!query) {
        showToast('Please enter a question', 'error');
        return;
    }
    
    if (!apiKey) {
        showToast('Please enter your Google API key', 'error');
        return;
    }
    
    if (uploadedDocuments.length === 0) {
        showToast('Please upload at least one document', 'error');
        return;
    }
    
    // Show loading indicator
    loadingIndicator.classList.add('active');
    responseContainer.innerHTML = '';
    
    try {
        // Find relevant documents based on query
        const relevantDocs = findRelevantDocuments(query);
        
        // Prepare context from relevant documents
        const context = relevantDocs.map(doc => {
            const snippet = extractRelevantSnippet(doc.content, query);
            return `Document: ${doc.name} (${doc.type.toUpperCase()})\n${snippet}`;
        }).join('\n\n---\n\n');
        
        // Call Google Generative AI API
        const response = await callGoogleAPI(query, context, relevantDocs);
        
        // Display response
        displayResponse(response, query, relevantDocs);
    } catch (error) {
        console.error('Error processing query:', error);
        showToast('Error processing your query. Please try again.', 'error');
        responseContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Error: ${error.message}
            </div>
        `;
    } finally {
        loadingIndicator.classList.remove('active');
    }
}

function findRelevantDocuments(query) {
    // Simple relevance scoring based on keyword matching
    const queryWords = query.toLowerCase().split(/\s+/);
    
    return uploadedDocuments.map(doc => {
        const content = doc.content.toLowerCase();
        let score = 0;
        
        // Count keyword matches
        queryWords.forEach(word => {
            const regex = new RegExp(word, 'gi');
            const matches = content.match(regex);
            if (matches) {
                score += matches.length;
            }
        });
        
        // Boost score for exact phrase matches
        if (content.includes(query.toLowerCase())) {
            score += 10;
        }
        
        return { ...doc, relevanceScore: score };
    }).filter(doc => doc.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3); // Use top 3 most relevant documents
}

function extractRelevantSnippet(content, query, maxLength = 1500) {
    // Find the most relevant section of the document
    const queryWords = query.toLowerCase().split(/\s+/);
    const sentences = content.split(/[.!?]+/);
    
    let bestSnippet = '';
    let bestScore = 0;
    
    sentences.forEach(sentence => {
        let score = 0;
        const lowerSentence = sentence.toLowerCase();
        
        queryWords.forEach(word => {
            if (lowerSentence.includes(word)) {
                score++;
            }
        });
        
        if (score > bestScore && sentence.trim().length > 10) {
            bestScore = score;
            bestSnippet = sentence.trim();
        }
    });
    
    // If no good snippet found, return the beginning of the content
    if (!bestSnippet || bestScore === 0) {
        return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }
    
    // Expand around the best sentence
    const snippetStart = Math.max(0, content.indexOf(bestSnippet) - 300);
    const snippetEnd = Math.min(content.length, content.indexOf(bestSnippet) + bestSnippet.length + 300);
    
    let snippet = content.substring(snippetStart, snippetEnd);
    if (snippetStart > 0) snippet = '...' + snippet;
    if (snippetEnd < content.length) snippet = snippet + '...';
    
    return snippet;
}

async function callGoogleAPI(query, context, relevantDocs) {
    // Prepare the prompt for Google Generative AI with structured instructions
    const prompt = `You are a precise and helpful assistant that answers questions based ONLY on the provided documents.

QUESTION: ${query}

DOCUMENTS:
 ${context}

REQUIREMENTS:
1. Answer the question directly and specifically (around 200 words)
2. Use proper headings and structure (H2 for main points, H3 for sub-points)
3. Use bullet points for lists when appropriate
4. Include citations like [Document: filename] when referencing information
5. Be concise but comprehensive
6. If information is not in the documents, say "I couldn't find this information in the provided documents"

FORMAT YOUR RESPONSE AS:
## Main Answer
[Brief direct answer to the question]

### Key Points
• Point 1 with citation
• Point 2 with citation
• Point 3 with citation

### Additional Details
[Any relevant additional information with citations]`;

    // Make actual API call to Google Generative AI
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.1,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get response from Google API');
    }
    
    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
    } else {
        throw new Error('Invalid response from Google API');
    }
}

function displayResponse(response, query, relevantDocs) {
    // Format the response with proper markdown-like structure
    let formattedResponse = response
        .replace(/##\s*(.+)/g, '<h2>$1</h2>')
        .replace(/###\s*(.+)/g, '<h3>$1</h3>')
        .replace(/\*\s(.+)/g, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        .replace(/\[Document:\s*([^\]]+)\]/g, '<span class="source-badge">$1</span>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');

    responseContainer.innerHTML = `
        <div class="response-box">
            <div class="response-header">
                <div class="response-title">
                    <i class="bi bi-chat-dots me-2"></i>
                    ${query}
                </div>
                <div>
                    <span class="relevance-indicator">${selectedModel}</span>
                </div>
            </div>
            
            <div class="stats-bar">
                <div>
                    <i class="bi bi-files me-1"></i>
                    ${relevantDocs.length} document(s) analyzed
                </div>
                <div>
                    <i class="bi bi-clock me-1"></i>
                    ${new Date().toLocaleTimeString()}
                </div>
            </div>
            
            <div class="response-content">
                ${formattedResponse}
            </div>
            
            <div class="action-bar">
                <button class="action-btn" onclick="copyResponse()">
                    <i class="bi bi-clipboard"></i>
                    Copy
                </button>
                <button class="action-btn" onclick="downloadResponse()">
                    <i class="bi bi-download"></i>
                    Download
                </button>
                <button class="action-btn" onclick="shareResponse()">
                    <i class="bi bi-share"></i>
                    Share
                </button>
            </div>
        </div>
    `;
    
    // Store response for actions
    window.currentResponse = response;
    window.currentQuery = query;
}

function copyResponse() {
    if (window.currentResponse) {
        navigator.clipboard.writeText(window.currentResponse).then(() => {
            showToast('Answer copied to clipboard', 'success');
        });
    }
}

function downloadResponse() {
    if (window.currentResponse && window.currentQuery) {
        const content = `Question: ${window.currentQuery}\n\nAnswer:\n${window.currentResponse}`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `answer_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Answer downloaded', 'success');
    }
}

function shareResponse() {
    if (navigator.share && window.currentResponse) {
        navigator.share({
            title: 'Knowledge Base Search Result',
            text: `Q: ${window.currentQuery}\n\n${window.currentResponse}`
        });
    } else {
        showToast('Sharing not supported on this device', 'error');
    }
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast-custom toast-${type}`;
    
    const icon = type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-circle-fill text-danger';
    
    toast.innerHTML = `
        <i class="bi ${icon} fs-5"></i>
        <div>${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}