import { Dumbbell, Scale } from "lucide-react";
import { Link } from "react-router-dom";

export default function QuickLogButtons() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Link
        to="/log"
        state={{ open: "workout" }}
        className="p-4 rounded-sm bg-surface border border-border hover:border-primary transition-all flex items-center justify-between"
      >
        <div>
          <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">
            Quick log
          </span>
          <h3 className="text-sm font-semibold text-text mt-1">Workout</h3>
        </div>
        <Dumbbell className="h-5 w-5 text-primary" aria-hidden="true" />
      </Link>
      <Link
        to="/log"
        state={{ open: "weight" }}
        className="p-4 rounded-sm bg-surface border border-border hover:border-primary transition-all flex items-center justify-between"
      >
        <div>
          <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">
            Quick log
          </span>
          <h3 className="text-sm font-semibold text-text mt-1">Weight</h3>
        </div>
        <Scale className="h-5 w-5 text-primary" aria-hidden="true" />
      </Link>
    </div>
  );
}
