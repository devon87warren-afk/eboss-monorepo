/**
 * Kimi Vision - Options Page Script
 * Handles settings management
 */

// DOM Elements
const settingsForm = document.getElementById('settingsForm');
const apiKeyInput = document.getElementById('apiKey');
const togglePassword = document.getElementById('togglePassword');
const cancelBtn = document.getElementById('cancelBtn');
const status = document.getElementById('status');
const statusText = document.getElementById('statusText');

// State
let originalApiKey = '';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
});

function setupEventListeners() {
  // Toggle password visibility
  togglePassword.addEventListener('click', togglePasswordVisibility);
  
  // Form submission
  settingsForm.addEventListener('submit', handleSubmit);
  
  // Cancel button
  cancelBtn.addEventListener('click', () => {
    window.close();
  });
  
  // Hide status when typing
  apiKeyInput.addEventListener('input', () => {
    hideStatus();
  });
}

// Load saved settings
async function loadSettings() {
  try {
    const { kimiApiKey } = await chrome.storage.sync.get('kimiApiKey');
    if (kimiApiKey) {
      // Show masked key (first 8 and last 4 characters)
      const maskedKey = maskApiKey(kimiApiKey);
      apiKeyInput.value = maskedKey;
      originalApiKey = maskedKey;
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
    showStatus('Failed to load settings', 'error');
  }
}

// Mask API key for display
function maskApiKey(key) {
  if (key.length <= 12) return key;
  return key.slice(0, 8) + '•'.repeat(key.length - 12) + key.slice(-4);
}

// Toggle password visibility
function togglePasswordVisibility() {
  const isPassword = apiKeyInput.type === 'password';
  apiKeyInput.type = isPassword ? 'text' : 'password';
  
  // Update icon
  togglePassword.innerHTML = isPassword 
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
         <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
         <line x1="1" y1="1" x2="23" y2="23"/>
       </svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
         <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
         <circle cx="12" cy="12" r="3"/>
       </svg>`;
}

// Handle form submission
async function handleSubmit(e) {
  e.preventDefault();
  
  const apiKey = apiKeyInput.value.trim();
  
  // Validate
  if (!apiKey) {
    showStatus('Please enter an API key', 'error');
    return;
  }
  
  // Check if key was modified (not just the masked version)
  if (apiKey === originalApiKey && apiKey.includes('•')) {
    showStatus('No changes to save', 'error');
    return;
  }
  
  // Validate key format (basic check)
  if (!apiKey.startsWith('sk-')) {
    showStatus('API key should start with "sk-"', 'error');
    return;
  }
  
  try {
    // Test the API key first
    const isValid = await testApiKey(apiKey);
    
    if (!isValid) {
      showStatus('Invalid API key. Please check and try again.', 'error');
      return;
    }
    
    // Save to storage
    await chrome.storage.sync.set({ kimiApiKey: apiKey });
    
    // Update masked display
    const maskedKey = maskApiKey(apiKey);
    apiKeyInput.value = maskedKey;
    originalApiKey = maskedKey;
    apiKeyInput.type = 'password';
    
    showStatus('Settings saved successfully!', 'success');
    
  } catch (error) {
    console.error('Failed to save settings:', error);
    showStatus(`Error: ${error.message}`, 'error');
  }
}

// Test API key validity
async function testApiKey(apiKey) {
  try {
    const response = await fetch('https://api.moonshot.cn/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('API test failed:', error);
    return false;
  }
}

// Show status message
function showStatus(message, type) {
  statusText.textContent = message;
  status.className = `status ${type} visible`;
  
  // Auto-hide after 5 seconds for success
  if (type === 'success') {
    setTimeout(hideStatus, 5000);
  }
}

// Hide status message
function hideStatus() {
  status.classList.remove('visible');
}
