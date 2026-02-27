import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { canUseSameOriginProxy } from "@/lib/networkProxy";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

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

    try {
      const direct = await supabase.auth.signInWithPassword({ email, password });
      if (!direct.error) {
        navigate("/admin");
        return;
      }

      const looksLikeNetworkIssue = /failed to fetch|networkerror|load failed/i.test(
        direct.error.message || ""
      );

      if (!looksLikeNetworkIssue || !canUseSameOriginProxy()) {
        setError("Invalid credentials");
        return;
      }

      const response = await fetch("/api/auth/token?grant_type=password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.access_token || !payload?.refresh_token) {
        setError("Invalid credentials");
        return;
      }

      await supabase.auth.setSession({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
      });

      navigate("/admin");
    } catch {
      setError("Network blocked on this connection. Please retry from your company domain.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-card border border-border rounded-xl shadow-lg p-8 space-y-6"
      >
        <div className="text-center space-y-1">
          <h1 className="text-xl font-heading font-bold text-primary">Admin Login</h1>
          <p className="text-sm text-muted-foreground font-body">Dominica News Online</p>
        </div>
        {error && (
          <p className="text-sm text-destructive text-center font-body">{error}</p>
        )}
        <div className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          <LogIn className="h-4 w-4 mr-2" />
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </div>
  );
};

export default AdminLoginPage;

