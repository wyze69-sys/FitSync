import { Scale, Target } from "lucide-react";
import { calculateBMI, resolveBmiCategory } from "../../utils/metrics.js";

function StatTile({ label, value, hint, accent = false }) {
  return (
    <div className="p-3 bg-surface rounded-sm border border-border">
      <span
        className="text-[9px] font-mono uppercase tracking-widest font-bold text-muted"
      >
        {label}
      </span>
      <div className={`text-2xl font-mono tabular-nums font-semibold mt-1 ${accent ? "text-primary" : "text-text"}`}>
        {value}
      </div>
      {hint && (
        <p className="text-[9px] text-muted uppercase tracking-widest mt-1.5 font-mono font-semibold">
          {hint}
        </p>
      )}
    </div>
  );
}

/**
 * Weekly performance tiles, BMI indicator, and target-weight progress.
 */
export default function DashboardStats({ gamification, workoutTotal, user, weightLogs = [] }) {
  const weeklyConsistency = gamification?.weeklyConsistency ?? 0;
  const minutesThisWeek = gamification?.totalMinutesThisWeek ?? 0;
  const caloriesThisWeek = gamification?.totalCaloriesThisWeek ?? 0;

  const bmiValue = calculateBMI(user?.weight, user?.height);
  const bmi = resolveBmiCategory(bmiValue);
  const hasBmi = Boolean(user?.weight && user?.height);

  // Target-weight progress: from the earliest logged weight toward the target.
  const startingWeight =
    weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : user?.weight;
  const currentWeight = user?.weight;
  const targetWeight = user?.targetWeight;
  let targetProgress = null;
  if (targetWeight && currentWeight && startingWeight) {
    const pct = targetWeight === startingWeight
      ? 0
      : Math.min(100, Math.max(0, ((startingWeight - currentWeight) / (startingWeight - targetWeight)) * 100));
    targetProgress = {
      percent: Math.round(pct),
      remaining: Math.abs(Number((currentWeight - targetWeight).toFixed(1)))
    };
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatTile
          label="Week consistency"
          value={`${weeklyConsistency}%`}
          accent
          hint="Active days / 7"
        />
        <StatTile label="Total Workouts" value={workoutTotal ?? 0} hint="Recorded sessions" />
        <StatTile label="Minutes" value={`${minutesThisWeek}m`} hint="Trained this week" />
        <StatTile label="Calories" value={caloriesThisWeek} hint="Burned this week" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-surface p-3 rounded-sm border border-border space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-[9px] font-mono font-bold text-muted uppercase tracking-widest">
              Body Mass Index
            </h3>
            <Scale className="h-4.5 w-4.5 text-muted" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono tabular-nums font-semibold text-text">
                {hasBmi ? bmiValue : "--"}
              </span>
              <span
                className={`text-[10px] font-semibold font-mono uppercase tracking-wide px-2 py-0.5 rounded-sm bg-bg border border-border ${bmi.colorClass}`}
              >
                {hasBmi ? bmi.label : "Incomplete"}
              </span>
            </div>
            {hasBmi && (
              <div className="mt-3 h-1 w-full bg-bg rounded-sm overflow-hidden">
                <div
                  className={`h-full ${bmi.barClass} rounded-sm`}
                  style={{ width: `${Math.min(100, (bmiValue / 40) * 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface p-3 rounded-sm border border-border space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-[9px] font-mono font-bold text-text uppercase tracking-widest">
              Target Weight
            </h3>
            <Target className="h-4.5 w-4.5 text-text" aria-hidden="true" />
          </div>
          {targetProgress ? (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono tabular-nums font-semibold text-primary">
                  {targetProgress.percent}%
                </span>
                <span className="text-[11px] text-muted font-mono tabular-nums">
                  {targetProgress.remaining} kg to {targetWeight} kg
                </span>
              </div>
              <div className="mt-3 h-1 w-full bg-bg rounded-sm overflow-hidden">
                <div
                  className="h-full bg-primary rounded-sm"
                  style={{ width: `${targetProgress.percent}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted leading-relaxed">
              Set a target weight in your profile to track progress toward your goal.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
