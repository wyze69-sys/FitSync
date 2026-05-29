import { useState, useEffect, useCallback } from "react";
import { Outlet, NavLink, Navigate } from "react-router-dom";
import { Dumbbell, Scale, Sparkles, LayoutDashboard, Plus, Zap, X, Droplets } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import Navbar from "../common/Navbar.jsx";
import workoutService from "../../services/workoutService.js";
import progressService from "../../services/progressService.js";
import insightService from "../../services/insightService.js";
import gamificationService from "../../services/gamificationService.js";
import { QUICK_PRESETS } from "../../utils/constants.js";
import { todayStr } from "../../utils/workoutUtils.js";

const MOBILE_LINKS = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/workouts", label: "Workouts", icon: Dumbbell },
  { to: "/progress", label: "Progress", icon: Scale },
  { to: "/insights", label: "Insights", icon: Sparkles }
];

/**
 * Shared shell for all authenticated user pages. Loads the data used across the
 * dashboard/workouts/progress/insights views once and exposes it (plus refresh
 * and quick-action helpers) to nested routes via Outlet context.
 */
export default function AppLayout() {
  const { user } = useAuth();
  const { push } = useToast();

  const [data, setData] = useState({
    workouts: [],
    workoutTotal: 0,
    weightLogs: [],
    insights: [],
    gamification: null,
    categories: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFabOpen, setIsFabOpen] = useState(false);

  const notifyNewBadges = useCallback(
    (newlyUnlocked) => {
      (newlyUnlocked || []).forEach((badge) => {
        push(`Achievement unlocked: ${badge.name}.`, "milestone");
      });
    },
    [push]
  );

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [workoutRes, weightLogs, insights, gamification, categories] = await Promise.all([
        workoutService.getWorkouts({ limit: 50, sort: "date_desc" }),
        progressService.getWeightLogs(),
        insightService.getInsights(),
        gamificationService.getSummary(),
        workoutService.getCategories()
      ]);
      setData({
        workouts: workoutRes.items,
        workoutTotal: workoutRes.total,
        weightLogs,
        insights,
        gamification,
        categories
      });
      notifyNewBadges(gamification.newlyUnlocked);
    } catch (err) {
      setError(err.message || "We couldn't load your data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [notifyNewBadges]);

  useEffect(() => {
    if (user && user.role === "user") {
      refreshAll();
    }
  }, [user, refreshAll]);

  const logQuickWorkout = useCallback(
    async (preset) => {
      setIsFabOpen(false);
      try {
        await workoutService.createWorkout({
          date: todayStr(),
          title: `${preset.label} Quick Log`,
          notes: "Logged with a one-tap quick action.",
          exercises: [
            {
              categoryId: preset.categoryId,
              categoryName: preset.categoryName,
              exerciseName: preset.exercise,
              duration: preset.duration,
              caloriesBurned: preset.calories,
              sets: [{ reps: 1, weight: 0 }]
            }
          ]
        });
        push(`Logged ${preset.label} (+${preset.calories} kcal).`, "success");
        await refreshAll();
      } catch (err) {
        push(err.message || "Could not log that workout.", "info");
      }
    },
    [push, refreshAll]
  );

  const recordCheckin = useCallback(
    async (type) => {
      setIsFabOpen(false);
      try {
        const summary = await gamificationService.checkin(type);
        setData((current) => ({ ...current, gamification: summary }));
        notifyNewBadges(summary.newlyUnlocked);
        if (summary.alreadyCheckedIn) {
          push("You've already checked in today. Streak is safe!", "info");
        } else {
          push(`${type} logged. Current streak: ${summary.currentStreak} day(s).`, "streak");
        }
      } catch (err) {
        push(err.message || "Could not record your check-in.", "info");
      }
    },
    [push, notifyNewBadges]
  );

  // Admins use a dedicated portal, not this user shell.
  if (user && user.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const context = {
    user,
    ...data,
    loading,
    error,
    refreshAll,
    logQuickWorkout,
    recordCheckin,
    push
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0A] to-[#050505] text-[#E0E0E0] flex flex-col font-sans relative pb-20 md:pb-8">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        <Outlet context={context} />
      </main>

      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0E0E0E] border-t border-neutral-800 px-2 py-2.5 flex items-center justify-around z-40 shadow-2xl">
        {MOBILE_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1.5 py-1 px-3 rounded transition-all select-none ${
                isActive ? "text-white" : "text-neutral-500"
              }`
            }
          >
            <Icon className="h-4.5 w-4.5" aria-hidden="true" />
            <span className="text-[9px] font-bold uppercase tracking-wider font-mono">{label}</span>
          </NavLink>
        ))}
      </div>

      {/* Quick-action FAB */}
      <button
        type="button"
        onClick={() => setIsFabOpen(true)}
        aria-label="Open quick actions"
        className="md:hidden fixed bottom-20 right-6 h-12 w-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-2xl z-40 transition-all hover:scale-110 active:scale-95 border border-emerald-300/30"
      >
        <Plus className="h-6 w-6 stroke-[3]" />
      </button>

      {isFabOpen && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-end justify-center animate-fade-in backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Quick actions"
          onClick={() => setIsFabOpen(false)}
        >
          <div
            className="bg-[#0E0E0E] w-full rounded-t-lg border-t border-neutral-800 p-6 space-y-5 shadow-2xl max-w-md animate-slide-up"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-neutral-900">
              <div className="flex items-center gap-1.5">
                <Zap className="h-4.5 w-4.5 text-emerald-400" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-white">
                  Quick Actions
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFabOpen(false)}
                aria-label="Close quick actions"
                className="h-7 w-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans text-left">
              <div className="space-y-2">
                <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-neutral-500">
                  Daily wellness
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => recordCheckin("Hydration check-in")}
                    className="p-2.5 rounded-sm bg-neutral-950 border border-neutral-800 text-left hover:border-emerald-500/30 text-neutral-300 font-semibold flex items-center gap-2"
                  >
                    <Droplets className="h-4 w-4 text-sky-400" />
                    Hydration (3L+)
                  </button>
                  <button
                    type="button"
                    onClick={() => recordCheckin("Stretch & recovery check-in")}
                    className="p-2.5 rounded-sm bg-neutral-950 border border-neutral-800 text-left hover:border-emerald-500/30 text-neutral-300 font-semibold flex items-center gap-2"
                  >
                    <Zap className="h-4 w-4 text-amber-400" />
                    Stretch routine
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-neutral-500">
                  Fast workout logs
                </span>
                <div className="space-y-2">
                  {QUICK_PRESETS.slice(0, 3).map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => logQuickWorkout(preset)}
                      className="w-full p-2.5 rounded-sm bg-neutral-950 border border-neutral-800 flex justify-between items-center text-neutral-300 text-left font-semibold hover:border-emerald-500/30"
                    >
                      <span>{preset.label}</span>
                      <span className="text-[10px] font-mono font-normal text-emerald-400">
                        {preset.calories} kcal
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-[#050505] border-t border-white/5 py-8 mt-12 text-center text-white/30 text-[10px] font-mono tracking-wide">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>FitSync &mdash; Fitness tracking</div>
          <div>&copy; 2026 FitSync</div>
          <div>Weekly insights powered by Gemini</div>
        </div>
      </footer>
    </div>
  );
}
