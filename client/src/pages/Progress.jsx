import { Link, useOutletContext } from "react-router-dom";
import { CalendarDays, Scale, Target, TrendingDown, TrendingUp } from "lucide-react";
import WeightProgressChart from "../components/charts/WeightProgressChart.jsx";
import { calculateBMI, resolveBmiCategory } from "../utils/metrics.js";

function getLatestWeight(weightLogs = []) {
  if (weightLogs.length > 0) return Number(weightLogs[0].weight);
  return 0;
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatSurface({ label, value, helper, icon: Icon }) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-5 shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{label}</p>
          <p className="mt-2 text-2xl font-bold text-text">{value}</p>
          {helper && <p className="mt-1 text-xs text-muted">{helper}</p>}
        </div>
        {Icon && <Icon className="size-5 text-primary" aria-hidden="true" />}
      </div>
    </article>
  );
}

function TargetProgress({ latestWeight, startingWeight, targetWeight }) {
  if (!latestWeight || !targetWeight) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-xs text-muted shadow-md">
        Add current weight and target weight in You to see target progress.
      </div>
    );
  }

  const difference = Math.abs(latestWeight - targetWeight);
  const progress = targetWeight === startingWeight
    ? 0
    : Math.min(100, Math.max(0, ((startingWeight - latestWeight) / (startingWeight - targetWeight)) * 100));
  const direction = latestWeight > targetWeight ? "to go" : latestWeight < targetWeight ? "below target" : "at target";

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Target weight</span>
          <h2 className="mt-0.5 text-sm font-semibold text-text">Progress</h2>
        </div>
        <Target className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono tabular-nums">
          <span className="text-muted">Current {latestWeight} kg</span>
          <span className="text-primary">Target {targetWeight} kg</span>
        </div>
        <div className="h-3 overflow-hidden rounded-2xl border border-border bg-bg">
          <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-muted">{difference === 0 ? "You are at your target weight." : `${difference.toFixed(1)} kg ${direction}.`}</p>
      </div>
    </div>
  );
}

function BmiCard({ height, latestWeight }) {
  if (!height || !latestWeight) {
    return <StatSurface label="BMI" value="—" helper={!height ? "Add height in You to see BMI." : "Log your first weight to calculate BMI."} icon={Scale} />;
  }

  const bmi = calculateBMI(latestWeight, height);
  const bmiMeta = resolveBmiCategory(bmi);

  return (
    <article className="space-y-3 rounded-2xl border border-border bg-surface p-5 shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">BMI</p>
        <Scale className="size-5 text-primary" aria-hidden="true" />
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-4xl font-semibold tabular-nums ${bmiMeta.colorClass}`}>{bmi}</span>
        <span className="mb-1 text-xs text-muted">{bmiMeta.label}</span>
      </div>
      <p className="text-xs leading-relaxed text-muted">{bmiMeta.description}</p>
    </article>
  );
}

export default function Progress() {
  const { user, weightLogs = [] } = useOutletContext();
  const latestWeight = getLatestWeight(weightLogs);
  const hasWeightLogs = weightLogs.length > 0;
  const startingWeight = hasWeightLogs ? Number(weightLogs[weightLogs.length - 1].weight) : 0;
  const previousWeight = weightLogs.length > 1 ? Number(weightLogs[1].weight) : 0;
  const changeSinceLast = latestWeight && previousWeight ? latestWeight - previousWeight : 0;
  const latestDate = hasWeightLogs ? weightLogs[0].date : null;

  if (!hasWeightLogs) {
    return (
      <main className="min-h-[60vh] bg-bg py-6 text-text">
        <section className="mx-auto max-w-xl rounded-3xl border border-border bg-surface p-8 text-center shadow-md">
          <TrendingDown className="mx-auto size-10 text-primary" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-bold text-text">Add your first weight to see your trend</h1>
          <p className="mt-2 text-sm text-muted">Your progress chart and weight cards will appear as soon as the backend has a saved weight entry.</p>
          <Link to="/log" className="mt-6 inline-flex rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-md shadow-primary/20 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-primary">
            Log weight
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-6 bg-bg text-left text-text">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Progress</h1>
        <p className="text-sm text-muted">Weight trend, BMI, and target progress in one simple view.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Progress summary cards">
        <StatSurface label="Current weight" value={`${latestWeight} kg`} helper="Latest backend log" icon={Scale} />
        <StatSurface label="Target weight" value={user.targetWeight ? `${user.targetWeight} kg` : "—"} helper="From your profile" icon={Target} />
        <StatSurface label="Starting weight" value={`${startingWeight} kg`} helper="Oldest saved log" icon={TrendingUp} />
        <BmiCard height={user.height} latestWeight={latestWeight} />
        <StatSurface label="Latest log date" value={formatDate(latestDate)} helper="Most recent entry" icon={CalendarDays} />
        <StatSurface label="Change since last" value={previousWeight ? `${changeSinceLast > 0 ? "+" : ""}${changeSinceLast.toFixed(1)} kg` : "—"} helper={previousWeight ? "Compared with prior log" : "Add another log"} icon={TrendingDown} />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-md">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Weight trend</span>
            <h2 className="mt-0.5 text-lg font-semibold text-text">Recent entries</h2>
          </div>
          {user.targetWeight && <span className="text-xs font-mono tabular-nums text-primary">Target {user.targetWeight} kg</span>}
        </div>
        <WeightProgressChart weightLogs={weightLogs} targetWeight={user.targetWeight} maxPoints={12} />
      </section>

      <TargetProgress latestWeight={latestWeight} startingWeight={startingWeight} targetWeight={user.targetWeight} />
    </main>
  );
}
