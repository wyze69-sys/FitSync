import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Trophy,
  Utensils,
  User as UserIcon,
  Users
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Authentication screen handling both sign in and registration.
 * Uses the auth context (which calls the centralized service layer) and routes
 * the user to the correct home after success.
 */
export default function AuthScreen({ defaultMode = "login", onAuthSuccess }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(defaultMode !== "register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
      if (onAuthSuccess) {
        onAuthSuccess(account);
      } else {
        navigate(account.role === "admin" ? "/admin" : "/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function fillCredentials() {
    setEmail("user@fitsync.com");
    setPassword("fitness123");
    setIsLogin(true);
    setError(null);
  }

  function handleGooglePlaceholder() {
    setError("Google sign-in is not connected yet. Use email or the demo account for now.");
  }

  const heading = isLogin ? "Welcome Back!" : "Create Account";
  const subtitle = isLogin
    ? "Sign in to continue your fitness journey."
    : "Create your FitSync profile and start tracking today.";

  return (
    <main className="relative h-screen overflow-hidden bg-[#eef8f1] text-[#11151d]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.96),rgba(255,255,255,0.52)_34%,transparent_62%),radial-gradient(circle_at_75%_24%,rgba(55,148,113,0.18),transparent_36%),linear-gradient(120deg,#f7fbf7_0%,#e9f5ee_46%,#d7efe4_100%)]" />
      <div className="absolute -left-32 top-10 h-[720px] w-[720px] rounded-full border border-white/60 bg-white/20" />
      <div className="absolute left-[45%] top-[-10%] h-[980px] w-[980px] rounded-full border border-emerald-900/5 bg-emerald-700/5" />
      <div className="absolute bottom-[-18rem] left-12 h-[34rem] w-[34rem] rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute right-0 top-0 h-full w-1/2 bg-[linear-gradient(135deg,rgba(255,255,255,0.28),rgba(35,136,100,0.1))] [clip-path:polygon(18%_0,100%_0,100%_100%,0_78%)]" />

      <section className="relative z-10 grid h-screen grid-cols-1 items-center gap-5 px-5 py-3 sm:px-8 lg:grid-cols-[1.03fr_0.97fr] lg:px-12 xl:px-16">
        <aside className="relative hidden h-[calc(100vh-1.5rem)] min-h-0 flex-col justify-between overflow-hidden py-5 lg:flex">
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-4">
              <img
                src="/brand/fitsync-logo.png"
                alt="FitSync logo"
                className="h-12 w-12 rounded-xl object-contain"
              />
              <span className="text-3xl font-black tracking-[-0.04em] text-[#10141c]">FitSync</span>
            </div>

            <div className="max-w-3xl space-y-4">
              <h1 className="max-w-4xl text-[clamp(3.4rem,5.8vw,5.8rem)] font-black leading-[0.98] tracking-[-0.065em] text-[#11151d]">
                Your Fitness,
                <span className="block text-[#2f8e6c]">Synchronized.</span>
              </h1>
            </div>
          </div>

          <div className="relative z-10 -translate-y-40 grid max-w-2xl gap-6 pb-1">
            <FeaturePill
              icon={Activity}
              title="Smart workout tracking"
            />
            <FeaturePill
              icon={Utensils}
              title="Nutrition insights"
            />
            <FeaturePill
              icon={Trophy}
              title="Achievements & goals"
            />
          </div>

          <DecorativeGear />
        </aside>

        <section className="mx-auto w-full max-w-[430px] rounded-[32px] border border-white/50 bg-[#ccd6cd]/30 p-6 shadow-[0_24px_70px_rgba(20,69,51,0.12),inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-xl md:p-8">
          <div className="w-full">
            {/* Top brand header */}
            <div className="flex items-center justify-between mb-5 px-1">
              <div className="flex items-center gap-2">
                <img
                  src="/brand/fitsync-logo.png"
                  alt="FitSync logo"
                  className="h-7 w-7 rounded-lg object-contain"
                />
                <span className="text-sm font-black tracking-tight text-[#10141c]">FitSync</span>
              </div>
              <a href="/" className="text-xs font-semibold text-[#556b5c] hover:text-[#2d9271] transition duration-200">
                &larr; Back home
              </a>
            </div>

            {/* Segmented toggle */}
            <div className="bg-[#8ba393]/20 p-1 rounded-full flex w-full mb-6">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs md:text-sm font-semibold rounded-full transition-all duration-200 ${
                  isLogin
                    ? "bg-white text-[#1b2e22] shadow-sm"
                    : "text-[#556b5c]/80 hover:text-[#1b2e22]"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs md:text-sm font-semibold rounded-full transition-all duration-200 ${
                  !isLogin
                    ? "bg-white text-[#1b2e22] shadow-sm"
                    : "text-[#556b5c]/80 hover:text-[#1b2e22]"
                }`}
              >
                Create account
              </button>
            </div>

            {/* Heading */}
            <h2 className="text-[28px] md:text-[32px] font-black leading-[1.1] tracking-tight text-[#1b2e22] mb-6 whitespace-pre-line">
              {isLogin
                ? "Welcome back.\nPick up where you left off."
                : "Create account.\nStart your FitSync journey."}
            </h2>

            {/* Google Button */}
            <button
              type="button"
              onClick={handleGooglePlaceholder}
              className="w-full flex h-11 items-center justify-center gap-2.5 rounded-full border border-[#8ba393]/30 bg-[#8ba393]/15 hover:bg-[#8ba393]/25 text-sm font-semibold text-[#1b2e22] transition duration-200"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <Divider label="or email" />

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="mb-4 rounded-2xl border border-red-200 bg-red-50/70 p-3 text-xs font-semibold text-red-800"
              >
                <span className="font-bold">Error:</span> {error}
              </div>
            )}

            {/* Auth Form */}
            <form className="space-y-3 text-left" onSubmit={handleSubmit}>
              {!isLogin && (
                <AuthField label="Full name" htmlFor="name-input">
                  <UserIcon className="h-5 w-5 text-[#556b5c]" aria-hidden="true" />
                  <input
                    id="name-input"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="FULL NAME"
                    className="w-full bg-transparent text-sm font-semibold tracking-wide text-[#1b2e22] outline-none placeholder:text-[#556b5c]/50 placeholder:text-xs placeholder:tracking-[0.12em] placeholder:font-bold placeholder:uppercase"
                  />
                </AuthField>
              )}

              <AuthField label="Email" htmlFor="email-input">
                <Mail className="h-5 w-5 text-[#556b5c]" aria-hidden="true" />
                <input
                  id="email-input"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="EMAIL"
                  className="w-full bg-transparent text-sm font-semibold tracking-wide text-[#1b2e22] outline-none placeholder:text-[#556b5c]/50 placeholder:text-xs placeholder:tracking-[0.12em] placeholder:font-bold placeholder:uppercase"
                />
              </AuthField>

              <AuthField label="Password" htmlFor="password-input">
                <Lock className="h-5 w-5 text-[#556b5c]" aria-hidden="true" />
                <input
                  id="password-input"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="PASSWORD"
                  className="w-full bg-transparent text-sm font-semibold tracking-wide text-[#1b2e22] outline-none placeholder:text-[#556b5c]/50 placeholder:text-xs placeholder:tracking-[0.12em] placeholder:font-bold placeholder:uppercase"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((show) => !show)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="shrink-0 rounded-full p-1 text-[#556b5c] transition hover:text-[#2d9271] focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </AuthField>

              {isLogin && (
                <div className="flex items-center justify-between gap-4 px-1 text-xs text-[#556b5c]">
                  <label className="flex cursor-pointer select-none items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="rounded border-[#8ba393]/40 text-[#2d9271] focus:ring-[#2d9271]/30 h-4 w-4 bg-white/50"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setError("Password reset is not connected yet. Ask your admin or use the demo account.")}
                    className="font-medium hover:text-[#2d9271] transition"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-2 rounded-full bg-gradient-to-r from-[#326ff8] to-[#164ac7] hover:from-[#225df5] hover:to-[#0f3eb3] text-sm font-bold text-white shadow-md shadow-blue-600/10 transition duration-200 flex items-center justify-center gap-1.5 focus:outline-none focus:ring-4 focus:ring-blue-500/25 disabled:opacity-70 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{isLogin ? "SIGNING IN..." : "CREATING ACCOUNT..."}</span>
                  </>
                ) : (
                  <>
                    <span>{isLogin ? "Sign in" : "Create account"}</span>
                    <span className="text-base font-normal">&rarr;</span>
                  </>
                )}
              </button>
            </form>

            {/* Demo Account Option */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={fillCredentials}
                className="text-xs font-semibold text-[#2d9271] hover:text-[#1f6e52] hover:underline transition duration-200"
              >
                Or use demo account credentials
              </button>
            </div>

            {/* Bottom Note */}
            <p className="mt-6 text-center text-[11px] leading-relaxed text-[#556b5c]">
              Your workouts, nutrition, and progress stay connected to your account.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

function AuthField({ label, htmlFor, children }) {
  return (
    <div className="w-full">
      <label htmlFor={htmlFor} className="sr-only">
        {label}
      </label>
      <div className="flex h-11 items-center gap-3 rounded-full border border-[#8ba393]/30 bg-[#8ba393]/12 px-4 transition-all duration-200 focus-within:border-[#2d9271]/50 focus-within:bg-[#8ba393]/18 focus-within:ring-2 focus-within:ring-[#2d9271]/20">
        {children}
      </div>
    </div>
  );
}

function Divider({ label }) {
  return (
    <div className="flex items-center gap-4 my-4">
      <span className="h-[1px] flex-1 bg-[#8ba393]/30" />
      <span className="text-[10px] font-bold tracking-[0.15em] text-[#556b5c] uppercase">{label}</span>
      <span className="h-[1px] flex-1 bg-[#8ba393]/30" />
    </div>
  );
}

function FeaturePill({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/45 text-[#2f8e6c] shadow-inner shadow-white/70">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-lg font-black tracking-[-0.035em] text-[#11151d]">{title}</h3>
      </div>
    </div>
  );
}

function DecorativeGear() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-0 z-0 h-64 w-[52rem] opacity-55">
      <div className="absolute bottom-0 left-0 h-28 w-72 rounded-[2rem] bg-[linear-gradient(135deg,#73bb9c,#2d9271)] shadow-[inset_12px_12px_26px_rgba(255,255,255,0.22),inset_-16px_-16px_28px_rgba(0,70,43,0.18)]" />
      <div className="absolute bottom-12 left-52 h-28 w-72 rounded-[2rem] bg-[linear-gradient(135deg,#76c3a2,#307f64)] shadow-[inset_12px_12px_26px_rgba(255,255,255,0.22),inset_-16px_-16px_28px_rgba(0,70,43,0.18)]" />
      <div className="absolute bottom-2 left-[34rem] h-52 w-28 rounded-[2rem] bg-[linear-gradient(135deg,#93d0b7,#3a8a6b)] shadow-[inset_10px_10px_22px_rgba(255,255,255,0.24),inset_-16px_-16px_28px_rgba(0,70,43,0.22)]" />
      <div className="absolute bottom-0 left-[44rem] h-32 w-80 rounded-full border-[18px] border-[#4a9d79] bg-[#b3ddca] shadow-[inset_14px_8px_24px_rgba(0,64,40,0.16)]" />
    </div>
  );
}
