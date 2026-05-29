# FitSync Database Migrations

Forward, ordered migrations that take a database from the original FitSync
schema to the current one. They are numbered and meant to be applied in order.

| File | Purpose |
|------|---------|
| `0001_baseline.sql` | Original tables (users, categories, workouts, exercises, sets, weight logs, AI insights). |
| `0002_profile_and_timestamps.sql` | Adds profile goal fields, `is_active`, `role` ENUM, `updated_at`/`created_at` timestamps, and performance indexes. |
| `0003_gamification.sql` | Adds the streak/achievement tables (`daily_checkins`, `achievements`, `user_achievements`, `user_streaks`) and seeds the badge catalog. |

## How they are applied

- **Automatically:** On startup the backend (`backend/src/utils/bootstrap.js`)
  creates any missing tables and runs idempotent column checks
  (`information_schema`-driven), so a running server keeps the schema current
  without manual steps. This replaced the old "ALTER on every boot" approach.
- **Manually (clean setup):** run `schema.sql` for a fresh database, or apply
  these migration files in order against an existing database:

```bash
mysql -u root -p -P 8889 fitsync_db < migrations/0002_profile_and_timestamps.sql
mysql -u root -p -P 8889 fitsync_db < migrations/0003_gamification.sql
```

Each migration uses guarded/`IF NOT EXISTS` statements where MySQL allows it.
For older MySQL versions that do not support `ADD COLUMN IF NOT EXISTS`, prefer
the automatic startup path, which checks `information_schema` before altering.
