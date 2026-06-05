import { Trophy } from "lucide-react";

export default function AchievementBadge({ badge }) {
  const unlocked = Boolean(badge?.isUnlocked || badge?.unlockedAt);
  return (
    <article className={`animate-badge-pop rounded-2xl border p-4 shadow-lg shadow-black/10 ${unlocked ? "border-emerald-500/30 bg-emerald-500/10" : "border-border bg-surface/70 opacity-70"}`}>
      <Trophy className={unlocked ? "h-5 w-5 text-emerald-400" : "h-5 w-5 text-muted"} aria-hidden="true" />
      <h3 className="mt-3 text-sm font-semibold text-text">{badge?.name || "Achievement"}</h3>
      <p className="mt-1 text-xs text-muted">{badge?.description || "Keep training to unlock this badge."}</p>
    </article>
  );
}
