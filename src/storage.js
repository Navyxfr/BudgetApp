/**
 * Storage shim with Firebase Firestore sync.
 * - Offline-first: localStorage always works
 * - When logged in: mirrors reads/writes to Firestore
 * - On login: merges cloud/local by updatedAt
 * - Deletions use tombstones to avoid data resurrection across devices
 */
import {
  auth, db, googleProvider,
  signInWithPopup, signInWithRedirect, getRedirectResult,
  setPersistence, browserLocalPersistence, browserSessionPersistence,
  signOut as fbSignOut, onAuthStateChanged,
  doc, setDoc, deleteDoc, collection, getDocs
} from './firebase.js';
import { mergeByUpdatedAt } from './core/syncMerge.js';

let currentUser = null;
let syncListeners = [];
let authErrorListeners = [];
let lastAuthError = null;

const UPDATED_AT_KEY = 'bp-v4-updated-at';
const DELETED_AT_KEY = 'bp-v4-deleted-at';
const TOMBSTONE_TTL_DAYS = 30;
const TOMBSTONE_TTL_MS = TOMBSTONE_TTL_DAYS * 24 * 60 * 60 * 1000;

function isBudgetKey(key) {
  return !!key && key.startsWith('bp-v4') && key !== UPDATED_AT_KEY && key !== DELETED_AT_KEY;
}

function getMap(mapKey) {
  try {
    const raw = localStorage.getItem(mapKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    return {};
  }
}

function setMap(mapKey, map) {
  try {
    localStorage.setItem(mapKey, JSON.stringify(map));
  } catch (e) {}
}

function getKeyFromMap(mapKey, key) {
  const map = getMap(mapKey);
  const value = Number(map[key] || 0);
  return Number.isFinite(value) ? value : 0;
}

function setKeyInMap(mapKey, key, updatedAt) {
  const ts = Number(updatedAt || Date.now());
  const map = getMap(mapKey);
  map[key] = ts;
  setMap(mapKey, map);
}

function removeKeyFromMap(mapKey, key) {
  const map = getMap(mapKey);
  delete map[key];
  setMap(mapKey, map);
}

function getDeletedMap() {
  return getMap(DELETED_AT_KEY);
}

function purgeOldDeletedEntries(nowTs = Date.now()) {
  const deletedMap = getDeletedMap();
  const updatedMap = getMap(UPDATED_AT_KEY);
  let changed = false;
  for (const [key, deletedAtRaw] of Object.entries(deletedMap)) {
    const deletedAt = Number(deletedAtRaw || 0);
    if (!deletedAt || nowTs - deletedAt < TOMBSTONE_TTL_MS) continue;
    delete deletedMap[key];
    delete updatedMap[key];
    changed = true;
  }
  if (changed) {
    setMap(DELETED_AT_KEY, deletedMap);
    setMap(UPDATED_AT_KEY, updatedMap);
  }
}

function getKeyUpdatedAt(key) {
  return getKeyFromMap(UPDATED_AT_KEY, key);
}

function setKeyUpdatedAt(key, updatedAt) {
  setKeyInMap(UPDATED_AT_KEY, key, updatedAt);
}

function getKeyDeletedAt(key) {
  return getKeyFromMap(DELETED_AT_KEY, key);
}

function setKeyDeletedAt(key, deletedAt) {
  setKeyInMap(DELETED_AT_KEY, key, deletedAt);
}

function removeKeyDeletedAt(key) {
  removeKeyFromMap(DELETED_AT_KEY, key);
}

/* Detect mobile/PWA */
const ua = navigator.userAgent || '';
const isIpadOsDesktopUA = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
const isMobile = /iPhone|iPad|iPod|Android/i.test(ua) || isIpadOsDesktopUA;
const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
const isSecureAuthOrigin =
  window.isSecureContext ||
  window.location.protocol === 'https:' ||
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

/* Firestore helpers */
function userDocRef(key) {
  if (!currentUser) return null;
  const safeKey = key.replace(/\//g, '__');
  return doc(db, 'users', currentUser.uid, 'data', safeKey);
}

async function cloudSet(key, value, updatedAt) {
  const ref = userDocRef(key);
  if (!ref) return;
  try {
    await setDoc(ref, { key, value, deleted: false, updatedAt: Number(updatedAt || Date.now()) });
  } catch (e) {
    console.warn('[sync] write failed:', e.message);
  }
}

async function cloudSetDeleted(key, updatedAt) {
  const ref = userDocRef(key);
  if (!ref) return;
  try {
    await setDoc(ref, { key, value: null, deleted: true, updatedAt: Number(updatedAt || Date.now()) });
  } catch (e) {
    console.warn('[sync] delete failed:', e.message);
  }
}

async function cloudListAll() {
  if (!currentUser) return [];
  try {
    const colRef = collection(db, 'users', currentUser.uid, 'data');
    const snap = await getDocs(colRef);
    return { ok: true, docs: snap.docs.map(d => d.data()) };
  } catch (e) {
    console.warn('[sync] list failed:', e.message);
    return { ok: false, docs: [], error: e };
  }
}

function getLocalBudgetKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (isBudgetKey(key)) keys.push(key);
  }
  return keys;
}

