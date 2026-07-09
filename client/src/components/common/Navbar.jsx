import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  Dumbbell,
  Home,
  BarChart3,
  Clock,
  LogOut,
  Menu,
  X,
  User,
  Salad
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

const USER_LINKS = [
  { to: "/dashboard", label: "Home", icon: Home, end: true },
  { to: "/log", label: "Log", icon: Dumbbell },
  { to: "/nutrition", label: "Nutrition", icon: Salad },
  { to: "/progress", label: "Progress", icon: BarChart3 },
  { to: "/workouts", label: "History", icon: Clock },
  { to: "/you", label: "Profile", icon: User }
];

function getInitials(name) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function Navbar({ onLogoutRequest }) {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!user) return null;

  const links = user.role === "admin" ? [] : USER_LINKS;

  const desktopClass = ({ isActive }) =>
    `h-14 flex items-center gap-2 font-black uppercase tracking-[0.22em] text-[12px] transition-all cursor-pointer ${isActive ? "text-primary" : "text-muted hover:text-text"
    }`;

  const mobileClass = ({ isActive }) =>
    `w-full text-left py-2 px-3 rounded-full font-medium flex items-center gap-2 uppercase tracking-widest ${isActive ? "bg-primary text-white" : "text-muted hover:text-text hover:bg-bg"
    }`;

  const showGlass = isScrolled || isMobileMenuOpen;

  return (
    <nav
      className={`fixed top-4 left-0 right-0 z-40 mx-auto max-w-[1400px] w-[calc(100%-2rem)] md:w-[calc(100%-4rem)] lg:w-[calc(100%-6rem)] rounded-[2.25rem] border transition-all duration-300 ${
        showGlass
          ? "border-border/40 bg-surface/95 backdrop-blur-2xl supports-[backdrop-filter]:bg-surface/75 shadow-xl shadow-black/20"
          : "border-transparent bg-transparent shadow-none backdrop-blur-none"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-7 lg:px-8">
        <div className="flex justify-between h-[72px] items-center">
          <div className="flex items-center gap-2.5">
            <img
              src="/brand/fitsync-logo.png"
              alt="FitSync logo"
              className="h-9 w-9 rounded-lg object-contain"
            />
            <span className="font-display tracking-tight text-xl lg:text-2xl font-black text-primary select-none">
              FITSYNC.
            </span>
          </div>

          <div className="hidden xl:flex items-center justify-center space-x-7 lg:space-x-8 flex-1 mx-6">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={desktopClass}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </div>

          <div className="hidden xl:flex items-center gap-5 border-l border-border/30 pl-5 font-sans text-xs">
            <div className="text-right">
              <div className="font-black text-text line-clamp-1 text-[14px] leading-tight">{user.name}</div>
              <div className="text-[9px] uppercase font-mono tracking-widest text-muted mt-1">
                {user.role} ACCOUNT
              </div>
            </div>

            <div className="h-10 w-10 rounded-full bg-primary text-primary-contrast font-black text-sm flex items-center justify-center select-none shrink-0 shadow-lg shadow-primary/20">
              {getInitials(user.name)}
            </div>

            <ThemeToggle />

            <button
              type="button"
              onClick={onLogoutRequest}
              aria-label="Log out"
              title="Log out"
              className="h-10 w-10 rounded-full bg-surface border border-border/40 text-muted hover:text-text hover:border-primary flex items-center justify-center transition-all cursor-pointer shrink-0"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>

          <div className="flex items-center xl:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              className="h-10 w-10 text-muted hover:text-text flex items-center justify-center rounded-full hover:bg-surface"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="xl:hidden bg-surface border-t border-border/40 px-6 py-4 space-y-1 font-sans text-xs rounded-b-[2rem]">
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
          <div className="pt-4 border-t border-border/30 flex items-center justify-between">
            <div>
              <div className="font-semibold text-text">{user.name}</div>
              <div className="text-[10px] text-muted capitalize">{user.role} role</div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onLogoutRequest) onLogoutRequest();
                }}
                className="py-1.5 px-3 bg-transparent border border-border/40 text-text font-medium rounded-full flex items-center gap-1 cursor-pointer hover:border-primary"
              >
                <LogOut className="h-3.5 w-3.5" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
