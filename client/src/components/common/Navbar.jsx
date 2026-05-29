import { Dumbbell, Scale, Sparkles, LayoutDashboard, ShieldCheck, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";

/**
 * Navbar component - top navigation bar with desktop and mobile views.
 */
export default function Navbar({ activeTab, setActiveTab }) {
  const { user, handleLogout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return null;

  return (
    <nav id="navbar" className="bg-[#0A0A0A] border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* Logo Brand */}
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-white/5 border border-white/10 rounded flex items-center justify-center text-white">
              <Dumbbell className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="font-serif tracking-tight italic text-xl font-bold text-white select-none">FitSync AI</span>
          </div>

          {/* Desktop Nav Actions */}
          <div className="hidden md:flex items-center space-x-6 text-xs uppercase tracking-widest text-white/50 font-sans">
            {user.role === "user" && (
              <>
                <button onClick={() => setActiveTab("dashboard")} className={`h-full px-1 transition-all cursor-pointer flex items-center gap-1.5 border-b-2 font-semibold ${activeTab === "dashboard" ? "text-white border-white" : "border-transparent hover:text-white"}`}>
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Overview
                </button>
                <button onClick={() => setActiveTab("workouts")} className={`h-full px-1 transition-all cursor-pointer flex items-center gap-1.5 border-b-2 font-semibold ${activeTab === "workouts" ? "text-white border-white" : "border-transparent hover:text-white"}`}>
                  <Dumbbell className="h-3.5 w-3.5" />
                  Workouts
                </button>
                <button onClick={() => setActiveTab("weights")} className={`h-full px-1 transition-all cursor-pointer flex items-center gap-1.5 border-b-2 font-semibold ${activeTab === "weights" ? "text-white border-white" : "border-transparent hover:text-white"}`}>
                  <Scale className="h-3.5 w-3.5" />
                  Weights
                </button>
                <button onClick={() => setActiveTab("insights")} className={`h-full px-1 transition-all cursor-pointer flex items-center gap-1.5 border-b-2 font-semibold ${activeTab === "insights" ? "text-white border-white" : "border-transparent hover:text-white"}`}>
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  AI Insights
                </button>
              </>
            )}
            {user.role === "admin" && (
              <button onClick={() => setActiveTab("admin")} className={`h-full px-1 transition-all cursor-pointer flex items-center gap-1.5 border-b-2 font-semibold ${activeTab === "admin" ? "text-white border-white" : "border-transparent hover:text-white"}`}>
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin Controls
              </button>
            )}
          </div>

          {/* User Meta logout dropdown */}
          <div className="hidden md:flex items-center gap-4 border-l border-white/10 pl-4 font-sans text-xs">
            <div className="text-right">
              <div className="font-semibold text-white line-clamp-1">{user.name}</div>
              <div className="text-[9px] uppercase font-mono tracking-widest text-white/40 capitalize">{user.role} Account</div>
            </div>
            <button type="button" onClick={handleLogout} className="h-8 w-8 rounded bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 flex items-center justify-center transition-all cursor-pointer" title="Log out of FitSync Account">
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center md:hidden animate-fade-in">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="h-10 w-10 text-white/70 hover:text-white flex items-center justify-center rounded hover:bg-white/5 select-none">
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation List */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0A0A0A] border-t border-white/10 px-4 py-3 space-y-1 font-sans text-xs">
          {user.role === "user" && (
            <>
              <button onClick={() => { setActiveTab("dashboard"); setIsMobileMenuOpen(false); }} className={`w-full text-left py-2 px-3 rounded font-medium flex items-center gap-2 uppercase tracking-widest ${activeTab === "dashboard" ? "bg-white/10 text-white font-bold" : "text-white/60 hover:bg-white/5"}`}>
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </button>
              <button onClick={() => { setActiveTab("workouts"); setIsMobileMenuOpen(false); }} className={`w-full text-left py-2 px-3 rounded font-medium flex items-center gap-2 uppercase tracking-widest ${activeTab === "workouts" ? "bg-white/10 text-white font-bold" : "text-white/60 hover:bg-white/5"}`}>
                <Dumbbell className="h-4 w-4" /> Workouts Log
              </button>
              <button onClick={() => { setActiveTab("weights"); setIsMobileMenuOpen(false); }} className={`w-full text-left py-2 px-3 rounded font-medium flex items-center gap-2 uppercase tracking-widest ${activeTab === "weights" ? "bg-white/10 text-white font-bold" : "text-white/60 hover:bg-white/5"}`}>
                <Scale className="h-4 w-4" /> Weight Tracker
              </button>
              <button onClick={() => { setActiveTab("insights"); setIsMobileMenuOpen(false); }} className={`w-full text-left py-2 px-3 rounded font-medium flex items-center gap-2 uppercase tracking-widest ${activeTab === "insights" ? "bg-white/10 text-white font-bold" : "text-white/60 hover:bg-white/5"}`}>
                <Sparkles className="h-4 w-4 text-emerald-400" /> AI Insights
              </button>
            </>
          )}
          {user.role === "admin" && (
            <button onClick={() => { setActiveTab("admin"); setIsMobileMenuOpen(false); }} className={`w-full text-left py-2 px-3 rounded font-medium flex items-center gap-2 uppercase tracking-widest ${activeTab === "admin" ? "bg-white/10 text-white font-bold" : "text-white/60 hover:bg-white/5"}`}>
              <ShieldCheck className="h-4 w-4" /> Admin Controls
            </button>
          )}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <div>
              <div className="font-semibold text-white">{user.name}</div>
              <div className="text-[10px] text-white/40 capitalize">{user.role} role</div>
            </div>
            <button onClick={handleLogout} className="py-1.5 px-3 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-medium rounded flex items-center gap-1 cursor-pointer">
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
