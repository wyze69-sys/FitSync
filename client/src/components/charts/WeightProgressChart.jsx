import { TrendingDown } from "lucide-react";
import EmptyState from "../common/EmptyState.jsx";

/**
 * Lightweight, dependency-free SVG line chart of recent body-weight entries.
 * Optionally overlays a dashed target-weight line.
 */
export default function WeightProgressChart({ weightLogs = [], targetWeight, maxPoints = 8 }) {
  const records = [...weightLogs].slice(0, maxPoints).reverse();
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

  const width = 500;
  const height = 170;
  const paddingX = 40;
  const paddingY = 24;

  const weights = records.map((record) => record.weight);
  const candidates = [...weights];
  if (targetWeight) candidates.push(targetWeight);
  const minW = Math.min(...candidates) - 1;
  const maxW = Math.max(...candidates) + 1;
  const range = maxW - minW || 1;

  const yFor = (weight) => height - paddingY - ((weight - minW) * (height - paddingY * 2)) / range;
  const xFor = (index) => paddingX + (index * (width - paddingX * 2)) / (records.length - 1);

  const points = records.map((record, index) => `${xFor(index)},${yFor(record.weight)}`).join(" ");
  const targetY = targetWeight ? yFor(targetWeight) : null;

  return (
    <div className="w-full overflow-x-auto bg-surface">
      <div className="min-w-[400px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          role="img"
          aria-label="Body weight trend over recent entries"
        >
          {[paddingY, height / 2, height - paddingY].map((y) => (
            <line
              key={y}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="#2A2E37"
              strokeWidth="1"
              opacity="0.8"
            />
          ))}

          {targetY !== null && (
            <g>
              <line
                x1={paddingX}
                y1={targetY}
                x2={width - paddingX}
                y2={targetY}
                stroke="#C7FF41"
                strokeWidth="1.5"
                strokeDasharray="5 4"
                opacity="0.85"
              />
              <text
                x={width - paddingX}
                y={targetY - 5}
                textAnchor="end"
                className="font-mono text-[9px] fill-accent"
              >
                Target {targetWeight}kg
              </text>
            </g>
          )}

          <polyline
            fill="none"
            stroke="#C7FF41"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {records.map((record, index) => {
            const x = xFor(index);
            const y = yFor(record.weight);
            const label = new Date(record.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric"
            });
            return (
              <g key={record.id || index}>
                <circle cx={x} cy={y} r="5" fill="#181A20" stroke="#C7FF41" strokeWidth="2" />
                <text
                  x={x}
                  y={y - 12}
                  textAnchor="middle"
                  className="font-mono text-[9px] font-bold fill-text"
                >
                  {record.weight}kg
                </text>
                <text
                  x={x}
                  y={height - 5}
                  textAnchor="middle"
                  className="font-mono text-[9px] fill-muted"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
