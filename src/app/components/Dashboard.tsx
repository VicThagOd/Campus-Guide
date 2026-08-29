import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar03Icon,
  DocumentValidationIcon,
  GraduationScrollIcon,
  House01Icon,
  Logout01Icon,
  Notification03Icon,
  QuestionIcon,
  Target01Icon,
  UserGroupIcon,
} from "hugeicons-react";
import { useAuth } from "../../context/AuthContext";
import { hasSupabaseEnv } from "../../lib/env";
import { supabase } from "../../lib/supabase";
import { SEO } from "./SEO";

const PRIMARY = "#2F4EA2";
const INK = "#111827";
const MUTED = "#6B7280";
const BORDER = "#BFC3C6";

const aspirantTiles = [
  {
    label: "Post-UTME Practice",
    description: "Past questions, CBT mock tests and your performance",
    to: "/post-utme",
    icon: <DocumentValidationIcon size={40} color={PRIMARY} />,
  },
  {
    label: "JAMB Prep Hub",
    description: "UTME mock exams, syllabus guides and practice sets",
    to: "/jamb",
    icon: <GraduationScrollIcon size={40} color={PRIMARY} />,
  },
  {
    label: "Aspirant Hub",
    description: "Cut-off marks, subject combinations and admission guides",
    to: "/aspirant-services",
    icon: <Target01Icon size={40} color={PRIMARY} />,
  },
  {
    label: "UNIPORT Updates",
    description: "Verified news, deadlines and what to do next",
    to: "/updates",
    icon: <Notification03Icon size={40} color={PRIMARY} />,
  },
  {
    label: "Important Dates",
    description: "JAMB, post-UTME, admission and registration dates",
    to: "/dates",
    icon: <Calendar03Icon size={40} color={PRIMARY} />,
  },
  {
    label: "Events",
    description: "Seminars, workshops and campus gatherings",
    to: "/events",
    icon: <UserGroupIcon size={40} color={PRIMARY} />,
  },
  {
    label: "Ask Campus Guide",
    description: "Ask anything about UNIPORT, get a straight answer",
    to: "/ask",
    icon: <QuestionIcon size={40} color={PRIMARY} />,
  },
];

const studentTiles = [
  {
    label: "Freshers Hub",
    description: "Acceptance, clearance, fees and orientation, step by step",
    to: "/freshers",
    icon: <GraduationScrollIcon size={40} color={PRIMARY} />,
  },
  {
    label: "Accommodation",
    description: "Student housing around UNIPORT with prices and distance",
    to: "/accommodation",
    icon: <House01Icon size={40} color={PRIMARY} />,
  },
  {
    label: "UNIPORT Updates",
    description: "Verified news, deadlines and what to do next",
    to: "/updates",
    icon: <Notification03Icon size={40} color={PRIMARY} />,
  },
  {
    label: "Important Dates",
    description: "JAMB, post-UTME, admission and registration dates",
    to: "/dates",
    icon: <Calendar03Icon size={40} color={PRIMARY} />,
  },
  {
    label: "Events",
    description: "Seminars, workshops and campus gatherings",
    to: "/events",
    icon: <UserGroupIcon size={40} color={PRIMARY} />,
  },
  {
    label: "Ask Campus Guide",
    description: "Ask anything about UNIPORT, get a straight answer",
    to: "/ask",
    icon: <QuestionIcon size={40} color={PRIMARY} />,
  },
];

export function Dashboard() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const [isFirstLogin, setIsFirstLogin] = useState<boolean | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!profile || !hasSupabaseEnv) {
      if (profile) setIsFirstLogin(false);
      return;
    }
    const first = !profile.last_login_at;
    setIsFirstLogin(first);
    if (first) {
      supabase
        .from("profiles")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", profile.id);
    }
  }, [profile?.id]);

  if (!profile || isFirstLogin === null) return null;

  const username = profile.username || profile.name || "Student";
  const isAspirant = profile.user_type !== 'student';
  const hubTiles = isAspirant ? aspirantTiles : studentTiles;
  const roleLabel = isAspirant ? 'Aspirant' : 'Student';

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F8FA" }}>
      <SEO
        title="Dashboard"
        description="Your Campus Guide hub: practice, aspirant services, accommodation and events."
      />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <p className="text-lg font-medium tracking-tight" style={{ color: INK }}>
              {isFirstLogin ? "Welcome" : "Welcome back"}, <span className="font-semibold">{username}</span>
            </p>
            <p className="text-sm" style={{ color: MUTED }}>
              {roleLabel} Dashboard
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setNotificationsOpen((open) => !open)}
                aria-label="Notifications"
                className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white transition-colors duration-150 hover:border-[#2F4EA2]"
                style={{ borderColor: BORDER }}
              >
                <Notification03Icon size={18} color={INK} />
              </button>
              {notificationsOpen && (
                <div
                  className="absolute right-0 top-11 z-20 w-64 rounded-xl border bg-white p-4 shadow-md"
                  style={{ borderColor: BORDER }}
                >
                  <p className="mb-1 text-sm font-semibold" style={{ color: INK }}>Notifications</p>
                  <p className="text-sm" style={{ color: MUTED }}>No new notifications.</p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-opacity duration-150 hover:opacity-70"
              style={{ color: MUTED }}
            >
              <Logout01Icon size={16} />
              Log Out
            </button>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {hubTiles.map((tile) => (
            <Link
              key={tile.to}
              to={tile.to}
              className="flex flex-col items-start gap-3 rounded-xl border bg-white p-6 transition-colors duration-150 hover:border-[#2F4EA2]"
              style={{ borderColor: BORDER }}
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-xl lg:h-20 lg:w-20" style={{ backgroundColor: "#EEF2FC" }}>
                {tile.icon}
              </span>
              <span>
                <span className="block text-base font-semibold tracking-tight" style={{ color: INK }}>
                  {tile.label}
                </span>
                <span className="mt-1 block text-sm leading-relaxed" style={{ color: MUTED }}>
                  {tile.description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
