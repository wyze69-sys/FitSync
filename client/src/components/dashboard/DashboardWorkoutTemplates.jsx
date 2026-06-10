import { WORKOUT_TEMPLATES } from "../../utils/constants.js";

/**
 * Starter workout templates that pre-fill the workout form on the Workouts page.
 */
export default function DashboardWorkoutTemplates({ templates, onSelectTemplate }) {
  const displayTemplates = templates || WORKOUT_TEMPLATES;

  if (displayTemplates.length === 0) return null;

  return (
    <div className="space-y-3.5">
      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-muted">
        Starter Workout Templates
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {displayTemplates.map((template) => (
          <div
            key={template.id || template.title}
            className="bg-surface p-3 rounded-2xl border border-border flex flex-col justify-between gap-3 hover:border-primary transition-all"
          >
            <div>
              <h4 className="text-xs font-semibold text-text tracking-wider uppercase">
                {template.title}
              </h4>
              <p className="text-[11px] text-muted leading-normal mt-1">
                {template.description || template.desc}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(template.exercises || []).map((exercise, idx) => (
                  <span
                    key={exercise.exerciseName || idx}
                    className="px-2 py-0.5 rounded-2xl bg-bg border border-border text-[9px] text-muted"
                  >
                    {exercise.exerciseName}
                  </span>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectTemplate(template)}
              className="w-full py-1.5 bg-transparent border border-border hover:border-primary transition-all text-[10px] font-medium uppercase tracking-widest rounded-2xl text-center cursor-pointer text-text"
            >
              Use Template
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

