import { CheckCircle, X } from "lucide-react";

export default function Toast({ message, onDismiss, type = "success" }) {
  return (
    <div role="status" className="animate-slide-in flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-surface px-4 py-3 shadow-2xl shadow-black/30">
      <CheckCircle className={type === "success" ? "h-5 w-5 text-emerald-400" : "h-5 w-5 text-amber-400"} aria-hidden="true" />
      <p className="text-sm font-medium text-text">{message}</p>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss toast" className="rounded-full p-1 text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
