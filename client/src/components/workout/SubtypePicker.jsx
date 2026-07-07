import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

// How many activities to surface in the compact "quick picks" view before the
// user searches or explicitly expands the full library.
const COMPACT_COUNT = 5;

// Human-readable, compact label for an activity's tracked fields. Only used
// when the subtype carries real backend metadata (activitySlug + trackingFields);
// the legacy hardcoded subtypes have none and simply show no secondary line.
const FIELD_LABELS = {
  sets: "sets",
  weight: "weight",
  reps: "reps",
  distance: "distance",
  holdTime: "hold time",
  duration: "duration"
};
const FIELD_ORDER = ["sets", "weight", "reps", "distance", "holdTime", "duration"];

function trackingSummary(subtype) {
  const tf = Array.isArray(subtype?.trackingFields) ? subtype.trackingFields : null;
  if (!tf || !subtype?.activitySlug) return null;
  const parts = FIELD_ORDER.filter((field) => tf.includes(field)).map((field) => FIELD_LABELS[field]);
  if (parts.length === 0) return null;
  // Cap at two fields so buttons stay compact and library-like, not crowded.
  return parts.slice(0, 2).join(" · ");
}

function getSubtypeTags(subtype) {
  const list = [];
  
  if (subtype?.primaryMuscles) {
    const muscles = subtype.primaryMuscles.split(",")
      .map(m => m.trim())
      .filter(Boolean)
      .map(m => m.charAt(0).toUpperCase() + m.slice(1));
    list.push(...muscles);
  }
  
  if (subtype?.equipment && subtype.equipment !== "none") {
    const eq = subtype.equipment.trim();
    if (eq) {
      list.push(eq.charAt(0).toUpperCase() + eq.slice(1));
    }
  }
  
  return list;
}

export default function SubtypePicker({ category, selectedSubtype, workoutTitle, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  // When true the user has explicitly asked to see the whole library; we keep
  // this sticky across search clears (per spec) but reset it on category change.
  const [showAll, setShowAll] = useState(false);

  // Reset search + compact mode when the category changes so nothing looks stale.
  useEffect(() => {
    setQuery("");
    setShowAll(false);
  }, [category?.slug]);

  const subtypes = category?.subtypes || [];

  // Full search runs over every activity in the category, never just the
  // compact subset, so users can always find a library entry by typing.
  const filteredSubtypes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subtypes;
    return subtypes.filter(
      (subtype) =>
        String(subtype.name || "").toLowerCase().includes(q) ||
        String(subtype.slug || "").toLowerCase().includes(q) ||
        String(subtype.equipment || "").toLowerCase().includes(q) ||
        String(subtype.primaryMuscles || "").toLowerCase().includes(q)
    );
  }, [subtypes, query]);

  // Compact subset = first COMPACT_COUNT in the backend (curated) order, but we
  // guarantee the current selection stays visible with its active styling even
  // when it sits outside that leading slice.
  const compactSubset = useMemo(() => {
    const base = subtypes.slice(0, COMPACT_COUNT);
    if (selectedSubtype?.slug && !base.some((s) => s.slug === selectedSubtype.slug)) {
      const selected = subtypes.find((s) => s.slug === selectedSubtype.slug);
      if (selected) return [...base.slice(0, COMPACT_COUNT - 1), selected];
    }
    return base;
  }, [subtypes, selectedSubtype]);

  if (!category) return null;

  const total = subtypes.length;
  const hasQuery = query.trim().length > 0;

  let visibleSubtypes;
  let mode; // "matches" | "all" | "quick"
  if (hasQuery) {
    visibleSubtypes = filteredSubtypes;
    mode = "matches";
  } else if (showAll) {
    visibleSubtypes = subtypes;
    mode = "all";
  } else {
    visibleSubtypes = compactSubset;
    mode = "quick";
  }

  const shown = visibleSubtypes.length;
  let countLabel;
  if (mode === "matches") {
    countLabel = `${shown} ${shown === 1 ? "match" : "matches"}`;
  } else if (mode === "all") {
    countLabel = `${total} ${total === 1 ? "activity" : "activities"}`;
  } else {
    countLabel = `${shown} quick ${shown === 1 ? "pick" : "picks"}`;
  }

  // The expand/collapse control only makes sense when not searching and there
  // is actually more to reveal than the compact subset already shows.
  const canToggle = !hasQuery && total > COMPACT_COUNT;

  return (
    <section className="animate-slide-up rounded-2xl border border-border bg-surface p-5 md:p-6 shadow-sm" aria-label={`${category.name} activities`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs font-mono">
            2
          </div>
          <div>
            <h2 className="text-lg font-bold text-text tracking-tight">Pick activity</h2>
            <p className="text-xs text-secondary">Search or select an activity from the library</p>
          </div>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-xs text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            Close
          </button>
        )}
      </div>

      {/* Integrated control row: search field + live count read as one unit. */}
      <div className="mb-3 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <label className="sr-only" htmlFor="subtype-search">
            Search {category.name} activities
          </label>
          <input
            id="subtype-search"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              // Prevent Enter from submitting the surrounding workout form.
              if (event.key === "Enter") event.preventDefault();
            }}
            placeholder={`Search by name, equipment, or muscles`}
            className="w-full rounded-2xl border border-border bg-bg py-2.5 pl-9 pr-9 text-sm font-medium text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          {hasQuery && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted transition hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-muted" aria-live="polite">
          {countLabel}
        </span>
      </div>

      {shown === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-bg/40 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-text">
            No activities found in this category
          </p>
          <p className="mt-1 text-xs text-muted">
            No activities match “{query.trim()}”
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleSubtypes.map((subtype) => {
            const active = selectedSubtype?.slug === subtype.slug && (workoutTitle === undefined || workoutTitle.trim().toLowerCase() === subtype.name.toLowerCase());
            const meta = trackingSummary(subtype);
            const allTags = getSubtypeTags(subtype);
            const visibleTags = allTags.slice(0, 2);
            const plusCount = allTags.length - visibleTags.length;
            
            return (
              <button
                type="button"
                key={subtype.slug}
                onClick={() => onSelect(subtype)}
                aria-pressed={active}
                className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  active 
                    ? "border-primary bg-primary text-white shadow-md shadow-primary/20 scale-[1.01]" 
                    : "border-border bg-bg/40 text-text hover:border-primary/50 hover:bg-bg/85 hover:-translate-y-[1px] hover:shadow-sm"
                }`}
              >
                <div>
                  <span className="text-sm font-bold tracking-tight block">{subtype.name}</span>
                  {visibleTags.length > 0 && !active && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {visibleTags.map((tag, idx) => (
                        <span key={idx} className="inline-block text-[9px] font-medium text-secondary bg-surface border border-border/30 px-1.5 py-0.5 rounded-md">
                          {tag}
                        </span>
                      ))}
                      {plusCount > 0 && (
                        <span className="inline-block text-[9px] font-medium text-muted bg-surface/50 px-1.5 py-0.5 rounded-md">
                          +{plusCount}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {meta && (
                  <span className={`mt-3 block text-[10px] font-semibold uppercase tracking-wide ${
                    active ? "text-white/70" : "text-muted"
                  }`}>
                    {meta}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {canToggle && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          aria-expanded={showAll}
          className="mt-3 text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {showAll ? "Show less" : `Show all ${total}`}
        </button>
      )}

      {selectedSubtype?.name && (
        <p className="mt-3 text-xs text-muted">
          Selected: <span className="font-semibold text-text">{selectedSubtype.name}</span>
        </p>
      )}
    </section>
  );
}
