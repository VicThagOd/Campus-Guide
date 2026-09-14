import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  RiVipCrownLine,
  RiNotification3Line,
  RiQuestionAnswerLine,
  RiCalendarEventLine,
  RiLogoutBoxRLine,
  RiArrowRightLine,
  RiUserSharedLine,
  RiBuilding4Line,
} from "react-icons/ri";
import {
  HiOutlineSparkles,
  HiOutlineAcademicCap,
  HiOutlineMegaphone,
  HiOutlineTicket,
} from "react-icons/hi2";
import {
  PiExamDuotone,
  PiCalendarCheckDuotone,
  PiBedDuotone,
  PiGraduationCapBold,
  PiCheckCircleFill,
} from "react-icons/pi";
import {
  TbCompass,
  TbHomeCheck,
  TbCalendarTime,
  TbBellRinging,
} from "react-icons/tb";
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
    icon: <PiExamDuotone size={36} color={PRIMARY} />,
  },
  {
    label: "Face of Campus Guide (F.O.C.G)",
    description: "Vote or register for the official campus pageantry",
    to: "/pageant/vote",
    icon: <RiVipCrownLine size={36} color="#D97706" />,
  },
  {
    label: "Aspirant Hub",
    description: "JAMB and Post-UTME services, guides and support",
    to: "/aspirant-services",
    icon: <TbCompass size={36} color={PRIMARY} />,
  },
  {
    label: "Important Dates",
    description: "JAMB, post-UTME, admission and registration dates",
    to: "/dates",
    icon: <TbCalendarTime size={36} color={PRIMARY} />,
  },
  {
    label: "Ask Campus Guide",
    description: "Ask anything about UNIPORT, get a straight answer",
    to: "/ask",
    icon: <RiQuestionAnswerLine size={36} color={PRIMARY} />,
  },
];

const studentTiles = [
  {
    label: "Freshers Hub",
    description: "Acceptance, clearance, fees and orientation, step by step",
    to: "/freshers",
    icon: <HiOutlineAcademicCap size={36} color={PRIMARY} />,
  },
  {
    label: "Face of Campus Guide (F.O.C.G)",
    description: "Vote or register for the official campus pageantry",
    to: "/pageant/vote",
    icon: <RiVipCrownLine size={36} color="#D97706" />,
  },
  {
    label: "Accommodation",
    description: "Student housing around UNIPORT with prices and distance",
    to: "/accommodation",
    icon: <TbHomeCheck size={36} color={PRIMARY} />,
  },
  {
    label: "UNIPORT Updates",
    description: "Verified news, deadlines and what to do next",
    to: "/updates",
    icon: <HiOutlineMegaphone size={36} color={PRIMARY} />,
  },
  {
    label: "Important Dates",
    description: "JAMB, post-UTME, admission and registration dates",
    to: "/dates",
    icon: <PiCalendarCheckDuotone size={36} color={PRIMARY} />,
  },
  {
    label: "Events",
    description: "Seminars, workshops and campus gatherings",
    to: "/events",
    icon: <HiOutlineTicket size={36} color={PRIMARY} />,
  },
  {
    label: "Ask Campus Guide",
    description: "Ask anything about UNIPORT, get a straight answer",
    to: "/ask",
    icon: <RiQuestionAnswerLine size={36} color={PRIMARY} />,
  },
];

