import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
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
    <div className="min-h-svh flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <PumpkinLogo className="w-12 h-12 text-primary" />
          <h1 className="text-3xl font-bold text-white">Pumpin</h1>
        </div>

        <div className="bg-surface rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-light border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-light border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-danger text-sm text-center">{error}</p>
            )}
            {confirmMessage && (
              <p className="text-success text-sm text-center">
                {confirmMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-4">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setConfirmMessage("");
              }}
              className="text-primary hover:text-primary-light transition"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
