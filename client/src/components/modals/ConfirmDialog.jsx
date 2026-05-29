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
      className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={onCancel}
    >
      <div
        className="bg-[#0E0E0E] w-full max-w-sm rounded-sm border border-neutral-800 p-6 space-y-5 shadow-2xl animate-slide-up"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span
            className={`h-9 w-9 rounded-sm flex items-center justify-center shrink-0 border ${destructive ? "bg-red-950/30 border-red-900/40 text-red-300" : "bg-white/5 border-white/10 text-emerald-400"}`}
          >
            <AlertTriangle className="h-4.5 w-4.5" />
          </span>
          <div className="space-y-1">
            <h3
              id="confirm-dialog-title"
              className="text-sm font-serif italic text-white font-bold"
            >
              {title}
            </h3>
            {message && <p className="text-xs text-white/50 leading-relaxed">{message}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white rounded-sm border border-white/10 hover:bg-white/5 transition-all cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmRef}
            onClick={onConfirm}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-sm transition-all cursor-pointer ${destructive ? "bg-red-500 hover:bg-red-400 text-white" : "bg-white hover:bg-neutral-200 text-black"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
