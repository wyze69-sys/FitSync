/**
 * Reusable empty-state panel with an icon, message, and optional call to action.
 */
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="py-12 bg-surface rounded-sm border border-dashed border-border flex flex-col items-center justify-center text-center p-6 space-y-3">
      {Icon && <Icon className="h-8 w-8 text-muted" aria-hidden="true" />}
      <div>
        <p className="text-sm font-semibold text-text">{title}</p>
        {description && (
          <p className="text-xs text-muted max-w-xs mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
