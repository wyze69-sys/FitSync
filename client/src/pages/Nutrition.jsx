import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useOutletContext } from "react-router-dom";
import {
  Salad,
  Dumbbell,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  SlidersHorizontal,
  Flame,
  Info,
  X
} from "lucide-react";
import nutritionService from "../services/nutritionService.js";

/**
 * Nutrition Planner.
 *
 * A daily nutrition target page backed entirely by GET /api/nutrition/plan.
 * Calorie/macro/target values come from the backend planner, workout balance
 * comes from real workout history, and food suggestions come from the backend
 * recommendation service. Nothing here is hardcoded or faked. Profile editing
 * lives on the existing "You" page, so this page only reads the profile.
 */

const TIMEFRAME_CHIPS = [7, 30, 60, 90];
const MAX_FOOD_SUGGESTIONS = 4;

const LABEL = "block text-[10px] font-semibold uppercase tracking-widest text-muted mb-1.5";
const INPUT =
  "block w-full rounded-2xl border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const EYEBROW = "text-[10px] font-bold uppercase tracking-widest text-muted";

/** Build /nutrition/plan query params from the goal control values. */
function buildPlanParams({ mode, targetChangeKg, timeframeDays, dietPreference, allergies }) {
  const params = { mode, limit: 8 };
  if (targetChangeKg !== "" && Number.isFinite(Number(targetChangeKg))) {
    params.targetChangeKg = Number(targetChangeKg);
  }
  if (timeframeDays !== "" && Number.isFinite(Number(timeframeDays))) {
    params.timeframeDays = Math.round(Number(timeframeDays));
  }
  if (String(dietPreference || "").trim()) params.dietPreference = dietPreference.trim();
  if (String(allergies || "").trim()) params.allergies = allergies.trim();
  return params;
}

/* -------------------------------------------------------------------------- */
/* Formatting helpers                                                          */
/* -------------------------------------------------------------------------- */

function displayName(name) {
  const raw = String(name || "").trim();
  if (!raw) return "Food";
  // Drop trailing ", raw" / " raw" style qualifiers for cleaner presentation.
  const cleaned = raw.replace(/,?\s*\braw\b/gi, "").trim() || raw;
  return cleaned
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function formatMacro(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function formatInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n).toLocaleString() : "0";
}

function prettyLabel(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .trim();
}

