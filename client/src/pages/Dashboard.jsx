import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import DashboardView from "../components/DashboardView.jsx";
import WorkoutView from "../components/WorkoutView.jsx";
import WeightTrackerView from "../components/WeightTrackerView.jsx";
import WeeklyInsightsView from "../components/WeeklyInsightsView.jsx";
import Navbar from "../components/common/Navbar.jsx";
import { Dumbbell, Scale, Sparkles, LayoutDashboard, Plus, Zap, X, Flame, Trophy, Check } from "lucide-react";
import { saveLocalCheckin, formatDateStr, getLocalCheckins, calculateStreakStats } from "../utils/workoutUtils.js";
import workoutService from "../services/workoutService.js";
import progressService from "../services/progressService.js";

/**
 * Dashboard page - main user fitness tracking interface.
 * Contains tab navigation between Overview, Workouts, Weights, and AI Insights.
 */
export default function Dashboard() {
  const { user, token, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [workouts, setWorkouts] = useState([]);
  const [weightLogs, setWeightLogs] = useState([]);
  const [insights, setInsights] = useState([]);
  const [isFABOpen, setIsFABOpen] = useState(false);
  const [prefilledTemplate, setPrefilledTemplate] = useState(null);
  const [toast, setToast] = useState(null);

  function triggerToast(msg, type = "success") {
    setToast({ msg, type, id: Date.now() });
  }

  // Auto disappear toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load user collections
  async function loadUserCollections() {
    if (!token || !user) return;
    try {
      const [workoutData, weightData, insightData] = await Promise.all([
        workoutService.getWorkouts(),
        progressService.getWeightLogs(),
        progressService.getInsights(),
      ]);
      setWorkouts(workoutData);
      setWeightLogs(weightData);
      setInsights(insightData);
    } catch (err) {
      console.error("Error fetching dashboard records:", err);
    }
  }

  useEffect(() => {
    if (token && user && user.role === "user") {
      loadUserCollections();
    }
  }, [token, user]);

  function handleProfileUpdated(updatedUser) {
    updateUser(updatedUser);
    loadUserCollections();
  }

  function handleSelectTemplate(templatePayload) {
    setPrefilledTemplate(templatePayload);
    setActiveTab("workouts");
    triggerToast(`Prefilled workout form with "${templatePayload.title}" template!`, "info");
  }

  function handleDrawerHabitCheck(habit) {
    if (!user) return;
    const todayStr = formatDateStr(new Date());
    saveLocalCheckin(user.id, todayStr);
    loadUserCollections();
    setIsFABOpen(false);
    const stats = calculateStreakStats(user, workouts, weightLogs);
    triggerToast(`Logged ${habit}! Daily habit streak holds steady at ${stats.currentStreak} Days!`, "streak");
  }

  async function handleDrawerQuickWorkout(presetName, duration, calories, exercise, categoryId, categoryName) {
    if (!token || !user) return;
    setIsFABOpen(false);
    triggerToast(`Broadcasting immediate ${presetName} workout metrics...`, "info");
    const todayStr = formatDateStr(new Date());
    const payload = {
      date: todayStr,
      title: `${presetName} Quick Log`,
      notes: "Auto-logged with one-tap Fast Track shortcut.",
      exercises: [{
        categoryId, categoryName, exerciseName: exercise,
        duration, caloriesBurned: calories, sets: [{ reps: 1, weight: 0 }]
      }]
    };
    try {
      await workoutService.createWorkout(payload);
      loadUserCollections();
      triggerToast(`Awesome! Recorded ${presetName} (+${calories}kcal). Daily streak incremented!`, "success");
    } catch (err) {
      triggerToast("Could not register instant workout.", "info");
    }
  }

  const todayStr = formatDateStr(new Date());
  const checks = user ? getLocalCheckins(user.id) : [];
  const isTodayChecked = checks.includes(todayStr);

  return (
    <div id="app-viewport-frame" className="min-h-screen bg-gradient-to-b from-[#0A0A0A] to-[#050505] text-[#E0E0E0] flex flex-col font-sans relative pb-20 md:pb-8">

      {/* GLOBAL TOASTER */}
      {toast && (
        <div id="global-toast" className="fixed top-6 right-6 z-50 animate-slide-in flex items-center gap-3.5 px-4.5 py-3.5 rounded-sm shadow-2xl border bg-[#0E0E0E] max-w-sm" style={{
          borderColor: toast.type === "streak" ? "rgba(245, 158, 11, 0.4)" :
            toast.type === "milestone" ? "rgba(234, 179, 8, 0.4)" :
              toast.type === "info" ? "rgba(255, 255, 255, 0.2)" :
                "rgba(16, 185, 129, 0.4)"
        }}>
          {toast.type === "streak" && (<span className="h-9 w-9 bg-amber-950/20 text-amber-500 rounded-sm flex items-center justify-center border border-amber-900/40"><Flame className="h-5 w-5 fill-current animate-bounce" /></span>)}
          {toast.type === "milestone" && (<span className="h-9 w-9 bg-yellow-950/20 text-yellow-500 rounded-sm flex items-center justify-center border border-yellow-900/40"><Trophy className="h-5 w-5 fill-current animate-pulse" /></span>)}
          {toast.type === "success" && (<span className="h-9 w-9 bg-emerald-950/20 text-emerald-400 rounded-sm flex items-center justify-center border border-emerald-900/40"><Check className="h-5 w-5 stroke-[3]" /></span>)}
          {toast.type === "info" && (<span className="h-9 w-9 bg-white/5 text-neutral-400 rounded-sm flex items-center justify-center border border-white/10"><Zap className="h-4 w-4" /></span>)}
          <div>
            <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#FFFFFF]/50 font-semibold">
              {toast.type === "streak" ? "Streak Gained" : toast.type === "milestone" ? "Badge Unlocked" : toast.type === "info" ? "System Notice" : "Action Success"}
            </h4>
            <p className="text-xs text-[#FFFFFF] font-sans font-medium mt-0.5 leading-tight">{toast.msg}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {activeTab === "dashboard" && (
          <DashboardView user={user} workouts={workouts} weightLogs={weightLogs}
            onNavigateToWorkouts={() => setActiveTab("workouts")}
            onNavigateToWeights={() => setActiveTab("weights")}
            onNavigateToInsights={() => setActiveTab("insights")}
            onProfileUpdated={handleProfileUpdated}
            onSelectTemplate={handleSelectTemplate}
            triggerToast={triggerToast} />
        )}
        {activeTab === "workouts" && (
          <WorkoutView workouts={workouts} onWorkoutLogged={loadUserCollections}
            prefilledTemplate={prefilledTemplate}
            onClearPrefilledTemplate={() => setPrefilledTemplate(null)}
            triggerToast={triggerToast} />
        )}
        {activeTab === "weights" && (
          <WeightTrackerView user={user} weightLogs={weightLogs}
            onWeightLogged={loadUserCollections} triggerToast={triggerToast} />
        )}
        {activeTab === "insights" && (
          <WeeklyInsightsView insights={insights} onInsightGenerated={loadUserCollections} />
        )}
      </main>

      {/* Sticky Bottom Navigation Mobile */}
      <div id="sticky-bottom-nav" className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0E0E0E] border-t border-neutral-800 px-2 py-2.5 flex items-center justify-around z-40 shadow-2xl">
        <button onClick={() => setActiveTab("dashboard")} className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded transition-all cursor-pointer select-none ${activeTab === "dashboard" ? "text-white" : "text-neutral-500"}`}>
          <LayoutDashboard className="h-4.5 w-4.5" /><span className="text-[9px] font-bold uppercase tracking-wider font-mono">Overview</span>
        </button>
        <button onClick={() => setActiveTab("workouts")} className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded transition-all cursor-pointer select-none ${activeTab === "workouts" ? "text-white" : "text-neutral-500"}`}>
          <Dumbbell className="h-4.5 w-4.5" /><span className="text-[9px] font-bold uppercase tracking-wider font-mono">Workouts</span>
        </button>
        <button onClick={() => setActiveTab("weights")} className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded transition-all cursor-pointer select-none ${activeTab === "weights" ? "text-white" : "text-neutral-500"}`}>
          <Scale className="h-4.5 w-4.5" /><span className="text-[9px] font-bold uppercase tracking-wider font-mono">Weights</span>
        </button>
        <button onClick={() => setActiveTab("insights")} className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded transition-all cursor-pointer select-none ${activeTab === "insights" ? "text-white" : "text-neutral-500"}`}>
          <Sparkles className="h-4.5 w-4.5 text-emerald-400" /><span className="text-[9px] font-bold uppercase tracking-wider font-mono">Insights</span>
        </button>
      </div>

      {/* FAB Button Mobile */}
      <button onClick={() => setIsFABOpen(true)} className="md:hidden fixed bottom-20 right-6 h-12 w-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-2xl z-40 transition-all select-none duration-250 hover:scale-110 active:scale-95 border border-emerald-300/30" title="Quick Actions">
        <Plus className="h-6 w-6 stroke-[3]" />
      </button>

      {/* FAB Drawer */}
      {isFABOpen && (
        <div id="fab-drawer-overlay" className="fixed inset-0 bg-black/85 z-50 flex items-end justify-center animate-fade-in backdrop-blur-xs">
          <div className="bg-[#0E0E0E] w-full rounded-t-lg border-t border-neutral-800 p-6 space-y-5 shadow-2xl max-w-md animate-slide-up">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-900">
              <div className="flex items-center gap-1.5">
                <Zap className="h-4.5 w-4.5 text-emerald-400" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white">Athlete Quick Hub</h4>
              </div>
              <button onClick={() => setIsFABOpen(false)} className="h-7 w-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 text-xs font-sans text-left">
              <div className="space-y-2">
                <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-neutral-500">Quick Wellness logs</span>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleDrawerHabitCheck("Hydration Check")} className="p-2.5 rounded-sm bg-neutral-950 border border-neutral-800 text-left hover:border-emerald-500/20 text-neutral-300 font-semibold">Drink 3L+ Water</button>
                  <button onClick={() => handleDrawerHabitCheck("Stretch & Recovery")} className="p-2.5 rounded-sm bg-neutral-950 border border-neutral-800 text-left hover:border-emerald-500/20 text-neutral-300 font-semibold">Stretch routine</button>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-neutral-500">Fast Track Logs</span>
                <div className="space-y-2">
                  <button onClick={() => handleDrawerQuickWorkout("Walk", 20, 110, "Active Wellness Walking", "cat_1", "Cardio Training")} className="w-full p-2.5 rounded-sm bg-neutral-950 border border-neutral-800 flex justify-between items-center text-neutral-300 text-left font-semibold">
                    <span>Power Walk Shortcut</span><span className="text-[10px] font-mono font-normal text-emerald-400">110 kcal</span>
                  </button>
                  <button onClick={() => handleDrawerQuickWorkout("Circuit Lifts", 35, 230, "Heavy Gym Split", "cat_3", "Strength & Core")} className="w-full p-2.5 rounded-sm bg-neutral-950 border border-neutral-800 flex justify-between items-center text-neutral-300 text-left font-semibold">
                    <span>Gym Weight Split</span><span className="text-[10px] font-mono font-normal text-emerald-400">230 kcal</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#050505] border-t border-white/5 py-8 mt-12 text-center text-white/30 text-[10px] font-mono tracking-wide">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>CONNECTED SERVICES: FitSync MySQL Active Schema</div>
          <div>FitSync AI Platform &copy; 2026</div>
          <div>POWERED BY GEMINI PRO METRICS INTELLIGENCE</div>
        </div>
      </footer>
    </div>
  );
}
