/**
 * Shared, human-authored constants used across forms and quick actions.
 * Category IDs match the seeded exercise_categories:
 *   cat_1 Cardio Training, cat_2 Strength & Core, cat_3 Flexibility & Yoga,
 *   cat_4 HIIT & Circuit, cat_5 Hybrid Wellness.
 */

export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" }
];

export const GOALS = [
  "Lose weight & Tone muscle",
  "Gain muscle mass",
  "Improve cardiovascular endurance",
  "Maintain overall health & fitness"
];

export const ACTIVITY_LEVELS = ["Sedentary", "Lightly active", "Moderately active", "Very active"];

export const WORKOUT_TYPES = ["Strength", "Cardio", "HIIT", "Flexibility"];

// One-tap quick-log presets shown on the dashboard and FAB drawer.
export const QUICK_PRESETS = [
  {
    key: "run",
    label: "Outdoor Run",
    tag: "Cardio",
    duration: 30,
    calories: 300,
    exercise: "Outdoor Pace Running",
    categoryId: "cat_1",
    categoryName: "Cardio Training"
  },
  {
    key: "walk",
    label: "Power Walk",
    tag: "Recovery",
    duration: 20,
    calories: 110,
    exercise: "Active Power Walking",
    categoryId: "cat_1",
    categoryName: "Cardio Training"
  },
  {
    key: "gym",
    label: "Heavy Gym Lifts",
    tag: "Strength",
    duration: 45,
    calories: 260,
    exercise: "Dumbbell Strength Set",
    categoryId: "cat_2",
    categoryName: "Strength & Core"
  },
  {
    key: "hiit",
    label: "HIIT Circuit",
    tag: "HIIT",
    duration: 25,
    calories: 240,
    exercise: "High Intensity Circuit",
    categoryId: "cat_4",
    categoryName: "HIIT & Circuit"
  },
  {
    key: "yoga",
    label: "Yoga Stretch",
    tag: "Mobility",
    duration: 15,
    calories: 60,
    exercise: "Vinyasa Flow Stretching",
    categoryId: "cat_3",
    categoryName: "Flexibility & Yoga"
  }
];

// Starter workout templates that pre-fill the workout form.
export const WORKOUT_TEMPLATES = [
  {
    title: "Chest & Shoulders Push",
    desc: "Pre-fills bench press and overhead presses with sets.",
    exercises: [
      {
        categoryId: "cat_2",
        categoryName: "Strength & Core",
        exerciseName: "Flat Bench Press",
        duration: 30,
        caloriesBurned: 180,
        sets: [
          { reps: 10, weight: 40 },
          { reps: 10, weight: 50 },
          { reps: 8, weight: 60 }
        ]
      },
      {
        categoryId: "cat_2",
        categoryName: "Strength & Core",
        exerciseName: "Overhead Shoulder Press",
        duration: 15,
        caloriesBurned: 100,
        sets: [
          { reps: 12, weight: 12 },
          { reps: 10, weight: 14 }
        ]
      }
    ]
  },
  {
    title: "Back & Biceps Pull",
    desc: "Pre-fills lat pulldowns and bicep curls.",
    exercises: [
      {
        categoryId: "cat_2",
        categoryName: "Strength & Core",
        exerciseName: "Seated Lat Pulldowns",
        duration: 25,
        caloriesBurned: 140,
        sets: [
          { reps: 12, weight: 35 },
          { reps: 10, weight: 40 },
          { reps: 10, weight: 45 }
        ]
      },
      {
        categoryId: "cat_2",
        categoryName: "Strength & Core",
        exerciseName: "Standing Dumbbell Curls",
        duration: 15,
        caloriesBurned: 80,
        sets: [
          { reps: 12, weight: 10 },
          { reps: 12, weight: 10 }
        ]
      }
    ]
  },
  {
    title: "Lower Body Squat Day",
    desc: "Pre-fills barbell squats and bodyweight jump squats.",
    exercises: [
      {
        categoryId: "cat_2",
        categoryName: "Strength & Core",
        exerciseName: "Barbell Back Squats",
        duration: 35,
        caloriesBurned: 240,
        sets: [
          { reps: 10, weight: 40 },
          { reps: 10, weight: 50 },
          { reps: 8, weight: 70 }
        ]
      },
      {
        categoryId: "cat_4",
        categoryName: "HIIT & Circuit",
        exerciseName: "Bodyweight Jump Squats",
        duration: 15,
        caloriesBurned: 110,
        sets: [
          { reps: 15, weight: 0 },
          { reps: 15, weight: 0 }
        ]
      }
    ]
  }
];
