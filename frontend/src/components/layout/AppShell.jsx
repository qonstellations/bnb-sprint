import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { useLiveSocket } from "../../lib/socket.js";
import ToastHost from "../ToastHost.jsx";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/dashboard?focus=search", label: "Trade" },
  { to: "/orders", label: "Orders" },
  { to: "/alerts", label: "Alerts" },
];

// Protected app shell per PLAN Sec 6: logo, nav, user area, logout,
// responsive nav, global toast area (toast system plugs in here).
export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  useLiveSocket();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <span className="text-lg font-bold tracking-tight">StockPulse</span>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <NavLink
                key={l.label}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm ${
                    isActive ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden max-w-40 truncate text-xs text-slate-400 sm:block">
              {user?.email}
            </span>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-3 md:hidden">
          {links.map((l) => (
            <NavLink
              key={l.label}
              to={l.to}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${
                  isActive ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <div id="toast-area" aria-live="polite" className="mx-auto max-w-6xl px-4">
        <ToastHost />
      </div>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
