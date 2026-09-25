import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, SearchX } from "lucide-react";
import { fadeUp, staggerParent } from "../lib/motion.js";
import { Card } from "../components/ui.jsx";

export default function NotFound() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={staggerParent()}
      initial={reduce ? false : "hidden"}
      animate="show"
      className="mx-auto max-w-sm px-4 py-16"
    >
      <motion.div variants={fadeUp}>
        <Card className="text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-slate-400 ring-1 ring-white/10">
            <SearchX size={20} aria-hidden />
          </div>
          <p className="font-display text-lg font-semibold text-white">Page not found</p>
          <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-slate-500">
            That route doesn&apos;t exist. Paper trading is still safe.
          </p>
          <Link
            to="/dashboard"
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            <ArrowLeft size={16} aria-hidden /> Back to dashboard
          </Link>
        </Card>
      </motion.div>
    </motion.div>
  );
}
