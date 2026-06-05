export default function PreviewPill({ calories = 0, xp = 0 }) {
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200" aria-live="polite">
      Est. ~{Number(calories || 0)} cal • +{Number(xp || 0)} XP
    </span>
  );
}
