import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import WeightProgressChart from "../charts/WeightProgressChart.jsx";

/**
 * Dashboard weight-trend chart card with a link to the full progress view.
 */
export default function DashboardCharts({ weightLogs, targetWeight }) {
  return (
    <div className="bg-[#0E0E0E] p-6 rounded-sm border border-neutral-800 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest">
            Weight trend
          </span>
          <h3 className="text-base font-serif italic font-bold text-white mt-0.5">
            Physical Progress
          </h3>
        </div>
        <Link
          to="/progress"
          className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer font-serif italic transition-all"
        >
          Log weight
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <WeightProgressChart weightLogs={weightLogs} targetWeight={targetWeight} />
    </div>
  );
}
