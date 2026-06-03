import AuthScreen from "../components/AuthScreen.jsx";

/**
 * Register page. PublicRoute redirects already-authenticated users away.
 */
export default function Register() {
  return <AuthScreen defaultMode="register" />;
}
