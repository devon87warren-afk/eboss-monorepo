// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocs,
  where
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  refFromURL,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import {
  getFunctions,
  httpsCallable
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-functions.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { DrawingManager } from './drawing.js';
// db.js and firebase-config.js are legacy modules that initialise a second Firebase app.
// All production Firebase operations now go through the instances created in initApp().
// The legacy import below is intentionally removed to prevent a duplicate-app crash.
// import { isDbEnabled, loadGenerators, ... } from './db.js';

// Firebase instances — Initialized inside initApp() after config is fetched from
// Google Secret Manager via the getAppConfig Cloud Function (window.__appConfigPromise).
let db, storage, functions;
let auth;

let map;
let taggedAssets = [];
let activeInfoWindow = null;
let tempLocation = null;
let tempPhotoDataUrl = null;
let currentlyEditingAssetIndex = null;
let selectedProject = ''; // Empty string = all projects

// Drawing tools state
let activeDrawingListeners = [];

// ─── Security Helpers ────────────────────────────────────────────────────────

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} unsafe - Unsafe HTML string
 * @returns {string} - Safe HTML string
 */
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
let drawingMode = false;
let drawnShapes = [];
let pendingShape = null;
let editingShapeId = null;
let contextMenuTargetId = null;
let AdvancedMarkerElementClass = null;
let PinElementClass = null;
let textPlacementListener = null;
let drawingManager;
let AdvancedMarkerElementClass;
let PinElementClass;

let userLocation = null; // { lat, lng, address }

// Multi-site state
let activeSiteId = null; // Currently selected site
let allSites = []; // List of all active sites
let editingSiteId = null; // null = create mode, string = edit mode (site id)
let siteToDelete = null; // site object pending delete confirmation

// Listener unsubscribe functions for cleanup (prevents ghost markers on site switch)
let unsubscribeAssets = null;


// Undo delete state
let deletedAssetBackup = null;

// Verified ANA EBOSS 3-Phase Models (from anacorp.com)
const EBOSS_MODELS = [
  { name: 'EBOSS 25', kw: 24 },
  { name: 'EBOSS 70', kw: 56 },
  { name: 'EBOSS 125', kw: 100 },
  { name: 'EBOSS 220', kw: 176 },
  { name: 'BOSS400', kw: 320 }
];

// Get user location from localStorage or geolocation API
async function getUserMapCenter() {
  // Check if user location is already saved
  const savedLocation = localStorage.getItem('eboss_user_location');
  if (savedLocation) {
    try {
      const loc = JSON.parse(savedLocation);
      if (Number.isFinite(loc?.lat) && Number.isFinite(loc?.lng)) {
        userLocation = loc;
        return { lat: loc.lat, lng: loc.lng };
      }
      localStorage.removeItem('eboss_user_location');
    } catch (error) {
      showStatusMessage('Invalid saved location in localStorage, resetting.');
    }
  }

  // Try to get browser geolocation
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: null
          };
          userLocation = loc;
          localStorage.setItem('eboss_user_location', JSON.stringify(loc));
          resolve({ lat: loc.lat, lng: loc.lng });
        },
        () => {
          // Geolocation denied or failed - use Abilene as default
          const defaultLoc = { lat: 32.4487, lng: -99.7331, address: 'Abilene, TX (default)' };
          userLocation = defaultLoc;
          localStorage.setItem('eboss_user_location', JSON.stringify(defaultLoc));
          resolve({ lat: defaultLoc.lat, lng: defaultLoc.lng });
        }
      );
    } else {
      // Geolocation not supported - use Abilene as default
      const defaultLoc = { lat: 32.4487, lng: -99.7331, address: 'Abilene, TX (default)' };
      userLocation = defaultLoc;
      localStorage.setItem('eboss_user_location', JSON.stringify(defaultLoc));
      resolve({ lat: defaultLoc.lat, lng: defaultLoc.lng });
    }
  });
}

async function initApp() {
  try {
    // Fetch app config (Firebase + Maps API key) from Secret Manager via Cloud Function.
    // The Maps loader is also registered inside this promise (see index.html bootstrap).
    const cfg = await window.__appConfigPromise;
    if (!cfg || !cfg.firebaseConfig) {
      showStatusMessage("App config unavailable — cannot Initialize.");
      return;
    }

    // Initialize Firebase with the fetched config
    const firebaseApp = initializeApp(cfg.firebaseConfig);
    getAnalytics(firebaseApp);
    db = getFirestore(firebaseApp);
    storage = getStorage(firebaseApp);
    functions = getFunctions(firebaseApp);
    auth = getAuth(firebaseApp);

    // Connect to emulators if in development mode
    if (typeof EBOSSConfig !== 'undefined' && EBOSSConfig.useEmulators) {
      await EBOSSConfig.initializeFirebase(firebaseApp);
    }

    // Enable offline persistence for field connectivity (only in production)
    if (typeof EBOSSConfig === 'undefined' || !EBOSSConfig.useEmulators) {
      try {
        const { enableIndexedDbPersistence } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await enableIndexedDbPersistence(db);
        console.log('Firestore offline persistence enabled');
      } catch (persistErr) {
        if (persistErr.code === 'failed-precondition') {
          showStatusMessage('Multiple tabs open, persistence can only be enabled in one tab at a time');
        } else if (persistErr.code === 'unimplemented') {
          showStatusMessage('Browser does not support offline persistence');
        }
      }
    }

    // Show emulator status indicator
    if (typeof EBOSSConfig !== 'undefined') {
      EBOSSConfig.showEmulatorStatus();
    }

    // Set up auth state listener
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check domain
        const email = user.email?.toLowerCase() || '';
        if (!email.endsWith('@anacorp.com')) {
          await signOut(auth);
          // Auth UI not yet implemented; surface error in the status bar
          showStatusMessage('Access restricted to anacorp.com domain only.');
          return;
        }

        // User is signed in and domain is valid
        console.log('User signed in:', user.email);
        // loadUserProfile / hideAuthModal are not yet implemented — placeholder
        if (typeof loadUserProfile === 'function') await loadUserProfile();
        if (typeof hideAuthModal === 'function') hideAuthModal();
      } else {
        // User is signed out - show login
        if (drawingManager) {
          drawingManager.cleanup();
        }
        clearMapVisualState();
        taggedAssets = [];
        updateAssetList();
        updateStats();
        // showAuthModal is not yet implemented — placeholder
        if (typeof showAuthModal === 'function') showAuthModal();
      }
    });

    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

    // Get user location from storage or geolocation
    let mapCenter = await getUserMapCenter();

    map = new Map(document.getElementById('map'), {
      center: mapCenter,
      zoom: 14,
      mapTypeId: 'satellite',
      clickableIcons: false,
      mapId: 'b857118793470b6c9ac4b91e'
    });

    AdvancedMarkerElementClass = AdvancedMarkerElement;
    PinElementClass = PinElement;
    setupEventListeners(AdvancedMarkerElement, PinElement);
    drawingManager = new DrawingManager(map, db, () => activeSiteId, showStatusMessage, () => AdvancedMarkerElementClass);
    drawingManager.setupDrawingTools();

    // Load all available sites
    await loadActiveSites();

    // Resolve active site from localStorage
    const savedSiteId = localStorage.getItem('eboss_active_site_id');
    const savedSiteStillExists = savedSiteId && allSites.some(site => site.id === savedSiteId);

    if (savedSiteStillExists) {
      // Site previously selected; restore it
      activeSiteId = savedSiteId;
      await siteSwitch(savedSiteId, AdvancedMarkerElement, PinElement);
    } else {
      // Default startup mode: require explicit site selection
      await siteSwitch(null, AdvancedMarkerElement, PinElement);
    }

    // Show onboarding if first time
    showOnboarding();

    // Register service worker for offline support
    registerServiceWorker();

  } catch (error) {
    console.error("Error initializing app:", error);
  }
}

// ─── Service Worker Registration ─────────────────────────────────────────────

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[App] Service Worker registered:', registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              showUpdateNotification(newWorker);
            }
          });
        });
      })
      .catch((error) => {
        console.warn('[App] Service Worker registration failed:', error);
      });
  }
}

function showUpdateNotification(worker) {
  // Show update available toast
  const toast = document.createElement('div');
  toast.className = 'undo-toast';
  toast.style.cssText = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: var(--primary); color: white; padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 1000; display: flex; align-items: center; gap: 15px;';
  toast.innerHTML = `
    <span>Update available!</span>
    <button id="update-app-btn" style="background: white; color: var(--primary); border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 500;">Update</button>
  `;
  document.body.appendChild(toast);

  document.getElementById('update-app-btn').addEventListener('click', () => {
    worker.postMessage({ action: 'skipWaiting' });
    window.location.reload();
  });
}

// Listen for messages from service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data === 'reload') {
      window.location.reload();
    }
  });
}

  } catch (error) {
    showStatusMessage("Error initializing app: " + error.message);
  }
}

function clearMapVisualState() {
  // Clean up old listeners to prevent ghost markers
  if (unsubscribeAssets) {
    unsubscribeAssets();
    unsubscribeAssets = null;
  }
  if (drawingManager) {
    if (drawingManager.unsubscribeDrawings) {
        drawingManager.unsubscribeDrawings();
        drawingManager.unsubscribeDrawings = null;
    }
    drawingManager.clearDrawnShapes();
  }


  // Clear old markers and shapes from map
  if (taggedAssets) {
    taggedAssets.forEach(asset => {
      if (asset.marker) asset.marker.map = null;
      if (asset.infoWindow) asset.infoWindow.close();
      if (asset.footprintPolygon) asset.footprintPolygon.setMap(null);
    });
  }
}

/**
 * Switch active site and reload all data
 * Unsubscribes from old listeners, subscribes to new site's collections
 * @param {string} siteId - Site document ID
 * @param {Object} AdvancedMarkerElement - Google Maps marker class (optional, uses global if not provided)
 * @param {Object} PinElement - Google Maps pin class (optional, uses global if not provided)
 */
async function siteSwitch(siteId, AdvancedMarkerElement, PinElement) {
  try {
    const amElement = AdvancedMarkerElement || AdvancedMarkerElementClass;
    const pinElement = PinElement || PinElementClass;

    clearMapVisualState();

    if (!siteId) {
      activeSiteId = null;
      localStorage.removeItem('eboss_active_site_id');
      taggedAssets = [];
      if (drawingManager && drawingManager.drawingMode) {
        drawingManager.stopDrawingMode();
        const annotationsBtn = document.getElementById('annotations-button');
        if (annotationsBtn) {
          annotationsBtn.classList.remove('active');
          annotationsBtn.textContent = 'Annotations Mode';
        }
      }
      updateAssetList();
      showNoSiteOverlay();
      updateSiteSelectorUI(null);
      updateStats();
      console.log("Switched to no-site mode");
      return;
    }

    // Set active site
    activeSiteId = siteId;

    // Save to localStorage for persistence
    localStorage.setItem('eboss_active_site_id', siteId);

    // Update selector UI and hide the no-site overlay
    updateSiteSelectorUI(siteId);
    hideNoSiteOverlay();

    // Reload assets and drawings for the selected site
    loadAssetsFromFirestore(amElement, pinElement);
    if (drawingManager) drawingManager.loadDrawingsFromFirestore();

    console.log("Switched to site:", siteId);
  } catch (error) {
    showStatusMessage('Error switching site');
  }
}

/**
 * Show the "No Site Selected" overlay blocking all generator operations
 */
function showNoSiteOverlay() {
  const overlay = document.getElementById('no-site-overlay');
  const assetList = document.getElementById('asset-list');

  if (overlay) {
    overlay.classList.add('active');
  }
  if (assetList) {
    assetList.classList.add('disabled');
  }

  // Disable add asset button if present
  disableAddAssetButtons();
}

/**
 * Hide the "No Site Selected" overlay and enable operations
 */
function hideNoSiteOverlay() {
  const overlay = document.getElementById('no-site-overlay');
  const assetList = document.getElementById('asset-list');

  if (overlay) {
    overlay.classList.remove('active');
  }
  if (assetList) {
    assetList.classList.remove('disabled');
  }

  // Enable add asset button
  enableAddAssetButtons();
}

/**
 * Disable map click to add assets when no site is selected
 */
function disableAddAssetButtons() {
  // Map click listener is checked in setupEventListeners with activeSiteId check
  // Buttons can also be disabled here if needed
}

/**
 * Re-enable map click to add assets when site is selected
 */
function enableAddAssetButtons() {
  // Map click listener will work again when activeSiteId is set
}

/**
 * Update site selector UI with current site and populate available sites
 * @param {string} activeSiteId - Currently active site ID
 */
