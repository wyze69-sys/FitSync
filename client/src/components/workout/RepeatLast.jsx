import { RotateCcw } from "lucide-react";

export default function RepeatLast({ workout, onRepeat }) {
  if (!workout) return null;
  return (
    <button
      type="button"
      onClick={() => onRepeat(workout)}
      aria-label={`Repeat ${workout.subtypeName || workout.categoryName || "last workout"}`}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 text-left shadow-lg shadow-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <span>
        <span className="block text-[10px] font-bold uppercase tracking-widest text-muted">Repeat last</span>
        <span className="mt-1 block text-sm font-semibold text-text">{workout.subtypeName || workout.categoryName}</span>
        <span className="mt-1 block text-xs text-muted">{workout.duration || 30} min</span>
      </span>
      <RotateCcw className="h-5 w-5 text-emerald-400" aria-hidden="true" />
    </button>
  );
}
