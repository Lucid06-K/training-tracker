import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  getRedirectResult
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyA3xnanInh2tu-qIbI6JfWd67UmkyWwBBw',
  authDomain: 'tkwp-f8078.firebaseapp.com',
  projectId: 'tkwp-f8078',
  storageBucket: 'tkwp-f8078.firebasestorage.app',
  messagingSenderId: '872556487328',
  appId: '1:872556487328:web:a7369c363c56d62acd1fc5'
};

let app, auth, db;
let initialized = false;

export function getFirebase() {
  if (!initialized) {
    try {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      getRedirectResult(auth).catch((e) => {
        if (e && e.code && e.code !== 'auth/no-auth-event') {
          console.warn('getRedirectResult', e);
        }
      });
      initialized = true;
    } catch (e) {
      console.warn('Firebase init failed', e);
    }
  }
  return { app, auth, db };
}

export function onAuthChanged(cb) {
  const { auth } = getFirebase();
  if (!auth) { cb(null); return () => {}; }
  return onAuthStateChanged(auth, cb);
}

function shouldUseRedirect() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isStandalone =
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    window.navigator.standalone === true;
  // Popup auth is unreliable on iOS Safari and inside any home-screen PWA;
  // skip straight to redirect, which is what Firebase recommends there.
  return isIOS || isStandalone;
}

export async function signInWithGoogle() {
  const { auth } = getFirebase();
  if (!auth) throw new Error('Firebase not ready');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  if (shouldUseRedirect()) {
    await signInWithRedirect(auth, provider);
    return null;
  }

  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (e) {
    const code = e?.code || '';
    const fallbackToRedirect =
      code === 'auth/popup-blocked' ||
      code === 'auth/operation-not-supported-in-this-environment' ||
      code === 'auth/web-storage-unsupported' ||
      code === 'auth/internal-error';
    if (fallbackToRedirect) {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw e;
  }
}

export async function signOutUser() {
  const { auth } = getFirebase();
  if (!auth) return;
  await signOut(auth);
}

export async function pullDoc(id) {
  const { db } = getFirebase();
  if (!db || !id) return null;
  try {
    const snap = await getDoc(doc(db, 'users', id));
    if (!snap.exists()) return null;
    return snap.data();
  } catch (e) {
    console.warn('Firestore pull failed', e);
    return null;
  }
}

export async function pushDoc(id, payload) {
  const { db } = getFirebase();
  if (!db || !id) return false;
  try {
    await setDoc(doc(db, 'users', id), {
      jsonData: JSON.stringify(payload),
      lastModified: Date.now(),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (e) {
    console.warn('Firestore push failed', e);
    return false;
  }
}

export function subscribe(id, cb) {
  const { db } = getFirebase();
  if (!db || !id) return () => {};
  return onSnapshot(
    doc(db, 'users', id),
    (snap) => {
      if (!snap.exists()) return;
      cb(snap.data());
    },
    (err) => {
      console.warn('Firestore onSnapshot error', err);
    }
  );
}
