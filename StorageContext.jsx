import React, { createContext, useContext, useState } from 'react';
import { PROVIDERS, FREQUENT_CONNECTIONS, makeConnections, connectionExtras } from './data.js';

// In-memory store shared by the Storage hub and Provider pages so connection
// counts, auto-connect toggles and add/remove stay coherent across navigation.
// Prototype only — resets on reload (mirrors the main app's SharesContext).
const StorageContext = createContext(null);

function buildInitial() {
  return PROVIDERS.map((p) => ({
    ...p,
    connections: makeConnections(p.id, p.seedCount),
  }));
}

let addCounter = 0;

export function StorageProvider({ children }) {
  const [providers, setProviders] = useState(buildInitial);
  const [frequent, setFrequent] = useState(FREQUENT_CONNECTIONS);

  // No useMemo — the React Compiler memoizes this value from providers/frequent.
  const value = (() => {
    const mutate = (providerId, fn) =>
      setProviders((prev) => prev.map((p) => (p.id === providerId ? fn(p) : p)));

    return {
      providers,
      frequent,
      getProvider: (id) => providers.find((p) => p.id === id) || null,

      addConnection: (providerId, data = {}) =>
        mutate(providerId, (p) => {
          addCounter += 1;
          const conn = {
            id: `${providerId}-new-${Date.now()}-${addCounter}`,
            name: data.name?.trim() || `New-Connection-${p.connections.length + 1}`,
            modified: '—',
            status: 'active',
            autoConnect: data.autoConnect ?? true,
            ...(data.account && { account: data.account }),
            ...connectionExtras(providerId, p.connections.length),
          };
          return { ...p, connections: [...p.connections, conn] };
        }),

      clearLogs: (providerId, connId) =>
        mutate(providerId, (p) => ({
          ...p,
          connections: p.connections.map((c) => (c.id === connId ? { ...c, logs: [] } : c)),
        })),

      removeConnection: (providerId, connId) =>
        mutate(providerId, (p) => ({
          ...p,
          connections: p.connections.filter((c) => c.id !== connId),
        })),

      setConnectionStatus: (providerId, connId, status) =>
        mutate(providerId, (p) => ({
          ...p,
          connections: p.connections.map((c) => (c.id === connId ? { ...c, status } : c)),
        })),

      updateConnection: (providerId, connId, data) =>
        mutate(providerId, (p) => ({
          ...p,
          connections: p.connections.map((c) => (c.id === connId ? { ...c, ...data } : c)),
        })),

      setAutoConnect: (providerId, connId, on) =>
        mutate(providerId, (p) => ({
          ...p,
          connections: p.connections.map((c) => (c.id === connId ? { ...c, autoConnect: on } : c)),
        })),

      setAllAutoConnect: (providerId, on) =>
        mutate(providerId, (p) => ({
          ...p,
          connections: p.connections.map((c) => ({ ...c, autoConnect: on })),
        })),

      removeFrequent: (id) => setFrequent((prev) => prev.filter((c) => c.id !== id)),
    };
  })();

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}

export function useStorage() {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error('useStorage must be used within a StorageProvider');
  return ctx;
}
