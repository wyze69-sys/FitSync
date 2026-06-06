export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}
