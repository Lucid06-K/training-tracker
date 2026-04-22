import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { STORAGE_KEY, SYNC_CODE_KEY, buildDefaultData, mergeWithDefaults } from './defaults.js';
import { pullDoc, pushDoc, subscribe } from './firebase.js';

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

export function StoreProvider({ children }) {
  const [data, setData] = useState(loadFromStorage);
  const [syncCode, setSyncCode] = useState(() => localStorage.getItem(SYNC_CODE_KEY) || '');
  const [syncStatus, setSyncStatus] = useState(syncCode ? 'syncing' : 'offline');
  const dataRef = useRef(data);
  const syncCodeRef = useRef(syncCode);
  const pushTimer = useRef(null);
  const unsubRef = useRef(null);

  useEffect(() => { dataRef.current = data; }, [data]);
  useEffect(() => { syncCodeRef.current = syncCode; }, [syncCode]);

  const persist = useCallback((next) => {
    persistToStorage(next);
    if (syncCodeRef.current) {
      clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(async () => {
        setSyncStatus('syncing');
        const payload = { ...dataRef.current, _lastModified: Date.now() };
        const ok = await pushDoc(syncCodeRef.current, payload);
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

  const subscribeToCode = useCallback((code) => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    if (!code) return;
    unsubRef.current = subscribe(code, (cloud) => {
      if (!cloud || !cloud.jsonData) return;
      try {
        const parsed = JSON.parse(cloud.jsonData);
        const cloudModified = cloud.lastModified || 0;
        const localModified = dataRef.current._lastModified || 0;
        if (cloudModified > localModified) {
          const merged = mergeWithDefaults(parsed);
          merged._lastModified = cloudModified;
          persistToStorage(merged);
          setData(merged);
        }
        setSyncStatus('connected');
      } catch (e) {
        console.warn('Failed to process cloud update', e);
      }
    });
  }, []);

  const enableSync = useCallback(async (rawCode) => {
    const code = String(rawCode || '').trim().toLowerCase();
    if (!code || code.length < 4) return false;
    localStorage.setItem(SYNC_CODE_KEY, code);
    setSyncCode(code);
    setSyncStatus('syncing');
    const cloud = await pullDoc(code);
    if (cloud && cloud.jsonData) {
      const cloudModified = cloud.lastModified || 0;
      const localModified = dataRef.current._lastModified || 0;
      if (cloudModified > localModified) {
        try {
          const parsed = mergeWithDefaults(JSON.parse(cloud.jsonData));
          parsed._lastModified = cloudModified;
          persistToStorage(parsed);
          setData(parsed);
        } catch {}
      } else {
        await pushDoc(code, { ...dataRef.current, _lastModified: Date.now() });
      }
    } else {
      await pushDoc(code, { ...dataRef.current, _lastModified: Date.now() });
    }
    subscribeToCode(code);
    setSyncStatus('connected');
    return true;
  }, [subscribeToCode]);

  const disableSync = useCallback(() => {
    localStorage.removeItem(SYNC_CODE_KEY);
    setSyncCode('');
    setSyncStatus('offline');
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
  }, []);

  const forceSync = useCallback(async () => {
    if (!syncCodeRef.current) return;
    setSyncStatus('syncing');
    const ok = await pushDoc(syncCodeRef.current, { ...dataRef.current, _lastModified: Date.now() });
    setSyncStatus(ok ? 'connected' : 'offline');
  }, []);

  const resetAll = useCallback(() => {
    const fresh = buildDefaultData();
    persistToStorage(fresh);
    setData(fresh);
    if (syncCodeRef.current) pushDoc(syncCodeRef.current, { ...fresh, _lastModified: Date.now() });
  }, []);

  const importData = useCallback((raw) => {
    try {
      const parsed = mergeWithDefaults(typeof raw === 'string' ? JSON.parse(raw) : raw);
      parsed._lastModified = Date.now();
      persistToStorage(parsed);
      setData(parsed);
      if (syncCodeRef.current) pushDoc(syncCodeRef.current, parsed);
      return true;
    } catch (e) {
      console.warn('Import failed', e);
      return false;
    }
  }, []);

  useEffect(() => {
    if (syncCode) enableSync(syncCode);
    return () => {
      if (unsubRef.current) unsubRef.current();
      clearTimeout(pushTimer.current);
    };
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({
    data,
    update,
    setValue,
    syncStatus,
    syncCode,
    syncEnabled: !!syncCode,
    enableSync,
    disableSync,
    forceSync,
    resetAll,
    importData
  }), [data, update, setValue, syncStatus, syncCode, enableSync, disableSync, forceSync, resetAll, importData]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const s = useContext(StoreCtx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}
