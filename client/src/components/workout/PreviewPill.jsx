export default function PreviewPill({ calories = 0, xp = 0 }) {
  return (
    <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-xp" aria-live="polite">
      Est. ~{Number(calories || 0)} cal • +{Number(xp || 0)} XP
    </span>
  );
}
