import { createContext, useContext, useState } from 'react';

const StoreCtx = createContext(null);

export function StoreProvider({ children }) {
  const [state] = useState({ ready: false });
  return <StoreCtx.Provider value={state}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const s = useContext(StoreCtx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}
