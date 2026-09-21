import {
  CallIcon,
  DocumentValidationIcon,
  House01Icon,
  Location01Icon,
  Mail01Icon,
  Target01Icon,
  UserGroupIcon,
} from "hugeicons-react";
import { SiWhatsapp } from "react-icons/si";
import { SEO } from "./SEO";
import { PublicShell } from "./PublicShell";
import { whatsappLink, whatsappMessages } from "../../lib/whatsapp";

const PRIMARY = "#2F4EA2";
const INK = "#111827";
const MUTED = "#6B7280";
const BORDER = "#BFC3C6";
const SECTION_BG = "#F7F8FA";

export function About() {
  return (
    <PublicShell>
      <SEO
        title="About Campus Guide"
        description="Who Campus Guide is, what we do, and how to reach us at the University of Port Harcourt, Choba."
        canonical="https://campusguide.ng/about"
      />

      <div className="border-b" style={{ borderColor: BORDER, backgroundColor: SECTION_BG }}>
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-5xl" style={{ color: INK }}>
            Built for students, by people who have been through it.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed" style={{ color: MUTED }}>
            Campus Guide started with one problem: getting ready for the UNIPORT Post UTME without
            reliable past questions or honest guidance.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-12 px-4 py-16">
        <section className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-8" style={{ borderColor: BORDER }}>
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: "#EEF2FC" }}>
              <UserGroupIcon size={26} color={PRIMARY} />
            </span>
            <h2 className="mb-3 text-xl font-bold tracking-tight" style={{ color: INK }}>
              Who Campus Guide is
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
              We are a student-facing platform based at the University of Port Harcourt, Choba, Rivers
              State. Our team has sat through the same waits, the same rumour-filled WhatsApp groups and
              the same surprises that come with applying to UNIPORT, and we built Campus Guide to remove
              as many of those surprises as possible.
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-8" style={{ borderColor: BORDER }}>
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: "#EEF2FC" }}>
              <Target01Icon size={26} color={PRIMARY} />
            </span>
            <h2 className="mb-3 text-xl font-bold tracking-tight" style={{ color: INK }}>
              What we do
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
              Today, Campus Guide is a Post UTME practice platform: real past questions, UNIPORT-style
              CBT mock tests and performance tracking. Around that core, we are building aspirant
              guides, student accommodation listings and a campus events calendar, so one account
              carries you from JAMB result to your first week on campus.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-8 md:p-10" style={{ borderColor: BORDER }}>
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: "#EEF2FC" }}>
            <House01Icon size={26} color={PRIMARY} />
          </span>
          <h2 className="mb-3 text-xl font-bold tracking-tight" style={{ color: INK }}>
            Where we are
          </h2>
          <p className="flex items-center gap-2 text-sm leading-relaxed" style={{ color: MUTED }}>
            <Location01Icon size={18} color={PRIMARY} />
            University of Port Harcourt, Choba, Rivers State, Nigeria
          </p>
        </section>

        <section>
          <h2 className="mb-6 text-xl font-bold tracking-tight" style={{ color: INK }}>
            Contact information
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <a
              href="mailto:ehreekig@gmail.com"
              className="rounded-xl border bg-white p-6 transition-colors duration-150 hover:border-[#2F4EA2]"
              style={{ borderColor: BORDER }}
            >
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "#EEF2FC" }}>
                <Mail01Icon size={20} color={PRIMARY} />
              </span>
              <p className="text-sm font-semibold" style={{ color: INK }}>Email</p>
              <p className="mt-1 text-sm" style={{ color: PRIMARY }}>ehreekig@gmail.com</p>
            </a>
            <a
              href="tel:+2348109030024"
              className="rounded-xl border bg-white p-6 transition-colors duration-150 hover:border-[#2F4EA2]"
              style={{ borderColor: BORDER }}
            >
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "#EEF2FC" }}>
                <CallIcon size={20} color={PRIMARY} />
              </span>
              <p className="text-sm font-semibold" style={{ color: INK }}>Phone</p>
              <p className="mt-1 text-sm" style={{ color: PRIMARY }}>+234 810 903 0024</p>
              <p className="text-xs text-gray-400 mt-0.5">Alt: +234 915 585 6826</p>
            </a>
            <a
              href={whatsappLink(whatsappMessages.generalInquiry())}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border bg-white p-6 transition-colors duration-150 hover:border-[#2F4EA2]"
              style={{ borderColor: BORDER }}
            >
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "#E7F6EC" }}>
                <SiWhatsapp size={20} color="#25D366" />
              </span>
              <p className="text-sm font-semibold" style={{ color: INK }}>WhatsApp</p>
              <p className="mt-1 text-sm font-medium" style={{ color: "#25D366" }}>Chat with us</p>
            </a>
          </div>
          <p className="mt-6 text-xs" style={{ color: "#9CA3AF" }}>
            Our full contact page has more ways to reach us, including Facebook and TikTok.
          </p>
        </section>

        <section className="flex flex-col items-start justify-between gap-6 rounded-2xl border p-8 md:flex-row md:items-center" style={{ borderColor: "#D1D9F0", backgroundColor: "#EEF2FC" }}>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ backgroundColor: "#FFFFFF" }}>
              <DocumentValidationIcon size={22} color={PRIMARY} />
            </span>
            <div>
              <p className="text-base font-semibold" style={{ color: INK }}>
                Ready to start practising?
              </p>
              <p className="text-sm" style={{ color: MUTED }}>
                Your first two CBT mock tests are free.
              </p>
            </div>
          </div>
          <a
            href="/login"
            className="rounded-lg px-6 py-3 font-semibold text-white transition-opacity duration-150 hover:opacity-90"
            style={{ backgroundColor: PRIMARY }}
          >
            Get Started Free
          </a>
        </section>
      </div>
    </PublicShell>
  );
}