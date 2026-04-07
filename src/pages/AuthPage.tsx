import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Lock, Dumbbell, TrendingUp, Trophy } from "lucide-react";
import PumpkinLogo from "../components/PumpkinLogo";

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setConfirmMessage("");
    setLoading(true);

    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    if (error) {
      setError(
        (error as { message?: string }).message ?? "Something went wrong",
      );
    } else if (isSignUp) {
      setConfirmMessage("Check your email to confirm your account!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />
      <div className="auth-bg-orb auth-bg-orb-3" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo with bounce-in animation */}
        <div className="flex justify-center mb-4">
          <div className="auth-logo">
            <PumpkinLogo className="w-32 h-32 text-primary drop-shadow-[0_0_24px_rgba(249,115,22,0.4)]" />
          </div>
        </div>

        {/* Title */}
        <h1 className="auth-title text-4xl font-extrabold text-center text-white tracking-wide mb-1">
          Pumpin
        </h1>

        {/* Tagline */}
        <p className="auth-tagline text-center text-sm text-gray-400 mb-8">
          Track every rep. Crush every goal.
        </p>

        {/* Card */}
        <div className="auth-card glass-elevated rounded-2xl p-6 shadow-lg shadow-primary/5">
          <h2 className="text-lg font-semibold text-white mb-5 text-center">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-light border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary focus:bg-surface-light/80 transition-all"
                placeholder="Email address"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-light border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary focus:bg-surface-light/80 transition-all"
                placeholder="Password"
              />
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
                <p className="text-danger text-sm text-center">{error}</p>
              </div>
            )}
            {confirmMessage && (
              <div className="bg-success/10 border border-success/20 rounded-lg px-3 py-2">
                <p className="text-success text-sm text-center">
                  {confirmMessage}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 btn-gradient btn-gradient-glow active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isSignUp ? "Creating account…" : "Signing in…"}
                </span>
              ) : isSignUp ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-xs text-gray-500">or</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          <p className="text-center text-sm text-gray-400">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setConfirmMessage("");
              }}
              className="text-primary font-medium hover:text-primary-light transition"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>

        {/* Feature hints */}
        <div className="auth-features mt-8 flex justify-center gap-6">
          {[
            { icon: Dumbbell, label: "Track workouts" },
            { icon: TrendingUp, label: "View progress" },
            { icon: Trophy, label: "Beat your PRs" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-full bg-surface-light/80 border border-gray-700/50 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] text-gray-500 font-medium">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
