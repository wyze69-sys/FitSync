export default function SubtypePicker({ category, selectedSubtype, onSelect, onClose }) {
  if (!category) return null;
  return (
    <section className="animate-slide-up rounded-2xl border border-border bg-surface p-4 shadow-xl shadow-black/20" aria-label={`${category.name} subtypes`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Step 2</p>
          <h2 className="text-lg font-semibold text-text">Pick {category.name}</h2>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-xs text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            Close
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {category.subtypes.map((subtype) => {
          const active = selectedSubtype?.slug === subtype.slug;
          return (
            <button
              type="button"
              key={subtype.slug}
              onClick={() => onSelect(subtype)}
              aria-pressed={active}
              className={`min-h-[44px] min-w-[44px] rounded-2xl border px-3 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                active ? "border-primary bg-primary text-white" : "border-border bg-bg text-text hover:border-primary/60"
              }`}
            >
              {subtype.name}
            </button>
          );
        })}
      </div>
    </section>
  );
}
