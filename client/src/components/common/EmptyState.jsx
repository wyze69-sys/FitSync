import { Dumbbell } from "lucide-react";

export default function EmptyState({ icon: Icon = Dumbbell, title, description, action }) {
  return (
    <div className="rounded-3xl bg-surface border border-border p-6 text-center shadow-lg shadow-black/10">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/20 text-primary">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm font-semibold text-text">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
