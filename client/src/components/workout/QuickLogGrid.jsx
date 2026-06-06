import { WORKOUT_MAP } from "../../utils/constants.js";

export default function QuickLogGrid({ categories = WORKOUT_MAP, selectedSlug, onSelect }) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Quick workout categories">
      {categories.map((category) => {
        const active = selectedSlug === category.slug;
        return (
          <button
            type="button"
            key={category.slug}
            onClick={() => onSelect(category)}
            aria-pressed={active}
            aria-label={`Choose ${category.name}`}
            className={`min-h-[44px] min-w-[44px] rounded-2xl border p-4 text-left shadow-lg shadow-black/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              active ? "border-primary bg-primary/15" : "border-border bg-surface hover:border-primary/60"
            }`}
          >
            <span className="text-2xl" aria-hidden="true">{category.icon}</span>
            <span className="mt-3 block text-sm font-semibold text-text">{category.name}</span>
            <span className="mt-1 block text-[11px] leading-snug text-muted">{category.subtypes.length} quick picks</span>
          </button>
        );
      })}
    </section>
  );
}
