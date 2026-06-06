import { useMemo } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { CalendarDays, Dumbbell, Flame, Terminal, Timer } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import PageHeader from "../components/common/PageHeader.jsx";
import StatCard from "../components/common/StatCard.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import StreakCard from "../components/gamification/StreakCard.jsx";
import XPProgressBar from "../components/gamification/XPProgressBar.jsx";
import AchievementBadge from "../components/gamification/AchievementBadge.jsx";

function n(value) {
  return Number(value || 0);
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatWorkout(workout) {
  return {
    id: workout.id,
    title: workout.title || workout.exercises?.[0]?.exerciseName || "Workout",
    date: workout.date ? new Date(workout.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Today",
    calories: n(workout.calories ?? workout.caloriesTotal),
    xp: n(workout.xp ?? workout.xp_earned),
    minutes: n(workout.durationTotal ?? workout.duration_min)
  };
}

export default function Dashboard() {
  const { user: authUser } = useAuth();
  const context = useOutletContext();
  const gamification = context.gamification || {};
  const recentWorkouts = useMemo(() => context.workouts.slice(0, 3).map(formatWorkout), [context.workouts]);
  const badges = useMemo(() => (gamification.badges || []).filter((badge) => badge.isUnlocked).slice(0, 3), [gamification.badges]);
  const userName = authUser?.name || context.user?.name || "there";
  const totalXp = n(gamification.totalXp ?? gamification.total_xp);
  const nextLevelXp = n(gamification.nextLevelXp ?? gamification.next_level_xp);
  const currentStreak = n(gamification.currentStreak);
  const longestStreak = n(gamification.longestStreak);

  if (context.loading) return <LoadingSpinner label="Loading dashboard" />;

  if (context.error) return <ErrorPanel message={context.error} onRetry={context.refreshAll} />;

  return (
    <main className="space-y-6 text-text">
      <PageHeader
        eyebrow="Dashboard"
        title={`${getTimeOfDay()}, ${userName} 👋`}
        description="Your streak, XP, weekly effort, and next quick action are ready."
        action={
          <Link to="/log" className="inline-flex rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg">
            Quick Log
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <StreakCard current={currentStreak} longest={longestStreak} increased={currentStreak > 0} />
        <div className="lg:col-span-2">
          <XPProgressBar totalXp={totalXp} nextLevelXp={nextLevelXp} level={n(gamification.level || 1)} title={gamification.title} />
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Weekly summary">
        <StatCard icon={Dumbbell} label="Workouts" value={n(gamification.totalWorkoutsThisWeek)} helper="This week" />
        <StatCard icon={Timer} label="Minutes" value={`${n(gamification.totalMinutesThisWeek)}m`} helper="This week" />
        <StatCard icon={Flame} label="Calories" iconClassName="text-streak bg-streak/10" value={n(gamification.totalCaloriesThisWeek)} helper="Backend totals" />
        <StatCard icon={Terminal} label="Dev XP" iconClassName="text-xp bg-xp/10" value={totalXp.toLocaleString()} helper="Lifetime" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-border bg-surface p-5 shadow-lg shadow-black/10 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Recent</p>
              <h2 className="mt-1 text-lg font-semibold text-text">Last 3 workouts</h2>
            </div>
            <CalendarDays className="h-5 w-5 text-muted" aria-hidden="true" />
          </div>
          {recentWorkouts.length > 0 ? (
            <div className="mt-4 space-y-3">
              {recentWorkouts.map((workout) => (
                <div key={workout.id} className="rounded-2xl bg-bg p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text">{workout.title}</p>
                      <p className="text-xs text-muted">{workout.date} • {workout.minutes} min</p>
                    </div>
                    <p className="text-right text-xs text-muted">+{workout.xp} XP<br />{workout.calories} cal</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Dumbbell}
              title="No workouts yet — log your first in 10s"
              description="Quick Log keeps the first workout fast and typing-free."
              action={<Link to="/log" className="inline-flex rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Quick Log</Link>}
            />
          )}
        </article>

        <article className="rounded-3xl bg-surface border border-border p-6 shadow-lg shadow-black/10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Insight</p>
          <h2 className="mt-2 text-lg font-semibold text-text">{currentStreak > 0 ? "Keep the chain alive" : "Start with a 30-minute base"}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {recentWorkouts.length > 0
              ? `Your latest sessions total ${recentWorkouts.reduce((sum, item) => sum + item.minutes, 0)} minutes. A similar quick log today can protect your streak and push XP forward.`
              : "Log 3 more workouts to unlock your personalized insight"}
          </p>
          {badges.length > 0 && (
            <div className="mt-4 grid gap-3">
              {badges.map((badge) => <AchievementBadge key={badge.code} badge={badge} />)}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

function ErrorPanel({ message, onRetry }) {
  return (
    <section role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-text">
      <p>{message}</p>
      <button type="button" onClick={onRetry} className="mt-4 rounded-2xl border border-red-400/40 px-4 py-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        Retry
      </button>
    </section>
  );
}
