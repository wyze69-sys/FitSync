import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Scale, Calendar, Trash2, Plus, Compass, Target } from "lucide-react";
import progressService from "../services/progressService.js";
import WeightProgressChart from "../components/charts/WeightProgressChart.jsx";
import ConfirmDialog from "../components/modals/ConfirmDialog.jsx";
import ErrorBanner from "../components/common/ErrorBanner.jsx";
import { calculateBMI, resolveBmiCategory } from "../utils/metrics.js";
import { todayStr } from "../utils/workoutUtils.js";

const INPUT =
  "block w-full px-3 py-2 bg-[#050505] border border-white/10 rounded-sm text-xs text-white focus:bg-black focus:border-white focus:outline-none transition-all";

export default function Progress() {
  const { user, weightLogs, refreshAll, push } = useOutletContext();

  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(todayStr());
  const [notes, setNotes] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const currentBmi = calculateBMI(user.weight, user.height);
  const bmiMeta = resolveBmiCategory(currentBmi);
  const hasBmi = Boolean(user.height && user.weight);

  async function handleLog(event) {
    event.preventDefault();
    setError(null);
    if (!weight || Number(weight) <= 0) {
      setError("Please enter a positive weight.");
      return;
    }
    setSubmitting(true);
    try {
      await progressService.createWeightLog({ date, weight: Number(weight), notes: notes.trim() });
      push(`Logged ${weight} kg.`, "success");
      setWeight("");
      setNotes("");
      setIsLogging(false);
      refreshAll();
    } catch (err) {
      setError(err.message || "Failed to save weight log.");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    const id = pendingDelete;
    setPendingDelete(null);
    try {
      await progressService.deleteWeightLog(id);
      push("Weight log deleted.", "info");
      refreshAll();
    } catch (err) {
      push(err.message || "Failed to delete weight log.", "info");
    }
  }

  return (
    <div className="space-y-6 text-left text-[#E0E0E0]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-serif italic text-white font-bold">Progress &amp; Weight</h1>
          <p className="text-xs text-white/40">
            Record body weight and BMI, and track progress toward your target.
          </p>
        </div>
        {!isLogging && (
          <button
            type="button"
            onClick={() => {
              setIsLogging(true);
              setDate(todayStr());
              setError(null);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-black rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-all cursor-pointer shadow-xl"
          >
            <Plus className="h-4 w-4" /> Add weight entry
          </button>
        )}
      </div>

      <div className="bg-[#0E0E0E] p-6 rounded-sm border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-serif italic font-bold text-white">Weight Trend</h2>
          {user.targetWeight && (
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" /> Target {user.targetWeight} kg
            </span>
          )}
        </div>
        <WeightProgressChart
          weightLogs={weightLogs}
          targetWeight={user.targetWeight}
          maxPoints={12}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {isLogging && (
            <form
              onSubmit={handleLog}
              className="bg-[#0E0E0E] p-6 rounded-sm border border-white/10 shadow-lg space-y-5"
            >
              <div className="border-b border-white/10 pb-3 flex justify-between items-center">
                <h3 className="text-xs font-mono font-semibold text-white uppercase tracking-widest flex items-center gap-2">
                  <Scale className="h-4.5 w-4.5 text-emerald-400" /> Record body weight
                </h3>
                <button
                  type="button"
                  onClick={() => setIsLogging(false)}
                  className="text-xs text-white/40 hover:text-white underline decoration-white/20 underline-offset-4 font-serif italic cursor-pointer transition-all"
                >
                  Discard
                </button>
              </div>

              <ErrorBanner message={error} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="weight-date"
                    className="block text-[10px] font-mono font-semibold text-white/40 uppercase tracking-widest mb-1.5"
                  >
                    Log date
                  </label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-2.5 h-4 w-4 text-white/30"
                      aria-hidden="true"
                    />
                    <input
                      id="weight-date"
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={`${INPUT} pl-9`}
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="weight-value"
                    className="block text-[10px] font-mono font-semibold text-white/40 uppercase tracking-widest mb-1.5"
                  >
                    Weight (kg)
                  </label>
                  <input
                    id="weight-value"
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 68.3"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className={INPUT}
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="weight-notes"
                  className="block text-[10px] font-mono font-semibold text-white/40 uppercase tracking-widest mb-1.5"
                >
                  Notes (optional)
                </label>
                <input
                  id="weight-notes"
                  type="text"
                  placeholder="e.g. Measured fasted in the morning."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={INPUT}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 bg-white hover:bg-white/90 text-black font-semibold text-xs tracking-widest uppercase rounded-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save weight entry"}
              </button>
            </form>
          )}

          <div className="bg-[#0E0E0E] rounded-sm border border-white/10 shadow-md overflow-hidden">
            <div className="p-5 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">Weight history</h3>
              <p className="text-xs text-white/40 mt-0.5">Entries ordered by most recent date.</p>
            </div>
            {weightLogs.length === 0 ? (
              <div className="py-16 text-center text-white/30 text-xs">
                No weight entries logged yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#E0E0E0]">
                  <thead className="bg-white/[0.02] border-b border-white/10 font-mono text-[9px] uppercase tracking-widest font-semibold text-white/40">
                    <tr>
                      <th className="py-3 px-5">Date</th>
                      <th className="py-2.5 px-3">Weight</th>
                      <th className="py-2.5 px-3">BMI</th>
                      <th className="py-2.5 px-3 hidden md:table-cell">Notes</th>
                      <th className="py-2.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    {weightLogs.map((log) => {
                      const meta = resolveBmiCategory(log.bmi);
                      return (
                        <tr key={log.id} className="hover:bg-white/[0.01] transition-all">
                          <td className="py-3.5 px-5 font-mono text-white font-semibold">
                            {log.date}
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-sm font-extrabold text-white">{log.weight}</span>
                            <span className="text-white/30 text-[10px] ml-0.5">kg</span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white">{log.bmi}</span>
                              <span
                                className={`px-2 py-0.5 rounded-sm text-[9px] font-semibold ${meta.badgeClass}`}
                              >
                                {meta.label}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-white/50 hidden md:table-cell max-w-xs truncate">
                            {log.notes || "--"}
                          </td>
                          <td className="py-3 px-5 text-right">
                            <button
                              type="button"
                              onClick={() => setPendingDelete(log.id)}
                              aria-label={`Delete weight entry from ${log.date}`}
                              className="text-white/40 hover:text-red-400 p-1.5 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0E0E0E] p-5 rounded-sm border border-white/10 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <Compass className="h-5 w-5 text-white/40" aria-hidden="true" />
              <h3 className="text-sm font-serif italic text-white font-bold">BMI Overview</h3>
            </div>
            {hasBmi ? (
              <div className="space-y-4 text-xs">
                <div className="text-center p-5 rounded-sm bg-white/[0.015] border border-white/5 space-y-1">
                  <div className="text-2xl font-black font-mono text-white">{currentBmi}</div>
                  <div className={`font-bold ${bmiMeta.colorClass}`}>{bmiMeta.label}</div>
                  <p className="text-[11px] text-white/40">{bmiMeta.description}</p>
                </div>
                <div className="space-y-2 text-[11px]">
                  <Range label="Underweight" range="< 18.5" />
                  <Range label="Healthy weight" range="18.5 - 24.9" highlight />
                  <Range label="Overweight" range="25.0 - 29.9" />
                  <Range label="Obese" range="≥ 30.0" />
                </div>
                <div className="p-3 bg-white/[0.01] rounded-sm text-[10px] text-white/40 leading-relaxed border border-white/5">
                  <strong>Formula:</strong> BMI = weight (kg) ÷ height (m)². Display only; not
                  medical advice.
                </div>
              </div>
            ) : (
              <p className="p-2 text-center text-white/30 text-xs leading-relaxed">
                Add your height and weight in your profile to calculate BMI.
              </p>
            )}
          </div>

          <div className="p-5 rounded-sm border border-white/10 bg-[#0E0E0E] space-y-3 shadow-md">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest">Tracking tip</h4>
            <p className="text-xs leading-relaxed text-white/40">
              Weight shifts with hydration, meals, and training. Measure at a consistent time each
              week for the clearest trend.
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this weight entry?"
        message="This permanently removes the entry from your history."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function Range({ label, range, highlight }) {
  return (
    <div className="flex justify-between items-center text-white/50 border-b border-white/5 pb-1.5 last:border-b-0">
      <span className={highlight ? "text-emerald-400 font-semibold flex items-center gap-1" : ""}>
        {highlight && <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />}
        {label}
      </span>
      <span
        className={`font-mono ${highlight ? "text-emerald-400/80 font-semibold" : "text-white/40"}`}
      >
        {range}
      </span>
    </div>
  );
}
