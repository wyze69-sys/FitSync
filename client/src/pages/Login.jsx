import { Navigate } from "react-router-dom";
import AuthScreen from "../components/AuthScreen.jsx";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Login page. Redirects already-authenticated users to their home.
 */
export default function Login() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/dashboard"} replace />;
  }

  return <AuthScreen defaultMode="login" />;
}
