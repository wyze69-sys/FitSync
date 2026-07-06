import { useEffect, useRef } from "react";
import { LogOut } from "lucide-react";

/**
 * Accessible confirmation dialog for logging out.
 * Supports Escape to cancel and focuses the confirm button on open.
 */
export default function LogoutConfirmDialog({
  open,
  title = "Log Out",
  message = "Are you sure you want to log out of your account?",
  confirmLabel = "Log Out",
  cancelLabel = "Cancel",
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 animate-fade-in"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        className="bg-surface relative w-full max-w-sm rounded-sm border border-border p-6 space-y-5 animate-slide-up shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
      >
        <div className="flex items-start gap-3">
          <span
            className="h-9 w-9 rounded-sm flex items-center justify-center shrink-0 border bg-primary/10 border-primary/30 text-primary"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </span>
          <div className="space-y-1">
            <h3
              id="logout-dialog-title"
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
            className="px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-muted hover:text-text rounded-sm border border-border hover:border-primary transition-all cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmRef}
            onClick={onConfirm}
            className="px-4 py-1.5 text-xs font-medium uppercase tracking-widest rounded-sm transition-all cursor-pointer bg-primary hover:bg-primary/90 text-white"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
