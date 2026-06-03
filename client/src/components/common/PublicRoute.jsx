import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import Spinner from "./Spinner.jsx";

/**
 * Route guard for auth pages. Anonymous users can continue to /login and
 * /register; authenticated users go back to the app home.
 */
export default function PublicRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <Spinner label="Verifying session..." />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
