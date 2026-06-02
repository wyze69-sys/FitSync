# FitSync

FitSync is a full-stack fitness tracking app for logging workouts, monitoring weight progress, and turning training data into simple weekly insights.

## Features

- Single login with role-based routing for users and admins
- Dashboard with streaks, weekly consistency, BMI, target-weight progress, badges, and recent workouts
- Workout logging with exercises, sets, reps, weight, duration, calories, search, filters, sorting, and pagination
- Progress tracking with body-weight history, BMI overview, and a custom SVG trend chart
- Daily wellness check-ins and achievement badges backed by MySQL
- AI weekly insight generation through Google Gemini on the backend
- Admin portal for platform stats, user management, category management, and usage analytics
- Responsive React UI with Tailwind CSS and Lucide icons

## Tech Stack

- Frontend: React 19, Vite, React Router, Tailwind CSS, Lucide
- Backend: Node.js, Express, JWT auth, bcryptjs, Helmet, CORS, express-rate-limit
- Database: MySQL with `mysql2/promise`
- AI: Google Gemini API via `@google/genai`
- Tests: Node's built-in test runner for backend tests

## Requirements

- Node.js 18+
- npm
- MySQL or MAMP MySQL
- A Google Gemini API key if you want AI insights

The default local database config targets MAMP-style MySQL on port `8889`. Change `DB_PORT` in `backend/.env` if your MySQL server uses a different port.

## Quick Start

Clone the repo:

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

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp .env.example .env`.

## Configuration

Edit `backend/.env`:

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

Edit `client/.env` if your backend is not running on port `5000`:

```env
VITE_API_PROXY_TARGET=http://localhost:5000
```

The backend creates missing tables, applies idempotent schema updates, and seeds local demo data on startup.

## Run Locally

Start the backend:

```bash
cd backend
npm run dev
```

Start the client in another terminal:

```bash
cd client
npm run dev
```

Open the app at:

```text
http://localhost:5173
```

The API runs at:

```text
http://localhost:5000
```

## Demo Accounts

Seeded local accounts:

| Role | Email | Password |
| --- | --- | --- |
| User | `user@fitsync.com` | `fitness123` |
| Admin | `admin@fitsync.com` | `admin123` |

These are for local development only. Change or remove seeded credentials before deploying a public instance.

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

## Project Structure

```text
backend/        # Express API, services, repositories, validation, tests
client/         # React + Vite frontend
database/       # Schema, seed data, reference queries, migrations
docs/           # Extra project notes
```

Key frontend folders:

```text
client/src/pages/          # Route-level screens
client/src/components/     # Shared UI and feature components
client/src/services/       # API client and domain services
client/src/context/        # Auth and toast providers
client/src/utils/          # Metrics, dates, constants
```

Key backend folders:

```text
backend/src/routes/        # API route definitions
backend/src/controllers/   # Request/response handlers
backend/src/services/      # Business logic
backend/src/repositories/  # Parameterized SQL access
backend/src/middleware/    # Auth, roles, validation, errors
backend/src/utils/         # Bootstrap, IDs, metrics, tokens
```

## API Overview

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Profile | `POST /api/profile/update` |
| Workouts | `GET /api/workouts`, `POST /api/workouts`, `PUT /api/workouts/:id`, `DELETE /api/workouts/:id` |
| Weights | `GET /api/weights`, `POST /api/weights`, `DELETE /api/weights/:id` |
| Categories | `GET /api/categories` |
| Gamification | `GET /api/gamification/summary`, `POST /api/gamification/checkin` |
| AI Insights | `GET /api/ai/insights`, `POST /api/ai/generate-weekly-insight` |
| Admin | `GET /api/admin/stats`, `GET /api/admin/users`, `GET /api/admin/users/:id`, category admin routes |

Workout list filters include `category`, `search`, `from`, `to`, `sort`, `page`, and `limit`.

## Security Notes

- Do not commit real `.env` files.
- Rotate any API key or password that was ever committed before making the repo public.
- Gemini requests are made from the backend only, so the browser never receives the API key.
- The app uses JWT auth, bcrypt password hashing, Helmet headers, CORS allow-listing, and rate limiting.
- Demo credentials are convenient locally but should not be used in production.

## Contributing

1. Fork the repo.
2. Create a feature branch: `git checkout -b feat/your-change`.
3. Run the relevant build/tests.
4. Commit with a clear message.
5. Open a pull request.

## License

No license file is currently included. Add one before publishing this as reusable open source software.
