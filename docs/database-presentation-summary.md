# FitSync Database Presentation Summary

This summary explains how the **FitSync** database is structured and how data flows through the system. It is written in simple, student-friendly language to help you present your database design to evaluators.

---

## 1. What FitSync Stores
FitSync's database stores everything needed for a modern, game-like fitness application:
- **Your Profile**: Who you are, your goals, credentials, height, and weight.
- **Your Activities**: Detailed logs of your workouts, individual exercises, sets, reps, and resistance.
- **Your Progress**: Bodyweight logging history.
- **Gamification stats**: Your consecutive active streaks, your current level, total XP points earned, and unlocked achievements (badges).
- **Food catalog**: A search directory containing calorie and macronutrient info for foods.
- **System details**: Weekly AI health summaries, support feedback tickets, and admin announcements.

---

## 2. How Data Flows

### A. Workout Logging ➡️ Calories & XP
When you log a workout:
1. **Inputs Checked**: You select a category (e.g. Strength) and an activity (e.g. Barbell Curl) on the **Log** page. You enter metrics like duration, sets, reps, and weight.
2. **Calculations Processed**: The backend reads the activity's Metabolic Equivalent (MET) from reference tables, combines it with your profile weight, and computes the estimated calories burned and XP earned.
3. **Persisted Output**: 
   - The session details, calculated calories, and XP are saved in the `workouts`, `workout_exercises`, and `workout_sets` tables.
   - An entry is logged in the `xp_logs` table.
   - Your total XP, level, and streaks are updated in `user_gamification`.
   - *Data Honesty Check*: Raw inputs like `distance_km` and `holdTime` are used purely for calculations and are **not** persisted in the History tables. The final calculated Calories and XP are the values that are stored.

### B. Progress and Weight Tracking
When you log your weight:
1. An entry is saved in `weight_logs`, automatically calculating your BMI using your profile height.
2. The user's current weight in the `users` table is updated.
3. *Data Honesty Check*: To ensure compatibility with other services, updates to your weight synchronize both `users.weight` and `users.weight_kg` columns.

### C. Nutrition Catalog
1. When you search for foods on the **Nutrition** page, the database queries `nutrition_foods`.
2. *Data Honesty Check*: `nutrition_foods` and `activity_library` are static reference datasets seeded on startup. They do not store user-generated entries.

### D. Streaks and Gamification
1. When you log a check-in or a workout, the gamification service evaluates whether you checked in yesterday to extend your streak.
2. Your streak values are saved in `user_gamification`.
3. If you reach milestone thresholds (e.g. 3 active days), a badge is unlocked and logged in `user_achievements`.
4. *Data Honesty Check*: `user_streaks` is a legacy/compatibility table kept to support older admin dashboard queries. It is synchronized on activity log check-ins and should not be deleted.

---

## 3. Empty but Valid Tables
During live demos, some tables might have **0 rows** (such as `workout_templates` and `challenges`):
- **`workout_templates`**: Pre-created workout lists. It is fully functional and ready to load templates, but is empty until templates are defined by an admin.
- **`challenges`**: Holds structured user challenges. It has full controller, service, and layout support, but remains empty until challenges are initialized.

---

## 4. Key Compatibility & Legacy Items to Mention
If asked about redundant fields or tables, explain that they are kept for **data safety and backward compatibility**:
1. **`users.weight_kg`**: Synchronized automatically with `users.weight` so that older calculation code and newer settings pages both fetch correct weight data.
2. **`workouts.calories_burned` & `workouts.calories`**: Fallback columns that mirror `calories_total` to ensure legacy dashboard queries do not break.
3. **`users.total_xp`**: Synced with `user_gamification.total_xp` to support profile endpoints that read stats directly from the users table.
4. **`user_streaks` table**: Maintained alongside `user_gamification` to support existing administrative metrics.
