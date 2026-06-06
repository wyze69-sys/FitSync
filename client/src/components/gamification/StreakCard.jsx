import { Flame } from "lucide-react";

function getStreakClass(current) {
  const streak = Number(current || 0);
  if (streak >= 30) return "text-amber-400 streak-gold-glow";
  if (streak >= 14) return "text-purple-500";
  if (streak >= 7) return "text-red-500 animate-pulse";
  if (streak >= 3) return "text-orange-500";
  if (streak >= 1) return "text-orange-400";
  return "text-gray-400";
}

export default function StreakCard({ current = 0, longest = 0 }) {
  const active = Number(current || 0) > 0;
  const tierClass = getStreakClass(current);

  return (
    <article className="rounded-3xl border border-border bg-surface p-5 shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-streak">Commit Streak</p>
          <p className={`mt-2 text-3xl font-semibold ${tierClass}`}>{Number(current || 0)} days</p>
          <p className="mt-1 text-xs text-muted">Longest {Number(longest || 0)} days</p>
        </div>
        <span className={`rounded-2xl bg-streak/10 p-4 ${tierClass} ${active ? "animate-flame-pulse" : ""}`} aria-label="streak flame">
          <Flame className="size-6" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}
