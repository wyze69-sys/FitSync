import { Outlet } from "react-router-dom";
import Navbar from "../common/Navbar.jsx";

/**
 * Shell for admin-only pages. Kept separate from the user shell so the two
 * experiences stay cleanly isolated.
 */
export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0A] to-[#050505] text-[#E0E0E0] flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-[#050505] border-t border-white/5 py-8 mt-12 text-center text-white/30 text-[10px] font-mono tracking-wide">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>FitSync &mdash; Administration</div>
          <div>&copy; 2026 FitSync</div>
          <div>Admin management portal</div>
        </div>
      </footer>
    </div>
  );
}
