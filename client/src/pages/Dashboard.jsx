import { useEffect, useMemo, useState } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import authService from "../services/authService.js";
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

export default function Dashboard() {
  const {
    user: outletUser,
    gamification: outletGamification,
    loading,
    error,
    refreshAll
  } = useOutletContext();
  const { updateUser } = useAuth();
  const location = useLocation();
  const [authUser, setAuthUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [weekSummary, setWeekSummary] = useState({ workouts: [], loading: true, error: null });

  const user = useMemo(() => {
    const mergedUser = { ...(outletUser || {}), ...(authUser || {}) };
    return {
      ...mergedUser,
      gamification: authUser?.gamification || outletUser?.gamification || outletGamification || null
    };
  }, [authUser, outletGamification, outletUser]);

  const profileIncomplete = !user.height || !user.weight;
  const { today } = useMemo(() => getCurrentWeekRange(), []);
  const todayCalories = useMemo(
    () =>
      weekSummary.workouts
        .filter((workout) => workout.date === today)
        .reduce((sum, workout) => sum + Number(workout.caloriesBurned || workout.caloriesTotal || 0), 0),
    [today, weekSummary.workouts]
  );
  const weekWorkouts = weekSummary.workouts.length;

  useEffect(() => {
    let active = true;

    async function loadUser() {
      setAuthError(null);
      try {
        const currentUser = await authService.getMe();
        if (active) {
          setAuthUser(currentUser);
          updateUser(currentUser);
        }
      } catch (err) {
        if (active) setAuthError(err.message || "Could not load your profile.");
      }
    }

    loadUser();
    return () => {
      active = false;
    };
  }, [updateUser]);

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
    setAuthUser(updatedUser);
    refreshAll();
  }

  if (loading && !outletUser && !authUser) {
    return <Spinner label="Loading your home..." className="py-24" />;
  }

  return (
    <div className="bg-[#0a0a0a] text-left text-text pb-16">
      {profileIncomplete && <OnboardingModal user={user} onComplete={handleProfileUpdated} />}
      <ErrorBanner message={error || authError || weekSummary.error} onRetry={refreshAll} />

      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl mb-2">Good evening, {user.name}</h1>
        <p className="text-[#666] mb-8">Here is your fitness snapshot for today.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* XP HERO - spans 2 columns */}
          <div className="lg:col-span-2 bg-[#141414] rounded-xl p-8 border border-[#222]">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs text-[#666] uppercase tracking-wider">Level Progress</span>
              <span className="text-[#c4ff00] text-sm">⚡ {user.gamification?.total_xp || 0} XP</span>
            </div>

            <div className="flex items-end gap-6 mb-6">
              <div className="text-7xl font-bold text-[#c4ff00]">{user.gamification?.level || 1}</div>
              <div className="flex-1 pb-3">
                <div className="w-full bg-[#222] h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-[#c4ff00] h-3 transition-all"
                    style={{ width: `${(((user.gamification?.total_xp || 0) % 150) / 150) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-[#999] mt-2">
                  {150 - ((user.gamification?.total_xp || 0) % 150)} XP to Level {(user.gamification?.level || 1) + 1}
                </div>
              </div>
            </div>
          </div>

          {/* STREAK CARD */}
          <div className="bg-[#141414] rounded-xl p-6 border border-[#222]">
            <div className="text-xs text-[#666] uppercase mb-2">Current Streak</div>
            <div className="text-4xl font-bold text-[#c4ff00]">{user.gamification?.current_streak || 0}</div>
            <div className="text-sm text-[#999]">days</div>
          </div>
        </div>

        {/* 3-STAT GRID */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-[#141414] rounded-xl p-6 text-center border border-[#222]">
            <div className="text-3xl font-bold">{weekWorkouts || 0}</div>
            <div className="text-xs text-[#666] uppercase mt-1">Workouts This Week</div>
          </div>
          <div className="bg-[#141414] rounded-xl p-6 text-center border border-[#222]">
            <div className="text-3xl font-bold">{todayCalories || 0}</div>
            <div className="text-xs text-[#666] uppercase mt-1">Kcal Today</div>
          </div>
          <div className="bg-[#141414] rounded-xl p-6 text-center border border-[#222]">
            <div className="text-3xl font-bold text-[#c4ff00]">{user.gamification?.total_xp || 0}</div>
            <div className="text-xs text-[#666] uppercase mt-1">Total XP</div>
          </div>
        </div>
      </div>
    </div>
  );
}
