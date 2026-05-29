import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * 404 page for unknown routes.
 */
export default function NotFound() {
  const { user } = useAuth();
  const homePath = user ? (user.role === "admin" ? "/admin/dashboard" : "/dashboard") : "/login";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-[#E0E0E0] px-4 text-center">
      <div className="space-y-4 max-w-sm">
        <Compass className="h-10 w-10 text-emerald-400 mx-auto" aria-hidden="true" />
        <h1 className="text-4xl font-serif italic font-bold text-white">404</h1>
        <p className="text-sm text-white/50 leading-relaxed">
          We couldn&apos;t find that page. It may have moved or never existed.
        </p>
        <Link
          to={homePath}
          className="inline-block px-5 py-2 bg-white text-black rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-neutral-200 transition-all"
        >
          Back to safety
        </Link>
      </div>
    </div>
  );
}