function localRecordForKey(key) {
  const deletedAt = getKeyDeletedAt(key);
  if (deletedAt) {
    return { exists: true, deleted: true, updatedAt: deletedAt, value: null };
  }
  const value = localStorage.getItem(key);
  if (value === null) return { exists: false, deleted: false, updatedAt: 0, value: null };
  return { exists: true, deleted: false, updatedAt: getKeyUpdatedAt(key), value };
}

function cloudRecordForKey(cloudByKey, key) {
  const d = cloudByKey.get(key);
  if (!d) return { exists: false, deleted: false, updatedAt: 0, value: null };
  return {
    exists: true,
    deleted: !!d.deleted,
    updatedAt: Number(d.updatedAt || 0),
    value: d.value ?? null
  };
}

function applyRecordLocally(key, record) {
  if (!record.exists) return;
  if (record.deleted) {
    localStorage.removeItem(key);
    setKeyUpdatedAt(key, record.updatedAt || Date.now());
    setKeyDeletedAt(key, record.updatedAt || Date.now());
    return;
  }
  localStorage.setItem(key, String(record.value ?? ''));
  setKeyUpdatedAt(key, record.updatedAt || Date.now());
  removeKeyDeletedAt(key);
}

async function pushRecordToCloud(key, record) {
  if (!record.exists) return;
  if (record.deleted) {
    await cloudSetDeleted(key, record.updatedAt || Date.now());
    return;
  }
  await cloudSet(key, record.value, record.updatedAt || Date.now());
}

function hasUsableLocalMeta() {
  try {
    const raw = localStorage.getItem('bp-v4-meta');
    if (!raw) return false;
    const meta = JSON.parse(raw);
    return Array.isArray(meta?.households) && meta.households.length > 0;
  } catch (e) {
    return false;
  }
}

function forceApplyCloudDocsLocally(cloudDocs) {
  for (const d of cloudDocs || []) {
    const key = d?.key;
    if (!isBudgetKey(key)) continue;
    const updatedAt = Number(d?.updatedAt || Date.now());
    if (d?.deleted) {
      localStorage.removeItem(key);
      setKeyUpdatedAt(key, updatedAt);
      setKeyDeletedAt(key, updatedAt);
      continue;
    }
    localStorage.setItem(key, String(d?.value ?? ''));
    setKeyUpdatedAt(key, updatedAt);
    removeKeyDeletedAt(key);
  }
}

async function mergeCloudAndLocal(cloudDocsInput) {
  purgeOldDeletedEntries();
  const cloudDocs = cloudDocsInput || [];
  const cloudByKey = new Map();
  for (const d of cloudDocs) {
    if (isBudgetKey(d?.key)) cloudByKey.set(d.key, d);
  }

  const nowTs = Date.now();
  for (const [key, docData] of cloudByKey.entries()) {
    const isDeleted = !!docData?.deleted;
    const updatedAt = Number(docData?.updatedAt || 0);
    if (isDeleted && updatedAt && nowTs - updatedAt >= TOMBSTONE_TTL_MS) {
      const ref = userDocRef(key);
      if (ref) {
        try {
          await deleteDoc(ref);
        } catch (e) {
          console.warn('[sync] purge tombstone failed:', e.message);
        }
      }
      cloudByKey.delete(key);
      removeKeyDeletedAt(key);
    }
  }

  const deletedKeys = Object.keys(getDeletedMap());
  const keys = new Set([...getLocalBudgetKeys(), ...deletedKeys, ...cloudByKey.keys()]);

  for (const key of keys) {
    const localRecord = localRecordForKey(key);
    const cloudRecord = cloudRecordForKey(cloudByKey, key);
    const result = mergeByUpdatedAt({ local: localRecord, cloud: cloudRecord, preferOnEqual: 'cloud' });

    if (result.winner === 'cloud') {
      applyRecordLocally(key, result.record);
      continue;
    }
    if (result.winner === 'local') {
      await pushRecordToCloud(key, result.record);
    }
  }
}

/* Pull cloud -> local on login */
async function pullFromCloud() {
  if (!currentUser) return;
  try {
    const listed = await cloudListAll();
    if (!listed?.ok) {
      notifyAuthError(listed?.error || new Error('sync/list-failed'));
      return;
    }
    const cloudDocs = listed.docs || [];
    if (cloudDocs.length === 0) {
      await pushToCloud();
      notifySync();
      return;
    }

    // Bootstrap behavior: if this browser has no usable local meta yet,
    // prioritize cloud snapshot so user immediately recovers existing foyers.
    if (!hasUsableLocalMeta()) {
      forceApplyCloudDocsLocally(cloudDocs);
      notifySync();
      return;
    }

    await mergeCloudAndLocal(cloudDocs);
    notifySync();
  } catch (e) {
    console.warn('[sync] pull failed:', e.message);
    notifyAuthError(e);
  }
}

