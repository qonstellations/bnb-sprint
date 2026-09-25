import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { AlertTriangle, Eye, EyeOff, Zap } from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";
import { normalizeApiError } from "../lib/errors.js";
import { toast } from "../lib/toast.js";
import { fadeUp, staggerParent } from "../lib/motion.js";
import { Button, Card, Input } from "../components/ui.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
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
    <motion.div
      variants={staggerParent()}
      initial={reduce ? false : "hidden"}
      animate="show"
      className="mx-auto max-w-sm px-4 py-14"
    >
      <motion.div variants={fadeUp} className="text-center">
        <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-glow">
          <Zap size={20} aria-hidden />
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold text-white">Create account</h1>
        <p className="mt-1 text-sm text-slate-500">Start with virtual cash. No real money involved.</p>
      </motion.div>
      <motion.div variants={fadeUp}>
        <Card className="mt-6">
          <form onSubmit={onSubmit} className="space-y-3">
            <Input
              label="Email"
              id="register-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="relative">
              <Input
                label="Password"
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password (6+ chars)"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-indigo-500"
              >
                {showPassword ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
              </button>
            </div>
            {error ? (
              <p role="alert" className="flex items-start gap-1.5 text-xs leading-relaxed text-rose-300">
                <AlertTriangle size={14} aria-hidden className="mt-0.5 shrink-0" />
                {error}
              </p>
            ) : null}
            <Button type="submit" loading={loading} className="min-h-11 w-full">
              {loading ? "Creating…" : "Register"}
            </Button>
          </form>
          <p className="mt-3 text-center text-xs text-slate-500">
            Have an account?{" "}
            <Link to="/login" className="rounded font-medium text-indigo-300 underline-offset-4 hover:text-indigo-200 hover:underline focus-visible:outline-2 focus-visible:outline-indigo-500">
              Log in
            </Link>
          </p>
        </Card>
      </motion.div>
    </motion.div>
  );
}