function updateSiteSelectorUI(activeSiteId) {
  const currentText = document.getElementById('site-selector-current');
  const listbox = document.getElementById('site-selector-listbox');

  if (!currentText || !listbox) return;

  // Find the active site name
  const activeSite = allSites.find(s => s.id === activeSiteId);
  currentText.textContent = activeSite ? activeSite.name : 'No Site Selected';

  // Populate site selector listbox
  listbox.innerHTML = '';

  const dynamicModeOption = document.createElement('div');
  dynamicModeOption.className = 'site-option';
  dynamicModeOption.setAttribute('role', 'option');
  dynamicModeOption.setAttribute('data-site-id', '');
  if (!activeSiteId) {
    dynamicModeOption.setAttribute('aria-selected', 'true');
  }
  dynamicModeOption.textContent = 'No Site Selected';
  dynamicModeOption.addEventListener('click', async () => {
    await siteSwitch(null);
    closeSiteSelectorDropdown();
  });
  listbox.appendChild(dynamicModeOption);

  allSites.forEach(site => {
    const option = document.createElement('div');
    option.className = 'site-option';
    option.setAttribute('role', 'option');
    option.setAttribute('data-site-id', site.id);
    if (site.id === activeSiteId) {
      option.setAttribute('aria-selected', 'true');
    }

    const nameSpan = document.createElement('span');
    nameSpan.textContent = site.name;
    option.appendChild(nameSpan);

    if (site.address) {
      const addressSpan = document.createElement('div');
      addressSpan.style.fontSize = 'var(--font-size-sm)';
      addressSpan.style.color = 'var(--color-text-secondary)';
      addressSpan.textContent = site.address;
      option.appendChild(addressSpan);
    }

    option.addEventListener('click', async () => {
      await siteSwitch(site.id);
      closeSiteSelectorDropdown();
    }); listbox.appendChild(option);
  });
}

/**
 * Load all active sites from Firestore for the selector dropdown
 */
async function loadActiveSites() {
  try {
    const q = query(collection(db, 'sites'), where('status', '==', 'active'));

    const snapshot = await getDocs(q);
    allSites = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('Loaded sites:', allSites);
  } catch (error) {
    showStatusMessage('Error loading sites');
  }
}

/**
 * Toggle site selector dropdown
 */
function toggleSiteSelectorDropdown() {
  const button = document.getElementById('site-selector-button');
  const listbox = document.getElementById('site-selector-listbox');

  if (!button || !listbox) return;

  const isOpen = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', isOpen ? 'false' : 'true');

  if (isOpen) {
    listbox.classList.add('hidden');
  } else {
    listbox.classList.remove('hidden');
  }
}

/**
 * Close site selector dropdown
 */
function closeSiteSelectorDropdown() {
  const button = document.getElementById('site-selector-button');
  const listbox = document.getElementById('site-selector-listbox');

  if (button) button.setAttribute('aria-expanded', 'false');
  if (listbox) listbox.classList.add('hidden');
}

// Load assets from Firestore with real-time sync
function loadAssetsFromFirestore(AdvancedMarkerElement, PinElement) {
  try {
    // Clean up old listener before starting new one
    if (unsubscribeAssets) {
      unsubscribeAssets();
      unsubscribeAssets = null;
    }

    if (!activeSiteId) {
      taggedAssets = [];
      updateAssetList();
      updateStats();
      return;
    }

    const assetsQuery = query(
      collection(db, 'generators'),
      where('siteId', '==', activeSiteId),
      orderBy('createdAt', 'desc')
    );

    // Real-time listener - updates whenever data changes
    // Store unsubscribe function to prevent ghost markers on site switch
    unsubscribeAssets = onSnapshot(assetsQuery, (snapshot) => {
      // Remove old markers/polygons from the map before rebuilding to prevent ghost markers
      // on every incremental snapshot push (add/update/delete of a single document)
      taggedAssets.forEach(old => {
        if (old.marker) old.marker.map = null;
        if (old.infoWindow) old.infoWindow.close();
        if (old.footprintPolygon) old.footprintPolygon.setMap(null);
      });
      if (activeInfoWindow) { activeInfoWindow.close(); activeInfoWindow = null; }

      const newAssets = [];

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        // Guard against docs with missing/invalid coordinates
        if (!Number.isFinite(data.latitude) || !Number.isFinite(data.longitude)) return;

        const location = new google.maps.LatLng(data.latitude, data.longitude);

        const asset = {
          id: docSnapshot.id,
          location: location,
          project: data.project || null,
          label: data.label || '',
          kw: data.kw || 0,
          photoUrl: data.photoUrl || null,
          widthM: data.widthM || null,
          lengthM: data.lengthM || null,
          orientationDeg: data.orientationDeg || 0,
          siteId: data.siteId || null
        };

        const { marker, infoWindow } = createAssetElements(asset, newAssets.length, AdvancedMarkerElement, PinElement);
        asset.marker = marker;
        asset.infoWindow = infoWindow;

        // Create footprint polygon if dimensions provided
        const footprintPolygon = createFootprintPolygon(asset);
        if (footprintPolygon) asset.footprintPolygon = footprintPolygon;

        newAssets.push(asset);
      });

      taggedAssets = newAssets;
      updateAssetList();
      updateStats();
    }, (error) => {
      showStatusMessage('Error loading data from database');
    });
  } catch (error) {
    showStatusMessage('Error initializing app');
  }
}



// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ---------------------------------------------------------------------------
// Event listeners
// ---------------------------------------------------------------------------

function setupEventListeners(AdvancedMarkerElement, PinElement) {
  const dialogOverlay = document.getElementById('input-dialog-overlay');
  const saveButton = document.getElementById('save-button');
  const cancelButton = document.getElementById('cancel-button');
  const dialogTitle = document.getElementById('dialog-title');
  const projectInput = document.getElementById('project-input');
  const assetNumberInput = document.getElementById('asset-number-input');
  const assetKwInput = document.getElementById('asset-kw-input');
  const assetLatInput = document.getElementById('asset-lat-input');
  const assetLngInput = document.getElementById('asset-lng-input');
  const photoInput = document.getElementById('asset-photo-input');
  const photoPreview = document.getElementById('photo-preview');

  // Map click — open add dialog
  map.addListener('click', (event) => {
    if (drawingManager.drawingMode) return;
    if (!activeSiteId) {
      showNoSiteOverlay();
      showStatusMessage('Select a site before adding generators.');
      return;
    }
    currentlyEditingAssetIndex = null;
    tempLocation = event.latLng;
    dialogTitle.textContent = 'Add Generator';
    dialogOverlay.classList.remove('hidden');
    projectInput.value = '';
    assetNumberInput.value = '';
    assetKwInput.value = '';
    assetLatInput.value = event.latLng.lat().toFixed(6);
    assetLngInput.value = event.latLng.lng().toFixed(6);
    photoInput.value = '';
    photoPreview.src = '';
    photoPreview.classList.add('hidden');
    tempPhotoDataUrl = null;
    assetNumberInput.focus();
  });

  // Photo upload with EXIF extraction and AI naming
  photoInput.addEventListener('change', async () => {
    const file = photoInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      tempPhotoDataUrl = e.target.result;
      photoPreview.src = tempPhotoDataUrl;
      photoPreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);

    if (typeof exifr !== 'undefined' && typeof exifr.gps === 'function') {
      try {
        const gps = await exifr.gps(file);
        if (gps && Number.isFinite(gps.latitude) && Number.isFinite(gps.longitude)) {
          assetLatInput.value = gps.latitude.toFixed(6);
          assetLngInput.value = gps.longitude.toFixed(6);
          showStatusMessage('GPS coordinates extracted from photo!');
        }
      } catch (_gpsErr) {
        // GPS extraction is best-effort; do not block the upload
      }
    }
  });

  // Save button
  saveButton.addEventListener('click', async () => {
    const project = projectInput.value.trim();
    const label = assetNumberInput.value.trim();
    const kw = parseFloat(assetKwInput.value) || 0;
    const lat = parseFloat(assetLatInput.value);
    const lng = parseFloat(assetLngInput.value);

    // Read footprint fields at save-time (they are not captured at dialog-open time)
    const widthM = parseFloat(document.getElementById('asset-width-input')?.value) || null;
    const lengthM = parseFloat(document.getElementById('asset-length-input')?.value) || null;
    const orientationDeg = parseFloat(document.getElementById('asset-orient-input')?.value) || 0;

    if (!label) {
      showStatusMessage('Please enter a generator ID');
      return;
    }

    if (currentlyEditingAssetIndex !== null) {
      await updateAsset(currentlyEditingAssetIndex, label, kw, tempPhotoDataUrl, widthM, lengthM, orientationDeg, project, AdvancedMarkerElement, PinElement);
    } else {
      const resolvedLat = Number.isFinite(lat) ? lat : (tempLocation ? tempLocation.lat() : userLocation?.lat);
      const resolvedLng = Number.isFinite(lng) ? lng : (tempLocation ? tempLocation.lng() : userLocation?.lng);

      if (Number.isFinite(resolvedLat) && Number.isFinite(resolvedLng)) {
        const location = new google.maps.LatLng(resolvedLat, resolvedLng);
        await addAsset(location, label, kw, tempPhotoDataUrl, widthM, lengthM, orientationDeg, project, AdvancedMarkerElement, PinElement);
      } else {
        showStatusMessage('Please enter coordinates');
        return;
      }
    }
    dialogOverlay.classList.add('hidden');
    tempLocation = null;
    currentlyEditingAssetIndex = null;
  });

  // Cancel button
  cancelButton.addEventListener('click', () => {
    dialogOverlay.classList.add('hidden');
    tempLocation = null;
    currentlyEditingAssetIndex = null;
  });

  // Toggle panel
  const toggleButton = document.getElementById('toggle-panel-button');
  const sidePanel = document.getElementById('side-panel');
  toggleButton.addEventListener('click', () => {
    sidePanel.classList.toggle('open');
    toggleButton.classList.toggle('open');
    toggleButton.querySelector('i').textContent =
      sidePanel.classList.contains('open') ? 'chevron_left' : 'chevron_right';
  });

  // Search
  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');
  searchButton.addEventListener('click', searchAssets);
  searchInput.addEventListener('input', debounce(searchAssets, 300));
  searchInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
      searchAssets();
    }
  });

  // Filter chips
  setupFilterChips();

  // Sort dropdown
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      sortAssets(sortSelect.value);
    });
  }

  // Cost analysis
  document.getElementById('cost-analysis-button').addEventListener('click', showCostAnalysis);
  document.getElementById('close-cost-button').addEventListener('click', () => {
    document.getElementById('cost-dialog-overlay').classList.add('hidden');
  });

  // Project selector filter
  document.getElementById('project-selector').addEventListener('change', (e) => {
    selectedProject = e.target.value || '';
    updateAssetList();
    updateStats();
    if (selectedProject) focusMapOnSelectedProject();
  });

  // Cost analysis input live update (compute totalKw inline to avoid stale closure)
  document.getElementById('gallons-per-hour-input').addEventListener('input', () => {
    const currentTotalKw = taggedAssets.reduce((sum, a) => sum + (a.kw || 0), 0);
    updateCostAnalysisDisplay(currentTotalKw);
  });
  document.getElementById('hours-per-year-input').addEventListener('input', () => {
    const currentTotalKw = taggedAssets.reduce((sum, a) => sum + (a.kw || 0), 0);
    updateCostAnalysisDisplay(currentTotalKw);
  });
  document.getElementById('fuel-cost-input').addEventListener('input', () => {
    const currentTotalKw = taggedAssets.reduce((sum, a) => sum + (a.kw || 0), 0);
    updateCostAnalysisDisplay(currentTotalKw);
  });
  const costReductionInput = document.getElementById('cost-reduction-input');
  if (costReductionInput) {
    costReductionInput.addEventListener('input', () => {
      const currentTotalKw = taggedAssets.reduce((sum, a) => sum + (a.kw || 0), 0);
      updateCostAnalysisDisplay(currentTotalKw);
    });
  }

  // Export
  document.getElementById('save-db-button').addEventListener('click', exportData);

  // View Photos
  const viewPhotosButton = document.getElementById('view-photos-button');
  if (viewPhotosButton) {
    viewPhotosButton.addEventListener('click', () => {
      if (window.photoGallery) {
        window.photoGallery.showProjectGallery();
      } else {
        showStatusMessage('Photo gallery not loaded');
      }
    });
  }

  // Settings dialog
  const settingsButton = document.getElementById('settings-button');
  const settingsOverlay = document.getElementById('settings-dialog-overlay');
  const closeSettingsButton = document.getElementById('close-settings-button');
  if (settingsButton && settingsOverlay) {
    settingsButton.addEventListener('click', () => settingsOverlay.classList.remove('hidden'));
  }
  if (closeSettingsButton && settingsOverlay) {
    closeSettingsButton.addEventListener('click', () => settingsOverlay.classList.add('hidden'));
  }

  // Test AI Connection button
  const testAiButton = document.getElementById('test-ai-button');
  const aiTestResult = document.getElementById('ai-test-result');
  if (testAiButton) {
    testAiButton.addEventListener('click', async () => {
      testAiButton.disabled = true;
      testAiButton.textContent = 'Testing...';
      if (aiTestResult) aiTestResult.classList.add('hidden');
      try {
        await suggestAssetName({ make: 'Test', model: 'Device', gps: null }, 'test.jpg');
        if (aiTestResult) {
          aiTestResult.textContent = 'Connection successful! Cloud Function is working.';
          aiTestResult.className = 'hint success-text';
        }
      } catch (err) {
        const msgs = { RATE_LIMIT: 'Service rate-limited — try again soon', NETWORK: 'Network error — check internet', API: 'Service error — try again' };
        if (aiTestResult) {
          aiTestResult.textContent = msgs[err.code] || `Error: ${err.message}`;
          aiTestResult.className = 'hint error-text';
        }
      } finally {
        if (aiTestResult) aiTestResult.classList.remove('hidden');
        testAiButton.disabled = false;
        testAiButton.textContent = 'Test AI Service';
      }
    });
  }

  // Site selector dropdown toggle
  const siteSelectorButton = document.getElementById('site-selector-button');
  if (siteSelectorButton) {
    siteSelectorButton.addEventListener('click', toggleSiteSelectorDropdown);
  }
  document.addEventListener('click', (e) => {
    const siteSelectorContainer = document.querySelector('.site-selector-container');
    if (siteSelectorContainer && !siteSelectorContainer.contains(e.target)) {
      closeSiteSelectorDropdown();
    }
  });

  // Create Site buttons
  const btnCreateSite = document.getElementById('btn-create-site');
  const btnCreateSiteOverlay = document.getElementById('btn-create-site-overlay');
  const openCreateSiteDialog = () => {
    editingSiteId = null;
    const form = document.getElementById('form-create-site');
    if (form) form.reset();
    const title = document.getElementById('dialog-create-site-title');
    if (title) title.textContent = 'Create New Site';
    const overlay = document.getElementById('dialog-create-site-overlay');
    if (overlay) { overlay.classList.remove('hidden'); overlay.setAttribute('aria-hidden', 'false'); }
    closeSiteSelectorDropdown();
  };
  if (btnCreateSite) btnCreateSite.addEventListener('click', openCreateSiteDialog);
  if (btnCreateSiteOverlay) btnCreateSiteOverlay.addEventListener('click', openCreateSiteDialog);

  // Create/Edit Site form submission (single handler, create vs edit driven by editingSiteId)
  const formCreateSite = document.getElementById('form-create-site');
  if (formCreateSite) {
    formCreateSite.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('site-name-input')?.value.trim();
      const address = document.getElementById('site-address-input')?.value.trim();
      const lat = parseFloat(document.getElementById('site-lat-input')?.value);
      const lng = parseFloat(document.getElementById('site-lng-input')?.value);
      if (!name) { showStatusMessage('Site name is required'); return; }
      try {
        if (editingSiteId) {
          // Edit existing site
          const siteEdit = httpsCallable(functions, 'siteEdit');
          const result = await siteEdit({
            siteId: editingSiteId,
            updates: { name, address: address || null, latitude: isFinite(lat) ? lat : null, longitude: isFinite(lng) ? lng : null }
          });
          if (result.data.success) {
            showStatusMessage('Site updated successfully');
            await loadActiveSites();
            populateSitesTable();
            hideCreateSiteDialog();
            updateSiteSelectorUI(activeSiteId);
          }
        } else {
          // Create new site
          const siteCreate = httpsCallable(functions, 'siteCreate');
          const result = await siteCreate({
            name,
            address: address || null,
            lat: isFinite(lat) ? lat : null,
            lng: isFinite(lng) ? lng : null
          });
          if (result.data.success) {
            showStatusMessage('Site created successfully');
            await loadActiveSites();
            activeSiteId = result.data.siteId;
            await siteSwitch(result.data.siteId, AdvancedMarkerElement, PinElement);
            hideCreateSiteDialog();
            updateSiteSelectorUI(activeSiteId);
          }
        }
      } catch (error) {
        showStatusMessage('Failed to save site: ' + error.message);
      }
    });
  }

  // Cancel Create Site
  const btnCancelCreateSite = document.getElementById('btn-cancel-create-site');
  if (btnCancelCreateSite) btnCancelCreateSite.addEventListener('click', hideCreateSiteDialog);

  // Manage Sites button
  const btnManageSites = document.getElementById('btn-manage-sites');
  if (btnManageSites) {
    btnManageSites.addEventListener('click', async () => {
      await loadActiveSites();
      populateSitesTable();
      const overlay = document.getElementById('dialog-manage-sites-overlay');
      if (overlay) { overlay.classList.remove('hidden'); overlay.setAttribute('aria-hidden', 'false'); }
      closeSiteSelectorDropdown();
    });
  }

  // Close Manage Sites
  const btnCloseManageSites = document.getElementById('btn-close-manage-sites');
  if (btnCloseManageSites) btnCloseManageSites.addEventListener('click', hideManageSitesDialog);

  // Cancel Delete Site
  const btnCancelDeleteSite = document.getElementById('btn-cancel-delete-site');
  if (btnCancelDeleteSite) btnCancelDeleteSite.addEventListener('click', hideDeleteSiteDialog);

  // Confirm Delete Site (uses module-level siteToDelete)
  const btnConfirmDeleteSite = document.getElementById('btn-confirm-delete-site');
  if (btnConfirmDeleteSite) {
    btnConfirmDeleteSite.addEventListener('click', async () => {
      if (!siteToDelete) return;
      const site = siteToDelete;
      siteToDelete = null;
      try {
        const siteDelete = httpsCallable(functions, 'siteDelete');
        const result = await siteDelete({ siteId: site.id });
        if (result.data.success) {
          showStatusMessage('Site deleted. Cleaning up assets...');
          await loadActiveSites();
          if (activeSiteId === site.id) {
            const nextSite = allSites.length > 0 ? allSites[0] : null;
            activeSiteId = nextSite ? nextSite.id : null;
            await siteSwitch(activeSiteId);
          }
          populateSitesTable();
          hideDeleteSiteDialog();
          hideManageSitesDialog();
          updateSiteSelectorUI(activeSiteId);
        }
      } catch (error) {
        showStatusMessage('Failed to delete site: ' + error.message);
      }
    });
  }

  // Mass Upload
  const massUploadBtn = document.getElementById('mass-upload-button');
  const massUploadInput = document.getElementById('mass-upload-input');
  const massUploadClose = document.getElementById('mass-upload-close');
  if (massUploadBtn && massUploadInput) {
    massUploadBtn.addEventListener('click', () => massUploadInput.click());
    massUploadInput.addEventListener('change', () => {
      if (massUploadInput.files.length > 0) {
        processMassUpload(massUploadInput.files);
        massUploadInput.value = '';
      }
    });
  }
  if (massUploadClose) {
    massUploadClose.addEventListener('click', () => {
      document.getElementById('mass-upload-overlay').classList.add('hidden');
    });
  }
}