function formatChangeKg(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "maintain weight";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n} kg`;
}

/** Map a backend safetyStatus to a calm badge style + plain-language message. */
function safetyInfo(status) {
  switch (status) {
    case "safe":
      return {
        badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
        dot: "bg-emerald-500",
        label: "Safe pace",
        message: "This target is sustainable and safe to follow."
      };
    case "caution":
      return {
        badge: "border-amber-500/30 bg-amber-500/10 text-amber-700",
        dot: "bg-amber-500",
        label: "Slightly ambitious",
        message: "This pace is a little ambitious but manageable."
      };
    case "aggressive":
      return {
        badge: "border-orange-500/40 bg-orange-500/10 text-orange-700",
        dot: "bg-orange-500",
        label: "Aggressive",
        message: "This target is aggressive and may be hard to sustain."
      };
    case "high_risk":
      return {
        badge: "border-red-500/40 bg-red-500/10 text-red-700",
        dot: "bg-red-500",
        label: "High risk",
        message: "This target is very aggressive and may affect recovery."
      };
    default:
      return {
        badge: "border-border bg-bg text-muted",
        dot: "bg-muted",
        label: prettyLabel(status) || "—",
        message: ""
      };
  }
}

/** Lightly de-prioritize raw/odd ingredient rows so normal foods surface first. */
function rankFoodsForDisplay(foods) {
  const list = Array.isArray(foods) ? [...foods] : [];
  const looksRaw = (food) => /\braw\b/i.test(String(food?.name || ""));
  return list
    .map((food, index) => ({ food, index, raw: looksRaw(food) }))
    .sort((a, b) => (a.raw === b.raw ? a.index - b.index : a.raw ? 1 : -1))
    .map((entry) => entry.food)
    .slice(0, MAX_FOOD_SUGGESTIONS);
}

/* -------------------------------------------------------------------------- */
/* Presentational pieces                                                       */
/* -------------------------------------------------------------------------- */

function SectionHeader({ icon: Icon, eyebrow, title, action }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-bg text-primary"
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <span className={EYEBROW}>{eyebrow}</span>
          <h2 className="mt-0.5 text-lg font-semibold text-text">{title}</h2>
        </div>
      </div>
      {action}
    </div>
  );
}

function SectionCard({ icon, eyebrow, title, children, description, action, compact, fill }) {
  return (
    <section
      className={`rounded-2xl border border-border bg-surface shadow-md ${compact ? "p-3 py-3 sm:p-3.5" : "p-4 sm:p-4.5"} ${fill ? "flex h-full flex-col" : ""
        }`}
    >
      <SectionHeader icon={icon} eyebrow={eyebrow} title={title} action={action} />
      {description && <p className="mt-2 text-xs leading-relaxed text-muted">{description}</p>}
      <div className={`${compact ? "mt-3" : "mt-3.5"} ${fill ? "flex-1" : ""}`}>{children}</div>
    </section>
  );
}

function MacroBar({ name, grams, percent, colorClass, helperLabel }) {
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div title={helperLabel}>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-text">{name}</span>
        <span className="tabular-nums text-muted">
          <span className="font-semibold text-text">{formatMacro(grams)}g</span>
          <span className="mx-1.5 text-border">·</span>
          {pct}%
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-bg" role="presentation">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function WarningList({ warnings }) {
  if (!Array.isArray(warnings) || warnings.length === 0) return null;
  return (
    <ul className="space-y-2" aria-label="Plan warnings">
      {warnings.map((warning, idx) => (
        <li
          key={idx}
          className="flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-sm leading-relaxed text-amber-800"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          <span>{warning}</span>
        </li>
      ))}
    </ul>
  );
}

function FoodCard({ food }) {
  const reasons = Array.isArray(food.recommendationReasons) ? food.recommendationReasons : [];
  const reason = reasons.length > 0 ? prettyLabel(reasons[0]) : "";
  const category = prettyLabel(food.foodType);

  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-border bg-bg p-3 transition-colors hover:border-primary">
      <div className="flex items-start justify-between gap-1.5">
        <h3 className="text-xs font-semibold leading-snug text-text truncate" title={displayName(food.name)}>{displayName(food.name)}</h3>
        {category && (
          <span className="shrink-0 rounded-full bg-surface px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-muted">
            {category}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-0.5">
        <span className="text-lg font-bold tabular-nums text-text">{formatMacro(food.calories)}</span>
        <span className="text-[10px] font-medium text-muted">cal</span>
      </div>

      <div className="flex justify-between border-t border-border pt-2 text-[10px] text-muted">
        <span>Prot <strong className="font-semibold text-text">{formatMacro(food.proteinG)}g</strong></span>
        <span>Carb <strong className="font-semibold text-text">{formatMacro(food.carbsG)}g</strong></span>
        <span>Fat <strong className="font-semibold text-text">{formatMacro(food.fatG)}g</strong></span>
      </div>

      {reason && <p className="text-[10px] capitalize text-muted truncate" title={reason}>{reason}</p>}
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Why This Target explanation card                                            */
/* -------------------------------------------------------------------------- */

/**
 * Shown only when there is meaningful context to explain — e.g. a high-risk
 * gain goal overridden to the safe target, or an explicit requested target
 * that differs from the safe target. Uses only real API values.
 */
function WhyThisTargetCard({ plan }) {
  const requested = plan.requestedPlan || {};
  const safe = plan.safePlan || {};
  const active = plan.activePlan || {};
  const c = plan.calculations || {};

  // Only show this card when there is something useful to explain.
  const requestedIsHighRisk =
    requested.safetyStatus === "high_risk" || requested.safetyStatus === "aggressive";
  const requestedIsGain = requested.direction === "gain";
  const activeIsSafe = active.label === "Safe";
  const requestedDiffersFromSafe =
    Number.isFinite(requested.calories) &&
    Number.isFinite(safe.calories) &&
    Math.abs(requested.calories - safe.calories) >= 50;

  // Don't show if nothing meaningful to explain
  if (!requestedDiffersFromSafe && !requestedIsHighRisk) return null;

  // Compose headline based on situation
  let headline = "Why this target?";
  let bodyLines = [];

  if (requestedIsHighRisk && requestedIsGain && activeIsSafe) {
    headline = "Your requested pace is high risk";
    bodyLines.push(
      "FitSync is using the safe target for your daily plan. A moderate surplus better supports lean muscle gain while reducing the risk of excess fat gain."
    );
  } else if (requestedIsHighRisk && activeIsSafe) {
    headline = "Your requested pace is high risk";
    bodyLines.push(
      "FitSync is using the safe target for your daily plan. The requested rate is very aggressive and may be difficult to sustain."
    );
  } else if (requestedDiffersFromSafe) {
    headline = "How your target is built";
  }

  // Always show the breakdown when requested differs from safe
  const showBreakdown = requestedDiffersFromSafe || requestedIsHighRisk;
  const safeAdj = Number(safe.dailyCalorieAdjustment);

  return (
    <section
      aria-label="Target explanation"
      className="rounded-2xl border border-sky-500/25 bg-sky-500/5 p-4"
    >
      <div className="flex items-start gap-2.5">
        <span
          className="mt-0.5 flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600"
          aria-hidden="true"
        >
          <Info className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-text">{headline}</h2>
          {bodyLines.map((line, i) => (
            <p key={i} className="mt-1 text-xs leading-relaxed text-muted">
              {line}
            </p>
          ))}

          {showBreakdown && (
            <dl className="mt-3 space-y-1">
              {Number.isFinite(c.tdee) && c.tdee > 0 && (
                <div className="flex items-baseline justify-between gap-3 text-xs">
                  <dt className="text-muted">Maintenance calories</dt>
                  <dd className="shrink-0 font-semibold tabular-nums text-text">
                    {formatInt(c.tdee)} cal
                  </dd>
                </div>
              )}
              {Number.isFinite(safeAdj) && safeAdj !== 0 && (
                <div className="flex items-baseline justify-between gap-3 text-xs">
                  <dt className="text-muted">
                    Safe {safeAdj > 0 ? "surplus" : "deficit"}
                  </dt>
                  <dd className="shrink-0 font-semibold tabular-nums text-text">
                    {safeAdj > 0 ? "+" : ""}{formatInt(safeAdj)} cal/day
                  </dd>
                </div>
              )}
              {Number.isFinite(safe.calories) && safe.calories > 0 && (
                <div className="flex items-baseline justify-between gap-3 border-t border-sky-500/20 pt-1 text-xs">
                  <dt className="font-medium text-text">Recommended daily target</dt>
                  <dd className="shrink-0 font-bold tabular-nums text-text">
                    {formatInt(safe.calories)} cal
                  </dd>
                </div>
              )}
              {requestedDiffersFromSafe && Number.isFinite(requested.calories) && (
                <div className="flex items-baseline justify-between gap-3 text-xs">
                  <dt className="text-muted">
                    Requested target
                    {requested.safetyStatus && requested.safetyStatus !== "safe" && (
                      <span className="ml-1.5 inline-flex items-center rounded-full border border-red-400/30 bg-red-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-600">
                        {requested.safetyStatus === "high_risk" ? "High risk" : "Aggressive"}
                      </span>
                    )}
                  </dt>
                  <dd className="shrink-0 tabular-nums text-muted">
                    {formatInt(requested.calories)} cal
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */
export default function Nutrition() {
  useOutletContext();

  // Applied goal controls (query-only; profile itself is edited on the You page).
  // The modal edits a local draft and only lifts these on a successful update.
  const [targetChangeKg, setTargetChangeKg] = useState("");
  const [timeframeDays, setTimeframeDays] = useState("30");
  const [mode, setMode] = useState("safe");
  const [dietPreference, setDietPreference] = useState("");
  const [allergies, setAllergies] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPlan = useCallback(async (params) => {
    setLoading(true);
    setError("");
    try {
      const data = await nutritionService.getPlan(params);
      setPlan(data);
    } catch (err) {
      setError(err?.message || "Could not load your nutrition plan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan({ mode: "safe", limit: 8 });
  }, [fetchPlan]);

  // Retry uses the currently applied controls.
  const retry = () =>
    fetchPlan(buildPlanParams({ mode, targetChangeKg, timeframeDays, dietPreference, allergies }));

  /**
   * Apply a new plan from the Adjust Goal modal. Returns/throws so the modal can
   * keep itself open and show its own error on failure. On success we lift the
   * draft values into the applied controls and refresh the plan.
   */
  const applyGoal = useCallback(async (values) => {
    const data = await nutritionService.getPlan(buildPlanParams(values));
    setPlan(data);
    setTargetChangeKg(values.targetChangeKg);
    setTimeframeDays(values.timeframeDays);
    setMode(values.mode);
    setDietPreference(values.dietPreference);
    setAllergies(values.allergies);
    return data;
  }, []);

  const profile = plan?.profile;
  const isIncomplete = profile?.isIncomplete === true;
  const missingFields = Array.isArray(profile?.missingFields) ? profile.missingFields : [];
  const hasPlan = plan && !isIncomplete && plan.activePlan;

  return (
    <main className="mx-auto max-w-[1400px] space-y-4 text-left text-text animate-fade-in">
      <header className="flex items-start gap-2.5">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-surface text-primary shadow-md"
          aria-hidden="true"
        >
          <Salad className="h-4.5 w-4.5" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text">Nutrition</h1>
          <p className="text-xs text-muted">
            Your daily fuel target, tuned to your goal and the workouts you actually do.
          </p>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="flex flex-col items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={retry}
            className="rounded-2xl border border-red-500/30 px-3 py-1 text-xs font-semibold text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && isIncomplete && <ProfileStatusCard missingFields={missingFields} warnings={plan?.warnings} />}

      {loading && !plan && <PlanSkeleton />}

      {hasPlan && (
        <div className="nutrition-dashboard-grid">
          {/* Left: dominant daily target card */}
          <HeroSection plan={plan} />

          {/* Right: two compact stacked side cards */}
          <div className="nutrition-side-stack">
            <GoalPaceSection plan={plan} mode={mode} onAdjust={() => setModalOpen(true)} />
            <WorkoutBalanceSection windows={plan.windows} />
          </div>

          {/* Why this target — shown only when there is something useful to explain */}
          <div className="nutrition-full-width-section">
            <WhyThisTargetCard plan={plan} />
          </div>

          {/* Bottom: full-width food suggestions */}
          <div className="nutrition-full-width-section">
            <FoodSuggestionsSection recommendations={plan.recommendations} />
          </div>
        </div>
      )}

      {modalOpen && (
        <AdjustGoalModal
          initial={{ targetChangeKg, timeframeDays, mode, dietPreference, allergies }}
          onApply={applyGoal}
          onClose={() => setModalOpen(false)}
        />
      )}
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Sections                                                                    */
/* -------------------------------------------------------------------------- */

function ProfileStatusCard({ missingFields, warnings }) {
  const fields = Array.isArray(missingFields) ? missingFields : [];
  return (
    <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
        <div className="flex-1">
          <h2 className="text-base font-semibold text-amber-900">Finish your profile to build a plan</h2>
          <p className="mt-1 text-sm leading-relaxed text-amber-800">
            We need a few more details to calculate an accurate daily calorie and macro target.
          </p>
          {fields.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {fields.map((field) => (
                <li
                  key={field}
                  className="rounded-full border border-amber-500/40 bg-amber-500/5 px-3 py-1 text-xs font-semibold capitalize text-amber-900"
                >
                  {prettyLabel(field)}
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/you"
            className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-primary/90"
          >
            Complete profile <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          {Array.isArray(warnings) && warnings.length > 0 && (
            <div className="mt-4">
              <WarningList warnings={warnings} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Hero: the single most important number on the page. Combines the daily
 * calorie target, today's workout-adjusted target, the safety read-out, and
 * the macro split so the whole "what do I eat today" story reads at a glance.
 */
function HeroSection({ plan }) {
  const c = plan.calculations || {};
  const active = plan.activePlan || {};
  const macros = plan.macros || {};
  const info = safetyInfo(active.safetyStatus);
  const hasWorkoutBoost = Number(c.todayWorkoutCalories) > 0;
  const rate = Number(active.weeklyRateKg);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-md">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <span className={EYEBROW}>Today&rsquo;s target</span>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-bold leading-none tabular-nums text-text">{formatInt(active.calories)}</span>
            <span className="text-sm font-medium text-muted">cal / day</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${info.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${info.dot}`} aria-hidden="true" />
              {info.label}
            </span>
            {Number.isFinite(rate) && rate !== 0 && (
              <span className="text-xs font-medium tabular-nums text-muted">
                {formatMacro(rate)} kg / week
              </span>
            )}
          </div>

          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">{info.message}</p>
        </div>

        {hasWorkoutBoost && (
          <div className="shrink-0 rounded-2xl border border-primary/30 bg-primary/5 p-3.5 sm:w-50">
            <div className="flex items-center gap-1.5 text-primary">
              <Flame className="h-4 w-4" aria-hidden="true" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Eat today</span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tabular-nums text-text">{formatInt(c.todayAdjustedTarget)}</span>
              <span className="text-xs font-medium text-muted">cal</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-muted">
              You burned {formatInt(c.todayWorkoutCalories)} cal training today, so part of it is added back.
            </p>
          </div>
        )}
      </div>

      {/* Macro split — sits directly under the target it belongs to. */}
      <div className="border-t border-border bg-bg px-5 py-5.5 sm:px-6 sm:py-6">
        <div className="flex items-center justify-between gap-2">
          <span className={EYEBROW}>Daily macros</span>
          {active.label === "Safe" &&
            plan.requestedPlan &&
            (plan.requestedPlan.safetyStatus === "high_risk" ||
              plan.requestedPlan.safetyStatus === "aggressive") && (
              <span className="text-[11px] leading-snug text-muted">
                Based on the safe target
              </span>
            )}
        </div>
        <div className="mt-4 space-y-3.5">
          <MacroBar
            name="Protein"
            grams={macros.proteinG}
            percent={macros.proteinPct}
            colorClass="bg-primary"
            helperLabel="Supports muscle repair and growth"
          />
          <MacroBar
            name="Carbs"
            grams={macros.carbsG}
            percent={macros.carbsPct}
            colorClass="bg-sky-500"
            helperLabel="Fuels training performance"
          />
          <MacroBar
            name="Fat"
            grams={macros.fatG}
            percent={macros.fatPct}
            colorClass="bg-amber-500"
            helperLabel="Supports hormones and recovery"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
          <span>
            Maintenance <span className="font-semibold tabular-nums text-text">{formatInt(c.tdee)}</span> cal
          </span>
          <span>
            Minimum safe <span className="font-semibold tabular-nums text-text">{formatInt(c.calorieFloor)}</span> cal
          </span>
        </div>
      </div>
    </section>
  );
}

