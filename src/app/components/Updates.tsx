import { useEffect, useState } from "react";
import { Alert01Icon, Clock01Icon, Notification03Icon } from "hugeicons-react";
import { SEO } from "./SEO";
import { PublicShell } from "./PublicShell";
import { supabase } from "../../lib/supabase";
import { hasSupabaseEnv } from "../../lib/env";

interface UpdateRow {
  id: string;
  title: string;
  summary: string | null;
  body: string | null;
  category: string | null;
  audience: string | null;
  source: string | null;
  deadline: string | null;
  published_at: string | null;
}

const PRIMARY = "#2F4EA2";
const INK = "#111827";
const MUTED = "#6B7280";
const BORDER = "#BFC3C6";
const SECTION_BG = "#F7F8FA";

function categoryStyle(category: string | null) {
  switch (category) {
    case "post-utme":
      return { backgroundColor: "#EEF2FC", color: PRIMARY };
    case "admission":
      return { backgroundColor: "#E7F6EC", color: "#16A34A" };
    case "clearance":
      return { backgroundColor: "#FEF6E4", color: "#B7791F" };
    default:
      return { backgroundColor: "#F3F4F6", color: MUTED };
  }
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function Updates() {
  const [updates, setUpdates] = useState<UpdateRow[] | null>(null);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setUpdates([]);
      return;
    }
    supabase
      .from("updates")
      .select("*")
      .order("published_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setUpdates([]);
          return;
        }
        setUpdates((data as UpdateRow[]) ?? []);
      });
  }, []);

  return (
    <PublicShell backTo="/dashboard" backLabel="Back to dashboard">
      <SEO
        title="UNIPORT Updates"
        description="Verified UNIPORT news and announcements for aspirants and freshers: admission updates, deadlines and what to do next."
      />

      <div className="border-b" style={{ borderColor: BORDER, backgroundColor: SECTION_BG }}>
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
          <p className="mb-3 text-xs font-semibold tracking-[0.18em]" style={{ color: PRIMARY }}>
            UNIPORT UPDATES
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ color: INK }}>
            Verified news, no rumours.
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed" style={{ color: MUTED }}>
            Admission updates, post-UTME announcements and deadlines. Every update explains what happened,
            who it affects and what you should do.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12">
        {updates === null ? (
          <div className="grid gap-5">
            {[1, 2, 3].map((index) => (
              <div key={index} className="h-40 rounded-xl border" style={{ borderColor: BORDER, backgroundColor: SECTION_BG }} />
            ))}
          </div>
        ) : updates.length === 0 ? (
          <div className="mx-auto max-w-md py-16 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: "#EEF2FC" }}>
              <Notification03Icon size={28} color={PRIMARY} />
            </div>
            <h2 className="text-xl font-bold tracking-tight" style={{ color: INK }}>
              No updates yet
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: MUTED }}>
              We will post verified UNIPORT updates here as they break. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {updates.map((update) => (
              <article key={update.id} className="rounded-xl border bg-white p-6 md:p-8" style={{ borderColor: BORDER }}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full px-3 py-1 text-xs font-semibold" style={categoryStyle(update.category)}>
                    {update.category ?? "General"}
                  </span>
                  {update.audience && update.audience !== "everyone" && (
                    <span className="rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: BORDER, color: MUTED }}>
                      For {update.audience}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold tracking-tight md:text-2xl" style={{ color: INK }}>
                  {update.title}
                </h2>
                {update.summary && (
                  <p className="mt-3 leading-relaxed" style={{ color: MUTED }}>
                    {update.summary}
                  </p>
                )}
                {update.body && (
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed" style={{ color: INK }}>
                    {update.body}
                  </p>
                )}
                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-4" style={{ borderColor: BORDER }}>
                  {update.published_at && (
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: MUTED }}>
                      <Clock01Icon size={14} />
                      {formatDate(update.published_at)}
                    </span>
                  )}
                  {update.deadline && (
                    <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#B7791F" }}>
                      <Alert01Icon size={14} />
                      Deadline: {formatDate(update.deadline)}
                    </span>
                  )}
                  {update.source && (
                    <span className="text-xs" style={{ color: MUTED }}>
                      Source: {update.source}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
