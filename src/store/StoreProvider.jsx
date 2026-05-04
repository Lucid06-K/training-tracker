import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { STORAGE_KEY, SYNC_CODE_KEY, buildDefaultData, mergeWithDefaults, mergeSyncData } from './defaults.js';
import {
  onAuthChanged,
  pullDoc,
  pushDoc,
  signInWithGoogle,
  signOutUser,
  subscribe
} from './firebase.js';

const StoreCtx = createContext(null);

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return mergeWithDefaults(JSON.parse(raw));
  } catch (e) {
    console.warn('Failed to parse localStorage data', e);
  }
  return buildDefaultData();
}

function persistToStorage(d) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch (e) {
    console.warn('Failed to save to localStorage', e);
  }
}

function pickUser(fbUser) {
  if (!fbUser) return null;
  return {
    uid: fbUser.uid,
    email: fbUser.email || '',
    name: fbUser.displayName || '',
    photoURL: fbUser.photoURL || ''
  };
}

export function StoreProvider({ children }) {
  const [data, setData] = useState(loadFromStorage);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState('offline');
  const [signingIn, setSigningIn] = useState(false);

  const dataRef = useRef(data);
  const userRef = useRef(user);
  const pushTimer = useRef(null);
  const unsubRef = useRef(null);

  useEffect(() => { dataRef.current = data; }, [data]);
  useEffect(() => { userRef.current = user; }, [user]);

  const persist = useCallback((next) => {
    persistToStorage(next);
    if (userRef.current) {
      clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(async () => {
        setSyncStatus('syncing');
        const payload = { ...dataRef.current, _lastModified: Date.now() };
        const ok = await pushDoc(userRef.current.uid, payload);
        setSyncStatus(ok ? 'connected' : 'offline');
      }, 1200);
    }
  }, []);

  const update = useCallback((recipe) => {
    setData((prev) => {
      const draft = typeof recipe === 'function' ? recipe(structuredClone(prev)) : recipe;
      const next = mergeWithDefaults(draft);
      persist(next);
      return next;
    });
  }, [persist]);

  const setValue = useCallback((path, value) => {
    update((draft) => {
      const keys = Array.isArray(path) ? path : path.split('.');
      let cursor = draft;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        cursor[k] = cursor[k] ?? {};
        cursor = cursor[k];
      }
      cursor[keys[keys.length - 1]] = value;
      return draft;
    });
  }, [update]);

  const applyMerged = useCallback((merged) => {
    persistToStorage(merged);
    setData(merged);
    return merged;
  }, []);

  const mergeFromCloud = useCallback((cloud, fallbackModified = 0) => {
    try {
      const parsed = JSON.parse(cloud.jsonData);
      const cloudModified = cloud.lastModified || fallbackModified;
      const localModified = dataRef.current._lastModified || 0;
      const merged = mergeSyncData(dataRef.current, parsed, localModified, cloudModified);
      return applyMerged(merged);
    } catch (e) {
      console.warn('Failed to merge cloud doc', e);
      return null;
    }
  }, [applyMerged]);

  const startSubscription = useCallback((uid) => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    if (!uid) return;
    unsubRef.current = subscribe(uid, (cloud) => {
      if (!cloud || !cloud.jsonData) return;
      const cloudModified = cloud.lastModified || 0;
      const localModified = dataRef.current._lastModified || 0;
      // Only merge when cloud has news we haven't seen yet.
      if (cloudModified > localModified) mergeFromCloud(cloud, cloudModified);
      setSyncStatus('connected');
    });
  }, [mergeFromCloud]);

  const migrateSyncCodeIfAny = useCallback(async (uid) => {
    const legacy = localStorage.getItem(SYNC_CODE_KEY);
    if (!legacy) return;
    try {
      const legacyDoc = await pullDoc(legacy);
      if (legacyDoc?.jsonData) {
        const legacyModified = legacyDoc.lastModified || 0;
        mergeFromCloud(legacyDoc, legacyModified);
        const payload = { ...dataRef.current, _lastModified: Date.now() };
        await pushDoc(uid, payload);
      }
    } catch (e) {
      console.warn('sync-code migration failed', e);
    } finally {
      localStorage.removeItem(SYNC_CODE_KEY);
    }
  }, [mergeFromCloud]);

  const onSignedIn = useCallback(async (next) => {
    console.log('[store] onSignedIn', next?.email, next?.uid);
    setUser(next);
    setSyncStatus('syncing');
    await migrateSyncCodeIfAny(next.uid);
    const cloud = await pullDoc(next.uid);
    if (cloud?.jsonData) {
      const merged = mergeFromCloud(cloud, cloud.lastModified || 0);
      // Always push the merged result so both sides converge.
      const payload = { ...(merged || dataRef.current), _lastModified: Date.now() };
      await pushDoc(next.uid, payload);
    } else {
      await pushDoc(next.uid, { ...dataRef.current, _lastModified: Date.now() });
    }
    startSubscription(next.uid);
    setSyncStatus('connected');
  }, [mergeFromCloud, migrateSyncCodeIfAny, startSubscription]);

  useEffect(() => {
    const unsub = onAuthChanged(async (fbUser) => {
      setAuthReady(true);
      const next = pickUser(fbUser);
      if (!next) {
        setUser(null);
        setSyncStatus('offline');
        if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
        return;
      }
      if (userRef.current?.uid === next.uid) { setUser(next); return; }
      await onSignedIn(next);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
      if (unsubRef.current) unsubRef.current();
      clearTimeout(pushTimer.current);
    };
  }, [onSignedIn]);

  const signIn = useCallback(async () => {
    try {
      setSigningIn(true);
      await signInWithGoogle();
    } catch (e) {
      console.warn('Google sign-in failed', e);
      const code = e?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User dismissed the popup — no message needed.
      } else if (code === 'auth/popup-blocked') {
        alert('Sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (code === 'auth/unauthorized-domain') {
        alert('Sign-in failed: this domain is not authorized for Google sign-in.');
      } else if (code === 'auth/network-request-failed') {
        alert('Sign-in failed due to a network error. Please check your connection and try again.');
      } else {
        alert(`Sign-in failed${code ? ` (${code})` : ''}. Please try again.`);
      }
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOutAction = useCallback(async () => {
    clearTimeout(pushTimer.current);
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    await signOutUser();
    // Clear local copy of the previous user's data so the next user of this
    // device doesn't see it. Their cloud copy is untouched.
    const fresh = buildDefaultData();
    fresh._lastModified = Date.now();
    persistToStorage(fresh);
    setData(fresh);
  }, []);

  const forceSync = useCallback(async () => {
    if (!userRef.current) return;
    setSyncStatus('syncing');
    const ok = await pushDoc(userRef.current.uid, { ...dataRef.current, _lastModified: Date.now() });
    setSyncStatus(ok ? 'connected' : 'offline');
  }, []);

  const resetAll = useCallback(() => {
    const fresh = buildDefaultData();
    fresh._lastModified = Date.now();
    persistToStorage(fresh);
    setData(fresh);
    if (userRef.current) pushDoc(userRef.current.uid, fresh);
  }, []);

  const importData = useCallback((raw) => {
    try {
      const parsed = mergeWithDefaults(typeof raw === 'string' ? JSON.parse(raw) : raw);
      parsed._lastModified = Date.now();
      persistToStorage(parsed);
      setData(parsed);
      if (userRef.current) pushDoc(userRef.current.uid, parsed);
      return { ok: true };
    } catch (e) {
      console.warn('Import failed', e);
      return { ok: false, error: e?.message || String(e) };
    }
  }, []);

  const value = useMemo(() => ({
    data,
    update,
    setValue,
    user,
    authReady,
    signingIn,
    signIn,
    signOut: signOutAction,
    syncStatus,
    syncEnabled: !!user,
    forceSync,
    resetAll,
    importData
  }), [data, update, setValue, user, authReady, signingIn, signIn, signOutAction, syncStatus, forceSync, resetAll, importData]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const s = useContext(StoreCtx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}
