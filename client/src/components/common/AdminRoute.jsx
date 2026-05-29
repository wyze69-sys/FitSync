import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

/**
 * Route guard: only admin users may access nested routes.
 * Non-admins are sent to their dashboard. Assumes it is nested inside
 * ProtectedRoute, so `user` is already guaranteed to exist.
 */
export default function AdminRoute() {
  const { user } = useAuth();

  if (!user || user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
