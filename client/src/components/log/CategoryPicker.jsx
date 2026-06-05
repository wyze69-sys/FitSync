import { memo, useCallback, useRef } from "react";

const ARROW_KEYS = new Set(["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"]);

/**
 * Moves focus between category buttons with arrow keys.
 * @param {KeyboardEvent} event Keyboard event.
 * @param {Array<HTMLButtonElement>} buttons Category buttons.
 */
function moveFocus(event, buttons) {
  if (!ARROW_KEYS.has(event.key)) return;
  event.preventDefault();
  const currentIndex = buttons.findIndex((button) => button === event.currentTarget);
  const offset = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
  const nextIndex = (currentIndex + offset + buttons.length) % buttons.length;
  buttons[nextIndex]?.focus();
}

/**
 * Keyboard-friendly workout category picker.
 * @param {{categories: Array<object>, selectedSlug: string, onSelect: Function}} props Component props.
 * @returns {JSX.Element}
 */
function CategoryPicker({ categories, selectedSlug, onSelect }) {
  const buttonRefs = useRef([]);

  const handleKeyDown = useCallback((event) => {
    moveFocus(event, buttonRefs.current.filter(Boolean));
  }, []);

  return (
    <section aria-labelledby="category-heading" className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 id="category-heading" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Category</h2>
      <div className="mt-4 flex flex-col gap-2" role="radiogroup" aria-label="Workout category">
        {categories.map((category, index) => {
          const active = category.slug === selectedSlug;
          return (
            <button
              key={category.id || category.slug}
              ref={(node) => {
                buttonRefs.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(category.slug)}
              onKeyDown={handleKeyDown}
              className={`rounded-lg border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-100 dark:focus-visible:ring-offset-zinc-950 ${active ? "border-zinc-900 dark:border-zinc-100" : "border-zinc-200 dark:border-zinc-800"}`}
            >
              <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">{category.name}</span>
              <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-500">{category.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default memo(CategoryPicker);
