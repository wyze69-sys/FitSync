import { useMemo } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Dumbbell } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import LevelProgress from "../components/dashboard/LevelProgress.jsx";
import RecentTable from "../components/dashboard/RecentTable.jsx";
import StatCard from "../components/dashboard/StatCard.jsx";

const RECENT_LIMIT = 8;

/**
 * Returns a numeric field with a safe fallback.
 * @param {number|undefined} value Possible number.
 * @returns {number}
 */
function numberOrZero(value) {
  return Number(value || 0);
}

/**
 * Builds dashboard stat cards from real API data.
 * @param {object} data Outlet context data.
 * @returns {Array<object>}
 */
function buildStats(data) {
  const totalXp = numberOrZero(data.gamification?.totalXp ?? data.gamification?.total_xp);
  return [
    { label: "Workouts", value: data.workoutTotal || 0, trend: "All logged sessions" },
    { label: "Minutes", value: `${numberOrZero(data.gamification?.totalMinutesThisWeek)}m`, trend: "This week" },
    { label: "Calories", value: numberOrZero(data.gamification?.totalCaloriesThisWeek), trend: "This week" },
    { label: "Total XP", value: totalXp, trend: "Lifetime progress" }
  ];
}

/**
 * Loading skeleton for the dashboard grid.
 * @returns {JSX.Element}
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading dashboard">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["one", "two", "three", "four"].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        ))}
      </div>
      <div className="h-24 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}

/**
 * Dashboard page showing production workout and XP data.
 * @returns {JSX.Element}
 */
export default function Dashboard() {
  const { user: authUser } = useAuth();
  const context = useOutletContext();
  const stats = useMemo(() => buildStats(context), [context]);
  const recentWorkouts = useMemo(() => context.workouts.slice(0, RECENT_LIMIT), [context.workouts]);
  const totalXp = numberOrZero(context.gamification?.totalXp ?? context.gamification?.total_xp);
  const nextLevelXp = numberOrZero(context.gamification?.nextLevelXp ?? context.gamification?.next_level_xp);
  const level = numberOrZero(context.gamification?.level || 1);
  const streak = numberOrZero(context.gamification?.currentStreak);

  if (context.loading) return <DashboardSkeleton />;

  if (context.error) {
    return (
      <main className="space-y-6 bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <ErrorPanel message={context.error} onRetry={context.refreshAll} />
      </main>
    );
  }

  return (
    <main className="space-y-6 bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <nav className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" aria-label="Dashboard summary">
        <div>
          <h1 className="text-xl font-medium text-zinc-900 dark:text-zinc-100">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">Welcome back, {authUser?.name || context.user?.name || "there"}.</p>
        </div>
        <div className="flex gap-2 text-sm text-zinc-900 dark:text-zinc-100">
          <span className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">{streak} day streak</span>
          <span className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">Level {level}</span>
        </div>
      </nav>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Stats">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} trend={stat.trend} />
        ))}
      </section>

      <LevelProgress totalXp={totalXp} nextLevelXp={nextLevelXp} title={context.gamification?.title} />

      {recentWorkouts.length > 0 ? (
        <RecentTable workouts={recentWorkouts} />
      ) : (
        <EmptyState
          icon={Dumbbell}
          title="No workouts logged yet"
          description="Log your first session to start earning XP."
          action={
            <Link className="text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100" to="/log">
              Log a workout
            </Link>
          }
        />
      )}
    </main>
  );
}

/**
 * Neutral dashboard error state with retry action.
 * @param {{message: string, onRetry: Function}} props Component props.
 * @returns {JSX.Element}
 */
function ErrorPanel({ message, onRetry }) {
  return (
    <section role="alert" className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm text-zinc-900 dark:text-zinc-100">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg border border-zinc-900 px-4 py-2 text-sm font-medium text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 dark:border-zinc-100 dark:text-zinc-100 dark:focus-visible:ring-zinc-100 dark:focus-visible:ring-offset-zinc-950"
      >
        Retry
      </button>
    </section>
  );
}
