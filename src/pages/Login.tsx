import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import chatSphereBg from "@/assets/chat-sphere-bg.jpg";
import chatSphereLogo from "@/assets/chatsphere-logo.png";

const Login = () => {
  const { signIn, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/chat" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) setError(error.message);
    setSubmitting(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden" style={{ background: "hsl(var(--auth-bg))" }}>
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img src={chatSphereBg} alt="" className="h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 0%, hsl(var(--auth-bg)) 70%)" }} />
      </div>

      {/* Floating glow effects */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-72 w-72 rounded-full opacity-20 blur-[100px]" style={{ background: "hsl(var(--auth-glow))" }} />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-56 w-56 rounded-full opacity-15 blur-[80px]" style={{ background: "hsl(210, 100%, 55%)" }} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div
          className="rounded-2xl border p-8 shadow-2xl backdrop-blur-xl"
          style={{
            background: "hsl(var(--auth-card) / 0.8)",
            borderColor: "hsl(var(--auth-card-border))",
          }}
        >
          {/* Logo & branding */}
          <div className="mb-8 flex flex-col items-center">
            <img src={chatSphereLogo} alt="ChatSphere" className="mb-4 h-16 w-16 drop-shadow-lg" />
            <h1 className="font-display text-3xl font-bold tracking-tight" style={{ color: "hsl(0, 0%, 95%)" }}>
              Chat<span style={{ color: "hsl(var(--auth-glow))" }}>Sphere</span>
            </h1>
            <p className="mt-2 text-sm" style={{ color: "hsl(0, 0%, 55%)" }}>
              Welcome back — sign in to continue
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "hsl(0, 0%, 50%)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="h-12 w-full rounded-xl border px-4 text-sm outline-none transition-all focus:ring-2"
                style={{
                  background: "hsl(var(--auth-input-bg))",
                  borderColor: "hsl(var(--auth-input-border))",
                  color: "hsl(0, 0%, 90%)",
                  "--tw-ring-color": "hsl(var(--auth-glow) / 0.4)",
                } as React.CSSProperties}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "hsl(0, 0%, 50%)" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="h-12 w-full rounded-xl border px-4 pr-12 text-sm outline-none transition-all focus:ring-2"
                  style={{
                    background: "hsl(var(--auth-input-bg))",
                    borderColor: "hsl(var(--auth-input-border))",
                    color: "hsl(0, 0%, 90%)",
                    "--tw-ring-color": "hsl(var(--auth-glow) / 0.4)",
                  } as React.CSSProperties}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
                  style={{ color: "hsl(0, 0%, 45%)" }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:shadow-[hsl(var(--auth-glow))/0.2] disabled:opacity-50"
              style={{ background: "var(--gradient-brand)", color: "hsl(0, 0%, 100%)" }}
            >
              {submitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: "hsl(var(--auth-card-border))" }} />
            <span className="text-xs" style={{ color: "hsl(0, 0%, 40%)" }}>or</span>
            <div className="h-px flex-1" style={{ background: "hsl(var(--auth-card-border))" }} />
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm" style={{ color: "hsl(0, 0%, 50%)" }}>
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold transition-colors hover:underline" style={{ color: "hsl(var(--auth-glow))" }}>
              Create one
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs" style={{ color: "hsl(0, 0%, 35%)" }}>
          Secure · Encrypted · Real-time
        </p>
      </div>
    </div>
  );
};

export default Login;
