import { Flame } from "lucide-react";

/**
 * Highlights the user's current activity streak and personal best.
 */
export default function DashboardStreakCard({ gamification }) {
  const currentStreak = gamification?.currentStreak ?? 0;
  const longestStreak = gamification?.longestStreak ?? 0;
  const message = gamification?.streakMessage || "Complete a workout today to start a streak.";

  return (
    <div className="bg-surface p-3 rounded-sm border border-border flex flex-col justify-between gap-3">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[9px] font-mono font-bold text-muted uppercase tracking-widest">
            Daily streak
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-mono tabular-nums font-semibold text-accent leading-none">
              {currentStreak}
            </span>
            <span className="text-[10px] text-muted font-mono uppercase font-semibold">
              days
            </span>
          </div>
        </div>
        <div
          className={`h-8 w-8 rounded-sm border flex items-center justify-center ${
            currentStreak > 0
              ? "text-accent bg-accent/10 border-accent/30"
              : "text-muted bg-bg border-border"
          }`}
        >
          <Flame className="h-5 w-5 fill-current" aria-hidden="true" />
        </div>
      </div>

      <p className="text-xs text-muted leading-relaxed">{message}</p>

      <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] font-mono">
        <span className="text-muted font-semibold uppercase">Personal best</span>
        <span className="font-mono tabular-nums text-text font-semibold">{longestStreak} days</span>
      </div>
    </div>
  );
}
