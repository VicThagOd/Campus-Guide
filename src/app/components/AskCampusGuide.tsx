import { FormEvent, useState } from "react";
import { ArrowDown01Icon, CheckmarkCircle02Icon, HelpCircleIcon, QuestionIcon } from "hugeicons-react";
import { SiWhatsapp } from "react-icons/si";
import { SEO } from "./SEO";
import { PublicShell } from "./PublicShell";
import { supabase } from "../../lib/supabase";
import { hasSupabaseEnv } from "../../lib/env";
import { useAuth } from "../../context/AuthContext";

const PRIMARY = "#2F4EA2";
const INK = "#111827";
const MUTED = "#6B7280";
const BORDER = "#BFC3C6";
const SECTION_BG = "#F7F8FA";

const WHATSAPP_URL = "https://wa.link/wx16gs";

const categories = ["admission", "clearance", "course", "registration", "accommodation", "other"];

const faqs = [
  {
    question: "What is UNIPORT's post-UTME cut-off mark?",
    answer:
      "UNIPORT sets its own departmental cut-off marks each year, usually announced after the post-UTME screening. Check the Aspirant Hub for the latest cut-off information per faculty.",
  },
  {
    question: "How does the post-UTME scoring work?",
    answer:
      "The post-UTME score is combined with your JAMB score to produce your aggregate. Your aggregate determines whether you meet your department's cut-off. Use the aggregate calculator in the Aspirant Hub.",
  },
  {
    question: "When is the admission list released?",
    answer:
      "Admission lists are usually released in batches after screening. Watch the UNIPORT Updates section, and check JAMB CAPS to accept your admission once it appears.",
  },
  {
    question: "How do I accept my UNIPORT admission?",
    answer:
      "Log in to JAMB CAPS, find your admission status, accept the offer and print your admission letter. This is the first step in the Freshers Hub.",
  },
  {
    question: "What documents do I need for clearance?",
    answer:
      "O'Level results, JAMB result slip, admission letter, birth certificate and payment receipts. The Freshers Hub lists everything you need before clearance starts.",
  },
];

export function AskCampusGuide() {
  const { profile } = useAuth();
  const [category, setCategory] = useState("admission");
  const [question, setQuestion] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim() || state === "submitting") return;
    setState("submitting");
    try {
      const { error } = await supabase.from("ask_questions").insert({
        user_id: profile?.id ?? null,
        name: profile?.name ?? null,
        email: profile?.email ?? null,
        category,
        question: question.trim(),
      });
      if (error) throw error;
      setQuestion("");
      setState("done");
    } catch {
      setState("error");
    }
  };

  return (
    <PublicShell backTo="/dashboard" backLabel="Back to dashboard">
      <SEO
        title="Ask Campus Guide"
        description="Ask anything about UNIPORT admission, clearance, courses and registration. Get a straight answer."
      />

      <div className="border-b" style={{ borderColor: BORDER, backgroundColor: SECTION_BG }}>
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
          <p className="mb-3 text-xs font-semibold tracking-[0.18em]" style={{ color: PRIMARY }}>
            ASK CAMPUS GUIDE
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ color: INK }}>
            Stuck on anything UNIPORT? Ask.
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed" style={{ color: MUTED }}>
            Admission questions, clearance questions, courses, registration, accommodation. Ask us and get a
            straight answer.
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-12 px-4 py-12 lg:grid-cols-2">
        <section>
          {state === "done" ? (
            <div className="rounded-xl border bg-white p-10 text-center" style={{ borderColor: BORDER }}>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: "#E7F6EC" }}>
                <CheckmarkCircle02Icon size={28} color="#16A34A" />
              </div>
              <h2 className="text-xl font-bold tracking-tight" style={{ color: INK }}>
                Question received
              </h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: MUTED }}>
                We will answer your question and keep you posted. If it is urgent, chat with us on WhatsApp.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
                  style={{ backgroundColor: "#25D366" }}
                >
                  <SiWhatsapp size={16} />
                  Chat on WhatsApp
                </a>
                <button
                  onClick={() => setState("idle")}
                  className="rounded-lg border px-6 py-3 text-sm font-semibold transition-colors duration-150 hover:bg-gray-50"
                  style={{ borderColor: BORDER, color: PRIMARY }}
                >
                  Ask another question
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 md:p-8" style={{ borderColor: BORDER }}>
              <h2 className="text-lg font-bold tracking-tight" style={{ color: INK }}>
                Ask your question
              </h2>
              <p className="mt-1 text-sm" style={{ color: MUTED }}>
                {profile?.name ? `Hi ${profile.name}, ` : ""}we answer every question.
              </p>

              <label className="mt-6 block text-sm font-medium" style={{ color: INK }}>
                Category
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150 ${
                      category === item ? "text-white" : "border bg-white"
                    }`}
                    style={
                      category === item
                        ? { backgroundColor: PRIMARY }
                        : { borderColor: BORDER, color: INK }
                    }
                  >
                    {item}
                  </button>
                ))}
              </div>

              <label className="mt-6 block text-sm font-medium" style={{ color: INK }}>
                Your question
              </label>
              <textarea
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  if (state === "error") setState("idle");
                }}
                rows={5}
                required
                placeholder="Type your UNIPORT question here..."
                className="mt-2 w-full rounded-lg border bg-white p-3 text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#DCE4FA]"
                style={{ borderColor: BORDER, color: INK }}
              />

              {state === "error" && (
                <p className="mt-3 text-sm font-medium" style={{ color: "#DC2626" }}>
                  Could not send your question right now. Please try again.
                </p>
              )}

              <button
                type="submit"
                disabled={state === "submitting"}
                className="mt-6 w-full rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: PRIMARY }}
              >
                {state === "submitting" ? "Sending..." : "Send Question"}
              </button>
            </form>
          )}
        </section>

        <section>
          <h2 className="mb-5 flex items-center gap-2 text-lg font-bold tracking-tight" style={{ color: INK }}>
            <HelpCircleIcon size={20} color={PRIMARY} />
            Common questions
          </h2>
          <div className="grid gap-3">
            {faqs.map((faq, index) => (
              <div key={faq.question} className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: BORDER }}>
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold" style={{ color: INK }}>
                    {faq.question}
                  </span>
                  <ArrowDown01Icon
                    size={16}
                    color={PRIMARY}
                    className="shrink-0 transition-transform duration-150"
                    style={{ transform: openFaq === index ? "rotate(180deg)" : "none" }}
                  />
                </button>
                <div
                  className="grid transition-all duration-150"
                  style={{ gridTemplateRows: openFaq === index ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="border-t px-5 py-4 text-sm leading-relaxed" style={{ borderColor: BORDER, color: MUTED }}>
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-start gap-4 rounded-xl border p-6" style={{ borderColor: BORDER, backgroundColor: SECTION_BG }}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "#EEF2FC" }}>
              <QuestionIcon size={22} color={PRIMARY} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: INK }}>
                Need an answer right now?
              </p>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: MUTED }}>
                Chat with Campus Guide directly on WhatsApp for urgent questions.
              </p>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity duration-150 hover:opacity-70"
                style={{ color: "#25D366" }}
              >
                <SiWhatsapp size={15} />
                Open WhatsApp chat
              </a>
            </div>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
