import { Flame } from "lucide-react";

/**
 * Highlights the user's current activity streak and personal best.
 */
export default function DashboardStreakCard({ gamification }) {
  const currentStreak = gamification?.currentStreak ?? 0;
  const longestStreak = gamification?.longestStreak ?? 0;
  const message = gamification?.streakMessage || "Complete a workout today to start a streak.";

  return (
    <div className="bg-[#0E0E0E] p-6 rounded-sm border border-neutral-800/80 shadow-2xl flex flex-col justify-between space-y-4 hover:border-emerald-500/20 transition-all duration-300 relative overflow-hidden group">
      <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-full blur-xl group-hover:from-emerald-400/10 transition-all" />

      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">
            Wellness Momentum
          </span>
          <h3 className="text-base font-serif font-bold text-white mt-0.5 italic">
            Daily Activity Streak
          </h3>
        </div>
        <div
          className={`h-10 w-10 rounded-sm border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${
            currentStreak > 0
              ? "text-amber-500 bg-amber-950/10 border-amber-900/30"
              : "text-emerald-400 bg-neutral-900 border-neutral-800"
          }`}
        >
          <Flame className="h-5 w-5 fill-current" aria-hidden="true" />
        </div>
      </div>

      <div className="space-y-1 pt-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-serif italic font-black text-white">{currentStreak}</span>
          <span className="text-xs text-neutral-400 font-mono uppercase font-semibold">
            consecutive days
          </span>
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed">{message}</p>
      </div>

      <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[11px] font-mono">
        <span className="text-neutral-500 font-semibold uppercase">Personal Best</span>
        <span className="text-white font-extrabold">{longestStreak} Days</span>
      </div>
    </div>
  );
}
