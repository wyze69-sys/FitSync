import { useId } from "react";

function getRankTier(level) {
  const numericLevel = Number(level || 1);
  if (numericLevel >= 11) return "legendary";
  if (numericLevel >= 8) return "platinum";
  if (numericLevel >= 5) return "gold";
  if (numericLevel >= 3) return "silver"; // levels 3-4 → silver
  return "bronze"; // levels 1-2 → bronze
}

const SIZE_CLASSES = {
  sm: "h-14 w-14 text-sm",
  md: "h-20 w-20 text-lg",
  lg: "h-28 w-28 text-2xl",
  xl: "h-36 w-36 text-4xl"
};

/**
 * Renders a single achievement badge.
 * Level and tier are derived exclusively from the badge object.
 * Never pass the user's current level as a prop — each badge has its own level.
 */
export default function AchievementBadge({ title, size = "md", badge }) {
  // Use badge-specific level only — never the user's current level.
  const displayLevel = Number(badge?.level_number || badge?.level || 1);
  const displayTitle = badge?.name || title || "Starter";
  const tier = getRankTier(displayLevel);
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const gradientId = useId();

  return (
    <article className="animate-badge-pop rounded-3xl border border-border bg-surface p-5 text-center shadow-md" aria-label={`${displayTitle}, level ${displayLevel}`}>
      <div className={`rank-medal rank-medal-${tier} ${sizeClass} mx-auto`}>
        <svg viewBox="0 0 100 118" className="h-full w-full" aria-hidden="true" role="img">
          <defs>
            <linearGradient id={`${gradientId}-bronze`} x1="15%" x2="85%" y1="15%" y2="85%">
              <stop offset="0%" stopColor="#CD7F32" />
              <stop offset="100%" stopColor="#A05A2C" />
            </linearGradient>
            <linearGradient id={`${gradientId}-silver`} x1="15%" x2="85%" y1="15%" y2="85%">
              <stop offset="0%" stopColor="#E8E8E8" />
              <stop offset="100%" stopColor="#A8A9AD" />
            </linearGradient>
            <linearGradient id={`${gradientId}-gold`} x1="15%" x2="85%" y1="15%" y2="85%">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#D4AF37" />
            </linearGradient>
            <linearGradient id={`${gradientId}-platinum`} x1="15%" x2="85%" y1="15%" y2="85%">
              <stop offset="0%" stopColor="#F0F4F8" />
              <stop offset="100%" stopColor="#B0B8C1" />
            </linearGradient>
          </defs>
          <path className="rank-ribbon-left" d="M33 70 L18 116 L50 98 Z" />
          <path className="rank-ribbon-right" d="M67 70 L82 116 L50 98 Z" />
          <circle
            className="rank-medal-ring"
            cx="50" cy="48" r="42"
            fill={
              tier === "bronze" ? `url(#${gradientId}-bronze)` :
              tier === "silver" ? `url(#${gradientId}-silver)` :
              tier === "gold"   ? `url(#${gradientId}-gold)` :
              tier === "platinum" ? `url(#${gradientId}-platinum)` :
              undefined
            }
          />
          <circle className="rank-medal-face" cx="50" cy="48" r="33" />
          <path className="rank-medal-spark" d="M50 20 L56 39 L76 39 L60 51 L66 70 L50 58 L34 70 L40 51 L24 39 L44 39 Z" />
        </svg>
        <span className="rank-medal-level">{displayLevel}</span>
      </div>
      <h3 className="mt-4 text-sm font-bold text-text">Level {displayLevel}</h3>
      <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-primary">{displayTitle}</p>
      {badge?.description && <p className="mt-2 text-xs text-muted">{badge.description}</p>}
    </article>
  );
}