function GoalPaceSection({ plan, mode, onAdjust }) {
  const safe = plan.safePlan || {};
  const requested = plan.requestedPlan || {};
  const showRequested = mode === "requested";
  // Keep the side card compact — show one short warning at most.
  const warnings = Array.isArray(plan.warnings) ? plan.warnings.slice(0, 1) : [];

  const adjustButton = (
    <button
      type="button"
      onClick={onAdjust}
      className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-bg px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:border-primary hover:text-primary"
    >
      <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
      Adjust goal
    </button>
  );

  return (
    <SectionCard icon={ShieldCheck} eyebrow="Goal pace" title="Goal pace" action={adjustButton} compact>
      <div className="space-y-2">
        <PlanSummary title="Safe target" plan={safe} highlight={plan?.activePlan?.label === "Safe"} />
        {showRequested && <PlanSummary title="Requested target" plan={requested} highlight={plan?.activePlan?.label === "Requested"} />}
      </div>

      {warnings.length > 0 && (
        <div className="mt-2">
          <WarningList warnings={warnings} />
        </div>
      )}
    </SectionCard>
  );
}

/**
 * Adjust Goal — a right-side drawer that holds the goal form off the page flow
 * so opening it never resizes or pushes the dashboard cards. It edits a local
 * draft and only commits on a successful update; failures keep it open.
 */
