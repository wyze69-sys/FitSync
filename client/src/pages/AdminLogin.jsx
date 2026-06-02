import { useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Internal admin login page.
 *
 * Reuses the existing /api/auth/login endpoint (no separate admin API or token).
 * If the authenticated account is not an admin, it is immediately logged out and
 * an error is shown. This page is intentionally not linked from the public
 * login/register pages — note that this is UX separation, NOT a security
 * boundary. The real protection is the backend `requireAdmin` middleware.
 */
export default function AdminLogin() {
  const { user, loading, login, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // An already-authenticated admin skips the form.
  if (!loading && user && user.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const account = await login(email, password);
      if (account.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        // Valid credentials but not an admin: drop the session and refuse access.
        logout();
        setError("This account does not have administrator access.");
        setPassword("");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function fillAdminDemo() {
    setEmail("admin@fitsync.com");
    setPassword("admin123");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg text-text px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-surface p-8 border border-border rounded-sm">
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-sm border border-border bg-bg flex items-center justify-center text-accent">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Admin Portal</h1>
          <p className="text-xs text-muted uppercase tracking-widest leading-relaxed">
            Internal management access
          </p>
        </div>

        <div className="p-4 rounded-sm border border-border bg-bg space-y-2.5">
          <div className="text-[10px] font-semibold text-muted font-mono uppercase tracking-[0.22em]">
            Demo admin account
          </div>
          <button
            type="button"
            onClick={fillAdminDemo}
            className="w-full py-1.5 px-3 rounded-sm text-[10px] font-medium uppercase tracking-wider border border-border bg-transparent hover:border-accent text-text transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="h-1.5 w-1.5 rounded-sm bg-accent" />
            Use admin demo
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="bg-red-950/45 border border-red-900/40 text-red-200 text-xs text-left p-3.5 rounded-sm font-medium flex items-start gap-2"
          >
            <span className="font-bold uppercase tracking-wider font-mono text-[10px]">Error:</span>
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-5 text-left" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="admin-email"
              className="block text-[10px] font-semibold text-muted uppercase tracking-widest mb-1.5 font-mono"
            >
              Admin Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                <Mail className="h-4 w-4" aria-hidden="true" />
              </div>
              <input
                id="admin-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@fitsync.com"
                className="block w-full pl-9 pr-4 py-2 bg-bg border border-border rounded-sm focus:border-accent text-sm placeholder-muted/60 text-text transition-all font-sans focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-[10px] font-semibold text-muted uppercase tracking-widest mb-1.5 font-mono"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                <Lock className="h-4 w-4" aria-hidden="true" />
              </div>
              <input
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="block w-full pl-9 pr-10 py-2 bg-bg border border-border rounded-sm focus:border-accent text-sm placeholder-muted/60 text-text transition-all font-sans focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((show) => !show)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-text transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-accent text-black rounded-sm text-xs font-medium uppercase tracking-widest active:scale-[0.99] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign in to admin</span>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link
            to="/login"
            className="text-xs font-semibold text-muted hover:text-text transition-all underline underline-offset-4"
          >
            Return to user login
          </Link>
        </div>
      </div>
    </div>
  );
}
