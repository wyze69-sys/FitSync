# FitSync

FitSync is a full-stack fitness tracking web app for logging workouts, tracking nutrition targets, monitoring weight progress, managing streaks and badges, and generating weekly fitness insights.

The app uses a React + Vite client, an Express backend, a MySQL database, JWT authentication, and backend-only Google Gemini integration for weekly AI insight generation.

## Features

- User registration and login with JWT authentication
- Compact protected dashboard with streaks, XP, weight progress, nutrition context, recent workouts, quick actions, active challenge banners, and system announcements
- Adaptive workout logging with activity categories, exercise metadata, strength sets, duration, intensity, estimated calories/XP, notes, and post-workout food recommendations
- Workout history with clickable keyboard-accessible rows, date filtering, sorting, summary cards, and responsive detail modals
- Nutrition planning with calorie targets, macro splits, workout calorie context, and dataset-grounded food suggestions
- Weight tracking with BMI calculation and progress chart
- Daily wellness check-ins, activity streaks, XP levels, and achievement badges
- Weekly AI insights generated on the backend with Google Gemini
- User-facing profile page with editable personal data/goals, badge showcase, readiness score, quick actions, feedback submission, and account controls
- Admin portal for:
  - Platform activity dashboard and gamification statistics
  - User account management (search, role toggle, activate/deactivate)
  - Exercise category management and category usage analytics
  - Workout template management (create, edit, activate/deactivate, delete)
  - Achievement badge management (create, edit, activate/deactivate)
  - Community challenge management (create, edit, activate/deactivate)
  - System announcement management (create, edit, activate/deactivate, delete)
  - User feedback triage (filter by status/type, update status and admin note)
  - Admin analytics showing aggregate platform counts, category usage, feedback status counts, and active content counts
- Responsive React UI with Tailwind CSS and Lucide icons
- MySQL-backed persistence with startup database bootstrap and seed data

## Tech Stack

| Layer | Tools |
| --- | --- |
| Frontend | React 19, Vite 6, React Router, Tailwind CSS 4, Lucide React |
| Backend | Node.js, Express 4, JWT, bcryptjs, Helmet, CORS, express-rate-limit |
| Database | MySQL, mysql2/promise |
| AI | Google Gemini via `@google/genai` |
| Tests | Node's built-in test runner |

## Project Structure

```text
FitSync/
├── backend/                  # Express API server
│   ├── app.js                # Express app, security middleware, API mount
│   ├── server.js             # Env checks, DB bootstrap, server start
│   ├── src/
│   │   ├── config/           # Database, JWT, Gemini config
│   │   ├── controllers/      # Request/response handlers
│   │   ├── middleware/       # Auth, roles, validation, errors
│   │   ├── repositories/     # MySQL queries
│   │   ├── routes/           # API route modules
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Bootstrap, IDs, BMI, token, mappers
│   │   └── validation/       # Request schemas
│   └── test/                 # Backend unit tests
├── client/                   # React + Vite frontend
│   └── src/
│       ├── components/       # Shared, layout, dashboard, chart, modal UI
│       ├── context/          # Auth and toast providers
│       ├── pages/            # Dashboard, Log, Nutrition, Progress, Profile (/you), Admin, auth
│       ├── services/         # API client and domain service wrappers
│       └── utils/            # Metrics, constants, workout helpers
├── database/                 # Schema, seed, queries, privileges, migrations
├── docs/                     # Extra project notes
├── CLEANUP_REPORT.md
└── SECURITY_AUDIT.md
```

## Requirements

- Node.js 18+
- npm
- MySQL or MAMP MySQL
- Optional: Google Gemini API key for live AI insights

The default database port is `8889`, which matches many MAMP setups. Change `DB_PORT` if your MySQL server uses another port.

## Setup

Clone the repository:

```bash
git clone https://github.com/wyze69-sys/FitSync.git
cd FitSync
```

Install backend dependencies:

```bash
cd backend
npm install
cp .env.example .env
```

