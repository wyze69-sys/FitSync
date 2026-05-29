import { useState } from "react";
import authService from "../../services/authService.js";
import { GENDERS, GOALS, ACTIVITY_LEVELS, WORKOUT_TYPES } from "../../utils/constants.js";
import ErrorBanner from "../common/ErrorBanner.jsx";

const LABEL =
  "block text-[10px] uppercase tracking-wider text-neutral-400 font-mono mb-1.5 font-bold";
const INPUT =
  "block w-full px-3 py-2.5 bg-black border border-neutral-800 focus:border-neutral-500 rounded-sm text-sm text-white focus:outline-none";

/**
 * Four-step onboarding shown when a profile is missing height/weight.
 * All values (including target weight and preferred style) are persisted to the
 * backend so nothing is lost.
 */
export default function OnboardingModal({ user, onComplete }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: user.name || "",
    age: user.age?.toString() || "",
    gender: user.gender || "male",
    height: user.height?.toString() || "",
    weight: user.weight?.toString() || "",
    targetWeight: "",
    goal: user.goal || GOALS[0],
    activityLevel: user.activityLevel || "Moderately active",
    preferredWorkoutType: "Strength"
  });

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
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
      onComplete(updated);
    } catch (err) {
      setError(err.message || "Onboarding could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  const firstName = (form.name || "there").split(" ")[0];

  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="bg-[#0E0E0E] max-w-lg w-full rounded-sm border border-neutral-800 p-6 md:p-8 space-y-6 shadow-2xl relative my-8">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-emerald-300" />

        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-emerald-400 font-bold uppercase tracking-widest">
            Welcome to FitSync
          </span>
          <span className="text-neutral-500 font-semibold">Step {step} of 4</span>
        </div>

        <ErrorBanner message={error} />

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h2
                  id="onboarding-title"
                  className="text-xl font-serif italic text-white font-bold"
                >
                  What should we call you?
                </h2>
                <p className="text-xs text-neutral-400">
                  Let&apos;s set up your profile with a few basics.
                </p>
              </div>
              <div>
                <label htmlFor="ob-name" className={LABEL}>
                  Name
                </label>
                <input
                  id="ob-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  className={INPUT}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ob-gender" className={LABEL}>
                    Gender
                  </label>
                  <select
                    id="ob-gender"
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
                  <label htmlFor="ob-age" className={LABEL}>
                    Age (years)
                  </label>
                  <input
                    id="ob-age"
                    type="number"
                    required
                    min="1"
                    value={form.age}
                    onChange={(e) => setField("age", e.target.value)}
                    className={INPUT}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-neutral-900">
                <button
                  type="button"
                  disabled={!form.name.trim() || !form.age}
                  onClick={() => setStep(2)}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-widest rounded-sm cursor-pointer disabled:opacity-40"
                >
                  Next: Body metrics
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl font-serif italic text-white font-bold">
                  Your body metrics
                </h2>
                <p className="text-xs text-neutral-400">
                  Used to calculate your BMI and track progress.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ob-height" className={LABEL}>
                    Height (cm)
                  </label>
                  <input
                    id="ob-height"
                    type="number"
                    required
                    value={form.height}
                    onChange={(e) => setField("height", e.target.value)}
                    className={INPUT}
                  />
                </div>
                <div>
                  <label htmlFor="ob-weight" className={LABEL}>
                    Current Weight (kg)
                  </label>
                  <input
                    id="ob-weight"
                    type="number"
                    required
                    step="0.1"
                    value={form.weight}
                    onChange={(e) => setField("weight", e.target.value)}
                    className={INPUT}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="ob-target" className={LABEL}>
                  Target Weight (kg, optional)
                </label>
                <input
                  id="ob-target"
                  type="number"
                  step="0.1"
                  value={form.targetWeight}
                  onChange={(e) => setField("targetWeight", e.target.value)}
                  className={INPUT}
                  placeholder="e.g. 64.0"
                />
              </div>
              <div className="flex justify-between pt-4 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!form.height || !form.weight}
                  onClick={() => setStep(3)}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-widest rounded-sm cursor-pointer disabled:opacity-40"
                >
                  Next: Goals
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl font-serif italic text-white font-bold">
                  Your fitness objectives
                </h2>
                <p className="text-xs text-neutral-400">These help guide your weekly AI insight.</p>
              </div>
              <div>
                <label htmlFor="ob-goal" className={LABEL}>
                  Primary Goal
                </label>
                <select
                  id="ob-goal"
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
              <div>
                <label htmlFor="ob-activity" className={LABEL}>
                  Activity Level
                </label>
                <select
                  id="ob-activity"
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
              <div className="flex justify-between pt-4 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-widest rounded-sm cursor-pointer"
                >
                  Next: Style
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl font-serif italic text-white font-bold">
                  One last thing, {firstName}
                </h2>
                <p className="text-xs text-neutral-400">Which style of training do you prefer?</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {WORKOUT_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setField("preferredWorkoutType", type)}
                    className={`p-3 text-xs font-bold rounded-sm border uppercase tracking-wider transition-all text-center ${
                      form.preferredWorkoutType === type
                        ? "border-emerald-400 bg-emerald-950/10 text-emerald-400 shadow-lg"
                        : "border-neutral-800 bg-black hover:bg-neutral-900 text-neutral-400"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="p-4 rounded-sm bg-neutral-900/45 border border-neutral-800 text-[11px] text-neutral-400 leading-relaxed mt-3">
                <strong>Almost ready.</strong> Click Complete to save your profile and open the
                dashboard.
              </div>
              <div className="flex justify-between pt-4 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 text-neutral-400 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-sm cursor-pointer hover:bg-neutral-200 transition-all disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Complete & Launch"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
