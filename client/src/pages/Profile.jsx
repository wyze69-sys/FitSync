import { useOutletContext } from "react-router-dom";
import { UserCog } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import DashboardProfileSummary from "../components/dashboard/DashboardProfileSummary.jsx";

/**
 * Standalone profile page. Reuses the profile card so editing stays consistent
 * with the dashboard.
 */
export default function Profile() {
  const { user, refreshAll, push } = useOutletContext();
  const { updateUser } = useAuth();

  function handleProfileUpdated(updatedUser) {
    updateUser(updatedUser);
    refreshAll();
  }

  return (
    <div className="space-y-6 text-left max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <UserCog className="h-5 w-5 text-accent" aria-hidden="true" />
        <h1 className="text-xl font-semibold tracking-tight text-text">Profile Settings</h1>
      </div>
      <p className="text-xs text-muted">
        Update your details, goal, target weight, and preferred training style. These help
        personalise your dashboard and weekly AI insight.
      </p>

      <DashboardProfileSummary user={user} onProfileUpdated={handleProfileUpdated} onToast={push} />

      <div className="bg-surface p-5 rounded-sm border border-border text-xs text-muted space-y-1">
        <div className="font-mono uppercase tracking-widest text-[10px] text-muted">Account</div>
        <div className="text-text">{user.email}</div>
        {user.createdAt && (
          <div className="text-[11px] text-muted">
            Member since{" "}
            {new Date(user.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric"
            })}
          </div>
        )}
      </div>
    </div>
  );
}
