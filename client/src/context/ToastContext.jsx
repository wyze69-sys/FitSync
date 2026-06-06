import { createContext, useContext, useState, useCallback, useRef } from "react";
import { Flame, Code2, Check, Terminal } from "lucide-react";

const ToastContext = createContext(null);

const TOAST_META = {
  streak: { label: "Commit Streak", border: "#EF4444" },
  milestone: { label: "Badge unlocked", border: "#777C6D" },
  info: { label: "Notice", border: "#CBCBCB" },
  success: { label: "Success", border: "#22C55E" }
};

function ToastIcon({ type }) {
  if (type === "streak") {
    return (
      <span className="h-9 w-9 bg-streak/10 text-streak rounded-2xl flex items-center justify-center border border-streak/30">
        <Flame className="size-5 text-streak" />
      </span>
    );
  }
  if (type === "milestone") {
    return (
      <span className="h-9 w-9 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/30">
        <Code2 className="size-5 text-primary" />
      </span>
    );
  }
  if (type === "info") {
    return (
      <span className="h-9 w-9 bg-bg text-muted rounded-2xl flex items-center justify-center border border-border">
        <Terminal className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="h-9 w-9 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/30">
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
            className="animate-slide-in flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border bg-surface max-w-sm"
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
