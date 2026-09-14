import { useState } from "react";
import {
  RiFileList3Line,
  RiPrinterLine,
  RiExchangeLine,
  RiUploadCloud2Line,
  RiUserSearchLine,
  RiMailSendLine,
  RiBookOpenLine,
  RiBuilding4Line,
  RiCompassDiscoverLine,
} from "react-icons/ri";
import {
  PiCertificateDuotone,
  PiScanDuotone,
  PiListChecksDuotone,
  PiCompassDuotone,
} from "react-icons/pi";
import {
  TbClipboardText,
  TbArrowsExchange,
  TbCloudUpload,
  TbTargetArrow,
  TbAward,
  TbFileCheck,
  TbEdit,
  TbHelpCircle,
  TbChevronDown,
} from "react-icons/tb";
import { SiWhatsapp } from "react-icons/si";
import { SEO } from "./SEO";
import { PublicShell } from "./PublicShell";
import { whatsappLink, whatsappMessages } from "../../lib/whatsapp";

const PRIMARY = "#2F4EA2";
const INK = "#111827";
const MUTED = "#6B7280";
const BORDER = "#BFC3C6";
const SECTION_BG = "#F7F8FA";

const jambServices = [
  {
    title: "JAMB Registration",
    description: "Complete guidance through the JAMB UTME registration process, from creating your profile to final submission.",
    icon: <TbClipboardText size={22} color={PRIMARY} />,
  },
  {
    title: "JAMB Reprinting",
    description: "Assistance with reprinting your JAMB registration slip when you need a physical copy.",
    icon: <RiPrinterLine size={22} color={PRIMARY} />,
  },
  {
    title: "JAMB Original Result",
    description: "Help checking and obtaining your official JAMB UTME result slip.",
    icon: <PiCertificateDuotone size={22} color={PRIMARY} />,
  },
  {
    title: "JAMB Admission Letter",
    description: "Support for downloading and printing your JAMB admission letter.",
    icon: <RiMailSendLine size={22} color={PRIMARY} />,
  },
  {
    title: "Change of Course / Institution",
    description: "Assistance with changing your course or institution on the JAMB portal.",
    icon: <TbArrowsExchange size={22} color={PRIMARY} />,
  },
  {
    title: "O'Level Result Upload",
    description: "Help uploading your O'Level results to the JAMB portal.",
    icon: <TbCloudUpload size={22} color={PRIMARY} />,
  },
  {
    title: "Admission Status Check",
    description: "Check your JAMB admission status on CAPS and track your admission progress.",
    icon: <PiScanDuotone size={22} color={PRIMARY} />,
  },
];

const postUtmeServices = [
  {
    title: "Post-UTME Registration",
    description: "Guidance through the UNIPORT Post-UTME registration process.",
    icon: <TbEdit size={22} color={PRIMARY} />,
  },
  {
    title: "Post-UTME Result",
    description: "Help checking your UNIPORT Post-UTME result.",
    icon: <TbAward size={22} color={PRIMARY} />,
  },
  {
    title: "Post-UTME / Application Assistance",
    description: "Support with your Post-UTME application, document preparation and submission.",
    icon: <TbFileCheck size={22} color={PRIMARY} />,
  },
  {
    title: "Admission / Screening Assistance",
    description: "Help navigating the admission screening process and clearance requirements.",
    icon: <PiCompassDuotone size={22} color={PRIMARY} />,
  },
];

const guideCards = [
  {
    icon: <RiBookOpenLine size={24} color={PRIMARY} />,
    title: "Admission Requirements",
    items: [
      "A valid JAMB UTME result for the current admission cycle",
      "Credit passes in core subjects for your faculty (not more than two sittings)",
      "Registration for the UNIPORT Post-UTME within the announced window",
      "Standard documents such as birth certificate and identification",
    ],
  },
  {
    icon: <TbTargetArrow size={24} color={PRIMARY} />,
    title: "Cut-off Information",
    items: [
      "Your JAMB score and Post-UTME score are combined into an aggregate",
      "Cut-off scores differ by faculty, and competitive courses sit higher",
      "Figures are verified before publication, no rumour mill",
    ],
  },
  {
    icon: <PiListChecksDuotone size={24} color={PRIMARY} />,
    title: "Subject Combinations",
    items: [
      "Each faculty has its own combination rules",
      "JAMB and Post-UTME subject combinations can differ",
      "Wrong combination is a common reason applications stall",
    ],
  },
  {
    icon: <RiCompassDiscoverLine size={24} color={PRIMARY} />,
    title: "Application Process",
    items: [
      "Prepare JAMB result, O'Level results, and identification documents",
      "Register for Post-UTME on the official portal within the window",
      "Practice using Campus Guide CBT format before the exam",
      "Track your aggregate and follow the clearance process step by step",
    ],
  },
];

