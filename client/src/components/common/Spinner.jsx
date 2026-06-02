/**
 * Small inline loading spinner with an optional label.
 */
export default function Spinner({ label = "Loading...", className = "" }) {
  return (
    <div
      className={`flex items-center justify-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className="h-6 w-6 border-2 border-accent border-t-transparent rounded-sm animate-spin" />
      {label && (
        <span className="text-xs font-mono text-muted uppercase tracking-widest">{label}</span>
      )}
    </div>
  );
}
