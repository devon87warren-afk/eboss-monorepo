// ANA EBOSS Planner - Configuration Module
// Handles environment detection and emulator configuration

const EBOSSConfig = {
  // Environment detection
  get isDevelopment() {
    return window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.port === '5000' ||  // Firebase hosting emulator
      window.location.port === '8080';     // Common dev server (note: if using Firestore emulator on port 8080, use a different frontend port)
  },

  get isProduction() {
    return !this.isDevelopment;
  },

  // Emulator configuration
  get useEmulators() {
    // Check URL param first, then localStorage, then default to true for localhost
    const urlParams = new URLSearchParams(window.location.search);
    const emulatorParam = urlParams.get('emulators');

    if (emulatorParam !== null) {
      return emulatorParam === 'true';
    }

    const stored = localStorage.getItem('eboss_use_emulators');
    if (stored !== null) {
      return stored === 'true';
    }

    return this.isDevelopment;
  },

  set useEmulators(value) {
    localStorage.setItem('eboss_use_emulators', value.toString());
    console.log(`[EBOSS] Emulators ${value ? 'enabled' : 'disabled'}. Reload to apply.`);
  },

  // Emulator hosts
  get emulatorHosts() {
    return {
      auth: 'http://127.0.0.1:9099',
      firestore: '127.0.0.1:8080',
      functions: 'http://127.0.0.1:5001',
      storage: '127.0.0.1:9199'
    };
  },

  // App config URL
  get configUrl() {
    if (this.useEmulators) {
      return `http://127.0.0.1:5001/openai-mapset-eboss-map/us-central1/getAppConfig`;
    }
    return '/api/config';
  },

  // Debug mode
  get debugMode() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('debug') || localStorage.getItem('eboss_debug') === 'true';
  },

  // Feature flags
  get features() {
    return {
      offlineSync: true,
      analytics: !this.isDevelopment,
      emailNotifications: !this.isDevelopment,
      auditLogging: true,
      templates: true
    };
  },

  // Initialize Firebase with emulator settings if needed
  async initializeFirebase(firebaseApp) {
    if (!this.useEmulators) {
      console.log('[EBOSS] Using production Firebase');
      return;
    }

    console.log('[EBOSS] Connecting to Firebase emulators...');

    // Dynamically import emulator modules
    const { connectAuthEmulator } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
    const { connectFirestoreEmulator } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
    const { connectStorageEmulator } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js');
    const { connectFunctionsEmulator } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-functions.js');

    // Connect emulators
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
    const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
    const { getStorage } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js');
    const { getFunctions } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-functions.js');

    const auth = getAuth(firebaseApp);
    const db = getFirestore(firebaseApp);
    const storage = getStorage(firebaseApp);
    const functions = getFunctions(firebaseApp);

    try {
      connectAuthEmulator(auth, this.emulatorHosts.auth, { disableWarnings: true });
      console.log('[EBOSS] Auth emulator connected');
    } catch (e) {
      console.warn('[EBOSS] Auth emulator connection failed:', e.message);
    }

    try {
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      console.log('[EBOSS] Firestore emulator connected');
    } catch (e) {
      console.warn('[EBOSS] Firestore emulator connection failed:', e.message);
    }

    try {
      connectStorageEmulator(storage, '127.0.0.1', 9199);
      console.log('[EBOSS] Storage emulator connected');
    } catch (e) {
      console.warn('[EBOSS] Storage emulator connection failed:', e.message);
    }

    try {
      connectFunctionsEmulator(functions, '127.0.0.1', 5001);
      console.log('[EBOSS] Functions emulator connected');
    } catch (e) {
      console.warn('[EBOSS] Functions emulator connection failed:', e.message);
    }

    console.log('[EBOSS] All emulators connected');
  },

  // Show emulator status UI
  showEmulatorStatus() {
    if (!this.isDevelopment) return;

    // Remove existing status
    const existing = document.getElementById('emulator-status');
    if (existing) existing.remove();

    const status = document.createElement('div');
    status.id = 'emulator-status';
    status.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 10px;
      background: ${this.useEmulators ? '#e74c3c' : '#27ae60'};
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 9999;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    status.innerHTML = `
      <span style="font-weight: bold;">${this.useEmulators ? '⚠ EMULATOR MODE' : '✓ PRODUCTION'}</span>
      <span style="margin-left: 8px; opacity: 0.9;">Click to toggle</span>
    `;

    status.addEventListener('click', () => {
      this.useEmulators = !this.useEmulators;
      window.location.reload();
    });

    document.body.appendChild(status);
  }
};

// Export for use in other modules
window.EBOSSConfig = EBOSSConfig;
