import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useOutletContext } from "react-router-dom";
import { CalendarDays, Flame, Target, Zap } from "lucide-react";
import workoutService from "../services/workoutService.js";
import { useAuth } from "../context/AuthContext.jsx";
import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import OnboardingModal from "../components/modals/OnboardingModal.jsx";
import Spinner from "../components/common/Spinner.jsx";
import ErrorBanner from "../components/common/ErrorBanner.jsx";

function toDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dateNum = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${dateNum}`;
}

function getCurrentWeekRange() {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday: toDateInput(monday), sunday: toDateInput(sunday), today: toDateInput(today) };
}

function LevelCard({ gamification }) {
  const totalXp = Number(gamification?.totalXp || 0);
  const level = Number(gamification?.level || 1);
  const nextLevelXp = Number(gamification?.nextLevelXp || 500);
  const previousLevelXp = Math.max(0, (level - 1) * 500);
  const progress = Math.min(100, Math.round(((totalXp - previousLevelXp) / (nextLevelXp - previousLevelXp || 1)) * 100));

  return (
    <div className="bg-surface border border-border rounded-lg p-6 sm:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-accent">Level</p>
          <h2 className="mt-2 text-4xl sm:text-5xl font-black tracking-tight">Level {level}</h2>
          <p className="mt-2 text-sm text-muted">{totalXp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP</p>
        </div>
        <div className="rounded-full bg-accent/10 p-4 text-accent">
          <Zap className="h-8 w-8" aria-hidden="true" />
        </div>
      </div>
      <div>
        <div className="h-4 overflow-hidden rounded-full bg-bg border border-border">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[10px] font-mono uppercase tracking-widest text-muted">
          <span>{progress}% to next level</span>
          <span>{Math.max(0, nextLevelXp - totalXp).toLocaleString()} XP left</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <Icon className="h-5 w-5 text-accent mb-4" aria-hidden="true" />
      <div className="text-3xl font-black tabular-nums">{value}</div>
      <div className="mt-1 text-[10px] font-mono font-bold uppercase tracking-widest text-muted">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user, gamification, loading, error, refreshAll } = useOutletContext();
  const { updateUser } = useAuth();
  const location = useLocation();
  const [weekSummary, setWeekSummary] = useState({ workouts: [], loading: true, error: null });

  const profileIncomplete = !user.height || !user.weight;
  const { today } = useMemo(() => getCurrentWeekRange(), []);
  const kcalToday = useMemo(
    () =>
      weekSummary.workouts
        .filter((workout) => workout.date === today)
        .reduce((sum, workout) => sum + Number(workout.caloriesBurned || workout.caloriesTotal || 0), 0),
    [today, weekSummary.workouts]
  );

  useEffect(() => {
    let active = true;

    async function loadWeek() {
      setWeekSummary((current) => ({ ...current, loading: true, error: null }));
      try {
        const { monday, sunday } = getCurrentWeekRange();
        const result = await workoutService.getWorkouts({ from: monday, to: sunday, limit: 50 });
        if (active) setWeekSummary({ workouts: result.items || [], loading: false, error: null });
      } catch (err) {
        if (active) {
          setWeekSummary({ workouts: [], loading: false, error: err.message || "Could not load this week." });
        }
      }
    }

    if (location.pathname === "/") loadWeek();
    return () => {
      active = false;
    };
  }, [location.pathname]);

  function handleProfileUpdated(updatedUser) {
    updateUser(updatedUser);
    refreshAll();
  }

  if (loading && !gamification) {
    return <Spinner label="Loading your home..." className="py-24" />;
  }

  return (
    <div className="space-y-6 text-left text-text pb-16">
      {profileIncomplete && <OnboardingModal user={user} onComplete={handleProfileUpdated} />}
      <DashboardHeader user={user} />
      <ErrorBanner message={error || weekSummary.error} onRetry={refreshAll} />

      <LevelCard gamification={gamification} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Flame} label="🔥 streak" value={`${gamification?.currentStreak || 0}d`} />
        <StatCard icon={CalendarDays} label="workouts this week" value={weekSummary.loading ? "…" : weekSummary.workouts.length} />
        <StatCard icon={Target} label="kcal today" value={weekSummary.loading ? "…" : kcalToday.toLocaleString()} />
      </div>

      <div className="bg-surface border border-border rounded-lg p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black">Ready for the next one?</h2>
          <p className="mt-1 text-sm text-muted">No charts. No AI. Just quick logging, fair XP, and automatic calories.</p>
        </div>
        <Link to="/log" className="rounded-sm bg-accent px-6 py-3 text-center text-xs font-black uppercase tracking-widest text-black">
          Log in 7 sec
        </Link>
      </div>
    </div>
  );
}
