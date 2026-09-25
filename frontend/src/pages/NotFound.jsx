import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="text-lg font-semibold">Page not found</p>
      <Link to="/dashboard" className="mt-2 inline-block text-sm text-indigo-300 underline">Back to dashboard</Link>
    </div>
  );
}
