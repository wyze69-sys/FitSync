import { useEffect, useMemo, useRef, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Link, useOutletContext } from "react-router-dom";
import {
  X,
  HeartPulse,
  Dumbbell,
  Clock,
  Flame,
  Sparkles,
  Trophy,
  Salad,
  CheckCircle2,
  Target,
  TrendingUp,
  Quote
} from "lucide-react";

const STAT_ICONS = {
  Workouts: Dumbbell,
  Minutes: HeartPulse,
  Calories: Flame,
  XP: Sparkles
};

const LEVEL_SUBTITLES = {
  1: { xpDesc: "Starting your fitness journey.", badgeDesc: "Start showing up and build habits." },
  2: { xpDesc: "Building momentum. Keep it up.", badgeDesc: "Habit foundation unlocked." },
  3: { xpDesc: "Reliable. Consistent. Building momentum.", badgeDesc: "Keep showing up and level up." },
  4: { xpDesc: "Establishing a solid routine.", badgeDesc: "Dedicated consistency." },
  5: { xpDesc: "Unstoppable momentum. Keep pushing.", badgeDesc: "Pushing boundaries daily." },
  6: { xpDesc: "Trained and disciplined athlete.", badgeDesc: "Perform like a champion." },
  7: { xpDesc: "Specializing and refining your habits.", badgeDesc: "Dedication in every session." },
  8: { xpDesc: "Pro athlete level. Serious results.", badgeDesc: "Leading by absolute example." },
  9: { xpDesc: "Elite fitness performer.", badgeDesc: "Exceptional mastery of habits." },
  10: { xpDesc: "Absolute legend. Peak consistency.", badgeDesc: "Inspirational commitment." },
};
import { useAuth } from "../context/AuthContext.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import AchievementBadge, { BadgeMedal } from "../components/gamification/AchievementBadge.jsx";
import insightService from "../services/insightService.js";
import gamificationService from "../services/gamificationService.js";
import announcementService from "../services/announcementService.js";
import nutritionService from "../services/nutritionService.js";
import progressService from "../services/progressService.js";

/**
 * Streak artwork is intentionally not implemented yet. XP-level badge art is
 * reserved for XP levels only, so streak celebrations stay blank until a
 * separate streak badge family exists.
 */
function streakArtForCount() {
  return null;
}

function prettyLabel(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .trim();
}

