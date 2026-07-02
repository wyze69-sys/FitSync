import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { MessageSquare, Trophy, Clock, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import DashboardProfileSummary from "../components/dashboard/DashboardProfileSummary.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import { BadgeMedal } from "../components/gamification/AchievementBadge.jsx";
import feedbackService from "../services/feedbackService.js";

function numberOrDash(value, suffix = "") {
  const number = Number(value || 0);
  return number > 0 ? `${number}${suffix}` : "Not set";
}

function profileCompletion(user = {}) {
  const required = ["name", "age", "gender", "height", "weight", "targetWeight", "goal", "activityLevel", "preferredWorkoutType"];
  const completed = required.filter((field) => {
    const value = user?.[field];
    return value !== undefined && value !== null && String(value).trim() !== "";
  }).length;
  return Math.round((completed / required.length) * 100);
}

function goalDirection(user = {}) {
  const weight = Number(user.weight || 0);
  const target = Number(user.targetWeight || 0);
  if (!weight || !target) return "Set your target weight to unlock better guidance.";
  const difference = Math.abs(weight - target).toFixed(1).replace(".0", "");
  if (target < weight) return `${difference} kg to target`;
  if (target > weight) return `${difference} kg gain target`;
  return "Target weight reached";
}

/** Profile page for desktop navigation: body stats, achievements, feedback, and account actions. */
export default function You() {
  const context = useOutletContext() || {};
  const { user, refreshAll, push, gamification = {}, loading, error } = context;
  const { updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const badges = Array.isArray(gamification?.badges) ? gamification.badges : [];
  const earnedBadges = badges.filter((badge) => badge.isUnlocked);
  const completion = profileCompletion(user || {});
  const level = Number(gamification?.level || 1);
  const totalXp = Number(gamification?.totalXp ?? gamification?.total_xp ?? 0);
  const currentStreak = Number(gamification?.currentStreak || 0);
  const todayWorkouts = Number(gamification?.todayWorkouts || 0);

  const [fbSubject, setFbSubject] = useState("");
  const [fbMessage, setFbMessage] = useState("");
  const [fbSubmitting, setFbSubmitting] = useState(false);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-300">
        {error}
      </div>
    );
  }

  function handleProfileUpdated(updatedUser) {
    updateUser(updatedUser);
    refreshAll?.();
  }

  async function handleFeedbackSubmit() {
    const trimmed = fbMessage.trim();
    if (!trimmed) return;
    setFbSubmitting(true);
    try {
      await feedbackService.submitFeedback({ subject: fbSubject.trim(), message: trimmed });
      push?.("Feedback submitted. Thank you!", "success");
      setFbSubject("");
      setFbMessage("");
    } catch (err) {
      push?.(err.message || "Failed to submit feedback.", "info");
    } finally {
      setFbSubmitting(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 text-left animate-fade-in">
      <header className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-md md:p-8">
        <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Athlete command profile
              </p>
              <h1 className="mt-2 text-3xl md:text-5xl font-black uppercase leading-none tracking-tight text-text">
                {user?.name || "Your profile"}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-secondary">
                Manage profile data, training goals, achievement history, and account controls.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[520px]">
            <HeroMetric label="Level" value={level} badgeText="LVL" badgeColor="text-primary border-primary/20 bg-primary/10" />
            <HeroMetric label="Total XP" value={totalXp} badgeText="XP" badgeColor="text-xp border-xp/20 bg-xp/10" />
            <HeroMetric label="Streak" value={`${currentStreak}d`} badgeText="STK" badgeColor="text-streak border-streak/20 bg-streak/10" />
            <HeroMetric label="Today" value={todayWorkouts} badgeText="FIT" badgeColor="text-primary border-primary/20 bg-primary/10" />
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
        <div className="space-y-6">
          {loading || !user ? (
            <div className="rounded-3xl border border-border bg-surface p-6 shadow-lg md:p-6 animate-pulse space-y-4">
              <div className="h-6 w-1/4 bg-border rounded" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="h-12 bg-bg rounded" />
                <div className="h-12 bg-bg rounded" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="h-12 bg-bg rounded" />
                <div className="h-12 bg-bg rounded" />
                <div className="h-12 bg-bg rounded" />
              </div>
            </div>
          ) : (
            <DashboardProfileSummary user={user} onProfileUpdated={handleProfileUpdated} onToast={push} />
          )}

          <section className="rounded-3xl border border-border bg-surface p-6 text-xs text-muted shadow-md">
            <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h2 className="text-md font-bold uppercase tracking-wider text-text">Your badge collection</h2>
                </div>
                <p className="mt-1 text-sm text-secondary">
                  Earned badges stay visible here so Home can focus on daily action.
                </p>
              </div>
              <span className="w-fit rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
                {earnedBadges.length}/{badges.length} earned
              </span>
            </div>

            {loading ? (
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="h-32 rounded-2xl border border-border bg-bg/40 animate-pulse" />
                ))}
              </div>
            ) : badges.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-border p-6 text-sm text-center">
                No achievements yet. Log workouts to start your collection.
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {badges.map((badge) => {
                  const locked = badge.isUnlocked === false;
                  const requirement = badge.requirement
                    ? `${badge.value || ""} ${badge.requirement}`.trim()
                    : "Milestone";
                  return (
                    <article
                      key={badge.code || badge.name}
                      className={`rounded-2xl border p-6 transition-all duration-300 ${
                        locked
                          ? "border-border/30 bg-bg/30 opacity-40 shadow-inner"
                          : "border-primary/20 bg-surface shadow-md hover:border-primary/45 hover:-translate-y-0.5"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-surface border border-border/25 p-2 shadow-sm">
                          <BadgeMedal badge={badge} size="sm" locked={locked} showLevel={false} />
                        </div>
                        <div className="space-y-1 flex-grow text-left">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-bold text-text">{badge.name || "Achievement"}</h3>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                locked ? "bg-bg text-muted" : "bg-primary/15 text-primary"
                              }`}
                            >
                              {locked ? "Locked" : "Earned"}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed text-secondary font-normal">{badge.description}</p>
                        </div>
                      </div>
                      <div className="mt-4 rounded-xl bg-bg/70 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted text-left">
                        Requirement: {requirement}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-border bg-surface p-6 shadow-md">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Profile Readiness
            </p>
            {loading ? (
              <div className="mt-4 h-24 bg-bg rounded animate-pulse" />
            ) : (
              <>
                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <div className="text-4xl font-bold tabular-nums text-text">{completion}%</div>
                    <p className="mt-1 text-sm text-secondary">Complete profile data improves nutrition and workout guidance.</p>
                  </div>
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-[6px] border-primary/20 text-sm font-bold text-primary font-mono">
                    {completion}%
                  </div>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-bg">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completion}%` }} />
                </div>
              </>
            )}
          </section>

          <section className="rounded-3xl border border-border bg-surface p-6 shadow-md">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Current Plan Snapshot
            </p>
            {loading ? (
              <div className="mt-4 h-48 bg-bg rounded animate-pulse" />
            ) : (
              <div className="mt-4 grid gap-3">
                <SnapshotRow label="Goal" value={user?.goal || "General fitness"} mark="GOAL" />
                <SnapshotRow label="Current weight" value={numberOrDash(user?.weight, " kg")} mark="KG" />
                <SnapshotRow label="Target weight" value={numberOrDash(user?.targetWeight, " kg")} mark="TGT" />
                <SnapshotRow label="Preferred style" value={user?.preferredWorkoutType || "Not set"} mark="TYPE" />
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-border bg-surface p-6 shadow-md">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Quick Actions
            </p>
            <div className="mt-4 grid gap-3">
              <QuickAction to="/log" mark="LOG" title="Log workout" text="Add today’s training and earn XP." />
              <QuickAction to="/nutrition" mark="FOOD" title="View nutrition" text="Check calories, macros, and food suggestions." />
              <QuickAction to="/progress" mark="HIST" title="Review progress" text="Track streaks, weight, and performance history." />
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-surface p-6 text-xs text-muted shadow-md">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" aria-hidden="true" />
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Feedback</p>
            </div>
            <input
              id="feedback-subject"
              type="text"
              value={fbSubject}
              onChange={(event) => setFbSubject(event.target.value)}
              placeholder="Title"
              maxLength={255}
              className="mt-4 w-full rounded-xl border border-border/80 bg-bg px-4 py-2.5 text-xs text-text placeholder:text-muted/50 focus:border-primary focus:outline-none"
            />
            <textarea
              id="feedback-message"
              value={fbMessage}
              onChange={(event) => setFbMessage(event.target.value)}
              placeholder="Tell us what you think."
              rows={4}
              maxLength={5000}
              className="mt-3 w-full resize-none rounded-xl border border-border/80 bg-bg px-4 py-2.5 text-xs text-text placeholder:text-muted/50 focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={handleFeedbackSubmit}
              disabled={fbSubmitting || !fbSubject.trim() || !fbMessage.trim()}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-black uppercase tracking-widest text-primary-contrast shadow-sm hover:bg-primary-bright disabled:opacity-50 transition-all cursor-pointer"
            >
              {fbSubmitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </section>

          <section className="rounded-3xl border border-border bg-surface p-6 text-xs text-muted shadow-md">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Account</p>
            <div className="mt-4 rounded-2xl bg-bg border border-border/60 p-4">
              <div className="text-sm font-bold text-text">{user?.email || "No email"}</div>
              {user?.createdAt && (
                <div className="mt-1 text-[11px] text-muted">
                  Member since {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                  })}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white/[0.02] px-5 py-3 text-xs font-black uppercase tracking-widest text-text hover:bg-white/[0.08] transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4 text-primary" /> Logout
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

function HeroMetric({ label, value, badgeText, badgeColor = "text-primary border-primary/20 bg-primary/10" }) {
  return (
    <div className="rounded-2xl border border-border bg-bg/50 p-4 text-left">
      <span className={`inline-flex items-center justify-center rounded px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.2em] ${badgeColor}`}>
        {badgeText}
      </span>
      <div className="mt-3 text-2xl font-bold font-mono tabular-nums text-text leading-tight">{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{label}</div>
    </div>
  );
}

function SnapshotRow({ label, value, mark }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-bg/60 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 font-mono text-[10px] font-bold text-primary">{mark}</div>
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{label}</div>
        <div className="mt-0.5 text-sm font-semibold text-text">{value}</div>
      </div>
    </div>
  );
}

function QuickAction({ to, mark, title, text }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-bg/60 p-3 transition hover:-translate-y-0.5 hover:border-primary hover:bg-white/[0.03]"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 font-mono text-[10px] font-bold text-primary transition group-hover:bg-primary group-hover:text-primary-contrast">
        {mark}
      </div>
      <div>
        <div className="text-sm font-bold text-text">{title}</div>
        <div className="mt-0.5 text-xs text-muted">{text}</div>
      </div>
    </Link>
  );
}
