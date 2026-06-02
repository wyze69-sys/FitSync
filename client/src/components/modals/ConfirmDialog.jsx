import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Accessible confirmation dialog used in place of window.confirm.
 * Supports Escape to cancel and focuses the confirm button on open.
 */
export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = true,
  onConfirm,
  onCancel
}) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handleKey(event) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKey);
    confirmRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={onCancel}
    >
      <div
        className="bg-surface w-full max-w-sm rounded-sm border border-border p-6 space-y-5 animate-slide-up"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span
            className={`h-9 w-9 rounded-sm flex items-center justify-center shrink-0 border ${destructive ? "bg-red-950/30 border-red-900/40 text-red-300" : "bg-accent/10 border-accent/30 text-accent"}`}
          >
            <AlertTriangle className="h-4.5 w-4.5" />
          </span>
          <div className="space-y-1">
            <h3
              id="confirm-dialog-title"
              className="text-sm text-text font-semibold"
            >
              {title}
            </h3>
            {message && <p className="text-xs text-muted leading-relaxed">{message}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-muted hover:text-text rounded-sm border border-border hover:border-accent transition-all cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmRef}
            onClick={onConfirm}
            className={`px-4 py-1.5 text-xs font-medium uppercase tracking-widest rounded-sm transition-all cursor-pointer ${destructive ? "bg-red-500 hover:bg-red-400 text-text" : "bg-accent text-black"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
