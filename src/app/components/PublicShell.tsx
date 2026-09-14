import { Link } from "react-router-dom";
import { ArrowLeft01Icon } from "hugeicons-react";
import { useAuth } from "../../context/AuthContext";

const PRIMARY = "#2F4EA2";
const INK = "#111827";
const MUTED = "#6B7280";
const BORDER = "#BFC3C6";

export function PublicShell({
  children,
  backTo,
  backLabel,
}: {
  children: React.ReactNode;
  backTo?: string;
  backLabel?: string;
}) {
  const { user } = useAuth();
  const effectiveBackTo = backTo || (user ? "/dashboard" : "/");
  const effectiveBackLabel = backLabel || (user ? "Back to Dashboard" : "Back to Home");

  return (
    <div className="flex min-h-screen flex-col bg-white" style={{ color: INK }}>
      <header className="border-b bg-white sticky top-0 z-30" style={{ borderColor: BORDER }}>
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-3 sm:px-4 gap-2">
          <Link to={effectiveBackTo} className="flex items-center gap-2 min-w-0 shrink-0">
            <img
              src="/logo.png"
              alt="Campus Guide"
              width={28}
              height={28}
              className="rounded-lg object-cover sm:w-[30px] sm:h-[30px]"
            />
            <span className="text-sm sm:text-base font-semibold tracking-tight truncate" style={{ color: PRIMARY }}>
              Campus Guide
            </span>
          </Link>
          <Link
            to={effectiveBackTo}
            className="flex items-center gap-1.5 rounded-lg border px-2.5 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold transition-colors duration-150 hover:bg-gray-50 shrink-0"
            style={{ borderColor: BORDER, color: PRIMARY }}
          >
            <ArrowLeft01Icon size={14} />
            <span className="hidden sm:inline">
              {effectiveBackLabel.startsWith("Back to ") ? "Back to " : ""}
            </span>
            <span>
              {effectiveBackLabel.startsWith("Back to ") ? effectiveBackLabel.replace("Back to ", "") : effectiveBackLabel}
            </span>
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t" style={{ borderColor: BORDER }}>
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row">
          <p className="text-sm" style={{ color: MUTED }}>
            © 2026 Campus Guide. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/about" className="text-sm transition-opacity duration-150 hover:opacity-70" style={{ color: MUTED }}>
              About
            </Link>
            <Link to="/contact" className="text-sm transition-opacity duration-150 hover:opacity-70" style={{ color: MUTED }}>
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
