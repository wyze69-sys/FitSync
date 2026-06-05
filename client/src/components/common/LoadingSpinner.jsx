export default function LoadingSpinner({ label = "Loading" }) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-2xl border border-border bg-surface" role="status" aria-live="polite">
      <span className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-emerald-500" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
