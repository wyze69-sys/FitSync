/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import { Dumbbell, Scale, Sparkles, LayoutDashboard, ShieldCheck, LogOut, Menu, X, Plus, Trophy, Check, Zap, Flame } from 'lucide-react';
import AuthScreen from './components/AuthScreen.jsx';
import DashboardView from './components/DashboardView.jsx';
import WorkoutView from './components/WorkoutView.jsx';
import WeightTrackerView from './components/WeightTrackerView.jsx';
import WeeklyInsightsView from './components/WeeklyInsightsView.jsx';
import AdminPortalView from './components/AdminPortalView.jsx';
import { saveLocalCheckin, formatDateStr, getLocalCheckins, calculateStreakStats } from './utils/workoutUtils.js';
export default function App() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    // Database cached states
    const [workouts, setWorkouts] = useState([]);
    const [weightLogs, setWeightLogs] = useState([]);
    const [insights, setInsights] = useState([]);
    // Mobile navigation overlay and FAB state
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isFABOpen, setIsFABOpen] = useState(false);
    const [loadingDb, setLoadingDb] = useState(false);
    // Template pre-load link state
    const [prefilledTemplate, setPrefilledTemplate] = useState(null);
    // Unified global toaster notification state
    const [toast, setToast] = useState(null);
    function triggerToast(msg, type = 'success') {
        setToast({ msg, type, id: Date.now() });
    }
    // Auto disappear alert toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => {
                setToast(null);
            }, 5500);
            return () => clearTimeout(timer);
        }
    }, [toast]);
    // Authenticate user on page load
    useEffect(() => {
        const cachedToken = localStorage.getItem('fitsync_token');
        if (cachedToken) {
            setToken(cachedToken);
            verifySession(cachedToken);
        }
    }, []);
    async function verifySession(authToken) {
        try {
            const resp = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (resp.ok) {
                const userData = await resp.json();
                setUser(userData);
                if (userData.role === 'admin') {
                    setActiveTab('admin');
                }
            }
            else {
                handleLogout();
            }
        }
        catch (err) {
            console.error('Session validation failed. Re-auth required:', err);
            handleLogout();
        }
    }
    // Load user-specific tracking collections
    async function loadUserCollections() {
        if (!token || !user)
            return;
        setLoadingDb(true);
        try {
            // 1. Fetch workouts
            const workResp = await fetch('/api/workouts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (workResp.ok) {
                setWorkouts(await workResp.json());
            }
            // 2. Fetch Weight Records
            const weightResp = await fetch('/api/weights', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (weightResp.ok) {
                setWeightLogs(await weightResp.json());
            }
            // 3. Fetch AI Insights History
            const insResp = await fetch('/api/ai/insights', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (insResp.ok) {
                setInsights(await insResp.json());
            }
        }
        catch (err) {
            console.error('Error fetching dashboard records:', err);
        }
        finally {
            setLoadingDb(false);
        }
    }
    // Trigger loading collections on user change
    useEffect(() => {
        if (token && user && user.role === 'user') {
            loadUserCollections();
        }
    }, [token, user]);
    function handleLoginSuccess(loggedInUser, sessionToken) {
        localStorage.setItem('fitsync_token', sessionToken);
        setToken(sessionToken);
        setUser(loggedInUser);
        if (loggedInUser.role === 'admin') {
            setActiveTab('admin');
        }
        else {
            setActiveTab('dashboard');
        }
        triggerToast(`Welcome back, ${loggedInUser.name}! Initializing database... 🤝`, 'success');
    }
    function handleLogout() {
        localStorage.removeItem('fitsync_token');
        setToken(null);
        setUser(null);
        setWorkouts([]);
        setWeightLogs([]);
        setInsights([]);
        setActiveTab('dashboard');
        setIsMobileMenuOpen(false);
        setIsFABOpen(false);
    }
    // Helper to sync updated profile
    function handleProfileUpdated(updatedUser) {
        setUser(updatedUser);
        loadUserCollections(); // Reload collections to reflect any changes in weight logs
    }
    // Handle template selection from dashboard
    function handleSelectTemplate(templatePayload) {
        setPrefilledTemplate(templatePayload);
        setActiveTab('workouts');
        triggerToast(`Prefilled workout form with "${templatePayload.title}" template! ⚡`, 'info');
    }
    // Quick HABIT logs from global bottom drawer
    function handleDrawerHabitCheck(habit) {
        if (!user)
            return;
        const todayStr = formatDateStr(new Date());
        saveLocalCheckin(user.id, todayStr);
        loadUserCollections(); // trigger updates
        setIsFABOpen(false);
        const stats = calculateStreakStats(user, workouts, weightLogs);
        triggerToast(`Logged ${habit}! Daily habit streak holds steady at ${stats.currentStreak} Days! 🔥`, 'streak');
    }
    // Quick WORKOUT log shortcut from bottom drawer
    async function handleDrawerQuickWorkout(presetName, duration, calories, exercise, categoryId, categoryName) {
        if (!token || !user)
            return;
        setIsFABOpen(false);
        triggerToast(`Broadcasting immediate ${presetName} workout metrics...`, 'info');
        const todayStr = formatDateStr(new Date());
        const payload = {
            date: todayStr,
            title: `${presetName} Quick Log`,
            notes: "Auto-logged with one-tap Fast Track shortcut.",
            exercises: [
                {
                    categoryId,
                    categoryName,
                    exerciseName: exercise,
                    duration,
                    caloriesBurned: calories,
                    sets: [{ reps: 1, weight: 0 }]
                }
            ]
        };
        try {
            const resp = await fetch('/api/workouts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (!resp.ok) {
                throw new Error('Quick log insert failed.');
            }
            loadUserCollections();
            triggerToast(`Awesome! Recorded ${presetName} (+${calories}kcal). Daily streak incremented! 🔥`, 'success');
        }
        catch (err) {
            triggerToast('Could not register instant workout.', 'info');
        }
    }
    if (!token || !user) {
        return <AuthScreen onLoginSuccess={handleLoginSuccess}/>;
    }
    const todayStr = formatDateStr(new Date());
    const checks = user ? getLocalCheckins(user.id) : [];
    const isTodayChecked = checks.includes(todayStr);
    return (<div id="app-viewport-frame" className="min-h-screen bg-gradient-to-b from-[#0A0A0A] to-[#050505] text-[#E0E0E0] flex flex-col font-sans relative pb-20 md:pb-8">
      
      {/* GLOBAL TOASTER FLOATING POPUP CELEBRATION */}
      {toast && (<div id="global-toast" className="fixed top-6 right-6 z-50 animate-slide-in flex items-center gap-3.5 px-4.5 py-3.5 rounded-sm shadow-2xl border bg-[#0E0E0E] max-w-sm" style={{
                borderColor: toast.type === 'streak' ? 'rgba(245, 158, 11, 0.4)' :
                    toast.type === 'milestone' ? 'rgba(234, 179, 8, 0.4)' :
                        toast.type === 'info' ? 'rgba(255, 255, 255, 0.2)' :
                            'rgba(16, 185, 129, 0.4)'
            }}>
          {toast.type === 'streak' && (<span className="h-9 w-9 bg-amber-950/20 text-amber-500 rounded-sm flex items-center justify-center border border-amber-900/40">
              <Flame className="h-5 w-5 fill-current animate-bounce"/>
            </span>)}
          {toast.type === 'milestone' && (<span className="h-9 w-9 bg-yellow-950/20 text-yellow-500 rounded-sm flex items-center justify-center border border-yellow-900/40">
              <Trophy className="h-5 w-5 fill-current animate-pulse"/>
            </span>)}
          {toast.type === 'success' && (<span className="h-9 w-9 bg-emerald-950/20 text-emerald-400 rounded-sm flex items-center justify-center border border-emerald-900/40">
              <Check className="h-5 w-5 stroke-[3]"/>
            </span>)}
          {toast.type === 'info' && (<span className="h-9 w-9 bg-white/5 text-neutral-400 rounded-sm flex items-center justify-center border border-white/10">
              <Zap className="h-4 w-4"/>
            </span>)}
          <div>
            <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#FFFFFF]/50 font-semibold">
              {toast.type === 'streak' ? 'Streak Gained 🔥' :
                toast.type === 'milestone' ? 'Badge Unlocked 🏆' :
                    toast.type === 'info' ? 'System Notice ⚡' : 'Action Success'}
            </h4>
            <p className="text-xs text-[#FFFFFF] font-sans font-medium mt-0.5 leading-tight">{toast.msg}</p>
          </div>
        </div>)}

      {/* Navigation Shell */}
      <nav id="navbar" className="bg-[#0A0A0A] border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            {/* Logo Brand */}
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 bg-white/5 border border-white/10 rounded flex items-center justify-center text-white">
                <Dumbbell className="h-5 w-5 text-emerald-400"/>
              </div>
              <span className="font-serif tracking-tight italic text-xl font-bold text-white select-none">FitSync AI</span>
            </div>

            {/* Desktop Nav Actions */}
            <div className="hidden md:flex items-center space-x-6 text-xs uppercase tracking-widest text-white/50 font-sans">
              {user.role === 'user' && (<>
                  <button onClick={() => setActiveTab('dashboard')} className={`h-full px-1 transition-all cursor-pointer flex items-center gap-1.5 border-b-2 font-semibold ${activeTab === 'dashboard' ? 'text-white border-white' : 'border-transparent hover:text-white'}`}>
                    <LayoutDashboard className="h-3.5 w-3.5"/>
                    Overview
                  </button>

                  <button onClick={() => setActiveTab('workouts')} className={`h-full px-1 transition-all cursor-pointer flex items-center gap-1.5 border-b-2 font-semibold ${activeTab === 'workouts' ? 'text-white border-white' : 'border-transparent hover:text-white'}`}>
                    <Dumbbell className="h-3.5 w-3.5"/>
                    Workouts
                  </button>

                  <button onClick={() => setActiveTab('weights')} className={`h-full px-1 transition-all cursor-pointer flex items-center gap-1.5 border-b-2 font-semibold ${activeTab === 'weights' ? 'text-white border-white' : 'border-transparent hover:text-white'}`}>
                    <Scale className="h-3.5 w-3.5"/>
                    Weights
                  </button>

                  <button onClick={() => setActiveTab('insights')} className={`h-full px-1 transition-all cursor-pointer flex items-center gap-1.5 border-b-2 font-semibold ${activeTab === 'insights' ? 'text-white border-white' : 'border-transparent hover:text-white'}`}>
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400"/>
                    AI Insights
                  </button>
                </>)}

              {user.role === 'admin' && (<button onClick={() => setActiveTab('admin')} className={`h-full px-1 transition-all cursor-pointer flex items-center gap-1.5 border-b-2 font-semibold ${activeTab === 'admin' ? 'text-white border-white' : 'border-transparent hover:text-white'}`}>
                  <ShieldCheck className="h-3.5 w-3.5"/>
                  Admin Controls
                </button>)}
            </div>

            {/* User Meta logout dropdown */}
            <div className="hidden md:flex items-center gap-4 border-l border-white/10 pl-4 font-sans text-xs">
              <div className="text-right">
                <div className="font-semibold text-white line-clamp-1">{user.name}</div>
                <div className="text-[9px] uppercase font-mono tracking-widest text-white/40 capitalize">{user.role} Account</div>
              </div>
              
              <button type="button" onClick={handleLogout} className="h-8 w-8 rounded bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 flex items-center justify-center transition-all cursor-pointer" title="Log out of FitSync Account">
                <LogOut className="h-4 w-4"/>
              </button>
            </div>

            {/* Mobile menu trigger */}
            <div className="flex items-center md:hidden animate-fade-in">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="h-10 w-10 text-white/70 hover:text-white flex items-center justify-center rounded hover:bg-white/5 select-none">
                {isMobileMenuOpen ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation List */}
        {isMobileMenuOpen && (<div className="md:hidden bg-[#0A0A0A] border-t border-white/10 px-4 py-3 space-y-1 font-sans text-xs">
            {user.role === 'user' && (<>
                <button onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} className={`w-full text-left py-2 px-3 rounded font-medium flex items-center gap-2 uppercase tracking-widest ${activeTab === 'dashboard' ? 'bg-white/10 text-white font-bold' : 'text-white/60 hover:bg-white/5'}`}>
                  <LayoutDashboard className="h-4 w-4"/>
                  Dashboard
                </button>
                <button onClick={() => { setActiveTab('workouts'); setIsMobileMenuOpen(false); }} className={`w-full text-left py-2 px-3 rounded font-medium flex items-center gap-2 uppercase tracking-widest ${activeTab === 'workouts' ? 'bg-white/10 text-white font-bold' : 'text-white/60 hover:bg-white/5'}`}>
                  <Dumbbell className="h-4 w-4"/>
                  Workouts Log
                </button>
                <button onClick={() => { setActiveTab('weights'); setIsMobileMenuOpen(false); }} className={`w-full text-left py-2 px-3 rounded font-medium flex items-center gap-2 uppercase tracking-widest ${activeTab === 'weights' ? 'bg-white/10 text-white font-bold' : 'text-white/60 hover:bg-white/5'}`}>
                  <Scale className="h-4 w-4"/>
                  Weight Tracker
                </button>
                <button onClick={() => { setActiveTab('insights'); setIsMobileMenuOpen(false); }} className={`w-full text-left py-2 px-3 rounded font-medium flex items-center gap-2 uppercase tracking-widest ${activeTab === 'insights' ? 'bg-white/10 text-white font-bold' : 'text-white/60 hover:bg-white/5'}`}>
                  <Sparkles className="h-4 w-4 text-emerald-400"/>
                  AI Insights
                </button>
              </>)}

            {user.role === 'admin' && (<button onClick={() => { setActiveTab('admin'); setIsMobileMenuOpen(false); }} className={`w-full text-left py-2 px-3 rounded font-medium flex items-center gap-2 uppercase tracking-widest ${activeTab === 'admin' ? 'bg-white/10 text-white font-bold' : 'text-white/60 hover:bg-white/5'}`}>
                <ShieldCheck className="h-4 w-4"/>
                Admin Controls
              </button>)}

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">{user.name}</div>
                <div className="text-[10px] text-white/40 capitalize">{user.role} role</div>
              </div>
              <button onClick={handleLogout} className="py-1.5 px-3 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-medium rounded flex items-center gap-1 cursor-pointer">
                <LogOut className="h-3.5 w-3.5"/>
                Logout
              </button>
            </div>
          </div>)}
      </nav>

      {/* Main content pane */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        
        {activeTab === 'dashboard' && user.role === 'user' && (<DashboardView user={user} workouts={workouts} weightLogs={weightLogs} onNavigateToWorkouts={() => setActiveTab('workouts')} onNavigateToWeights={() => setActiveTab('weights')} onNavigateToInsights={() => setActiveTab('insights')} onProfileUpdated={handleProfileUpdated} onSelectTemplate={handleSelectTemplate} triggerToast={triggerToast}/>)}

        {activeTab === 'workouts' && user.role === 'user' && (<WorkoutView workouts={workouts} onWorkoutLogged={loadUserCollections} prefilledTemplate={prefilledTemplate} onClearPrefilledTemplate={() => setPrefilledTemplate(null)} triggerToast={triggerToast}/>)}

        {activeTab === 'weights' && user.role === 'user' && (<WeightTrackerView user={user} weightLogs={weightLogs} onWeightLogged={loadUserCollections} triggerToast={triggerToast}/>)}

        {activeTab === 'insights' && user.role === 'user' && (<WeeklyInsightsView insights={insights} onInsightGenerated={loadUserCollections}/>)}

        {activeTab === 'admin' && user.role === 'admin' && (<AdminPortalView token={token} onUnauthorized={handleLogout} onCategoryChanged={() => { }}/>)}

      </main>

      {/* Sticky Bottom Navigation Bar on Mobile for non-admin custom UX */}
      {user && user.role === 'user' && (<div id="sticky-bottom-nav" className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0E0E0E] border-t border-neutral-800 px-2 py-2.5 flex items-center justify-around z-40 shadow-2xl">
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded transition-all cursor-pointer select-none ${activeTab === 'dashboard' ? 'text-white' : 'text-neutral-500'}`}>
            <LayoutDashboard className="h-4.5 w-4.5"/>
            <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Overview</span>
          </button>
          
          <button onClick={() => setActiveTab('workouts')} className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded transition-all cursor-pointer select-none ${activeTab === 'workouts' ? 'text-white' : 'text-neutral-500'}`}>
            <Dumbbell className="h-4.5 w-4.5"/>
            <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Workouts</span>
          </button>

          <button onClick={() => setActiveTab('weights')} className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded transition-all cursor-pointer select-none ${activeTab === 'weights' ? 'text-white' : 'text-neutral-500'}`}>
            <Scale className="h-4.5 w-4.5"/>
            <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Weights</span>
          </button>

          <button onClick={() => setActiveTab('insights')} className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded transition-all cursor-pointer select-none ${activeTab === 'insights' ? 'text-white font-bold' : 'text-neutral-500'}`}>
            <Sparkles className="h-4.5 w-4.5 text-emerald-400"/>
            <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Insights</span>
          </button>
        </div>)}

      {/* Floating Action Button (FAB) on Mobile with Quick drawer panel */}
      {user && user.role === 'user' && (<button onClick={() => setIsFABOpen(true)} className="md:hidden fixed bottom-20 right-6 h-12 w-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-2xl z-40 transition-all select-none duration-250 hover:scale-110 active:scale-95 border border-emerald-300/30" title="Quick Actions">
          <Plus className="h-6 w-6 stroke-[3]"/>
        </button>)}

      {/* Drawer Action Sheet overlaid from bottom */}
      {isFABOpen && (<div id="fab-drawer-overlay" className="fixed inset-0 bg-black/85 z-50 flex items-end justify-center animate-fade-in backdrop-blur-xs">
          <div className="bg-[#0E0E0E] w-full rounded-t-lg border-t border-neutral-800 p-6 space-y-5 shadow-2xl max-w-md animate-slide-up">
            
            <div className="flex justify-between items-center pb-2 border-b border-neutral-900">
              <div className="flex items-center gap-1.5">
                <Zap className="h-4.5 w-4.5 text-emerald-400"/>
                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white">Athlete Quick Hub</h4>
              </div>
              <button onClick={() => setIsFABOpen(false)} className="h-7 w-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white">
                <X className="h-4 w-4"/>
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans text-left">
              
              {/* Habits short-logs */}
              <div className="space-y-2">
                <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-neutral-500">Quick Wellness logs</span>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleDrawerHabitCheck('Hydration Check 💧')} className="p-2.5 rounded-sm bg-neutral-950 border border-neutral-800 text-left hover:border-emerald-500/20 text-neutral-300 font-semibold">
                    💧 Drink 3L+ Water
                  </button>
                  <button onClick={() => handleDrawerHabitCheck('Stretch & Recovery 🧘')} className="p-2.5 rounded-sm bg-neutral-950 border border-neutral-800 text-left hover:border-emerald-500/20 text-neutral-300 font-semibold">
                    🧘 Stretch routine
                  </button>
                </div>
              </div>

              {/* Workout logs shortcut */}
              <div className="space-y-2">
                <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-neutral-500 font-bold">Fast Track Logs</span>
                <div className="space-y-2">
                  <button onClick={() => handleDrawerQuickWorkout('Walk', 20, 110, 'Active Wellness Walking', 'cat_1', 'Cardio Training')} className="w-full p-2.5 rounded-sm bg-neutral-950 border border-neutral-800 flex justify-between items-center text-neutral-300 text-left font-semibold">
                    <span>🚶 Power Walk Shortcut</span>
                    <span className="text-[10px] font-mono font-normal text-emerald-400">110 kcal • 20m</span>
                  </button>
                  <button onClick={() => handleDrawerQuickWorkout('Circuit Lifts', 35, 230, 'Heavy Gym Split', 'cat_3', 'Strength & Core')} className="w-full p-2.5 rounded-sm bg-neutral-950 border border-neutral-800 flex justify-between items-center text-neutral-300 text-left font-semibold">
                    <span>💪 Gym Weight Split</span>
                    <span className="text-[10px] font-mono font-normal text-emerald-400">230 kcal • 35m</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>)}

      {/* Footer layout elements */}
      <footer className="bg-[#050505] border-t border-white/5 py-8 mt-12 text-center text-white/30 text-[10px] font-mono tracking-wide">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>CONNECTED SERVICES: FitSync MySQL Active Schema</div>
          <div>FitSync AI Platform &copy; 2026 • Course Term Project</div>
          <div>POWERED BY GEMINI PRO METRICS INTELLIGENCE</div>
        </div>
      </footer>

    </div>);
}
