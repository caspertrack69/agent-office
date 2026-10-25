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
            background: '#1a1206', color: '#fdf0c8', border: '1px solid #4a3616',
            padding: '8px 14px', borderRadius: 10, fontFamily: 'ui-monospace, monospace',
            fontSize: 12, boxShadow: '0 10px 28px rgba(0,0,0,0.5)', zIndex: 80, cursor: 'pointer',
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
