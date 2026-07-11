# FitSync

FitSync is a fitness tracking web application with a React client and Node.js/Express backend. It helps users track workouts, calories, XP progress, achievements, nutrition planning, and profile-based fitness data.

## Features

- User authentication and protected routes
- Workout logging and activity-based calorie/XP calculation
- Level, XP, streak, badge, and challenge systems
- Nutrition planning based on user profile and workout activity
- Admin management for badges, challenges, announcements, and templates
- Swagger API documentation for backend endpoints
- GitHub Actions CI for client build and backend tests

## Tech Stack

### Client

- React
- Vite
- React Router
- Tailwind CSS
- Lucide React

### Backend

- Node.js
- Express
- MySQL
- JWT authentication
- Swagger/OpenAPI documentation
- Node test runner

## Project Structure

```text
FitSync/
├── client/       # React + Vite frontend
├── backend/      # Express + MySQL backend
└── .github/      # GitHub Actions workflow files
```

## Getting Started

### 1. Install client dependencies

```bash
cd client
npm install
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure backend environment

Create a backend environment file:

```text
backend/.env
```

Use your local database and app settings. Example keys may include:

```env
PORT=5001
DB_HOST=127.0.0.1
DB_PORT=8889
DB_USER=root
DB_PASSWORD=root
DB_NAME=fitsync
JWT_SECRET=your-secret-key
```

Do not commit real secrets to GitHub.

## Run Locally

### Start backend

```bash
cd backend
npm run dev
```

### Start client

```bash
cd client
npm run dev
```

## Test and Build

### Backend tests

```bash
cd backend
npm test
```

### Client production build

```bash
cd client
npm run build
```

## CI

This repository uses GitHub Actions:

```text
.github/workflows/ci.yml
```

The CI workflow runs:

- Client dependency install and production build
- Backend dependency install and test suite

## Notes

- Keep `.env` files private.
- Review generated pull requests before merging.
- Use selected repository access when connecting GitHub automation tools such as WarpFix.
