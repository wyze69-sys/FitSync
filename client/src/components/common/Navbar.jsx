import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Dumbbell,
  Scale,
  Home,
  LayoutDashboard,
  Users,
  Layers,
  BarChart3,
  LogOut,
  Menu,
  X,
  UserCog
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

const USER_LINKS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/log", label: "Log", icon: Dumbbell },
  { to: "/progress", label: "Progress", icon: Scale },
  { to: "/you", label: "You", icon: UserCog }
];

const ADMIN_LINKS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/categories", label: "Categories", icon: Layers },
  { to: "/admin/statistics", label: "Statistics", icon: BarChart3 }
];

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
      isActive ? "text-text border-accent" : "border-transparent text-muted hover:text-text"
    }`;

  const mobileClass = ({ isActive }) =>
    `w-full text-left py-2 px-3 rounded-sm font-medium flex items-center gap-2 uppercase tracking-widest ${
      isActive ? "bg-accent text-black" : "text-muted hover:text-text hover:bg-bg"
    }`;

  return (
    <nav className="bg-bg border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-surface border border-border rounded-sm flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-accent" aria-hidden="true" />
            </div>
            <span className="tracking-tight text-xl font-semibold text-text select-none">
              FitSync
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-6 text-xs uppercase tracking-widest font-sans">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={desktopClass}>
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4 border-l border-border pl-4 font-sans text-xs">
            <div className="text-right">
              <div className="font-semibold text-text line-clamp-1">{user.name}</div>
              <div className="text-[9px] uppercase font-mono tracking-widest text-muted capitalize">
                {user.role} Account
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className="h-8 w-8 rounded-sm bg-surface border border-border text-muted hover:text-text hover:border-accent flex items-center justify-center transition-all cursor-pointer"
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
              className="h-10 w-10 text-muted hover:text-text flex items-center justify-center rounded-sm hover:bg-surface"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-bg border-t border-border px-4 py-3 space-y-1 font-sans text-xs">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setIsMobileMenuOpen(false)}
              className={mobileClass}
            >
              <Icon className="h-4 w-4" aria-hidden="true" /> {label}
            </NavLink>
          ))}
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <div>
              <div className="font-semibold text-text">{user.name}</div>
              <div className="text-[10px] text-muted capitalize">{user.role} role</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="py-1.5 px-3 bg-transparent border border-border text-text font-medium rounded-sm flex items-center gap-1 cursor-pointer hover:border-accent"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
