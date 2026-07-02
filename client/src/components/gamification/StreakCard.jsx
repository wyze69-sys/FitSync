function getStreakClass(current) {
  const streak = Number(current || 0);
  if (streak >= 30) return "text-amber-400";
  if (streak >= 14) return "text-purple-400";
  if (streak >= 7) return "text-red-400";
  if (streak >= 3) return "text-orange-400";
  if (streak >= 1) return "text-orange-400";
  return "text-secondary";
}

export default function StreakCard({ current = 0, longest = 0 }) {
  const active = Number(current || 0) > 0;
  const tierClass = getStreakClass(current);

  return (
    <article className="rounded-3xl border border-border bg-surface p-5 shadow-sm text-left">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted">Commit Streak</p>
          <p className={`mt-2 text-3xl font-mono font-bold tracking-tight ${tierClass}`}>{Number(current || 0)} days</p>
          <p className="mt-1 text-xs text-secondary">Longest {Number(longest || 0)} days</p>
        </div>
        <span className={`inline-flex items-center justify-center rounded-xl border border-border bg-bg/60 px-3 py-1.5 font-mono text-xs font-bold tracking-widest ${active ? "text-streak" : "text-muted"}`} aria-label="streak badge">
          STK
        </span>
      </div>
    </article>
  );
}
