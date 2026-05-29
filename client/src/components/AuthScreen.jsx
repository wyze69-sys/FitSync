import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Lock, Mail, User as UserIcon, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Authentication screen handling both sign in and registration.
 * Uses the auth context (which calls the centralized service layer) and routes
 * the user to the correct home after success.
 */
export default function AuthScreen({ defaultMode = "login" }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(defaultMode !== "register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const account = isLogin
        ? await login(email, password)
        : await register(email, password, name);
      navigate(account.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function fillCredentials(type) {
    if (type === "user") {
      setEmail("user@fitsync.com");
      setPassword("fitness123");
    } else {
      setEmail("admin@fitsync.com");
      setPassword("admin123");
    }
    setIsLogin(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-[#E0E0E0] px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[#0E0E0E] p-8 border border-white/10 rounded-sm shadow-2xl">
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded border border-white/15 bg-white/5 flex items-center justify-center text-white">
            <Dumbbell className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-serif italic tracking-tight text-white">FitSync</h1>
          <p className="text-xs text-white/40 uppercase tracking-widest leading-relaxed">
            {isLogin ? "Sign in to continue tracking" : "Create your FitSync profile"}
          </p>
        </div>

        <div className="p-4 rounded border border-white/5 bg-white/[0.02] space-y-2.5">
          <div className="text-[10px] font-semibold text-white/30 font-mono uppercase tracking-[0.22em]">
            Demo accounts
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => fillCredentials("user")}
              className="flex-1 py-1.5 px-3 rounded-sm text-[10px] font-bold uppercase tracking-wider border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              User Account
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("admin")}
              className="flex-1 py-1.5 px-3 rounded-sm text-[10px] font-bold uppercase tracking-wider border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              Admin Account
            </button>
          </div>
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
          {!isLogin && (
            <div>
              <label
                htmlFor="name-input"
                className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/30">
                  <UserIcon className="h-4 w-4" aria-hidden="true" />
                </div>
                <input
                  id="name-input"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Sarah Coleman"
                  className="block w-full pl-9 pr-4 py-2 bg-[#080808] border border-white/10 rounded-sm focus:bg-black focus:border-white text-sm placeholder-white/20 text-white transition-all font-sans focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="email-input"
              className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/30">
                <Mail className="h-4 w-4" aria-hidden="true" />
              </div>
              <input
                id="email-input"
                name="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="user@fitsync.com"
                className="block w-full pl-9 pr-4 py-2 bg-[#080808] border border-white/10 rounded-sm focus:bg-black focus:border-white text-sm placeholder-white/20 text-white transition-all font-sans focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password-input"
              className="block text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/30">
                <Lock className="h-4 w-4" aria-hidden="true" />
              </div>
              <input
                id="password-input"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="block w-full pl-9 pr-10 py-2 bg-[#080808] border border-white/10 rounded-sm focus:bg-black focus:border-white text-sm placeholder-white/20 text-white transition-all font-sans focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((show) => !show)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/30 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-white text-black rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-white/90 active:scale-[0.99] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{isLogin ? "Signing in..." : "Creating account..."}</span>
              </>
            ) : (
              <span>{isLogin ? "Sign In" : "Create Account"}</span>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => {
              setIsLogin((value) => !value);
              setError(null);
            }}
            className="text-xs font-semibold text-white/50 hover:text-white transition-all underline underline-offset-4 cursor-pointer"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}
