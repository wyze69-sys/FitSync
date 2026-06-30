import { Outlet } from "react-router-dom";

/**
 * Shell for admin-only pages. The admin portal uses a separate dark operations
 * console layout so it feels different from the user fitness dashboard.
 */
export default function AdminLayout() {
  return (
    <div className="admin-console min-h-screen bg-bg text-text font-sans">
      <main className="min-h-screen w-full px-4 py-4 sm:px-6 lg:px-7">
        <Outlet />
      </main>
    </div>
  );
}
