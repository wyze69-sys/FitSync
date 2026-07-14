export default function Skeleton({ className = "", as: Component = "div" }) {
  return (
    <Component
      aria-hidden="true"
      className={`skeleton-soft bg-border/55 ${className}`.trim()}
    />
  );
}
