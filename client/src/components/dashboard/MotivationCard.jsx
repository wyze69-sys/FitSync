import { Check, Flame, Sparkle, Trophy } from "lucide-react";
import { todayStr } from "../../utils/workoutUtils.js";

/**
 * Beginner-friendly motivation summary. It reuses the backend gamification
 * summary/check-in flow while presenting streak, daily check-in, and top badges
 * as one simple home card.
 */
export default function MotivationCard({ gamification, onCheckin, busy }) {
  const currentStreak = gamification?.currentStreak ?? 0;
  const longestStreak = gamification?.longestStreak ?? 0;
  const checkedInToday = gamification?.lastActiveDate === todayStr();
  const badges = (gamification?.badges || [])
    .filter((badge) => badge.isUnlocked)
    .slice(0, 3);

  return (
    <div className="bg-surface border border-border rounded-sm p-5 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">
            Today&apos;s motivation
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-5xl font-mono tabular-nums font-semibold text-accent leading-none">
              {currentStreak}
            </span>
            <span className="text-xs text-muted font-mono uppercase font-semibold">day streak</span>
          </div>
        </div>
        <div
          className={`h-10 w-10 rounded-sm border flex items-center justify-center ${
            currentStreak > 0
              ? "text-accent bg-accent/10 border-accent/30"
              : "text-muted bg-bg border-border"
          }`}
        >
          <Flame className="h-6 w-6 fill-current" aria-hidden="true" />
        </div>
      </div>

      <p className="text-xs text-muted leading-relaxed">
        {gamification?.streakMessage || "Log a workout or check in today to start your streak."}
      </p>

      <button
        type="button"
        disabled={busy || checkedInToday}
        onClick={() => onCheckin("Daily check-in")}
        className={`w-full py-2.5 px-3 rounded-sm border text-xs font-medium uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
          checkedInToday
            ? "bg-accent/10 border-accent/30 text-accent cursor-default"
            : "bg-accent border-accent text-black cursor-pointer hover:opacity-90"
        } disabled:opacity-70`}
      >
        {checkedInToday ? <Check className="h-4 w-4" /> : <Sparkle className="h-4 w-4" />}
        {checkedInToday ? "Checked in today" : "Daily check-in"}
      </button>

      <div className="pt-4 border-t border-border space-y-3">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted">
          <span>Top badges</span>
          <span className="tabular-nums">Best {longestStreak}d</span>
        </div>
        {badges.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {badges.map((badge) => (
              <div
                key={badge.code}
                className="p-3 rounded-sm border border-accent/30 bg-accent/5 min-h-20"
              >
                <Trophy className="h-4 w-4 text-accent mb-2" aria-hidden="true" />
                <div className="text-[11px] font-semibold text-text leading-tight">{badge.name}</div>
                <div className="text-[9px] text-muted line-clamp-2 mt-1">{badge.description}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-sm border border-border bg-bg text-xs text-muted">
            Badges will appear here after your first milestones.
          </div>
        )}
      </div>
    </div>
  );
}
