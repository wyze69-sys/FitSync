import { WORKOUT_TEMPLATES } from "../../utils/constants.js";

/**
 * Starter workout templates that pre-fill the workout form on the Workouts page.
 */
export default function DashboardWorkoutTemplates({ onSelectTemplate }) {
  return (
    <div className="space-y-3.5">
      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-400">
        Starter Workout Templates
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {WORKOUT_TEMPLATES.map((template) => (
          <div
            key={template.title}
            className="bg-[#0E0E0E] p-4 rounded-sm border border-neutral-800 flex flex-col justify-between gap-3.5 hover:border-neutral-700 transition-all"
          >
            <div>
              <h4 className="text-xs font-extrabold text-white tracking-wider uppercase">
                {template.title}
              </h4>
              <p className="text-[11px] text-neutral-400 leading-normal mt-1">{template.desc}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {template.exercises.map((exercise) => (
                  <span
                    key={exercise.exerciseName}
                    className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[9px] text-neutral-400"
                  >
                    {exercise.exerciseName}
                  </span>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectTemplate(template)}
              className="w-full py-1.5 bg-neutral-900 hover:bg-white hover:text-black border border-neutral-800 transition-all text-[10px] font-bold uppercase tracking-widest rounded-sm text-center cursor-pointer text-white"
            >
              Use Template
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
