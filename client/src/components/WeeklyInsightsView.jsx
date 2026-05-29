import { useState, useEffect } from 'react';
import { Sparkles, Calendar, CheckCircle2, Target, AlertCircle, History, Info } from 'lucide-react';
const LOADING_STEPS = [
    'Aggregating weekly workout counts and training minutes...',
    'Analyzing body weight fluctuations and BMI milestones...',
    'Connecting securely to Gemini AI analysis layer...',
    'Drafting weekly training suggestions...',
    'Finalizing insight overview...'
];
export default function WeeklyInsightsView({ insights, onInsightGenerated }) {
    const [loading, setLoading] = useState(false);
    const [loadingStepIdx, setLoadingStepIdx] = useState(0);
    const [error, setError] = useState(null);
    useEffect(() => {
        let interval;
        if (loading) {
            setLoadingStepIdx(0);
            interval = setInterval(() => {
                setLoadingStepIdx(prev => (prev + 1) % LOADING_STEPS.length);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [loading]);
    async function triggerInsightGeneration() {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('fitsync_token');
            const resp = await fetch('/api/ai/generate-weekly-insight', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await resp.json();
            if (!resp.ok) {
                throw new Error(data.error || 'Failed generating performance report.');
            }
            onInsightGenerated();
        }
        catch (err) {
            setError(err.message || 'Gemini transaction failed.');
        }
        finally {
            setLoading(false);
        }
    }
    const activeInsight = insights[0];
    return (<div id="insights-view-root" className="space-y-6 text-left font-sans text-[#E0E0E0]">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif italic text-white font-bold">Weekly AI Insight</h2>
          <p className="text-xs text-white/40 font-sans">Use Gemini to review weekly workouts, weight trends, and progress notes.</p>
        </div>
        {!loading && (<button type="button" onClick={triggerInsightGeneration} className="flex items-center gap-1.5 px-4 py-2 bg-white text-black hover:bg-white/90 rounded-sm text-xs font-bold uppercase tracking-widest cursor-pointer shadow-xl transition-all">
            <Sparkles className="h-4 w-4 text-emerald-500"/>
            Generate Report
          </button>)}
      </div>

      {error && (<div className="p-3 bg-red-950/45 border border-red-900/40 text-red-105 text-xs rounded-lg font-semibold flex items-center gap-1.5">
          <AlertCircle className="h-4.5 w-4.5 text-red-400"/>
          <span>{error}</span>
        </div>)}

      {loading ? (<div className="bg-[#0E0E0E] border border-white/10 p-12 rounded-sm text-center space-y-5 shadow-lg flex flex-col items-center justify-center animate-pulse">
          <div className="h-12 w-12 rounded-sm bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Sparkles className="h-6 w-6 animate-spin"/>
          </div>
          <div className="space-y-2 max-w-sm">
            <h4 className="text-sm font-serif italic text-white font-medium">Generating Weekly Insight</h4>
            <p className="text-xs text-white/50 font-mono transition-all duration-500 h-8">
              {LOADING_STEPS[loadingStepIdx]}
            </p>
          </div>
          <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full animate-infinite-loading width-transition" style={{ width: `${((loadingStepIdx + 1) / LOADING_STEPS.length) * 100}%` }}></div>
          </div>
        </div>) : (<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            
            {activeInsight ? (<div className="bg-[#0E0E0E] border border-white/10 p-6 rounded-sm shadow-md space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-400 to-teal-500"></div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded bg-emerald-950/30 text-emerald-400 border border-emerald-900/30">
                      <Sparkles className="h-4 w-4"/>
                    </span>
                    <div>
                      <h3 className="text-sm font-serif italic text-white font-bold">Performance Overview</h3>
                      <p className="text-[9px] font-mono text-white/40">GEN DATE: {activeInsight.dateGenerated}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white/40">
                    <Calendar className="h-3.5 w-3.5 text-white/30"/>
                    <span>Split Range: {activeInsight.startDate} to {activeInsight.endDate}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-sm bg-white/[0.015] border border-white/5 text-center space-y-0.5">
                    <span className="text-white/30 font-mono text-[8.5px] uppercase tracking-wider block">Active Workouts</span>
                    <strong className="text-sm font-black text-white block">{activeInsight.workoutCount} logs</strong>
                  </div>
                  <div className="p-3 rounded-sm bg-white/[0.015] border border-white/5 text-center space-y-0.5">
                    <span className="text-white/30 font-mono text-[8.5px] uppercase tracking-wider block">Time Volume</span>
                    <strong className="text-sm font-black text-[#E0E0E0] block">{activeInsight.totalMinutes}m logged</strong>
                  </div>
                  <div className="p-3 rounded-sm bg-white/[0.015] border border-white/5 text-center space-y-0.5">
                    <span className="text-white/30 font-mono text-[8.5px] uppercase tracking-wider block">Review Weight</span>
                    <strong className="text-sm font-black text-white block">{activeInsight.currentWeight}kg</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest font-mono">Routine Summary</h4>
                  <p className="text-xs text-white/80 leading-relaxed font-sans">{activeInsight.summary}</p>
                </div>

                <div className="space-y-3 border-t border-white/10 pt-5 text-[#E0E0E0]">
                  <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest font-mono mb-1">Weekly Recommendations</h4>
                  <div className="space-y-3.5">
                    {activeInsight.recommendations && activeInsight.recommendations.map((rec, index) => (<div key={index} className="flex items-start gap-2.5 text-xs text-white/70 leading-relaxed">
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5"/>
                        <span className="font-sans text-white/80">{rec}</span>
                      </div>))}
                  </div>
                </div>

                <div className="p-4 rounded-sm bg-white/[0.015] border border-white/5 flex items-start sm:items-center gap-3">
                  <Target className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5 sm:mt-0"/>
                  <div className="text-xs">
                    <strong className="text-white font-bold block">Compliance Status:</strong>
                    <span className="text-white/60 font-sans mt-0.5 block">{activeInsight.goalProgress}</span>
                  </div>
                </div>

              </div>) : (<div className="bg-[#0E0E0E] p-12 rounded-sm border border-white/10 text-center flex flex-col items-center justify-center space-y-4">
                <Sparkles className="h-10 w-10 text-emerald-400 animate-pulse"/>
                <div className="space-y-1">
                  <h3 className="text-sm font-serif italic text-white font-bold">No weekly insight compiled yet</h3>
                  <p className="text-xs text-white/40 font-sans max-w-sm leading-relaxed">Record workouts and weight entries, then generate a report to review weekly progress.</p>
                </div>
              </div>)}

          </div>

          <div className="space-y-6">
            
            <div className="bg-[#0E0E0E] p-5 rounded-sm border border-white/10 shadow-sm space-y-3.5 text-[#E0E0E0]">
              <div className="flex items-center gap-1.5 pb-2.5 border-b border-white/10 text-white/40 font-mono text-xs">
                <Info className="h-4 w-4"/>
                <span className="font-bold uppercase tracking-wider">Interpretation Rules</span>
              </div>
              <p className="text-xs text-white/65 leading-relaxed font-sans mt-1">
                FitSync reviews your workouts and weight changes over time. Gemini helps turn those records into simple weekly suggestions.
              </p>
              <p className="text-[11px] text-white/30 font-sans leading-relaxed">
                <strong>Note:</strong> This report is for fitness tracking support only and is not medical advice.
              </p>
            </div>

            <div className="bg-[#0E0E0E] p-5 rounded-sm border border-white/10 shadow-sm space-y-4 font-sans text-xs text-[#E0E0E0]">
              <div className="flex items-center gap-1.5 pb-2.5 border-b border-white/10 text-white/40">
                <History className="h-4 w-4"/>
                <span className="font-bold uppercase tracking-widest font-mono text-[9px]">Previous Insight Reports</span>
              </div>

              {insights.slice(1).length === 0 ? (<div className="text-center py-4 text-white/30 text-xs">
                  No previous historical reports stored yet.
                </div>) : (<div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {insights.slice(1).map((ins) => (<div key={ins.id} className="p-3 border border-white/5 bg-white/[0.005] rounded-sm space-y-1 block hover:bg-white/[0.02] transition-all cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-white/30">{ins.dateGenerated}</span>
                        <span className="text-[9px] text-emerald-400 font-semibold">{ins.workoutCount} workouts</span>
                      </div>
                      <p className="text-white/70 line-clamp-1 font-semibold">{ins.goalProgress}</p>
                    </div>))}
                </div>)}
            </div>

          </div>

        </div>)}

    </div>);
}
