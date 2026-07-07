import { Component, useState, useEffect, useCallback } from "react";
import { Outlet, NavLink, Navigate, useNavigate } from "react-router-dom";
import { Dumbbell, Home, BarChart3, User, Clock, Salad } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import Navbar from "../common/Navbar.jsx";
import LogoutConfirmDialog from "../modals/LogoutConfirmDialog.jsx";
import workoutService from "../../services/workoutService.js";
import progressService from "../../services/progressService.js";
import gamificationService from "../../services/gamificationService.js";

const MOBILE_LINKS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/log", label: "Log", icon: Dumbbell },
  { to: "/nutrition", label: "Nutrition", icon: Salad },
  { to: "/progress", label: "Progress", icon: BarChart3 },
  { to: "/workouts", label: "History", icon: Clock },
  { to: "/you", label: "Profile", icon: User }
];

class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Route render failed", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-left text-red-100">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-red-300">Page crashed</p>
          <h1 className="mt-2 text-2xl font-black text-red-50">This route failed to render.</h1>
          <pre className="mt-4 overflow-auto whitespace-pre-wrap rounded-xl bg-black/30 p-4 text-xs text-red-100">
            {this.state.error?.stack || this.state.error?.message || String(this.state.error)}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Shared shell for authenticated user pages. Loads reusable user data once and
 * keeps admin users on the separate admin shell.
 */
export default function AppLayout() {
  const { user, logout } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  function handleLogoutConfirm() {
    logout();
    navigate("/login", { replace: true });
  }

  const [data, setData] = useState({
    workouts: [],
    workoutTotal: 0,
    weightLogs: [],
    gamification: null,
    categories: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const [workoutRes, weightLogs, gamification, categories] = await Promise.all([
        workoutService.getWorkouts({ limit: 50, sort: "date_desc" }),
        progressService.getWeightLogs(),
        gamificationService.getSummary(),
        workoutService.getCategories()
      ]);
      setData({
        workouts: workoutRes.items || [],
        workoutTotal: workoutRes.total || 0,
        weightLogs: weightLogs || [],
        gamification,
        categories: categories || []
      });
      notifyNewBadges(gamification?.newlyUnlocked);
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

  const recordCheckin = useCallback(
    async (type) => {
      try {
        const summary = await gamificationService.checkin(type);
        setData((current) => ({ ...current, gamification: summary }));
        notifyNewBadges(summary?.newlyUnlocked);
        if (summary?.alreadyCheckedIn) {
          push("You've already checked in today. Streak is safe!", "info");
        } else {
          push(`${type} logged. Current streak: ${summary?.currentStreak ?? 0} day(s).`, "streak");
        }
      } catch (err) {
        push(err.message || "Could not record your check-in.", "info");
      }
    },
    [push, notifyNewBadges]
  );

  if (user && user.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const context = {
    user,
    ...data,
    loading,
    error,
    refreshAll,
    recordCheckin,
    push
  };

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col font-sans relative pb-20 md:pb-8 overflow-x-hidden">
      <Navbar onLogoutRequest={() => setIsLogoutDialogOpen(true)} />

      <main className="mx-auto w-full max-w-[1400px] px-4 sm:px-8 lg:px-12 pt-28 pb-6 bg-bg text-text flex-grow pb-24 md:pb-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-12">
            <RouteErrorBoundary>
              <Outlet context={context} />
            </RouteErrorBoundary>
          </div>
        </div>
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border px-2 py-2.5 flex items-center justify-around z-40">
        {MOBILE_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1.5 py-1 px-3 rounded-sm transition-all select-none ${
                isActive ? "text-primary" : "text-muted"
              }`
            }
          >
            <Icon className="h-4.5 w-4.5" aria-hidden="true" />
            <span className="text-[9px] font-bold uppercase tracking-wider font-mono">{label}</span>
          </NavLink>
        ))}
      </div>

      <footer className="bg-bg border-t border-border py-8 mt-12 text-center text-muted text-[10px] font-mono tracking-wide">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>FitSync &mdash; Fitness tracking</div>
          <div>&copy; 2026 FitSync</div>
          <div>Auto XP and calories</div>
        </div>
      </footer>

      <LogoutConfirmDialog
        open={isLogoutDialogOpen}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setIsLogoutDialogOpen(false)}
      />
    </div>
  );
}
