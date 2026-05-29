import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Sparkles, Calendar, CheckCircle2, Target, History, Info } from "lucide-react";
import insightService from "../services/insightService.js";
import ErrorBanner from "../components/common/ErrorBanner.jsx";

const LOADING_STEPS = [
  "Aggregating weekly workout counts and minutes...",
  "Reviewing body-weight trend and BMI...",
  "Connecting to the Gemini analysis layer...",
  "Drafting weekly training suggestions...",
  "Finalizing your insight..."
];

export default function Insights() {
  const { insights, refreshAll, push } = useOutletContext();
  const [loading, setLoading] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading) return undefined;
    setStepIdx(0);
    const interval = setInterval(() => {
      setStepIdx((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [loading]);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      await insightService.generateWeeklyInsight();
      await refreshAll();
      push("Weekly insight generated.", "success");
    } catch (err) {
      setError(err.message || "Failed to generate the weekly insight.");
    } finally {
      setLoading(false);
    }
  }

  const activeInsight = insights?.[0];

  return (
    <div className="space-y-6 text-left text-[#E0E0E0]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-serif italic text-white font-bold">Weekly AI Insight</h1>
          <p className="text-xs text-white/40">
            Gemini reviews your weekly workouts, streak, and weight trend.
          </p>
        </div>
        {!loading && (
          <button
            type="button"
            onClick={generate}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-black hover:bg-white/90 rounded-sm text-xs font-bold uppercase tracking-widest cursor-pointer shadow-xl transition-all"
          >
            <Sparkles className="h-4 w-4 text-emerald-500" /> Generate report
          </button>
        )}
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <div className="bg-[#0E0E0E] border border-white/10 p-12 rounded-sm text-center space-y-5 shadow-lg flex flex-col items-center justify-center">
          <div className="h-12 w-12 rounded-sm bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Sparkles className="h-6 w-6 animate-spin" />
          </div>
          <div className="space-y-2 max-w-sm">
            <h2 className="text-sm font-serif italic text-white font-medium">
              Generating weekly insight
            </h2>
            <p className="text-xs text-white/50 font-mono h-8">{LOADING_STEPS[stepIdx]}</p>
          </div>
          <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all"
              style={{ width: `${((stepIdx + 1) / LOADING_STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {activeInsight ? (
              <div className="bg-[#0E0E0E] border border-white/10 p-6 rounded-sm shadow-md space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-400 to-teal-500" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded bg-emerald-950/30 text-emerald-400 border border-emerald-900/30">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="text-sm font-serif italic text-white font-bold">
                        Performance Overview
                      </h2>
                      <p className="text-[9px] font-mono text-white/40">
                        Generated: {activeInsight.dateGenerated}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white/40">
                    <Calendar className="h-3.5 w-3.5 text-white/30" />
                    <span>
                      {activeInsight.startDate} to {activeInsight.endDate}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Stat label="Workouts" value={`${activeInsight.workoutCount}`} />
                  <Stat label="Minutes" value={`${activeInsight.totalMinutes}m`} />
                  <Stat label="Weight" value={`${activeInsight.currentWeight}kg`} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest font-mono">
                    Summary
                  </h3>
                  <p className="text-xs text-white/80 leading-relaxed">{activeInsight.summary}</p>
                </div>

                <div className="space-y-3 border-t border-white/10 pt-5">
                  <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest font-mono">
                    Recommendations
                  </h3>
                  <div className="space-y-3.5">
                    {(activeInsight.recommendations || []).map((rec, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2.5 text-xs text-white/80 leading-relaxed"
                      >
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-sm bg-white/[0.015] border border-white/5 flex items-start sm:items-center gap-3">
                  <Target className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
                  <div className="text-xs">
                    <strong className="text-white font-bold block">Goal progress</strong>
                    <span className="text-white/60 mt-0.5 block">{activeInsight.goalProgress}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#0E0E0E] p-12 rounded-sm border border-white/10 text-center flex flex-col items-center justify-center space-y-4">
                <Sparkles className="h-10 w-10 text-emerald-400" />
                <div className="space-y-1">
                  <h2 className="text-sm font-serif italic text-white font-bold">
                    No weekly insight yet
                  </h2>
                  <p className="text-xs text-white/40 max-w-sm leading-relaxed">
                    Log a few workouts and weight entries, then generate a report to review your
                    week.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-[#0E0E0E] p-5 rounded-sm border border-white/10 shadow-sm space-y-3.5">
              <div className="flex items-center gap-1.5 pb-2.5 border-b border-white/10 text-white/40 font-mono text-xs">
                <Info className="h-4 w-4" />
                <span className="font-bold uppercase tracking-wider">How it works</span>
              </div>
              <p className="text-xs text-white/65 leading-relaxed">
                FitSync reviews your workouts, streak, and weight changes over time. Gemini turns
                those records into simple weekly suggestions.
              </p>
              <p className="text-[11px] text-white/30 leading-relaxed">
                <strong>Note:</strong> This is fitness tracking support only, not medical advice.
              </p>
            </div>

            <div className="bg-[#0E0E0E] p-5 rounded-sm border border-white/10 shadow-sm space-y-4 text-xs text-[#E0E0E0]">
              <div className="flex items-center gap-1.5 pb-2.5 border-b border-white/10 text-white/40">
                <History className="h-4 w-4" />
                <span className="font-bold uppercase tracking-widest font-mono text-[9px]">
                  Previous reports
                </span>
              </div>
              {(insights || []).slice(1).length === 0 ? (
                <div className="text-center py-4 text-white/30 text-xs">
                  No previous reports yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {insights.slice(1).map((insight) => (
                    <div
                      key={insight.id}
                      className="p-3 border border-white/5 bg-white/[0.005] rounded-sm space-y-1 hover:bg-white/[0.02] transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-white/30">
                          {insight.dateGenerated}
                        </span>
                        <span className="text-[9px] text-emerald-400 font-semibold">
                          {insight.workoutCount} workouts
                        </span>
                      </div>
                      <p className="text-white/70 line-clamp-1 font-semibold">
                        {insight.goalProgress}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="p-3 rounded-sm bg-white/[0.015] border border-white/5 text-center space-y-0.5">
      <span className="text-white/30 font-mono text-[8.5px] uppercase tracking-wider block">
        {label}
      </span>
      <strong className="text-sm font-black text-white block">{value}</strong>
    </div>
  );
}
