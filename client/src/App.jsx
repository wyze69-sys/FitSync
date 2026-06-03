import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import PublicRoute from "./components/common/PublicRoute.jsx";
import AdminRoute from "./components/common/AdminRoute.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";
import AdminLayout from "./components/layout/AdminLayout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Log from "./pages/Log.jsx";
import Progress from "./pages/Progress.jsx";
import You from "./pages/You.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import NotFound from "./pages/NotFound.jsx";

/**
 * Application routes. Public auth routes, a protected user shell, and a
 * protected + admin-gated portal. Real URLs mean refresh and browser
 * back/forward work as expected.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/log" element={<Log />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/you" element={<You />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            {/* Single mounted view; the :section param drives which panel shows
                (dashboard | users | categories | statistics) without remounting. */}
            <Route path="/admin/:section" element={<AdminDashboard />} />
            <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Route>
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
