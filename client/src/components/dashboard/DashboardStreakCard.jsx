/**
 * Highlights the user's current activity streak and personal best.
 */
export default function DashboardStreakCard({ gamification }) {
  const currentStreak = gamification?.currentStreak ?? 0;
  const longestStreak = gamification?.longestStreak ?? 0;
  const message = gamification?.streakMessage || "Complete a workout today to start a streak.";

  return (
    <div className="bg-surface p-5 rounded-2xl border border-border flex flex-col justify-between gap-3 text-left">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">
            Commit Streak
          </span>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-4xl font-mono tabular-nums font-semibold text-streak leading-none">
              {currentStreak}
            </span>
            <span className="text-[10px] text-secondary font-mono uppercase font-bold">
              days
            </span>
          </div>
        </div>
        <span className={`inline-flex items-center justify-center rounded border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider ${
          currentStreak > 0
            ? "text-streak border-streak/20 bg-streak/10"
            : "text-muted border-border bg-bg"
        }`}>
          STK
        </span>
      </div>

      <p className="text-xs text-secondary leading-relaxed font-medium mt-1">{message}</p>

      <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] font-mono">
        <span className="text-muted font-bold uppercase">Personal best</span>
        <span className="font-mono tabular-nums text-text font-bold">{longestStreak} days</span>
      </div>
    </div>
  );
}
