import { useLocation, useNavigate } from "react-router-dom";
import AuthScreen from "../components/AuthScreen.jsx";

/**
 * Login page. PublicRoute redirects already-authenticated users away.
 */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  function handleAuthSuccess(authenticatedUser) {
    const fallback = authenticatedUser?.role === "admin" ? "/admin/dashboard" : "/";
    navigate(location.state?.from || fallback, { replace: true });
  }

  return <AuthScreen defaultMode="login" onAuthSuccess={handleAuthSuccess} />;
}
