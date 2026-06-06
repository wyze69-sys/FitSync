import { Code2, Sparkle } from "lucide-react";

/**
 * Achievement (badge) grid. Badges come from the backend so unlock state
 * persists across devices.
 */
export default function DashboardBadges({ badges = [] }) {
  return (
    <div className="bg-surface p-3 rounded-sm border border-border space-y-3">
      <div className="flex justify-between items-center pb-2 border-b border-border">
        <div>
          <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">
            Gamified Milestones
          </span>
          <h3 className="text-sm font-semibold text-text mt-0.5">Achievements</h3>
        </div>
        <Code2 className="size-5 text-primary" aria-hidden="true" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {badges.map((badge) => (
          <div
            key={badge.code}
            className={`p-3 rounded-sm border flex flex-col justify-between space-y-2 transition-all ${
              badge.isUnlocked
                ? "border-primary/40 bg-primary/5 text-text"
                : "border-border bg-bg/30 text-muted"
            }`}
          >
            <div className="flex justify-between items-start">
              <span
                className={`text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-sm font-bold border ${
                  badge.isUnlocked
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-bg text-muted border-border"
                }`}
              >
                {badge.requirement}
              </span>
              <Sparkle
                className={`h-3 w-3 ${badge.isUnlocked ? "text-primary" : "text-border"}`}
                aria-hidden="true"
              />
            </div>
            <div>
              <h4 className="text-[11px] font-semibold text-text leading-tight">
                {badge.name}
              </h4>
              <p className="text-[9px] text-muted line-clamp-2 leading-normal">
                {badge.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
