import { Link } from "react-router-dom";
import { ArrowLeft01Icon } from "hugeicons-react";
import { SEO } from "./SEO";

const PRIMARY = "#2F4EA2";
const INK = "#111827";
const MUTED = "#6B7280";

export function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: PRIMARY }}>
      <SEO title="Page Not Found" description="The page you are looking for does not exist or has been moved." />
      <div className="mx-auto max-w-md px-4 text-center">
        <div className="mb-8">
          <span className="text-[8rem] font-bold leading-none text-white" style={{ opacity: 0.9 }}>
            404
          </span>
        </div>
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-white">
          Page Not Found
        </h1>
        <p className="mb-8 text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold transition-opacity duration-150 hover:opacity-90"
          style={{ backgroundColor: "#FFFFFF", color: PRIMARY }}
        >
          <ArrowLeft01Icon size={18} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