function NutritionEmblem({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function TrainingMark({ className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 15.5h16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M7 12.5v6M17 12.5v6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M9.5 9.25 12 5l2.5 4.25" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 9.5h8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function n(value) {
  return Number(value || 0);
}

function validNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function formatKg(value) {
  const parsed = validNumber(value);
  if (!parsed) return "—";
  return Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(1);
}

function parseLogDate(value) {
  if (!value) return null;
  const raw = String(value);
  const date = raw.includes("T") ? new Date(raw) : new Date(raw.replace(/-/g, "/"));
  return Number.isNaN(date.getTime()) ? null : date;
}

function todayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

function formatShortDate(value) {
  const date = parseLogDate(value);
  if (!date) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatWorkout(workout) {
  // The title saved by the new Log.jsx is just the subtype name (e.g. "Boxing").
  // For older workouts stored as "Boxing Sports", we try to split on the category name.
  const rawTitle = workout.title || workout.exercises?.[0]?.exerciseName || "Workout";
  const categoryName = workout.exercises?.[0]?.categoryName || "";
  // If title ends with " <CategoryName>", strip it to get the activity name only.
  const activity =
    categoryName && rawTitle.endsWith(` ${categoryName}`)
      ? rawTitle.slice(0, rawTitle.length - categoryName.length - 1).trim()
      : rawTitle;
  const group = categoryName;
  let formattedDate = "Today";
  if (workout.date) {
    const parts = String(workout.date).split("-");
    if (parts.length === 3) {
      const [y, m, d] = parts.map(Number);
      formattedDate = new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else {
      formattedDate = new Date(workout.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  }

  return {
    id: workout.id,
    activity,
    group,
    date: formattedDate,
    calories: n(workout.calories ?? workout.caloriesTotal),
    xp: n(workout.xp ?? workout.xp_earned),
    minutes: n(workout.durationTotal ?? workout.duration_min)
  };
}

export default function Dashboard() {
  const { user: authUser } = useAuth();
  const context = useOutletContext() || {};
  const gamification = context.gamification || {};
  const userName = authUser?.name || context.user?.name || "there";
  
  const firstName = useMemo(() => {
    const name = authUser?.name || context.user?.name || "there";
    return name.trim().split(/\s+/)[0].toUpperCase();
  }, [authUser, context.user]);

  const timeOfDay = useMemo(() => {
    return getTimeOfDay().toUpperCase();
  }, []);

  const totalXp = n(gamification.totalXp ?? gamification.total_xp);
  const nextLevelXp = n(gamification.nextLevelXp ?? gamification.next_level_xp);
  const currentStreak = n(gamification.currentStreak);
  const longestStreak = n(gamification.longestStreak);
  const level = n(gamification.level || 1);
  const todayWorkouts = n(gamification.todayWorkouts);
  const todayMinutes = n(gamification.todayMinutes);
  const todayCalories = n(gamification.todayCalories);
  const todayXp = n(gamification.todayXp);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dismissed_announcements") || "[]");
    } catch {
      return [];
    }
  });
  const recentWorkouts = useMemo(
    () => (context.workouts || []).slice(0, 3).map(formatWorkout),
    [context.workouts]
  );
  const activeBadge = useMemo(() => {
    const allBadges = gamification.badges || [];
    const levelTitle = gamification.title;
    const match = allBadges.find((b) => b.isUnlocked && b.name === levelTitle);
    if (match) return match;
    const firstUnlocked = allBadges.find((b) => b.isUnlocked);
    if (firstUnlocked) return firstUnlocked;
    return null;
  }, [gamification.badges, gamification.title]);

  const badges = useMemo(() => {
    return (gamification.badges || []).filter(
      (b) => String(b.requirement || "").toLowerCase() !== "streak"
    );
  }, [gamification.badges]);

  const nextReward = useMemo(() => {
    if (badges.length === 0) return null;
    const locked = badges.filter((b) => !b.isUnlocked);
    if (locked.length === 0) return { allUnlocked: true };

    const progressList = locked.map((badge) => {
      const type = String(badge.requirement || "").toLowerCase();
      const target = Number(badge.value || 0);
      let currentVal = 0;
      if (type === "streak") {
        currentVal = currentStreak;
      } else if (type === "workout") {
        currentVal = context.workoutTotal || 0;
      } else if (type === "level") {
        currentVal = level;
      }
      const pct = target > 0 ? Math.min(100, Math.max(0, (currentVal / target) * 100)) : 0;
      return {
        badge,
        currentVal,
        target,
        pct
      };
    });

    progressList.sort((a, b) => b.pct - a.pct);
    return progressList[0];
  }, [badges, currentStreak, context.workoutTotal, level]);

  const visibleAnnouncements = useMemo(() => {
    return announcements.filter(
      (ann) => ann.placement === "dashboard" && !dismissedIds.includes(ann.id)
    );
  }, [announcements, dismissedIds]);
  const [celebration, setCelebration] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const previousLevelRef = useRef(null);
  const shownStreakMilestonesRef = useRef(new Set());
  const shownUnlockRef = useRef(new Set());

  const [streakStatus, setStreakStatus] = useState(null);
  const [streakLoading, setStreakLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [nutritionPlan, setNutritionPlan] = useState(null);
  const [nutritionLoading, setNutritionLoading] = useState(true);
  const [weightInput, setWeightInput] = useState("");
  const [weightSaving, setWeightSaving] = useState(false);

  const cleanWeightLogs = useMemo(() => {
    if (!Array.isArray(context.weightLogs)) return [];
    return context.weightLogs
      .filter((log) => {
        const weight = validNumber(log?.weight);
        const date = parseLogDate(log?.date);
        return weight > 0 && Boolean(date);
      })
      .sort((a, b) => {
        const dateDiff = parseLogDate(a.date) - parseLogDate(b.date);
        if (dateDiff !== 0) return dateDiff;
        const aCreated = parseLogDate(a.createdAt || a.created_at);
        const bCreated = parseLogDate(b.createdAt || b.created_at);
        if (aCreated && bCreated) return aCreated - bCreated;
        return 0;
      });
  }, [context.weightLogs]);

  const bodyProgress = useMemo(() => {
    const profile = context.user || authUser || {};
    const profileWeight = validNumber(profile.weight ?? profile.currentWeight ?? profile.current_weight);
    const targetWeight = validNumber(profile.targetWeight ?? profile.target_weight);
    const latestLog = cleanWeightLogs[cleanWeightLogs.length - 1];
    const firstLog = cleanWeightLogs[0];
    const currentWeight = latestLog ? validNumber(latestLog.weight) : profileWeight;
    const startWeight = firstLog ? validNumber(firstLog.weight) : profileWeight;
    const totalChange = cleanWeightLogs.length >= 2 && currentWeight && startWeight ? currentWeight - startWeight : 0;
    const toTarget = currentWeight && targetWeight ? Math.abs(currentWeight - targetWeight) : 0;
    const progressPct = targetWeight && startWeight && currentWeight && targetWeight !== startWeight
      ? Math.min(100, Math.max(0, ((startWeight - currentWeight) / (startWeight - targetWeight)) * 100))
      : 0;

    let daysTracked = "Profile start";
    if (cleanWeightLogs.length >= 2) {
      const startDate = parseLogDate(firstLog.date);
      const endDate = parseLogDate(latestLog.date);
      if (startDate && endDate) {
        const diff = Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        daysTracked = `${diff} ${diff === 1 ? "day" : "days"}`;
      }
    } else if (cleanWeightLogs.length === 1) {
      daysTracked = "1 saved log";
    }

    return {
      currentWeight,
      startWeight,
      targetWeight,
      totalChange,
      toTarget,
      progressPct: Math.round(progressPct),
      daysTracked,
      latestDate: latestLog?.date || null,
      logCount: cleanWeightLogs.length
    };
  }, [authUser, cleanWeightLogs, context.user]);

  const fetchStreakStatus = async () => {
    try {
      const res = await gamificationService.getStreakStatus();
      setStreakStatus(res);
    } catch (err) {
      console.error("Failed to fetch streak status", err);
    } finally {
      setStreakLoading(false);
    }
  };

  const fetchActiveAnnouncements = async () => {
    try {
      const res = await announcementService.getActiveAnnouncements();
      setAnnouncements(res || []);
    } catch (err) {
      console.error("Failed to fetch active announcements", err);
      setAnnouncements([]);
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const handleDismissAnnouncement = (id) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      localStorage.setItem("dismissed_announcements", JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to save dismissed announcements", err);
    }
  };

  useEffect(() => {
    fetchStreakStatus();
  }, [gamification]);

  const fetchNutritionPlan = async () => {
    try {
      const res = await nutritionService.getPlan({ mode: "safe", limit: 3 });
      setNutritionPlan(res);
    } catch (err) {
      console.error("Failed to fetch nutrition plan", err);
    } finally {
      setNutritionLoading(false);
    }
  };

  const handleQuickWeightUpdate = async (event) => {
    event.preventDefault();
    const nextWeight = Number(weightInput);
    if (!Number.isFinite(nextWeight) || nextWeight < 20 || nextWeight > 500) {
      context.push?.("Enter a valid weight between 20 and 500 kg.", "error");
      return;
    }

    setWeightSaving(true);
    try {
      await progressService.createWeightLog({
        date: todayDateInput(),
        weight: nextWeight,
        notes: "Quick update from Home"
      });
      setWeightInput("");
      context.push?.("Weight updated. Progress refreshed.", "success");
      await context.refreshAll?.();
    } catch (err) {
      context.push?.(err.message || "Could not update weight.", "error");
    } finally {
      setWeightSaving(false);
    }
  };

  useEffect(() => {
    fetchActiveAnnouncements();
    fetchNutritionPlan();
  }, []);

  const handleRestoreStreak = async () => {
    setActionLoading(true);
    try {
      const res = await gamificationService.restoreStreak();
      setStreakStatus(res);
      context.push("Streak successfully restored! 🎉", "success");
      await context.refreshAll();
    } catch (err) {
      context.push(err.message || "Failed to restore streak.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartNewStreak = async () => {
    setActionLoading(true);
    try {
      const res = await gamificationService.startNewStreak();
      setStreakStatus(res);
      context.push("New weekly streak started! Let's go! 💪", "success");
      await context.refreshAll();
    } catch (err) {
      context.push(err.message || "Failed to start new streak.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch latest AI insight on mount
  useEffect(() => {
    let cancelled = false;
    insightService
      .getInsights()
      .then((insights) => {
        if (!cancelled && Array.isArray(insights) && insights.length > 0) {
          setAiInsight(insights[0]);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleGenerateInsight = async () => {
    setAiLoading(true);
    try {
      const insight = await insightService.generateWeeklyInsight();
      setAiInsight(insight);
    } catch (err) {
      // silently fail — card shows fallback
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (!gamification || context.loading) return;

    const previousLevel = previousLevelRef.current;
    const newUnlocks = gamification.newlyUnlocked || gamification.badge_awarded || [];
    const unlockList = Array.isArray(newUnlocks) ? newUnlocks : [newUnlocks].filter(Boolean);
    const unlockKey = unlockList
      .map((badge) => badge.code || badge.id || badge.name)
      .filter(Boolean)
      .join(":");
    const hasNewUnlock = unlockKey && !shownUnlockRef.current.has(unlockKey);

    if (hasNewUnlock) shownUnlockRef.current.add(unlockKey);

    if ((previousLevel !== null && previousLevel < level) || hasNewUnlock) {
      setCelebration({ type: "level", level, title: gamification.title || "New Rank" });
    }

    previousLevelRef.current = level;
  }, [context.loading, gamification, level]);

  useEffect(() => {
    const milestones = [7, 14, 30, 60, 100];
    if (
      !context.loading &&
      milestones.includes(currentStreak) &&
      !shownStreakMilestonesRef.current.has(currentStreak)
    ) {
      shownStreakMilestonesRef.current.add(currentStreak);
      setCelebration({ type: "streak", streak: currentStreak });
    }
  }, [context.loading, currentStreak]);

  if (context.loading) return <LoadingSpinner label="Loading dashboard" />;

  if (context.error) return <ErrorPanel message={context.error} onRetry={context.refreshAll} />;

  const renderWeeklyStreakBanner = () => {
    if (streakLoading || !streakStatus) return null;

    const {
      weeklyStreak,
      streakStatus: status,
      restoreType,
      restoreCost,
      currentWeekWorkoutCount,
      streakFreezes,
      paidRestoresThisMonth,
      totalXp
    } = streakStatus;

    // 1. Secured state
    if (status === "active" && currentWeekWorkoutCount >= 3) {
      return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-xs font-medium text-emerald-400">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1" />
            <span className="font-bold tracking-wider uppercase">Weekly streak secured</span>
            <span className="text-emerald-500/30 mx-1">|</span>
            <span className="text-emerald-400/80">
              {currentWeekWorkoutCount} workouts logged this week · {weeklyStreak} week streak is safe.
            </span>
          </div>
          <span className="font-mono text-[9px] tracking-widest text-emerald-500/70 uppercase">
            System Nominal
          </span>
        </div>
      );
    }

    // 2. Normal Progress
    if (status === "active" && currentWeekWorkoutCount < 3) {
      const remaining = 3 - currentWeekWorkoutCount;
      return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3 rounded-full border border-primary/20 bg-primary/5 text-xs font-medium text-primary">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse mr-1" />
            <span className="font-bold tracking-wider uppercase">Weekly Streak Progress</span>
            <span className="text-primary/30 mx-1">|</span>
            <span className="text-primary/80">
              Log {remaining} more workout{remaining > 1 ? "s" : ""} by Sunday to maintain your {weeklyStreak} week streak.
            </span>
          </div>
          <span className="font-mono text-[10px] font-bold uppercase">
            {currentWeekWorkoutCount} / 3
          </span>
        </div>
      );
    }

    // 3. At Risk - Free Freeze Available
    if (status === "at_risk" && restoreType === "freeze") {
      return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3 rounded-full border border-amber-500/20 bg-amber-500/5 text-xs font-medium text-amber-400">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse mr-1" />
            <span className="font-bold tracking-wider uppercase">Weekly streak at risk</span>
            <span className="text-amber-500/30 mx-1">|</span>
            <span className="text-amber-400/80">
              Restore your {weeklyStreak} week streak now using a free freeze.
            </span>
          </div>
          <button
            type="button"
            onClick={handleRestoreStreak}
            disabled={actionLoading}
            className="rounded-full bg-amber-500 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-black transition hover:bg-amber-400 disabled:opacity-50 cursor-pointer"
          >
            {actionLoading ? "Restoring..." : `Restore with Free Freeze (${streakFreezes} left)`}
          </button>
        </div>
      );
    }

    // 4. At Risk - Paid Restore Available
    if (status === "at_risk" && restoreType === "xp") {
      return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3 rounded-full border border-orange-500/20 bg-orange-500/5 text-xs font-medium text-orange-400">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-orange-400 animate-pulse mr-1" />
            <span className="font-bold tracking-wider uppercase">Weekly streak at risk</span>
            <span className="text-orange-500/30 mx-1">|</span>
            <span className="text-orange-400/80">
              Restore your {weeklyStreak} week streak for {restoreCost} XP.
            </span>
          </div>
          <button
            type="button"
            onClick={handleRestoreStreak}
            disabled={actionLoading}
            className="rounded-full bg-orange-500 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-orange-400 disabled:opacity-50 cursor-pointer"
          >
            {actionLoading ? "Restoring..." : `Restore for ${restoreCost} XP`}
          </button>
        </div>
      );
    }

    // 5. At Risk - Insufficient XP
    if (
      status === "at_risk" &&
      streakFreezes === 0 &&
      paidRestoresThisMonth < 2 &&
      totalXp < restoreCost
    ) {
      return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3 rounded-full border border-red-500/20 bg-red-500/5 text-xs font-medium text-red-400">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-red-400 animate-pulse mr-1" />
            <span className="font-bold tracking-wider uppercase">Weekly streak at risk</span>
            <span className="text-red-500/30 mx-1">|</span>
            <span className="text-red-400/80">
              Need {restoreCost} XP to restore streak (have {totalXp} XP).
            </span>
          </div>
          <span className="font-mono text-[10px] font-bold uppercase text-red-500">
            Insufficient XP
          </span>
        </div>
      );
    }

    // 6. At Risk - Restore Limit Reached
    if (status === "at_risk" && restoreType === "limit_reached") {
      return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3 rounded-full border border-red-500/20 bg-red-500/5 text-xs font-medium text-red-400">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-red-400 animate-pulse mr-1" />
            <span className="font-bold tracking-wider uppercase">Weekly streak at risk</span>
            <span className="text-red-500/30 mx-1">|</span>
            <span className="text-red-400/80">
              Reached monthly limit of 2 paid restores.
            </span>
          </div>
          <span className="font-mono text-[10px] font-bold uppercase text-red-500">
            Limit Reached
          </span>
        </div>
      );
    }

    // 7. Broken
    if (status === "broken") {
      return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3 rounded-full border border-gray-600/20 bg-gray-800/5 text-xs font-medium text-gray-400">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-gray-500 animate-pulse mr-1" />
            <span className="font-bold tracking-wider uppercase">Weekly streak broken</span>
            <span className="text-gray-500/30 mx-1">|</span>
            <span className="text-gray-400/80">
              Consistency streak ended. Start a new streak to begin building again!
            </span>
          </div>
          <button
            type="button"
            onClick={handleStartNewStreak}
            disabled={actionLoading}
            className="rounded-full bg-primary px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-secondary disabled:opacity-50 cursor-pointer"
          >
            {actionLoading ? "Starting..." : "Start New Streak"}
          </button>
        </div>
      );
    }

    return null;
  };

  const xpMax = nextLevelXp > 0 ? nextLevelXp : Math.max(totalXp, 1);
  const xpPct = xpMax > 0 ? Math.min(100, Math.round((totalXp / xpMax) * 100)) : 0;
  const xpRemaining = Math.max(0, xpMax - totalXp);
  const dailyMessage =
    streakStatus?.streakStatus === "at_risk"
      ? "Streak is at risk. Log a workout or check in today to protect your weekly consistency."
      : streakStatus?.streakStatus === "broken"
      ? "Your weekly streak ended. Start a new streak today and build consistency back."
      : todayWorkouts === 0
      ? "No workouts logged today yet. Start with a quick session or a wellness check-in."
      : "You logged a workout today. Keep pushing toward your weekly target.";

  const todaySummary = [
    { label: "Workouts", value: todayWorkouts, sub: "Today", mark: "LOG" },
    { label: "Minutes", value: `${todayMinutes}m`, sub: "Today", mark: "MIN" },
    { label: "Calories", value: todayCalories, sub: "Today", mark: "CAL" },
    { label: "XP", value: todayXp, sub: "Today", mark: "XP" }
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-5 text-text animate-fade-in">
      {celebration && (
        <CelebrationModal celebration={celebration} onClose={() => setCelebration(null)} />
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pt-2 pb-1.5">
        <div className="space-y-2 text-left">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
            DAILY FOCUS
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold uppercase tracking-tight text-text">
            {timeOfDay}, {firstName} 
          </h1>
          <p className="text-sm leading-relaxed text-secondary max-w-xl">
            {dailyMessage}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/log"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-primary-contrast shadow-sm hover:bg-primary-bright focus-visible:outline-none transition-all cursor-pointer"
          >
            <span className="text-[14px] font-bold">+</span> LOG WORKOUT
          </Link>
          <button
            type="button"
            onClick={() => context.recordCheckin?.("Wellness check-in")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white/[0.02] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-text hover:bg-white/[0.08] focus-visible:outline-none transition-all cursor-pointer"
          >
            <HeartPulse className="h-4 w-4" /> WELLNESS CHECK-IN
          </button>
        </div>
      </div>

      {visibleAnnouncements.map((ann) => (
        <div
          key={ann.id}
          className="flex items-start justify-between gap-3.5 rounded-xl border border-primary/20 bg-primary/10 p-4 text-left shadow-md animate-slide-up"
        >
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 font-mono text-[10px] font-black text-primary">
              MSG
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-text md:text-sm">{ann.title}</h3>
              <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-muted md:text-xs">
                {ann.body}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleDismissAnnouncement(ann.id)}
            className="rounded-full p-1 text-muted transition hover:bg-border/30 hover:text-text cursor-pointer"
            aria-label="Dismiss announcement"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      <section className="grid gap-5 text-left lg:grid-cols-[0.3fr_0.7fr]" aria-label="Body progress quick update">
        <article className="relative min-h-[250px] overflow-hidden rounded-2xl border border-border bg-surface p-4">
          <div className="absolute inset-x-8 top-8 h-24 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="relative flex h-full min-h-[210px] flex-col justify-between">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
                  Motion slot
                </span>
                <h2 className="mt-1.5 text-lg font-black uppercase tracking-tight text-text">
                  Progress Energy
                </h2>
              </div>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                Live
              </span>
            </div>
            <div className="mx-auto my-1.5 flex w-full max-w-[200px] flex-1 items-center justify-center">
              <DotLottieReact
                src="https://lottie.host/0714f312-717f-4118-9651-e8d3c97e8607/WVW5n48chI.lottie"
                loop
                autoplay
                className="h-full min-h-[140px] w-full"
              />
            </div>
            <p className="text-xs leading-relaxed text-muted">
              Keep the momentum visible while your real weight history updates beside it.
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-surface p-5 text-left">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
                Body progress
              </span>
              <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-text md:text-2xl">
                Quick Weight Update
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-secondary">
                Update today's weight and watch Home and Progress use the saved real log immediately.
              </p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/10 px-3.5 py-2 text-right">
              <div className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                Target
              </div>
              <div className="mt-0.5 font-mono text-xl font-black text-text">
                {formatKg(bodyProgress.targetWeight)}<span className="ml-1 text-xs font-bold text-muted">kg</span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-border/60 bg-bg p-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Current</div>
              <div className="mt-1.5 font-mono text-2xl font-black text-text">
                {formatKg(bodyProgress.currentWeight)}<span className="ml-1 text-xs font-bold text-muted">kg</span>
              </div>
              <div className="mt-1 text-[11px] text-muted">
                {bodyProgress.latestDate ? `Latest ${formatShortDate(bodyProgress.latestDate)}` : "Profile weight"}
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-bg p-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Start</div>
              <div className="mt-1.5 font-mono text-2xl font-black text-text">
                {formatKg(bodyProgress.startWeight)}<span className="ml-1 text-xs font-bold text-muted">kg</span>
              </div>
              <div className="mt-1 text-[11px] text-muted">
                {bodyProgress.logCount ? "First saved log" : "Profile start"}
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-bg p-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Change</div>
              <div className={`mt-1.5 font-mono text-2xl font-black ${bodyProgress.totalChange < 0 ? "text-primary" : bodyProgress.totalChange > 0 ? "text-amber-400" : "text-text"}`}>
                {bodyProgress.logCount >= 2 ? `${bodyProgress.totalChange > 0 ? "+" : ""}${bodyProgress.totalChange.toFixed(1)}` : "—"}
                <span className="ml-1 text-xs font-bold text-muted">kg</span>
              </div>
              <div className="mt-1 text-[11px] text-muted">{bodyProgress.daysTracked}</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-bg p-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">To target</div>
              <div className="mt-1.5 font-mono text-2xl font-black text-text">
                {formatKg(bodyProgress.toTarget)}<span className="ml-1 text-xs font-bold text-muted">kg</span>
              </div>
              <div className="mt-1 text-[11px] text-muted">{bodyProgress.progressPct}% complete</div>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-full bg-bg">
            <div className="h-2 rounded-full bg-primary transition-all duration-700" style={{ width: `${bodyProgress.progressPct}%` }} />
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            <span>Start {formatKg(bodyProgress.startWeight)} kg</span>
            <span>Target {formatKg(bodyProgress.targetWeight)} kg</span>
          </div>

          <form onSubmit={handleQuickWeightUpdate} className="mt-4 grid gap-3 rounded-xl border border-border/60 bg-bg p-3 md:grid-cols-[1fr_auto] md:items-end">
            <label className="block">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                Today's weight
              </span>
              <div className="mt-1.5 flex items-center rounded-lg border border-border bg-surface px-3 py-2 focus-within:border-primary/60">
                <input
                  type="number"
                  min="20"
                  max="500"
                  step="0.1"
                  value={weightInput}
                  onChange={(event) => setWeightInput(event.target.value)}
                  placeholder={bodyProgress.currentWeight ? formatKg(bodyProgress.currentWeight) : "65"}
                  className="w-full bg-transparent font-mono text-sm font-bold text-text outline-none placeholder:text-muted"
                />
                <span className="ml-2 font-mono text-xs font-bold uppercase text-muted">kg</span>
              </div>
            </label>
            <button
              type="submit"
              disabled={weightSaving}
              className="inline-flex min-h-[38px] items-center justify-center rounded-lg bg-primary px-4 py-2 font-mono text-[11px] font-black uppercase tracking-[0.15em] text-primary-contrast transition hover:bg-primary-bright disabled:cursor-not-allowed disabled:opacity-60"
            >
              {weightSaving ? "Saving..." : "Update Weight"}
            </button>
          </form>
        </article>
      </section>

      {/* Connected Progress Summary Card */}
      <section className="rounded-2xl border border-border bg-surface p-5 text-left" aria-label="Athlete progress summary">
        {/* Top part: Streak, XP Progress, Current Badge */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-12 items-stretch">
          {/* Commit Streak Column */}
          <div className="md:col-span-3 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border/60 pb-4 md:pb-0 md:pr-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Commit streak</span>
              <div className="flex items-center gap-2.5 mt-3">
                <div className="grid size-10 place-items-center rounded-xl bg-orange-500/10 text-streak">
                  <Flame className="h-6 w-6" fill="currentColor" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-3xl font-black text-text leading-none">{currentStreak}</span>
                  <span className="text-xs text-secondary font-semibold lowercase">
                    {currentStreak === 1 ? "day" : "days"}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-muted mt-3">
              Longest <span className="font-bold text-text">{longestStreak} {longestStreak === 1 ? "day" : "days"}</span>
            </div>
          </div>

          {/* Athlete XP / Level Progress Column */}
          <div className="md:col-span-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border/60 pb-4 md:pb-0 md:px-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Athlete XP · Level {level}</span>
              <span className="rounded bg-primary/10 border border-primary/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-primary">
                XP {totalXp} / {xpMax}
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-lg font-black uppercase text-text tracking-tight">
                {gamification.title || "Warm Up"}
              </div>
              <p className="text-[11px] text-secondary font-medium mt-0.5 leading-relaxed">
                {LEVEL_SUBTITLES[level]?.xpDesc || "Reliable. Consistent. Building momentum."}
              </p>
            </div>
            <div className="mt-3.5">
              <div className="h-2 overflow-hidden rounded-full bg-bg">
                <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${xpPct}%` }} />
              </div>
              <div className="mt-2 flex justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                <span>{xpPct}% to Level {level + 1}</span>
                <span>{xpRemaining} XP remaining</span>
              </div>
            </div>
          </div>

          {/* Current Badge Column */}
          <div className="md:col-span-3 flex flex-col items-center justify-center text-center pt-3 md:pt-0 md:pl-4">
            <BadgeMedal level={level} size="md" showLevel={false} />
            <div className="mt-2.5">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-text">
                {(gamification.title || "Warm Up")} Badge
              </div>
              <p className="text-[10px] text-muted font-medium mt-1 leading-snug">
                {LEVEL_SUBTITLES[level]?.badgeDesc || "Keep showing up and level up."}
              </p>
            </div>
          </div>
        </div>

        {/* Separator line */}
        <div className="my-4.5 border-t border-border/60" />

        {/* Bottom part: Today Snapshot Header & Metrics */}
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted block mb-2.5">Today Snapshot</span>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {todaySummary.map((item) => {
              const IconComponent = STAT_ICONS[item.label];
              return (
                <div key={item.label} className="flex items-center gap-2.5 rounded-lg border border-border bg-bg/50 p-3.5 transition hover:border-primary/20">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/10 bg-primary/5 text-primary">
                    {IconComponent && <IconComponent className="h-5 w-5" aria-hidden="true" />}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-bold">{item.label}</div>
                    <div className="font-mono text-lg font-black text-text leading-none">{item.value}</div>
                    <div className="font-mono text-[8px] uppercase tracking-widest text-muted/60">{item.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 grid-cols-1 lg:grid-cols-3 text-left">
        {/* Nutrition Card - Nutrition & Recovery Preview */}
        <article className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Salad className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2 className="text-md font-bold uppercase tracking-wider text-text">Nutrition & Recovery Preview</h2>
              </div>
              <Link to="/nutrition" className="text-xs font-bold uppercase tracking-widest text-primary hover:text-primary-bright transition-colors">
                View Plan
              </Link>
            </div>

            {nutritionLoading ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted">Loading nutrition plan...</div>
            ) : !nutritionPlan || nutritionPlan.profile?.isIncomplete ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <p className="text-sm text-muted">Complete your profile in the Profile tab to build your nutrition plan.</p>
                <Link to="/you" className="inline-flex rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-all">
                  Complete Profile
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-border bg-bg/50 p-4 flex flex-col justify-between">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted font-bold">Calorie Target</div>
                      <div className="mt-1.5 font-mono text-2xl font-black text-text flex items-baseline gap-1">
                        {nutritionPlan.calculations?.todayAdjustedTarget || nutritionPlan.activePlan?.calories || 0}{" "}
                        <span className="text-xs text-muted font-bold lowercase">kcal</span>
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] leading-relaxed text-muted">
                      Adjusted based on today's workouts: <span className="font-bold text-primary">+{nutritionPlan.calculations?.todayWorkoutCalories || 0} kcal</span> burn
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-bg/50 p-4 flex flex-col justify-between">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted font-bold">Protein Target</div>
                      <div className="mt-1.5 font-mono text-2xl font-black text-text flex items-baseline gap-1">
                        {nutritionPlan.macros?.proteinG || 0}
                        <span className="text-xs text-muted font-bold lowercase">g</span>
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] leading-relaxed text-muted">
                      Target: <span className="font-bold text-text">{nutritionPlan.macros?.proteinPct ?? 26}%</span> of daily calorie intake
                    </div>
                  </div>
                </div>

                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted font-bold">Recommended Foods</div>
                {Array.isArray(nutritionPlan.recommendations) && nutritionPlan.recommendations.length > 0 ? (
                  <div className="space-y-2">
                    {nutritionPlan.recommendations.slice(0, 3).map((food) => (
                      <div key={food.id} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-bg/30 p-2.5 transition hover:border-primary/20">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/5 text-primary">
                            <Salad className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold text-text" title={food.name}>{food.name}</div>
                            <span className="inline-block mt-0.5 rounded-md border border-border/40 bg-surface px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-muted">
                              {prettyLabel(food.foodType)}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right font-mono">
                          <div className="text-xs font-bold text-text">{food.calories} cal</div>
                          <div className="text-[10px] font-bold text-primary">{food.proteinG}g P</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted">No recommendations available</p>
                )}
              </>
            )}
          </div>
        </article>

        {/* AI Coaching / Wellness Card */}
        <article className="flex flex-col rounded-2xl bg-primary p-5 text-primary-contrast lg:col-span-1 justify-between h-full">
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-sm font-bold uppercase tracking-widest text-primary-contrast/85">Weekly Coaching Note</h2>
              <Sparkles className="h-4 w-4 text-primary-contrast/80" aria-hidden="true" />
            </div>

            {aiInsight ? (
              <div className="space-y-3.5">
                <div className="flex gap-2.5 items-start">
                  <Quote className="h-5 w-5 shrink-0 text-primary-contrast/40" />
                  <p className="text-sm font-medium leading-relaxed italic text-primary-contrast">
                    {aiInsight.summary}
                  </p>
                </div>

                {aiInsight.recommendations && aiInsight.recommendations.length > 0 && (
                  <div className="space-y-2.5 border-t border-primary-contrast/15 pt-3">
                    {aiInsight.recommendations.slice(0, 3).map((rec, index) => {
                      let title = "Tip";
                      let Icon = Sparkles;
                      if (index === 0) {
                         title = "Keep it up";
                         Icon = CheckCircle2;
                      } else if (index === 1) {
                         title = "Focus this week";
                         Icon = Target;
                      } else if (index === 2) {
                         title = "Small steps";
                         Icon = TrendingUp;
                      }
                      return (
                        <div key={index} className="flex items-start gap-3 text-left">
                          <Icon className="h-4.5 w-4.5 shrink-0 text-primary-contrast/85 mt-0.5" />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-primary-contrast">{title}</div>
                            <div className="text-[11px] leading-relaxed text-primary-contrast/75 font-medium">{rec}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-4">
                <h3 className="text-lg font-black text-primary-contrast">{currentStreak > 0 ? "Your week in review" : "Start with a 30-minute base"}</h3>
                <p className="mt-2 text-sm leading-relaxed text-primary-contrast/80">
                  {recentWorkouts.length > 0
                    ? `You've logged ${recentWorkouts.length} recent sessions. Generate an AI-powered insight to see personalized tips.`
                    : "Log a few workouts to unlock your personalized weekly AI insight."}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleGenerateInsight}
            disabled={aiLoading}
            className="w-full mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-xs font-black uppercase tracking-widest text-primary hover:bg-white/90 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {aiLoading ? "Generating…" : "Generate New Coach Note"}
          </button>
        </article>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5 text-left">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-md font-bold uppercase tracking-wider text-text">Last 3 Workouts</h2>
          </div>
          <Link to="/workouts" className="text-xs font-bold uppercase tracking-widest text-primary hover:text-primary-bright transition-colors">
            View All
          </Link>
        </div>
        {recentWorkouts.length > 0 ? (
          <div className="space-y-2">
            {recentWorkouts.map((workout) => (
              <div key={workout.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-transparent p-2 transition hover:border-border hover:bg-white/[0.03] sm:grid-cols-12">
                <div className="flex min-w-0 items-center gap-4 sm:col-span-6">
                  <span className="shrink-0 font-mono text-xs text-muted">{workout.date}</span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-text">{workout.activity}</div>
                    <div className="font-mono text-[10px] uppercase tracking-wide text-muted">{workout.minutes} min</div>
                  </div>
                </div>
                <div className="hidden font-mono text-sm text-primary sm:col-span-2 sm:block">+{workout.xp} XP</div>
                <div className="hidden font-mono text-sm text-muted sm:col-span-2 sm:block">{workout.calories} cal</div>
                <div className="text-right sm:col-span-2">
                  {workout.group && (
                    <span className="rounded border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted">{workout.group}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={TrainingMark}
            title="No workouts yet — log your first in 10s"
            description="Quick Log keeps the first workout fast and typing-free."
            action={
              <Link to="/log" className="inline-flex rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                Quick Log
              </Link>
            }
          />
        )}
      </section>
    </main>
  );

}

function ErrorPanel({ message, onRetry }) {
  return (
    <section
      role="alert"
      className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-text"
    >
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-2xl border border-red-400/40 px-4 py-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        Retry
      </button>
    </section>
  );
}

const CONFETTI_COLORS = ["#10B981", "#34D399", "#F59E0B", "#EF4444", "#8B5CF6"];

function CelebrationModal({ celebration, onClose }) {
  const isLevel = celebration.type === "level";
  const title = isLevel
    ? `Level Up! You reached Level ${celebration.level}`
    : `${celebration.streak} Day Streak!`;
  const subtitle = isLevel ? celebration.title : "Your consistency is heating up.";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-gray-900/45 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
    >
      <div aria-live="polite" className="sr-only">
        {title} {subtitle}
      </div>
      {Array.from({ length: 30 }).map((_, index) => (
        <span
          key={index}
          className="confetti-piece"
          style={{
            "--confetti-left": `${(index * 37) % 100}%`,
            "--confetti-color": CONFETTI_COLORS[index % CONFETTI_COLORS.length],
            "--confetti-delay": `${(index % 10) * 0.08}s`,
            "--confetti-duration": `${2 + (index % 6) * 0.18}s`,
            "--confetti-drift": `${index % 2 === 0 ? "" : "-"}${18 + (index % 8) * 4}px`
          }}
        />
      ))}
      <section className="relative w-full max-w-md rounded-3xl border border-border bg-surface p-7 text-center shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-muted hover:bg-bg hover:text-text"
          aria-label="Close celebration"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
        <div className="animate-medal-reveal">
          {isLevel ? (
            <AchievementBadge
              size="xl"
              badge={{ level: celebration.level, name: celebration.title }}
            />
          ) : streakArtForCount(celebration.streak) ? (
            <div className="mx-auto grid h-32 w-32 place-items-center">
              <img
                src={streakArtForCount(celebration.streak)}
                alt=""
                aria-hidden="true"
                draggable="false"
                className="h-full w-full select-none object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.28)] animate-flame-pulse"
              />
            </div>
          ) : (
            <div className="mx-auto h-24 w-24 rounded-3xl border border-dashed border-border bg-bg/35 shadow-sm" aria-hidden="true" />
          )}
        </div>
        <h2 id="celebration-title" className="mt-6 text-2xl font-black text-text">
          {title}
        </h2>
        <p className="mt-2 text-sm font-semibold text-primary">{subtitle}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-md shadow-primary/20 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-primary"
        >
          Continue
        </button>
      </section>
    </div>
  );
}
