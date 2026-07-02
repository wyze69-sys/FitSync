import { RankMedal } from "./AchievementBadge.jsx";

function xpNeededForNextLevel(level) {
  const numericLevel = Number(level || 0);
  return 100 + numericLevel * 75 + numericLevel * numericLevel * 15;
}

function cumulativeXpForLevel(level) {
  const targetLevel = Math.max(1, Number(level || 1));
  let total = 0;
  for (let currentLevel = 1; currentLevel < targetLevel; currentLevel += 1) {
    total += xpNeededForNextLevel(currentLevel);
  }
  return total;
}

export default function XPProgressBar({ totalXp = 0, nextLevelXp = 0, level = 1, title = "Starter", activeBadge }) {
  const currentLevel = Math.max(1, Number(level || 1));
  const currentLevelBase = cumulativeXpForLevel(currentLevel);
  const formulaNextLevelGoal = cumulativeXpForLevel(currentLevel + 1);
  const nextLevelGoal = Number(nextLevelXp || 0) > currentLevelBase ? Number(nextLevelXp) : formulaNextLevelGoal;
  const range = nextLevelGoal - currentLevelBase;
  const progressValue = Number(totalXp || 0) - currentLevelBase;
  const percentage = range > 0 ? Math.min(100, Math.max(0, (progressValue / range) * 100)) : 100;

  return (
    <section className="rounded-3xl bg-surface border border-border p-6 shadow-md" aria-label="XP progress">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left side: XP labels and progress bar */}
        <div className="w-full flex-grow text-left">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-xp">Athlete XP · Level {level}</p>
              <h2 className="mt-1 text-lg font-semibold text-text">{title}</h2>
            </div>
            
            {/* Middle/right area: XP numbers */}
            <div className="flex items-center gap-1.5 text-xp mt-1 md:mt-0 font-mono text-xs">
              <span className="font-mono font-bold text-xp text-[10px] border border-xp/20 bg-xp/10 rounded px-1.5 py-0.5 tracking-wider">
                XP
              </span>
              <p className="text-secondary font-semibold">
                {totalXp} / {nextLevelGoal} XP ({Math.round(percentage)}%)
              </p>
            </div>
          </div>

          <div className="mt-4 h-4 overflow-hidden rounded-full bg-bg" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(percentage)}>
            <div 
              className="h-full rounded-full bg-xp" 
              style={{ width: `${percentage}%`, opacity: 0.8, transition: "width 800ms cubic-bezier(0.4, 0, 0.2, 1)" }} 
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
            <div className="flex flex-col items-center text-center">
              <RankMedal level={level} title={title} size="sm" />
              <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-secondary">
                Level {level}
              </span>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
