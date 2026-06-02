import { Navigate } from "react-router-dom";
import AuthScreen from "../components/AuthScreen.jsx";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Register page. Redirects already-authenticated users to their home.
 */
export default function Register() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/"} replace />;
  }

  return <AuthScreen defaultMode="register" />;
}
