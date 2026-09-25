import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { normalizeApiError } from "../lib/errors.js";
import { toast } from "../lib/toast.js";
import { Badge, Button, Card, Input } from "../components/ui.jsx";

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login({ email, password });
      toast.success("Welcome back.");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = normalizeApiError(err).message;
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm px-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-white">StockPulse</h1>
        <Badge tone="info">Paper</Badge>
      </div>
      <p className="mt-1 text-sm text-slate-400">Paper trading with virtual money. No real funds.</p>
      {USE_MOCKS ? (
        <p className="mt-3 rounded-lg border border-indigo-900 bg-indigo-950/50 px-3 py-2 text-xs text-indigo-200">
          Demo mode (mocks on) — any email + password works.
        </p>
      ) : null}
      <Card className="mt-6">
        <form onSubmit={onSubmit} className="space-y-3">
          <Input type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Password"
              className="pr-16"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-pressed={showPassword}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-slate-400 hover:text-white focus-visible:outline-2 focus-visible:outline-indigo-500"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {error ? <p role="alert" className="text-xs text-rose-300">{error}</p> : null}
          <Button type="submit" disabled={loading} className="min-h-11 w-full">
            {loading ? "Signing in…" : "Log in"}
          </Button>
        </form>
        <p className="mt-3 text-xs text-slate-400">
          No account? <Link to="/register" className="rounded text-indigo-300 underline focus-visible:outline-2 focus-visible:outline-indigo-500">Register</Link>
        </p>
      </Card>
    </div>
  );
}
