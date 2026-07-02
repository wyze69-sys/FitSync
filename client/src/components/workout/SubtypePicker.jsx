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

export default function SubtypePicker({ category, selectedSubtype, onSelect, onClose }) {
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
        String(subtype.slug || "").toLowerCase().includes(q)
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
    <section className="animate-slide-up rounded-2xl border border-border bg-surface p-4 shadow-xl shadow-black/20" aria-label={`${category.name} activities`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Step 2</p>
          <h2 className="text-lg font-semibold text-text">Choose activity</h2>
          <p className="mt-0.5 text-xs text-muted">Pick a common activity, search the library, or show all.</p>
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
            placeholder={`Search ${category.name} activities`}
            className="w-full rounded-2xl border border-border bg-bg py-2 pl-9 pr-9 text-sm font-medium text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
        <p className="rounded-2xl border border-border bg-bg px-4 py-6 text-center text-sm text-muted">
          No {category.name.toLowerCase()} activities match “{query.trim()}”.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {visibleSubtypes.map((subtype) => {
            const active = selectedSubtype?.slug === subtype.slug;
            const meta = trackingSummary(subtype);
            return (
              <button
                type="button"
                key={subtype.slug}
                onClick={() => onSelect(subtype)}
                aria-pressed={active}
                className={`flex min-h-[44px] min-w-[44px] flex-col justify-center rounded-2xl border px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  active ? "border-primary bg-primary text-white" : "border-border bg-bg text-text hover:border-primary/60"
                }`}
              >
                <span className="text-sm font-semibold leading-tight">{subtype.name}</span>
                {meta && (
                  <span className={`mt-1 text-[11px] leading-tight ${active ? "text-white/70" : "text-muted"}`}>
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
