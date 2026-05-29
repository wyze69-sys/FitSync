/**
 * Reusable empty-state panel with an icon, message, and optional call to action.
 */
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="py-12 bg-neutral-900/10 rounded-sm border border-dashed border-neutral-800 flex flex-col items-center justify-center text-center p-6 space-y-3">
      {Icon && <Icon className="h-8 w-8 text-neutral-600" aria-hidden="true" />}
      <div>
        <p className="text-sm font-semibold text-neutral-300">{title}</p>
        {description && (
          <p className="text-xs text-neutral-500 max-w-xs mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
