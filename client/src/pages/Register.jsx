import AuthScreen from "../components/AuthScreen.jsx";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Register page - wraps AuthScreen in register mode.
 * Note: AuthScreen handles both login and register with a toggle.
 * This page exists for routing clarity but renders the same component.
 */
export default function Register() {
  const { handleLoginSuccess } = useAuth();

  return <AuthScreen onLoginSuccess={handleLoginSuccess} defaultMode="register" />;
}
