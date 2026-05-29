import { Link } from "react-router-dom";
import { Sparkles, ChevronRight } from "lucide-react";

/**
 * Compact card prompting the user to view their weekly AI insight.
 */
export default function DashboardInsightsCard({ latestInsight }) {
  return (
    <div className="space-y-4">
      <div>
        <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">
          Performance evaluation
        </span>
        <h3 className="text-sm font-bold text-white mt-0.5 font-serif italic">Weekly AI Insight</h3>
      </div>

      <div className="p-5 rounded-sm border border-emerald-500/10 bg-[#0E0E0E] space-y-4 shadow-xl hover:border-emerald-500/20 transition-all">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-emerald-400" aria-hidden="true" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
            Gemini Insight
          </span>
        </div>
        <p className="text-xs text-neutral-400 leading-relaxed">
          {latestInsight
            ? latestInsight.summary
            : "Review your weekly active days, workout volume, BMI, and weight trend. Gemini turns your records into simple next steps."}
        </p>
        <Link
          to="/insights"
          className="w-full py-2.5 bg-white hover:bg-neutral-100 text-black rounded-sm text-xs font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          View Weekly Insight
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
