import { Link } from "react-router-dom";
import { Sparkles, ChevronRight } from "lucide-react";

/**
 * Compact card prompting the user to view their weekly AI insight.
 */
export default function DashboardInsightsCard({ latestInsight }) {
  return (
    <div className="space-y-4">
      <div>
        <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">
          Performance evaluation
        </span>
        <h3 className="text-sm font-semibold text-text mt-0.5">Weekly AI Insight</h3>
      </div>

      <div className="p-5 rounded-sm border border-accent bg-surface space-y-4 shadow-[0_16px_36px_rgba(0,0,0,0.42)]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-accent" aria-hidden="true" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent">
            Gemini Insight
          </span>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          {latestInsight
            ? latestInsight.summary
            : "Review your weekly active days, workout volume, BMI, and weight trend. Gemini turns your records into simple next steps."}
        </p>
        <Link
          to="/"
          className="w-full py-2.5 bg-accent text-black rounded-sm text-xs font-medium uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          Back Home
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
