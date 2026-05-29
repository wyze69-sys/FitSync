import { useAuth } from "../context/AuthContext.jsx";
import AdminPortalView from "../components/AdminPortalView.jsx";
import Navbar from "../components/common/Navbar.jsx";
import { useState } from "react";

/**
 * AdminDashboard page - admin-only management interface.
 */
export default function AdminDashboard() {
  const { token, handleLogout } = useAuth();
  const [activeTab, setActiveTab] = useState("admin");

  return (
    <div id="app-viewport-frame" className="min-h-screen bg-gradient-to-b from-[#0A0A0A] to-[#050505] text-[#E0E0E0] flex flex-col font-sans relative pb-8">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminPortalView token={token} onUnauthorized={handleLogout} onCategoryChanged={() => {}} />
      </main>

      <footer className="bg-[#050505] border-t border-white/5 py-8 mt-12 text-center text-white/30 text-[10px] font-mono tracking-wide">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>CONNECTED SERVICES: FitSync MySQL Active Schema</div>
          <div>FitSync AI Platform &copy; 2026</div>
          <div>ADMIN MANAGEMENT PORTAL</div>
        </div>
      </footer>
    </div>
  );
}
