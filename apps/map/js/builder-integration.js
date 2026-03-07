// Builder.io Integration for ANA EBOSS Planner
// Enables visual editing of UI components via Builder.io

const BUILDER_CONFIG = {
  // Replace with your Builder.io API key
  apiKey: window.BUILDER_API_KEY || null,
  
  // Model names for different page types
  models: {
    page: 'page',
    assetCard: 'asset-card',
    sidePanel: 'side-panel',
    dialog: 'dialog'
  }
};

/**
 * Initialize Builder.io SDK
 */
async function initBuilder() {
  if (!BUILDER_CONFIG.apiKey) {
    console.log('[Builder.io] No API key configured. Skipping integration.');
    showBuilderSetupNotice();
    return false;
  }

  try {
    // Load Builder.io SDK
    await loadScript('https://cdn.builder.io/js/webcomponents');
    
    // Initialize Builder
    window.builder = window.builder || {};
    builder.init(BUILDER_CONFIG.apiKey);
    
    console.log('[Builder.io] Initialized successfully');
    
    // Load editable components
    await loadBuilderComponents();
    
    return true;
  } catch (error) {
    console.error('[Builder.io] Initialization failed:', error);
    return false;
  }
}

/**
 * Load external script
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Load Builder.io components for editable areas
 */
async function loadBuilderComponents() {
  // Make specific containers editable via Builder.io
  
  // Side Panel Header
  const sidePanelHeader = document.querySelector('.panel-header');
  if (sidePanelHeader) {
    sidePanelHeader.setAttribute('builder-model', 'side-panel-header');
    sidePanelHeader.classList.add('builder-editable');
  }
  
  // Asset Card Template
  // This allows editing the asset card design in Builder.io
  const assetList = document.getElementById('asset-list');
  if (assetList) {
    assetList.setAttribute('builder-model', 'asset-card');
    assetList.classList.add('builder-editable');
  }
  
  // Dialog Templates
  const dialogs = document.querySelectorAll('.dialog');
  dialogs.forEach((dialog, index) => {
    dialog.setAttribute('builder-model', `dialog-${index}`);
    dialog.classList.add('builder-editable');
  });
}

/**
 * Render a Builder.io component
 * @param {string} model - Builder model name
 * @param {Object} data - Data to pass to the component
 * @returns {Promise<HTMLElement>}
 */
async function renderBuilderComponent(model, data = {}) {
  if (!window.builder) {
    console.warn('[Builder.io] Not initialized');
    return null;
  }
  
  try {
    const response = await fetch(
      `https://cdn.builder.io/api/v2/content/${model}?apiKey=${BUILDER_CONFIG.apiKey}&userAttributes.urlPath=/`
    );
    
    if (!response.ok) throw new Error('Failed to fetch content');
    
    const content = await response.json();
    
    if (content.data && content.data.html) {
      const container = document.createElement('div');
      container.innerHTML = content.data.html;
      return container.firstElementChild;
    }
    
    return null;
  } catch (error) {
    console.error('[Builder.io] Render failed:', error);
    return null;
  }
}

/**
 * Show setup notice if API key not configured
 */
function showBuilderSetupNotice() {
  // Only show in development
  if (window.location.hostname !== 'localhost' && 
      window.location.hostname !== '127.0.0.1') return;
  
  const notice = document.createElement('div');
  notice.id = 'builder-setup-notice';
  notice.innerHTML = `
    <div style="
      position: fixed;
      top: 10px;
      right: 10px;
      background: #ff6b6b;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 300px;
      font-family: sans-serif;
      font-size: 14px;
    ">
      <div style="font-weight: bold; margin-bottom: 8px;">🔧 Builder.io Setup Required</div>
      <p style="margin: 0 0 10px 0; opacity: 0.9;">
        Add your API key to enable visual editing:
      </p>
      <code style="
        background: rgba(0,0,0,0.2);
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        display: block;
        word-break: break-all;
      ">localStorage.setItem('builder_api_key', 'YOUR_KEY')</code>
      <button onclick="this.parentElement.parentElement.remove()" style="
        margin-top: 10px;
        background: white;
        color: #ff6b6b;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
      ">Dismiss</button>
    </div>
  `;
  
  document.body.appendChild(notice);
}

/**
 * Open Builder.io visual editor
 * Opens the current page in Builder.io editor
 */
function openBuilderEditor() {
  if (!BUILDER_CONFIG.apiKey) {
    alert('Builder.io API key not configured.\n\nSet it via:\nlocalStorage.setItem("builder_api_key", "YOUR_API_KEY")');
    return;
  }
  
  const currentUrl = encodeURIComponent(window.location.href);
  const editorUrl = `https://builder.io/content?apiKey=${BUILDER_CONFIG.apiKey}&url=${currentUrl}`;
  
  window.open(editorUrl, '_blank');
}

/**
 * Add Builder.io edit button to UI
 */
function addBuilderEditButton() {
  // Only in development
  if (window.location.hostname !== 'localhost' && 
      window.location.hostname !== '127.0.0.1' &&
      !window.location.search.includes('builder=true')) return;
  
  const button = document.createElement('button');
  button.id = 'builder-edit-btn';
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/>
    </svg>
    <span>Edit in Builder.io</span>
  `;
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #0a85d1;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 30px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(10, 133, 209, 0.4);
    z-index: 9999;
    transition: all 0.2s ease;
  `;
  
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.05)';
    button.style.boxShadow = '0 6px 16px rgba(10, 133, 209, 0.5)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 4px 12px rgba(10, 133, 209, 0.4)';
  });
  
  button.addEventListener('click', openBuilderEditor);
  
  document.body.appendChild(button);
}

// Check for API key from localStorage
try {
  const storedKey = localStorage.getItem('builder_api_key');
  if (storedKey) {
    BUILDER_CONFIG.apiKey = storedKey;
  }
} catch (e) {
  console.warn('[Builder.io] Could not read localStorage');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initBuilder();
    addBuilderEditButton();
  });
} else {
  initBuilder();
  addBuilderEditButton();
}

// Export for use
window.BuilderIntegration = {
  init: initBuilder,
  render: renderBuilderComponent,
  openEditor: openBuilderEditor,
  config: BUILDER_CONFIG
};
