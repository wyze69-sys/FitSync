import AuthScreen from "../components/AuthScreen.jsx";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Login page - wraps the AuthScreen component with auth context integration.
 */
export default function Login() {
  const { handleLoginSuccess } = useAuth();

  return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
}
