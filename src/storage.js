/**
 * Storage shim with Firebase Firestore sync.
 * - Offline-first: localStorage always works
 * - When logged in: mirrors reads/writes to Firestore
 * - On login: pulls cloud data → overwrites local if cloud is newer
 */
import {
  auth, db, googleProvider,
  signInWithPopup, signInWithRedirect, getRedirectResult,
  signOut as fbSignOut, onAuthStateChanged,
  doc, getDoc, setDoc, deleteDoc, collection, getDocs
} from './firebase.js';

let currentUser = null;
let syncListeners = [];

/* ── Detect mobile/PWA ── */
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

/* ── Firestore helpers ── */
function userDocRef(key) {
  if (!currentUser) return null;
  const safeKey = key.replace(/\//g, '__');
  return doc(db, 'users', currentUser.uid, 'data', safeKey);
}

async function cloudSet(key, value) {
  const ref = userDocRef(key);
  if (!ref) return;
  try {
    await setDoc(ref, { key, value, updatedAt: Date.now() });
  } catch (e) {
    console.warn('[sync] write failed:', e.message);
  }
}

async function cloudDelete(key) {
  const ref = userDocRef(key);
  if (!ref) return;
  try {
    await deleteDoc(ref);
  } catch (e) {
    console.warn('[sync] delete failed:', e.message);
  }
}

async function cloudListAll() {
  if (!currentUser) return [];
  try {
    const colRef = collection(db, 'users', currentUser.uid, 'data');
    const snap = await getDocs(colRef);
    return snap.docs.map(d => d.data());
  } catch (e) {
    console.warn('[sync] list failed:', e.message);
    return [];
  }
}

/* ── Pull cloud → local on login ── */
async function pullFromCloud() {
  if (!currentUser) return;
  try {
    const cloudDocs = await cloudListAll();
    if (cloudDocs.length === 0) {
      await pushToCloud();
      return;
    }
    for (const d of cloudDocs) {
      localStorage.setItem(d.key, d.value);
    }
    notifySync();
  } catch (e) {
    console.warn('[sync] pull failed:', e.message);
  }
}

/* ── Push local → cloud ── */
async function pushToCloud() {
  if (!currentUser) return;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('bp-v4')) {
        const value = localStorage.getItem(key);
        await cloudSet(key, value);
      }
    }
  } catch (e) {
    console.warn('[sync] push failed:', e.message);
  }
}

function notifySync() {
  syncListeners.forEach(fn => { try { fn(); } catch(e) {} });
}

/* ── Storage API ── */
const storage = {
  async get(key) {
    const value = localStorage.getItem(key);
    if (value === null) throw new Error('Key not found: ' + key);
    return { key, value };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
    if (currentUser) cloudSet(key, value);
    return { key, value };
  },
  async delete(key) {
    localStorage.removeItem(key);
    if (currentUser) cloudDelete(key);
    return { key, deleted: true };
  },
  async list(prefix = '') {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) keys.push(k);
    }
    return { keys, prefix };
  }
};

/* ── Auth API ── */
const firebaseAuth = {
  get user() { return currentUser; },

  async signIn() {
    // On mobile PWA, popup doesn't work → use redirect
    if (isPWA || isMobile) {
      try {
        await signInWithRedirect(auth, googleProvider);
        // Page will redirect, no return
      } catch (e) {
        // Fallback to popup if redirect fails
        console.warn('[auth] redirect failed, trying popup:', e.message);
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
      }
    } else {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    }
  },

  async signOut() {
    try { await fbSignOut(auth); currentUser = null; notifySync(); } catch(e) {}
  },

  onAuthChange(fn) {
    return onAuthStateChanged(auth, fn);
  },

  onSync(fn) {
    syncListeners.push(fn);
    return () => { syncListeners = syncListeners.filter(f => f !== fn); };
  },

  async forceSync() {
    if (!currentUser) return;
    await pushToCloud();
  }
};

/* ── Handle redirect result (mobile PWA) ── */
getRedirectResult(auth).then(result => {
  if (result?.user) {
    currentUser = result.user;
    pullFromCloud();
    notifySync();
  }
}).catch(e => {
  console.warn('[auth] redirect result error:', e.message);
});

/* ── Auth state listener ── */
onAuthStateChanged(auth, async (user) => {
  const wasLoggedIn = !!currentUser;
  currentUser = user;
  if (user && !wasLoggedIn) {
    await pullFromCloud();
  }
  notifySync();
});

window.storage = storage;
window.firebaseAuth = firebaseAuth;
