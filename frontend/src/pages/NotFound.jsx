import { Link } from "react-router-dom";
import { Card } from "../components/ui.jsx";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-sm py-16 text-center">
      <Card>
        <p className="text-lg font-semibold text-white">Page not found</p>
        <p className="mt-1 text-sm text-slate-400">That route doesn&apos;t exist. Paper trading is still safe.</p>
        <Link to="/dashboard" className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-indigo-500">Back to dashboard</Link>
      </Card>
    </div>
  );
}
