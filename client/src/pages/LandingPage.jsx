import { Navigate } from "react-router-dom";
import Spinner from "../components/common/Spinner.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function LandingPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f6f5f0]">
        <Spinner label="Checking your session..." />
      </main>
    );
  }

  if (user) {
    return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/dashboard"} replace />;
  }

  return (
    <main className="min-h-screen bg-[#f6f5f0]">
      <iframe
        src="/fitsync-landing/index.html"
        title="FitSync landing page"
        className="block h-screen min-h-screen w-full border-0"
      />
    </main>
  );
}
