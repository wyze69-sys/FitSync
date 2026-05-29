import { useAuth } from "../../context/AuthContext.jsx";
import Login from "../../pages/Login.jsx";

/**
 * ProtectedRoute ensures only authenticated users can access wrapped content.
 * If not logged in, renders the Login page.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono text-white/50 uppercase tracking-widest">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return children;
}
