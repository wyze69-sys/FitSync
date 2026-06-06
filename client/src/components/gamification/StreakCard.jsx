import { Flame } from "lucide-react";

export default function StreakCard({ current = 0, longest = 0, increased = false }) {
  return (
    <article className="rounded-3xl bg-surface border border-border p-5 shadow-lg shadow-black/10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-streak">Commit Streak</p>
          <p className="mt-2 text-3xl font-semibold text-text">{current} days</p>
          <p className="mt-1 text-xs text-muted">Longest {longest} days</p>
        </div>
        <span className={`rounded-2xl bg-streak/10 p-4 text-streak ${increased ? "animate-flame-pop" : "animate-bounce-subtle"}`} aria-label="streak flame">
          <Flame className="size-5 text-streak" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}
