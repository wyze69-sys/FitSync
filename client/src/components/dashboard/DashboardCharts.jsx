import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import WeightProgressChart from "../charts/WeightProgressChart.jsx";

/**
 * Dashboard weight-trend chart card with a link to the full progress view.
 */
export default function DashboardCharts({ weightLogs, targetWeight }) {
  return (
    <div className="bg-surface p-4 rounded-sm border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">
            Weight trend
          </span>
          <h3 className="text-sm font-semibold text-text mt-0.5">
            Physical Progress
          </h3>
        </div>
        <Link
          to="/progress"
          className="text-xs font-medium text-muted hover:text-accent flex items-center gap-1 cursor-pointer transition-all"
        >
          Log weight
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <WeightProgressChart weightLogs={weightLogs} targetWeight={targetWeight} />
    </div>
  );
}
