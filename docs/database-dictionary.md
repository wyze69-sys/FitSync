# FitSync Database Data Dictionary

This document details the functional specifications of the 20 tables in the **FitSync** database.

---

## 1. `users`
- **Purpose**: Stores registered user account profiles, authentication data, and fitness goals.
- **Classification**: Core Active Table
- **Important Columns**:
  - `id` (PK): Unique identifier prefixing `usr_`.
  - `email` (Unique): Account login credential.
  - `weight` / `weight_kg`: Profile weight synchronized across updates.
  - `height`: Profile height used for BMI calculations.
- **Relationships**:
  - Parent to `workouts`, `weight_logs`, `daily_checkins`, `user_achievements`, `user_gamification`, `user_streaks`, `xp_logs`, `ai_insights`, `user_feedback`, and custom template creations.
- **Frontend Page**: Profile / Settings ("You" Page), Registration/Login, and Onboarding Flow.
- **Backend Modules**: `userRepository.js`, `authService.js`, `authController.js`, `profileController.js`.

---

## 2. `workouts`
- **Purpose**: Stores individual logged workout sessions representing the header record.
- **Classification**: Core Active Table
- **Important Columns**:
  - `id` (PK): Unique session identifier (`wk_`).
  - `duration_total`: Accumulated time in minutes for the workout session.
  - `calories_total`: Overall calculated calories burned.
  - `xp`: Total XP points awarded for this session.
- **Relationships**:
  - Child to `users` (via `user_id`).
  - Parent to `workout_exercises` and `xp_logs`.
- **Frontend Page**: History / Workouts List page, Dashboard metrics summary card.
- **Backend Modules**: `workoutRepository.js`, `workoutService.js`, `workoutController.js`.

---

## 3. `workout_exercises`
- **Purpose**: Stores the specific exercises performed as part of a workout session.
- **Classification**: Core Active Table
- **Important Columns**:
  - `id` (PK): Unique exercise line identifier (`ex_`).
  - `workout_id` (FK): Links to parent session.
  - `exercise_name`: Title of the exercise.
  - `activity_slug`: Associated activity library key for MET metrics.
- **Relationships**:
  - Child to `workouts` (via `workout_id`).
  - Child to `exercise_categories` (via `category_id`).
  - Parent to `workout_sets`.
- **Frontend Page**: Workouts details modal inside History page.
- **Backend Modules**: `workoutRepository.js`, `workoutService.js`.

---

## 4. `workout_sets`
- **Purpose**: Stores reps and resistance weight logged for sets under strength-based exercises.
- **Classification**: Core Active Table
- **Important Columns**:
  - `id` (PK): Auto-incremented primary key.
  - `exercise_id` (FK): Links to parent exercise.
  - `reps`: Number of repetitions completed.
  - `weight`: Weight in kg used for this set.
- **Relationships**:
  - Child to `workout_exercises` (via `exercise_id`).
- **Frontend Page**: Workouts details sets table inside History page.
- **Backend Modules**: `workoutRepository.js`, `workoutService.js`.

---

## 5. `weight_logs`
- **Purpose**: Tracks bodyweight records entered by the user over time.
- **Classification**: Core Active Table
- **Important Columns**:
  - `id` (PK): Unique record identifier (`w_`).
  - `weight`: Numeric weight logged by the user.
  - `bmi`: Calculated Body Mass Index based on profile height.
- **Relationships**:
  - Child to `users` (via `user_id`).
- **Frontend Page**: Progress weight log table, Weight history progress chart.
- **Backend Modules**: `weightRepository.js`, `progressService.js`, `weightController.js`.

---

## 6. `daily_checkins`
- **Purpose**: Restricts users to a single manual wellness check-in per day.
- **Classification**: Admin / System Table
- **Important Columns**:
  - `id` (PK): Unique identifier (`ch_`).
  - `date`: Day of the check-in (enforced unique constraint for `user_id` + `date`).
- **Relationships**:
  - Child to `users` (via `user_id`).