function AdjustGoalModal({ initial, onApply, onClose }) {
  const [targetChangeKg, setTargetChangeKg] = useState(initial.targetChangeKg);
  const [timeframeDays, setTimeframeDays] = useState(initial.timeframeDays);
  const [mode, setMode] = useState(initial.mode);
  const [dietPreference, setDietPreference] = useState(initial.dietPreference);
  const [allergies, setAllergies] = useState(initial.allergies);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Close on Escape and lock background scroll while open.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      await onApply({ targetChangeKg, timeframeDays, mode, dietPreference, allergies });
      onClose();
    } catch (err) {
      // Surface a clean user-facing message instead of raw server errors.
      const raw = err?.message || "";
      const isServerError = /status 5\d\d|500|server/i.test(raw);
      setError(
        isServerError
          ? "Could not update plan. Please adjust your goal and try again."
          : raw || "Could not update your plan. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Adjust goal">
      {/* Overlay */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/40"
      />

      {/* Drawer panel */}
      <div className="relative flex h-full w-full max-w-md flex-col bg-surface shadow-2xl animate-slide-in">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-bg text-primary" aria-hidden="true">
              <SlidersHorizontal className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-text">Adjust goal</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-2xl border border-border text-muted transition-colors hover:border-primary hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="np-change" className={LABEL}>
                Target change (kg)
              </label>
              <input
                id="np-change"
                type="number"
                step="0.1"
                min="-50"
                max="50"
                value={targetChangeKg}
                onChange={(e) => setTargetChangeKg(e.target.value)}
                placeholder="e.g. -4 or +3"
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="np-days" className={LABEL}>
                Timeframe (days)
              </label>
              <input
                id="np-days"
                type="number"
                min="1"
                max="730"
                value={timeframeDays}
                onChange={(e) => setTimeframeDays(e.target.value)}
                className={INPUT}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick timeframe">
            {TIMEFRAME_CHIPS.map((days) => {
              const activeChip = String(days) === String(timeframeDays);
              return (
                <button
                  key={days}
                  type="button"
                  onClick={() => setTimeframeDays(String(days))}
                  aria-pressed={activeChip}
                  className={`rounded-2xl border px-3 py-1 text-xs font-semibold transition-all ${activeChip
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-bg text-muted hover:border-primary hover:text-text"
                    }`}
                >
                  {days} days
                </button>
              );
            })}
          </div>

          <div>
            <span className={LABEL}>Plan mode</span>
            <div className="flex gap-2" role="group" aria-label="Plan mode">
              {[
                { value: "safe", label: "Safe target" },
                { value: "requested", label: "Requested target" }
              ].map((option) => {
                const activeMode = mode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMode(option.value)}
                    aria-pressed={activeMode}
                    className={`flex-1 rounded-2xl border px-3 py-2 text-xs font-semibold transition-all ${activeMode
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-bg text-muted hover:border-primary hover:text-text"
                      }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="np-diet" className={LABEL}>
              Diet preference (optional)
            </label>
            <input
              id="np-diet"
              type="text"
              maxLength={100}
              value={dietPreference}
              onChange={(e) => setDietPreference(e.target.value)}
              placeholder="e.g. vegetarian"
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor="np-allergies" className={LABEL}>
              Allergies (optional)
            </label>
            <input
              id="np-allergies"
              type="text"
              maxLength={500}
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="comma separated"
              className={INPUT}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-border bg-bg py-2.5 text-sm font-semibold text-text transition-colors hover:border-primary hover:text-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 rounded-2xl bg-primary py-2.5 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Updating…" : "Update plan"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function PlanSummary({ title, plan = {}, highlight }) {
  const info = safetyInfo(plan.safetyStatus);
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-2xl border bg-bg px-3 py-2.5 ${highlight ? "border-primary" : "border-border"
        }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-text">{title}</span>
          <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${info.badge}`}>{info.label}</span>
        </div>
        <div className="mt-0.5 text-[11px] tabular-nums text-muted">Goal: {formatChangeKg(plan.targetChangeKg)}</div>
      </div>
      <div className="shrink-0 text-right">
        <span className="text-lg font-bold tabular-nums text-text">{formatInt(plan.calories)}</span>
        <span className="ml-1 text-[10px] font-normal text-muted">cal</span>
      </div>
    </div>
  );
}

function WorkoutBalanceSection({ windows }) {
  if (!windows) return null;
  const items = [
    { key: "today", label: "Today", data: windows.today },
    { key: "threeDays", label: "3 days", data: windows.threeDays },
    { key: "sevenDays", label: "1 week", data: windows.sevenDays },
    { key: "thirtyDays", label: "1 month", data: windows.thirtyDays }
  ];

  return (
    <SectionCard icon={Dumbbell} eyebrow="Workout balance" title="Workout balance" compact>
      <ul className="grid grid-cols-2 gap-2.5">
        {items.map(({ key, label, data = {} }) => (
          <li key={key} className="flex flex-col justify-center rounded-2xl border border-border bg-bg py-2.5 px-3">
            <span className={EYEBROW}>{label}</span>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-base font-bold tabular-nums text-text">{formatInt(data.totalCaloriesBurned)}</span>
              <span className="text-[10px] font-medium text-muted">cal</span>
            </div>
            <div className="mt-0.5 text-[10px] tabular-nums text-muted">
              {formatInt(data.workoutCount)} {Number(data.workoutCount) === 1 ? "workout" : "workouts"}
              {Number(data.totalMinutes) > 0 && <> · {formatInt(data.totalMinutes)}m</>}
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

function FoodSuggestionsSection({ recommendations }) {
  const foods = rankFoodsForDisplay(recommendations);
  return (
    <SectionCard
      icon={Salad}
      eyebrow="What to eat"
      title="What to Eat Next"
      description="Simple options matched to your goal and today's training."
    >
      {foods.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-bg p-4 text-center text-xs text-muted">
          Finish your profile or log a workout and we&rsquo;ll suggest foods that fit your target.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {foods.map((food) => (
            <FoodCard key={food.id} food={food} />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function PlanSkeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface" />
      <div className="h-40 animate-pulse rounded-2xl border border-border bg-surface" />
      <div className="h-32 animate-pulse rounded-2xl border border-border bg-surface" />
    </div>
  );
}