/**
 * Hide the create/edit site dialog
 */
function hideCreateSiteDialog() {
  const overlay = document.getElementById('dialog-create-site-overlay');
  if (overlay) { overlay.classList.add('hidden'); overlay.setAttribute('aria-hidden', 'true'); }
}

/**
 * Hide the manage sites dialog
 */
function hideManageSitesDialog() {
  const overlay = document.getElementById('dialog-manage-sites-overlay');
  if (overlay) { overlay.classList.add('hidden'); overlay.setAttribute('aria-hidden', 'true'); }
}

/**
 * Hide the delete site confirmation dialog
 */
function hideDeleteSiteDialog() {
  const overlay = document.getElementById('dialog-delete-site-overlay');
  if (overlay) { overlay.classList.add('hidden'); overlay.setAttribute('aria-hidden', 'true'); }
}

/**
 * Populate the sites management table with edit/delete actions
 */
async function populateSitesTable() {
  const tableBody = document.getElementById('sites-table-body');
  if (!tableBody) return;
  tableBody.innerHTML = '';
  if (allSites.length === 0) {
    const row = tableBody.insertRow();
    row.innerHTML = '<td colspan="4" style="text-align:center;padding:16px;color:#999;">No sites created yet</td>';
    return;
  }
  allSites.forEach(site => {
    const row = tableBody.insertRow();
    row.insertCell(0).textContent = site.name;
    row.insertCell(1).textContent = site.address || '—';
    const coordsCell = row.insertCell(2);
    coordsCell.textContent = (site.latitude && site.longitude)
      ? `${site.latitude.toFixed(4)}, ${site.longitude.toFixed(4)}`
      : '—';
    const actionsCell = row.insertCell(3);
    actionsCell.className = 'site-actions-cell';
    const editBtn = document.createElement('button');
    editBtn.className = 'site-row-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => editSiteClick(site));
    actionsCell.appendChild(editBtn);
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'site-row-btn delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteSiteClick(site));
    actionsCell.appendChild(deleteBtn);
  });
}

/**
 * Open the create/edit site dialog pre-filled with site data for editing.
 * Sets editingSiteId so the shared form submit handler performs an edit.
 */
function editSiteClick(site) {
  editingSiteId = site.id;
  document.getElementById('site-name-input').value = site.name;
  document.getElementById('site-address-input').value = site.address || '';
  document.getElementById('site-lat-input').value = site.latitude || '';
  document.getElementById('site-lng-input').value = site.longitude || '';
  const title = document.getElementById('dialog-create-site-title');
  if (title) title.textContent = 'Edit Site';
  const dialogCreateSiteOverlay = document.getElementById('dialog-create-site-overlay');
  if (dialogCreateSiteOverlay) {
    dialogCreateSiteOverlay.classList.remove('hidden');
    dialogCreateSiteOverlay.setAttribute('aria-hidden', 'false');
  }
  hideManageSitesDialog();
}

/**
 * Show the delete confirmation dialog for a site.
 * Sets siteToDelete so the confirm button handler can reference it.
 */