const faqs = [
  {
    question: "How do I access these services?",
    answer:
      "The Campus Guide team handles each service for you. Use the WhatsApp button at the bottom of this page to reach us, describe the service you need, and we will guide you through the process.",
  },
  {
    question: "Are these services free?",
    answer:
      "Some services are free, others involve official fees from JAMB or UNIPORT. We will always tell you the cost before proceeding.",
  },
  {
    question: "How long does each service take?",
    answer:
      "Most services are completed within 24 to 48 hours. Complex ones like change of course or admission letter may take longer depending on portal availability.",
  },
  {
    question: "Can I track my service request?",
    answer:
      "Yes. Once you contact us on WhatsApp, you will receive updates on the status of your request until it is completed.",
  },
];

export function AspirantServices() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <PublicShell backTo="/dashboard" backLabel="Back to dashboard">
      <SEO
        title="Aspirant Services - JAMB and Post-UTME Support"
        description="JAMB and Post-UTME services for UNIPORT aspirants: registration, results, admission letters, subject combinations and more."
        canonical="https://campusguide.ng/aspirant-services"
      />

      <div className="border-b" style={{ borderColor: BORDER, backgroundColor: SECTION_BG }}>
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-5xl" style={{ color: INK }}>
            JAMB and Post-UTME support, handled for you.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed" style={{ color: MUTED }}>
            From registration to admission, the Campus Guide team handles the process so you can focus on preparing for your exams.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-16 px-4 py-16">
        <section>
          <div className="mb-8 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ backgroundColor: "#EEF2FC" }}>
              <TbTargetArrow size={24} color={PRIMARY} />
            </span>
            <div>
              <h2 className="text-2xl font-bold tracking-tight" style={{ color: INK }}>
                JAMB Services
              </h2>
              <p className="text-sm" style={{ color: MUTED }}>
                Full support for your JAMB UTME.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {jambServices.map((service) => (
              <div
                key={service.title}
                className="flex items-start gap-4 rounded-xl border bg-white p-5 transition-colors duration-150 hover:border-[#2F4EA2]"
                style={{ borderColor: BORDER }}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "#EEF2FC" }}>
                  {service.icon}
                </span>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: INK }}>
                    {service.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: MUTED }}>
                    {service.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-8 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ backgroundColor: "#EEF2FC" }}>
              <TbFileCheck size={24} color={PRIMARY} />
            </span>
            <div>
              <h2 className="text-2xl font-bold tracking-tight" style={{ color: INK }}>
                Post-UTME Services
              </h2>
              <p className="text-sm" style={{ color: MUTED }}>
                Support for your UNIPORT Post-UTME and admission process.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {postUtmeServices.map((service) => (
              <div
                key={service.title}
                className="flex items-start gap-4 rounded-xl border bg-white p-5 transition-colors duration-150 hover:border-[#2F4EA2]"
                style={{ borderColor: BORDER }}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "#EEF2FC" }}>
                  {service.icon}
                </span>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: INK }}>
                    {service.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: MUTED }}>
                    {service.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-8 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ backgroundColor: "#EEF2FC" }}>
              <TbHelpCircle size={24} color={PRIMARY} />
            </span>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: INK }}>
              Aspirant Guide
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {guideCards.map((card) => (
              <div key={card.title} className="rounded-xl border bg-white p-6" style={{ borderColor: BORDER }}>
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "#EEF2FC" }}>
                    {card.icon}
                  </span>
                  <h3 className="text-lg font-bold tracking-tight" style={{ color: INK }}>
                    {card.title}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {card.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm leading-relaxed" style={{ color: MUTED }}>
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: PRIMARY }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-8 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "#EEF2FC" }}>
              <TbHelpCircle size={24} color={PRIMARY} />
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
                      <TbChevronDown
                        size={18}
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
                Ask about any service, requirements, or anything else about JAMB and Post-UTME. The Campus Guide team replies on WhatsApp.
              </p>
            </div>
            <a
              href={whatsappLink(whatsappMessages.generalInquiry())}
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