Install frontend dependencies:

```bash
cd ../client
npm install
cp .env.example .env
```

On Windows PowerShell, use this instead of `cp`:

```powershell
Copy-Item .env.example .env
```

## Environment Variables

Backend `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=8889
DB_USER=root
DB_PASSWORD=your_database_password
DB_NAME=fitsync_db
JWT_SECRET=your_strong_jwt_secret_minimum_32_characters
GEMINI_API_KEY=your_gemini_api_key
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

Client `client/.env`:

```env
VITE_API_PROXY_TARGET=http://localhost:5000
```

`GEMINI_API_KEY` is used only by the backend. The browser never receives the Gemini key.

If `GEMINI_API_KEY` is missing or left as `your_gemini_api_key`, the backend catches the Gemini error and creates a local fallback insight instead.

## Run Locally

Start the backend:

```bash
cd backend
npm run dev
```

Start the client in a second terminal:

```bash
cd client
npm run dev
```

Open:

```text
http://localhost:5173
```

The API runs at:

```text
http://localhost:5000
```

Health check:

```text
GET http://localhost:5000/api/health
```

## Demo Accounts

The backend seeds demo accounts during startup:

| Role | Email | Password |
| --- | --- | --- |
| User | `user@fitsync.com` | `fitness123` |
| Admin | `admin@fitsync.com` | `admin123` |

These accounts are for local development only. Change or remove seeded credentials before deploying publicly.

## Database

On startup, `backend/src/utils/bootstrap.js`:

- creates the configured database if it does not exist
- creates missing tables
- applies guarded schema upgrades
- seeds exercise categories, achievements, demo users, sample workouts, weight logs, and a sample insight

Database files live in `database/`:

| File | Purpose |
| --- | --- |
| `schema.sql` | Full schema reference |
| `seed.sql` | Seed data reference |
| `queries.sql` | Main SQL query reference |
| `privileges.sql` | Example least-privilege DB user setup |
| `backup-notes.md` | Backup and restore commands |
| `migrations/` | Ordered migration files |

Presentation docs live in `docs/`:

| File | Purpose |
| --- | --- |
| `docs/database-erd.md` | Mermaid ERD and major table relationships |
| `docs/database-dictionary.md` | Table-by-table purpose, columns, usage, and classification |
| `docs/database-presentation-summary.md` | Student-friendly explanation of the database story for presentation |

Key database notes:

- `distance_km` / `holdTime` are calculation inputs only and are not stored in History.
- `users.weight` and `users.weight_kg` are synchronized for compatibility.
- `activity_library` and `nutrition_foods` are reference datasets seeded on startup.
- Empty tables such as `workout_templates` and `challenges` are valid feature tables, not junk.

Migration order:

```text
0001_baseline.sql
0002_profile_and_timestamps.sql
0003_gamification.sql
```

For normal local development, starting the backend is the easiest path because bootstrap keeps the schema current.

## Routes

Frontend routes:

| Route | Description |
| --- | --- |
| `/login` | Login screen |
| `/register` | Registration screen |
| `/` | User dashboard (streaks, badges, BMI, announcements, challenges) |
| `/log` | Adaptive workout logging with categories, activity search, estimates, and food recommendations |
| `/nutrition` | Nutrition targets, macro split, workout calorie context, and food suggestions |
| `/progress` | Weight and progress tracking |
| `/you` | Profile page (navigation label: Profile) |
| `/admin/dashboard` | Admin platform activity overview and gamification stats |
| `/admin/users` | Admin user account management |
| `/admin/categories` | Admin workout category management and usage analytics |
| `/admin/templates` | Admin workout template management |
| `/admin/badges` | Admin achievement badge management |
| `/admin/challenges` | Admin community challenge management |
| `/admin/announcements` | Admin system announcement management |
| `/admin/feedback` | Admin user feedback triage |
| `/admin/analytics` | Admin aggregate analytics |

API routes:

| Area | Endpoints |
| --- | --- |
| Health | `GET /api/health` |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Profile | `POST /api/profile/update` |
| Workouts | `GET /api/workouts`, `POST /api/workouts`, `PUT /api/workouts/:id`, `DELETE /api/workouts/:id` |
| Weights | `GET /api/weights`, `POST /api/weights`, `DELETE /api/weights/:id` |
| Nutrition | `GET /api/nutrition/plan`, `GET /api/nutrition/foods`, `GET /api/nutrition/foods/:id`, `GET /api/nutrition/recommendations` |
| Categories | `GET /api/categories` |
| Gamification | `GET /api/gamification/summary`, `POST /api/gamification/checkin` |
| AI Insights | `GET /api/ai/insights`, `POST /api/ai/generate-weekly-insight` |
| Templates (public read-only) | `GET /api/templates/active` |
| Challenges (user) | `GET /api/challenges/active` |
| Announcements (user) | `GET /api/announcements/active` |
| Feedback (authenticated API) | `POST /api/feedback` |
| Admin — Stats | `GET /api/admin/stats` |
| Admin — Users | `GET /api/admin/users`, `GET /api/admin/users/:id`, `PUT /api/admin/users/:id/role`, `PUT /api/admin/users/:id/status` |
| Admin — Categories | `GET /api/admin/categories/analytics`, `POST /api/admin/categories`, `PUT /api/admin/categories/:id`, `DELETE /api/admin/categories/:id` |
| Admin — Templates | `GET /api/admin/templates`, `GET /api/admin/templates/:id`, `POST /api/admin/templates`, `PUT /api/admin/templates/:id`, `PUT /api/admin/templates/:id/status`, `DELETE /api/admin/templates/:id` |
| Admin — Badges | `GET /api/admin/badges`, `GET /api/admin/badges/:code`, `POST /api/admin/badges`, `PUT /api/admin/badges/:code`, `PATCH /api/admin/badges/:code/status` |
| Admin — Challenges | `GET /api/admin/challenges`, `GET /api/admin/challenges/:id`, `POST /api/admin/challenges`, `PUT /api/admin/challenges/:id`, `PATCH /api/admin/challenges/:id/status` |
| Admin — Announcements | `GET /api/admin/announcements`, `GET /api/admin/announcements/:id`, `POST /api/admin/announcements`, `PUT /api/admin/announcements/:id`, `PATCH /api/admin/announcements/:id/status`, `DELETE /api/admin/announcements/:id` |
| Admin — Feedback | `GET /api/admin/feedback`, `PATCH /api/admin/feedback/:id` |
| Admin — Analytics | `GET /api/admin/analytics` |

Workout list filters include `category`, `search`, `from`, `to`, `sort`, `page`, and `limit`.

Admin feedback filters include `status` (`new`/`in_progress`/`resolved`/`archived`) and `type` (`bug`/`feature`/`general`).

`POST /api/feedback` is available for authenticated users and is used by the Profile page feedback form. Admins triage submissions in the admin feedback area.

Admin analytics show aggregate platform counts, category usage, feedback status counts, and active content counts. They do not currently provide time-series user growth, workout volume trends, or weight-entry trends.

## Scripts

Backend:

| Command | Description |
| --- | --- |
| `npm run dev` | Start Express with nodemon |
| `npm start` | Start Express with Node |
| `npm test` | Run backend tests |

Client:

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build production assets |
| `npm run preview` | Preview the production build |

## Testing

Run backend tests:

```bash
cd backend
npm test
```

The backend test suite covers authentication validation, password hashing, ownership protection, activity calorie/XP formulas, nutrition planning, admin validation, streak badges, timezone helpers, and user weight synchronization.

Core behavior is regression-checked with backend tests and the frontend production build. Manual review is still recommended for visual UI changes before release.

## Manual Testing Checklist

### Auth and User Access
- [ ] Register a new user account and confirm login succeeds.
- [ ] Log in as a standard user.
- [ ] Attempt to navigate directly to `/admin/dashboard`. Confirm redirect to `/`.
- [ ] Send `GET http://localhost:5000/api/admin/stats` with user JWT. Confirm `403 Forbidden`.

