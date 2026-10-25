import { createContext, useContext, useCallback } from 'react';
import { useUiStore } from '../store/simStore.ts';

const Ctx = createContext<{ push: (m: string) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = useUiStore((s) => s.toast);
  const pushToast = useUiStore((s) => s.pushToast);
  const clear = useUiStore((s) => s.clearToast);
  const push = useCallback((m: string) => pushToast(m), [pushToast]);
  return (
    <Ctx.Provider value={{ push }}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          onClick={clear}
          style={{
            position: 'fixed', left: '50%', bottom: 62, transform: 'translateX(-50%)',
            background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)',
            padding: '8px 14px', borderRadius: 10, fontFamily: 'ui-monospace, monospace',
            fontSize: 12, boxShadow: '0 0 14px var(--accent-primary-glow)', zIndex: 80, cursor: 'pointer',
          }}
        >
          {toast}
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useToast() {
  const v = useContext(Ctx);
  if (!v) return { push: (m: string) => useUiStore.getState().pushToast(m) };
  return v;
}
