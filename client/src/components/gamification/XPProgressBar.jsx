import { Terminal } from "lucide-react";
import { RankMedal } from "./AchievementBadge.jsx";

export default function XPProgressBar({ totalXp = 0, nextLevelXp = 0, level = 1, title = "Starter", activeBadge }) {
  const previousLevelXp = 0;
  const target = Number(nextLevelXp || totalXp || 1);
  const progress = target <= previousLevelXp ? 100 : Math.min(100, Math.round(((Number(totalXp) - previousLevelXp) / (target - previousLevelXp || 1)) * 100));

  return (
    <section className="rounded-3xl bg-surface border border-border p-6 shadow-lg shadow-black/10" aria-label="XP progress">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left side: XP labels and progress bar */}
        <div className="w-full flex-grow">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-xp">Dev XP · Level {level}</p>
              <h2 className="mt-1 text-lg font-semibold text-text">{title}</h2>
            </div>
            
            {/* Middle/right area: XP numbers */}
            <div className="flex items-center gap-1.5 text-xp mt-1 md:mt-0">
              <Terminal className="size-4 text-xp" aria-hidden="true" />
              <p className="font-mono text-xs text-muted">
                {Number(totalXp).toLocaleString()} / {Number(nextLevelXp || totalXp).toLocaleString()} XP
              </p>
            </div>
          </div>

          <div className="mt-4 h-4 overflow-hidden rounded-full bg-bg" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
            <div 
              className="h-full rounded-full bg-xp" 
              style={{ width: `${progress}%`, transition: "width 800ms cubic-bezier(0.4, 0, 0.2, 1)" }} 
            />
          </div>
        </div>

        {/* Far right: Badge icon/medal and badge name */}
        <div className="flex flex-col items-center justify-center shrink-0 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
          {activeBadge ? (
            <div className="flex flex-col items-center text-center">
              <RankMedal level={level} title={title} size="sm" />
              <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-primary">
                {activeBadge.name} Badge
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center opacity-40">
              {/* Fallback Badge Icon if no badge exists */}
              <div className="rank-medal rank-medal-bronze h-14 w-14 mx-auto relative shrink-0">
                <svg viewBox="0 0 100 118" className="h-full w-full" aria-hidden="true" role="img">
                  <path className="rank-ribbon-left" d="M33 70 L18 116 L50 98 Z" fill="#8B4513" />
                  <path className="rank-ribbon-right" d="M67 70 L82 116 L50 98 Z" fill="#8B4513" />
                  <circle cx="50" cy="48" r="33" fill="#A05A2C" />
                </svg>
              </div>
              <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-muted">
                Level {level}
              </span>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