function deleteSiteClick(site) {
  siteToDelete = site;
  const confirmText = document.getElementById('delete-site-confirmation-text');
  if (confirmText) {
    confirmText.textContent = `Delete "${site.name}" and all associated generators and drawings? This cannot be undone.`;
  }
  const dialogDeleteSiteOverlay = document.getElementById('dialog-delete-site-overlay');
  if (dialogDeleteSiteOverlay) {
    dialogDeleteSiteOverlay.classList.remove('hidden');
    dialogDeleteSiteOverlay.setAttribute('aria-hidden', 'false');
  }
}


  // Resize image for Claude API (max 5MB limit)
  function resizeImage(imageBase64) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize to max 1024px width while maintaining aspect ratio
        const maxWidth = 1024;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with 70% quality to reduce size
        const resized = canvas.toDataURL('image/jpeg', 0.7);
        resolve(resized);
      };
      img.onerror = () => resolve(imageBase64); // Fallback: return original
      img.src = imageBase64;
    });
  }

  // Suggest asset name using Cloud Function
  async function suggestAssetName(metadata, fileName, imageBase64) {
    try {
      const suggestAssetNameFn = httpsCallable(functions, 'suggestAssetName');
      const payload = { metadata, fileName };

      // Include image if provided (base64 without data: prefix)
      if (imageBase64) {
        // Resize image to reduce size from 67MB to <500KB
        const resizedImage = await resizeImage(imageBase64);
        const base64Only = resizedImage.startsWith('data:')
          ? resizedImage.split(',')[1]
          : resizedImage;
        payload.imageBase64 = base64Only;
      }

      const result = await suggestAssetNameFn(payload);
      const suggestion = result?.data?.suggestion;
      if (typeof suggestion !== 'string' || !suggestion.trim()) {
        const resultShape = result?.data && typeof result.data === 'object'
          ? Object.keys(result.data).join(',') || 'empty-object'
          : typeof result?.data;
        const err = new Error(`Invalid suggestAssetName response shape (data keys/type: ${resultShape})`);
        err.code = 'API';
        throw err;
      }

      return { suggestion, kw: result?.data?.kw ?? null };
    } catch (error) {
      // Error thrown by Cloud Function includes code in details.code
      if (error.details?.code) {
        const err = new Error(error.message);
        err.code = error.details.code;
        throw err;
      }

      // Fallback for network/other errors
      const err = new Error(error.message || 'Failed to generate asset name');
      err.code = 'API';
      throw err;
    }
  }

  // ===== MASS UPLOAD =====

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  function addMassUploadItem(list, filename) {
    const item = document.createElement('div');
    item.className = 'mass-upload-item';
    const filenameSpan = document.createElement('span');
    filenameSpan.className = 'mass-upload-filename';
    filenameSpan.title = filename;
    filenameSpan.textContent = filename;
    const statusSpan = document.createElement('span');
    statusSpan.className = 'mass-upload-status';
    statusSpan.textContent = 'Queued';
    item.appendChild(filenameSpan);
    item.appendChild(statusSpan);
    list.appendChild(item);
    list.scrollTop = list.scrollHeight;
    return item;
  }

  function updateMassUploadItem(itemEl, status, message) {
    const statusEl = itemEl.querySelector('.mass-upload-status');
    statusEl.textContent = message;
    statusEl.className = `mass-upload-status mass-upload-${status}`;
    itemEl.scrollIntoView({ block: 'nearest' });
  }

  async function processMassUpload(files) {
    if (!activeSiteId) {
      showNoSiteOverlay();
      showStatusMessage('Select a site before mass upload.');
      return;
    }

    const overlay = document.getElementById('mass-upload-overlay');
    const list = document.getElementById('mass-upload-list');
    const summary = document.getElementById('mass-upload-summary');
    const closeBtn = document.getElementById('mass-upload-close');

    list.innerHTML = '';
    summary.classList.add('hidden');
    closeBtn.disabled = true;
    overlay.classList.remove('hidden');

    let successCount = 0, skippedCount = 0, failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const itemEl = addMassUploadItem(list, file.name);

      try {
        // Read photo
        const dataUrl = await readFileAsDataUrl(file);

        // Extract GPS
        let location = null;
        if (typeof exifr !== 'undefined' && typeof exifr.gps === 'function') {
          try {
            const gps = await exifr.gps(file);
            if (Number.isFinite(gps?.latitude) && Number.isFinite(gps?.longitude)) {
              location = new google.maps.LatLng(gps.latitude, gps.longitude);
            }
          } catch (e) { /* fall through */ }
        }

        if (!location) {
          updateMassUploadItem(itemEl, 'skipped', 'Skipped — no GPS in photo');
          skippedCount++;
          continue;
        }

        // AI naming
        updateMassUploadItem(itemEl, 'processing', 'AI analyzing…');
        let label = 'EBOSS-UNKNOWN';
        let aiKw = 0;
        try {
          const aiResult = await suggestAssetName(
            { gps: { lat: location.lat(), lng: location.lng() } },
            file.name,
            dataUrl
          );
          label = aiResult.suggestion || 'EBOSS-UNKNOWN';
          aiKw = aiResult.kw || 0;
        } catch (e) {
          // Use sanitized filename as fallback label
          label = file.name.replace(/\.[^/.]+$/, '').toUpperCase()
            .replace(/[^A-Z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 25) || 'EBOSS-UNKNOWN';
        }

        // Create asset
        await addAsset(location, label, aiKw, dataUrl, null, null, 0, null,
          AdvancedMarkerElementClass, PinElementClass);

        updateMassUploadItem(itemEl, 'success', `✓ ${label}${aiKw ? ` · ${aiKw}kW` : ''}`);
        successCount++;

      } catch (error) {
        showStatusMessage(`Mass upload failed for ${file.name}: ${error.message}`);
        updateMassUploadItem(itemEl, 'error', `✗ ${error.message || 'Failed'}`);
        failCount++;
      }
    }

    const parts = [`${successCount} added`];
    if (skippedCount > 0) parts.push(`${skippedCount} skipped (no GPS)`);
    if (failCount > 0) parts.push(`${failCount} failed`);
    summary.textContent = parts.join(' · ');
    summary.classList.remove('hidden');
    closeBtn.disabled = false;
  }

  // Upload photo to Firebase Storage
  async function uploadPhotoToStorage(dataUrl, label) {
    if (!dataUrl) return null;

    try {
      // Convert base64 data URL to Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Create storage reference with timestamp to ensure uniqueness
      const timestamp = Date.now();
      const sanitizedLabel = label.replace(/\s+/g, '-').toLowerCase();
      const photoRef = ref(storage, `generator-photos/${sanitizedLabel}-${timestamp}.jpg`);

      // Upload to Firebase Storage
      const snapshot = await uploadBytes(photoRef, blob);

      // Get download URL
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (error) {
      showStatusMessage('Error uploading photo');
      return null;
    }
  }

  // Asset Management
  function createAssetElements(asset, index, AdvancedMarkerElement, PinElement) {
    // Build info-window content using safe DOM methods to prevent XSS via label/photoUrl
    const contentDiv = document.createElement('div');
    contentDiv.className = 'info-window-content';

    const labelEl = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = asset.label;
    labelEl.appendChild(strong);
    contentDiv.appendChild(labelEl);

    const kwEl = document.createElement('div');
    kwEl.textContent = asset.kw > 0 ? asset.kw + ' kW' : 'Unknown capacity';
    contentDiv.appendChild(kwEl);

    if (asset.photoUrl) {
      const img = document.createElement('img');
      img.src = asset.photoUrl;                  // URL comes from Firebase Storage (trusted)
      img.alt = 'Generator Photo';
      img.style.maxWidth = '200px';
      contentDiv.appendChild(img);
    }

    const infoWindow = new google.maps.InfoWindow({
      content: contentDiv,
      ariaLabel: asset.label,
    });

    const pin = new PinElement({
      background: '#e74c3c',
      borderColor: '#000000',
      glyphColor: '#000000',
    });

    const marker = new AdvancedMarkerElement({
      position: asset.location,
      map: map,
      title: asset.label,
      content: pin.element
    });

    marker.addListener('click', () => {
      if (activeInfoWindow) activeInfoWindow.close();
      infoWindow.open(map, marker);
      activeInfoWindow = infoWindow;
    });

    return { marker, infoWindow };
  }

  // Footprint helper functions
  function rotatePoint(dx, dy, angleDeg) {
    const angleRad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    return {
      dx: dx * cos - dy * sin,
      dy: dx * sin + dy * cos
    };
  }

  function buildFootprintPath(center, widthM, lengthM, orientDeg) {
    const latRad = (center.lat() * Math.PI) / 180;
    const metersPerDegLat = 111000;
    const metersPerDegLng = 111000 * Math.cos(latRad);

    // Half dimensions in meters
    const halfW = widthM / 2;
    const halfL = lengthM / 2;

    // Corners before rotation (relative to center)
    const corners = [
      { dx: halfW, dy: halfL },    // NE
      { dx: -halfW, dy: halfL },   // NW
      { dx: -halfW, dy: -halfL },  // SW
      { dx: halfW, dy: -halfL }    // SE
    ];

    // Rotate and convert to lat/lng
    const path = corners.map(corner => {
      const rotated = rotatePoint(corner.dx, corner.dy, orientDeg);
      return new google.maps.LatLng(
        center.lat() + rotated.dy / metersPerDegLat,
        center.lng() + rotated.dx / metersPerDegLng
      );
    });

    return path;
  }

  function createFootprintPolygon(asset) {
    if (!asset.widthM || !asset.lengthM) return null;

    const path = buildFootprintPath(asset.location, asset.widthM, asset.lengthM, asset.orientationDeg || 0);

    const polygon = new google.maps.Polygon({
      paths: path,
      geodesic: false,
      strokeColor: '#FF8C00',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF8C00',
      fillOpacity: 0.15,
      map: map,
      clickable: false
    });

    return polygon;
  }

  async function addAsset(location, label, kw, photoDataUrl, widthM, lengthM, orientationDeg, project, AdvancedMarkerElement, PinElement) {
    try {
      if (!activeSiteId) {
        throw new Error('No active site selected.');
      }

      // Upload photo to Storage if provided
      let photoUrl = null;
      if (photoDataUrl) {
        photoUrl = await uploadPhotoToStorage(photoDataUrl, label);
      }

      // Save to Firestore (include siteId for multi-site scoping)
      const docRef = await addDoc(collection(db, 'generators'), {
        siteId: activeSiteId,
        label: label,
        kw: kw,
        latitude: location.lat(),
        longitude: location.lng(),
        project: project || null,
        photoUrl: photoUrl || null,
        widthM: widthM || null,
        lengthM: lengthM || null,
        orientationDeg: orientationDeg || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create local asset with Firestore ID, but avoid duplicate if onSnapshot will emit the same doc
      if (!taggedAssets.some(a => a.id === docRef.id)) {
        const newAsset = {
          id: docRef.id,
          siteId: activeSiteId || null,
          location,
          project,
          label,
          kw,
          photoUrl,
          widthM,
          lengthM,
          orientationDeg: orientationDeg || 0
        };

        const { marker, infoWindow } = createAssetElements(newAsset, taggedAssets.length, AdvancedMarkerElement, PinElement);
        newAsset.marker = marker;
        newAsset.infoWindow = infoWindow;

function createAssetElements(asset, index, AdvancedMarkerElement, PinElement) {
  const capacityColor = getCapacityColor(asset.kw);

  const infoWindowContent = `
    <div class="info-window-content">
      <div><strong>${asset.label}</strong></div>
      <div>${asset.kw > 0 ? asset.kw + ' kW' : 'Unknown capacity'}</div>
      ${asset.photoUrl ? `
        <div class="info-window-photo" onclick="window.photoGallery.open('${asset.photoUrl}', {label: '${asset.label}', kw: ${asset.kw}})">
          <img src="${asset.photoUrl}" alt="Generator Photo" style="max-width:200px;">
        </div>
        <div style="font-size: 11px; color: #666; margin-top: 5px;">Click photo to enlarge</div>
      ` : '<div style="color: #999; font-style: italic; margin-top: 5px;">No photo</div>'}
    </div>`;

  const infoWindow = new google.maps.InfoWindow({
    content: infoWindowContent,
    ariaLabel: asset.label,
  });
        // Create footprint polygon if dimensions provided
        const footprintPolygon = createFootprintPolygon(newAsset);
        if (footprintPolygon) newAsset.footprintPolygon = footprintPolygon;

        taggedAssets.push(newAsset);
        updateAssetList();
        updateStats();
      } else {
        // If snapshot will add it, ensure UI updates
        updateAssetList();
        updateStats();
      }
      showStatusMessage('Generator saved to database');
    } catch (error) {
      showStatusMessage('Error saving to database');
    }
  }

  async function updateAsset(index, label, kw, photoDataUrl, widthM, lengthM, orientationDeg, project, AdvancedMarkerElement, PinElement) {
    try {
      const asset = taggedAssets[index];

      // Upload new photo if provided
      let photoUrl = asset.photoUrl;
      if (photoDataUrl && photoDataUrl !== asset.photoUrl) {
        photoUrl = await uploadPhotoToStorage(photoDataUrl, label);
      }

      // Update Firestore
      const assetRef = doc(db, 'generators', asset.id);
      const updateData = {
        label: label,
        kw: kw,
        project: project || null,
        photoUrl: photoUrl,
        widthM: widthM || null,
        lengthM: lengthM || null,
        orientationDeg: orientationDeg || 0,
        updatedAt: serverTimestamp()
      };
      await updateDoc(assetRef, updateData);

      // Update local state
      asset.marker.map = null;
      asset.project = project;
      asset.label = label;
      asset.kw = kw;
      asset.photoUrl = photoUrl;
      asset.widthM = widthM;
      asset.lengthM = lengthM;
      asset.orientationDeg = orientationDeg || 0;

      // Remove old footprint polygon if it exists
      if (asset.footprintPolygon) {
        asset.footprintPolygon.setMap(null);
      }

      const { marker, infoWindow } = createAssetElements(asset, index, AdvancedMarkerElement, PinElement);
      asset.marker = marker;
      asset.infoWindow = infoWindow;

      // Create new footprint polygon if dimensions provided
      const footprintPolygon = createFootprintPolygon(asset);
      if (footprintPolygon) asset.footprintPolygon = footprintPolygon;

      updateAssetList();
      updateStats();
      showStatusMessage('Generator updated in database');
    } catch (error) {
      showStatusMessage('Error updating database');
    }
  }

  function openEditDialog(index) {
    currentlyEditingAssetIndex = index;
    const asset = taggedAssets[index];

    const dialogOverlay = document.getElementById('input-dialog-overlay');
    const dialogTitle = document.getElementById('dialog-title');
    const projectInput = document.getElementById('project-input');
    const assetNumberInput = document.getElementById('asset-number-input');
    const assetKwInput = document.getElementById('asset-kw-input');
    const assetLatInput = document.getElementById('asset-lat-input');
    const assetLngInput = document.getElementById('asset-lng-input');
    const photoInput = document.getElementById('asset-photo-input');
    const photoPreview = document.getElementById('photo-preview');

    dialogTitle.textContent = `Edit Generator: ${asset.label}`;
    projectInput.value = asset.project || '';
    assetNumberInput.value = asset.label;
    assetKwInput.value = asset.kw || '';
    assetLatInput.value = asset.location.lat().toFixed(6);
    assetLngInput.value = asset.location.lng().toFixed(6);
    photoInput.value = '';

    if (asset.photoUrl) {
      photoPreview.src = asset.photoUrl;
      photoPreview.classList.remove('hidden');
      tempPhotoDataUrl = null; // Reset to null so new photo can be uploaded
    } else {
      photoPreview.src = '';
      photoPreview.classList.add('hidden');
      tempPhotoDataUrl = null;
    }

    // Populate footprint fields
    const assetWidthInput = document.getElementById('asset-width-input');
    const assetLengthInput = document.getElementById('asset-length-input');
    const assetOrientInput = document.getElementById('asset-orient-input');
    assetWidthInput.value = asset.widthM || '';
    assetLengthInput.value = asset.lengthM || '';
    assetOrientInput.value = asset.orientationDeg || 0;

    dialogOverlay.classList.remove('hidden');
  }

  function getUniqueProjects() {
    const projects = new Set();
    taggedAssets.forEach(asset => {
      if (asset.project) {
        projects.add(asset.project);
      }
    });
    return Array.from(projects).sort();
  }

  function getAssetsForCurrentFilter() {
    if (!selectedProject) {
      return taggedAssets;
    }
    return taggedAssets.filter(asset => asset.project === selectedProject);
  }

  function updateProjectSelector() {
    const selector = document.getElementById('project-selector');
    const filterContainer = document.getElementById('project-filter-container');
    const projects = getUniqueProjects();

    // Upload new photo if provided
    let photoUrl = asset.photoUrl;
    let photoMeta = asset.photoMeta || null;

    if (photoDataUrl && photoDataUrl !== asset.photoUrl) {
      photoUrl = await uploadPhotoToStorage(photoDataUrl, label);
      photoMeta = photoUrl ? {
        url: photoUrl,
        uploadedBy: auth.currentUser?.uid || null,
        uploadedAt: new Date().toISOString(),
        uploadedByEmail: auth.currentUser?.email || null
      } : null;
    }
    // Only show project filter if there are projects
    if (projects.length > 0) {
      filterContainer.classList.remove('hidden');

      // Preserve current selection and value
      const currentValue = selector.value;

      // Clear existing options except "All Projects"
      selector.innerHTML = '<option value="">All Projects</option>';

      // Add project options
      projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project;
        option.textContent = project;
        selector.appendChild(option);
      });

      // Restore selection if it still exists
      if (currentValue && projects.includes(currentValue)) {
        selector.value = currentValue;
      } else {
        selector.value = '';
      }
    } else {
      filterContainer.classList.add('hidden');
    }
  }

  function focusMapOnSelectedProject() {
    const filteredAssets = getAssetsForCurrentFilter();
    if (filteredAssets.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    filteredAssets.forEach(asset => {
      bounds.extend(asset.location);
    });

    map.fitBounds(bounds, { top: 100, right: 100, bottom: 100, left: 350 });
  }

  function updateAssetList() {
    const assetList = document.getElementById('asset-list');
    assetList.innerHTML = '';

    const filteredAssets = getAssetsForCurrentFilter();

    if (filteredAssets.length === 0) {
      const message = selectedProject
        ? `No generators in "${selectedProject}". Click on the map to add.`
        : 'No generators added. Click on the map to add.';
      assetList.innerHTML = `<li class="empty-state">${message}</li>`;
      return;
    }

    filteredAssets.forEach((asset, filteredIndex) => {
      // Find the original index in taggedAssets
      const originalIndex = taggedAssets.indexOf(asset);

      const listItem = document.createElement('li');
      listItem.setAttribute('data-asset-index', originalIndex);

      const detailsDiv = document.createElement('div');
      detailsDiv.className = 'asset-details';

      const numberSpan = document.createElement('span');
      numberSpan.className = 'asset-number';
      numberSpan.textContent = asset.label;
      if (asset.project) {
        numberSpan.textContent += ` [${asset.project}]`;
      }
      detailsDiv.appendChild(numberSpan);

      const kwSpan = document.createElement('span');
      kwSpan.className = 'asset-description';
      kwSpan.textContent = asset.kw > 0 ? `${asset.kw} kW` : 'Unknown capacity';
      detailsDiv.appendChild(kwSpan);

      listItem.appendChild(detailsDiv);

      const buttonsDiv = document.createElement('div');
      buttonsDiv.className = 'list-buttons';

      const editButton = document.createElement('button');
      editButton.innerHTML = '<i class="material-icons">edit</i>';
      editButton.onclick = (e) => {
        e.stopPropagation();
        openEditDialog(originalIndex);
      };
      buttonsDiv.appendChild(editButton);

      const deleteButton = document.createElement('button');
      deleteButton.innerHTML = '<i class="material-icons">delete</i>';
      deleteButton.onclick = (e) => {
        e.stopPropagation();
        deleteAsset(originalIndex);
      };
      buttonsDiv.appendChild(deleteButton);

      listItem.appendChild(buttonsDiv);

      listItem.onclick = () => {
        map.panTo(asset.location);
        if (activeInfoWindow) activeInfoWindow.close();
        asset.infoWindow.open(map, asset.marker);
        activeInfoWindow = asset.infoWindow;
      };

      assetList.appendChild(listItem);
    });
  }

  async function deleteAsset(index) {
    try {
      const asset = taggedAssets[index];

      // Save backup for undo (before removing from DOM/state)
      deletedAssetBackup = {
        assetData: {
          id: asset.id, label: asset.label, kw: asset.kw,
          location: asset.location, project: asset.project,
          photoUrl: asset.photoUrl, widthM: asset.widthM,
          lengthM: asset.lengthM, orientationDeg: asset.orientationDeg,
          siteId: asset.siteId
        },
        index
      };

      // Capture photoUrl for deferred deletion (after undo window expires)
      const photoUrlToDelete = asset.photoUrl;

      // Delete from Firestore
      await deleteDoc(doc(db, 'generators', asset.id));

      // Remove from local state
      asset.marker.map = null;
      asset.infoWindow.close();
      if (activeInfoWindow === asset.infoWindow) activeInfoWindow = null;

      // Remove footprint polygon if it exists
      if (asset.footprintPolygon) {
        asset.footprintPolygon.setMap(null);
      }

      taggedAssets.splice(index, 1);
      updateAssetList();
      updateStats();
      searchAssets();
      showUndoToast(
        `"${asset.label}" deleted`,
        restoreDeletedAsset,
        photoUrlToDelete ? async () => {
          try {
            const photoRef = refFromURL(storage, photoUrlToDelete);
            await deleteObject(photoRef);
          } catch (_) { /* best-effort */ }
        } : null
      );
    } catch (error) {
      showStatusMessage('Error deleting from database');
    }
  }

  function searchAssets() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const activeFilters = getActiveFilters();
    const filteredAssets = getAssetsForCurrentFilter();

    filteredAssets.forEach((asset) => {
      const matchesSearch = !query ||
        asset.label.toLowerCase().includes(query) ||
        (asset.kw && asset.kw.toString().includes(query));
      const matchesChips = checkFilters(asset, activeFilters);
      const isVisible = matchesSearch && matchesChips;
      asset.marker.map = isVisible ? map : null;
      const originalIndex = taggedAssets.indexOf(asset);
      const listItem = document.querySelector(`#asset-list li[data-asset-index="${originalIndex}"]`);
      if (listItem) {
        listItem.style.display = isVisible ? 'flex' : 'none';
      }
    });
  }

  function setupFilterChips() {
    const chips = document.querySelectorAll('.filter-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
        searchAssets();
      });
    });
  }

  function getActiveFilters() {
    const filters = [];
    document.querySelectorAll('.filter-chip.active').forEach(chip => {
      filters.push(chip.dataset.filter);
    });
    return filters;
  }

  function checkFilters(asset, filters) {
    if (filters.length === 0) return true;
    return filters.every(filter => {
      switch (filter) {
        case 'with-photos': return !!asset.photoUrl;
        case 'high-capacity': return (asset.kw || 0) >= 100;
        case 'no-id': return !asset.label || asset.label === 'Unknown';
        default: return true;
      }
    });
  }

  function sortAssets(sortBy) {
    const fns = {
      'id': (a, b) => (a.label || '').localeCompare(b.label || ''),
      'capacity': (a, b) => (b.kw || 0) - (a.kw || 0),
    };
    if (fns[sortBy]) {
      taggedAssets.sort(fns[sortBy]);
      updateAssetList();
    }
  }

  function updateStats() {
    const filteredAssets = getAssetsForCurrentFilter();
    const totalKw = filteredAssets.reduce((sum, a) => sum + (a.kw || 0), 0);
    document.getElementById('total-kw').textContent = totalKw.toLocaleString();
    document.getElementById('unit-count').textContent = filteredAssets.length;
  }

  // Cost Analysis
  function showCostAnalysis() {
    const totalKw = taggedAssets.reduce((sum, a) => sum + (a.kw || 0), 0);

    // Reset form to defaults
    document.getElementById('gallons-per-hour-input').value = '5';
    document.getElementById('hours-per-year-input').value = '2000';
    document.getElementById('fuel-cost-input').value = '3.50';

    // Update display with default calculation
    updateCostAnalysisDisplay(totalKw);

    // Show dialog
    document.getElementById('cost-dialog-overlay').classList.remove('hidden');
  }

  function updateCostAnalysisDisplay(totalKw) {
    // Get values from form inputs
    const gallonsPerHour = parseFloat(document.getElementById('gallons-per-hour-input').value) || 0;
    const hoursPerYear = parseFloat(document.getElementById('hours-per-year-input').value) || 0;
    const fuelCostPerGallon = parseFloat(document.getElementById('fuel-cost-input').value) || 0;
    const reductionInput = document.getElementById('cost-reduction-input');
    const reductionPercent = reductionInput ? (parseFloat(reductionInput.value) || 75) : 75;
    const ebossRatio = 1 - (reductionPercent / 100); // e.g. 0.25 for 75% reduction

    // Calculate per-asset costs
    let totalFuelCost = 0;
    let totalEbossCost = 0;
    let totalSavings = 0;

    const breakdownRows = taggedAssets.map(asset => {
      const assetKw = asset.kw || 0;
      const assetGallonsPerHour = (gallonsPerHour / (totalKw || 1)) * assetKw || 0;
      const assetAnnualGallons = assetGallonsPerHour * hoursPerYear;
      const assetFuelCost = assetAnnualGallons * fuelCostPerGallon;
      const assetEbossCost = assetFuelCost * ebossRatio;
      const assetSavings = assetFuelCost - assetEbossCost;

      totalFuelCost += assetFuelCost;
      totalEbossCost += assetEbossCost;
      totalSavings += assetSavings;

      return { label: asset.label, kw: assetKw, fuelCost: assetFuelCost, ebossCost: assetEbossCost, savings: assetSavings };
    });

    // Update per-asset breakdown table
    const tbody = document.getElementById('cost-breakdown-body');
    tbody.textContent = '';
    breakdownRows.forEach((row) => {
      const tr = document.createElement('tr');
      const labelCell = document.createElement('td');
      labelCell.textContent = row.label || '';
      const kwCell = document.createElement('td');
      kwCell.textContent = String(row.kw);
      const fuelCell = document.createElement('td');
      fuelCell.textContent = `$${Math.round(row.fuelCost).toLocaleString()}`;
      const ebossCell = document.createElement('td');
      ebossCell.textContent = `$${Math.round(row.ebossCost).toLocaleString()}`;
      const savingsCell = document.createElement('td');
      savingsCell.className = 'savings-col';
      savingsCell.textContent = `$${Math.round(row.savings).toLocaleString()}`;
      tr.append(labelCell, kwCell, fuelCell, ebossCell, savingsCell);
      tbody.appendChild(tr);
    });

    // Update summary totals
    const threeYearSavings = totalSavings * 3;
    const bestEboss = EBOSS_MODELS.slice().reverse().find(m => m.kw <= totalKw) || EBOSS_MODELS[0];
    const estimatedInstallCost = bestEboss.kw * 500;
    const payback = totalSavings > 0 ? (estimatedInstallCost / totalSavings).toFixed(1) : null;

    document.getElementById('total-capacity').textContent = totalKw;
    document.getElementById('total-fuel-cost').textContent = Math.round(totalFuelCost).toLocaleString();
    document.getElementById('total-eboss-cost').textContent = Math.round(totalEbossCost).toLocaleString();
    document.getElementById('total-savings').textContent = Math.round(totalSavings).toLocaleString();

    const threeYearEl = document.getElementById('three-year-savings');
    if (threeYearEl) threeYearEl.textContent = Math.round(threeYearSavings).toLocaleString();

    const recModelEl = document.getElementById('recommended-model');
    if (recModelEl) recModelEl.textContent = bestEboss.name;

    const paybackEl = document.getElementById('payback-period');
    if (paybackEl) paybackEl.textContent = payback ? `${payback} years` : '—';
  }

  // Export - Download JSON file
  function exportData() {
    const data = {
      exportDate: new Date().toISOString(),
      totalGenerators: taggedAssets.length,
      totalKw: taggedAssets.reduce((sum, a) => sum + (a.kw || 0), 0),
      generators: taggedAssets.map(a => ({
        id: a.id,
        label: a.label,
        kw: a.kw,
        latitude: a.location.lat(),
        longitude: a.location.lng(),
        project: a.project || null,
        widthM: a.widthM || null,
        lengthM: a.lengthM || null,
        orientationDeg: a.orientationDeg || 0,
        siteId: a.siteId || null,
        siteName: allSites.find(s => s.id === a.siteId)?.name || null
      }))
    };

    // Create JSON blob and download
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `generators-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showStatusMessage('Data exported as JSON file');
  }

  function showStatusMessage(message) {
    const statusMessage = document.getElementById('status-message');
    statusMessage.textContent = message;
    statusMessage.classList.remove('hidden');
    setTimeout(() => statusMessage.classList.add('hidden'), 3000);
  }

  function showLoading(text = 'Processing...') {
    const overlay = document.getElementById('loading-overlay');
    const textEl = document.getElementById('loading-text');
    if (textEl) textEl.textContent = text;
    if (overlay) overlay.classList.remove('hidden');
  }

  function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  function showUndoToast(message, undoCallback, onExpiry = null) {
    const container = document.getElementById('undo-toast');
    const messageEl = document.getElementById('undo-message');
    const undoBtn = document.getElementById('undo-button');
    if (!container) return;

    messageEl.textContent = message;
    container.classList.remove('hidden');

function checkFilters(asset, filters) {
  if (filters.length === 0) return true;
  return filters.every(filter => {
    switch (filter) {
      case 'with-photos': return !!asset.photoUrl;
      case 'high-capacity': return (asset.kw || 0) >= 100;
      case 'no-id': return !asset.label || asset.label === 'Unknown';
      default: return true;
    }
  });
}

function setupFilterChips() {
  const chips = document.querySelectorAll('.filter-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      searchAssets();
    });
  });
}

function sortAssets(sortBy) {
  const fns = {
    'id': (a, b) => (a.label || '').localeCompare(b.label || ''),
    'capacity': (a, b) => (b.kw || 0) - (a.kw || 0),
  };
  if (fns[sortBy]) {
    taggedAssets.sort(fns[sortBy]);
    updateAssetList();
  }
}

function updateStats() {
  const totalKw = taggedAssets.reduce((sum, a) => sum + (a.kw || 0), 0);
  document.getElementById('total-kw').textContent = totalKw.toLocaleString();
  document.getElementById('unit-count').textContent = taggedAssets.length;
}

// ============================================
// Cost Analysis
// ============================================

function showCostAnalysis() {
  const totalKw = taggedAssets.reduce((sum, a) => sum + (a.kw || 0), 0);

  // Reset form to defaults
  document.getElementById('gallons-per-hour-input').value = '5';
  document.getElementById('hours-per-year-input').value = '2000';
  document.getElementById('fuel-cost-input').value = '3.50';

  // Update display with default calculation
  updateCostAnalysisDisplay(totalKw);

  // Show dialog
  document.getElementById('cost-dialog-overlay').classList.remove('hidden');
}

function updateCostAnalysisDisplay(totalKw) {
  // Get values from form inputs
  const gallonsPerHour = parseFloat(document.getElementById('gallons-per-hour-input').value) || 0;
  const hoursPerYear = parseFloat(document.getElementById('hours-per-year-input').value) || 0;
  const fuelCostPerGallon = parseFloat(document.getElementById('fuel-cost-input').value) || 0;
  const reductionInput = document.getElementById('cost-reduction-input');
  const reductionPercent = reductionInput ? (parseFloat(reductionInput.value) || 75) : 75;
  const ebossRatio = 1 - (reductionPercent / 100); // e.g. 0.25 for 75% reduction

  // Calculate per-asset costs
  let totalFuelCost = 0;
  let totalEbossCost = 0;
  let totalSavings = 0;

  const breakdownRows = taggedAssets.map(asset => {
    const assetKw = asset.kw || 0;
    const assetGallonsPerHour = (gallonsPerHour / (totalKw || 1)) * assetKw || 0;
    const assetAnnualGallons = assetGallonsPerHour * hoursPerYear;
    const assetFuelCost = assetAnnualGallons * fuelCostPerGallon;
    const assetEbossCost = assetFuelCost * ebossRatio;
    const assetSavings = assetFuelCost - assetEbossCost;

    totalFuelCost += assetFuelCost;
    totalEbossCost += assetEbossCost;
    totalSavings += assetSavings;

    return { label: asset.label, kw: assetKw, fuelCost: assetFuelCost, ebossCost: assetEbossCost, savings: assetSavings };
  });

  // Update per-asset breakdown table
  const tbody = document.getElementById('cost-breakdown-body');
  tbody.textContent = '';
  breakdownRows.forEach((row) => {
    const tr = document.createElement('tr');
    const labelCell = document.createElement('td');
    labelCell.textContent = row.label || '';
    const kwCell = document.createElement('td');
    kwCell.textContent = String(row.kw);
    const fuelCell = document.createElement('td');
    fuelCell.textContent = `$${Math.round(row.fuelCost).toLocaleString()}`;
    const ebossCell = document.createElement('td');
    ebossCell.textContent = `$${Math.round(row.ebossCost).toLocaleString()}`;
    const savingsCell = document.createElement('td');
    savingsCell.className = 'savings-col';
    savingsCell.textContent = `$${Math.round(row.savings).toLocaleString()}`;
    tr.append(labelCell, kwCell, fuelCell, ebossCell, savingsCell);
    tbody.appendChild(tr);
  });

  // Update summary totals
  const threeYearSavings = totalSavings * 3;
  const bestEboss = EBOSS_MODELS.slice().reverse().find(m => m.kw <= totalKw) || EBOSS_MODELS[0];
  const estimatedInstallCost = bestEboss.kw * 500;
  const payback = totalSavings > 0 ? (estimatedInstallCost / totalSavings).toFixed(1) : null;

  document.getElementById('total-capacity').textContent = totalKw;
  document.getElementById('total-fuel-cost').textContent = Math.round(totalFuelCost).toLocaleString();
  document.getElementById('total-eboss-cost').textContent = Math.round(totalEbossCost).toLocaleString();
  document.getElementById('total-savings').textContent = Math.round(totalSavings).toLocaleString();

  const threeYearEl = document.getElementById('three-year-savings');
  if (threeYearEl) threeYearEl.textContent = Math.round(threeYearSavings).toLocaleString();

  const recModelEl = document.getElementById('recommended-model');
  if (recModelEl) recModelEl.textContent = bestEboss.name;

  const paybackEl = document.getElementById('payback-period');
  if (paybackEl) paybackEl.textContent = payback ? `${payback} years` : '—';
}

// Export - Download JSON file
function exportData() {
  const data = {
    exportDate: new Date().toISOString(),
    totalGenerators: taggedAssets.length,
    totalKw: taggedAssets.reduce((sum, a) => sum + (a.kw || 0), 0),
    generators: taggedAssets.map(a => ({
      id: a.id,
      label: a.label,
      kw: a.kw,
      latitude: a.location.lat(),
      longitude: a.location.lng(),
      project: a.project || null,
      widthM: a.widthM || null,
      lengthM: a.lengthM || null,
      orientationDeg: a.orientationDeg || 0,
      siteId: a.siteId || null
    }))
  };

  // Create JSON blob and download
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `generators-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showStatusMessage('Data exported as JSON file');
}

