import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import authService from "../services/authService.js";
import Navbar from "../components/common/Navbar.jsx";
import { Settings } from "lucide-react";

/**
 * Profile page - dedicated profile editing page.
 * Note: Profile editing is also available inline on the Dashboard.
 * This page provides a standalone route for direct profile access.
 */
export default function Profile() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  const [name, setName] = useState(user?.name || "");
  const [age, setAge] = useState(user?.age?.toString() || "");
  const [gender, setGender] = useState(user?.gender || "male");
  const [height, setHeight] = useState(user?.height?.toString() || "");
  const [weight, setWeight] = useState(user?.weight?.toString() || "");
  const [goal, setGoal] = useState(user?.goal || "Maintain fitness");
  const [activityLevel, setActivityLevel] = useState(user?.activityLevel || "Moderately active");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);
    try {
      const data = await authService.updateProfile({
        name, age: age ? Number(age) : undefined,
        gender, height: height ? Number(height) : undefined,
        weight: weight ? Number(weight) : undefined, goal, activityLevel
      });
      updateUser(data);
      setStatusMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message || "Failed to save profile." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0A] to-[#050505] text-[#E0E0E0] flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-grow max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[#0E0E0E] p-6 rounded-sm border border-white/10 shadow-2xl space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-neutral-900">
            <Settings className="h-5 w-5 text-emerald-400" />
            <h2 className="text-xl font-serif italic text-white font-bold">Athlete Profile Settings</h2>
          </div>

          {statusMessage && (
            <div className={`p-3 rounded border text-xs font-semibold ${statusMessage.type === "success" ? "bg-emerald-950/20 border-emerald-900/30 text-emerald-300" : "bg-red-950/20 border-red-900/30 text-red-300"}`}>
              {statusMessage.text}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4 text-left">
            <div>
              <label className="block text-[9px] font-mono font-semibold text-neutral-400 uppercase tracking-widest mb-1">Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="block w-full px-3 py-2 text-xs bg-black border border-neutral-800 focus:border-neutral-500 rounded-sm text-white focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-mono font-semibold text-neutral-400 uppercase tracking-widest mb-1">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className="block w-full px-3 py-2 bg-black border border-neutral-800 rounded-sm text-xs text-white focus:outline-none cursor-pointer">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-mono font-semibold text-neutral-400 uppercase tracking-widest mb-1">Age</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="block w-full px-3 py-2 text-xs bg-black border border-neutral-800 rounded-sm text-white focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-mono font-semibold text-neutral-400 uppercase tracking-widest mb-1">Height (cm)</label>
                <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="block w-full px-3 py-2 text-xs bg-black border border-neutral-800 rounded-sm text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-[9px] font-mono font-semibold text-neutral-400 uppercase tracking-widest mb-1">Weight (kg)</label>
                <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className="block w-full px-3 py-2 text-xs bg-black border border-neutral-800 rounded-sm text-white focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-[9px] font-mono font-semibold text-neutral-400 uppercase tracking-widest mb-1">Fitness Goal</label>
              <select value={goal} onChange={(e) => setGoal(e.target.value)} className="block w-full px-3 py-2 bg-black border border-neutral-800 rounded-sm text-xs text-white focus:outline-none cursor-pointer">
                <option value="Lose weight & Tone muscle">Lose weight & Tone muscle</option>
                <option value="Gain muscle mass">Gain muscle mass</option>
                <option value="Improve cardiovascular endurance">Improve cardiovascular endurance</option>
                <option value="Maintain overall health & fitness">Maintain overall fitness</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-mono font-semibold text-neutral-400 uppercase tracking-widest mb-1">Activity Level</label>
              <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)} className="block w-full px-3 py-2 bg-black border border-neutral-800 rounded-sm text-xs text-white focus:outline-none cursor-pointer">
                <option value="Sedentary">Sedentary</option>
                <option value="Lightly active">Lightly active</option>
                <option value="Moderately active">Moderately active</option>
                <option value="Very active">Very active</option>
              </select>
            </div>
            <button type="submit" disabled={saving} className="w-full py-2.5 bg-white text-black font-semibold text-xs rounded-sm uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50 hover:bg-neutral-200">
              {saving ? "Saving..." : "Save Profile Changes"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
