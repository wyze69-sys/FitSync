# FitSync Database Entity-Relationship Diagram (ERD)

This document presents the visual structure of the **FitSync** database. It includes all 20 active tables, categorized into logical groups.

## Mermaid ERD Diagram

```mermaid
erDiagram
    %% User / Auth
    USERS {
        varchar id PK
        varchar email UNIQUE
        varchar name
        enum role
        varchar password_hash
        int age
        varchar gender
        decimal height
        decimal weight
        decimal weight_kg
        int total_xp
        decimal target_weight
        varchar preferred_workout_type
        varchar goal
        varchar activity_level
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    %% Workout Logging
    WORKOUTS {
        varchar id PK
        varchar user_id FK
        date date
        varchar title
        int duration_total
        int calories_total
        int calories_burned
        int calories
        int xp
        enum intensity
        enum calories_source
        decimal user_weight_at_log
        text notes
        timestamp created_at
        timestamp updated_at
    }

    WORKOUT_EXERCISES {
        varchar id PK
        varchar workout_id FK
        varchar category_id FK
        varchar category_name
        varchar exercise_name
        int duration
        int calories_burned
        varchar activity_id
        varchar activity_slug
    }

    WORKOUT_SETS {
        int id PK
        varchar exercise_id FK
        int reps
        decimal weight
    }

    WORKOUT_TEMPLATES {
        varchar id PK
        varchar title
        text description
        varchar category_id FK
        varchar category_name
        varchar subtype
        int duration_min
        json exercises
        boolean is_active
        int sort_order
        varchar created_by FK
        timestamp created_at
        timestamp updated_at
    }

    %% Progress / Weight
    WEIGHT_LOGS {
        varchar id PK
        varchar user_id FK
        date date
        decimal weight
        decimal bmi
        text notes
        timestamp created_at
    }

    %% Gamification
    DAILY_CHECKINS {
        varchar id PK
        varchar user_id FK
        date date
        varchar type
        timestamp created_at
    }

    ACHIEVEMENTS {
        varchar code PK
        varchar name
        varchar description
        varchar requirement_type
        int requirement_value
        int sort_order
        varchar icon
        boolean is_active
        timestamp updated_at
    }

    USER_ACHIEVEMENTS {
        varchar id PK
        varchar user_id FK
        varchar achievement_code FK
        timestamp unlocked_at
    }

    USER_GAMIFICATION {
        varchar user_id PK "FK"
        int total_xp
        int level
        int next_level_xp
        int current_streak
        int longest_streak
        date last_active_date
        int weekly_freezes_used
        varchar last_freeze_week
        timestamp updated_at
    }

    XP_LOGS {
        varchar id PK
        varchar user_id FK
        varchar workout_id FK
        int xp_earned
        varchar reason
        json breakdown
        timestamp created_at
    }

    USER_STREAKS {
        varchar user_id PK "FK"
        int current_streak
        int longest_streak
        date last_active_date
        timestamp updated_at
    }

    CHALLENGES {
        varchar id PK
        varchar title
        text description
        varchar challenge_type
        int target_value
        date start_date
        date end_date
        int reward_xp
        varchar badge_code FK
        boolean is_active
        varchar created_by FK
        timestamp created_at
        timestamp updated_at
    }

    %% Admin / System
    ANNOUNCEMENTS {
        varchar id PK
        varchar title
        text body
        enum audience
        varchar placement
        datetime start_at
        datetime end_at
        boolean is_active
        varchar created_by FK
        timestamp created_at
        timestamp updated_at
    }

    USER_FEEDBACK {
        varchar id PK
        varchar user_id FK
        enum type
        varchar subject
        text message
        enum status
        text admin_note
        timestamp created_at
        timestamp updated_at
    }

    AI_INSIGHTS {
        varchar id PK
        varchar user_id FK
        date date_generated
        date start_date
        date end_date
        int workout_count
        int total_calories
        int total_minutes
        decimal bmi_value
        decimal current_weight
        text summary
        json recommendations
        text goal_progress
        timestamp created_at
    }

    %% Reference Catalogs
    EXERCISE_CATEGORIES {
        varchar id PK
        varchar name UNIQUE
        text description
        varchar slug UNIQUE
        decimal base_met
        decimal xp_per_met_min
        boolean is_custom
        timestamp created_at
        timestamp updated_at
    }

    ACTIVITY_LIBRARY {
        varchar id PK
        varchar slug UNIQUE
        varchar name
        varchar category_slug
        varchar category_id FK
        text description
        decimal base_met
        int intensity_level
        varchar calorie_method
        varchar pace_profile
        boolean supports_distance
        boolean supports_duration
        boolean supports_sets_reps_weight
        boolean supports_bodyweight
        boolean supports_reps_only
        boolean supports_hold_time
        decimal distance_multiplier
        decimal bodyweight_factor
        decimal volume_modifier_min
        decimal volume_modifier_max
        int default_duration_min
        varchar equipment
        varchar primary_muscles
        varchar secondary_muscles
        varchar tracking_fields
        varchar calculation_notes
        int sort_order
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    NUTRITION_FOODS {
        varchar id PK
        varchar name
        varchar serving_size
        int calories
        decimal protein_g
        decimal carbs_g
        decimal fat_g
        decimal fiber_g
        decimal sugar_g
        decimal sodium_mg
        varchar food_type
        varchar diet_tags
        varchar source_dataset
        varchar source_file
        varchar source_group
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    LEVELS {
        varchar id PK
        int level_number UNIQUE
        int xp_required
        varchar badge_unlock
        varchar title
    }

    %% Relationships
    USERS ||--o{ WORKOUTS : "logs workouts"
    USERS ||--o{ WEIGHT_LOGS : "logs weight"
    USERS ||--o{ DAILY_CHECKINS : "performs check-ins"
    USERS ||--o{ USER_ACHIEVEMENTS : "unlocks badges"
    USERS ||--|| USER_GAMIFICATION : "has profile gamification state"
    USERS ||--|| USER_STREAKS : "has profile streak metrics"
    USERS ||--o{ XP_LOGS : "receives XP"
    USERS ||--o{ USER_FEEDBACK : "submits feedback tickets"
    USERS ||--o{ AI_INSIGHTS : "receives AI wellness recommendations"
    USERS ||--o{ WORKOUT_TEMPLATES : "creates template"
    USERS ||--o{ CHALLENGES : "creates challenge"
    USERS ||--o{ ANNOUNCEMENTS : "creates announcement"

    WORKOUTS ||--o{ WORKOUT_EXERCISES : "consists of"
    WORKOUTS ||--o{ XP_LOGS : "awards XP logs"
    WORKOUT_EXERCISES ||--o{ WORKOUT_SETS : "consists of sets"

    EXERCISE_CATEGORIES ||--o{ WORKOUT_EXERCISES : "groups exercise categories"
    EXERCISE_CATEGORIES ||--o{ WORKOUT_TEMPLATES : "defines templates category"
    EXERCISE_CATEGORIES ||--o{ ACTIVITY_LIBRARY : "groups activity details"

    ACHIEVEMENTS ||--o{ USER_ACHIEVEMENTS : "holds achievement criteria"
    ACHIEVEMENTS ||--o{ CHALLENGES : "awards badge reward"
```

## Description of Logical Groups

### 1. User / Auth
- Contains `users` as the master registry of account contexts. Controls credentials, roles, and profile settings (height, weight, goals).

### 2. Workout Logging
- Core operational records of logged exercises. Maps `workouts` to nested `workout_exercises` and detailed `workout_sets` (for sets, reps, and resistance tracking). Supports preset `workout_templates`.

### 3. Progress / Weight
- Maps the user's bodyweight checkpoints in `weight_logs` over time, including calculated BMI values.

### 4. Gamification
- Manages user rewards, level progressions, and streaks. Centered around `user_gamification`, `user_streaks`, `daily_checkins`, and badge achievements (`achievements` + `user_achievements`). `xp_logs` tracks point calculations.

### 5. Nutrition
- Anchored by `nutrition_foods` containing the library of food item metrics (macros, fiber, sodium) queried on the nutrition page.

### 6. Admin / System
- Supports platform features such as user support (`user_feedback`), system messaging (`announcements`), and automated AI insights generation (`ai_insights`).

### 7. Reference Catalogs
- Read-only data modules loaded on startup, including `exercise_categories`, `activity_library`, `levels` configuration, and the `nutrition_foods` index.
