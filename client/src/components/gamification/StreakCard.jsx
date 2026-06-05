import { Flame } from "lucide-react";

export default function StreakCard({ current = 0, longest = 0, increased = false }) {
  return (
    <article className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/15 to-surface p-5 shadow-lg shadow-black/10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300">Streak</p>
          <p className="mt-2 text-3xl font-semibold text-text">{current} days</p>
          <p className="mt-1 text-xs text-muted">Longest {longest} days</p>
        </div>
        <span className={`rounded-2xl bg-amber-500/15 p-4 text-amber-300 ${increased ? "animate-flame-pop" : "animate-bounce-subtle"}`} aria-label="streak flame">
          <Flame className="h-9 w-9 fill-current" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}
