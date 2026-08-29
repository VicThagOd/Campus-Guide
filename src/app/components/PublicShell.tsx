import { Link } from "react-router-dom";
import { ArrowLeft01Icon } from "hugeicons-react";

const PRIMARY = "#2F4EA2";
const INK = "#111827";
const MUTED = "#6B7280";
const BORDER = "#BFC3C6";

export function PublicShell({
  children,
  backTo = "/",
  backLabel = "Back to Home",
}: {
  children: React.ReactNode;
  backTo?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white" style={{ color: INK }}>
      <header className="border-b" style={{ borderColor: BORDER }}>
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to={backTo} className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Campus Guide"
              width={30}
              height={30}
              style={{ borderRadius: "8px", objectFit: "cover" }}
            />
            <span className="text-base font-semibold tracking-tight" style={{ color: PRIMARY }}>
              Campus Guide
            </span>
          </Link>
          <Link
            to={backTo}
            className="flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors duration-150 hover:bg-white"
            style={{ borderColor: BORDER, color: PRIMARY }}
          >
            <ArrowLeft01Icon size={14} />
            {backLabel}
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
