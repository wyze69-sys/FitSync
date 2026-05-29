# FitSync Refactor Report

This report documents the project-wide refactor that cleaned up architecture,
completed core features, and aligned the documentation with the actual code.
The project remains JavaScript only (no TypeScript, same stack).

## Frontend

- Added real routing with `react-router-dom` (`/login`, `/register`,
  `/dashboard`, `/workouts`, `/progress`, `/insights`, `/profile`, `/admin`, and
  a 404 page). Browser refresh and back/forward now work. Replaced the previous
  `useState` tab switching.
- Added route guards: `ProtectedRoute` (auth) and `AdminRoute` (admin), plus
  `AppLayout` (user shell) and `AdminLayout` (admin shell).
- Centralized all API calls through `client/src/services` built on a single
  `apiClient` (base URL, token storage, headers, error handling). Removed every
  direct `fetch` call and direct `localStorage` token access from components.
- Split the ~944-line `DashboardView` into focused components under
  `components/dashboard/`, `components/charts/`, `components/workout/`,
  `components/modals/`, and `components/layout/`.
- Added reusable UI: `Spinner`, `ErrorBanner`, `EmptyState`, `ConfirmDialog`,
  and a `ToastContext` provider (replacing `window.alert` / `window.confirm`).
- Normalized code style (2-space indent, double quotes, consistent imports)
  across the frontend, which previously mixed transpiled-looking and hand-written
  styles.

## Backend

- Centralized request validation in `middleware/validate.js` with schemas in
  `validation/schemas.js`; removed scattered manual checks.
- Added a global rate limiter (in addition to the stricter auth limiter).
- Added ownership scoping (`AND user_id = ?`) to workout and weight deletes.
- Centralized BMI calculation in `utils/calculateBMI.js` (removed three
  duplicated implementations). `authService` now uses the shared
  `utils/generateToken.js` (removed a duplicate token helper).
- Added workout filtering, sorting, and pagination on `GET /workouts`.
- Replaced random `Math.random` IDs with `crypto.randomUUID()`-based IDs.
- Replaced the "ALTER on every boot" hack with idempotent,
  `information_schema`-driven schema upgrades.

## New Features

- Persistent gamification: streaks, daily wellness check-ins, and achievement
  badges are stored in MySQL (`daily_checkins`, `achievements`,
  `user_achievements`, `user_streaks`) instead of `localStorage`.
- Target weight and preferred workout type are now persisted and used in the
  dashboard, chart (target line), progress card, and AI insight.
- Expanded admin: user search/filter, role change, activate/deactivate, user
  detail modal, category usage analytics, and streak statistics.

## Database

- `schema.sql` updated to the full schema (gamification tables, `role` ENUM,
  `created_at`/`updated_at` audit timestamps, performance indexes).
- `seed.sql` seeds categories and the achievement catalog.
- `queries.sql` updated to reflect current repository queries.
- Added `database/migrations/` (baseline + profile/timestamps + gamification).

## Bug Fixes

- Fixed invalid Tailwind classes (`text-red-105`, `text-rose-550`/`bg-rose-550`,
  `text-red-350`) that silently failed to render.
- Fixed mismatched exercise category IDs in dashboard quick-logs and templates.
- Removed AI-styled UI copy (e.g. "INDEXING CORE NODE", "POWERED BY GEMINI PRO
  METRICS INTELLIGENCE", "Broadcasting to MySQL") and unified branding to
  "FitSync".

## Dead Code Removed

- `client/src/services/api.js` (replaced by `apiClient.js`).
- `client/src/components/common/RoleRoute.jsx` (replaced by `AdminRoute`).
- Monolithic views `DashboardView`, `WorkoutView`, `WeightTrackerView`,
  `WeeklyInsightsView` (replaced by pages + small components).
- `localStorage`-only streak/badge logic in `utils/workoutUtils.js`.

## Documentation

- `README.md` rewritten to match the implementation: corrected the stack
  (custom SVG charts, not Recharts; removed the Framer Motion claim), documented
  the real routes and API, and the actual folder structure.

## Intentionally Not Changed

- Stack and language: React + Vite, Node + Express, MySQL, JWT, JavaScript only.
- Gemini usage remains backend-only and limited to the weekly insight.
- Existing table names and core layout/visual design were preserved.

## Known Limitations

- No automated test suite yet.
- JWT is stored in `localStorage` (acceptable for this course scope; httpOnly
  cookies would be the production hardening step).
- Live end-to-end testing requires a local MySQL instance.
