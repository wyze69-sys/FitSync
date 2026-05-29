import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Dumbbell,
  Scale,
  Sparkles,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  UserCog
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

const USER_LINKS = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/workouts", label: "Workouts", icon: Dumbbell },
  { to: "/progress", label: "Progress", icon: Scale },
  { to: "/insights", label: "AI Insights", icon: Sparkles },
  { to: "/profile", label: "Profile", icon: UserCog }
];

const ADMIN_LINKS = [{ to: "/admin", label: "Admin Controls", icon: ShieldCheck }];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return null;

  const links = user.role === "admin" ? ADMIN_LINKS : USER_LINKS;

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const desktopClass = ({ isActive }) =>
    `h-16 flex items-center gap-1.5 border-b-2 font-semibold transition-all cursor-pointer ${
      isActive ? "text-white border-white" : "border-transparent text-white/50 hover:text-white"
    }`;

  const mobileClass = ({ isActive }) =>
    `w-full text-left py-2 px-3 rounded font-medium flex items-center gap-2 uppercase tracking-widest ${
      isActive ? "bg-white/10 text-white font-bold" : "text-white/60 hover:bg-white/5"
    }`;

  return (
    <nav className="bg-[#0A0A0A] border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-white/5 border border-white/10 rounded flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-emerald-400" aria-hidden="true" />
            </div>
            <span className="font-serif tracking-tight italic text-xl font-bold text-white select-none">
              FitSync
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-6 text-xs uppercase tracking-widest font-sans">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={desktopClass}>
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4 border-l border-white/10 pl-4 font-sans text-xs">
            <div className="text-right">
              <div className="font-semibold text-white line-clamp-1">{user.name}</div>
              <div className="text-[9px] uppercase font-mono tracking-widest text-white/40 capitalize">
                {user.role} Account
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className="h-8 w-8 rounded bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 flex items-center justify-center transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              className="h-10 w-10 text-white/70 hover:text-white flex items-center justify-center rounded hover:bg-white/5"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0A0A0A] border-t border-white/10 px-4 py-3 space-y-1 font-sans text-xs">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={mobileClass}
            >
              <Icon className="h-4 w-4" aria-hidden="true" /> {label}
            </NavLink>
          ))}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <div>
              <div className="font-semibold text-white">{user.name}</div>
              <div className="text-[10px] text-white/40 capitalize">{user.role} role</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="py-1.5 px-3 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-medium rounded flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
