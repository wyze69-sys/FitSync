import { LogOut, UserCog } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import DashboardProfileSummary from "../components/dashboard/DashboardProfileSummary.jsx";

/** Profile page for beginner navigation: body stats, target, goal, and logout. */
export default function You() {
  const { user, refreshAll, push } = useOutletContext();
  const { updateUser, logout } = useAuth();
  const navigate = useNavigate();

  function handleProfileUpdated(updatedUser) {
    updateUser(updatedUser);
    refreshAll();
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="space-y-6 text-left max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-2">
        <UserCog className="h-5 w-5 text-primary" aria-hidden="true" />
        <h1 className="text-xl font-semibold tracking-tight text-text">You</h1>
      </div>
      <p className="text-xs text-muted">
        Keep height, weight, target weight, and goal current so FitSync can personalize your progress.
      </p>

      <DashboardProfileSummary user={user} onProfileUpdated={handleProfileUpdated} onToast={push} />

      <div className="bg-surface p-5 rounded-2xl border border-border text-xs text-muted space-y-4 card-hover-effect transition-all duration-300">
        <div>
          <div className="font-mono uppercase tracking-widest text-[10px] text-muted">Account</div>
          <div className="text-text mt-1">{user.email}</div>
          {user.createdAt && (
            <div className="text-[11px] text-muted mt-1">
              Member since {new Date(user.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric"
              })}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-2.5 px-3 rounded-2xl border border-border text-text hover:border-primary flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-widest"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" /> Logout
        </button>
      </div>
    </div>
  );
}
