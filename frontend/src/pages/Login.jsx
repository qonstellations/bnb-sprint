import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { normalizeApiError } from "../lib/errors.js";
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
  { icon: "📈", title: "Paper trading", text: "Practice with ₹1,00,000 virtual cash. Zero risk." },
  { icon: "🧠", title: "Sentiment lens", text: "Bullish / Neutral / Bearish signals on every stock." },
  { icon: "🔔", title: "Price alerts", text: "Target & stop-loss rules with instant triggers." },
];

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
    <div className="min-h-screen bg-slate-950">
      <style>{`@keyframes ticker-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>

      {/* Ticker tape */}
      <div className="overflow-hidden border-b border-slate-800 bg-slate-900/60 py-2" aria-hidden="true">
        <div
          className="flex w-max gap-8 whitespace-nowrap text-xs"
          style={{ animation: "ticker-scroll 30s linear infinite" }}
        >
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">{t.symbol}</span>
              <span className="text-slate-400">{t.price}</span>
              <span className={t.up ? "text-emerald-400" : "text-rose-400"}>
                {t.up ? "▲" : "▼"}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-2 md:py-16">
        {/* Brand panel */}
        <div className="flex flex-col justify-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-2xl shadow-lg shadow-indigo-950">
            ⚡
          </div>
          <h1 className="mt-4 bg-gradient-to-r from-indigo-300 via-slate-100 to-emerald-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
            StockPulse
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Paper trading with virtual money — learn the market before risking a single rupee.
          </p>
          <ul className="mt-6 space-y-3">
            {HIGHLIGHTS.map((h) => (
              <li
                key={h.title}
                className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 transition-colors hover:border-indigo-800"
              >
                <span className="text-xl">{h.icon}</span>
                <span>
                  <span className="block text-sm font-semibold text-slate-100">{h.title}</span>
                  <span className="block text-xs text-slate-400">{h.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Login card */}
        <div className="flex flex-col justify-center">
          <Card className="border-slate-700 shadow-2xl shadow-indigo-950/40">
            <h2 className="text-lg font-bold">Welcome back 👋</h2>
            <p className="mt-1 text-xs text-slate-400">Log in to your paper-trading account.</p>
            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <div>
                <label htmlFor="login-email" className="mb-1 block text-xs font-medium text-slate-300">
                  Email
                </label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="login-password" className="mb-1 block text-xs font-medium text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="login-password"
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              {error ? <p className="text-xs text-rose-300">{error}</p> : null}
              <Button type="submit" disabled={loading} className="w-full py-2.5 text-sm">
                {loading ? "Signing in…" : "Log in →"}
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-4 rounded-xl border border-dashed border-indigo-800 bg-indigo-950/30 p-3">
              <p className="text-xs font-semibold text-indigo-200">🔑 Demo credentials</p>
              <p className="mt-1 font-mono text-xs text-slate-300">
                {DEMO_EMAIL} <span className="text-slate-500">/</span> {DEMO_PASSWORD}
              </p>
              <button
                type="button"
                onClick={autofillDemo}
                className="mt-2 w-full rounded-lg border border-indigo-700 px-3 py-1.5 text-xs font-medium text-indigo-200 transition-colors hover:bg-indigo-900"
              >
                Autofill demo credentials
              </button>
            </div>

            <p className="mt-3 text-center text-xs text-slate-400">
              No account?{" "}
              <Link to="/register" className="font-medium text-indigo-300 underline hover:text-indigo-200">
                Register
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
