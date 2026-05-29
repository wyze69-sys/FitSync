import { Trophy, Sparkle } from "lucide-react";

/**
 * Achievement (badge) grid. Badges come from the backend so unlock state
 * persists across devices.
 */
export default function DashboardBadges({ badges = [] }) {
  return (
    <div className="bg-[#0E0E0E] p-6 rounded-sm border border-neutral-800/80 shadow-2xl space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-neutral-900">
        <div>
          <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">
            Gamified Milestones
          </span>
          <h3 className="text-sm font-bold text-white mt-0.5">Achievements</h3>
        </div>
        <Trophy className="h-5 w-5 text-amber-400" aria-hidden="true" />
      </div>

      <div className="grid grid-cols-2 gap-3.5 pt-1.5">
        {badges.map((badge) => (
          <div
            key={badge.code}
            className={`p-3 rounded-sm border flex flex-col justify-between space-y-2 transition-all duration-300 hover:scale-[1.02] ${
              badge.isUnlocked
                ? "border-amber-400/20 bg-amber-950/5 text-amber-200 shadow-md"
                : "border-neutral-900 bg-neutral-950/20 text-neutral-500"
            }`}
          >
            <div className="flex justify-between items-start">
              <span
                className={`text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-full font-bold ${
                  badge.isUnlocked
                    ? "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                    : "bg-neutral-900 text-neutral-500"
                }`}
              >
                {badge.requirement}
              </span>
              <Sparkle
                className={`h-3 w-3 ${badge.isUnlocked ? "text-amber-400" : "text-neutral-800"}`}
                aria-hidden="true"
              />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-white leading-tight font-serif italic">
                {badge.name}
              </h4>
              <p className="text-[9px] text-neutral-400 line-clamp-2 leading-normal">
                {badge.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
