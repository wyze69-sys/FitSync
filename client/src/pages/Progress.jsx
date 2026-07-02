import { useMemo } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Scale, Target, TrendingDown } from "lucide-react";
import { calculateBMI, resolveBmiCategory } from "../utils/metrics.js";

function getLatestWeight(cleanWeightLogs = [], profileWeight = 0) {
  if (cleanWeightLogs.length > 0) return Number(cleanWeightLogs[cleanWeightLogs.length - 1].weight);
  return profileWeight;
}

function formatDateShort(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString.replace(/-/g, "/"));
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateFull(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString.replace(/-/g, "/"));
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getBmiTip(categoryLabel, hasHeight) {
  if (!hasHeight) return "Add height to calculate BMI.";
  const cat = String(categoryLabel || "").toLowerCase();
  if (cat.includes("underweight")) return "Aim for a gradual calorie surplus to support healthy weight gain.";
  if (cat.includes("healthy")) return "Maintain your consistency to keep your energy and body composition optimized.";
  if (cat.includes("overweight")) return "A minor deficit and resistance training will help adjust body composition.";
  if (cat.includes("obese")) return "Focus on steady, sustainable weight loss and cardiovascular health.";
  return "Log weight and update height to see insights.";
}

// Smooth Catmull-Rom spline path generator for SVG
function getSmoothPath(pts) {
  if (pts.length < 2) return "";
  let path = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || pts[i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return path;
}

export default function Progress() {
  const { user = {}, weightLogs = [], workouts = [], gamification = null } = useOutletContext() || {};

  // 1. Filter and validate weight logs (sorted oldest to newest chronologically)
  const cleanWeightLogs = useMemo(() => {
    if (!Array.isArray(weightLogs)) return [];
    return weightLogs
      .filter(log => {
        if (!log || typeof log !== "object") return false;
        const w = Number(log.weight);
        if (isNaN(w) || w <= 0) return false;
        if (!log.date) return false;
        const d = new Date(log.date.replace(/-/g, "/"));
        if (isNaN(d.getTime())) return false;
        return true;
      })
      .sort((a, b) => new Date(a.date.replace(/-/g, "/")) - new Date(b.date.replace(/-/g, "/")));
  }, [weightLogs]);

  // Calculate workouts during this trend
  const workoutsDuringTrend = useMemo(() => {
    if (cleanWeightLogs.length < 2 || workouts.length === 0) return 0;
    const oldestDate = new Date(cleanWeightLogs[0].date.replace(/-/g, "/"));
    const latestDate = new Date(cleanWeightLogs[cleanWeightLogs.length - 1].date.replace(/-/g, "/"));
    
    return workouts.filter(w => {
      const wDate = new Date(w.date.replace(/-/g, "/"));
      return wDate >= oldestDate && wDate <= latestDate;
    }).length;
  }, [cleanWeightLogs, workouts]);

  const profileWeight = user && typeof user.weight !== "undefined" && !isNaN(Number(user.weight)) ? Number(user.weight) : 0;
  const targetWeight = user && typeof user.targetWeight !== "undefined" && !isNaN(Number(user.targetWeight)) ? Number(user.targetWeight) : 0;

  const hasLogs = cleanWeightLogs.length > 0;
  
  // Current Weight: Override with latest real weight log if it exists, otherwise profile weight
  const latestWeight = getLatestWeight(cleanWeightLogs, profileWeight);

  // Start Weight: Earliest weight log if logs exist, otherwise profile weight
  const startingWeight = hasLogs
    ? Number(cleanWeightLogs[0].weight)
    : profileWeight;

  // Change relative weight log comparisons
  const previousWeight = cleanWeightLogs.length > 1
    ? Number(cleanWeightLogs[cleanWeightLogs.length - 2].weight)
    : latestWeight;
  const changeSinceLast = latestWeight && previousWeight ? latestWeight - previousWeight : 0;
  
  // Dates
  const latestDate = hasLogs ? cleanWeightLogs[cleanWeightLogs.length - 1].date : null;

  // BMI calculations
  const hasHeight = Boolean(user.height);
  const bmi = hasHeight && latestWeight ? calculateBMI(latestWeight, user.height) : "—";
  const bmiMeta = hasHeight && latestWeight ? resolveBmiCategory(bmi) : { label: "Not set", colorClass: "text-muted" };
  const bmiTip = getBmiTip(bmiMeta.label, hasHeight);

  // Tracked Days: Real date difference from earliest to latest for 2+ logs, otherwise "Not enough logs"
  const daysTrackedText = useMemo(() => {
    if (cleanWeightLogs.length < 2) return "Not enough logs";
    const start = new Date(cleanWeightLogs[0].date.replace(/-/g, "/"));
    const end = new Date(cleanWeightLogs[cleanWeightLogs.length - 1].date.replace(/-/g, "/"));
    const diffTime = Math.abs(end - start);
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${days} ${days === 1 ? "day" : "days"}`;
  }, [cleanWeightLogs]);

  // Target progress percent
  const progress = targetWeight && startingWeight && targetWeight !== startingWeight
    ? Math.min(100, Math.max(0, ((startingWeight - latestWeight) / (startingWeight - targetWeight)) * 100))
    : 0;

  // Total change
  const totalChange = cleanWeightLogs.length >= 2 ? latestWeight - startingWeight : 0;

  // Trend status indicator
  const trend = useMemo(() => {
    if (cleanWeightLogs.length < 2) return null;
    if (totalChange < 0) {
      return { text: "Weight is trending down", color: "text-primary" };
    } else if (totalChange > 0) {
      return { text: "Weight is trending up", color: "text-amber-500" };
    }
    return { text: "Weight is stable", color: "text-muted" };
  }, [cleanWeightLogs, totalChange]);

  return (
    <main className="mx-auto w-full max-w-[1400px] space-y-6 text-left animate-fade-in">
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        {/* Left Card: Body Metrics */}
        <article className="rounded-3xl border border-border bg-surface p-6 lg:col-span-4 flex flex-col justify-between min-h-[500px]">
          <div>
            <div className="mb-6">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Body Metrics
              </span>
              <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-text">
                Progress
              </h1>
              <p className="mt-1 text-sm text-secondary">
                Weight trend, BMI, and target in one view.
              </p>
            </div>

            <div className="space-y-6 mt-8">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted block">
                  Current Weight
                </span>
                <div className="flex items-baseline gap-3 mt-1.5">
                  <span className="text-5xl font-black font-mono tracking-tight text-text">
                    {latestWeight}
                  </span>
                  <span className="text-base font-bold text-muted">kg</span>
                  {cleanWeightLogs.length > 1 && (
                    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-bold font-mono ${
                      changeSinceLast < 0
                        ? "border-green-500/20 bg-green-500/10 text-primary"
                        : changeSinceLast > 0
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-500"
                        : "border-border/40 bg-bg text-muted"
                    }`}>
                      {changeSinceLast < 0 ? "↘" : changeSinceLast > 0 ? "↗" : "~"} {changeSinceLast > 0 ? "+" : ""}{changeSinceLast.toFixed(1)} kg
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border/40 bg-bg/50 p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Start</div>
                  <div className="mt-1 text-lg font-bold font-mono text-text">
                    {startingWeight} <span className="text-xs text-muted font-normal lowercase">kg</span>
                  </div>
                  <span className="text-[9px] text-muted block mt-0.5 leading-none">
                    {cleanWeightLogs.length > 0 ? "Oldest saved log" : "Profile weight"}
                  </span>
                </div>
                <div className="rounded-2xl border border-border/40 bg-bg/50 p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Change</div>
                  <div className={`mt-1 text-lg font-bold font-mono ${cleanWeightLogs.length >= 2 && totalChange < 0 ? "text-primary" : cleanWeightLogs.length >= 2 && totalChange > 0 ? "text-amber-500" : "text-text"}`}>
                    {cleanWeightLogs.length >= 2 ? `${totalChange > 0 ? "+" : ""}${totalChange.toFixed(1)}` : "—"}{" "}
                    <span className="text-xs text-muted font-normal lowercase">kg</span>
                  </div>
                  <span className="text-[9px] text-muted block mt-0.5 leading-none">
                    {cleanWeightLogs.length >= 2 ? "Since first log" : "Add weight logs"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border/40 bg-bg/50 p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">BMI</div>
                  <div className="mt-1 text-lg font-bold text-text flex items-baseline gap-1.5">
                    <span className="font-mono">{bmi}</span>
                    <span className={`text-[10px] font-bold ${bmiMeta.colorClass}`}>
                      {bmiMeta.label === "Healthy Weight" ? "Healthy" : bmiMeta.label}
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/40 bg-bg/50 p-4">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Tracked</div>
                  <div className="mt-1 text-base font-bold font-mono text-text">
                    {daysTrackedText}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border/30 pt-6 mt-8 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Target Progress</span>
              </div>
              {targetWeight > 0 && (
                <span className="font-mono text-[10px] font-bold text-primary">
                  {Math.round(progress)}%
                </span>
              )}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-bg">
              <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${targetWeight > 0 ? progress : 0}%` }} />
            </div>
            <div className="flex justify-between items-baseline text-[10px] font-mono uppercase tracking-[0.2em] text-muted">
              <span>Now {latestWeight} kg</span>
              {targetWeight > 0 ? (
                <span>
                  Target {targetWeight} kg · {Math.abs(latestWeight - targetWeight).toFixed(1)} to go
                </span>
              ) : (
                <Link to="/you" className="text-primary hover:text-primary-bright normal-case tracking-normal">
                  Set target weight in profile
                </Link>
              )}
            </div>
          </div>
        </article>

        {/* Right Card: Weight Trend */}
        <article className="rounded-3xl border border-border bg-surface p-6 lg:col-span-8 flex flex-col justify-between min-h-[500px]">
          <div>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                  Weight Trend
                </span>
                <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-text">
                  Recent Entries
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-secondary">
                  <span>
                    {cleanWeightLogs.length > 0
                      ? `Last ${Math.min(12, cleanWeightLogs.length)} logs · latest ${formatDateShort(latestDate)}`
                      : "No weight logs tracked"}
                  </span>
                  {trend && (
                    <>
                      <span>·</span>
                      <span className={`font-semibold ${trend.color}`}>{trend.text}</span>
                    </>
                  )}
                </div>
              </div>
              {targetWeight > 0 && (
                <div className="text-right">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted block">
                    Target
                  </span>
                  <div className="mt-1 flex items-baseline gap-1 justify-end">
                    <span className="text-3xl font-black font-mono tracking-tight text-primary">
                      {targetWeight}
                    </span>
                    <span className="text-xs font-bold text-muted">kg</span>
                  </div>
                </div>
              )}
            </div>

            {(() => {
              const last12Logs = [...cleanWeightLogs].slice(-12);
              const weights = last12Logs.map(log => Number(log.weight));
              const chartWeights = weights.length > 0 ? weights : [profileWeight];
              const allValues = targetWeight > 0 ? [...chartWeights, targetWeight] : chartWeights;
              const maxW = Math.max(...allValues);
              const minW = Math.min(...allValues);
              const range = maxW - minW;

              // Safe bounds
              const paddingFactor = range > 0 ? range * 0.15 : 2;
              const maxScale = maxW + paddingFactor;
              const minScale = Math.max(0, minW - paddingFactor);
              const scaleRange = maxScale - minScale;

              const width = 640;
              const height = 320;
              const paddingLeft = 50;
              const paddingRight = 110;
              const paddingTop = 30;
              const paddingBottom = 40;

              let points = [];
              if (cleanWeightLogs.length === 0) {
                // Profile weight point in the center
                points = [{
                  x: paddingLeft + (width - paddingLeft - paddingRight) / 2,
                  y: paddingTop + (height - paddingTop - paddingBottom) / 2,
                  weight: profileWeight,
                  date: null
                }];
              } else if (cleanWeightLogs.length === 1) {
                // Single point in center for the only log
                points = [{
                  x: paddingLeft + (width - paddingLeft - paddingRight) / 2,
                  y: scaleRange > 0
                    ? paddingTop + (1 - (Number(cleanWeightLogs[0].weight) - minScale) / scaleRange) * (height - paddingTop - paddingBottom)
                    : height / 2,
                  weight: Number(cleanWeightLogs[0].weight),
                  date: cleanWeightLogs[0].date
                }];
              } else {
                points = last12Logs.map((log, i) => {
                  const x = paddingLeft + (i / (last12Logs.length - 1)) * (width - paddingLeft - paddingRight);
                  const y = scaleRange > 0
                    ? paddingTop + (1 - (Number(log.weight) - minScale) / scaleRange) * (height - paddingTop - paddingBottom)
                    : height / 2;
                  return { x, y, weight: Number(log.weight), date: log.date };
                });
              }

              const targetY = targetWeight > 0 && scaleRange > 0
                ? paddingTop + (1 - (targetWeight - minScale) / scaleRange) * (height - paddingTop - paddingBottom)
                : height / 2;

              // SVG paths (using smooth Catmull-Rom curve only if 2+ logs exist)
              const linePath = points.length > 1 ? getSmoothPath(points) : "";
              const areaPath = points.length > 1
                ? `${linePath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
                : "";

              // Horizontal grid lines
              const gridLines = [];
              const numGridLines = 5;
              for (let i = 0; i < numGridLines; i++) {
                const val = minScale + (i / (numGridLines - 1)) * scaleRange;
                const y = paddingTop + (1 - (val - minScale) / scaleRange) * (height - paddingTop - paddingBottom);
                gridLines.push({ y, val });
              }

              // Target status values
              const isTargetReached = latestWeight && targetWeight && (
                (startingWeight >= targetWeight && latestWeight <= targetWeight) ||
                (startingWeight <= targetWeight && latestWeight >= targetWeight)
              );

              return (
                <div className="relative w-full mt-6 flex flex-col justify-end">
                  {/* Summary Chips above the chart */}
                  <div className="flex flex-wrap gap-2.5 mb-6 select-none">
                    <div className="rounded-full border border-border/30 bg-bg px-3.5 py-1 text-xs font-semibold font-mono text-muted flex items-center gap-1.5 shadow-sm">
                      <span>Start:</span>
                      {cleanWeightLogs.length > 0 ? (
                        <span className="text-text font-black">{startingWeight} kg</span>
                      ) : (
                        <span className="text-text font-black">{profileWeight} kg <span className="text-[10px] font-normal text-muted">(Profile weight)</span></span>
                      )}
                    </div>
                    <div className="rounded-full border border-border/30 bg-bg px-3.5 py-1 text-xs font-semibold font-mono text-muted flex items-center gap-1.5 shadow-sm">
                      <span>Current:</span>
                      <span className="text-text font-black">{latestWeight} kg</span>
                    </div>
                    <div className="rounded-full border border-border/30 bg-bg px-3.5 py-1 text-xs font-semibold font-mono text-muted flex items-center gap-1.5 shadow-sm">
                      <span>Change:</span>
                      <span className={`font-black ${cleanWeightLogs.length >= 2 && totalChange < 0 ? "text-primary" : cleanWeightLogs.length >= 2 && totalChange > 0 ? "text-amber-500" : "text-text"}`}>
                        {cleanWeightLogs.length >= 2 ? `${totalChange > 0 ? "+" : ""}${totalChange.toFixed(1)} kg` : "Add another weight log"}
                      </span>
                    </div>
                    {targetWeight > 0 && (
                      <div className="rounded-full border border-border/30 bg-bg px-3.5 py-1 text-xs font-semibold font-mono text-muted flex items-center gap-1.5 shadow-sm">
                        <span>To target:</span>
                        <span className="text-primary font-black">
                          {isTargetReached ? "Goal met!" : `${Math.abs(latestWeight - targetWeight).toFixed(1)} kg`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="w-full h-[360px]">
                    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className="overflow-visible">
                      <defs>
                        {/* Soft primary/teal gradient for Area Chart */}
                        <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid Lines */}
                      {gridLines.map((line, idx) => (
                        <g key={idx}>
                          <line
                            x1={paddingLeft}
                            y1={line.y}
                            x2={width - paddingRight}
                            y2={line.y}
                            className="stroke-border/20"
                            strokeDasharray="4 4"
                          />
                          {/* Y-axis labels on the left */}
                          <text
                            x={paddingLeft - 8}
                            y={line.y + 3.5}
                            textAnchor="end"
                            className="fill-muted text-[10px] font-mono"
                          >
                            {line.val.toFixed(1)}
                          </text>
                        </g>
                      ))}

                      {/* Dashed Target Weight Line */}
                      {targetWeight > 0 && (
                        <g>
                          <line
                            x1={paddingLeft}
                            y1={targetY}
                            x2={width - paddingRight}
                            y2={targetY}
                            className="stroke-primary/40"
                            strokeDasharray="4 4"
                            strokeWidth={1.25}
                          />
                          {/* Target label labeled at the right edge */}
                          <text
                            x={width - paddingRight + 8}
                            y={targetY + 3.5}
                            textAnchor="start"
                            className="fill-primary text-[10px] font-mono font-bold"
                          >
                            Target {targetWeight}kg
                          </text>
                        </g>
                      )}

                      {/* Trend Line Area Fill */}
                      {areaPath && (
                        <path d={areaPath} fill="url(#area-gradient)" />
                      )}

                      {/* Trend Line Path */}
                      {linePath && (
                        <path
                          d={linePath}
                          fill="none"
                          className="stroke-primary"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}

                      {/* Points and Date Labels */}
                      {points.map((p, idx) => {
                        const isLatest = idx === points.length - 1;
                        return (
                          <g key={idx}>
                            {/* Point marker circle */}
                            {points.length > 1 && isLatest ? (
                              <g>
                                <circle
                                  cx={p.x}
                                  cy={p.y}
                                  r={7}
                                  className="fill-primary/20 stroke-primary"
                                  strokeWidth={1}
                                />
                                <circle
                                  cx={p.x}
                                  cy={p.y}
                                  r={3.5}
                                  className="fill-surface stroke-primary"
                                  strokeWidth={2}
                                />
                              </g>
                            ) : (
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r={3.5}
                                className="fill-surface stroke-primary"
                                strokeWidth={1.75}
                              />
                            )}

                            {/* X-axis date labels */}
                            <text
                              x={p.x}
                              y={height - 12}
                              textAnchor="middle"
                              className="fill-muted text-[9px] font-mono uppercase tracking-wider"
                            >
                              {p.date ? formatDateShort(p.date) : "Profile"}
                            </text>

                            {/* Weight value labels above points */}
                            <text
                              x={p.x}
                              y={p.y - 10}
                              textAnchor="middle"
                              className="fill-text text-[10px] font-bold font-mono"
                            >
                              {p.weight}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Overlay helper message depending on log count */}
                  {cleanWeightLogs.length === 0 && (
                    <div className="absolute inset-0 bg-surface/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                      <span className="text-xs font-semibold text-text bg-surface border border-border/50 px-4 py-2.5 rounded-2xl shadow-lg shadow-black/5">
                        Log weight entries to unlock your trend line.
                      </span>
                    </div>
                  )}

                  {cleanWeightLogs.length === 1 && (
                    <div className="absolute inset-0 bg-surface/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                      <span className="text-xs font-semibold text-text bg-surface border border-border/50 px-4 py-2.5 rounded-2xl shadow-lg shadow-black/5">
                        Add another weight log to see a trend.
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </article>
      </div>

      {/* Second Row: Detailed Progress Insights */}
      <section className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {/* Card 1: Journey Summary */}
        <article className="rounded-3xl border border-border bg-surface p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Journey
              </span>
              <h3 className="text-lg font-bold text-text uppercase tracking-tight mt-1">
                Log Summary
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted">Total Change</span>
                <p className={`text-xl font-bold font-mono mt-1 ${cleanWeightLogs.length >= 2 && totalChange < 0 ? "text-primary" : cleanWeightLogs.length >= 2 && totalChange > 0 ? "text-amber-500" : "text-text"}`}>
                  {cleanWeightLogs.length >= 2 ? `${totalChange > 0 ? "+" : ""}${totalChange.toFixed(1)} kg` : "—"}
                </p>
              </div>
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted">Entries</span>
                <p className="text-xl font-bold font-mono mt-1 text-text">
                  {cleanWeightLogs.length} logs
                </p>
              </div>
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted">First Log</span>
                <p className="text-sm font-bold text-text mt-1">
                  {cleanWeightLogs.length > 0 ? formatDateFull(cleanWeightLogs[0].date) : "—"}
                </p>
              </div>
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted">Latest Log</span>
                <p className="text-sm font-bold text-text mt-1">
                  {cleanWeightLogs.length > 0 ? formatDateFull(cleanWeightLogs[cleanWeightLogs.length - 1].date) : "—"}
                </p>
              </div>
            </div>
          </div>
        </article>

        {/* Card 2: Target Status */}
        <article className="rounded-3xl border border-border bg-surface p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Plan Status
              </span>
              <h3 className="text-lg font-bold text-text uppercase tracking-tight mt-1">
                Target Update
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted">Current</span>
                <p className="text-xl font-bold font-mono mt-1 text-text">
                  {latestWeight} kg
                </p>
              </div>
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted">Target</span>
                <p className="text-xl font-bold font-mono mt-1 text-primary">
                  {targetWeight > 0 ? `${targetWeight} kg` : "—"}
                </p>
              </div>
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted">Remaining</span>
                <p className="text-sm font-bold text-text mt-1">
                  {targetWeight > 0 ? `${Math.abs(latestWeight - targetWeight).toFixed(1)} kg` : "—"}
                </p>
              </div>
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted">Status</span>
                <p className="text-sm font-bold text-text mt-1">
                  {targetWeight > 0 ? `${Math.round(progress)}% complete` : "—"}
                </p>
              </div>
            </div>
          </div>
        </article>

        {/* Card 3: BMI / Health Zone */}
        <article className="rounded-3xl border border-border bg-surface p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Health Insight
              </span>
              <h3 className="text-lg font-bold text-text uppercase tracking-tight mt-1">
                BMI Zone
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted">BMI Value</span>
                <p className="text-xl font-bold font-mono mt-1 text-text">
                  {bmi}
                </p>
              </div>
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-muted">Category</span>
                <p className={`text-xl font-bold mt-1 ${bmiMeta.colorClass}`}>
                  {bmiMeta.label}
                </p>
              </div>
            </div>
          </div>
          <div className={`mt-4 p-3 rounded-xl border-l-2 ${
            bmiMeta.colorClass === "text-primary"
              ? "border-primary bg-primary/5"
              : bmiMeta.colorClass === "text-amber-400"
              ? "border-amber-400 bg-amber-400/5"
              : bmiMeta.colorClass === "text-orange-400"
              ? "border-orange-400 bg-orange-400/5"
              : bmiMeta.colorClass === "text-rose-500"
              ? "border-rose-500 bg-rose-500/5"
              : "border-border bg-bg/50"
          }`}>
            <p className="text-xs text-secondary leading-relaxed">
              {bmiTip}
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}
