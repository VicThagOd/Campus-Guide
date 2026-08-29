import { useState } from "react";
import {
  ArrowDown01Icon,
  CheckListIcon,
  ClipboardIcon,
  HelpCircleIcon,
  Route01Icon,
  Target01Icon,
} from "hugeicons-react";
import { SiWhatsapp } from "react-icons/si";
import { SEO } from "./SEO";
import { PublicShell } from "./PublicShell";

const PRIMARY = "#2F4EA2";
const INK = "#111827";
const MUTED = "#6B7280";
const BORDER = "#BFC3C6";
const SECTION_BG = "#F7F8FA";
const WHATSAPP_LINK = "https://wa.link/wx16gs";

const faqs = [
  {
    question: "When will the full admission guides be published?",
    answer:
      "The Campus Guide team is preparing detailed, verified guides per faculty. This section is structural for now, and the real content will replace it before the next admission cycle.",
  },
  {
    question: "Are these cut-off figures official UNIPORT figures?",
    answer:
      "Not yet. We will only publish figures we can verify with the school or JAMB. Until then, treat anything shown here as placeholder material.",
  },
  {
    question: "How do I know which subject combination applies to my course?",
    answer:
      "Combinations are grouped by faculty for now. When the full guides land, each course will list its exact JAMB and O'Level requirements.",
  },
  {
    question: "Can I ask questions directly?",
    answer:
      "Yes. Use the WhatsApp button below and the team will answer you personally.",
  },
];

export function AspirantServices() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <PublicShell backTo="/dashboard" backLabel="Back to dashboard">
      <SEO
        title="Aspirant Services"
        description="Admission requirements, cut-off information, subject combinations and the application process for UNIPORT aspirants."
        canonical="https://campusguide.ng/aspirant-services"
      />

      <div className="border-b" style={{ borderColor: BORDER, backgroundColor: SECTION_BG }}>
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
          <p className="mb-3 text-xs font-semibold tracking-[0.18em]" style={{ color: PRIMARY }}>
            ASPIRANT SERVICES
          </p>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-5xl" style={{ color: INK }}>
            Know what UNIPORT needs before the day you apply.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed" style={{ color: MUTED }}>
            Requirements, cut-offs, subject combinations and the application process, gathered in one place
            so you are not chasing rumours on WhatsApp groups.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-16 px-4 py-16">
        <InfoSection
          icon={<ClipboardIcon size={24} color={PRIMARY} />}
          title="Admission Requirements"
          note="Placeholder content. Verified requirements are being prepared by the Campus Guide team."
          items={[
            {
              heading: "JAMB result",
              body: "A valid JAMB UTME result for the current admission cycle, with the right subject combination for your course.",
            },
            {
              heading: "O'Level results",
              body: "Credit passes in the core subjects for your faculty, in not more than two sittings. The exact subject list goes here soon.",
            },
            {
              heading: "Post UTME registration",
              body: "Every aspirant must register for the UNIPORT Post UTME within the announced window. Dates go here when they are published.",
            },
            {
              heading: "Age and other documents",
              body: "Standard documents such as birth certificate and identification. Full checklist to come.",
            },
          ]}
        />

        <InfoSection
          icon={<Target01Icon size={24} color={PRIMARY} />}
          title="Cut-off Information"
          note="Placeholder content. Verified cut-off figures are being prepared."
          items={[
            {
              heading: "How the aggregate works",
              body: "Your JAMB score and Post UTME score are combined into an aggregate, and admission is ranked on it. The exact weighting goes here once verified.",
            },
            {
              heading: "Faculty cut-offs",
              body: "Cut-off scores differ by faculty, and competitive courses sit higher. Figures will be listed here, per faculty and per course, when confirmed.",
            },
            {
              heading: "Why you should not trust rumours",
              body: "Cut-off talk spreads fast before results. We will only publish numbers we can trace to an official source.",
            },
          ]}
        />

        <InfoSection
          icon={<CheckListIcon size={24} color={PRIMARY} />}
          title="Subject Combinations"
          note="Placeholder content. Per-course combinations are being prepared."
          items={[
            {
              heading: "By faculty",
              body: "Medicine, Engineering, Law, Management and the other faculties each have their own combination rules. The full breakdown goes here soon.",
            },
            {
              heading: "JAMB versus Post UTME",
              body: "Your JAMB combination and your Post UTME subjects can differ. Both lists will be shown side by side for every course.",
            },
            {
              heading: "Wrong combination, rejected application",
              body: "A mismatch in subjects is one of the most common reasons applications stall. The guide will flag this early.",
            },
          ]}
        />

        <InfoSection
          icon={<Route01Icon size={24} color={PRIMARY} />}
          title="Application Process"
          note="Placeholder content. Step-by-step instructions are being prepared."
          items={[
            {
              heading: "Step 1: Prepare your documents",
              body: "JAMB result, O'Level results, and identification. Everything scanned and named before you start.",
            },
            {
              heading: "Step 2: Register for Post UTME",
              body: "Create your account on the official portal within the announced window and pay the registration fee.",
            },
            {
              heading: "Step 3: Practice and sit the exam",
              body: "The exam follows a CBT format. Campus Guide's practice hub is built to match that format exactly.",
            },
            {
              heading: "Step 4: Track your admission",
              body: "Check your aggregate, watch for cut-off announcements, and follow the clearance process step by step.",
            },
          ]}
        />

        <section>
          <div className="mb-8 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ backgroundColor: "#EEF2FC" }}>
              <HelpCircleIcon size={24} color={PRIMARY} />
            </span>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: INK }}>
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const open = openFaq === index;
              return (
                <div key={faq.question} className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: BORDER }}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-150 hover:bg-gray-50"
                    aria-expanded={open}
                  >
                    <span className="text-sm font-semibold" style={{ color: INK }}>{faq.question}</span>
                    <span className="shrink-0">
                      <ArrowDown01Icon
                        size={16}
                        color={PRIMARY}
                        style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms" }}
                      />
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-150"
                    style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-4 text-sm leading-relaxed" style={{ color: MUTED }}>
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section
          className="rounded-2xl border p-8 md:p-10"
          style={{ borderColor: "#D1D9F0", backgroundColor: "#EEF2FC" }}
        >
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <h2 className="text-2xl font-bold tracking-tight" style={{ color: INK }}>
                Still stuck? Talk to a human.
              </h2>
              <p className="mt-2 max-w-md leading-relaxed" style={{ color: MUTED }}>
                Ask about requirements, cut-offs or anything else about the application. The Campus Guide
                team replies on WhatsApp.
              </p>
            </div>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition-opacity duration-150 hover:opacity-90"
              style={{ backgroundColor: "#25D366" }}
            >
              <SiWhatsapp size={18} />
              Contact us on WhatsApp
            </a>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}

function InfoSection({
  icon,
  title,
  note,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  note: string;
  items: { heading: string; body: string }[];
}) {
  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ backgroundColor: "#EEF2FC" }}>
          {icon}
        </span>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: INK }}>
          {title}
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.heading} className="rounded-xl border bg-white p-6" style={{ borderColor: BORDER }}>
            <h3 className="mb-2 text-base font-semibold tracking-tight" style={{ color: INK }}>
              {item.heading}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
              {item.body}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs" style={{ color: "#9CA3AF" }}>
        {note}
      </p>
    </section>
  );
}