import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
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
  databaseURL:
    'https://tkwp-f8078-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'tkwp-f8078',
  storageBucket: 'tkwp-f8078.firebasestorage.app',
  messagingSenderId: '872556487328',
  appId: '1:872556487328:web:a7369c363c56d62acd1fc5'
};

let app, auth, db;
let initialized = false;
let anonReady = null;

export function getFirebase() {
  if (!initialized) {
    try {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      anonReady = signInAnonymously(auth).catch((e) => {
        console.warn('Firebase anon auth failed', e);
        return null;
      });
      initialized = true;
    } catch (e) {
      console.warn('Firebase init failed', e);
    }
  }
  return { app, auth, db, anonReady };
}

export async function pullDoc(code) {
  const { db, anonReady } = getFirebase();
  if (!db || !code) return null;
  try {
    if (anonReady) await anonReady;
    const snap = await getDoc(doc(db, 'users', code));
    if (!snap.exists()) return null;
    return snap.data();
  } catch (e) {
    console.warn('Firestore pull failed', e);
    return null;
  }
}

export async function pushDoc(code, payload) {
  const { db, anonReady } = getFirebase();
  if (!db || !code) return false;
  try {
    if (anonReady) await anonReady;
    await setDoc(doc(db, 'users', code), {
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

export function subscribe(code, cb) {
  const { db, anonReady } = getFirebase();
  if (!db || !code) return () => {};
  let unsub = () => {};
  Promise.resolve(anonReady).then(() => {
    unsub = onSnapshot(
      doc(db, 'users', code),
      (snap) => {
        if (!snap.exists()) return;
        cb(snap.data());
      },
      (err) => {
        console.warn('Firestore onSnapshot error', err);
      }
    );
  });
  return () => unsub();
}
