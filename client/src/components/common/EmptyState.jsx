/**
 * Reusable empty-state panel with an icon, one helpful line, and optional action.
 * @param {{icon?: Function, title: string, description?: string, action?: JSX.Element}} props Component props.
 * @returns {JSX.Element}
 */
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
      {Icon && <Icon className="mx-auto h-6 w-6 text-zinc-500 dark:text-zinc-500" aria-hidden="true" />}
      <p className="mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</p>
      {description && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
