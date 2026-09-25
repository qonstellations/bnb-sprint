import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { BellRing, Brain, Eye, EyeOff, KeyRound, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";
import { normalizeApiError } from "../lib/errors.js";
import { fadeUp, staggerParent } from "../lib/motion.js";
import { Button, Card, Input } from "../components/ui.jsx";

export const DEMO_EMAIL = "demo@stockpulse.dev";
export const DEMO_PASSWORD = "password";

const TICKER = [
  { symbol: "RELIANCE", price: "₹2,984.50", up: true },
  { symbol: "TCS", price: "₹4,120.75", up: true },
  { symbol: "HDFCBANK", price: "₹1,642.20", up: false },
  { symbol: "INFY", price: "₹1,875.60", up: true },
  { symbol: "TATAMOTORS", price: "₹968.35", up: false },
  { symbol: "SBIN", price: "₹812.45", up: true },
];

const HIGHLIGHTS = [
  { icon: TrendingUp, title: "Paper trading", text: "Practice with ₹1,00,000 virtual cash. Zero risk." },
  { icon: Brain, title: "Sentiment lens", text: "Bullish / Neutral / Bearish signals on every stock." },
  { icon: BellRing, title: "Price alerts", text: "Target & stop-loss rules with instant triggers." },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
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
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }

  function autofillDemo() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError("");
  }

  return (
    <div className="min-h-screen bg-ink-950">
      <style>{`@keyframes ticker-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } } .animate-ticker { animation: ticker-scroll 30s linear infinite; }`}</style>

      {/* Ticker tape */}
      <div className="overflow-hidden border-b border-white/5 bg-white/[0.02] py-2" aria-hidden="true">
        <div className="animate-ticker flex w-max gap-8 whitespace-nowrap text-xs" style={{ animation: "ticker-scroll 30s linear infinite" }}>
          {[...TICKER, ...TICKER].map((t, i) => {
            const Icon = t.up ? TrendingUp : TrendingDown;
            return (
              <span key={i} className="flex items-center gap-2">
                <span className="font-mono font-semibold tabular-nums tnum text-slate-200">{t.symbol}</span>
                <span className="font-mono tabular-nums tnum text-slate-500">{t.price}</span>
                <Icon size={12} className={t.up ? "text-emerald-400" : "text-rose-400"} aria-hidden />
              </span>
            );
          })}
        </div>
      </div>

      <motion.div
        variants={staggerParent()}
        initial={reduce ? false : "hidden"}
        animate="show"
        className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-2 md:py-16"
      >
        {/* Brand panel */}
        <motion.div variants={fadeUp} className="flex flex-col justify-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-glow">
            <Zap size={22} aria-hidden />
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-white">
            Stock<span className="bg-gradient-to-r from-indigo-300 to-emerald-300 bg-clip-text text-transparent">Pulse</span>
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Paper trading with virtual money — learn the market before risking a single rupee.
          </p>
          <ul className="mt-6 space-y-3">
            {HIGHLIGHTS.map((h) => (
              <li
                key={h.title}
                className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:border-white/10"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-indigo-300 ring-1 ring-white/10">
                  <h.icon size={16} aria-hidden />
                </span>
                <span>
                  <span className="block font-display text-sm font-semibold text-white">{h.title}</span>
                  <span className="block text-xs leading-relaxed text-slate-500">{h.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Login card */}
        <motion.div variants={fadeUp} className="flex flex-col justify-center">
          <Card>
            <h2 className="font-display text-lg font-bold text-white">Welcome back</h2>
            <p className="mt-1 text-xs text-slate-500">Log in to your paper-trading account.</p>
            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <Input
                label="Email"
                id="login-email"
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
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-indigo-500"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
                </button>
              </div>
              {error ? <p role="alert" className="text-xs text-rose-300">{error}</p> : null}
              <Button type="submit" loading={loading} className="w-full py-2.5 text-sm">
                {loading ? "Signing in…" : "Log in"}
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-4 rounded-2xl border border-dashed border-indigo-500/25 bg-indigo-500/[0.06] p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-indigo-200">
                <KeyRound size={13} aria-hidden /> Demo credentials
              </p>
              <p className="mt-1.5 font-mono text-xs tabular-nums tnum text-slate-300">
                {DEMO_EMAIL} <span className="text-slate-600">/</span> {DEMO_PASSWORD}
              </p>
              <Button
                type="button"
                variant="ghost"
                onClick={autofillDemo}
                className="mt-2.5 w-full border-indigo-500/25 py-1.5 text-xs text-indigo-200 hover:bg-indigo-500/10"
              >
                Autofill demo credentials
              </Button>
            </div>

            <p className="mt-3 text-center text-xs text-slate-500">
              No account?{" "}
              <Link to="/register" className="font-medium text-indigo-300 underline-offset-4 hover:text-indigo-200 hover:underline">
                Register
              </Link>
            </p>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
