import { Scale, Target } from "lucide-react";
import { calculateBMI, resolveBmiCategory } from "../../utils/metrics.js";

function StatTile({ label, value, hint, accent = "text-neutral-400" }) {
  return (
    <div className="p-4 bg-[#0E0E0E] rounded-sm border border-neutral-800">
      <span className={`text-[9px] font-mono uppercase tracking-widest font-bold ${accent}`}>
        {label}
      </span>
      <div className="text-2xl font-serif italic font-black text-white mt-1">{value}</div>
      {hint && (
        <p className="text-[9px] text-neutral-500 uppercase tracking-widest mt-1.5 font-mono font-bold">
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
  const startWeight =
    weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : user?.weight;
  const currentWeight = user?.weight;
  const targetWeight = user?.targetWeight;
  let targetProgress = null;
  if (targetWeight && currentWeight && startWeight && startWeight !== targetWeight) {
    const ratio = ((startWeight - currentWeight) / (startWeight - targetWeight)) * 100;
    targetProgress = {
      percent: Math.max(0, Math.min(100, Math.round(ratio))),
      remaining: Math.abs(Number((currentWeight - targetWeight).toFixed(1)))
    };
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatTile
          label="Week consistency"
          value={`${weeklyConsistency}%`}
          accent="text-emerald-400"
          hint="Active days / 7"
        />
        <StatTile label="Total Workouts" value={workoutTotal ?? 0} hint="Recorded sessions" />
        <StatTile label="Minutes" value={`${minutesThisWeek}m`} hint="Trained this week" />
        <StatTile
          label="Calories"
          value={caloriesThisWeek}
          accent="text-emerald-400"
          hint="Burned this week"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#0E0E0E] p-5 rounded-sm border border-neutral-800 space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">
              Body Mass Index
            </h3>
            <Scale className="h-4.5 w-4.5 text-neutral-400" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-serif font-bold text-white">
                {hasBmi ? bmiValue : "--"}
              </span>
              <span
                className={`text-[10px] font-bold font-mono uppercase tracking-wide px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 ${bmi.colorClass}`}
              >
                {hasBmi ? bmi.label : "Incomplete"}
              </span>
            </div>
            {hasBmi && (
              <div className="mt-3 h-1 w-full bg-neutral-950 rounded-full overflow-hidden">
                <div
                  className={`h-full ${bmi.barClass} rounded-full`}
                  style={{ width: `${Math.min(100, (bmiValue / 40) * 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#0E0E0E] p-5 rounded-sm border border-neutral-800 space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">
              Target Weight
            </h3>
            <Target className="h-4.5 w-4.5 text-emerald-400" aria-hidden="true" />
          </div>
          {targetProgress ? (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-white">
                  {targetProgress.percent}%
                </span>
                <span className="text-[11px] text-neutral-400 font-mono">
                  {targetProgress.remaining} kg to {targetWeight} kg
                </span>
              </div>
              <div className="mt-3 h-1 w-full bg-neutral-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${targetProgress.percent}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-500 leading-relaxed">
              Set a target weight in your profile to track progress toward your goal.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
