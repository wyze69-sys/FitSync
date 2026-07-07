import { Dumbbell, Activity, Zap, Compass, Sparkles, Trophy } from "lucide-react";
import { WORKOUT_MAP } from "../../utils/constants.js";

const CATEGORY_ICONS = {
  cardio: Activity,
  strength: Dumbbell,
  hiit: Zap,
  yoga: Compass,
  mobility: Sparkles,
  sports: Trophy
};

export default function QuickLogGrid({ categories = WORKOUT_MAP, selectedSlug, onSelect }) {
  return (
    <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6" aria-label="Quick workout categories">
      {categories.map((category) => {
        const active = selectedSlug === category.slug;
        const IconComponent = CATEGORY_ICONS[category.slug] || Activity;
        return (
          <button
            type="button"
            key={category.slug}
            onClick={() => onSelect(category)}
            aria-pressed={active}
            aria-label={`Choose ${category.name}`}
            className={`group relative flex flex-col items-center justify-center rounded-2xl border p-5 text-center transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              active 
                ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/5" 
                : "border-border bg-surface text-secondary hover:border-primary/50 hover:bg-surface/80 hover:shadow-sm"
            }`}
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200 ${
              active ? "bg-primary text-white" : "bg-bg text-secondary group-hover:bg-bg/80"
            }`}>
              <IconComponent className="h-5 w-5" aria-hidden="true" />
            </div>
            
            <span className={`mt-3 block text-sm font-semibold tracking-tight ${
              active ? "text-primary font-bold" : "text-text"
            }`}>
              {category.name}
            </span>
            
            {category.subtypes && (
              <span className={`mt-1.5 block text-[10px] font-semibold tracking-wider uppercase ${
                active ? "text-primary/70" : "text-muted"
              }`}>
                {category.subtypes.length} options
              </span>
            )}
          </button>
        );
      })}
    </section>
  );
}