- **Frontend Page**: Dashboard check-in indicator and button.
- **Backend Modules**: `gamificationRepository.js`, `gamificationService.js`, `gamificationController.js`.

---

## 7. `xp_logs`
- **Purpose**: Chronological log of individual XP rewards awarded to users.
- **Classification**: Core Active Table
- **Important Columns**:
  - `id` (PK): Unique identifier (`xp_`).
  - `xp_earned`: Score value.
  - `reason`: Cause of award (e.g. workout, daily check-in, streak bonus).
- **Relationships**:
  - Child to `users` (via `user_id`).
  - Child to `workouts` (via `workout_id` - nullable for check-in awards).
- **Frontend Page**: Dashboard XP history graphs.
- **Backend Modules**: `workoutRepository.js`, `gamificationService.js`.

---

## 8. `user_gamification`
- **Purpose**: Core gamification scoreboards and active streak statistics of each user profile.
- **Classification**: Admin / System Table
- **Important Columns**:
  - `user_id` (PK / FK): Links to users table.
  - `total_xp`: Total points accumulated.
  - `level`: Current level number of the user.
  - `current_streak`: Current consecutive active days.
- **Relationships**:
  - Child to `users` (via `user_id`).
- **Frontend Page**: Dashboard level progress bar, Streak counter badge, and You/Profile page stats.
- **Backend Modules**: `gamificationRepository.js`, `gamificationService.js`, `gamificationController.js`, `userRepository.js`.

---

## 9. `user_streaks`
- **Purpose**: Duplicate cache of streak details kept for admin statistics and backward compatibility.
- **Classification**: Compatibility Table
- **Important Columns**:
  - `user_id` (PK / FK): Links to users table.
  - `current_streak`: Synced streak value.
- **Relationships**:
  - Child to `users` (via `user_id`).
- **Frontend Page**: Admin Portal user details.
- **Backend Modules**: `gamificationRepository.js`, `gamificationService.js`, `userRepository.js`.

---

## 10. `user_achievements`
- **Purpose**: Stores instances of badges unlocked by users.
- **Classification**: Core Active Table
- **Important Columns**:
  - `id` (PK): Unique record identifier (`ua_`).
  - `achievement_code` (FK): Links to badge index.
- **Relationships**:
  - Child to `users` (via `user_id`).
  - Child to `achievements` (via `achievement_code`).
- **Frontend Page**: You/Profile badges shelf.
- **Backend Modules**: `achievementRepository.js`, `gamificationService.js`.

---

## 11. `workout_templates`
- **Purpose**: Defines pre-configured templates loaded to log workouts in fewer taps.
- **Classification**: Feature Table (Currently Empty but Valid)
- **Important Columns**:
  - `id` (PK): Template identifier (`tpl_`).
  - `exercises`: JSON array storing preset exercises, categories, and duration details.
- **Relationships**:
  - Child to `exercise_categories` (via `category_id`).
  - Child to `users` (via `created_by`).
- **Frontend Page**: Log Page workout template selector.
- **Backend Modules**: `templateRepository.js`, `templateService.js`, `templateController.js`.

---

## 12. `challenges`
- **Purpose**: Lists structured fitness challenges that reward users with XP and badges.
- **Classification**: Feature Table (Currently Empty but Valid)
- **Important Columns**:
  - `id` (PK): Challenge identifier (`chg_`).
  - `badge_code` (FK): Links to achievements catalog (badge unlocked on completion).
- **Relationships**:
  - Child to `achievements` (via `badge_code`).
  - Child to `users` (via `created_by`).
- **Frontend Page**: Dashboard challenges widget.
- **Backend Modules**: `challengeRepository.js`, `challengeService.js`, `challengeController.js`.

---

## 13. `announcements`
- **Purpose**: System-wide notifications posted by admins.
- **Classification**: Admin / System Table
- **Important Columns**:
  - `placement`: UI target (e.g. `dashboard`).
  - `audience`: Filter rules (e.g. `all`, `users`, `admins`).
- **Relationships**:
  - Child to `users` (via `created_by`).
