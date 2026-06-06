import { Terminal } from "lucide-react";

export default function XPProgressBar({ totalXp = 0, nextLevelXp = 0, level = 1, title = "Starter" }) {
  const previousLevelXp = 0;
  const target = Number(nextLevelXp || totalXp || 1);
  const progress = target <= previousLevelXp ? 100 : Math.min(100, Math.round(((Number(totalXp) - previousLevelXp) / (target - previousLevelXp || 1)) * 100));

  return (
    <section className="rounded-3xl bg-surface border border-border p-6 shadow-lg shadow-black/10" aria-label="XP progress">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-xp">Dev XP · Level {level}</p>
          <h2 className="mt-1 text-lg font-semibold text-text">{title}</h2>
        </div>
        <div className="flex items-center gap-2 text-xp"><Terminal className="size-5 text-xp" aria-hidden="true" /><p className="font-mono text-xs text-muted">{Number(totalXp).toLocaleString()} / {Number(nextLevelXp || totalXp).toLocaleString()} XP</p></div>
      </div>
      <div className="mt-4 h-4 overflow-hidden rounded-full bg-bg" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
        <div className="h-full rounded-full bg-xp" style={{ width: `${progress}%`, transition: "width 800ms cubic-bezier(0.4, 0, 0.2, 1)" }} />
      </div>
    </section>
  );
}
