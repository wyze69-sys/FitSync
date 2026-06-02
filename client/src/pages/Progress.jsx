import { Scale, Target, TrendingDown } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import WeightProgressChart from "../components/charts/WeightProgressChart.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import { calculateBMI, resolveBmiCategory } from "../utils/metrics.js";

function getLatestWeight(weightLogs = []) {
  if (weightLogs.length > 0) return Number(weightLogs[0].weight);
  return 0;
}

function TargetProgress({ latestWeight, targetWeight }) {
  if (!latestWeight || !targetWeight) {
    return (
      <div className="p-4 rounded-sm border border-border bg-surface text-xs text-muted">
        Add current weight and target weight in You to see target progress.
      </div>
    );
  }

  const difference = Math.abs(latestWeight - targetWeight);
  const range = Math.max(Math.abs(latestWeight - targetWeight) * 2, latestWeight * 0.1, 1);
  const progress = Math.max(0, Math.min(100, 100 - (difference / range) * 100));
  const direction = latestWeight > targetWeight ? "to go" : latestWeight < targetWeight ? "below target" : "at target";

  return (
    <div className="p-5 rounded-sm border border-border bg-surface space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">
            Target weight
          </span>
          <h2 className="text-sm font-semibold text-text mt-0.5">Progress</h2>
        </div>
        <Target className="h-5 w-5 text-accent" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono tabular-nums">
          <span className="text-muted">Current {latestWeight} kg</span>
          <span className="text-accent">Target {targetWeight} kg</span>
        </div>
        <div className="h-3 rounded-sm bg-bg border border-border overflow-hidden">
          <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-muted">
          {difference === 0 ? "You are at your target weight." : `${difference.toFixed(1)} kg ${direction}.`}
        </p>
      </div>
    </div>
  );
}

function BmiCard({ height, latestWeight }) {
  if (!height) {
    return (
      <div className="p-5 rounded-sm border border-border bg-surface space-y-2">
        <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">BMI</span>
        <p className="text-xs text-muted">Add height in You to see BMI</p>
      </div>
    );
  }

  if (!latestWeight) {
    return (
      <div className="p-5 rounded-sm border border-border bg-surface space-y-2">
        <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">BMI</span>
        <p className="text-xs text-muted">Log your first weight to calculate BMI.</p>
      </div>
    );
  }

  const bmi = calculateBMI(latestWeight, height);
  const bmiMeta = resolveBmiCategory(bmi);

  return (
    <div className="p-5 rounded-sm border border-border bg-surface space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">BMI</span>
          <h2 className="text-sm font-semibold text-text mt-0.5">Body Mass Index</h2>
        </div>
        <Scale className="h-5 w-5 text-accent" aria-hidden="true" />
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-5xl font-mono tabular-nums font-semibold ${bmiMeta.colorClass}`}>{bmi}</span>
        <span className="text-xs text-muted mb-1">using latest weight</span>
      </div>
      <div className={`inline-flex px-2.5 py-1 rounded-sm text-[10px] font-mono uppercase tracking-widest ${bmiMeta.badgeClass}`}>
        {bmiMeta.label}
      </div>
      <p className="text-xs text-muted leading-relaxed">{bmiMeta.description}</p>
    </div>
  );
}

export default function Progress() {
  const { user, weightLogs } = useOutletContext();
  const latestWeight = getLatestWeight(weightLogs);
  const hasWeightLogs = weightLogs.length > 0;

  return (
    <div className="space-y-6 text-left text-text">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-text">Progress</h1>
        <p className="text-xs text-muted">
          Weight trend, BMI, and target progress in one simple view.
        </p>
      </div>

      {!hasWeightLogs && (
        <EmptyState
          icon={TrendingDown}
          title="No weight logs yet"
          description="Use Log to add your first weight entry and start seeing trends here."
        />
      )}

      <div className="bg-surface p-5 rounded-sm border border-border">
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">
              Weight trend
            </span>
            <h2 className="text-sm font-semibold text-text mt-0.5">Recent entries</h2>
          </div>
          {user.targetWeight && (
            <span className="text-xs text-accent font-mono tabular-nums">
              Target {user.targetWeight} kg
            </span>
          )}
        </div>
        {hasWeightLogs ? (
          <WeightProgressChart weightLogs={weightLogs} targetWeight={user.targetWeight} maxPoints={12} />
        ) : (
          <EmptyState
            icon={TrendingDown}
            title="Log your first weight"
            description="Add two weight entries over time to see a trend line here."
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BmiCard height={user.height} latestWeight={latestWeight} />
        <TargetProgress latestWeight={latestWeight} targetWeight={user.targetWeight} />
      </div>
    </div>
  );
}
