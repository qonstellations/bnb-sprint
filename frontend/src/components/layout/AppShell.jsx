import { useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeftRight,
  Bell,
  Briefcase,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext.jsx";
import { useLiveSocket } from "../../lib/socket.js";
import { toast } from "../../lib/toast.js";
import ToastHost from "../ToastHost.jsx";

const LINKS = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/portfolio", label: "Portfolio", Icon: Briefcase },
  { to: "/dashboard?focus=search", label: "Trade", Icon: ArrowLeftRight },
  { to: "/orders", label: "Orders", Icon: ClipboardList },
  { to: "/alerts", label: "Alerts", Icon: Bell },
];

function BrandMark() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-glow">
      <Zap size={17} aria-hidden />
    </span>
  );
}

function NavItem({ to, label, Icon, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `relative flex items-center gap-3 rounded-xl px-3 py-2.5 font-sans text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
          isActive ? "text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <motion.span
              layoutId="sp-nav-active"
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
              className="absolute inset-0 rounded-xl bg-white/[0.07] ring-1 ring-white/10"
              aria-hidden
            />
          ) : null}
          <Icon size={17} aria-hidden className="relative shrink-0" />
          <span className="relative">{label}</span>
        </>
      )}
    </NavLink>
  );
}

// Protected app shell: sidebar on desktop, bottom tab bar on mobile,
// animated route transitions, global toast area.
export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const reduce = useReducedMotion();
  const [drawer, setDrawer] = useState(false);
  useLiveSocket();

  function handleLogout() {
    logout();
    toast.info("Signed out.");
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-ink-950">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-white/[0.06] bg-ink-900/80 backdrop-blur md:flex">
        <div className="flex items-center gap-2.5 px-5 pb-6 pt-6">
          <BrandMark />
          <span className="font-display text-base font-bold tracking-tight text-white">
            StockPulse
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Primary">
          {LINKS.map((l) => (
            <NavItem key={l.label} {...l} />
          ))}
        </nav>
        <div className="border-t border-white/[0.06] p-4">
          <p className="max-w-full truncate px-1 text-xs text-slate-500">{user?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <LogOut size={17} aria-hidden /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/[0.06] bg-ink-950/90 px-4 py-3 backdrop-blur md:hidden">
        <BrandMark />
        <span className="font-display text-base font-bold tracking-tight text-white">
          StockPulse
        </span>
        <button
          type="button"
          onClick={() => setDrawer((v) => !v)}
          aria-label={drawer ? "Close menu" : "Open menu"}
          aria-expanded={drawer}
          className="ml-auto flex h-11 w-11 items-center justify-center rounded-xl text-slate-300 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-accent"
        >
          {drawer ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
        </button>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawer ? (
          <motion.nav
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            aria-label="Primary mobile"
            className="fixed inset-x-0 top-[61px] z-40 border-b border-white/[0.06] bg-ink-900/95 p-3 backdrop-blur md:hidden"
          >
            <div className="grid gap-1">
              {LINKS.map((l) => (
                <NavItem key={l.label} {...l} onNavigate={() => setDrawer(false)} />
              ))}
              <button
                type="button"
                onClick={() => {
                  setDrawer(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-100"
              >
                <LogOut size={17} aria-hidden /> Sign out
              </button>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>

      <div id="toast-area" aria-live="polite">
        <ToastHost />
      </div>

      {/* Content: offset for sidebar on desktop, padding for bottom tabs on mobile */}
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:pb-12 md:pl-64 md:pr-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Primary tabs"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-ink-900/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div className="grid grid-cols-5">
          {LINKS.map(({ to, label, Icon }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                `relative flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                  isActive ? "text-white" : "text-slate-500"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <motion.span
                      layoutId="sp-tab-active"
                      className="absolute top-0 h-0.5 w-10 rounded-full bg-accent"
                      aria-hidden
                    />
                  ) : null}
                  <Icon size={19} aria-hidden />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
