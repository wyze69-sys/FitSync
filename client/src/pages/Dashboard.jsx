import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Dumbbell, Flame, Sparkles, Terminal, Timer, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import PageHeader from "../components/common/PageHeader.jsx";
import StatCard from "../components/common/StatCard.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import StreakCard from "../components/gamification/StreakCard.jsx";
import XPProgressBar from "../components/gamification/XPProgressBar.jsx";
import AchievementBadge from "../components/gamification/AchievementBadge.jsx";
import insightService from "../services/insightService.js";
import gamificationService from "../services/gamificationService.js";

function n(value) {
  return Number(value || 0);
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
  return {
    id: workout.id,
    activity,
    group,
    date: workout.date
      ? new Date(workout.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "Today",
    calories: n(workout.calories ?? workout.caloriesTotal),
    xp: n(workout.xp ?? workout.xp_earned),
    minutes: n(workout.durationTotal ?? workout.duration_min)
  };
}

export default function Dashboard() {
  const { user: authUser } = useAuth();
  const context = useOutletContext();
  const gamification = context.gamification || {};
  const recentWorkouts = useMemo(
    () => context.workouts.slice(0, 3).map(formatWorkout),
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
    const allBadges = gamification.badges || [];
    const displayedBadgeCode = activeBadge?.code;
    return allBadges
      .filter((badge) => badge.isUnlocked && badge.code !== displayedBadgeCode)
      .slice(0, 3);
  }, [gamification.badges, activeBadge]);
  const userName = authUser?.name || context.user?.name || "there";
  const totalXp = n(gamification.totalXp ?? gamification.total_xp);
  const nextLevelXp = n(gamification.nextLevelXp ?? gamification.next_level_xp);
  const currentStreak = n(gamification.currentStreak);
  const longestStreak = n(gamification.longestStreak);
  const level = n(gamification.level || 1);
  const todayWorkouts = n(gamification.todayWorkouts);
  const todayMinutes = n(gamification.todayMinutes);
  const todayCalories = n(gamification.todayCalories);
  const todayXp = n(gamification.todayXp);
  const [celebration, setCelebration] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const previousLevelRef = useRef(null);
  const shownStreakMilestonesRef = useRef(new Set());
  const shownUnlockRef = useRef(new Set());

  const [streakStatus, setStreakStatus] = useState(null);
  const [streakLoading, setStreakLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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

  useEffect(() => {
    fetchStreakStatus();
  }, [gamification]);

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
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 shadow-md shadow-emerald-500/5 transition duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Flame className="h-6 w-6 fill-current animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-400">Weekly Streak Secured! 🎉</h3>
              <p className="text-sm text-muted mt-0.5">
                You logged {currentWeekWorkoutCount} workouts this week. Your {weeklyStreak} week
                streak is safe.
              </p>
            </div>
          </div>
          <div className="rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wide text-emerald-500">
            Secured
          </div>
        </div>
      );
    }

    // 2. Normal Progress
    if (status === "active" && currentWeekWorkoutCount < 3) {
      const remaining = 3 - currentWeekWorkoutCount;
      return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-primary/20 bg-primary/5 shadow-md shadow-primary/5 transition duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-text">Weekly Streak Progress</h3>
              <p className="text-sm text-muted mt-0.5">
                Log {remaining} more workout{remaining > 1 ? "s" : ""} by Sunday 23:59:59 (local
                time) to maintain your {weeklyStreak} week streak.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary">{currentWeekWorkoutCount} / 3</span>
            <div className="h-2 w-20 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${(currentWeekWorkoutCount / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      );
    }

    // 3. At Risk - Free Freeze Available
    if (status === "at_risk" && restoreType === "freeze") {
      return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-amber-500/25 bg-amber-500/5 shadow-md shadow-amber-500/5 transition duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-400">Weekly Streak At Risk! ⚠️</h3>
              <p className="text-sm text-muted mt-0.5">
                You missed last week. Restore your {weeklyStreak} week streak now using a free
                freeze.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRestoreStreak}
            disabled={actionLoading}
            className="w-full md:w-auto inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-black shadow-md shadow-amber-500/10 transition hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50 font-bold"
          >
            {actionLoading ? "Restoring..." : `Restore with Free Freeze (${streakFreezes} left)`}
          </button>
        </div>
      );
    }

    // 4. At Risk - Paid Restore Available
    if (status === "at_risk" && restoreType === "xp") {
      return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-orange-500/25 bg-orange-500/5 shadow-md shadow-orange-500/5 transition duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
              <Flame className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-orange-400">Weekly Streak At Risk! ⚠️</h3>
              <p className="text-sm text-muted mt-0.5">
                You missed last week and have no freezes left. Restore your {weeklyStreak} week
                streak for {restoreCost} XP.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRestoreStreak}
            disabled={actionLoading}
            className="w-full md:w-auto inline-flex items-center justify-center rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-md shadow-orange-500/10 transition hover:bg-orange-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-50 font-bold"
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
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-red-500/25 bg-red-500/5 shadow-md shadow-red-500/5 transition duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
              <Flame className="h-6 w-6 text-red-400/50" />
            </div>
            <div>
              <h3 className="font-semibold text-red-400">Weekly Streak At Risk! ⚠️</h3>
              <p className="text-sm text-muted mt-0.5">
                You missed last week. You need {restoreCost} XP to restore your streak, but you only
                have {totalXp} XP.
              </p>
            </div>
          </div>
          <div className="rounded-full bg-red-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wide text-red-400">
            Insufficient XP
          </div>
        </div>
      );
    }

    // 6. At Risk - Restore Limit Reached
    if (status === "at_risk" && restoreType === "limit_reached") {
      return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-red-500/25 bg-red-500/5 shadow-md shadow-red-500/5 transition duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
              <Flame className="h-6 w-6 text-red-400/50" />
            </div>
            <div>
              <h3 className="font-semibold text-red-400">Weekly Streak At Risk! ⚠️</h3>
              <p className="text-sm text-muted mt-0.5">
                You missed last week and have reached the monthly limit of 2 paid restores.
              </p>
            </div>
          </div>
          <div className="rounded-full bg-red-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wide text-red-400">
            Limit Reached
          </div>
        </div>
      );
    }

    // 7. Broken
    if (status === "broken") {
      return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-gray-600/20 bg-gray-800/5 shadow-md shadow-black/5 transition duration-300">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-500/10 text-gray-400">
              <Flame className="h-6 w-6 text-gray-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-400">Weekly Streak Broken 💔</h3>
              <p className="text-sm text-muted mt-0.5">
                Your weekly consistency streak has ended. Start a new streak to begin building
                again!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleStartNewStreak}
            disabled={actionLoading}
            className="w-full md:w-auto inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-md shadow-primary/10 transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          >
            {actionLoading ? "Starting..." : "Start New Streak"}
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <main className="space-y-6 text-text animate-fade-in">
      {celebration && (
        <CelebrationModal celebration={celebration} onClose={() => setCelebration(null)} />
      )}

      <PageHeader
        eyebrow="Dashboard"
        title={`${getTimeOfDay()}, ${userName} 👋`}
        description="Your streak, XP, weekly effort, and next quick action are ready."
        action={
          <Link
            to="/log"
            className="inline-flex rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Quick Log
          </Link>
        }
      />

      {renderWeeklyStreakBanner()}

      <div className="grid gap-4 lg:grid-cols-3">
        <StreakCard current={currentStreak} longest={longestStreak} />
        <div className="lg:col-span-2">
          <XPProgressBar
            totalXp={totalXp}
            nextLevelXp={nextLevelXp}
            level={level}
            title={gamification.title}
            activeBadge={activeBadge}
          />
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Today's summary">
        <StatCard icon={Dumbbell} label="Workouts" value={todayWorkouts} helper="Today" />
        <StatCard icon={Timer} label="Minutes" value={`${todayMinutes}m`} helper="Today" />
        <StatCard
          icon={Flame}
          label="Calories"
          iconClassName="text-streak bg-streak/10"
          value={todayCalories}
          helper="Today"
        />
        <StatCard
          icon={Terminal}
          label="XP"
          iconClassName="text-xp bg-xp/10"
          value={todayXp}
          helper="Today"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-border bg-surface p-5 shadow-lg shadow-black/10 lg:col-span-2 card-hover-effect transition-all duration-300">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Recent</p>
              <h2 className="mt-1 text-lg font-semibold text-text">Last 3 workouts</h2>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/workouts"
                className="text-sm font-semibold text-primary hover:text-primary/80"
              >
                View all
              </Link>
            </div>
          </div>
          {recentWorkouts.length > 0 ? (
            <div className="mt-4 space-y-3">
              {recentWorkouts.map((workout) => (
                <div key={workout.id} className="rounded-2xl bg-bg p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text">{workout.activity}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-muted">
                          {workout.date} • {workout.minutes} min
                        </span>
                        {workout.group && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                            {workout.group}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-right text-xs text-muted">
                      +{workout.xp} XP
                      <br />
                      {workout.calories} cal
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Dumbbell}
              title="No workouts yet — log your first in 10s"
              description="Quick Log keeps the first workout fast and typing-free."
              action={
                <Link
                  to="/log"
                  className="inline-flex rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Quick Log
                </Link>
              }
            />
          )}
        </article>

        <article className="rounded-3xl bg-surface border border-border p-6 shadow-lg shadow-black/10 card-hover-effect transition-all duration-300">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
              This Week's AI Insight
            </p>
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          {aiInsight ? (
            <div className="mt-3">
              <p className="text-sm leading-relaxed text-text">{aiInsight.summary}</p>
              {aiInsight.goalProgress && (
                <p className="mt-2 text-xs leading-relaxed text-muted">{aiInsight.goalProgress}</p>
              )}
              {Array.isArray(aiInsight.recommendations) && aiInsight.recommendations.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {aiInsight.recommendations.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted">
                      <span
                        className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                      {tip}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-widest text-muted">
                {aiInsight.workoutCount != null && <span>{aiInsight.workoutCount} workouts</span>}
                {aiInsight.totalCalories != null && <span>{aiInsight.totalCalories} cal</span>}
                {aiInsight.totalMinutes != null && (
                  <span>{Math.round(aiInsight.totalMinutes / 6) / 10}h</span>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <h2 className="text-lg font-semibold text-text">
                {currentStreak > 0 ? "Your week in review" : "Start with a 30-minute base"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {recentWorkouts.length > 0
                  ? `You've logged ${recentWorkouts.length} recent sessions. Generate an AI-powered insight to see personalized tips.`
                  : "Log a few workouts to unlock your personalized weekly AI insight."}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={handleGenerateInsight}
            disabled={aiLoading}
            className="mt-4 w-full rounded-2xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          >
            {aiLoading ? "Generating…" : "✨ Generate Weekly Insight"}
          </button>
          {badges.length > 0 && (
            <div className="mt-4 grid gap-3">
              {badges.map((badge) => (
                <AchievementBadge key={badge.code || badge.name} size="sm" badge={badge} />
              ))}
            </div>
          )}
        </article>
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
          ) : (
            <div className="mx-auto grid h-32 w-32 place-items-center rounded-full bg-amber-100 text-amber-500 streak-gold-glow">
              <Flame className="size-16 animate-flame-pulse" aria-hidden="true" />
            </div>
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
