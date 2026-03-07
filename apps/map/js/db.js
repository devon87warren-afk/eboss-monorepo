// Firebase Firestore + Storage backend
// Uses Firebase CDN (v10.14.0 modular SDK) — no bundler required.
import { initializeApp }                              from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js';
import { getFirestore, collection, addDoc, updateDoc,
         deleteDoc, getDocs, doc, serverTimestamp }   from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';
import { getStorage, ref, uploadString,
         getDownloadURL, deleteObject }               from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js';
import { firebaseConfig } from './firebase-config.js';

const GENERATORS = 'generators';

// ---------------------------------------------------------------------------
// Initialization — skip gracefully if config is still a placeholder
// ---------------------------------------------------------------------------
let _db      = null;
let _storage = null;

const configReady = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('REPLACE_')
                 && firebaseConfig.appId  && !firebaseConfig.appId.startsWith('REPLACE_');

if (configReady) {
  try {
    const app = initializeApp(firebaseConfig);
    _db      = getFirestore(app);
    _storage = getStorage(app);
  } catch (e) {
    console.warn('[db] Firebase init failed:', e.message);
  }
} else {
  console.info('[db] Firebase config has placeholder values — running in offline mode.');
}

/** Returns true when Firestore is ready. */
export function isDbEnabled() { return _db !== null; }

// ---------------------------------------------------------------------------
// Firestore helpers
// ---------------------------------------------------------------------------

/** Load all generators from Firestore. Returns array of plain objects. */
export async function loadGenerators() {
  const snapshot = await getDocs(collection(_db, GENERATORS));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Save a new generator.  If a photo data-URL is provided it is uploaded to
 * Firebase Storage and only the HTTPS download URL is stored in Firestore
 * (avoids the 1 MB Firestore document limit).
 * @returns {string} The new Firestore document ID.
 */
export async function saveGenerator({ label, kw, lat, lng, photoDataUrl }) {
  let photoUrl = null;

  if (photoDataUrl && _storage) {
    const photoRef = ref(_storage, `generator-photos/${Date.now()}.jpg`);
    await uploadString(photoRef, photoDataUrl, 'data_url');
    photoUrl = await getDownloadURL(photoRef);
  }

  const docRef = await addDoc(collection(_db, GENERATORS), {
    label,
    kw,
    lat,
    lng,
    photoUrl,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Update an existing generator document.
 * Only uploads a new photo when photoDataUrl is a fresh data: URL.
 */
export async function updateGenerator(id, { label, kw, photoDataUrl }) {
  const updates = {
    label,
    kw,
    updatedAt: serverTimestamp(),
  };

  // A data: prefix means the user selected a new local photo
  if (photoDataUrl && photoDataUrl.startsWith('data:') && _storage) {
    const photoRef = ref(_storage, `generator-photos/${id}_${Date.now()}.jpg`);
    await uploadString(photoRef, photoDataUrl, 'data_url');
    updates.photoUrl = await getDownloadURL(photoRef);
  }

  await updateDoc(doc(_db, GENERATORS, id), updates);
}

/** Delete a generator document from Firestore. */
export async function deleteGenerator(id) {
  await deleteDoc(doc(_db, GENERATORS, id));
}
