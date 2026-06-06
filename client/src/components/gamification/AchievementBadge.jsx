import { Code2 } from "lucide-react";

export default function AchievementBadge({ badge }) {
  const unlocked = Boolean(badge?.isUnlocked || badge?.unlockedAt);
  return (
    <article className={`animate-badge-pop rounded-3xl bg-surface border border-border p-6 shadow-lg shadow-black/10 ${unlocked ? "" : "opacity-70"}`}>
      <Code2 className={unlocked ? "size-5 text-primary" : "size-5 text-muted"} aria-hidden="true" />
      <h3 className="mt-3 text-sm font-semibold text-text">{badge?.name || "Achievement"}</h3>
      <p className="mt-1 text-xs text-muted">{badge?.description || "Keep training to unlock this badge."}</p>
    </article>
  );
}
