import { useEffect, useMemo, useState } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import { CalendarDays, Dumbbell, Layers, Sparkles } from "lucide-react";
import workoutService from "../services/workoutService.js";
import { useAuth } from "../context/AuthContext.jsx";
import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import MotivationCard from "../components/dashboard/MotivationCard.jsx";
import QuickLogButtons from "../components/dashboard/QuickLogButtons.jsx";
import OnboardingModal from "../components/modals/OnboardingModal.jsx";
import Spinner from "../components/common/Spinner.jsx";
import ErrorBanner from "../components/common/ErrorBanner.jsx";

function getCurrentWeekRange() {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const toDateInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const dateNum = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${dateNum}`;
  };

  return { monday: toDateInput(monday), sunday: toDateInput(sunday) };
}

function countSets(workouts = []) {
  return workouts.reduce(
    (total, workout) =>
      total +
      (workout.exercises || []).reduce(
        (exerciseTotal, exercise) => exerciseTotal + (exercise.sets?.length || 0),
        0
      ),
    0
  );
}

function CoachTip({ insight }) {
  return (
    <div className="bg-surface border border-border rounded-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">
            Coach tip
          </span>
          <h2 className="text-sm font-semibold text-text mt-0.5">Weekly AI insight</h2>
        </div>
        <Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
      </div>
      <p className="text-xs text-muted leading-relaxed">
        {insight?.summary || "No tip yet — log your first workout."}
      </p>
    </div>
  );
}

function WeekSummary({ loading, error, workouts }) {
  const totalSets = useMemo(() => countSets(workouts), [workouts]);

  return (
    <div className="bg-surface border border-border rounded-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">
            This week
          </span>
          <h2 className="text-sm font-semibold text-text mt-0.5">Week Summary</h2>
        </div>
        <CalendarDays className="h-5 w-5 text-accent" aria-hidden="true" />
      </div>
      {error && <p className="text-xs text-red-300">{error}</p>}
      {loading ? (
        <div className="text-xs text-muted">Loading this week...</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-sm bg-bg border border-border">
            <Dumbbell className="h-4 w-4 text-accent mb-3" aria-hidden="true" />
            <div className="text-3xl font-mono tabular-nums text-text font-semibold">
              {workouts.length}
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted mt-1">
              Workouts
            </div>
          </div>
          <div className="p-4 rounded-sm bg-bg border border-border">
            <Layers className="h-4 w-4 text-accent mb-3" aria-hidden="true" />
            <div className="text-3xl font-mono tabular-nums text-text font-semibold">
              {totalSets}
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted mt-1">
              Total sets
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Home page: beginner-friendly motivation, quick logging, coaching, and week volume. */
export default function Dashboard() {
  const { user, gamification, insights, loading, error, refreshAll, recordCheckin } =
    useOutletContext();
  const { updateUser } = useAuth();
  const location = useLocation();
  const [weekSummary, setWeekSummary] = useState({ workouts: [], loading: true, error: null });

  const profileIncomplete = !user.height || !user.weight;

  useEffect(() => {
    let active = true;

    async function loadWeek() {
      setWeekSummary((current) => ({ ...current, loading: true, error: null }));
      try {
        const { monday, sunday } = getCurrentWeekRange();
        const result = await workoutService.getWorkouts({ from: monday, to: sunday, limit: 50 });
        if (active) {
          setWeekSummary({ workouts: result.items || [], loading: false, error: null });
        }
      } catch (err) {
        if (active) {
          setWeekSummary({
            workouts: [],
            loading: false,
            error: err.message || "Could not load this week's workouts."
          });
        }
      }
    }

    if (location.pathname === "/") {
      loadWeek();
    }
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
      <ErrorBanner message={error} onRetry={refreshAll} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <MotivationCard gamification={gamification} onCheckin={recordCheckin} busy={loading} />
          <QuickLogButtons />
        </div>
        <div className="space-y-6">
          <CoachTip insight={insights?.[0]} />
          <WeekSummary {...weekSummary} />
        </div>
      </div>
    </div>
  );
}
