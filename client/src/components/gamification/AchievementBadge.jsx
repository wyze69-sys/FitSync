import getBadgeAsset, { getBadgeFallback, tierFromLevel } from "../../utils/badgeAssets.js";

/**
 * Legacy tier helper kept for backwards compatibility with existing callers.
 * Levels 1-2 → bronze, 3-4 → silver, 5-7 → gold, 8-10 → platinum, 11+ → legendary.
 */
export function getRankTier(level) {
  const numericLevel = Number(level || 0);
  if (numericLevel >= 11) return "legendary";
  if (numericLevel >= 8) return "platinum";
  if (numericLevel >= 5) return "gold";
  if (numericLevel >= 3) return "silver";
  return "bronze";
}

const SIZE_CLASSES = {
  sm: "h-16 w-16",
  md: "h-24 w-24",
  lg: "h-28 w-28",
  xl: "h-36 w-36"
};

const LEVEL_CHIP_CLASSES = {
  sm: "h-5 min-w-5 text-[10px] -bottom-1",
  md: "h-6 min-w-6 text-xs -bottom-1",
  lg: "h-7 min-w-7 text-sm -bottom-1.5",
  xl: "h-8 min-w-8 text-base -bottom-2"
};

/**
 * Lock overlay used for locked badge states.
 */
function LockEmblem({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/**
 * Renders XP-level image art when available and a compact emblem otherwise.
 */
export function BadgeMedal({ badge, level, title, size = "md", locked = false, showLevel = true }) {
  const source = badge ?? (level !== undefined ? { level, name: title } : null);
  const src = getBadgeAsset(source);
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const chipClass = LEVEL_CHIP_CLASSES[size] || LEVEL_CHIP_CLASSES.md;
  const displayLevel = level ?? badge?.level_number ?? badge?.level;
  const hasLevel = showLevel && displayLevel !== undefined && displayLevel !== null;

  return (
    <div className={`relative mx-auto shrink-0 ${sizeClass}`}>
      {src ? (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          draggable="false"
          className={`h-full w-full select-none object-contain transition-all duration-300 ${
            locked
              ? "grayscale opacity-30"
              : "drop-shadow-[0_4px_10px_rgba(0,0,0,0.28)]"
          }`}
        />
      ) : (
        <span
          aria-hidden="true"
          className={`grid h-full w-full place-items-center rounded-full border border-border bg-bg font-mono text-lg font-bold tracking-wider text-primary transition-all duration-300 ${
            locked ? "opacity-30 grayscale" : "shadow-sm"
          }`}
        >
          {getBadgeFallback(source)}
        </span>
      )}
      {locked && (
        <span className="absolute inset-0 grid place-items-center">
          <LockEmblem className="h-6 w-6 text-muted/60" aria-hidden="true" />
        </span>
      )}
      {!locked && hasLevel && (
        <span
          className={`absolute left-1/2 -translate-x-1/2 grid place-items-center rounded-full border border-white/70 bg-gray-900/85 px-1.5 font-black tabular-nums text-white shadow-md ${chipClass}`}
        >
          {displayLevel}
        </span>
      )}
    </div>
  );
}

/**
 * Level/rank medal used by the XP progress bar and the level-up celebration.
 * Tier (and therefore the art) is derived from the level number.
 */
export function RankMedal({ level, title, size = "md" }) {
  return <BadgeMedal level={level} title={title} size={size} />;
}

/**
 * Renders a single achievement badge as a collectible card.
 * Art and locked/earned state are derived from the badge object itself.
 * Never pass the user's current level as a prop — each badge has its own art.
 */
export default function AchievementBadge({ title, size = "md", badge }) {
  const badgeLevel = badge?.level_number ?? badge?.level;
  const hasLevel = badgeLevel !== undefined && badgeLevel !== null;
  const displayTitle = badge?.name || title || "Starter";
  // When isUnlocked is explicitly false the badge is locked; otherwise treat as earned.
  const locked = badge?.isUnlocked === false;
  const hasProgress =
    badge &&
    typeof badge.value === "number" &&
    !Number.isNaN(badge.value) &&
    typeof badge.requirement === "number" &&
    !Number.isNaN(badge.requirement);

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border p-5 text-center transition-all duration-300 ${
        locked
          ? "border-border bg-bg/25 opacity-60 shadow-inner"
          : "animate-badge-pop border-border hover:border-primary/30 bg-surface shadow-sm hover:-translate-y-0.5 hover:shadow-md"
      }`}
      aria-label={`${displayTitle}${hasLevel ? `, level ${badgeLevel}` : ""}${locked ? ", locked" : ", earned"}`}
    >
      <div className="relative">
        <BadgeMedal badge={badge} title={displayTitle} size={size} locked={locked} />
      </div>
      {hasLevel && (
        <h3 className="mt-4 text-sm font-bold text-text">Level {badgeLevel}</h3>
      )}
      <p className={`mt-2 text-xs font-semibold uppercase tracking-widest ${locked ? "text-muted" : "text-primary"}`}>
        {displayTitle}
      </p>
      {badge?.description && <p className="mt-1.5 text-xs leading-relaxed text-secondary font-medium">{badge.description}</p>}
      {hasProgress && (
        <p className="mt-2 inline-block rounded-full bg-bg border border-border px-2 py-0.5 text-xs font-mono text-secondary font-medium">
          {badge.value}/{badge.requirement}
        </p>
      )}
      <span
        className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
          locked ? "bg-bg text-muted" : "bg-primary/10 border border-primary/20 text-primary"
        }`}
      >
        {locked ? "Locked" : "Earned"}
      </span>
    </article>
  );
}
