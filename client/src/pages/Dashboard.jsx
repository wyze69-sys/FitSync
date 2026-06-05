import { useEffect, useState } from "react";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setUser(data.user || data));
  }, []);

  const xp = user?.gamification?.total_xp || 0;
  const level = user?.gamification?.level || 1;
  const streak = user?.gamification?.current_streak || 0;
  const progress = ((xp % 150) / 150) * 100;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Good evening, {user?.name || "Sarah"}</h1>
        <p className="text-[#666] text-sm">Here is your fitness snapshot for today.</p>
      </div>

      {/* XP HERO */}
      <div className="bg-[#141414] rounded-2xl p-6 mb-4 border border-[#222]">
        <div className="flex justify-between mb-3">
          <span className="text-xs text-[#666] uppercase tracking-widest">LEVEL PROGRESS</span>
          <span className="text-[#c4ff00] text-xs">⚡ {xp} XP</span>
        </div>
        <div className="flex items-end gap-4">
          <div className="text-6xl font-black text-[#c4ff00] leading-none">{level}</div>
          <div className="flex-1 mb-2">
            <div className="h-2 bg-[#222] rounded-full overflow-hidden">
              <div className="h-full bg-[#c4ff00] transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="text-xs text-[#999] mt-1.5">{150 - (xp % 150)} XP to level {level + 1}</div>
          </div>
        </div>
      </div>

      {/* STREAK */}
      <div className="bg-[#141414] rounded-2xl p-5 mb-4 border border-[#222]">
        <div className="text-xs text-[#666] uppercase tracking-widest mb-1">CURRENT STREAK</div>
        <div className="text-3xl font-bold text-[#c4ff00]">{streak} <span className="text-lg text-white font-normal">days</span></div>
      </div>

      {/* 3 STATS */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#141414] rounded-xl p-4 text-center border border-[#222]">
          <div className="text-2xl font-bold">{user?.weekWorkouts || 0}</div>
          <div className="text-xs text-[#666] uppercase mt-1 leading-tight">Workouts<br />Week</div>
        </div>
        <div className="bg-[#141414] rounded-xl p-4 text-center border border-[#222]">
          <div className="text-2xl font-bold">{user?.todayCalories || 0}</div>
          <div className="text-xs text-[#666] uppercase mt-1 leading-tight">Kcal<br />Today</div>
        </div>
        <div className="bg-[#141414] rounded-xl p-4 text-center border border-[#222]">
          <div className="text-2xl font-bold text-[#c4ff00]">{xp}</div>
          <div className="text-xs text-[#666] uppercase mt-1 leading-tight">Total<br />XP</div>
        </div>
      </div>
    </div>
  );
}