- **Frontend Page**: Dashboard announcements banners carousel.
- **Backend Modules**: `announcementRepository.js`, `announcementService.js`, `announcementController.js`.

---

## 14. `user_feedback`
- **Purpose**: Feedback and support messages submitted by users.
- **Classification**: Admin / System Table
- **Important Columns**:
  - `type`: Category (`bug`, `feature`, `general`).
  - `status`: Lifecycle state (`new`, `resolved`).
- **Relationships**:
  - Child to `users` (via `user_id`).
- **Frontend Page**: Settings feedback support form, Admin Portal feedback dashboard.
- **Backend Modules**: `feedbackRepository.js`, `feedbackService.js`, `feedbackController.js`, `adminService.js`.

---

## 15. `ai_insights`
- **Purpose**: Stored weekly advice generated by the Gemini AI based on user logs.
- **Classification**: Admin / System Table
- **Important Columns**:
  - `summary`: Generated text recommendations.
  - `recommendations`: JSON containing structural focus items.
- **Relationships**:
  - Child to `users` (via `user_id`).
- **Frontend Page**: Dashboard Weekly AI Insight advice card.
- **Backend Modules**: `insightRepository.js`, `aiService.js`, `aiController.js`.

---

## 16. `exercise_categories`
- **Purpose**: Main fitness category reference constants mapping MET metrics.
- **Classification**: Reference / Catalog Table
- **Important Columns**:
  - `slug` (Unique): Identification key (e.g. `cardio`, `strength`).
  - `base_met`: Baseline Metabolic Equivalent Task rate.
- **Relationships**:
  - Parent to `workout_exercises`, `workout_templates`, and `activity_library`.
- **Frontend Page**: Log Page category selector grid.
- **Backend Modules**: `categoryRepository.js`, `categoryController.js`, `workoutRepository.js`.

---

## 17. `activity_library`
- **Purpose**: Reference lookup directory of 108 physical exercises.
- **Classification**: Reference / Catalog Table
- **Important Columns**:
  - `calorie_method`: Calculation strategy (e.g. `met_duration`, `strength_volume`).
  - `tracking_fields`: Required form fields (e.g. `["duration", "sets", "reps", "weight"]`).
- **Relationships**:
  - Child to `exercise_categories` (via `category_id`).
- **Frontend Page**: Log Page activity picker list, dynamics logs inputs mapping.
- **Backend Modules**: `activityRepository.js`, `activityService.js`, `workoutService.js`.

---

## 18. `nutrition_foods`
- **Purpose**: Standard catalog containing nutritional values for 2,395 foods.
- **Classification**: Reference / Catalog Table
- **Important Columns**:
  - `serving_size`, `calories`, `protein_g`, `carbs_g`, `fat_g`.
- **Relationships**:
  - Queried by nutrition service. No parent relationships.
- **Frontend Page**: Nutrition Page logs search and macro counter.
- **Backend Modules**: `nutritionRepository.js`, `nutritionService.js`, `nutritionController.js`.

---

## 19. `levels`
- **Purpose**: Level progress requirements index mapping levels 1-10.
- **Classification**: Reference / Catalog Table
- **Important Columns**:
  - `level_number`: Current level.
  - `xp_required`: XP thresholds.
- **Relationships**:
  - Queried by gamification service. No parent relationships.
- **Frontend Page**: Dashboard Level indicator card.
- **Backend Modules**: `gamificationRepository.js`, `gamificationService.js`.

---

## 20. `achievements` (Emblems / Badges catalog)
- **Purpose**: Base index defining the 7 unlockable system badges.
- **Classification**: Reference / Catalog Table
- **Important Columns**:
  - `code` (PK): Identifier key (e.g. `streak_3`, `streak_7`).
  - `requirement_value`: Goal metrics (consecutive active days).
- **Relationships**:
  - Parent to `user_achievements` and `challenges` (badge rewards).
- **Frontend Page**: Profile earned badges catalog index.
- **Backend Modules**: `achievementRepository.js`, `gamificationService.js`.