function showStatusMessage(message) {
  const statusMessage = document.getElementById('status-message');
  statusMessage.textContent = message;
  statusMessage.classList.remove('hidden');
  setTimeout(() => statusMessage.classList.add('hidden'), 3000);
}

// ─── Authentication Functions ────────────────────────────────────────────────

let currentUser = null;
let userProfile = null;

function showAuthModal() {
  // Create auth modal if it doesn't exist
  let modal = document.getElementById('auth-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.className = 'dialog-overlay';
    modal.innerHTML = `
      <div class="dialog" style="max-width: 400px;">
        <h3>ANA EBOSS Planner</h3>
        <p style="margin-bottom: 20px; color: var(--text-secondary);">
          Sign in with your ANA email to continue.
        </p>
        <button id="google-signin-btn" class="primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;">
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.842 2.079-1.791 2.718v2.258h2.908C16.658 14.2 17.64 11.86 17.64 9.2z"/><path fill="#34A853" d="M9.003 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.58-5.036-3.711H.96v2.331C2.44 15.983 5.48 18 9.003 18z"/><path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.116-.282-1.71s.102-1.17.282-1.71V4.96H.96C.348 6.173 0 7.548 0 9s.348 2.827.96 4.04l3.004-2.33z"/><path fill="#EA4335" d="M9.003 3.58c1.32 0 2.508.454 3.44 1.345l2.582-2.58C13.465.892 11.428 0 9.003 0 5.48 0 2.44 2.017.96 4.96l3.004 2.33c.708-2.13 2.692-3.71 5.039-3.71z"/></svg>
          Sign in with Google
        </button>
        <p id="auth-error" class="hint error-text hidden" style="margin-top: 15px; text-align: center;"></p>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('google-signin-btn').addEventListener('click', handleGoogleSignIn);
  }
  modal.classList.remove('hidden');
}

function hideAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.add('hidden');
}

function showAuthError(message) {
  const errorEl = document.getElementById('auth-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  }
}

async function handleGoogleSignIn() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    hd: 'anacorp.com',  // Restrict to ANA domain
    prompt: 'select_account'
  });

  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error('Sign in error:', error);
    if (error.code === 'auth/account-exists-with-different-credential') {
      showAuthError('Account exists with different sign-in method.');
    } else if (error.code === 'auth/popup-closed-by-user') {
      // User cancelled, no error needed
    } else if (error.code === 'auth/unauthorized-domain') {
      showAuthError('This domain is not authorized for sign-in.');
    } else {
      showAuthError('Sign in failed. Please try again.');
    }
  }
}

async function loadUserProfile() {
  if (!auth.currentUser) return;

  try {
    const getUserProfileFn = httpsCallable(functions, 'getUserProfile');
    const result = await getUserProfileFn();
    userProfile = result.data.profile;
    currentUser = auth.currentUser;

    // Update UI with user info
    updateUserDisplay();

    // If admin, show admin menu item
    if (userProfile.role === 'admin') {
      showAdminMenu();
    }

    console.log('User profile loaded:', userProfile);
  } catch (error) {
    console.error('Failed to load user profile:', error);
    if (error.message?.includes('pending')) {
      showAuthError('Your account is pending admin approval.');
      await signOut(auth);
    }
  }
}

function updateUserDisplay() {
  // Add user display to header if not exists
  let userDisplay = document.getElementById('user-display');
  if (!userDisplay) {
    userDisplay = document.createElement('div');
    userDisplay.id = 'user-display';
    userDisplay.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-left: auto;';

    const header = document.querySelector('.panel-header');
    if (header) header.appendChild(userDisplay);
  }

  userDisplay.innerHTML = `
    <span style="font-size: 12px; color: var(--text-secondary);">${userProfile?.email || ''}</span>
    <span class="role-badge" style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: ${getRoleColor(userProfile?.role)}; color: white; text-transform: uppercase;">${userProfile?.role || ''}</span>
    <button id="logout-btn" class="icon-btn" title="Sign out">
      <span class="material-icons" style="font-size: 18px;">logout</span>
    </button>
  `;

  document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));
}

function getRoleColor(role) {
  switch (role) {
    case 'admin': return '#e74c3c';
    case 'sales': return '#3498db';
    case 'tech': return '#27ae60';
    default: return '#95a5a6';
  }
}

function showAdminMenu() {
  // Add Admin button to settings or create separate admin panel trigger
  const settingsDialog = document.getElementById('settings-dialog');
  if (settingsDialog) {
    let adminSection = document.getElementById('admin-section');
    if (!adminSection) {
      adminSection = document.createElement('div');
      adminSection.id = 'admin-section';
      adminSection.innerHTML = `
        <h4 style="margin: 20px 0 10px; padding-top: 15px; border-top: 1px solid var(--border-color);">Admin</h4>
        <button id="admin-panel-btn" class="secondary" style="width: 100%;">
          <span class="material-icons" style="font-size: 16px; vertical-align: middle; margin-right: 5px;">admin_panel_settings</span>
          User Management
        </button>
      `;
      settingsDialog.querySelector('.dialog').appendChild(adminSection);
      document.getElementById('admin-panel-btn').addEventListener('click', showAdminPanel);
    }
  }
}

async function showAdminPanel() {
  // Create admin panel modal with tabs
  let panel = document.getElementById('admin-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'admin-panel';
    panel.className = 'dialog-overlay';
    panel.innerHTML = `
      <div class="dialog" style="max-width: 800px; max-height: 85vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3>Admin Panel</h3>
          <button class="icon-btn close-admin-panel">
            <span class="material-icons">close</span>
          </button>
        </div>
        
        <!-- Tabs -->
        <div class="admin-tabs" style="display: flex; gap: 5px; margin-bottom: 20px; border-bottom: 1px solid var(--border-color);">
          <button class="admin-tab active" data-tab="users" style="padding: 10px 20px; background: none; border: none; border-bottom: 2px solid var(--primary); cursor: pointer;">Users</button>
          <button class="admin-tab" data-tab="audit" style="padding: 10px 20px; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; color: var(--text-secondary);">Audit Logs</button>
          <button class="admin-tab" data-tab="templates" style="padding: 10px 20px; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; color: var(--text-secondary);">Templates</button>
          <button class="admin-tab" data-tab="email" style="padding: 10px 20px; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; color: var(--text-secondary);">Email Config</button>
        </div>
        
        <!-- Users Tab -->
        <div id="tab-users" class="admin-tab-content">
          <div style="margin-bottom: 20px;">
            <h4>Add New User</h4>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
              <input type="email" id="new-user-email" placeholder="user@anacorp.com" style="flex: 1;" />
              <select id="new-user-role" style="width: 120px;">
                <option value="tech">Tech</option>
                <option value="sales">Sales</option>
                <option value="admin">Admin</option>
              </select>
              <button id="add-user-btn" class="primary">Add</button>
            </div>
            <p id="add-user-error" class="hint error-text hidden" style="margin-top: 5px;"></p>
          </div>
          
          <h4>Existing Users</h4>
          <div id="users-list" style="margin-top: 10px;">
            <p class="hint">Loading...</p>
          </div>
        </div>
        
        <!-- Audit Logs Tab -->
        <div id="tab-audit" class="admin-tab-content" style="display: none;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h4>System Audit Logs</h4>
            <button id="refresh-audit-btn" class="secondary" style="padding: 6px 12px;">
              <span class="material-icons" style="font-size: 16px; vertical-align: middle;">refresh</span> Refresh
            </button>
          </div>
          <div id="audit-logs-list" style="max-height: 400px; overflow-y: auto;">
            <p class="hint">Loading...</p>
          </div>
        </div>
        
        <!-- Templates Tab -->
        <div id="tab-templates" class="admin-tab-content" style="display: none;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h4>Project Templates</h4>
            <button id="save-current-as-template-btn" class="secondary">
              <span class="material-icons" style="font-size: 16px; vertical-align: middle;">save</span> Save Current as Template
            </button>
          </div>
          <div id="templates-list">
            <h5 style="margin: 15px 0 10px; color: var(--text-secondary);">Built-in Templates</h5>
            <div id="builtin-templates-list"><p class="hint">Loading...</p></div>
            <h5 style="margin: 25px 0 10px; color: var(--text-secondary);">Custom Templates</h5>
            <div id="custom-templates-list"><p class="hint">Loading...</p></div>
          </div>
        </div>
        
        <!-- Email Config Tab -->
        <div id="tab-email" class="admin-tab-content" style="display: none;">
          <h4>Email Configuration</h4>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p class="hint">SendGrid integration for email notifications.</p>
            <p style="margin-top: 10px;">
              <strong>Status:</strong> <span id="email-status">Unknown</span>
            </p>
            <button id="test-email-btn" class="secondary" style="margin-top: 10px;">
              <span class="material-icons" style="font-size: 16px; vertical-align: middle;">email</span> Test Email
            </button>
            <p id="email-test-result" class="hint" style="margin-top: 10px;"></p>
          </div>
          <p class="hint">Configure SendGrid API key in Google Secret Manager (SENDGRID_API_KEY).</p>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    // Tab switching
    panel.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        // Update active tab
        panel.querySelectorAll('.admin-tab').forEach(t => {
          t.classList.remove('active');
          t.style.borderBottomColor = 'transparent';
          t.style.color = 'var(--text-secondary)';
        });
        tab.classList.add('active');
        tab.style.borderBottomColor = 'var(--primary)';
        tab.style.color = 'inherit';

        // Show content
        panel.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');
        document.getElementById(`tab-${tab.dataset.tab}`).style.display = 'block';

        // Load data
        if (tab.dataset.tab === 'audit') loadAuditLogs();
        if (tab.dataset.tab === 'templates') loadTemplates();
      });
    });

    panel.querySelector('.close-admin-panel').addEventListener('click', () => panel.classList.add('hidden'));
    document.getElementById('add-user-btn').addEventListener('click', handleAddUser);
    document.getElementById('refresh-audit-btn').addEventListener('click', loadAuditLogs);
    document.getElementById('test-email-btn').addEventListener('click', testEmailConfig);
    document.getElementById('save-current-as-template-btn').addEventListener('click', showSaveTemplateDialog);
  }

  panel.classList.remove('hidden');
  await loadUsersList();
}

