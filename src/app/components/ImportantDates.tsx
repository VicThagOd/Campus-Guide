import { useEffect, useState } from "react";
import { Calendar01Icon, Calendar03Icon } from "hugeicons-react";
import { SEO } from "./SEO";
import { PublicShell } from "./PublicShell";
import { supabase } from "../../lib/supabase";
import { hasSupabaseEnv } from "../../lib/env";

interface DateRow {
  id: string;
  title: string;
  category: string | null;
  event_date: string;
  note: string | null;
}

const PRIMARY = "#2F4EA2";
const INK = "#111827";
const MUTED = "#6B7280";
const BORDER = "#BFC3C6";
const SECTION_BG = "#F7F8FA";

function categoryStyle(category: string | null) {
  switch (category) {
    case "jamb":
      return { backgroundColor: "#EEF2FC", color: PRIMARY };
    case "post-utme":
      return { backgroundColor: "#FEF6E4", color: "#B7791F" };
    case "admission":
    case "acceptance":
      return { backgroundColor: "#E7F6EC", color: "#16A34A" };
    case "screening":
      return { backgroundColor: "#FBE7E2", color: "#C2410C" };
    case "registration":
      return { backgroundColor: "#EDE9FE", color: "#6D28D9" };
    default:
      return { backgroundColor: "#F3F4F6", color: MUTED };
  }
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function ImportantDates() {
  const [dates, setDates] = useState<DateRow[] | null>(null);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setDates([]);
      return;
    }
    supabase
      .from("important_dates")
      .select("*")
      .order("event_date", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          setDates([]);
          return;
        }
        setDates((data as DateRow[]) ?? []);
      });
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = (dates ?? []).filter((row) => new Date(row.event_date) >= today);
  const past = (dates ?? []).filter((row) => new Date(row.event_date) < today);

  function DateBlock({ value, dimmed }: { value: string; dimmed: boolean }) {
    const date = new Date(value);
    return (
      <div
        className="flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 self-stretch rounded-l-xl"
        style={{ backgroundColor: dimmed ? "#9CA3AF" : PRIMARY }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white">{MONTHS[date.getMonth()]}</span>
        <span className="text-2xl font-bold leading-none text-white">{date.getDate()}</span>
      </div>
    );
  }

  function DateCard({ row, dimmed }: { row: DateRow; dimmed: boolean }) {
    return (
      <div
        className={`flex items-stretch overflow-hidden rounded-xl border bg-white ${dimmed ? "opacity-60" : ""}`}
        style={{ borderColor: BORDER }}
      >
        <DateBlock value={row.event_date} dimmed={dimmed} />
        <div className="flex-1 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold" style={{ color: INK }}>
              {row.title}
            </h3>
            {dimmed && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: "#F3F4F6", color: MUTED }}>
                Past
              </span>
            )}
          </div>
          <span className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={categoryStyle(row.category)}>
            {(row.category ?? "other").replace(/-/g, " ")}
          </span>
          {row.note && (
            <p className="mt-2 text-xs leading-relaxed" style={{ color: MUTED }}>
              {row.note}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <PublicShell backTo="/dashboard" backLabel="Back to dashboard">
      <SEO
        title="UNIPORT Important Dates"
        description="JAMB, post-UTME, screening, admission, acceptance, clearance and registration dates for UNIPORT, in one calendar."
      />

      <div className="border-b" style={{ borderColor: BORDER, backgroundColor: SECTION_BG }}>
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ color: INK }}>
            Every deadline, in one place.
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed" style={{ color: MUTED }}>
            JAMB, post-UTME, screening, admission, acceptance, clearance and registration. Check the dates
            that matter for UNIPORT.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12">
        {dates === null ? (
          <div className="grid gap-4">
            {[1, 2, 3, 4].map((index) => (
              <div key={index} className="h-24 rounded-xl border" style={{ borderColor: BORDER, backgroundColor: SECTION_BG }} />
            ))}
          </div>
        ) : dates.length === 0 ? (
          <div className="mx-auto max-w-md py-16 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: "#EEF2FC" }}>
              <Calendar03Icon size={28} color={PRIMARY} />
            </div>
            <h2 className="text-xl font-bold tracking-tight" style={{ color: INK }}>
              No dates yet
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: MUTED }}>
              We will add verified UNIPORT dates here as they are announced. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {upcoming.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wide" style={{ color: PRIMARY }}>
                  <Calendar01Icon size={16} />
                  UPCOMING
                </h2>
                <div className="grid gap-3">
                  {upcoming.map((row) => (
                    <DateCard key={row.id} row={row} dimmed={false} />
                  ))}
                </div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h2 className="mb-4 text-sm font-semibold tracking-wide" style={{ color: MUTED }}>
                  PAST DATES
                </h2>
                <div className="grid gap-3">
                  {past.map((row) => (
                    <DateCard key={row.id} row={row} dimmed />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
