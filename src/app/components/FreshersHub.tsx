import { SiWhatsapp } from "react-icons/si";
import {
  Building01Icon,
  CheckListIcon,
  CheckmarkCircle02Icon,
  DocumentValidationIcon,
  File01Icon,
  GraduationScrollIcon,
  House01Icon,
  Money01Icon,
  Shield01Icon,
  UserGroupIcon,
} from "hugeicons-react";
import { SEO } from "./SEO";
import { PublicShell } from "./PublicShell";

const PRIMARY = "#2F4EA2";
const INK = "#111827";
const MUTED = "#6B7280";
const BORDER = "#BFC3C6";
const SECTION_BG = "#F7F8FA";
const ACCENT = "#F5B942";

const WHATSAPP_URL = "https://wa.link/wx16gs";

interface FresherStage {
  title: string;
  icon: React.ReactNode;
  description: string;
  steps: string[];
}

// Stub content for now. The admin dashboard will manage this later.
const stages: FresherStage[] = [
  {
    title: "Acceptance",
    icon: <CheckmarkCircle02Icon size={22} color={PRIMARY} />,
    description: "You got admitted. Secure your place officially.",
    steps: [
      "Check JAMB CAPS and accept your admission offer",
      "Print your JAMB admission letter",
      "Follow the acceptance fee instructions in your offer",
    ],
  },
  {
    title: "Clearance",
    icon: <DocumentValidationIcon size={22} color={PRIMARY} />,
    description: "Prove your credentials to the university.",
    steps: [
      "Gather your O'Level results, JAMB result and birth certificate",
      "Submit your documents for clearance",
      "Resolve any discrepancies early, they cause delays",
    ],
  },
  {
    title: "School Fees",
    icon: <Money01Icon size={22} color={PRIMARY} />,
    description: "Pay acceptance and tuition fees.",
    steps: [
      "Generate your payment invoice on the school portal",
      "Pay at the designated bank or payment platform",
      "Keep every receipt. You will need them later",
    ],
  },
  {
    title: "Registration",
    icon: <File01Icon size={22} color={PRIMARY} />,
    description: "Register as a student of the university.",
    steps: [
      "Complete online registration in your faculty",
      "Finish physical registration with your department",
      "Collect your student ID after registration",
    ],
  },
  {
    title: "Medicals",
    icon: <Shield01Icon size={22} color={PRIMARY} />,
    description: "Complete the school health requirement.",
    steps: [
      "Visit the university health centre",
      "Complete the required medical checks",
      "Submit your medical result with your documents",
    ],
  },
  {
    title: "Faculty Requirements",
    icon: <Building01Icon size={22} color={PRIMARY} />,
    description: "Report to your faculty and department.",
    steps: [
      "Attend your faculty's orientation briefing",
      "Learn your department's requirements",
      "Meet your course adviser early",
    ],
  },
  {
    title: "Accommodation",
    icon: <House01Icon size={22} color={PRIMARY} />,
    description: "Find somewhere to stay before resumption chaos.",
    steps: [
      "Start looking early, good hostels fill fast",
      "Browse Campus Guide accommodation listings",
      "Visit the place before you pay anything",
    ],
  },
  {
    title: "Orientation",
    icon: <UserGroupIcon size={22} color={PRIMARY} />,
    description: "Settle in and learn how UNIPORT works.",
    steps: [
      "Attend the freshers' orientation programme",
      "Join Campus Guide fresher events",
      "Connect with other new students",
    ],
  },
  {
    title: "Important Documents",
    icon: <CheckListIcon size={22} color={PRIMARY} />,
    description: "Keep these safe and accessible.",
    steps: [
      "JAMB result and admission letter",
      "O'Level results and birth certificate",
      "Payment receipts and clearance slips",
    ],
  },
];

const clearanceNote = {
  title: "Physical Clearance",
  description:
    "Physical clearance happens at the Admission Office, New Convocation Arena (Wike Convocation Arena), Abuja Campus, after school fees payment is confirmed through Remita.",
  steps: [
    "JAMB Admission Letter",
    "Eligibility Form",
    "Medical Forms 1 and 2 / Green Card",
    "Matriculation Registration Form",
    "Matriculation Data",
    "Student Bio-Data Form",
    "Two Reference Letters",
  ],
  reminder:
    "It is best to prepare the letters early and keep every document together before you go for clearance.",
};

export function FreshersHub() {
  return (
    <PublicShell backTo="/dashboard" backLabel="Back to dashboard">
      <SEO
        title="Freshers Hub"
        description="You got admitted to UNIPORT. Acceptance, clearance, fees, registration and orientation, step by step."
      />

      <div className="border-b" style={{ borderColor: BORDER, backgroundColor: SECTION_BG }}>
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
          <p className="mb-3 text-xs font-semibold tracking-[0.18em]" style={{ color: PRIMARY }}>
            FRESHERS HUB
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ color: INK }}>
            You got admitted. Now what?
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed" style={{ color: MUTED }}>
            Acceptance, clearance, fees, registration, medicals and orientation. We break the whole process
            into steps, so you never miss what comes next.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-8 rounded-2xl border bg-white p-6" style={{ borderColor: BORDER }}>
          <p className="text-xs font-semibold tracking-[0.18em]" style={{ color: PRIMARY }}>
            TO DO / ROADMAP
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight" style={{ color: INK }}>
            Physical clearance checklist
          </h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: MUTED }}>
            {clearanceNote.description}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {clearanceNote.steps.map((step) => (
              <div key={step} className="flex items-start gap-2 rounded-lg bg-gray-50 px-4 py-3">
                <CheckmarkCircle02Icon size={16} color="#16A34A" className="mt-0.5 shrink-0" />
                <span className="text-sm" style={{ color: INK }}>{step}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm italic" style={{ color: MUTED }}>
            {clearanceNote.reminder}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stages.map((stage) => (
            <div key={stage.title} className="rounded-xl border bg-white p-6" style={{ borderColor: BORDER }}>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: "#EEF2FC" }}>
                {stage.icon}
              </div>
              <h2 className="text-base font-bold tracking-tight" style={{ color: INK }}>
                {stage.title}
              </h2>
              <p className="mt-1 text-sm" style={{ color: MUTED }}>
                {stage.description}
              </p>
              <ul className="mt-4 space-y-2.5 border-t pt-4" style={{ borderColor: BORDER }}>
                {stage.steps.map((step) => (
                  <li key={step} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: INK }}>
                    <CheckmarkCircle02Icon size={16} color="#16A34A" className="mt-0.5 shrink-0" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl px-8 py-12 text-center" style={{ backgroundColor: PRIMARY }}>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: "#F0C868" }}>
            <GraduationScrollIcon size={24} color="#7A5417" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Stuck at any step? We have done this before.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Chat with Campus Guide and get walked through your exact situation, from acceptance to your first
            day on campus.
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-lg px-8 py-3.5 font-semibold transition-opacity duration-150 hover:opacity-90"
            style={{ backgroundColor: "#25D366", color: "#FFFFFF" }}
          >
            <SiWhatsapp size={18} />
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </PublicShell>
  );
}