### Admin Portal Access
- [ ] Log in as `admin@fitsync.com`.
- [ ] Navigate to `/admin/dashboard`. Confirm platform stats and gamification summary load.
- [ ] Navigate to `/admin/users`. Confirm user list loads with search/filter controls.
- [ ] Navigate to `/admin/categories`. Confirm category list and analytics table load.
- [ ] Navigate to `/admin/templates`. Confirm template list loads (empty state if none exist).
- [ ] Navigate to `/admin/badges`. Confirm badge list loads.
- [ ] Navigate to `/admin/challenges`. Confirm challenge list loads.
- [ ] Navigate to `/admin/announcements`. Confirm announcement list loads.
- [ ] Navigate to `/admin/feedback`. Confirm feedback list loads.
- [ ] Navigate to `/admin/analytics`. Confirm aggregate analytics data loads.

### Admin CRUD — Templates
- [ ] Create a new workout template with at least one exercise. Confirm it appears in the list.
- [ ] Edit the template title and save. Confirm the change persists.
- [ ] Toggle template status inactive. Confirm the status indicator updates.
- [ ] Delete the template. Confirm it is removed from the list.
- [ ] Confirm active templates appear under the public read-only `GET /api/templates/active` endpoint.

### Admin CRUD — Badges
- [ ] Create a new badge with a unique code. Confirm it appears in the list.
- [ ] Edit the badge description and save. Confirm the change persists.
- [ ] Toggle badge status. Confirm the indicator updates.

