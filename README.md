# FitSync

FitSync is a full-stack fitness tracking web app for logging workouts, tracking weight progress, managing streaks and badges, and generating weekly fitness insights.

The app uses a React + Vite client, an Express backend, a MySQL database, JWT authentication, and backend-only Google Gemini integration for weekly AI insight generation.

## Features

- User registration and login with JWT authentication
- Protected user dashboard with streaks, badges, BMI, target-weight progress, recent workouts, and quick actions
- Workout logging with exercises, sets, reps, weights, duration, calories, notes, filtering, sorting, and pagination
- Weight tracking with BMI calculation and progress chart
- Daily wellness check-ins, activity streaks, and achievement badges
- Weekly AI insights generated on the backend with Google Gemini
- Admin portal for platform activity, user account management, workout category management, and category usage analytics.
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
│       ├── pages/            # Dashboard, Log, Progress, You, Admin, auth
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
| `/` | User dashboard |
| `/log` | Workout logging |
| `/progress` | Weight and progress tracking |
| `/you` | User profile |
| `/admin/dashboard` | Admin platform activity overview |
| `/admin/users` | Admin user account management |
| `/admin/categories` | Admin workout category management and category usage analytics |

API routes:

| Area | Endpoints |
| --- | --- |
| Health | `GET /api/health` |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Profile | `POST /api/profile/update` |
| Workouts | `GET /api/workouts`, `POST /api/workouts`, `PUT /api/workouts/:id`, `DELETE /api/workouts/:id` |
| Weights | `GET /api/weights`, `POST /api/weights`, `DELETE /api/weights/:id` |
| Categories | `GET /api/categories` |
| Gamification | `GET /api/gamification/summary`, `POST /api/gamification/checkin` |
| AI Insights | `GET /api/ai/insights`, `POST /api/ai/generate-weekly-insight` |
| Admin | `/api/admin/*` admin-only platform stats, user management, category management, and category analytics routes |

Workout list filters include `category`, `search`, `from`, `to`, `sort`, `page`, and `limit`.

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

The current tests cover authentication validation, password hashing behavior, and ownership protection for workout and weight-log operations.

## Security Notes

- Do not commit real `.env` files.
- Use a strong `JWT_SECRET`, at least 32 characters.
- Rotate any API key or password that was ever committed before making the repository public.
- Gemini requests are backend-only, so the API key is not exposed to the browser.
- The backend uses Helmet, CORS allow-listing, JSON body limits, global rate limiting, JWT auth, bcrypt password hashing, role middleware, and centralized error handling.
- Demo credentials are for development only.

## License

No license file is currently included. Add one before publishing this as reusable open source software.