async function loadUsersList() {
  const listEl = document.getElementById('users-list');
  listEl.innerHTML = '<p class="hint">Loading...</p>';

  try {
    const listUsersFn = httpsCallable(functions, 'listUsers');
    const result = await listUsersFn();
    const users = result.data.users || [];

    if (users.length === 0) {
      listEl.innerHTML = '<p class="hint">No users found.</p>';
      return;
    }

    listEl.innerHTML = users.map(user => {
      const displayName = escapeHtml(user.displayName || user.email);
      const email = escapeHtml(user.email);
      const role = escapeHtml(user.role);
      const status = escapeHtml(user.status);
      const uid = escapeHtml(user.uid);

      return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid var(--border-color);">
        <div>
          <div style="font-weight: 500;">${displayName}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">${email}</div>
          <div style="font-size: 11px; margin-top: 3px;">
            <span style="padding: 2px 6px; border-radius: 4px; background: ${getRoleColor(user.role)}; color: white; text-transform: uppercase; font-size: 10px;">${role}</span>
            ${user.status !== 'active' ? `<span style="margin-left: 5px; padding: 2px 6px; border-radius: 4px; background: #f39c12; color: white; font-size: 10px;">${status}</span>` : ''}
          </div>
        </div>
        <select class="role-change" data-uid="${uid}" style="width: 100px;" ${user.email === INITIAL_ADMIN_EMAIL ? 'disabled' : ''}>
          <option value="tech" ${user.role === 'tech' ? 'selected' : ''}>Tech</option>
          <option value="sales" ${user.role === 'sales' ? 'selected' : ''}>Sales</option>
          <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
      </div>
    `}).join('');

    // Add change handlers for role dropdowns
    listEl.querySelectorAll('.role-change').forEach(select => {
      select.addEventListener('change', async (e) => {
        const uid = e.target.dataset.uid;
        const newRole = e.target.value;
        try {
          const updateRoleFn = httpsCallable(functions, 'updateUserRole');
          await updateRoleFn({ uid, role: newRole });
          showStatusMessage('Role updated');
        } catch (err) {
          showStatusMessage('Failed to update role');
          e.target.value = e.target.getAttribute('data-prev') || e.target.querySelector('[selected]').value;
        }
      });
      select.addEventListener('focus', (e) => e.target.setAttribute('data-prev', e.target.value));
    });

  } catch (error) {
    listEl.innerHTML = `<p class="hint error-text">Error: ${error.message}</p>`;
  }
}

async function handleAddUser() {
  const email = document.getElementById('new-user-email').value.trim().toLowerCase();
  const role = document.getElementById('new-user-role').value;
  const errorEl = document.getElementById('add-user-error');

  errorEl.classList.add('hidden');

  if (!email || !email.endsWith('@anacorp.com')) {
    errorEl.textContent = 'Please enter a valid anacorp.com email.';
    errorEl.classList.remove('hidden');
    return;
  }

  try {
    const provisionUserFn = httpsCallable(functions, 'provisionUser');
    await provisionUserFn({ email, role });
    showStatusMessage('User added successfully');
    document.getElementById('new-user-email').value = '';
    await loadUsersList();
  } catch (error) {
    errorEl.textContent = error.message || 'Failed to add user';
    errorEl.classList.remove('hidden');
    const hideToast = (expired = false) => {
      container.classList.add('hidden');
      undoBtn.onclick = null;
      if (expired && onExpiry) onExpiry();
    };

    undoBtn.onclick = () => {
      undoCallback();
      hideToast(false);
    };

    setTimeout(() => hideToast(true), 5000);
  }

  async function restoreDeletedAsset() {
    if (!deletedAssetBackup) return;
    const { assetData, index } = deletedAssetBackup;
    const restoredAsset = { ...assetData };
    // Persist to Firestore (preserve original id if present)
    try {
      const resolvedLat = typeof restoredAsset.location?.lat === 'function'
        ? restoredAsset.location.lat()
        : (restoredAsset.location?.lat ?? restoredAsset.latitude ?? null);
      const resolvedLng = typeof restoredAsset.location?.lng === 'function'
        ? restoredAsset.location.lng()
        : (restoredAsset.location?.lng ?? restoredAsset.longitude ?? null);
      const resolvedSiteId = restoredAsset.siteId || null;

      const writeData = {
        label: restoredAsset.label,
        kw: restoredAsset.kw || null,
        siteId: resolvedSiteId,
        latitude: resolvedLat,
        longitude: resolvedLng,
        project: restoredAsset.project || null,
        photoUrl: restoredAsset.photoUrl || null,
        widthM: restoredAsset.widthM || null,
        lengthM: restoredAsset.lengthM || null,
        orientationDeg: restoredAsset.orientationDeg || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (restoredAsset.id) {
        await setDoc(doc(db, 'generators', restoredAsset.id), writeData);
      } else {
        const addedRef = await addDoc(collection(db, 'generators'), writeData);
        restoredAsset.id = addedRef.id;
      }

      // Create marker/infoWindow using already-loaded global marker classes
      const amElement = AdvancedMarkerElementClass;
      const pinElement = PinElementClass;
      const { marker, infoWindow } = createAssetElements(restoredAsset, taggedAssets.length, amElement, pinElement);
      restoredAsset.marker = marker;
      restoredAsset.infoWindow = infoWindow;

      // Recreate footprint polygon if dimensions provided (match addAsset behavior)
      const footprintPolygon = createFootprintPolygon(restoredAsset);
      if (footprintPolygon) {
        restoredAsset.footprintPolygon = footprintPolygon;
      }

      taggedAssets.splice(index, 0, restoredAsset);
      updateAssetList();
      updateStats();
      deletedAssetBackup = null;
      showStatusMessage('Generator restored');
    } catch (err) {
      showStatusMessage('Failed to restore generator');
    }
  }

  // Onboarding flow — offers 3 paths: address, map click, photo upload
  function showOnboarding() {
    const hasSeenOnboarding = localStorage.getItem('eboss_onboarding_shown');
    if (hasSeenOnboarding) return;

    const onboardingOverlay = document.getElementById('onboarding-overlay');
    if (!onboardingOverlay) return;

    onboardingOverlay.classList.remove('hidden');

    const optionsPanel = document.getElementById('onboarding-options');
    const addressForm = document.getElementById('onboarding-address-form');
    const addressInput = document.getElementById('onboarding-address-input');
    const siteNameInput = document.getElementById('onboarding-site-name-input');

    const dismiss = () => {
      localStorage.setItem('eboss_onboarding_shown', 'true');
      onboardingOverlay.classList.add('hidden');
    };

    // Option 1: address — show the inline form
    document.getElementById('onboarding-btn-address').addEventListener('click', () => {
      optionsPanel.classList.add('hidden');
      addressForm.classList.remove('hidden');
      addressInput.focus();
    }, { once: true });

    // Option 2: click on map — just dismiss
    document.getElementById('onboarding-btn-map').addEventListener('click', dismiss, { once: true });

    // Option 3: upload photo — dismiss then open add-generator dialog focused on photo input
    document.getElementById('onboarding-btn-photo').addEventListener('click', () => {
      dismiss();
      const center = map.getCenter();
      tempLocation = center;
      currentlyEditingAssetIndex = null;
      const dialogOverlay = document.getElementById('input-dialog-overlay');
      document.getElementById('dialog-title').textContent = 'Add Generator';
      document.getElementById('project-input').value = '';
      document.getElementById('asset-number-input').value = '';
      document.getElementById('asset-kw-input').value = '';
      document.getElementById('asset-lat-input').value = center.lat().toFixed(6);
      document.getElementById('asset-lng-input').value = center.lng().toFixed(6);
      document.getElementById('photo-preview').src = '';
      document.getElementById('photo-preview').classList.add('hidden');
      tempPhotoDataUrl = null;
      dialogOverlay.classList.remove('hidden');
      document.getElementById('asset-photo-input').click();
    }, { once: true });

    // Back button inside address form
    document.getElementById('back-onboarding-button').addEventListener('click', () => {
      addressForm.classList.add('hidden');
      optionsPanel.classList.remove('hidden');
    }, { once: true });

    // Save from address form
    document.getElementById('save-onboarding-button').addEventListener('click', () => {
      const address = addressInput.value.trim();
      const siteName = siteNameInput.value.trim();

      if (address) {
        try {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ address }, (results, status) => {
            try {
              if (status === 'OK' && results[0]) {
                userLocation = {
                  lat: results[0].geometry.location.lat(),
                  lng: results[0].geometry.location.lng(),
                  address: results[0].formatted_address
                };
                localStorage.setItem('eboss_user_location', JSON.stringify(userLocation));
                map.setCenter({ lat: userLocation.lat, lng: userLocation.lng });
                showStatusMessage(`Map centered on ${userLocation.address}`);
              } else {
                showStatusMessage('Could not locate that address. Please try another.');
              }
            } catch (e) {
              showStatusMessage('Geocoding callback error: ' + e.message);
            }
          });
        } catch (error) {
          showStatusMessage('Geocoding error: ' + error.message);
        }
      }

  try {
    const entry = drawnShapes.find(s => s.firestoreId === firestoreId);
    if (entry) {
      if (entry.overlay) entry.overlay.setMap(null);
      if (entry.textMarker) entry.textMarker.map = null;
    }
    await deleteDoc(doc(db, 'drawings', firestoreId));
    drawnShapes = drawnShapes.filter(s => s.firestoreId !== firestoreId);
    if (!suppressStatus) showStatusMessage('Annotation deleted');
    return true;
  } catch (err) {
    console.error('Error deleting drawing:', err);
    if (!suppressStatus) showStatusMessage('Error deleting annotation');
    return false;
  }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Escape closes any open dialog
  if (e.key === 'Escape') {
    ['input-dialog-overlay', 'cost-dialog-overlay', 'settings-dialog-overlay',
      'drawing-dialog-overlay', 'dialog-create-site-overlay', 'dialog-manage-sites-overlay',
      'onboarding-overlay'].forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.classList.contains('hidden')) el.classList.add('hidden');
      });
  }
  // Ctrl/Cmd+F — focus search
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    const searchInput = document.getElementById('search-input');
    if (searchInput) { e.preventDefault(); searchInput.focus(); searchInput.select(); }
  }
  // Ctrl/Cmd+S — export data
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    exportData();
  }
});

// Warn before leaving if there are unsaved generators
window.addEventListener('beforeunload', (e) => {
  if (taggedAssets.length > 0) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // DOM already loaded, call directly
  initApp();
}


// ─── Admin Panel Functions ───────────────────────────────────────────────────

async function loadAuditLogs() {
  const listEl = document.getElementById('audit-logs-list');
  listEl.innerHTML = '<p class="hint">Loading...</p>';

  try {
    const getAuditLogsFn = httpsCallable(functions, 'getAuditLogs');
    const result = await getAuditLogsFn({ limit: 100 });
    const logs = result.data.logs || [];

    if (logs.length === 0) {
      listEl.innerHTML = '<p class="hint">No audit logs found.</p>';
      return;
    }

    listEl.innerHTML = logs.map(log => {
      const timestamp = new Date(log.timestamp).toLocaleString();
      let details = '';

      if (log.action === 'CREATE' && log.details) {
        if (log.resourceType === 'generator') {
          details = `Created ${escapeHtml(log.details.label)} (${escapeHtml(String(log.details.kw))}kW)`;
        } else if (log.resourceType === 'project') {
          details = `Created project "${escapeHtml(log.details.name)}"`;
        } else {
          details = `Created ${escapeHtml(log.resourceType)}`;
        }
      } else if (log.action === 'UPDATE' && log.details) {
        const changedFields = Object.keys(log.details).map(k => escapeHtml(k)).join(', ');
        details = `Updated ${changedFields}`;
      } else if (log.action === 'DELETE') {
        details = `Deleted ${escapeHtml(log.resourceType)}`;
      }

      const actionColors = {
        CREATE: '#27ae60',
        UPDATE: '#f39c12',
        DELETE: '#e74c3c'
      };

      const action = escapeHtml(log.action || '');
      const resourceType = escapeHtml(log.resourceType || '');
      const userId = escapeHtml((log.userId || 'system').substring(0, 8));
      const projectId = escapeHtml((log.projectId || 'N/A').substring(0, 8));

      return `
        <div style="padding: 12px; border-bottom: 1px solid var(--border-color); font-size: 13px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: ${actionColors[log.action] || '#95a5a6'}; color: white; font-size: 11px; font-weight: 500; margin-right: 8px;">${action}</span>
              <strong style="text-transform: capitalize;">${resourceType}</strong>
            </div>
            <span style="color: var(--text-secondary); font-size: 11px;">${escapeHtml(timestamp)}</span>
          </div>
          <div style="margin-top: 5px; color: var(--text-secondary);">
            ${details}
          </div>
          <div style="margin-top: 3px; font-size: 11px; color: #7f8c8d;">
            By: ${userId}... | Project: ${projectId}...
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    listEl.innerHTML = `<p class="hint error-text">Error: ${error.message}</p>`;
  }
}

async function loadTemplates() {
  // Load built-in templates
  const builtinList = document.getElementById('builtin-templates-list');
  const customList = document.getElementById('custom-templates-list');

  builtinList.innerHTML = '<p class="hint">Loading...</p>';
  customList.innerHTML = '<p class="hint">Loading...</p>';

  try {
    // Get built-in templates
    const listTemplatesFn = httpsCallable(functions, 'listTemplates');
    const builtinResult = await listTemplatesFn();
    const builtinTemplates = builtinResult.data.templates || [];

    builtinList.innerHTML = builtinTemplates.map(t => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 8px;">
        <div>
          <div style="font-weight: 500;">${t.name}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">${t.description}</div>
          <div style="font-size: 11px; margin-top: 4px; color: #7f8c8d;">
            ${t.generatorCount} generators, ${t.drawingCount} drawings
          </div>
        </div>
        <button class="create-from-template-btn secondary" data-template="${t.id}" data-custom="false" style="padding: 6px 12px;">
          Use
        </button>
      </div>
    `).join('');

    // Get custom templates
    const listCustomFn = httpsCallable(functions, 'listCustomTemplates');
    const customResult = await listCustomFn();
    const customTemplates = customResult.data.templates || [];

    if (customTemplates.length === 0) {
      customList.innerHTML = '<p class="hint">No custom templates yet. Save a project as a template to see it here.</p>';
    } else {
      customList.innerHTML = customTemplates.map(t => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 8px;">
          <div>
            <div style="font-weight: 500;">${t.name}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${t.description || 'Custom template'}</div>
            <div style="font-size: 11px; margin-top: 4px; color: #7f8c8d;">
              ${t.generatorCount} generators, ${t.drawingCount} drawings
            </div>
          </div>
          <button class="create-from-template-btn secondary" data-template="${t.id}" data-custom="true" style="padding: 6px 12px;">
            Use
          </button>
        </div>
      `).join('');
    }

    // Add event listeners
    document.querySelectorAll('.create-from-template-btn').forEach(btn => {
      btn.addEventListener('click', () => showCreateFromTemplateDialog(btn.dataset.template, btn.dataset.custom === 'true'));
    });

  } catch (error) {
    builtinList.innerHTML = `<p class="hint error-text">Error: ${error.message}</p>`;
    customList.innerHTML = '';
      if (siteName) {
        localStorage.setItem('eboss_site_name', siteName);
      }

      dismiss();
    }, { once: true });
  }

