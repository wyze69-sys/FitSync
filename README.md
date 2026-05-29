# FitSync

FitSync is a full-stack fitness tracking web application with AI-powered weekly
insights. It uses a React + Vite client, a Node.js + Express backend, and a
MySQL database. The project is JavaScript only.

## Main Features

- Register and log in with JWT authentication (bcrypt password hashing)
- Real client-side routing with protected user and admin areas
- Profile management (height, weight, target weight, goal, preferred style)
- Workout logging with exercises and sets, plus filtering, sorting, and pagination
- Weight tracking with BMI and a weight-trend chart (custom SVG)
- Target-weight progress visualization
- Streaks, daily wellness check-ins, and achievement badges persisted in MySQL
- Weekly AI insight generated on the backend with the Google Gemini API
- Admin tools: platform stats, category management + usage analytics, and user
  management (search, filter, role change, activate/deactivate, user detail)
- Responsive UI with desktop and mobile navigation and quick-action shortcuts

## Project Structure

```text
FitSync/
├── client/                     # React + Vite frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx            # BrowserRouter + Auth/Toast providers
│       ├── App.jsx             # Route definitions
│       ├── index.css
│       ├── pages/              # Login, Register, Dashboard, Workouts,
│       │                       # Progress, Insights, Profile, AdminDashboard, NotFound
│       ├── components/
│       │   ├── common/         # Navbar, ProtectedRoute, AdminRoute, Spinner,
│       │   │                   # ErrorBanner, EmptyState
│       │   ├── layout/         # AppLayout (user shell), AdminLayout
│       │   ├── dashboard/      # Focused dashboard cards
│       │   ├── charts/         # WeightProgressChart (SVG)
│       │   ├── workout/        # WorkoutForm
│       │   └── modals/         # OnboardingModal, ConfirmDialog
│       ├── services/           # apiClient + per-domain service modules
│       ├── context/            # AuthContext, ToastContext
│       └── utils/              # constants, metrics, date helpers
├── backend/                    # Express API server
│   ├── package.json
│   ├── server.js
│   ├── app.js
│   ├── .env.example
│   └── src/
│       ├── config/             # db, jwt, ai
│       ├── routes/             # one router per resource
│       ├── controllers/        # thin request/response handlers
│       ├── services/           # business logic
│       ├── repositories/       # parameterized SQL data access
│       ├── middleware/         # auth, role, validation, error handling
│       ├── validation/         # request schemas
│       └── utils/              # bootstrap, ids, BMI, token, streak, mappers
└── database/                   # SQL schema, seed, queries, privileges, migrations
    ├── schema.sql
    ├── seed.sql
    ├── queries.sql
    ├── privileges.sql
    ├── backup-notes.md
    └── migrations/
```

## Architecture Pattern

- Backend: Routes → Controllers → Services → Repositories → MySQL
- Frontend: Pages → Components → Services (apiClient) → Context

Request validation is centralized in `backend/src/middleware/validate.js` using
schemas in `backend/src/validation/schemas.js`. The frontend never calls `fetch`
or reads the token directly; everything goes through `client/src/services`.

## Tech Stack

- Frontend: React 19, Vite, React Router, Tailwind CSS, Lucide icons
- Charts: lightweight custom SVG (no charting dependency)
- Backend: Express.js, mysql2/promise, JWT, bcryptjs, Helmet, CORS, express-rate-limit
- Database: MySQL
- AI: Google Gemini (weekly insight generation only, backend-side)

## Requirements

- Node.js 18+
- MySQL or MAMP MySQL running locally
- Database name: `fitsync_db`

The default local MySQL port is `8889`, which matches many MAMP setups. Change
`DB_PORT` in `backend/.env` if your MySQL server uses another port.

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Update `backend/.env` with your local database password, a strong JWT secret
(32+ characters), and your Gemini API key. On startup the backend creates any
missing tables, applies idempotent schema upgrades, and seeds demo data.

## Client Setup

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

The client runs on Vite at `http://localhost:5173` and proxies `/api` requests
to the backend at `http://localhost:5000`.

## Database Files

SQL files live in `database/`:

- `schema.sql` — full schema (tables, indexes, constraints, gamification tables)
- `seed.sql` — starter exercise categories and the achievement catalog
- `queries.sql` — reference of the main queries used by the repositories
- `privileges.sql` — least-privilege application database user
- `backup-notes.md` — backup and restore commands
- `migrations/` — ordered, forward migrations from the original schema

Demo accounts (seeded for local evaluation):

- User: `user@fitsync.com` / `fitness123`
- Admin: `admin@fitsync.com` / `admin123`

## API Overview

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/profile/update`
- `GET /api/workouts` (filters: `category, search, from, to, sort, page, limit`),
  `POST /api/workouts`, `PUT /api/workouts/:id`, `DELETE /api/workouts/:id`
- `GET /api/weights`, `POST /api/weights`, `DELETE /api/weights/:id`
- `GET /api/categories`
- `GET /api/gamification/summary`, `POST /api/gamification/checkin`
- `GET /api/ai/insights`, `POST /api/ai/generate-weekly-insight`
- Admin: `GET /api/admin/stats`, `GET /api/admin/users`, `GET /api/admin/users/:id`,
  `PUT /api/admin/users/:id/role`, `PUT /api/admin/users/:id/status`,
  `GET /api/admin/categories/analytics`, `POST|PUT|DELETE /api/admin/categories`

## Notes

- Keep `backend/.env` and `client/.env` private. They are ignored by Git.
- Gemini API calls are made only from the backend.
- The project is JavaScript only (`.js` / `.jsx`).
