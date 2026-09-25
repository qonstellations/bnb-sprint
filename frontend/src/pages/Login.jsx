import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { normalizeApiError } from "../lib/errors.js";
import { Button, Card, Input } from "../components/ui.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <h1 className="text-2xl font-bold">StockPulse</h1>
      <p className="mt-1 text-sm text-slate-400">Paper trading with virtual money.</p>
      <Card className="mt-6">
        <form onSubmit={onSubmit} className="space-y-3">
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error ? <p className="text-xs text-rose-300">{error}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in…" : "Log in"}
          </Button>
        </form>
        <p className="mt-3 text-xs text-slate-400">
          No account? <Link to="/register" className="text-indigo-300 underline">Register</Link>
        </p>
      </Card>
    </div>
  );
}