async function testEmailConfig() {
  const resultEl = document.getElementById('email-test-result');
  const statusEl = document.getElementById('email-status');

  resultEl.textContent = 'Testing...';
  resultEl.className = 'hint';

  try {
    const testEmailFn = httpsCallable(functions, 'testEmailConfig');
    const result = await testEmailFn();

    if (result.data.sent) {
      statusEl.textContent = 'Configured (SendGrid active)';
      statusEl.style.color = '#27ae60';
      resultEl.textContent = 'Test email sent successfully! Check your inbox.';
      resultEl.className = 'hint success-text';
    } else {
      statusEl.textContent = 'Not configured';
      statusEl.style.color = '#f39c12';
      resultEl.textContent = `Email not sent: ${result.data.reason || 'Unknown'}. Add SENDGRID_API_KEY to Secret Manager.`;
      resultEl.className = 'hint';
    }
  } catch (error) {
    statusEl.textContent = 'Error';
    statusEl.style.color = '#e74c3c';
    resultEl.textContent = `Error: ${error.message}`;
    resultEl.className = 'hint error-text';
  }
}

function showSaveTemplateDialog() {
  if (!activeSiteId) {
    showStatusMessage('Select a project first');
    return;
  }

  const dialog = document.createElement('div');
  dialog.className = 'dialog-overlay';
  dialog.innerHTML = `
    <div class="dialog" style="max-width: 400px;">
      <h4>Save as Template</h4>
      <div style="margin: 15px 0;">
        <label>Template Name</label>
        <input type="text" id="template-name" placeholder="e.g., Standard Abilene Layout" style="width: 100%; margin-top: 5px;" />
      </div>
      <div style="margin: 15px 0;">
        <label>Description</label>
        <textarea id="template-description" placeholder="Brief description of this layout..." style="width: 100%; height: 80px; margin-top: 5px;"></textarea>
      </div>
      <div class="dialog-buttons">
        <button id="cancel-save-template" class="secondary">Cancel</button>
        <button id="confirm-save-template" class="primary">Save Template</button>
      </div>
      <p id="save-template-error" class="hint error-text hidden" style="margin-top: 10px;"></p>
    </div>
  `;
  document.body.appendChild(dialog);

  document.getElementById('cancel-save-template').addEventListener('click', () => dialog.remove());
  document.getElementById('confirm-save-template').addEventListener('click', async () => {
    const name = document.getElementById('template-name').value.trim();
    const description = document.getElementById('template-description').value.trim();
    const errorEl = document.getElementById('save-template-error');

    if (!name) {
      errorEl.textContent = 'Template name required';
      errorEl.classList.remove('hidden');
      return;
    }

    try {
      const saveAsTemplateFn = httpsCallable(functions, 'saveAsTemplate');
      await saveAsTemplateFn({
        projectId: activeSiteId,
        templateName: name,
        templateDescription: description
      });

      showStatusMessage('Template saved successfully');
      dialog.remove();
      loadTemplates(); // Refresh list
    } catch (error) {
      errorEl.textContent = error.message || 'Failed to save template';
      errorEl.classList.remove('hidden');
    }
  });
}

