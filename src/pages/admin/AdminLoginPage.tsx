import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogIn, Shield } from "lucide-react";
import dominicaLogo from "@/assets/dominica_logo.png";

const FALLBACK_ADMIN_LOGIN_ID = "admin@dominicanews.com";
const FALLBACK_ADMIN_PASSWORD = "LWSHIIORZAXA";

const ENV_LOGIN_ID =
  (import.meta.env.VITE_ADMIN_LOGIN_ID ?? import.meta.env.VITE_ADMIN_EMAIL ?? FALLBACK_ADMIN_LOGIN_ID).trim();
const ENV_PASSWORD = (import.meta.env.VITE_ADMIN_PASSWORD ?? FALLBACK_ADMIN_PASSWORD).trim();

const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Small delay for UX feedback
    await new Promise((r) => setTimeout(r, 400));

    const normalizedInputId = email.trim().toLowerCase();
    const normalizedEnvId = ENV_LOGIN_ID.toLowerCase();
    const normalizedInputPassword = password.trim();

    if (normalizedInputId === normalizedEnvId && normalizedInputPassword === ENV_PASSWORD) {
      sessionStorage.setItem("admin_authenticated", "true");
      navigate("/admin");
    } else {
      setError("Invalid credentials. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
        backgroundSize: '32px 32px',
      }} />

      <div className="w-full max-w-sm mx-4 relative z-10">
        {/* Logo + Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/10">
            <img src={dominicaLogo} alt="Dominica News" className="h-8 w-8 object-contain" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground font-body mt-1.5">Sign in to manage your newsroom</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-card border border-border/60 rounded-2xl shadow-card p-7 space-y-5"
        >
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/8 border border-destructive/15">
              <Shield className="h-4 w-4 text-destructive flex-shrink-0" />
              <p className="text-[13px] text-destructive font-body font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-body font-semibold text-foreground mb-2">Email</label>
              <Input
                type="email"
                placeholder="admin@dominicanews.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl border-border/60 bg-muted/20 focus:bg-card transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-[13px] font-body font-semibold text-foreground mb-2">Password</label>
              <Input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl border-border/60 bg-muted/20 focus:bg-card transition-colors"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Sign In
              </span>
            )}
          </Button>
        </form>

        <p className="text-center text-[11px] text-muted-foreground/40 font-body mt-6 tracking-wide">
          Dominica News CMS · Editorial Platform
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;
