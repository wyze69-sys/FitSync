# FitSync

FitSync is a full-stack fitness tracking web application with AI-powered weekly insights. It uses a React + Vite client, a Node.js + Express backend, and a MySQL database.

## Main Features

- Register and log in with JWT authentication
- User profile, BMI, and progress dashboard
- Workout logging with exercises and sets
- Weight tracking over time
- Daily streak tracking and achievement badges
- Weekly AI insight generated from the backend with Gemini
- Admin tools for user review and category management
- Responsive UI with mobile navigation
- Role-based access control for users and admins

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
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── pages/
│       ├── components/
│       ├── services/
│       ├── context/
│       └── utils/
├── backend/                    # Express API server
│   ├── package.json
│   ├── server.js
│   ├── app.js
│   ├── .env.example
│   └── src/
│       ├── config/
│       ├── routes/
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       ├── middleware/
│       └── utils/
└── database/                   # SQL schema and seed files
    ├── schema.sql
    ├── seed.sql
    ├── queries.sql
    ├── privileges.sql
    └── backup-notes.md
```

## Architecture Pattern

Backend: Routes -> Controllers -> Services -> Repositories -> Database

Frontend: Pages -> Components -> Services/API -> Context

## Tech Stack

- Frontend: React 19, Vite, Tailwind CSS, Lucide Icons, Framer Motion
- Backend: Express.js, mysql2/promise, JWT, bcryptjs, Helmet, CORS
- Database: MySQL
- AI: Google Gemini for weekly insight generation

## Requirements

- Node.js
- MySQL or MAMP MySQL running locally
- Database name: `fitsync_db`

The default local MySQL port is `8889`, which matches many MAMP setups. Change `DB_PORT` in `backend/.env` if your MySQL server uses another port.

## Backend Setup

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Update `backend/.env` with your local database password, JWT secret, and Gemini API key.

## Client Setup

```bash
cd client
npm install
copy .env.example .env
npm run dev
```

The client runs on Vite at `http://localhost:5173` and proxies `/api` requests to the backend at `http://localhost:5000`.

## Database Files

MySQL files are stored in `database/`:

- `schema.sql` creates the tables
- `seed.sql` adds starter exercise categories
- `queries.sql` shows the main SQL queries used by the app
- `privileges.sql` creates a limited database user
- `backup-notes.md` includes simple backup and restore commands

The backend also creates missing tables and starter demo records during startup.

Demo accounts:

- User: `user@fitsync.com` / `fitness123`
- Admin: `admin@fitsync.com` / `admin123`

## Notes

- Keep `backend/.env` and `client/.env` private. They are ignored by Git.
- Gemini API calls are made only from the backend.
- The project is JavaScript only.
