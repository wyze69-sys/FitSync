import { createContext, useContext, useState, useCallback, useRef } from "react";
import { Flame, Trophy, Check, Zap } from "lucide-react";

const ToastContext = createContext(null);

const TOAST_META = {
  streak: { label: "Streak", border: "rgba(245, 158, 11, 0.4)" },
  milestone: { label: "Badge unlocked", border: "rgba(234, 179, 8, 0.4)" },
  info: { label: "Notice", border: "#2A2E37" },
  success: { label: "Success", border: "#C7FF41" }
};

function ToastIcon({ type }) {
  if (type === "streak") {
    return (
      <span className="h-9 w-9 bg-amber-950/20 text-amber-500 rounded-sm flex items-center justify-center border border-amber-900/40">
        <Flame className="h-5 w-5 fill-current" />
      </span>
    );
  }
  if (type === "milestone") {
    return (
      <span className="h-9 w-9 bg-yellow-950/20 text-yellow-500 rounded-sm flex items-center justify-center border border-yellow-900/40">
        <Trophy className="h-5 w-5 fill-current" />
      </span>
    );
  }
  if (type === "info") {
    return (
      <span className="h-9 w-9 bg-bg text-muted rounded-sm flex items-center justify-center border border-border">
        <Zap className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="h-9 w-9 bg-accent/10 text-accent rounded-sm flex items-center justify-center border border-accent/30">
      <Check className="h-5 w-5 stroke-[3]" />
    </span>
  );
}

/**
 * ToastProvider renders a fixed toast viewport and exposes `useToast()` so any
 * component can surface feedback without prop drilling.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const push = useCallback(
    (message, type = "success") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((current) => [...current, { id, message, type }]);
      timers.current[id] = setTimeout(() => dismiss(id), 5000);
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      <div
        className="fixed top-6 right-6 z-[60] flex flex-col gap-3"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="animate-slide-in flex items-center gap-3.5 px-4 py-3.5 rounded-sm border bg-surface max-w-sm"
            style={{ borderColor: (TOAST_META[toast.type] || TOAST_META.success).border }}
          >
            <ToastIcon type={toast.type} />
            <div>
              <h4 className="text-[10px] uppercase font-mono tracking-widest text-muted font-semibold">
                {(TOAST_META[toast.type] || TOAST_META.success).label}
              </h4>
              <p className="text-xs text-text font-sans font-medium mt-0.5 leading-tight">
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="ml-1 text-muted hover:text-text transition-colors cursor-pointer text-xs"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export default ToastContext;