function showCreateFromTemplateDialog(templateId, isCustom) {
  const dialog = document.createElement('div');
  dialog.className = 'dialog-overlay';
  dialog.innerHTML = `
    <div class="dialog" style="max-width: 400px;">
      <h4>Create Project from Template</h4>
      <div style="margin: 15px 0;">
        <label>Project Name *</label>
        <input type="text" id="new-project-name" placeholder="e.g., Abilene Phase 2" style="width: 100%; margin-top: 5px;" />
      </div>
      <div style="margin: 15px 0;">
        <label>Address (optional)</label>
        <input type="text" id="new-project-address" placeholder="123 Main St, Abilene, TX" style="width: 100%; margin-top: 5px;" />
      </div>
      <div class="dialog-buttons">
        <button id="cancel-create-project" class="secondary">Cancel</button>
        <button id="confirm-create-project" class="primary">Create Project</button>
      </div>
      <p id="create-project-error" class="hint error-text hidden" style="margin-top: 10px;"></p>
    </div>
  `;
  document.body.appendChild(dialog);

  document.getElementById('cancel-create-project').addEventListener('click', () => dialog.remove());
  document.getElementById('confirm-create-project').addEventListener('click', async () => {
    const name = document.getElementById('new-project-name').value.trim();
    const address = document.getElementById('new-project-address').value.trim();
    const errorEl = document.getElementById('create-project-error');

    if (!name) {
      errorEl.textContent = 'Project name required';
      errorEl.classList.remove('hidden');
      return;
    }

    try {
      const createFn = isCustom
        ? httpsCallable(functions, 'createFromCustomTemplate')
        : httpsCallable(functions, 'createProjectFromTemplate');

      const result = await createFn({
        templateId,
        projectName: name,
        address
      });

      showStatusMessage(`Project "${name}" created with ${result.data.generatorCount} generators`);
      dialog.remove();

      // Refresh sites list and switch to new project
      await loadActiveSites();
      await siteSwitch(result.data.projectId, AdvancedMarkerElementClass, PinElementClass);

    } catch (error) {
      errorEl.textContent = error.message || 'Failed to create project';
      errorEl.classList.remove('hidden');
    }
  });
}
  


  // App bootstrap
  if (document.readyState === "loading") {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
