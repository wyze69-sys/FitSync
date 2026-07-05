import { TrendingDown } from "lucide-react";
import EmptyState from "../common/EmptyState.jsx";
import { sortWeightLogsOldestFirst } from "../../utils/weightLogs.js";

/**
 * Lightweight, dependency-free SVG line chart of recent body-weight entries.
 * Optionally overlays a dashed target-weight line.
 */
export default function WeightProgressChart({ weightLogs = [], targetWeight, maxPoints = 8 }) {
  const records = sortWeightLogsOldestFirst(weightLogs).slice(-maxPoints);
  const hasData = records.length > 1;

  if (!hasData) {
    return (
      <EmptyState
        icon={TrendingDown}
        title="Not enough weight data yet"
        description="Log at least two body-weight entries. Recording once per week builds a helpful trend line."
      />
    );
  }

  const width = 640;
  const height = 220;
  const paddingX = 48;
  const paddingY = 32;

  const weights = records.map((record) => Number(record.weight));
  const candidates = [...weights];
  if (targetWeight) candidates.push(Number(targetWeight));
  const minW = Math.min(...candidates) - 1;
  const maxW = Math.max(...candidates) + 1;
  const range = maxW - minW || 1;

  const yFor = (weight) => height - paddingY - ((Number(weight) - minW) * (height - paddingY * 2)) / range;
  const xFor = (index) => paddingX + (index * (width - paddingX * 2)) / (records.length - 1);

  const points = records.map((record, index) => `${xFor(index)},${yFor(record.weight)}`).join(" ");
  const targetY = targetWeight ? yFor(Number(targetWeight)) : null;

  return (
    <div className="w-full rounded-2xl bg-surface">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full overflow-visible select-none"
        role="img"
        aria-label="Body weight trend over recent entries"
      >
        {[paddingY, height / 2, height - paddingY].map((y) => (
          <line key={y} x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#CBCBCB" strokeWidth="1" opacity="0.9" />
        ))}

        {targetY !== null && (
          <g>
            <line
              x1={paddingX}
              y1={targetY}
              x2={width - paddingX}
              y2={targetY}
              stroke="#10B981"
              strokeWidth="2"
              strokeDasharray="6 5"
              opacity="0.95"
            />
            <text x={width - paddingX} y={targetY - 8} textAnchor="end" className="font-mono tabular-nums text-[10px] font-bold fill-primary">
              Target {targetWeight}kg
            </text>
          </g>
        )}

        <polyline fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />

        {records.map((record, index) => {
          const x = xFor(index);
          const y = yFor(record.weight);
          const label = new Date(record.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const tooltip = `${label}: ${record.weight}kg`;
          return (
            <g key={record.id || index} className="group">
              <circle cx={x} cy={y} r="6" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5">
                <title>{tooltip}</title>
              </circle>
              <text x={x} y={y - 14} textAnchor="middle" className="font-mono tabular-nums text-[10px] font-bold fill-text opacity-0 transition-opacity group-hover:opacity-100">
                {record.weight}kg
              </text>
              <text x={x} y={height - 8} textAnchor="middle" className="font-mono tabular-nums text-[10px] fill-muted">
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
