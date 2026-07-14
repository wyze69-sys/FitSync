import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import AdminRoute from "./components/common/AdminRoute.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";
import AdminLayout from "./components/layout/AdminLayout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import LoadingSpinner from "./components/common/LoadingSpinner.jsx";

const LandingPage = React.lazy(() => import("./pages/LandingPage.jsx"));
const Dashboard = React.lazy(() => import("./pages/Dashboard.jsx"));
const Log = React.lazy(() => import("./pages/Log.jsx"));
const Progress = React.lazy(() => import("./pages/Progress.jsx"));
const Nutrition = React.lazy(() => import("./pages/Nutrition.jsx"));
const You = React.lazy(() => import("./pages/You.jsx"));
const Workouts = React.lazy(() => import("./pages/Workouts.jsx"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard.jsx"));
const NotFound = React.lazy(() => import("./pages/NotFound.jsx"));

/**
 * Application routes. Public auth routes, a protected user shell, and a
 * protected + admin-gated portal. Real URLs mean refresh and browser
 * back/forward work as expected.
 */
export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner label="Loading page..." />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/log" element={<Log />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/you" element={<You />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              {/* Single mounted view; the :section param drives which panel shows
                  (dashboard | users | categories | statistics) without remounting. */}
              <Route path="/admin/:section" element={<AdminDashboard />} />
            </Route>
          </Route>
        </Route>

        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
