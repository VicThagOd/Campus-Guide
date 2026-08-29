import { Link } from "react-router-dom";
import {
  AnalyticsUpIcon,
  ArrowRight01Icon,
  Calendar03Icon,
  CheckListIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  DocumentValidationIcon,
  GraduationScrollIcon,
  House01Icon,
  Location01Icon,
  Notification03Icon,
  QuestionIcon,
  Route01Icon,
  StarIcon,
  Target01Icon,
  UserGroupIcon,
} from "hugeicons-react";
import { SEO } from "./SEO";
import { useAuth } from "../../context/AuthContext";

const PRIMARY = "#2F4EA2";
const INK = "#111827";
const MUTED = "#6B7280";
const BORDER = "#BFC3C6";
const SECTION_BG = "#F7F8FA";
const ACCENT = "#F5B942";
const WHATSAPP_GREEN = "#25D366";

const WHATSAPP_URL = "https://wa.link/wx16gs";

function CampusGuideLogo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Campus Guide"
      width={size}
      height={size}
      className={className}
      style={{ borderRadius: "8px", objectFit: "cover" }}
    />
  );
}

const ecosystemCards = [
  {
    icon: <Notification03Icon size={22} color={PRIMARY} />,
    title: "UNIPORT Updates",
    text: "Verified news and what to do",
  },
  {
    icon: <Calendar03Icon size={22} color={PRIMARY} />,
    title: "Important Dates",
    text: "JAMB to registration deadlines",
  },
  {
    icon: <UserGroupIcon size={22} color={PRIMARY} />,
    title: "Events",
    text: "Freshers hangouts and meetups",
  },
  {
    icon: <QuestionIcon size={22} color={PRIMARY} />,
    title: "Ask Campus Guide",
    text: "Straight answers, any question",
  },
];

