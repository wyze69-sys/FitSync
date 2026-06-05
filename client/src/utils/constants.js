/** Shared constants used across FitSync forms, quick actions, and profile setup. */

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

export const WORKOUT_MAP = [
  {
    id: "cat_cardio",
    slug: "cardio",
    name: "Cardio",
    description: "Endurance sessions that raise your heart rate.",
    icon: "🏃",
    subtypes: [
      { name: "Running", slug: "running", categoryId: "cat_cardio" },
      { name: "Walking", slug: "walking", categoryId: "cat_cardio" },
      { name: "Cycling", slug: "cycling", categoryId: "cat_cardio" },
      { name: "Swimming", slug: "swimming", categoryId: "cat_cardio" }
    ]
  },
  {
    id: "cat_strength",
    slug: "strength",
    name: "Strength",
    description: "Lifts, machines, and bodyweight strength work.",
    icon: "💪",
    subtypes: [
      { name: "Chest", slug: "chest", categoryId: "cat_strength" },
      { name: "Back", slug: "back", categoryId: "cat_strength" },
      { name: "Shoulders", slug: "shoulders", categoryId: "cat_strength" },
      { name: "Arms", slug: "arms", categoryId: "cat_strength" },
      { name: "Legs", slug: "legs", categoryId: "cat_strength" },
      { name: "Core", slug: "core", categoryId: "cat_strength" }
    ]
  },
  {
    id: "cat_hiit",
    slug: "hiit",
    name: "HIIT",
    description: "Fast intervals, circuits, and high-output blocks.",
    icon: "⚡",
    subtypes: [
      { name: "Burpees", slug: "burpees", categoryId: "cat_hiit" },
      { name: "Circuits", slug: "circuits", categoryId: "cat_hiit" },
      { name: "Tabata", slug: "tabata", categoryId: "cat_hiit" }
    ]
  },
  {
    id: "cat_yoga",
    slug: "yoga",
    name: "Yoga",
    description: "Breath-led practice, flow, and mindful mobility.",
    icon: "🧘",
    subtypes: [
      { name: "Hatha", slug: "yoga-hatha", categoryId: "cat_yoga" },
      { name: "Vinyasa", slug: "yoga-vinyasa", categoryId: "cat_yoga" },
      { name: "Power Yoga", slug: "power-yoga", categoryId: "cat_yoga" }
    ]
  },
  {
    id: "cat_mobility",
    slug: "mobility",
    name: "Mobility",
    description: "Recovery, stretching, and joint prep.",
    icon: "🌿",
    subtypes: [
      { name: "Stretching", slug: "stretching", categoryId: "cat_mobility" },
      { name: "Recovery", slug: "recovery", categoryId: "cat_mobility" }
    ]
  },
  {
    id: "cat_sports",
    slug: "sports",
    name: "Sports",
    description: "Games and skills-based training.",
    icon: "🏀",
    subtypes: [
      { name: "Basketball", slug: "basketball", categoryId: "cat_sports" },
      { name: "Football", slug: "football", categoryId: "cat_sports" },
      { name: "Badminton", slug: "badminton", categoryId: "cat_sports" },
      { name: "Boxing", slug: "boxing", categoryId: "cat_sports" }
    ]
  }
];

export const QUICK_PRESETS = WORKOUT_MAP.map((category) => ({
  key: category.slug,
  label: category.name,
  tag: category.subtypes[0]?.name || category.name,
  duration: 30,
  exercise: category.subtypes[0]?.name || category.name,
  categoryId: category.id,
  categoryName: category.name
}));

export const WORKOUT_TEMPLATES = [
  {
    title: "Chest & Shoulders Push",
    desc: "Pre-fills bench press and overhead presses with sets.",
    exercises: [
      {
        categoryId: "cat_strength",
        categoryName: "Strength",
        exerciseName: "Flat Bench Press",
        duration: 30,
        sets: [
          { reps: 10, weight: 40 },
          { reps: 10, weight: 50 },
          { reps: 8, weight: 60 }
        ]
      },
      {
        categoryId: "cat_strength",
        categoryName: "Strength",
        exerciseName: "Overhead Shoulder Press",
        duration: 15,
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
        categoryId: "cat_strength",
        categoryName: "Strength",
        exerciseName: "Seated Lat Pulldowns",
        duration: 25,
        sets: [
          { reps: 12, weight: 35 },
          { reps: 10, weight: 40 },
          { reps: 10, weight: 45 }
        ]
      },
      {
        categoryId: "cat_strength",
        categoryName: "Strength",
        exerciseName: "Standing Dumbbell Curls",
        duration: 15,
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
        categoryId: "cat_strength",
        categoryName: "Strength",
        exerciseName: "Barbell Back Squats",
        duration: 35,
        sets: [
          { reps: 10, weight: 40 },
          { reps: 10, weight: 50 },
          { reps: 8, weight: 70 }
        ]
      },
      {
        categoryId: "cat_hiit",
        categoryName: "HIIT",
        exerciseName: "Bodyweight Jump Squats",
        duration: 15,
        sets: [
          { reps: 15, weight: 0 },
          { reps: 15, weight: 0 }
        ]
      }
    ]
  }
];
