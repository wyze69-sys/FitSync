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
      className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={onCancel}
    >
      <div
        className="bg-surface w-full max-w-sm rounded-md border border-border shadow-lg p-6 space-y-6 animate-slide-up"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div
            className={`h-10 w-10 rounded-md flex items-center justify-center shrink-0 border ${
              destructive
                ? "bg-red-500/10 border-red-500/20 text-red-500"
                : "bg-primary/10 border-primary/20 text-primary"
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div className="space-y-1.5 pt-0.5">
            <h3
              id="confirm-dialog-title"
              className="text-base text-text font-semibold"
            >
              {title}
            </h3>

            {message && (
              <p className="text-sm text-muted leading-relaxed">{message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted hover:text-text rounded-sm border border-border hover:border-text transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            ref={confirmRef}
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-widest rounded-sm transition-colors cursor-pointer ${
              destructive
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-primary hover:bg-primary-bright text-white"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
