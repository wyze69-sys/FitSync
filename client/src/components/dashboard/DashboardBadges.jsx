import { BadgeMedal } from "../gamification/AchievementBadge.jsx";

/**
 * Human-readable requirement label for a badge. The backend sends the
 * requirement *type* in `requirement` and the threshold in `value`.
 */
function requirementLabel(badge) {
  const type = String(badge.requirement || "").toLowerCase();
  const value = badge.value;
  if (type === "streak") return value ? `${value}-day streak` : "Streak";
  if (type === "level") return value ? `Level ${value}` : "Level reward";
  if (type === "workout") return value ? `${value} workouts` : "Workouts";
  if (!type) return null;
  return value ? `${type} • ${value}` : type;
}

/**
 * Achievement (badge) wall. Badges come from the backend so unlock state
 * persists across devices. Earned badges are highlighted; locked badges are
 * clearly dimmed with a lock overlay. No fake records are created here.
 */
export default function DashboardBadges({ badges = [] }) {
  const ordered = [...badges].sort(
    (a, b) => Number(Boolean(b.isUnlocked)) - Number(Boolean(a.isUnlocked))
  );
  const earnedCount = badges.filter((b) => b.isUnlocked).length;

  return (
    <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="text-left">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted">
            Collectible Milestones
          </span>
          <h3 className="mt-0.5 text-base font-bold text-text">Achievements</h3>
        </div>
        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-primary border border-primary/20 bg-primary/10 px-2 py-0.5 rounded">
          MIL · {earnedCount}/{badges.length}
        </span>
      </div>

      {ordered.length === 0 ? (
        <p className="py-8 text-center text-xs text-secondary font-medium">
          No achievements yet — log workouts to start your collection.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {ordered.map((badge) => {
            const locked = badge.isUnlocked === false;
            const reqLabel = requirementLabel(badge);
            return (
              <div
                key={badge.code || badge.name}
                className={`flex flex-col items-center rounded-2xl border p-3 text-center transition-all duration-300 ${
                  locked
                    ? "border-border bg-bg/25 opacity-60"
                    : "border-border hover:border-primary/30 bg-surface shadow-sm hover:-translate-y-0.5 hover:shadow-md"
                }`}
              >
                <BadgeMedal badge={badge} size="md" locked={locked} showLevel={false} />
                <h4 className="mt-2.5 text-xs font-bold leading-tight text-text line-clamp-2">
                  {badge.name}
                </h4>
                {reqLabel && (
                  <span className="mt-1.5 rounded-full bg-bg border border-border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-secondary">
                    {reqLabel}
                  </span>
                )}
                <span
                  className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    locked ? "bg-bg text-muted" : "bg-primary/10 border border-primary/20 text-primary"
                  }`}
                >
                  {locked ? "Locked" : "Earned"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
