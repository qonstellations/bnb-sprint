import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext.jsx";
import AppShell from "./components/layout/AppShell.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import StockDetail from "./pages/StockDetail.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import Orders from "./pages/Orders.jsx";
import Alerts from "./pages/Alerts.jsx";
import NotFound from "./pages/NotFound.jsx";

function RequireAuth({ children }) {
  const { isAuthed, booting } = useAuth();
  if (booting) return <p className="p-8 text-sm text-slate-400">Loading…</p>;
  if (!isAuthed) return <Navigate to="/login" replace />;
  return children;
}

function RedirectIfAuth({ children }) {
  const { isAuthed, booting } = useAuth();
  if (booting) return <p className="p-8 text-sm text-slate-400">Loading…</p>;
  if (isAuthed) return <Navigate to="/dashboard" replace />;
  return children;
}

// MVP routes per PLAN Sec 5. Trade is search-first (no standalone /trade screen).
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<RedirectIfAuth><Login /></RedirectIfAuth>} />
      <Route path="/register" element={<RedirectIfAuth><Register /></RedirectIfAuth>} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/stocks/:symbol" element={<StockDetail />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/alerts" element={<Alerts />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
