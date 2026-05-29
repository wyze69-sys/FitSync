# FitSync

A full-stack fitness tracking web application with AI-powered weekly insights.

## Project Structure (MVC-Inspired Architecture)

```
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
│       ├── pages/              # Page-level screens
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Dashboard.jsx
│       │   ├── AdminDashboard.jsx
│       │   └── Profile.jsx
│       ├── components/         # Reusable UI components
│       │   ├── common/
│       │   │   ├── Navbar.jsx
│       │   │   ├── ProtectedRoute.jsx
│       │   │   └── RoleRoute.jsx
│       │   ├── dashboard/
│       │   ├── workout/
│       │   ├── progress/
│       │   ├── admin/
│       │   ├── DashboardView.jsx
│       │   ├── WorkoutView.jsx
│       │   ├── WeightTrackerView.jsx
│       │   ├── WeeklyInsightsView.jsx
│       │   ├── AdminPortalView.jsx
│       │   └── AuthScreen.jsx
│       ├── services/           # API communication layer
│       │   ├── api.js
│       │   ├── authService.js
│       │   ├── workoutService.js
│       │   ├── progressService.js
│       │   └── adminService.js
│       ├── context/            # React context providers
│       │   └── AuthContext.jsx
│       └── utils/
│           └── workoutUtils.js
│
├── backend/                    # Express.js API server
│   ├── package.json
│   ├── server.js
│   ├── app.js
│   ├── .env.example
│   └── src/
│       ├── config/
│       │   ├── db.js
│       │   ├── jwt.js
│       │   └── ai.js
│       ├── routes/             # Route definitions
│       │   ├── routes.js       # Route aggregator
│       │   ├── authRoutes.js
│       │   ├── profileRoutes.js
│       │   ├── workoutRoutes.js
│       │   ├── weightRoutes.js
│       │   ├── categoryRoutes.js
│       │   ├── aiRoutes.js
│       │   └── adminRoutes.js
│       ├── controllers/        # Request/Response handling
│       │   ├── authController.js
│       │   ├── profileController.js
│       │   ├── workoutController.js
│       │   ├── weightController.js
│       │   ├── categoryController.js
│       │   ├── aiController.js
│       │   └── adminController.js
│       ├── services/           # Business logic layer
│       │   ├── authService.js
│       │   ├── userService.js
│       │   ├── workoutService.js
│       │   ├── progressService.js
│       │   ├── aiService.js
│       │   └── adminService.js
│       ├── repositories/       # Database query layer
│       │   ├── userRepository.js
│       │   ├── workoutRepository.js
│       │   ├── weightRepository.js
│       │   ├── insightRepository.js
│       │   └── categoryRepository.js
│       ├── middleware/         # Express middleware
│       │   ├── authMiddleware.js
│       │   ├── roleMiddleware.js
│       │   └── errorMiddleware.js
│       └── utils/
│           ├── bootstrap.js
│           ├── ids.js
│           ├── rowMappers.js
│           ├── generateToken.js
│           └── calculateBMI.js
│
└── database/                   # SQL schema and seed files
    ├── schema.sql
    ├── seed.sql
    ├── queries.sql
    ├── privileges.sql
    └── backup-notes.md
```

## Architecture Pattern

**Backend:** Routes → Controllers → Services → Repositories → Database

**Frontend:** Pages → Components → Services/API → Context/Hooks

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide Icons, Framer Motion
- **Backend:** Express.js, mysql2/promise, JWT, bcryptjs, Helmet, CORS
- **Database:** MySQL (DB_PORT=8889 for MAMP)
- **AI:** Google Gemini (weekly insight generation only)

## Getting Started

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials and JWT secret
npm install
npm run dev
```

### 2. Client Setup

```bash
cd client
npm install
npm run dev
```

### 3. Database

The backend automatically creates tables and seeds demo data on first startup.

**Demo Accounts:**
- User: `user@fitsync.com` / `fitness123`
- Admin: `admin@fitsync.com` / `admin123`

## Features

- User registration and login (JWT authentication)
- User profile management (age, gender, height, weight, goals)
- Workout tracking with exercises, sets, and reps
- Weight logging with automatic BMI calculation
- Daily streak tracking and gamified badges
- AI-powered weekly fitness insights (Google Gemini)
- Admin portal for user/category management
- Responsive design with mobile bottom navigation
- Role-based access control (user vs admin)

## Environment Variables

See `backend/.env.example` for all required variables.
