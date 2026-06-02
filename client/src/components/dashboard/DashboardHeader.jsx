/**
 * Friendly dashboard greeting with the current date.
 */
export default function DashboardHeader({ user }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
  const firstName = (user?.name || "there").split(" ")[0];

  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
      <div>
        <h1 className="text-2xl text-text font-semibold tracking-tight">
          {greeting}, {firstName}
        </h1>
        <p className="text-xs text-muted mt-1">Here is your fitness snapshot for today.</p>
      </div>
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted">{today}</span>
    </div>
  );
}
