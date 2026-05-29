import React, { useState, useEffect } from 'react';
import { Dumbbell, Scale, Flame, ChevronRight, Plus, TrendingDown, Settings, Trophy, Sparkles, Check, Droplets, Compass, Zap, Sparkle } from 'lucide-react';
import { calculateStreakStats, getBadges, saveLocalCheckin, formatDateStr, getLocalCheckins } from '../utils/workoutUtils.js';
export default function DashboardView({ user, workouts, weightLogs, onNavigateToWorkouts, onNavigateToWeights, onNavigateToInsights, onProfileUpdated, onSelectTemplate, triggerToast, }) {
    const isProfileIncomplete = !user.height || !user.weight;
    const [showOnboarding, setShowOnboarding] = useState(isProfileIncomplete);
    const [onboardingStep, setOnboardingStep] = useState(1);
    const [obName, setObName] = useState(user.name || '');
    const [obAge, setObAge] = useState(user.age?.toString() || '');
    const [obGender, setObGender] = useState(user.gender || 'male');
    const [obHeight, setObHeight] = useState(user.height?.toString() || '');
    const [obWeight, setObWeight] = useState(user.weight?.toString() || '');
    const [obTargetWeight, setObTargetWeight] = useState('');
    const [obGoal, setObGoal] = useState(user.goal || 'Lose weight & Tone muscle');
    const [obActivityLevel, setObActivityLevel] = useState(user.activityLevel || 'Moderately active');
    const [obWorkoutType, setObWorkoutType] = useState('Strength');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [name, setName] = useState(user.name);
    const [age, setAge] = useState(user.age?.toString() || '');
    const [gender, setGender] = useState(user.gender || 'male');
    const [height, setHeight] = useState(user.height?.toString() || '');
    const [weight, setWeight] = useState(user.weight?.toString() || '');
    const [goal, setGoal] = useState(user.goal || 'Lose weight & Tone muscle');
    const [activityLevel, setActivityLevel] = useState(user.activityLevel || 'Moderately active');
    const [savingProfile, setSavingProfile] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const streakStats = calculateStreakStats(user, workouts, weightLogs);
    const badgesList = getBadges(streakStats.currentStreak);
    const todayStr = formatDateStr(new Date());
    const localCheckins = getLocalCheckins(user.id);
    const isTodayCheckedIn = localCheckins.includes(todayStr);
    const [savingQuickLog, setSavingQuickLog] = useState(false);
    useEffect(() => {
        setName(user.name);
        setAge(user.age?.toString() || '');
        setGender(user.gender || 'male');
        setHeight(user.height?.toString() || '');
        setWeight(user.weight?.toString() || '');
        setGoal(user.goal || 'Lose weight & Tone muscle');
        setActivityLevel(user.activityLevel || 'Moderately active');
    }, [user]);
    useEffect(() => {
        if (!user)
            return;
        try {
            const notifiedKey = `fitsync_notified_badges_${user.id}`;
            const notifiedStr = localStorage.getItem(notifiedKey);
            const notifiedIds = notifiedStr ? JSON.parse(notifiedStr) : [];
            const updatedIds = [...notifiedIds];
            let triggeredAny = false;
            badgesList.forEach(badge => {
                if (badge.isUnlocked && !notifiedIds.includes(badge.id)) {
                    triggerToast(`Achievement unlocked: ${badge.name}. ${badge.description}`, 'milestone');
                    updatedIds.push(badge.id);
                    triggeredAny = true;
                }
            });
            if (triggeredAny) {
                localStorage.setItem(notifiedKey, JSON.stringify(updatedIds));
            }
        }
        catch (err) {
            console.error('Error handling badge notifications:', err);
        }
    }, [streakStats.currentStreak, user, badgesList]);
    async function submitOnboarding(e) {
        e.preventDefault();
        setSavingProfile(true);
        try {
            const token = localStorage.getItem('fitsync_token');
            const resp = await fetch('/api/profile/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: obName,
                    age: obAge ? Number(obAge) : undefined,
                    gender: obGender,
                    height: obHeight ? Number(obHeight) : undefined,
                    weight: obWeight ? Number(obWeight) : undefined,
                    goal: obGoal,
                    activityLevel: obActivityLevel
                })
            });
            const data = await resp.json();
            if (!resp.ok) {
                throw new Error(data.error || 'Failed updating first-time onboarding variables.');
            }
            localStorage.setItem(`fitsync_onboarding_target_weight_${user.id}`, obTargetWeight);
            localStorage.setItem(`fitsync_onboarding_pref_workout_${user.id}`, obWorkoutType);
            onProfileUpdated(data);
            setShowOnboarding(false);
            triggerToast(`Welcome to FitSync, ${obName}. Your profile is ready.`, 'success');
        }
        catch (err) {
            alert(err.message || 'Onboarding update failed.');
        }
        finally {
            setSavingProfile(false);
        }
    }
    async function handleSaveProfile(e) {
        e.preventDefault();
        setSavingProfile(true);
        setStatusMessage(null);
        try {
            const token = localStorage.getItem('fitsync_token');
            const resp = await fetch('/api/profile/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    age: age ? Number(age) : undefined,
                    gender,
                    height: height ? Number(height) : undefined,
                    weight: weight ? Number(weight) : undefined,
                    goal,
                    activityLevel
                })
            });
            const data = await resp.json();
            if (!resp.ok) {
                throw new Error(data.error || 'Failed saving wellness metrics.');
            }
            onProfileUpdated(data);
            triggerToast('Wellness profile saved & synchronized successfully!', 'success');
            setStatusMessage({ type: 'success', text: 'Wellness Profile synchronized successfully!' });
            setIsEditingProfile(false);
        }
        catch (err) {
            setStatusMessage({ type: 'error', text: err.message || 'Verification failed.' });
        }
        finally {
            setSavingProfile(false);
        }
    }
    function triggerDailyHabitCheck(habitName) {
        const freshCheckins = saveLocalCheckin(user.id, todayStr);
        onProfileUpdated({ ...user });
        triggerToast(`Logged ${habitName}! Daily streak maintained at ${streakStats.currentStreak + (isTodayCheckedIn ? 0 : 1)} days! 🔥`, 'streak');
    }
    async function logQuickWorkout(presetName, duration, calories, activityName, categoryId, categoryName) {
        setSavingQuickLog(true);
        triggerToast(`Broadcasting instant ${presetName} block to MySQL...`, 'info');
        const payload = {
            date: todayStr,
            title: `${presetName} Shortcut`,
            notes: "Logged with one-tap Fast Track logs.",
            exercises: [
                {
                    categoryId,
                    categoryName,
                    exerciseName: activityName,
                    duration,
                    caloriesBurned: calories,
                    sets: [{ reps: 1, weight: 0 }]
                }
            ]
        };
        try {
            const token = localStorage.getItem('fitsync_token');
            const resp = await fetch('/api/workouts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await resp.json();
            if (!resp.ok) {
                throw new Error(data.error || 'Failed auto-logging preset workout.');
            }
            onProfileUpdated({ ...user });
            triggerToast(`${presetName} recorded (+${calories} kcal).`, 'success');
        }
        catch (err) {
            triggerToast(err.message || 'Error tracking instant shortcut.', 'info');
        }
        finally {
            setSavingQuickLog(false);
        }
    }
    const workoutTemplates = [
        {
            title: "Chest & Shoulders Push",
            desc: "Autofills bench press, overhead rolls and sets",
            exercises: [
                {
                    categoryId: 'cat_3',
                    categoryName: 'Strength & Core',
                    exerciseName: 'Flat Bench Press',
                    duration: 30,
                    caloriesBurned: 180,
                    sets: [
                        { reps: 10, weight: 40 },
                        { reps: 10, weight: 50 },
                        { reps: 8, weight: 60 }
                    ]
                },
                {
                    categoryId: 'cat_3',
                    categoryName: 'Strength & Core',
                    exerciseName: 'Overhead Shoulder dumbbell press',
                    duration: 15,
                    caloriesBurned: 100,
                    sets: [
                        { reps: 12, weight: 12 },
                        { reps: 10, weight: 14 }
                    ]
                }
            ]
        },
        {
            title: "Back & Biceps Pull Focus",
            desc: "Autofills lat pull downs, cable bicep curls",
            exercises: [
                {
                    categoryId: 'cat_3',
                    categoryName: 'Strength & Core',
                    exerciseName: 'Seated Lat Pull Downs',
                    duration: 25,
                    caloriesBurned: 140,
                    sets: [
                        { reps: 12, weight: 35 },
                        { reps: 10, weight: 40 },
                        { reps: 10, weight: 45 }
                    ]
                },
                {
                    categoryId: 'cat_3',
                    categoryName: 'Strength & Core',
                    exerciseName: 'Standing Dumbbell curls',
                    duration: 15,
                    caloriesBurned: 80,
                    sets: [
                        { reps: 12, weight: 10 },
                        { reps: 12, weight: 10 }
                    ]
                }
            ]
        },
        {
            title: "Lower Body Squat Day",
            desc: "Autofills barbell squats & leg extensions",
            exercises: [
                {
                    categoryId: 'cat_3',
                    categoryName: 'Strength & Core',
                    exerciseName: 'Barbell Rear Squats',
                    duration: 35,
                    caloriesBurned: 240,
                    sets: [
                        { reps: 10, weight: 40 },
                        { reps: 10, weight: 50 },
                        { reps: 8, weight: 70 }
                    ]
                },
                {
                    categoryId: 'cat_5',
                    categoryName: 'HIIT & Circuit',
                    exerciseName: 'Bodyweight Jump Squats',
                    duration: 15,
                    caloriesBurned: 110,
                    sets: [
                        { reps: 15, weight: 0 },
                        { reps: 15, weight: 0 }
                    ]
                }
            ]
        }
    ];
    function calculateBmiValue(kg, cm) {
        if (!kg || !cm)
            return { value: 0, label: 'Not calculated', colorClass: 'text-white/40', barClass: 'bg-white/10' };
        const heightMeters = cm / 100;
        const value = Number((kg / (heightMeters * heightMeters)).toFixed(1));
        if (value < 18.5) {
            return { value, label: 'Underweight', colorClass: 'text-amber-400', barClass: 'bg-amber-400' };
        }
        else if (value >= 18.5 && value < 25) {
            return { value, label: 'Healthy Weight', colorClass: 'text-emerald-400', barClass: 'bg-emerald-400' };
        }
        else if (value >= 25 && value < 30) {
            return { value, label: 'Overweight', colorClass: 'text-amber-500', barClass: 'bg-amber-500' };
        }
        else {
            return { value, label: 'Obese', colorClass: 'text-rose-550', barClass: 'bg-rose-550' };
        }
    }
    const bmi = calculateBmiValue(user.weight || 0, user.height || 0);
    const chartRecords = [...weightLogs]
        .slice(0, 8)
        .reverse();
    const hasWeightData = chartRecords.length > 1;
    const svgWidth = 500;
    const svgHeight = 160;
    const paddingX = 40;
    const paddingY = 20;
    let points = '';
    let gridLines = [];
    if (hasWeightData) {
        const weights = chartRecords.map(r => r.weight);
        const minW = Math.min(...weights) - 1;
        const maxW = Math.max(...weights) + 1;
        const rangeW = maxW - minW || 1;
        chartRecords.forEach((record, index) => {
            const x = paddingX + (index * (svgWidth - paddingX * 2)) / (chartRecords.length - 1);
            const y = svgHeight - paddingY - ((record.weight - minW) * (svgHeight - paddingY * 2)) / rangeW;
            points += `${x},${y} `;
            const dateObj = new Date(record.date);
            const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            gridLines.push({ x, y, label: `${record.weight}kg`, rawDate: dateLabel });
        });
    }
    return (<div id="dashboard-view-root" className="space-y-8 text-left font-sans text-neutral-200 pb-16">
      
      {showOnboarding && (<div id="onboarding-modal" className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0E0E0E] max-w-lg w-full rounded-sm border border-neutral-800 p-6 md:p-8 space-y-6 shadow-2xl relative my-8">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-emerald-300"></div>
            
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-emerald-400 font-bold uppercase tracking-widest">Athlete Onboarding</span>
              <span className="text-neutral-500 font-semibold">{onboardingStep} of 4</span>
            </div>

            <form onSubmit={submitOnboarding} className="space-y-6">
              
              {onboardingStep === 1 && (<div className="space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-xl font-serif italic text-white font-bold">Welcome! What is your name?</h2>
                    <p className="text-xs text-neutral-400">Let's set up your FitSync profile with your basic stats.</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono mb-1.5 font-bold">Athlete Name</label>
                      <input type="text" required value={obName} onChange={e => setObName(e.target.value)} placeholder=" Sarah Coleman" className="block w-full px-3 py-2.5 bg-black border border-neutral-800 focus:border-neutral-500 rounded-sm text-sm text-white focus:outline-none"/>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono mb-1.5 font-bold">Gender</label>
                        <select value={obGender} onChange={e => setObGender(e.target.value)} className="block w-full px-3 py-2.5 bg-black border border-neutral-800 focus:border-neutral-500 rounded-sm text-sm text-white focus:outline-none cursor-pointer">
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono mb-1.5 font-bold">Age (years)</label>
                        <input type="number" required value={obAge} onChange={e => setObAge(e.target.value)} placeholder="e.g. 28" className="block w-full px-3 py-2.5 bg-black border border-neutral-800 focus:border-neutral-500 rounded-sm text-sm text-white focus:outline-none"/>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-neutral-900">
                    <button type="button" disabled={!obName.trim() || !obAge} onClick={() => setOnboardingStep(2)} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-widest rounded-sm cursor-pointer disabled:opacity-40">
                      Next: Body Scale
                    </button>
                  </div>
                </div>)}

              {onboardingStep === 2 && (<div className="space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-xl font-serif italic text-white font-bold">What are your body metrics?</h2>
                    <p className="text-xs text-neutral-400">These are used to calculate accurate BMI levels and target ratios.</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono mb-1.5 font-bold">Height (cm)</label>
                        <input type="number" required value={obHeight} onChange={e => setObHeight(e.target.value)} placeholder="e.g. 174" className="block w-full px-3 py-2.5 bg-black border border-neutral-800 focus:border-neutral-500 rounded-sm text-sm text-white focus:outline-none"/>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono mb-1.5 font-bold">Current Weight (kg)</label>
                        <input type="number" required step="0.1" value={obWeight} onChange={e => setObWeight(e.target.value)} placeholder="e.g. 68.5" className="block w-full px-3 py-2.5 bg-black border border-neutral-800 focus:border-neutral-500 rounded-sm text-sm text-white focus:outline-none"/>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono mb-1.5 font-bold">Optional: Target Weight (kg)</label>
                      <input type="number" step="0.1" value={obTargetWeight} onChange={e => setObTargetWeight(e.target.value)} placeholder="e.g. 64.0 (for delta comparison)" className="block w-full px-3 py-2.5 bg-black border border-neutral-800 focus:border-neutral-500 rounded-sm text-sm text-white focus:outline-none"/>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-neutral-900">
                    <button type="button" onClick={() => setOnboardingStep(1)} className="px-4 py-2 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer">
                      Back
                    </button>
                    <button type="button" disabled={!obHeight || !obWeight} onClick={() => setOnboardingStep(3)} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-widest rounded-sm cursor-pointer disabled:opacity-40">
                      Next: Routine Goals
                    </button>
                  </div>
                </div>)}

              {onboardingStep === 3 && (<div className="space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-xl font-serif italic text-white font-bold">Define your fitness objectives</h2>
                    <p className="text-xs text-neutral-400">Select objectives to guide the Gemini AI insight analysis.</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono mb-1.5 font-bold">Primary Goal focus</label>
                      <select value={obGoal} onChange={e => setObGoal(e.target.value)} className="block w-full px-3 py-2.5 bg-black border border-neutral-800 focus:border-neutral-500 rounded-sm text-sm text-white focus:outline-none cursor-pointer">
                        <option value="Lose weight & Tone muscle">Lose weight & Tone muscle</option>
                        <option value="Gain muscle mass">Gain muscle mass</option>
                        <option value="Improve cardiovascular endurance">Improve cardiovascular endurance</option>
                        <option value="Maintain overall health & fitness">Maintain overall health & fitness</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono mb-1.5 font-bold">Estimated activity level</label>
                      <select value={obActivityLevel} onChange={e => setObActivityLevel(e.target.value)} className="block w-full px-3 py-2.5 bg-black border border-neutral-800 focus:border-neutral-500 rounded-sm text-sm text-white focus:outline-none cursor-pointer">
                        <option value="Sedentary">Sedentary (desk job, low movement)</option>
                        <option value="Lightly active">Lightly active (walk 1-2 times/wk)</option>
                        <option value="Moderately active">Moderately active (workout 3-5 times/wk)</option>
                        <option value="Very active">Very active (intensive routine 6-7 days/wk)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-neutral-900">
                    <button type="button" onClick={() => setOnboardingStep(2)} className="px-4 py-2 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer">
                      Back
                    </button>
                    <button type="button" onClick={() => setOnboardingStep(4)} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-widest rounded-sm cursor-pointer">
                      Next: Style
                    </button>
                  </div>
                </div>)}

              {onboardingStep === 4 && (<div className="space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-xl font-serif italic text-white font-bold">One last thing, Sarah!</h2>
                    <p className="text-xs text-neutral-400">What style of routine do you prefer for your weekly planner?</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-mono mb-1.5 font-bold">Preferred Workout Style</label>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {['Strength', 'Cardio', 'HIIT Focus', 'Flexibility/Yoga'].map((type) => (<button key={type} type="button" onClick={() => setObWorkoutType(type)} className={`p-3 text-xs font-bold rounded-sm border uppercase tracking-wider transition-all text-center ${obWorkoutType === type ? 'border-emerald-400 bg-emerald-950/10 text-emerald-400 shadow-lg' : 'border-neutral-800 bg-black hover:bg-neutral-900 text-neutral-400'}`}>
                            {type}
                          </button>))}
                      </div>
                    </div>

                    <div className="p-4 rounded-sm bg-neutral-900/45 border border-neutral-800 text-[11px] text-neutral-400 leading-relaxed font-sans mt-3">
                      <strong>Almost ready.</strong> Click "Complete" below to save your profile and open the dashboard.
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-neutral-900">
                    <button type="button" onClick={() => setOnboardingStep(3)} className="px-4 py-2 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer">
                      Back
                    </button>
                    <button type="submit" disabled={savingProfile} className="px-6 py-2 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-sm cursor-pointer hover:bg-neutral-200 transition-all">
                      {savingProfile ? 'Initializing...' : 'Complete & Launch'}
                    </button>
                  </div>
                </div>)}

            </form>
          </div>
        </div>)}


      <h3 className="text-[10px] font-mono tracking-[0.22em] text-neutral-500 uppercase font-bold border-b border-neutral-800/60 pb-2">Top Layer: Motivation & Shortcuts</h3>
      
      <div id="top-layout-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="bg-[#0E0E0E] p-6 rounded-sm border border-neutral-800/80 shadow-2xl flex flex-col justify-between space-y-4 hover:border-emerald-500/20 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-full filter blur-xl group-hover:from-emerald-400/10 transition-all"></div>
          
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">Wellness Momentum</span>
              <h4 className="text-base font-serif font-bold text-white mt-0.5 italic flex items-center gap-1">Daily Habit Streak</h4>
            </div>
            <div className={`h-10 w-10 rounded-sm bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-110 transition-transform ${streakStats.currentStreak > 0 ? 'animate-pulse text-amber-500 bg-amber-950/10 border-amber-900/30' : ''}`}>
              <Flame className="h-5 w-5 fill-current"/>
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-serif italic font-black text-white">{streakStats.currentStreak}</span>
              <span className="text-xs text-neutral-400 font-mono uppercase font-semibold">consecutive days</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed font-sans">
              {streakStats.streakGrowthMessage}
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[11px] font-mono">
            <span className="text-neutral-500 font-semibold uppercase">Personal Best:</span>
            <span className="text-white font-extrabold">{streakStats.longestStreak} Days</span>
          </div>
        </div>

        <div className="bg-[#0E0E0E] p-6 rounded-sm border border-neutral-800/80 shadow-2xl space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-900">
            <div>
              <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">Gamified Milestones</span>
              <h4 className="text-sm font-bold text-white mt-0.5">Honor Achievements</h4>
            </div>
            <Trophy className="h-5 w-5 text-amber-400"/>
          </div>

          <div className="grid grid-cols-2 gap-3.5 pt-1.5">
            {badgesList.map((badge) => (<div key={badge.id} className={`p-3 rounded-sm border flex flex-col justify-between space-y-2 relative transition-all duration-300 hover:scale-[1.02] ${badge.isUnlocked ? 'border-amber-400/20 bg-amber-950/5 text-amber-200 shadow-md' : 'border-neutral-900 bg-neutral-950/20 text-neutral-500'}`}>
                <div className="flex justify-between items-start">
                  <span className={`text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-full font-bold ${badge.isUnlocked ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' : 'bg-neutral-900 text-neutral-500'}`}>
                    {badge.requirement}
                  </span>
                  <Sparkle className={`h-3 w-3 ${badge.isUnlocked ? 'text-amber-400 animate-pulse' : 'text-neutral-800'}`}/>
                </div>
                <div>
                  <h5 className="text-[11px] font-bold text-white leading-tight font-serif italic">{badge.name}</h5>
                  <p className="text-[9px] text-neutral-400 line-clamp-1 leading-normal">{badge.description}</p>
                </div>
              </div>))}
          </div>
        </div>

        <div className="bg-[#0E0E0E] p-6 rounded-sm border border-[#10b981]/15 shadow-2xl flex flex-col justify-between space-y-4 hover:border-[#10b981]/30 transition-all duration-300 duration-300 relative">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#10b981]/30 to-emerald-500/10"></div>
          <div>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">Active Check-in</span>
                <h4 className="text-sm font-bold text-white mt-0.5 font-serif italic">Wellness Checklist</h4>
              </div>
              <Compass className="h-4.5 w-4.5 text-emerald-400"/>
            </div>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              No workout logged today? Maintain your streak manually by completing daily wellness actions:
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <button onClick={() => triggerDailyHabitCheck('Hydration Check 💧')} className={`w-full p-2.5 rounded-sm border text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${isTodayCheckedIn ? 'bg-[#10b981]/5 border-[#10b981]/25 text-neutral-300' : 'bg-black border-neutral-800 hover:bg-neutral-900 text-white'}`}>
              <span className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-sky-400"/>
                Hydration log (3L+)
              </span>
              {isTodayCheckedIn ? <Check className="h-4 w-4 text-emerald-400"/> : <Plus className="h-3.5 w-3.5"/>}
            </button>

            <button onClick={() => triggerDailyHabitCheck('Stretching Check 🧘')} className={`w-full p-2.5 rounded-sm border text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${isTodayCheckedIn ? 'bg-[#10b981]/5 border-[#10b981]/25 text-neutral-300' : 'bg-black border-neutral-800 hover:bg-neutral-900 text-white'}`}>
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400"/>
                Stretching & sleep (8h)
              </span>
              {isTodayCheckedIn ? <Check className="h-4 w-4 text-emerald-400"/> : <Plus className="h-3.5 w-3.5"/>}
            </button>
          </div>
        </div>

      </div>

      <div id="quick-logs-section" className="space-y-4 pt-1">
        <div className="flex items-center gap-2 text-neutral-400">
          <Zap className="h-4 w-4 text-[#10b981]"/>
          <h4 className="text-xs font-mono font-bold uppercase tracking-widest">Quick logging actions (instant feedback in 1 tap)</h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          
          <button disabled={savingQuickLog} onClick={() => logQuickWorkout('Quick Run', 30, 300, 'Outdoor Pace Running', 'cat_1', 'Cardio Training')} className="p-4 rounded-sm bg-[#0E0E0E] border border-neutral-800 text-left hover:border-emerald-500/30 transition-all cursor-pointer group hover:bg-[#121212] flex flex-col justify-between h-28">
            <span className="text-[10px] font-mono text-neutral-500 font-bold group-hover:text-emerald-400 uppercase tracking-widest">Cardio</span>
            <div>
              <h5 className="text-xs font-extrabold text-white uppercase tracking-wide">Outdoor Run</h5>
              <p className="text-[11px] text-neutral-400 mt-1 font-semibold">30m • 300 kcal</p>
            </div>
          </button>

          <button disabled={savingQuickLog} onClick={() => logQuickWorkout('Quick Walk', 20, 110, 'Active Power Walking', 'cat_1', 'Cardio Training')} className="p-4 rounded-sm bg-[#0E0E0E] border border-neutral-800 text-left hover:border-emerald-500/30 transition-all cursor-pointer group hover:bg-[#121212] flex flex-col justify-between h-28">
            <span className="text-[10px] font-mono text-neutral-500 font-bold group-hover:text-emerald-400 uppercase tracking-widest">Recovery</span>
            <div>
              <h5 className="text-xs font-extrabold text-white uppercase tracking-wide">Power Walk</h5>
              <p className="text-[11px] text-neutral-400 mt-1 font-semibold">20m • 110 kcal</p>
            </div>
          </button>

          <button disabled={savingQuickLog} onClick={() => logQuickWorkout('Quick Gym', 45, 260, 'Dumbbell Strength Setups', 'cat_3', 'Strength & Core')} className="p-4 rounded-sm bg-[#0E0E0E] border border-neutral-800 text-left hover:border-emerald-500/30 transition-all cursor-pointer group hover:bg-[#121212] flex flex-col justify-between h-28">
            <span className="text-[10px] font-mono text-neutral-500 font-bold group-hover:text-emerald-400 uppercase tracking-widest">Bodybuilding</span>
            <div>
              <h5 className="text-xs font-extrabold text-white uppercase tracking-wide">Heavy Gym Lifts</h5>
              <p className="text-[11px] text-neutral-400 mt-1 font-semibold">45m • 260 kcal</p>
            </div>
          </button>

          <button disabled={savingQuickLog} onClick={() => logQuickWorkout('HIIT Circuit', 25, 240, 'HIIT High Intensity Circuit', 'cat_5', 'HIIT & Circuit')} className="p-4 rounded-sm bg-[#0E0E0E] border border-neutral-800 text-left hover:border-emerald-500/30 transition-all cursor-pointer group hover:bg-[#121212] flex flex-col justify-between h-28">
            <span className="text-[10px] font-mono text-neutral-500 font-bold group-hover:text-emerald-400 uppercase tracking-widest">HIIT Split</span>
            <div>
              <h5 className="text-xs font-extrabold text-white uppercase tracking-wide">HIIT Endurance</h5>
              <p className="text-[11px] text-neutral-400 mt-1 font-semibold">25m • 240 kcal</p>
            </div>
          </button>

          <button disabled={savingQuickLog} onClick={() => logQuickWorkout('Stretch Flow', 15, 60, 'Vinyasa Flow Stretching', 'cat_4', 'Flexibility & Yoga')} className="col-span-2 sm:col-span-1 p-4 rounded-sm bg-[#0E0E0E] border border-neutral-800 text-left hover:border-emerald-500/30 transition-all cursor-pointer group hover:bg-[#121212] flex flex-col justify-between h-28">
            <span className="text-[10px] font-mono text-neutral-500 font-bold group-hover:text-emerald-400 uppercase tracking-widest">Mindfulness</span>
            <div>
              <h5 className="text-xs font-extrabold text-white uppercase tracking-wide">Yoga Stretch</h5>
              <p className="text-[11px] text-neutral-400 mt-1 font-semibold">15m • 60 kcal</p>
            </div>
          </button>

        </div>
      </div>

      <div id="starter-templates-section" className="space-y-3.5">
        <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-400">Starter Workout Templates (Auto-fills form list)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {workoutTemplates.map((template, index) => (<div key={index} className="bg-[#0E0E0E] p-4 rounded-sm border border-neutral-800 flex flex-col justify-between gap-3.5 hover:border-neutral-700 transition-all">
              <div>
                <h5 className="text-xs font-extrabold text-[#FFFFFF] tracking-wider uppercase">{template.title}</h5>
                <p className="text-[11px] text-neutral-400 leading-normal mt-1">{template.desc}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {template.exercises.map((ex, exIdx) => (<span key={exIdx} className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[9px] text-neutral-400">
                      {ex.exerciseName}
                    </span>))}
                </div>
              </div>
              <button type="button" onClick={() => onSelectTemplate(template)} className="w-full py-1.5 bg-neutral-900 hover:bg-white hover:text-black border border-neutral-800 transition-all text-[10px] font-bold uppercase tracking-widest rounded-sm text-center cursor-pointer text-white">
                Use Template to Log
              </button>
            </div>))}
        </div>
      </div>


      <h3 className="text-[10px] font-mono tracking-[0.22em] text-neutral-500 uppercase font-bold border-b border-neutral-800/60 pb-2 pt-4">Middle Layer: Performance Charts & Benchmarks</h3>
      
      <div id="middle-layout" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          
          <div id="chart-card" className="bg-[#0E0E0E] p-6 rounded-sm border border-neutral-800 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">Weight Delta logs</span>
                <h3 className="text-base font-serif italic font-bold text-white mt-0.5">Physical Progress Index</h3>
              </div>
              <button type="button" onClick={onNavigateToWeights} className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer font-serif italic transition-all">
                Log weight parameter
                <ChevronRight className="h-3.5 w-3.5"/>
              </button>
            </div>

            {hasWeightData ? (<div className="w-full overflow-x-auto">
                <div className="min-w-[400px]">
                  <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible select-none">
                    <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
                    <line x1={paddingX} y1={svgHeight / 2} x2={svgWidth - paddingX} y2={svgHeight / 2} stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
                    <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>

                    <polyline fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points}/>

                    {gridLines.map((line, i) => (<g key={i} className="group">
                        <circle cx={line.x} cy={line.y} r="5" fill="#0E0E0E" stroke="#10b981" strokeWidth="2" className="cursor-pointer"/>
                        <text x={line.x} y={line.y - 12} textAnchor="middle" className="font-mono text-[9px] font-bold fill-white">
                          {line.label}
                        </text>
                        <text x={line.x} y={svgHeight - 4} textAnchor="middle" className="font-mono text-[9px] fill-neutral-500">
                          {line.rawDate}
                        </text>
                      </g>))}
                  </svg>
                </div>
              </div>) : (<div className="py-12 bg-neutral-900/10 rounded-sm border border-dashed border-neutral-800 flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <TrendingDown className="h-8 w-8 text-neutral-600"/>
                  <div>
                    <p className="text-sm font-semibold text-neutral-300">Need weights data points</p>
                    <p className="text-xs text-neutral-500 max-w-xs mt-1 leading-relaxed">Log at least two bodyweight points. Recording once per week builds helpful trend timelines.</p>
                  </div>
                </div>)}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="p-4 bg-[#0E0E0E] rounded-sm border border-neutral-800">
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#10b981] font-bold">Week consistency</span>
              <div className="text-2xl font-serif italic font-black text-white mt-1">{streakStats.weeklyConsistency}%</div>
              <div className="mt-2.5 h-1 w-full bg-neutral-900 rounded-full overflow-hidden">
                <div className="h-full bg-[#10b981]" style={{ width: `${streakStats.weeklyConsistency}%` }}></div>
              </div>
            </div>

            <div className="p-4 bg-[#0E0E0E] rounded-sm border border-neutral-800">
              <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">Total Workouts</span>
              <div className="text-2xl font-serif italic font-black text-[#E0E0E0] mt-1">
                {workouts.length}
              </div>
              <p className="text-[9px] text-neutral-500 uppercase tracking-widest mt-1.5 font-mono font-bold">Recorded Sessions</p>
            </div>

            <div className="p-4 bg-[#0E0E0E] rounded-sm border border-neutral-800">
              <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">Duration Split</span>
              <div className="text-2xl font-serif italic font-black text-white mt-1">
                {streakStats.totalMinutesThisWeek}m
              </div>
              <p className="text-[9px] text-neutral-500 uppercase tracking-widest mt-1.5 font-mono font-bold">Trained this week</p>
            </div>

            <div className="p-4 bg-[#0E0E0E] rounded-sm border border-neutral-800">
              <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 font-bold">Kcal Burned</span>
              <div className="text-2xl font-serif italic font-black text-white mt-1">
                {streakStats.totalCaloriesThisWeek}
              </div>
              <p className="text-[9px] text-neutral-500 uppercase tracking-widest mt-1.5 font-mono font-bold">Burned this week</p>
            </div>

          </div>

        </div>

        <div className="space-y-6">
          
          <div className="bg-[#0E0E0E] p-5 rounded-sm border border-neutral-800 flex flex-col justify-between space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">Body Mass Ratio (BMI)</h4>
              <Scale className="h-4.5 w-4.5 text-neutral-400"/>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-white">
                  {user.height && user.weight ? bmi.value : '--'}
                </span>
                <span className={`text-[10px] font-bold font-mono uppercase tracking-wide px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 ${bmi.colorClass}`}>
                  {user.height && user.weight ? bmi.label : 'Incomplete'}
                </span>
              </div>
              {user.height && user.weight && (<div className="mt-3 h-1 w-full bg-neutral-950 rounded-full overflow-hidden">
                  <div className={`h-full ${bmi.barClass} rounded-full`} style={{ width: `${Math.min(100, (bmi.value / 40) * 100)}%` }}></div>
                </div>)}
            </div>
          </div>

          <div className="bg-[#0E0E0E] p-5 rounded-sm border border-neutral-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-neutral-500"/>
                <h3 className="text-xs font-mono font-semibold text-white uppercase tracking-widest">Athlete Profile</h3>
              </div>
              <button type="button" onClick={() => {
            setIsEditingProfile(!isEditingProfile);
            setStatusMessage(null);
        }} className="text-xs text-neutral-400 hover:text-white transition-all font-serif italic cursor-pointer underline decoration-neutral-800 underline-offset-4">
                {isEditingProfile ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {statusMessage && (<div className={`p-3 rounded border text-xs font-semibold ${statusMessage.type === 'success' ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-300' : 'bg-red-950/20 border-red-900/30 text-red-350'}`}>
                {statusMessage.text}
              </div>)}

            {!isEditingProfile ? (<div className="space-y-3 pt-1 text-xs text-neutral-300">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-neutral-950/40 border border-neutral-900 p-2.5 rounded-sm">
                    <div className="text-[8px] font-mono uppercase tracking-wider text-neutral-500">Athlete Name</div>
                    <div className="font-bold text-white mt-1">{user.name}</div>
                  </div>
                  <div className="bg-neutral-950/40 border border-neutral-900 p-2.5 rounded-sm">
                    <div className="text-[8px] font-mono uppercase tracking-wider text-neutral-500">Gender</div>
                    <div className="font-bold text-white capitalize mt-1">{user.gender || 'Not set'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-neutral-950/40 border border-neutral-900 p-2 text-center rounded-sm">
                    <div className="text-[8px] font-mono uppercase tracking-wider text-neutral-500">Age</div>
                    <div className="font-bold text-white mt-1">{user.age || '--'} yrs</div>
                  </div>
                  <div className="bg-neutral-950/40 border border-neutral-900 p-2 text-center rounded-sm">
                    <div className="text-[8px] font-mono uppercase tracking-wider text-neutral-500">Height</div>
                    <div className="font-bold text-white mt-1">{user.height || '--'} cm</div>
                  </div>
                  <div className="bg-neutral-950/40 border border-neutral-900 p-2 text-center rounded-sm">
                    <div className="text-[8px] font-mono uppercase tracking-wider text-neutral-500">Weight</div>
                    <div className="font-bold text-white mt-1">{user.weight || '--'} kg</div>
                  </div>
                </div>

                <div className="bg-neutral-950/40 border border-neutral-900 p-3 rounded-sm">
                  <div className="text-[8px] font-mono uppercase tracking-wider text-neutral-500">Primary Objective</div>
                  <div className="font-bold text-white mt-1">{user.goal || 'General Endurances'}</div>
                </div>

                <div className="bg-neutral-950/40 border border-neutral-900 p-3 rounded-sm">
                  <div className="text-[8px] font-mono uppercase tracking-wider text-neutral-500">Daily Multipliers</div>
                  <div className="font-bold text-white mt-1">{user.activityLevel || 'Active'}</div>
                </div>
              </div>) : (<form onSubmit={handleSaveProfile} className="space-y-4 text-left">
                <div>
                  <label htmlFor="p-name" className="block text-[9px] font-mono font-semibold text-neutral-400 uppercase tracking-widest mb-1 font-bold">Athlete Name</label>
                  <input id="p-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="block w-full px-3 py-2 text-xs bg-black border border-neutral-800 focus:border-neutral-500 rounded-sm text-white focus:outline-none focus:bg-black"/>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="p-gender" className="block text-[9px] font-mono font-semibold text-neutral-400 uppercase tracking-widest mb-1 font-bold">Gender</label>
                    <select id="p-gender" value={gender} onChange={(e) => setGender(e.target.value)} className="block w-full px-3 py-2 bg-black border border-neutral-800 focus:border-neutral-500 rounded-sm text-xs text-white focus:outline-none cursor-pointer">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="p-age" className="block text-[9px] font-mono font-semibold text-neutral-400 uppercase tracking-widest mb-1 font-bold">Age (years)</label>
                    <input id="p-age" type="number" required value={age} onChange={(e) => setAge(e.target.value)} className="block w-full px-3 py-2 text-xs bg-black border border-neutral-800 focus:border-neutral-500 rounded-sm text-white focus:outline-none"/>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="p-height" className="block text-[9px] font-mono font-semibold text-neutral-400 uppercase tracking-widest mb-1 font-bold">Height (cm)</label>
                    <input id="p-height" type="number" required value={height} onChange={(e) => setHeight(e.target.value)} className="block w-full px-3 py-2 text-xs bg-black border border-neutral-800 focus:border-neutral-500 rounded-sm text-white focus:outline-none"/>
                  </div>
                  <div>
                    <label htmlFor="p-weight" className="block text-[9px] font-mono font-semibold text-neutral-400 uppercase tracking-widest mb-1 font-bold">Weight (kg)</label>
                    <input id="p-weight" type="number" step="0.1" required value={weight} onChange={(e) => setWeight(e.target.value)} className="block w-full px-3 py-2 text-xs bg-black border border-neutral-800 focus:border-neutral-500 rounded-sm text-white focus:outline-none"/>
                  </div>
                </div>

                <div>
                  <label htmlFor="p-goal" className="block text-[9px] font-mono font-semibold text-neutral-400 uppercase tracking-widest mb-1 font-bold">Fitness Target Goal</label>
                  <select id="p-goal" value={goal} onChange={(e) => setGoal(e.target.value)} className="block w-full px-3 py-2 bg-black border border-neutral-800 focus:border-neutral-500 rounded-sm text-xs text-white focus:outline-none cursor-pointer">
                    <option value="Lose weight & Tone muscle">Lose weight & Tone muscle</option>
                    <option value="Gain muscle mass">Gain muscle mass</option>
                    <option value="Improve cardiovascular endurance">Improve cardiovascular endurance</option>
                    <option value="Maintain overall health & fitness">Maintain overall fitness</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="p-activity" className="block text-[9px] font-mono font-semibold text-neutral-400 uppercase tracking-widest mb-1 font-bold">Activity Level</label>
                  <select id="p-activity" value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)} className="block w-full px-3 py-2 bg-black border border-neutral-800 focus:border-neutral-500 rounded-sm text-xs text-white focus:outline-none cursor-pointer">
                    <option value="Sedentary">Sedentary</option>
                    <option value="Lightly active">Lightly active</option>
                    <option value="Moderately active">Moderately active</option>
                    <option value="Very active">Very active</option>
                  </select>
                </div>

                <button type="submit" disabled={savingProfile} className="w-full py-2 bg-white text-black font-semibold text-xs rounded-sm uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50 hover:bg-neutral-200">
                  {savingProfile ? 'Synchronizing...' : 'Save Changes'}
                </button>
              </form>)}
          </div>

        </div>

      </div>


      <h3 className="text-[10px] font-mono tracking-[0.22em] text-neutral-500 uppercase font-bold border-b border-neutral-800/60 pb-2 pt-4">Bottom Layer: Historical logs & AI Coach</h3>
      
      <div id="bottom-layout" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest font-bold">Recorded workouts</span>
              <h4 className="text-sm font-bold text-white mt-0.5 font-serif italic">Recent Gym Logs</h4>
            </div>
            <button type="button" onClick={onNavigateToWorkouts} className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer font-serif italic transition-all">
              View complete list
              <ChevronRight className="h-3.5 w-3.5"/>
            </button>
          </div>

          {workouts.length > 0 ? (<div className="space-y-4">
              {workouts.slice(0, 3).map((w) => (<div key={w.id} className="p-4 rounded-sm border border-neutral-800 bg-[#0E0E0E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:bg-neutral-900/60">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400 text-[9px] font-mono uppercase font-bold tracking-widest">
                        {w.date}
                      </span>
                      <h4 className="text-sm font-semibold text-white font-serif italic">{w.title}</h4>
                    </div>
                    <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                      Exercises: {w.exercises.map(e => e.exerciseName).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 text-xs font-mono shrink-0">
                    <div className="text-left">
                      <div className="text-neutral-500 uppercase text-[9px] font-mono font-bold tracking-wider">Duration</div>
                      <div className="font-semibold text-white mt-0.5">{w.durationTotal}m</div>
                    </div>
                    <div className="text-left border-l border-neutral-800 pl-6">
                      <div className="text-neutral-500 uppercase text-[9px] font-mono font-bold tracking-wider">Calories</div>
                      <div className="font-extrabold text-[#10b981] mt-0.5">{w.caloriesTotal} kcal</div>
                    </div>
                  </div>
                </div>))}
            </div>) : (<div className="py-12 bg-neutral-900/10 rounded-sm border border-dashed border-neutral-800 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <Dumbbell className="h-8 w-8 text-neutral-600"/>
                <div>
                  <p className="text-sm font-semibold text-neutral-300">No active logs registered yet</p>
                  <p className="text-xs text-neutral-500 max-w-xs mt-1 leading-relaxed">Record your walks, jogs, lifts or wellness actions to trigger training trend lines.</p>
                </div>
                <button type="button" onClick={onNavigateToWorkouts} className="px-5 py-1.5 bg-neutral-900 hover:bg-white hover:text-black border border-neutral-800 transition-all text-[10px] font-bold uppercase tracking-widest rounded-sm text-center cursor-pointer text-white">
                  Log First Workout
                </button>
              </div>)}
        </div>

        <div className="space-y-4">
          <div>
            <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">Performance evaluation</span>
            <h4 className="text-sm font-bold text-white mt-0.5 font-serif italic">Weekly AI Insight</h4>
          </div>

          <div className="p-5 rounded-sm border border-[#10b981]/10 bg-[#0E0E0E] text-[#E0E0E0] space-y-4 shadow-xl hover:border-emerald-500/20 transition-all">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-emerald-400"/>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#10b981]">Gemini Insight</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans mt-1">
              Review weekly active days, workout volume, BMI, and weight progress together. Gemini uses your FitSync records to suggest next steps.
            </p>
            <button onClick={onNavigateToInsights} className="w-full py-2.5 bg-white hover:bg-neutral-100 text-black rounded-sm text-xs font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5">
              View Weekly Insight
              <ChevronRight className="h-3.5 w-3.5"/>
            </button>
          </div>
        </div>

      </div>

    </div>);
}
