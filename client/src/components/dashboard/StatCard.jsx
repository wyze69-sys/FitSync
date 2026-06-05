import { memo } from "react";

/**
 * Displays a compact dashboard metric with supporting trend text.
 * @param {{label: string, value: string|number, trend?: string}} props Component props.
 * @returns {JSX.Element}
 */
function StatCard({ label, value, trend }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xl font-medium tabular-nums text-zinc-900 dark:text-zinc-100">{value}</p>
      <h2 className="mt-2 text-sm text-zinc-900 dark:text-zinc-100">{label}</h2>
      {trend && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">{trend}</p>}
    </section>
  );
}

export default memo(StatCard);
