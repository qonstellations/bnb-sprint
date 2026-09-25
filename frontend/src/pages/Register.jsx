import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { normalizeApiError } from "../lib/errors.js";
import { Button, Card, Input } from "../components/ui.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <h1 className="text-2xl font-bold">Create account</h1>
      <Card className="mt-6">
        <form onSubmit={onSubmit} className="space-y-3">
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" placeholder="Password (6+ chars)" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error ? <p className="text-xs text-rose-300">{error}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating…" : "Register"}
          </Button>
        </form>
        <p className="mt-3 text-xs text-slate-400">
          Have an account? <Link to="/login" className="text-indigo-300 underline">Log in</Link>
        </p>
      </Card>
    </div>
  );
}
