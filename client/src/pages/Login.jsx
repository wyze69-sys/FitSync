import { Navigate, useNavigate } from "react-router-dom";
import AuthScreen from "../components/AuthScreen.jsx";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Login page. Redirects already-authenticated users to their home.
 */
export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  function handleAuthSuccess(authenticatedUser) {
    const account = authenticatedUser || user;
    navigate(account?.role === "admin" ? "/admin" : "/dashboard", { replace: true });
  }

  if (!loading && user) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  return <AuthScreen defaultMode="login" onAuthSuccess={handleAuthSuccess} />;
}