export function Dashboard() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const [isFirstLogin, setIsFirstLogin] = useState<boolean | null>(null);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [promotionAgreed, setPromotionAgreed] = useState(false);
  const [promotionStep, setPromotionStep] = useState<"confirm" | "congrats">("confirm");
  const [promoting, setPromoting] = useState(false);

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

  const handlePromoteToStudent = async () => {
    if (!profile?.id) return;
    setPromoting(true);
    const { error } = await supabase
      .from("profiles")
      .update({ user_type: "student" })
      .eq("id", profile.id);
    setPromoting(false);
    if (!error) {
      setPromotionStep("congrats");
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F8FA" }}>
      <SEO
        title="Dashboard"
        description="Your Campus Guide hub: practice, aspirant services, accommodation and events."
      />
      <div className="mx-auto max-w-4xl px-3 sm:px-4 py-6 sm:py-8">
        <header className="mb-8 sm:mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-medium tracking-tight truncate" style={{ color: INK }}>
              {isFirstLogin ? "Welcome" : "Welcome back"}, <span className="font-semibold">{username}</span>
            </p>
            <p className="text-xs sm:text-sm" style={{ color: MUTED }}>
              {roleLabel} Dashboard
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            {isAspirant && (
              <button
                onClick={() => { setShowPromotionModal(true); setPromotionStep("confirm"); setPromotionAgreed(false); }}
                className="flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 shadow-sm"
                style={{ backgroundColor: "#16A34A" }}
              >
                <RiUserSharedLine size={15} />
                <span>Switch to Student</span>
              </button>
            )}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setNotificationsOpen((open) => !open)}
                aria-label="Notifications"
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border bg-white transition-colors duration-150 hover:border-[#2F4EA2]"
                style={{ borderColor: BORDER }}
              >
                <TbBellRinging size={17} color={INK} />
              </button>
              {notificationsOpen && (
                <div
                  className="absolute right-0 top-10 sm:top-11 z-20 w-60 sm:w-64 rounded-xl border bg-white p-4 shadow-md"
                  style={{ borderColor: BORDER }}
                >
                  <p className="mb-1 text-sm font-semibold" style={{ color: INK }}>Notifications</p>
                  <p className="text-sm" style={{ color: MUTED }}>No new notifications.</p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-opacity duration-150 hover:opacity-70"
              style={{ color: MUTED }}
            >
              <RiLogoutBoxRLine size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {hubTiles.map((tile) => (
            <Link
              key={tile.to}
              to={tile.to}
              className="flex flex-col items-start gap-3 rounded-xl border bg-white p-4 sm:p-6 transition-colors duration-150 hover:border-[#2F4EA2]"
              style={{ borderColor: BORDER }}
            >
              <span className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl lg:h-20 lg:w-20 shrink-0" style={{ backgroundColor: "#EEF2FC" }}>
                {tile.icon}
              </span>
              <div>
                <span className="block text-sm sm:text-base font-semibold tracking-tight" style={{ color: INK }}>
                  {tile.label}
                </span>
                <span className="mt-1 block text-xs sm:text-sm leading-relaxed" style={{ color: MUTED }}>
                  {tile.description}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Promotion Modal */}
      {showPromotionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            {promotionStep === "congrats" ? (
              <div className="text-center">
                <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "#DCFCE7" }}>
                  <PiCheckCircleFill size={36} color="#16A34A" />
                </span>
                <h2 className="text-2xl font-bold tracking-tight" style={{ color: INK }}>
                  Welcome to Student Mode!
                </h2>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: MUTED }}>
                  You now have access to the Freshers Hub, Accommodation listings, Events, and
                  UNIPORT Updates.
                </p>
                <div className="mt-6 space-y-2">
                  <Link
                    to="/freshers"
                    className="flex w-full items-center justify-center gap-2 rounded-lg py-3 font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    Open Freshers Hub
                    <RiArrowRightLine size={16} />
                  </Link>
                  <button
                    onClick={() => { setShowPromotionModal(false); window.location.reload(); }}
                    className="w-full rounded-lg border py-3 font-semibold transition-colors hover:bg-gray-50"
                    style={{ borderColor: BORDER, color: INK }}
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold" style={{ color: INK }}>
                  Switch to Student Mode?
                </h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: MUTED }}>
                  You will gain access to the Freshers Hub, Accommodation, Events, and campus updates.
                  Make sure you have confirmed your admission before switching.
                </p>

                <div className="mt-6 rounded-xl border p-4" style={{ borderColor: "#D1D9F0", backgroundColor: "#EEF2FC" }}>
                  <p className="text-sm font-semibold" style={{ color: INK }}>
                    Before you switch, please confirm:
                  </p>
                  <label className="mt-3 flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={promotionAgreed}
                      onChange={(e) => setPromotionAgreed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm" style={{ color: MUTED }}>
                      I have confirmed my admission on the JAMB CAPS portal
                    </span>
                  </label>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowPromotionModal(false)}
                    className="flex-1 rounded-lg border py-3 font-semibold transition-colors hover:bg-gray-50"
                    style={{ borderColor: BORDER, color: INK }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePromoteToStudent}
                    disabled={!promotionAgreed || promoting}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: "#16A34A" }}
                  >
                    {promoting ? "Switching..." : "Switch to Student"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
