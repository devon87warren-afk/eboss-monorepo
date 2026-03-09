/**
 * Kimi Vision - Popup Script
 * Handles screenshot capture and Kimi API integration
 */

// DOM Elements
const stateInitial = document.getElementById('stateInitial');
const stateLoading = document.getElementById('stateLoading');
const stateResults = document.getElementById('stateResults');
const stateError = document.getElementById('stateError');

const captureBtn = document.getElementById('captureBtn');
const retryBtn = document.getElementById('retryBtn');
const newCaptureBtn = document.getElementById('newCaptureBtn');
const copyBtn = document.getElementById('copyBtn');
const settingsBtn = document.getElementById('settingsBtn');

const previewImage = document.getElementById('previewImage');
const resultsContent = document.getElementById('resultsContent');
const errorMessage = document.getElementById('errorMessage');
const apiStatus = document.getElementById('apiStatus');

// State
let currentScreenshot = null;
let currentAnalysis = null;

// API Configuration
const KIMI_API_BASE = 'https://api.moonshot.cn/v1';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  checkApiStatus();
  setupEventListeners();
});

function setupEventListeners() {
  captureBtn.addEventListener('click', handleCapture);
  retryBtn.addEventListener('click', handleCapture);
  newCaptureBtn.addEventListener('click', resetToInitial);
  copyBtn.addEventListener('click', copyResults);
  settingsBtn.addEventListener('click', openSettings);
}

// Check API key status
async function checkApiStatus() {
  const { kimiApiKey } = await chrome.storage.sync.get('kimiApiKey');
  if (kimiApiKey) {
    apiStatus.classList.add('ready');
    apiStatus.querySelector('.status-text').textContent = 'API Ready';
  } else {
    apiStatus.classList.add('error');
    apiStatus.querySelector('.status-text').textContent = 'API Key Required';
  }
}

// State management
function showState(state) {
  stateInitial.classList.add('hidden');
  stateLoading.classList.add('hidden');
  stateResults.classList.add('hidden');
  stateError.classList.add('hidden');
  
  state.classList.remove('hidden');
}

function resetToInitial() {
  currentScreenshot = null;
  currentAnalysis = null;
  showState(stateInitial);
}

// Capture screenshot and analyze
async function handleCapture() {
  try {
    showState(stateLoading);
    
    // Get API key
    const { kimiApiKey } = await chrome.storage.sync.get('kimiApiKey');
    if (!kimiApiKey) {
      throw new Error('Please set your Kimi API key in settings');
    }
    
    // Capture screenshot
    const screenshot = await captureScreenshot();
    currentScreenshot = screenshot;
    
    // Show preview
    previewImage.src = screenshot;
    
    // Analyze with Kimi
    const analysis = await analyzeWithKimi(screenshot, kimiApiKey);
    currentAnalysis = analysis;
    
    // Display results
    displayResults(analysis);
    showState(stateResults);
    
  } catch (error) {
    console.error('Capture failed:', error);
    errorMessage.textContent = error.message || 'Failed to capture or analyze screenshot';
    showState(stateError);
  }
}

// Capture visible tab screenshot
async function captureScreenshot() {
  try {
    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('No active tab found');
    }
    
    // Capture visible area
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png',
      quality: 90
    });
    
    return dataUrl;
  } catch (error) {
    throw new Error(`Screenshot failed: ${error.message}`);
  }
}

// Analyze screenshot with Kimi Vision API
async function analyzeWithKimi(imageDataUrl, apiKey) {
  // Convert data URL to base64
  const base64Image = imageDataUrl.split(',')[1];
  
  const requestBody = {
    model: 'moonshot-v1-8k-vision-preview',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that analyzes webpage screenshots. Provide concise, insightful observations about the content, layout, design, and purpose of the page. Use markdown formatting.'
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: imageDataUrl
            }
          },
          {
            type: 'text',
            text: 'Analyze this webpage screenshot. Describe: 1) What the page is about, 2) Key visual elements and layout, 3) Design quality assessment, 4) Any recommendations for improvement.'
          }
        ]
      }
    ],
    temperature: 0.7,
    max_tokens: 800
  };
  
  const response = await fetch(`${KIMI_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid API response format');
  }
  
  return data.choices[0].message.content;
}

// Display analysis results
function displayResults(analysis) {
  // Convert markdown-like formatting to HTML
  const html = markdownToHtml(analysis);
  resultsContent.innerHTML = html;
}

// Simple markdown to HTML converter
function markdownToHtml(markdown) {
  let html = markdown
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Blockquotes
    .replace(/^&gt; (.*$)/gim, '<blockquote>$1</blockquote>')
    // Unordered lists
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n)+/g, '<ul>$&</ul>')
    // Ordered lists
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    // Line breaks
    .replace(/\n/g, '<br>');
  
  // Wrap in paragraph if not already wrapped
  if (!html.startsWith('<')) {
    html = `<p>${html}</p>`;
  }
  
  // Clean up list wrapping
  html = html.replace(/<ul>(<li>.*<\/li>\n)+<\/ul>/g, match => {
    return '<ul>' + match.replace(/<\/?ul>/g, '') + '</ul>';
  });
  
  return html;
}

// Copy results to clipboard
async function copyResults() {
  if (!currentAnalysis) return;
  
  try {
    await navigator.clipboard.writeText(currentAnalysis);
    
    // Visual feedback
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Copied!
    `;
    copyBtn.classList.add('primary');
    copyBtn.classList.remove('secondary');
    
    setTimeout(() => {
      copyBtn.innerHTML = originalText;
      copyBtn.classList.remove('primary');
      copyBtn.classList.add('secondary');
    }, 2000);
  } catch (error) {
    console.error('Copy failed:', error);
  }
}

// Open settings page
function openSettings() {
  chrome.runtime.openOptionsPage();
}