export function Landing() {
  const { user } = useAuth();

  const signedInTarget = user ? "/dashboard" : "/login";
  const signupState = user ? undefined : { isSignup: true };

  return (
    <div className="min-h-screen bg-white" style={{ color: INK }}>
      <SEO
        title="Campus Guide UNIPORT: Post-UTME Practice, Admission Guides, Accommodation and Events"
        description="Campus Guide is the digital ecosystem for UNIPORT aspirants and new intakes: post-UTME practice, admission guides, fresher steps, accommodation, events and verified updates."
        canonical="https://campusguide.ng"
      />

      {/* TOP BAR */}
      <header className="border-b bg-white" style={{ borderColor: BORDER }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3">
            <CampusGuideLogo size={36} />
            <span className="text-lg font-semibold tracking-tight" style={{ color: PRIMARY }}>
              Campus Guide
            </span>
          </Link>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="hidden items-center gap-5 sm:flex">
              <Link to="/about" className="text-sm font-medium transition-colors duration-150 hover:opacity-70" style={{ color: INK }}>
                About
              </Link>
              <Link to="/contact" className="text-sm font-medium transition-colors duration-150 hover:opacity-70" style={{ color: INK }}>
                Contact
              </Link>
            </div>
            <Link
              to={signedInTarget}
              className="rounded-lg border px-5 py-2 text-sm font-semibold transition-colors duration-150 hover:bg-white"
              style={{ borderColor: BORDER, color: PRIMARY }}
            >
              Log In
            </Link>
            <Link
              to={signedInTarget}
              state={signupState}
              className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
              style={{ backgroundColor: PRIMARY }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="overflow-hidden" style={{ backgroundColor: SECTION_BG }}>
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-2 md:gap-10 md:py-20">
          <div>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight md:text-5xl" style={{ color: INK }}>
              One platform for the whole UNIPORT journey.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed md:text-lg" style={{ color: MUTED }}>
              From JAMB to post-UTME, clearance to fresher life. Practice, guides, dates, housing and
              events, all in one place.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to={signedInTarget}
                state={signupState}
                className="rounded-lg px-7 py-3.5 text-center font-semibold text-white transition-opacity duration-150 hover:opacity-90"
                style={{ backgroundColor: PRIMARY }}
              >
                Get Started
              </Link>
              <Link
                to={signedInTarget}
                className="rounded-lg border px-7 py-3.5 text-center font-semibold transition-colors duration-150 hover:bg-white"
                style={{ borderColor: BORDER, color: PRIMARY }}
              >
                Log In
              </Link>
            </div>
          </div>

          <div className="relative">
            <div
              className="absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
              style={{ backgroundColor: "#DCE4FA" }}
            />
            <div className="relative mx-auto w-full max-w-[230px] overflow-hidden rounded-[2rem] border-[8px] bg-white shadow-xl sm:max-w-[250px]" style={{ borderColor: "#FFFFFF" }}>
              <img
                src="/dashboard-screenshot.png"
                alt="Campus Guide dashboard"
                width={430}
                height={932}
                className="aspect-[430/932] w-full object-cover"
              />
            </div>
            <div
              className="absolute -right-2 top-8 hidden rounded-lg border bg-white px-3.5 py-2.5 shadow-md sm:block"
              style={{ borderColor: BORDER }}
            >
              <div className="flex items-center gap-2">
                <AnalyticsUpIcon size={16} color={PRIMARY} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: INK }}>Score 340 / 400</p>
                  <p className="text-[10px]" style={{ color: MUTED }}>50 questions scored</p>
                </div>
              </div>
            </div>
            <div
              className="absolute -left-2 bottom-10 hidden rounded-lg border bg-white px-3.5 py-2.5 shadow-md sm:block"
              style={{ borderColor: BORDER }}
            >
              <div className="flex items-center gap-2">
                <CheckmarkCircle02Icon size={16} color="#16A34A" />
                <div>
                  <p className="text-xs font-semibold" style={{ color: INK }}>Acceptance step done</p>
                  <p className="text-[10px]" style={{ color: MUTED }}>Fresher checklist</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 md:py-24">
        <div className="mb-14 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ color: INK }}>
            Everything you need, from aspirant to student.
          </h2>
          <p className="mt-4 text-lg leading-relaxed" style={{ color: MUTED }}>
            Not just post-UTME practice. The whole campus experience, in one ecosystem.
          </p>
        </div>

        <FeatureRow
          reversed={false}
          title="Past questions that match the real thing"
          description="Unlock UNIPORT past questions for your faculty and sit a 50-question CBT mock that follows the exam's format and 400-mark scoring. Scores and performance tracking after every session."
          ctaLabel="Start practicing"
          visual={<PracticeVisual />}
        />

        <FeatureRow
          reversed={true}
          title="Full-length JAMB Mock Exams"
          description="Simulate the actual UTME with comprehensive, standard mock exams covering all your chosen subjects. Track timing, review correct answers, and prepare to ace the official JAMB test."
          ctaLabel="Try JAMB Mock Exam"
          to="/jamb"
          state={null}
          visual={<JAMBVisual />}
        />

        <FeatureRow
          reversed
          title="Everything between JAMB and admission day"
          description="Admission requirements, cut-off marks by faculty, subject combinations and the aggregate calculator. Laid out clearly, without the rumour mill."
          ctaLabel="Explore the aspirant hub"
          visual={<AspirantVisual />}
        />

        <FeatureRow
          reversed={false}
          title="Admitted? Here is exactly what comes next"
          description="Acceptance, clearance, school fees, registration, medicals and orientation, broken into steps. You will never be the fresher who missed a deadline."
          ctaLabel="Open the freshers hub"
          visual={<FreshersVisual />}
        />

        <FeatureRow
          reversed
          title="A place to stay, found faster"
          description="Student housing around Choba with price, distance from school, room type and amenities on every listing, photos included. Compare before you visit."
          ctaLabel="Browse accommodation"
          visual={<AccommodationVisual />}
        />
      </section>

      {/* ECOSYSTEM STRIP */}
      <section className="border-t" style={{ borderColor: BORDER, backgroundColor: SECTION_BG }}>
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ecosystemCards.map((card) => (
              <div key={card.title} className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white" style={{ border: `1px solid ${BORDER}` }}>
                  {card.icon}
                </span>
                <div>
                  <h3 className="text-sm font-bold tracking-tight" style={{ color: INK }}>
                    {card.title}
                  </h3>
                  <p className="mt-0.5 text-sm" style={{ color: MUTED }}>
                    {card.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BUILT FOR EVERY STAGE */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:py-24">
        <h2 className="mb-14 text-center text-3xl font-bold tracking-tight md:text-4xl" style={{ color: INK }}>
          Built for every stage
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="flex flex-col items-center text-center rounded-xl border bg-white p-8" style={{ borderColor: BORDER }}>
            <span className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: "#EEF2FC" }}>
              <Target01Icon size={28} color={PRIMARY} />
            </span>
            <h3 className="mt-4 text-lg font-bold tracking-tight" style={{ color: INK }}>Aspirant</h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: MUTED }}>Cut-off marks, subject combinations and aggregate calculators for your faculty.</p>
          </div>
          <div className="flex flex-col items-center text-center rounded-xl border bg-white p-8" style={{ borderColor: BORDER }}>
            <span className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: "#EEF2FC" }}>
              <GraduationScrollIcon size={28} color={PRIMARY} />
            </span>
            <h3 className="mt-4 text-lg font-bold tracking-tight" style={{ color: INK }}>Admitted</h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: MUTED }}>Acceptance, clearance, school fees and registration, step by step.</p>
          </div>
          <div className="flex flex-col items-center text-center rounded-xl border bg-white p-8" style={{ borderColor: BORDER }}>
            <span className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: "#EEF2FC" }}>
              <House01Icon size={28} color={PRIMARY} />
            </span>
            <h3 className="mt-4 text-lg font-bold tracking-tight" style={{ color: INK }}>Student</h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: MUTED }}>Accommodation, events, updates and important dates around campus.</p>
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:py-24">
        <div className="rounded-2xl px-8 py-12 text-center md:px-16 md:py-14" style={{ backgroundColor: PRIMARY }}>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Your UNIPORT journey starts here.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">
            Join free. Practice for your post-UTME, plan your admission, and walk into UNIPORT prepared.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to={signedInTarget}
              state={signupState}
              className="rounded-lg px-8 py-3.5 font-semibold transition-opacity duration-150 hover:opacity-90"
              style={{ backgroundColor: ACCENT, color: "#7A5417" }}
            >
              Get Started
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg px-8 py-3.5 font-semibold text-white transition-colors duration-150 hover:opacity-90"
              style={{ backgroundColor: WHATSAPP_GREEN }}
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-white" style={{ borderColor: BORDER }}>
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <CampusGuideLogo size={40} />
              <span className="text-xl font-semibold tracking-tight" style={{ color: PRIMARY }}>
                Campus Guide
              </span>
            </div>
            <p className="max-w-md text-center text-sm leading-relaxed" style={{ color: MUTED }}>
              The digital ecosystem for UNIPORT aspirants and students.
            </p>
            <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {[
                { label: "About", to: "/about" },
                { label: "Contact", to: "/contact" },
                { label: "Log In", to: "/login" },
                { label: "Create Account", to: "/login", signup: true },
              ].map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  state={link.signup ? { isSignup: true } : undefined}
                  className="text-sm transition-colors duration-150 hover:opacity-70"
                  style={{ color: MUTED }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="my-10 h-px w-full" style={{ backgroundColor: BORDER }} />

          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm" style={{ color: MUTED }}>
              © 2026 Campus Guide. All rights reserved.
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium transition-colors duration-150 hover:opacity-70"
              style={{ color: MUTED }}
            >
              WhatsApp us
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureRow({
  reversed,
  title,
  description,
  ctaLabel,
  visual,
  to = "/login",
  state = { isSignup: true },
}: {
  reversed: boolean;
  title: string;
  description: string;
  ctaLabel: string;
  visual: React.ReactNode;
  to?: string;
  state?: any;
}) {
  return (
    <div className="mb-20 grid items-center gap-12 md:grid-cols-2 md:gap-16 last:mb-0">
      <div className={reversed ? "md:order-2" : ""}>
        <h3 className="text-2xl font-bold tracking-tight md:text-3xl" style={{ color: INK }}>
          {title}
        </h3>
        <p className="mt-4 max-w-md leading-relaxed" style={{ color: MUTED }}>
          {description}
        </p>
        <Link
          to={to}
          state={state}
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity duration-150 hover:opacity-70"
          style={{ color: PRIMARY }}
        >
          {ctaLabel}
          <ArrowRight01Icon size={16} />
        </Link>
      </div>
      <div className={reversed ? "md:order-1" : ""}>{visual}</div>
    </div>
  );
}

function PracticeVisual() {
  return (
    <div className="relative mx-auto flex h-72 max-w-md items-center justify-center">
      <div className="absolute h-56 w-56 rounded-full blur-3xl" style={{ backgroundColor: "#DCE4FA" }} />
      <div className="relative w-full max-w-sm rounded-xl border bg-white p-5 shadow-md" style={{ borderColor: BORDER }}>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-semibold" style={{ color: MUTED }}>Question 12 of 50</p>
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: "#FEF6E4", color: "#B7791F" }}>
            <Clock01Icon size={12} /> 24:11
          </span>
        </div>
        <div className="mb-4 h-3 w-3/4 rounded-full" style={{ backgroundColor: "#E5E7EB" }} />
        <div className="mb-3 h-3 w-full rounded-full" style={{ backgroundColor: "#E5E7EB" }} />
        <div className="mb-3 h-3 w-5/6 rounded-full" style={{ backgroundColor: "#E5E7EB" }} />
        <div className="mb-2 flex items-center gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: "#D1D9F0", backgroundColor: "#EEF2FC" }}>
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PRIMARY }} />
          <span className="h-3 w-2/3 rounded-full" style={{ backgroundColor: "#CBD5E1" }} />
        </div>
        <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: BORDER }}>
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#D1D5DB" }} />
          <span className="h-3 w-3/5 rounded-full" style={{ backgroundColor: "#E5E7EB" }} />
        </div>
      </div>
      <div className="absolute -right-2 -top-4 rounded-lg border bg-white px-4 py-2.5 shadow-md sm:right-4" style={{ borderColor: BORDER }}>
        <div className="flex items-center gap-2">
          <AnalyticsUpIcon size={18} color={PRIMARY} />
          <div>
            <p className="text-xs font-bold" style={{ color: INK }}>Score: 340 / 400</p>
            <p className="text-[11px]" style={{ color: MUTED }}>50 questions scored</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AspirantVisual() {
  return (
    <div className="relative mx-auto flex h-72 max-w-md items-center justify-center">
      <div className="absolute h-56 w-56 rounded-full blur-3xl" style={{ backgroundColor: "#FEF1D6" }} />
      <div className="relative w-full max-w-sm space-y-3">
        <div className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm" style={{ borderColor: BORDER }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "#FEF1D6" }}>
            <Target01Icon size={20} color="#B7791F" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold" style={{ color: INK }}>Cut-off marks by faculty</p>
            <div className="mt-1.5 h-2 w-full rounded-full" style={{ backgroundColor: "#E5E7EB" }}>
              <div className="h-2 w-3/5 rounded-full" style={{ backgroundColor: ACCENT }} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm" style={{ borderColor: BORDER }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "#E4E9F7" }}>
            <DocumentValidationIcon size={20} color={PRIMARY} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold" style={{ color: INK }}>Your subject combination</p>
            <p className="text-[11px]" style={{ color: MUTED }}>English, Biology, Chemistry, Physics</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm" style={{ borderColor: BORDER }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "#E7F6EC" }}>
            <CheckmarkCircle02Icon size={20} color="#16A34A" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold" style={{ color: INK }}>Aggregate score calculated</p>
            <p className="text-[11px]" style={{ color: MUTED }}>JAMB 268 + Post-UTME 74 = 342</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FreshersVisual() {
  return (
    <div className="relative mx-auto flex h-72 max-w-md items-center justify-center">
      <div className="absolute h-56 w-56 rounded-full blur-3xl" style={{ backgroundColor: "#DCE9E4" }} />
      <div className="relative w-full max-w-sm overflow-hidden rounded-xl border bg-white shadow-md" style={{ borderColor: BORDER }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ backgroundColor: PRIMARY }}>
          <GraduationScrollIcon size={20} color="#FFFFFF" />
          <span className="text-sm font-semibold text-white">Fresher checklist</span>
        </div>
        <div className="space-y-1 p-5">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <CheckmarkCircle02Icon size={18} color="#16A34A" />
            <div className="flex-1">
              <p className="text-xs font-semibold" style={{ color: INK }}>Acceptance</p>
              <p className="text-[10px]" style={{ color: MUTED }}>Offer accepted on CAPS</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2" style={{ backgroundColor: SECTION_BG }}>
            <CheckmarkCircle02Icon size={18} color="#16A34A" />
            <div className="flex-1">
              <p className="text-xs font-semibold" style={{ color: INK }}>Clearance</p>
              <p className="text-[10px]" style={{ color: MUTED }}>Documents submitted</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <CheckListIcon size={18} color="#F0C868" />
            <div className="flex-1">
              <p className="text-xs font-semibold" style={{ color: INK }}>School fees</p>
              <p className="text-[10px]" style={{ color: MUTED }}>Next up: payment and receipts</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <CheckListIcon size={18} color={BORDER} />
            <div className="flex-1">
              <p className="text-xs font-semibold" style={{ color: MUTED }}>Registration</p>
              <p className="text-[10px]" style={{ color: MUTED }}>After fees, in your faculty</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccommodationVisual() {
  return (
    <div className="relative mx-auto flex h-72 max-w-md items-center justify-center">
      <div className="absolute h-56 w-56 rounded-full blur-3xl" style={{ backgroundColor: "#DCE9E4" }} />
      <div className="relative w-full max-w-sm overflow-hidden rounded-xl border bg-white shadow-md" style={{ borderColor: BORDER }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: PRIMARY }}>
          <div className="flex items-center gap-2">
            <House01Icon size={20} color="#FFFFFF" />
            <span className="text-sm font-semibold text-white">Self-con. near East-West Road</span>
          </div>
        </div>
        <div className="space-y-3 p-5">
          <div className="flex items-end justify-between">
            <p className="text-xs" style={{ color: MUTED }}>Annual rent</p>
            <p className="text-2xl font-bold tracking-tight" style={{ color: INK }}>&#8358;280,000</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: MUTED }}>
            <Location01Icon size={14} color={PRIMARY} /> 8 minutes from UNIPORT main gate
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {["Single room", "Water", "Power", "Wi-Fi"].map((amenity) => (
              <span key={amenity} className="rounded-full border px-3 py-1 text-[11px] font-medium" style={{ borderColor: BORDER, color: INK }}>
                {amenity}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -right-2 -top-3 rounded-lg border bg-white px-4 py-2 shadow-md sm:right-2" style={{ borderColor: BORDER }}>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#16A34A" }} />
          <p className="text-xs font-semibold" style={{ color: INK }}>Rooms available now</p>
        </div>
      </div>
    </div>
  );
}

function JAMBVisual() {
  return (
    <div className="relative mx-auto flex h-72 max-w-md items-center justify-center">
      <div className="absolute h-56 w-56 rounded-full blur-3xl" style={{ backgroundColor: "#FDF2F8" }} />
      <div className="relative w-full max-w-sm rounded-xl border bg-white p-5 shadow-md" style={{ borderColor: BORDER }}>
        <div className="mb-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-pink-50 text-pink-700">
            UTME Mock Exam
          </span>
          <span className="text-xs font-semibold text-slate-500">180 questions</span>
        </div>
        <div className="space-y-3">
          <div className="h-3 w-5/6 rounded-full bg-slate-100" />
          <div className="h-3 w-full rounded-full bg-slate-100" />
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="rounded-lg border p-2 text-center text-xs font-semibold bg-slate-50 border-slate-200">
              Use Calculator
            </div>
            <div className="rounded-lg border p-2 text-center text-xs font-semibold text-white" style={{ backgroundColor: PRIMARY }}>
              Submit Exam
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
