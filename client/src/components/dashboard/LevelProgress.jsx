import { memo } from "react";

const WIDTH_CLASSES = [
  "w-0",
  "w-1/12",
  "w-2/12",
  "w-3/12",
  "w-4/12",
  "w-5/12",
  "w-6/12",
  "w-7/12",
  "w-8/12",
  "w-9/12",
  "w-10/12",
  "w-11/12",
  "w-full"
];

/**
 * Returns the nearest progress-width utility without inline styles.
 * @param {number} totalXp Total user XP.
 * @param {number} nextLevelXp XP needed for the next level.
 * @returns {string}
 */
function getProgressClass(totalXp, nextLevelXp) {
  if (!nextLevelXp) return "w-full";
  const percentage = Math.min(100, Math.max(0, (totalXp / nextLevelXp) * 100));
  const bucket = Math.round(percentage / 8.333);
  return WIDTH_CLASSES[bucket] || "w-full";
}

/**
 * Shows current XP progress toward the next level.
 * @param {{totalXp: number, nextLevelXp: number, title?: string}} props Component props.
 * @returns {JSX.Element}
 */
function LevelProgress({ totalXp, nextLevelXp, title }) {
  const progressClass = getProgressClass(totalXp, nextLevelXp);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Level progress</h2>
          {title && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">{title}</p>}
        </div>
        <p className="text-sm tabular-nums text-zinc-500 dark:text-zinc-500">
          {totalXp} / {nextLevelXp} XP
        </p>
      </div>
      <div className="mt-4 h-1 w-full overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800">
        <div className={`h-full rounded-lg bg-zinc-900 dark:bg-zinc-100 ${progressClass}`} />
      </div>
    </section>
  );
}

export { getProgressClass };
export default memo(LevelProgress);
