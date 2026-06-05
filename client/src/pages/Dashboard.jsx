import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useOutletContext } from "react-router-dom";
import { CalendarDays, Flame, Target, Trophy, Zap } from "lucide-react";
import workoutService from "../services/workoutService.js";
import { useAuth } from "../context/AuthContext.jsx";
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

function normalizeGamification(userGamification, summaryGamification) {
  return {
    totalXp: Number(
      userGamification?.total_xp ?? summaryGamification?.totalXp ?? summaryGamification?.total_xp ?? 0
    ),
    level: Number(userGamification?.level ?? summaryGamification?.level ?? 1),
    currentStreak: Number(
      userGamification?.current_streak ??
        summaryGamification?.currentStreak ??
        summaryGamification?.current_streak ??
        0
    ),
    longestStreak: Number(
      userGamification?.longest_streak ??
        summaryGamification?.longestStreak ??
        summaryGamification?.longest_streak ??
        0
    ),
    nextLevelXp: Number(
      userGamification?.next_level_xp ??
        summaryGamification?.nextLevelXp ??
        summaryGamification?.next_level_xp ??
        500
    )
  };
}

function LevelHero({ stats }) {
  const progress = Math.min(
    100,
    Math.max(0, Math.round((stats.totalXp / Math.max(stats.nextLevelXp, 1)) * 100))
  );
  const xpRemaining = Math.max(0, stats.nextLevelXp - stats.totalXp);

  return (
    <section className="rounded-2xl border border-[#222] bg-[#141414] p-6 sm:p-8 shadow-2xl shadow-black/30">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.35em] text-[#999]">
            XP Level
          </p>
          <div className="mt-4 flex items-end gap-4">
            <span className="font-black leading-none tracking-tight text-[84px] sm:text-[112px] text-[#c4ff00]">
              {stats.level}
            </span>
            <div className="pb-4">
              <div className="text-xl font-black uppercase tracking-widest text-white">Level</div>
              <div className="mt-1 text-sm text-[#999]">Automatic rewards are active</div>
            </div>
          </div>
        </div>
        <div className="hidden sm:flex rounded-full border border-[#222] bg-[#0a0a0a] p-4 text-[#c4ff00]">
          <Trophy className="h-8 w-8" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-7 space-y-3">
        <div className="h-4 overflow-hidden rounded-full border border-[#222] bg-[#0a0a0a]">
          <div className="h-full rounded-full bg-[#c4ff00] transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-sm font-bold text-white">
            {stats.totalXp.toLocaleString()} XP / {stats.nextLevelXp.toLocaleString()} XP
          </p>
          <p className="font-mono text-xs uppercase tracking-widest text-[#999]">
            {xpRemaining.toLocaleString()} XP to Level {stats.level + 1}
          </p>
        </div>
      </div>
    </section>
  );
}

function StreakCard({ currentStreak, longestStreak }) {
  return (
    <aside className="rounded-2xl border border-[#222] bg-[#141414] p-6 sm:p-8 shadow-2xl shadow-black/30">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.35em] text-[#999]">Streak</p>
        <Flame className="h-7 w-7 text-[#c4ff00]" aria-hidden="true" />
      </div>
      <div className="mt-8 flex items-end gap-3">
        <span className="text-7xl font-black leading-none text-white tabular-nums">{currentStreak}</span>
        <span className="pb-2 text-sm font-mono uppercase tracking-widest text-[#999]">days</span>
      </div>
      <p className="mt-4 text-sm text-[#999]">
        🔥 <span className="text-[#c4ff00]">{longestStreak}</span> day best streak
      </p>
    </aside>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[#222] bg-[#141414] p-5">
      <Icon className="h-5 w-5 text-[#c4ff00]" aria-hidden="true" />
      <div className="mt-5 text-3xl font-black text-white tabular-nums">{value}</div>
      <div className="mt-2 text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-[#999]">
        {label}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, gamification, loading, error, refreshAll } = useOutletContext();
  const { updateUser } = useAuth();
  const location = useLocation();
  const [weekSummary, setWeekSummary] = useState({ workouts: [], loading: true, error: null });

  const profileIncomplete = !user?.height || !user?.weight;
  const { today } = useMemo(() => getCurrentWeekRange(), []);
  const xpStats = useMemo(
    () => normalizeGamification(user?.gamification, gamification),
    [user?.gamification, gamification]
  );
  const kcalTodayFromWorkouts = useMemo(
    () =>
      weekSummary.workouts
        .filter((workout) => workout.date === today)
        .reduce((sum, workout) => sum + Number(workout.caloriesBurned || workout.caloriesTotal || 0), 0),
    [today, weekSummary.workouts]
  );
  const kcalToday = Number(user?.todayCalories ?? kcalTodayFromWorkouts ?? 0);
  const weekWorkouts = Number(user?.weekWorkouts ?? weekSummary.workouts.length ?? 0);

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

  if (loading && !gamification && !user?.gamification) {
    return <Spinner label="Loading your XP..." className="py-24" />;
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] space-y-6 rounded-3xl bg-[#0a0a0a] p-4 text-left text-white sm:p-6 lg:p-8">
      {profileIncomplete && <OnboardingModal user={user} onComplete={handleProfileUpdated} />}
      <ErrorBanner message={error || weekSummary.error} onRetry={refreshAll} />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.35em] text-[#c4ff00]">
            FitSync v2
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-4xl">
            Your XP dashboard
          </h1>
        </div>
        <Link
          to="/log"
          className="rounded-full border border-[#c4ff00] px-5 py-3 text-center text-xs font-black uppercase tracking-widest text-[#c4ff00] transition hover:bg-[#c4ff00] hover:text-black"
        >
          Log workout
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <LevelHero stats={xpStats} />
        <StreakCard currentStreak={xpStats.currentStreak} longestStreak={xpStats.longestStreak} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={CalendarDays} label="Workouts This Week" value={weekSummary.loading ? "…" : weekWorkouts.toLocaleString()} />
        <StatCard icon={Target} label="Kcal Today" value={weekSummary.loading ? "…" : kcalToday.toLocaleString()} />
        <StatCard icon={Zap} label="Total XP" value={xpStats.totalXp.toLocaleString()} />
      </div>
    </div>
  );
}
