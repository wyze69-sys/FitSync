import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

/**
 * AppContent renders the appropriate page based on user role.
 * Admin users see AdminDashboard; regular users see Dashboard.
 */
function AppContent() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === "admin") {
    return <AdminDashboard />;
  }

  return <Dashboard />;
}

/**
 * App - Root component wrapping the application with AuthProvider and ProtectedRoute.
 */
export default function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppContent />
      </ProtectedRoute>
    </AuthProvider>
  );
}
