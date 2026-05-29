import { useAuth } from "../../context/AuthContext.jsx";

/**
 * RoleRoute restricts content to users with a specific role.
 * Shows an access denied message for unauthorized roles.
 */
export default function RoleRoute({ role, children }) {
  const { user } = useAuth();

  if (!user || user.role !== role) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-center">
        <div className="space-y-2">
          <h2 className="text-lg font-serif italic text-white font-bold">Access Restricted</h2>
          <p className="text-xs text-white/40">
            You do not have permission to access this section.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
