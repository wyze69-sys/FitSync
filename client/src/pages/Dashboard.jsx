import { useOutletContext, useNavigate, Link } from "react-router-dom";
import { Dumbbell, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import DashboardStreakCard from "../components/dashboard/DashboardStreakCard.jsx";
import DashboardBadges from "../components/dashboard/DashboardBadges.jsx";
import DashboardQuickActions from "../components/dashboard/DashboardQuickActions.jsx";
import DashboardWorkoutTemplates from "../components/dashboard/DashboardWorkoutTemplates.jsx";
import DashboardStats from "../components/dashboard/DashboardStats.jsx";
import DashboardCharts from "../components/dashboard/DashboardCharts.jsx";
import DashboardInsightsCard from "../components/dashboard/DashboardInsightsCard.jsx";
import DashboardProfileSummary from "../components/dashboard/DashboardProfileSummary.jsx";
import OnboardingModal from "../components/modals/OnboardingModal.jsx";
import Spinner from "../components/common/Spinner.jsx";
import ErrorBanner from "../components/common/ErrorBanner.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import { todayStr } from "../utils/workoutUtils.js";

/**
 * User dashboard overview. Composes small, focused dashboard components and
 * reads shared data + actions from the AppLayout via Outlet context.
 */
export default function Dashboard() {
  const {
    user,
    workouts,
    workoutTotal,
    weightLogs,
    gamification,
    insights,
    loading,
    error,
    refreshAll,
    logQuickWorkout,
    recordCheckin,
    push
  } = useOutletContext();
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const profileIncomplete = !user.height || !user.weight;
  const checkedInToday = gamification?.lastActiveDate === todayStr();

  function handleProfileUpdated(updatedUser) {
    updateUser(updatedUser);
    refreshAll();
  }

  function handleSelectTemplate(template) {
    push(`Loaded the "${template.title}" template into the workout form.`, "info");
    navigate("/workouts", { state: { template } });
  }

  if (loading && !gamification) {
    return <Spinner label="Loading your dashboard..." className="py-24" />;
  }

  return (
    <div className="space-y-8 text-left text-neutral-200 pb-16">
      {profileIncomplete && <OnboardingModal user={user} onComplete={handleProfileUpdated} />}

      <DashboardHeader user={user} />
      <ErrorBanner message={error} onRetry={refreshAll} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardStreakCard gamification={gamification} />
        <DashboardBadges badges={gamification?.badges || []} />
        <div className="lg:hidden">
          <DashboardQuickActions
            onQuickLog={logQuickWorkout}
            onCheckin={recordCheckin}
            checkedInToday={checkedInToday}
            busy={loading}
          />
        </div>
      </div>

      <div className="hidden lg:block">
        <DashboardQuickActions
          onQuickLog={logQuickWorkout}
          onCheckin={recordCheckin}
          checkedInToday={checkedInToday}
          busy={loading}
        />
      </div>

      <DashboardWorkoutTemplates onSelectTemplate={handleSelectTemplate} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <DashboardCharts weightLogs={weightLogs} targetWeight={user.targetWeight} />
          <DashboardStats
            gamification={gamification}
            workoutTotal={workoutTotal}
            user={user}
            weightLogs={weightLogs}
          />
        </div>
        <DashboardProfileSummary
          user={user}
          onProfileUpdated={handleProfileUpdated}
          onToast={push}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">
                Recorded workouts
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5 font-serif italic">
                Recent Sessions
              </h3>
            </div>
            <Link
              to="/workouts"
              className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1 font-serif italic transition-all"
            >
              View all
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {workouts.length > 0 ? (
            <div className="space-y-4">
              {workouts.slice(0, 3).map((workout) => (
                <div
                  key={workout.id}
                  className="p-4 rounded-sm border border-neutral-800 bg-[#0E0E0E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:bg-neutral-900/60"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400 text-[9px] font-mono uppercase font-bold tracking-widest">
                        {workout.date}
                      </span>
                      <h4 className="text-sm font-semibold text-white font-serif italic">
                        {workout.title}
                      </h4>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {workout.exercises.map((exercise) => exercise.exerciseName).join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-xs font-mono shrink-0">
                    <div className="text-left">
                      <div className="text-neutral-500 uppercase text-[9px] font-bold tracking-wider">
                        Duration
                      </div>
                      <div className="font-semibold text-white mt-0.5">
                        {workout.durationTotal}m
                      </div>
                    </div>
                    <div className="text-left border-l border-neutral-800 pl-6">
                      <div className="text-neutral-500 uppercase text-[9px] font-bold tracking-wider">
                        Calories
                      </div>
                      <div className="font-extrabold text-emerald-400 mt-0.5">
                        {workout.caloriesTotal} kcal
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Dumbbell}
              title="No workouts logged yet"
              description="Record your walks, runs, lifts, or wellness actions to start building trends."
              action={
                <Link
                  to="/workouts"
                  className="px-5 py-1.5 bg-neutral-900 hover:bg-white hover:text-black border border-neutral-800 transition-all text-[10px] font-bold uppercase tracking-widest rounded-sm text-white"
                >
                  Log first workout
                </Link>
              }
            />
          )}
        </div>

        <DashboardInsightsCard latestInsight={insights?.[0]} />
      </div>
    </div>
  );
}
