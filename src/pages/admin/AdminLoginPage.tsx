import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

const FALLBACK_ADMIN_LOGIN_ID = "admin@dominicanews.com";
const FALLBACK_ADMIN_PASSWORD = "LWSHIIORZAXA";

const ENV_LOGIN_ID =
  (import.meta.env.VITE_ADMIN_LOGIN_ID ?? import.meta.env.VITE_ADMIN_EMAIL ?? FALLBACK_ADMIN_LOGIN_ID).trim();
const ENV_PASSWORD = (import.meta.env.VITE_ADMIN_PASSWORD ?? FALLBACK_ADMIN_PASSWORD).trim();

const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const normalizedInputId = email.trim().toLowerCase();
    const normalizedEnvId = ENV_LOGIN_ID.toLowerCase();
    const normalizedInputPassword = password.trim();

    if (normalizedInputId === normalizedEnvId && normalizedInputPassword === ENV_PASSWORD) {
      sessionStorage.setItem("admin_authenticated", "true");
      navigate("/admin");
    } else {
      setError("Invalid credentials.");
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
        <Button type="submit" className="w-full">
          <LogIn className="h-4 w-4 mr-2" />
          Sign In
        </Button>
      </form>
    </div>
  );
};

export default AdminLoginPage;

