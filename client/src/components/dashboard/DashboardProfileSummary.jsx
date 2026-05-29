import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import authService from "../../services/authService.js";
import { GENDERS, GOALS, ACTIVITY_LEVELS, WORKOUT_TYPES } from "../../utils/constants.js";
import ErrorBanner from "../common/ErrorBanner.jsx";

const LABEL =
  "block text-[9px] font-mono font-semibold text-neutral-400 uppercase tracking-widest mb-1";
const INPUT =
  "block w-full px-3 py-2 text-xs bg-black border border-neutral-800 focus:border-neutral-500 rounded-sm text-white focus:outline-none";

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
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender,
        height: form.height ? Number(form.height) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        targetWeight: form.targetWeight ? Number(form.targetWeight) : undefined,
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

  return (
    <div className="bg-[#0E0E0E] p-5 rounded-sm border border-neutral-800 shadow-2xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-neutral-500" aria-hidden="true" />
          <h3 className="text-xs font-mono font-semibold text-white uppercase tracking-widest">
            Athlete Profile
          </h3>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsEditing((value) => !value);
            setError(null);
          }}
          className="text-xs text-neutral-400 hover:text-white transition-all font-serif italic cursor-pointer underline decoration-neutral-800 underline-offset-4"
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>
      </div>

      <ErrorBanner message={error} />

      {!isEditing ? (
        <div className="space-y-3 pt-1 text-xs text-neutral-300">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" value={user.name} />
            <Field label="Gender" value={user.gender || "Not set"} capitalize />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Age" value={`${user.age || "--"} yrs`} center />
            <Field label="Height" value={`${user.height || "--"} cm`} center />
            <Field label="Weight" value={`${user.weight || "--"} kg`} center />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Target Weight"
              value={user.targetWeight ? `${user.targetWeight} kg` : "Not set"}
            />
            <Field label="Preferred Style" value={user.preferredWorkoutType || "Not set"} />
          </div>
          <Field label="Primary Goal" value={user.goal || "General fitness"} block />
          <Field label="Activity Level" value={user.activityLevel || "Active"} block />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4 text-left">
          <div>
            <label htmlFor="p-name" className={LABEL}>
              Name
            </label>
            <input
              id="p-name"
              type="text"
              required
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              className={INPUT}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor="p-height" className={LABEL}>
                Height (cm)
              </label>
              <input
                id="p-height"
                type="number"
                required
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
                required
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
          <div className="grid grid-cols-2 gap-3">
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
            className="w-full py-2 bg-white text-black font-semibold text-xs rounded-sm uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50 hover:bg-neutral-200"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}
    </div>
  );
}

function Field({ label, value, center, block, capitalize }) {
  return (
    <div
      className={`bg-neutral-950/40 border border-neutral-900 p-2.5 rounded-sm ${center ? "text-center" : ""} ${block ? "col-span-full" : ""}`}
    >
      <div className="text-[8px] font-mono uppercase tracking-wider text-neutral-500">{label}</div>
      <div className={`font-bold text-white mt-1 ${capitalize ? "capitalize" : ""}`}>{value}</div>
    </div>
  );
}
