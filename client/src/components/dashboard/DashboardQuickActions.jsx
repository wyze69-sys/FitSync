import { Zap, Check, Plus, Droplets, Compass } from "lucide-react";
import { QUICK_PRESETS } from "../../utils/constants.js";

/**
 * One-tap quick logging: fast workout presets plus daily wellness check-ins
 * that keep a streak alive even without a full workout.
 */
export default function DashboardQuickActions({ onQuickLog, onCheckin, checkedInToday, busy }) {
  return (
    <div className="space-y-6">
      <div className="bg-surface p-4 rounded-2xl border border-border space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[10px] font-mono font-bold text-text uppercase tracking-widest">
              Active Check-in
            </span>
            <h3 className="text-sm font-semibold text-text mt-0.5">
              Wellness Checklist
            </h3>
          </div>
          <Compass className="h-4.5 w-4.5 text-text" aria-hidden="true" />
        </div>
        <p className="text-xs text-muted leading-relaxed">
          No workout today? Keep your streak alive by logging a daily wellness action.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onCheckin("Hydration check-in")}
            className={`p-2.5 rounded-2xl border text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${
              checkedInToday
                ? "bg-accent/5 border-accent/30 text-text"
                : "bg-bg border-border hover:border-accent text-text"
            }`}
          >
            <span className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-sky-400" aria-hidden="true" />
              Hydration (3L+)
            </span>
            {checkedInToday ? (
              <Check className="h-4 w-4 text-text" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onCheckin("Stretch & recovery check-in")}
            className={`p-2.5 rounded-2xl border text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${
              checkedInToday
                ? "bg-accent/5 border-accent/30 text-text"
                : "bg-bg border-border hover:border-accent text-text"
            }`}
          >
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" aria-hidden="true" />
              Stretch & recovery
            </span>
            {checkedInToday ? (
              <Check className="h-4 w-4 text-text" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-3.5">
        <div className="flex items-center gap-2 text-muted">
          <Zap className="h-4 w-4 text-text" aria-hidden="true" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest">
            Quick workout logs
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {QUICK_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              disabled={busy}
              onClick={() => onQuickLog(preset)}
              className="p-3 rounded-2xl bg-surface border border-border text-left hover:border-accent transition-all cursor-pointer group flex flex-col justify-between h-24 disabled:opacity-50"
            >
              <span className="text-[10px] font-mono text-muted font-bold group-hover:text-text uppercase tracking-widest">
                {preset.tag}
              </span>
              <div>
                <h4 className="text-xs font-semibold text-text uppercase tracking-wide">
                  {preset.label}
                </h4>
                <p className="text-[11px] text-muted mt-1 font-mono tabular-nums">
                  {preset.duration}m • Est. from backend
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