### Admin CRUD — Challenges
- [ ] Create a challenge with start/end dates. Confirm it appears in the list.
- [ ] Edit the challenge target value and save. Confirm the change persists.
- [ ] Toggle challenge status. Confirm the indicator updates.
- [ ] Confirm active challenges appear under `GET /api/challenges/active`.

### Admin CRUD — Announcements
- [ ] Create an announcement with title and body. Confirm it appears in the list.
- [ ] Toggle announcement active status. Confirm the indicator updates.
- [ ] Delete the announcement. Confirm it is removed.
- [ ] Confirm active announcements appear under `GET /api/announcements/active`.
- [ ] Log in as a standard user and open the dashboard. Confirm active announcement banner displays.

### Feedback Submission and Triage
- [ ] Submit a feedback entry directly via `POST /api/feedback` (authenticated API request, type `bug`). Confirm `201 Created`.
- [ ] In the admin feedback tab, confirm the submitted entry appears.
- [ ] Update the feedback status to `in_progress`. Confirm the change persists.

### User Features (Regression)
- [ ] Log a new workout. Confirm it appears in History and dashboard, and that calculated calories/XP are shown.
- [ ] Log a weight entry. Confirm it appears in the progress chart.
- [ ] Complete a daily wellness check-in. Confirm streak increments.
- [ ] Open Nutrition and confirm targets, macros, workout balance, and food suggestions load.
- [ ] Open Profile and confirm profile details, badges, feedback, and logout controls work.
- [ ] View AI insight on the dashboard.
- [ ] Activate/deactivate a test user account and verify they cannot log in while inactive.

## Security Notes

- Do not commit real `.env` files.
- Use a strong `JWT_SECRET`, at least 32 characters.
- Rotate any API key or password that was ever committed before making the repository public.
- Gemini requests are backend-only, so the API key is not exposed to the browser.
- The backend uses Helmet, CORS allow-listing, JSON body limits, global rate limiting, JWT auth, bcrypt password hashing, role middleware, and centralized error handling.
- All `/api/admin/*` routes require both a valid JWT (`authenticateToken`) and `role === 'admin'` (`requireAdmin`). Any new admin endpoint must be mounted on the admin router to inherit this protection.
- Demo credentials are for development only.

## License

No license file is currently included. Add one before publishing this as reusable open source software.

