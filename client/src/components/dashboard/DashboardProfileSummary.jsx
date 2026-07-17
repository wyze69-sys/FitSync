import { useState, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";
import authService from "../../services/authService.js";
import { GENDERS, GOALS, ACTIVITY_LEVELS, WORKOUT_TYPES } from "../../utils/constants.js";
import ErrorBanner from "../common/ErrorBanner.jsx";

const LABEL =
  "block text-[10px] font-mono font-semibold text-muted uppercase tracking-widest mb-1";
const INPUT =
  "block w-full px-3 py-2 text-xs bg-bg border border-border focus:border-primary rounded-lg text-text focus:outline-none";

/**
 * Athlete profile card with an inline view/edit toggle. Persists target weight
 * and preferred workout type alongside the core profile fields.
 */
export default function DashboardProfileSummary({ user, onProfileUpdated, onToast }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    setForm({
      name: user.name || "",
      age: user.age?.toString() || "",
      gender: user.gender || "male",
      height: user.height?.toString() || "",
      weight: user.weight?.toString() || "",
      targetWeight: user.targetWeight?.toString() || "",
      preferredWorkoutType: user.preferredWorkoutType || "Strength",
      goal: user.goal || GOALS[0],
      activityLevel: user.activityLevel || "Moderately active"
    });
  }, [user]);

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await authService.updateProfile({
        name: form.name,
        age: form.age !== "" ? Number(form.age) : (user.age ? 0 : undefined),
        gender: form.gender,
        height: form.height !== "" ? Number(form.height) : (user.height ? 0 : undefined),
        weight: form.weight !== "" ? Number(form.weight) : (user.weight ? 0 : undefined),
        targetWeight: form.targetWeight !== "" ? Number(form.targetWeight) : (user.targetWeight ? 0 : undefined),
        preferredWorkoutType: form.preferredWorkoutType,
        goal: form.goal,
        activityLevel: form.activityLevel
      });
      onProfileUpdated(updated);
      setIsEditing(false);
      if (onToast) onToast("Profile saved successfully.", "success");
    } catch (err) {
      setError(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  const editButton = (
    <button
      type="button"
      onClick={() => {
        setIsEditing((value) => !value);
        setError(null);
      }}
      className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-muted hover:text-primary hover:border-primary border border-border bg-bg/35 rounded-lg transition-all cursor-pointer"
    >
      {isEditing ? "Cancel" : "Edit"}
    </button>
  );

  return (
    <div className="space-y-4">
      {!isEditing ? (
        <div className="rounded-2xl border border-border bg-surface p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-2.5 mb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <h3 className="text-[11px] font-mono font-bold text-text uppercase tracking-[0.2em]">
                Profile Details
              </h3>
            </div>
            {editButton}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Column 1: Personal Data */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-mono font-black text-primary uppercase tracking-[0.15em] border-b border-border/20 pb-1 mb-2">
                Personal Data
              </h4>
              <div className="divide-y divide-border/20">
                <ProfileRow label="Name" value={user.name || "Not set"} />
                <ProfileRow label="Gender" value={user.gender || "Not set"} capitalize />
                <ProfileRow label="Age" value={user.age ? `${user.age} yrs` : "Not set"} numeric={Boolean(user.age)} />
                <ProfileRow label="Height" value={user.height ? `${user.height} cm` : "Not set"} numeric={Boolean(user.height)} />
                <ProfileRow label="Weight" value={user.weight ? `${user.weight} kg` : "Not set"} numeric={Boolean(user.weight)} />
              </div>
            </div>

            {/* Column 2: Goals */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-mono font-black text-primary uppercase tracking-[0.15em] border-b border-border/20 pb-1 mb-2">
                Goals
              </h4>
              <div className="divide-y divide-border/20">
                <ProfileRow label="Primary Goal" value={user.goal || "Not set"} />
                <ProfileRow label="Target Weight" value={user.targetWeight ? `${user.targetWeight} kg` : "Not set"} numeric={Boolean(user.targetWeight)} />
                <ProfileRow label="Activity Level" value={user.activityLevel || "Not set"} />
                <ProfileRow label="Workout Style" value={user.preferredWorkoutType || "Not set"} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <h3 className="text-[11px] font-mono font-bold text-text uppercase tracking-[0.2em]">
                Edit Profile Details
              </h3>
            </div>
            {editButton}
          </div>

          <ErrorBanner message={error} />

          <form onSubmit={handleSave} className="space-y-3 pt-2 text-left">
            <div>
              <label htmlFor="p-name" className={LABEL}>
                Name
              </label>
              <input
                id="p-name"
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className={INPUT}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="p-gender" className={LABEL}>
                  Gender
                </label>
                <select
                  id="p-gender"
                  value={form.gender}
                  onChange={(e) => setField("gender", e.target.value)}
                  className={`${INPUT} cursor-pointer`}
                >
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="p-age" className={LABEL}>
                  Age (years)
                </label>
                <input
                  id="p-age"
                  type="number"
                  min="1"
                  value={form.age}
                  onChange={(e) => setField("age", e.target.value)}
                  className={INPUT}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label htmlFor="p-height" className={LABEL}>
                  Height (cm)
                </label>
                <input
                  id="p-height"
                  type="number"
                  value={form.height}
                  onChange={(e) => setField("height", e.target.value)}
                  className={INPUT}
                />
              </div>
              <div>
                <label htmlFor="p-weight" className={LABEL}>
                  Weight (kg)
                </label>
                <input
                  id="p-weight"
                  type="number"
                  step="0.1"
                  value={form.weight}
                  onChange={(e) => setField("weight", e.target.value)}
                  className={INPUT}
                />
              </div>
              <div>
                <label htmlFor="p-target" className={LABEL}>
                  Target (kg)
                </label>
                <input
                  id="p-target"
                  type="number"
                  step="0.1"
                  value={form.targetWeight}
                  onChange={(e) => setField("targetWeight", e.target.value)}
                  className={INPUT}
                />
              </div>
            </div>
            <div>
              <label htmlFor="p-goal" className={LABEL}>
                Fitness Goal
              </label>
              <select
                id="p-goal"
                value={form.goal}
                onChange={(e) => setField("goal", e.target.value)}
                className={`${INPUT} cursor-pointer`}
              >
                {GOALS.map((goal) => (
                  <option key={goal} value={goal}>
                    {goal}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="p-activity" className={LABEL}>
                  Activity Level
                </label>
                <select
                  id="p-activity"
                  value={form.activityLevel}
                  onChange={(e) => setField("activityLevel", e.target.value)}
                  className={`${INPUT} cursor-pointer`}
                >
                  {ACTIVITY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="p-style" className={LABEL}>
                  Preferred Style
                </label>
                <select
                  id="p-style"
                  value={form.preferredWorkoutType}
                  onChange={(e) => setField("preferredWorkoutType", e.target.value)}
                  className={`${INPUT} cursor-pointer`}
                >
                  {WORKOUT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-primary-contrast shadow-sm hover:bg-primary-bright disabled:opacity-50 transition-all cursor-pointer"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function ProfileRow({ label, value, capitalize, numeric }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-b-0 text-xs">
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted">{label}</span>
      <span
        className={`font-semibold text-text text-right max-w-[65%] truncate ${capitalize ? "capitalize" : ""} ${
          numeric ? "font-mono tabular-nums" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
