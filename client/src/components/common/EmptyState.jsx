import { Dumbbell } from "lucide-react";

export default function EmptyState({ icon: Icon = Dumbbell, title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/80 p-8 text-center shadow-lg shadow-black/10">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm font-semibold text-text">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
