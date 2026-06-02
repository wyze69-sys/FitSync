import { Outlet } from "react-router-dom";
import Navbar from "../common/Navbar.jsx";

/**
 * Shell for admin-only pages. Kept separate from the user shell so the two
 * experiences stay cleanly isolated.
 */
export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-bg text-text flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-bg border-t border-border py-8 mt-12 text-center text-muted text-[10px] font-mono tracking-wide">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>FitSync &mdash; Administration</div>
          <div>&copy; 2026 FitSync</div>
          <div>Admin management portal</div>
        </div>
      </footer>
    </div>
  );
}
