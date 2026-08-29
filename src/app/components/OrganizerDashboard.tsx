import { useEffect, useMemo, useState } from "react";
import { Alert02Icon, CheckmarkCircle02Icon, Loading01Icon, Ticket01Icon } from "hugeicons-react";
import { supabase } from "../../lib/supabase";
import { PublicShell } from "./PublicShell";
import { SEO } from "./SEO";

type EventRow = {
  id: string;
  title: string;
  organizer_name: string | null;
  organizer_code: string | null;
  ticket_price: number;
  is_paid: boolean;
  banner_image_url: string | null;
};

type TicketRow = {
  id: string;
  event_id: string;
  tier_name: string;
  tier_price: number;
  ticket_code: string;
  payment_reference: string | null;
  whatsapp_number: string;
  checked_in: boolean;
  receipt_number: string | null;
  purchaser_name: string | null;
  purchaser_email: string | null;
  created_at: string;
};

function currency(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

export function OrganizerDashboard() {
  const [code, setCode] = useState("");
  const [submittedCode, setSubmittedCode] = useState("");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [windowFilter, setWindowFilter] = useState<"all" | "month" | "week">("all");

  useEffect(() => {
    const saved = window.localStorage.getItem("campusguide_organizer_code");
    if (saved) {
      setCode(saved);
      setSubmittedCode(saved);
    }
  }, []);

  useEffect(() => {
    if (!submittedCode) return;
    setLoading(true);
    setError("");
    Promise.all([
      supabase.from("events").select("id, title, organizer_name, organizer_code, ticket_price, is_paid, banner_image_url").eq("organizer_code", submittedCode),
    ])
      .then(async ([eventRes]) => {
        if (eventRes.error) throw eventRes.error;
        const matchedEvents = (eventRes.data as EventRow[]) ?? [];
        setEvents(matchedEvents);

        const eventIds = matchedEvents.map((event) => event.id);
        if (eventIds.length === 0) {
          setTickets([]);
          return;
        }

        const ticketRes = await supabase
          .from("event_tickets")
          .select("id, event_id, tier_name, tier_price, ticket_code, payment_reference, whatsapp_number, checked_in, receipt_number, purchaser_name, purchaser_email, created_at")
          .in("event_id", eventIds)
          .order("created_at", { ascending: false });

        if (ticketRes.error) throw ticketRes.error;
        setTickets((ticketRes.data as TicketRow[]) ?? []);
      })
      .catch((err: any) => {
        setError(err?.message || "Could not load organizer data.");
        setEvents([]);
        setTickets([]);
      })
      .finally(() => setLoading(false));
  }, [submittedCode]);

  const stats = useMemo(() => {
    const eventIds = new Set(events.map((event) => event.id));
    const scopedTickets = tickets.filter((ticket) => eventIds.has(ticket.event_id));
    const now = new Date();
    const filteredTickets = scopedTickets.filter((ticket) => {
      if (windowFilter === "all") return true;
      const created = new Date(ticket.created_at);
      if (Number.isNaN(created.getTime())) return false;
      const diffMs = now.getTime() - created.getTime();
      if (windowFilter === "week") return diffMs <= 7 * 24 * 60 * 60 * 1000;
      return diffMs <= 30 * 24 * 60 * 60 * 1000;
    });
    const gross = filteredTickets.reduce((sum, ticket) => sum + Number(ticket.tier_price || 0), 0);
    const appFee = gross * 0.05;
    const net = gross - appFee;
    const checkedIn = filteredTickets.filter((ticket) => ticket.checked_in).length;
    return { gross, appFee, net, sold: filteredTickets.length, checkedIn };
  }, [events, tickets, windowFilter]);

  const saveCode = () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    window.localStorage.setItem("campusguide_organizer_code", trimmed);
    setSubmittedCode(trimmed);
  };

  const markSaved = events.length > 0;

  return (
    <PublicShell backTo="/events" backLabel="Back to events">
      <SEO title="Organizer Dashboard" description="Monitor event sales, ticket tiers, and check-ins." />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 rounded-2xl border bg-white p-6" style={{ borderColor: "#BFC3C6" }}>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em]" style={{ color: "#2F4EA2" }}>ORGANIZER</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight" style={{ color: "#111827" }}>
                Sales transparency for your event
              </h1>
              <p className="mt-2 max-w-2xl text-sm" style={{ color: "#6B7280" }}>
                Enter the organizer code from the admin event setup to view ticket sales, tier breakdowns, and check-in status.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Organizer code"
                className="w-56 rounded-lg border px-4 py-2 text-sm outline-none"
                style={{ borderColor: "#BFC3C6" }}
              />
              <button
                onClick={saveCode}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: "#2F4EA2" }}
              >
                Open dashboard
              </button>
            </div>
          </div>
          {error ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-red-600">
              <Alert02Icon size={16} /> {error}
            </p>
          ) : null}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: "#6B7280" }}>
            <Loading01Icon className="animate-spin" size={18} /> Loading organizer data...
          </div>
        ) : submittedCode && events.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center" style={{ borderColor: "#BFC3C6" }}>
            <Ticket01Icon size={36} color="#2F4EA2" className="mx-auto" />
            <p className="mt-3 font-semibold" style={{ color: "#111827" }}>No event linked to this code</p>
            <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
              Make sure the event in the admin site has this organizer code saved.
            </p>
          </div>
        ) : events.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard label="Tickets sold" value={String(stats.sold)} />
              <StatCard label="Gross revenue" value={currency(stats.gross)} />
              <StatCard label="Platform fee" value={currency(stats.appFee)} />
              <StatCard label="Net payout" value={currency(stats.net)} />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { key: "all", label: "All time" },
                { key: "month", label: "This month" },
                { key: "week", label: "This week" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setWindowFilter(item.key as typeof windowFilter)}
                  className="rounded-full border px-4 py-2 text-sm font-semibold"
                  style={{
                    borderColor: windowFilter === item.key ? "#2F4EA2" : "#BFC3C6",
                    backgroundColor: windowFilter === item.key ? "#EEF2FC" : "#FFFFFF",
                    color: "#111827",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-8 grid gap-6">
              {events.map((event) => {
                const eventTickets = tickets.filter((ticket) => ticket.event_id === event.id);
                const tiers = eventTickets.reduce<Record<string, number>>((acc, ticket) => {
                  acc[ticket.tier_name] = (acc[ticket.tier_name] || 0) + 1;
                  return acc;
                }, {});

                return (
                  <section key={event.id} className="rounded-2xl border bg-white p-6" style={{ borderColor: "#BFC3C6" }}>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-xs font-semibold tracking-[0.18em]" style={{ color: "#2F4EA2" }}>
                          {event.organizer_name || "ORGANIZER EVENT"}
                        </p>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight" style={{ color: "#111827" }}>
                          {event.title}
                        </h2>
                        <p className="mt-2 text-sm" style={{ color: "#6B7280" }}>
                          {event.is_paid ? "Paid event" : "Free event"} · Base price {currency(Number(event.ticket_price || 0))}
                        </p>
                      </div>
                      <div className="rounded-xl border px-4 py-3" style={{ borderColor: "#D1D9F0", backgroundColor: "#EEF2FC" }}>
                        <p className="text-xs font-semibold" style={{ color: "#111827" }}>Check-in status</p>
                        <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
                          {eventTickets.length ? `${stats.checkedIn} checked in / ${eventTickets.length} sold` : "No tickets sold yet"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 md:grid-cols-3">
                      {Object.entries(tiers).map(([tierName, count]) => (
                        <div key={tierName} className="rounded-xl border p-4" style={{ borderColor: "#BFC3C6" }}>
                          <p className="text-sm font-semibold" style={{ color: "#111827" }}>{tierName}</p>
                          <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>{count} ticket{count > 1 ? "s" : ""}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b" style={{ borderColor: "#E5E7EB" }}>
                            <th className="py-3 pr-4 font-semibold">Receipt</th>
                            <th className="py-3 pr-4 font-semibold">Buyer</th>
                            <th className="py-3 pr-4 font-semibold">Tier</th>
                            <th className="py-3 pr-4 font-semibold">Amount</th>
                            <th className="py-3 pr-4 font-semibold">Ticket</th>
                            <th className="py-3 pr-4 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {eventTickets.map((ticket) => (
                            <tr key={ticket.id} className="border-b" style={{ borderColor: "#F3F4F6" }}>
                              <td className="py-3 pr-4">{ticket.receipt_number || ticket.payment_reference || "-"}</td>
                              <td className="py-3 pr-4">
                                <div className="font-medium" style={{ color: "#111827" }}>{ticket.purchaser_name || "Unknown"}</div>
                                <div style={{ color: "#6B7280" }}>{ticket.purchaser_email || ticket.whatsapp_number}</div>
                              </td>
                              <td className="py-3 pr-4">{ticket.tier_name}</td>
                              <td className="py-3 pr-4">{currency(Number(ticket.tier_price || 0))}</td>
                              <td className="py-3 pr-4 font-mono text-xs">{ticket.ticket_code}</td>
                              <td className="py-3 pr-4">
                                {ticket.checked_in ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                                    <CheckmarkCircle02Icon size={14} /> Checked in
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                    <Ticket01Icon size={14} /> Not used yet
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        ) : null}

        {markSaved ? (
          <p className="mt-6 text-sm" style={{ color: "#6B7280" }}>
            Organizer code is saved in this browser for quick access.
          </p>
        ) : null}
      </div>
    </PublicShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "#BFC3C6" }}>
      <p className="text-sm" style={{ color: "#6B7280" }}>{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight" style={{ color: "#111827" }}>{value}</p>
    </div>
  );
}