/* Push local -> cloud */
async function pushToCloud() {
  if (!currentUser) return;
  try {
    const deletedKeys = Object.keys(getDeletedMap());
    const keys = new Set([...getLocalBudgetKeys(), ...deletedKeys]);
    for (const key of keys) {
      await pushRecordToCloud(key, localRecordForKey(key));
    }
  } catch (e) {
    console.warn('[sync] push failed:', e.message);
  }
}

function notifySync() {
  syncListeners.forEach(fn => {
    try {
      fn();
    } catch (e) {}
  });
}

function notifyAuthError(error) {
  lastAuthError = error || null;
  authErrorListeners.forEach(fn => {
    try {
      fn(error);
    } catch (e) {}
  });
}

/* Storage API */
const storage = {
  async get(key) {
    const value = localStorage.getItem(key);
    if (value === null) throw new Error('Key not found: ' + key);
    return { key, value };
  },
  async set(key, value) {
    const ts = Date.now();
    localStorage.setItem(key, value);
    if (isBudgetKey(key)) {
      setKeyUpdatedAt(key, ts);
      removeKeyDeletedAt(key);
      if (currentUser) await cloudSet(key, value, ts);
    }
    return { key, value };
  },
  async delete(key) {
    localStorage.removeItem(key);
    if (isBudgetKey(key)) {
      const ts = Date.now();
      setKeyUpdatedAt(key, ts);
      setKeyDeletedAt(key, ts);
      if (currentUser) await cloudSetDeleted(key, ts);
    }
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

/* Auth API */
const firebaseAuth = {
  get user() {
    return currentUser;
  },

  async signIn() {
    // iOS Safari is stricter on insecure origins (http://IP). Fail fast with explicit code.
    if ((isMobile || isPWA) && !isSecureAuthOrigin) {
      const err = new Error('Connexion mobile indisponible sur origine non securisee. Utilisez HTTPS.');
      err.code = 'auth/mobile-insecure-origin';
      throw err;
    }

    // Ensure persistence survives full-page redirect on mobile browsers.
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (e) {
      try {
        await setPersistence(auth, browserSessionPersistence);
      } catch (_) {}
    }

    // In standalone/PWA mode, redirect is generally the most reliable.
    if (isPWA) {
      await signInWithRedirect(auth, googleProvider);
      return undefined;
    }

    try {
      // Try popup first when directly triggered by user interaction.
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (e) {
      if (e?.code === 'auth/unauthorized-domain') {
        const err = new Error(`Domaine non autorise pour Firebase Auth: ${window.location.hostname}`);
        err.code = 'auth/unauthorized-domain';
        throw err;
      }
      // Fallback to redirect on mobile or when popup is blocked/cancelled.
      const canFallbackToRedirect =
        isMobile ||
        isPWA ||
        e?.code === 'auth/popup-blocked' ||
        e?.code === 'auth/cancelled-popup-request' ||
        e?.code === 'auth/popup-closed-by-user';
      if (canFallbackToRedirect) {
        await signInWithRedirect(auth, googleProvider);
        return undefined;
      }
      throw e;
    }
  },

  async signOut() {
    try {
      await fbSignOut(auth);
      currentUser = null;
      notifySync();
    } catch (e) {}
  },

  onAuthChange(fn) {
    return onAuthStateChanged(auth, fn);
  },

  onSync(fn) {
    syncListeners.push(fn);
    return () => {
      syncListeners = syncListeners.filter(f => f !== fn);
    };
  },

  onAuthError(fn) {
    authErrorListeners.push(fn);
    if (lastAuthError) {
      try {
        fn(lastAuthError);
      } catch (e) {}
    }
    return () => {
      authErrorListeners = authErrorListeners.filter(f => f !== fn);
    };
  },

  async forceSync() {
    if (!currentUser) return;
    await pushToCloud();
  }
};

/* Handle redirect result (mobile PWA) */
getRedirectResult(auth)
  .then(result => {
    if (result?.user) {
      currentUser = result.user;
      pullFromCloud();
      notifySync();
    }
  })
  .catch(e => {
    console.warn('[auth] redirect result error:', e.message);
    notifyAuthError(e);
  });

/* Auth state listener */
onAuthStateChanged(auth, async user => {
  const wasLoggedIn = !!currentUser;
  currentUser = user;
  if (user && !wasLoggedIn) {
    await pullFromCloud();
  }
  notifySync();
});

window.storage = storage;
window.firebaseAuth = firebaseAuth;
