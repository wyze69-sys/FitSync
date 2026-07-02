import { Outlet } from "react-router-dom";

/**
 * Shell for admin-only pages. The admin portal uses a separate light operations
 * console layout (soft neutral canvas, white panels, single emerald accent) so
 * it reads as a distinct, serious surface from the user fitness dashboard.
 */
export default function AdminLayout() {
  return (
    <div className="admin-console min-h-screen bg-bg text-text font-sans">
      {/* Slim accent rule gives the console a consistent admin identity. */}
      <div className="h-1 w-full bg-primary" aria-hidden="true" />
      <main className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <Outlet />
      </main>
    </div>
  );
}
