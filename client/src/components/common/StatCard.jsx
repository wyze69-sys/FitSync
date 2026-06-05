export default function StatCard({ label, value, helper, icon: Icon }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-surface/90 p-4 shadow-lg shadow-black/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-text">{value}</p>
        </div>
        {Icon && (
          <span className="rounded-2xl bg-emerald-500/10 p-2 text-emerald-400">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </div>
      {helper && <p className="mt-3 text-xs text-muted">{helper}</p>}
    </article>
  );
}
