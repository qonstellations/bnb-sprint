import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { normalizeApiError } from "../lib/errors.js";
import { toast } from "../lib/toast.js";
import { Button, Card, Input } from "../components/ui.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!email || password.length < 6) {
      setError("Enter a valid email and a 6+ character password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await register({ email, password });
      toast.success("Account created. Welcome to paper trading.");
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
      <h1 className="text-2xl font-bold text-white">Create account</h1>
      <p className="mt-1 text-sm text-slate-400">Start with virtual cash. No real money involved.</p>
      <Card className="mt-6">
        <form onSubmit={onSubmit} className="space-y-3">
          <Input type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password (6+ chars)"
              autoComplete="new-password"
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
            {loading ? "Creating…" : "Register"}
          </Button>
        </form>
        <p className="mt-3 text-xs text-slate-400">
          Have an account? <Link to="/login" className="rounded text-indigo-300 underline focus-visible:outline-2 focus-visible:outline-indigo-500">Log in</Link>
        </p>
      </Card>
    </div>
  );
}
