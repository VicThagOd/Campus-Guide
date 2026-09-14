import { useEffect, useMemo, useState } from "react";
import { Alert02Icon, CheckmarkCircle02Icon, Loading01Icon, Ticket01Icon } from "hugeicons-react";
import { RiVipCrownLine } from "react-icons/ri";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { PublicShell } from "./PublicShell";
import { SEO } from "./SEO";
import { AdminPageantManager } from "./AdminPageantManager";

type EventRow = {
  id: string;
  title: string;
  organizer_name: string | null;
  organizer_code: string | null;
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
  checked_in: boolean;
  checked_in_at?: string | null;
  receipt_number: string | null;
  purchaser_name: string | null;
  purchaser_email: string | null;
  created_at: string;
};

function currency(amount: number) {
  return `₦${amount.toLocaleString()}`;
}

export function OrganizerDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSection = (searchParams.get("tab") as "pageant" | "events") || "pageant";
  const [mainSection, setMainSection] = useState<"pageant" | "events">(initialSection);
  const [code, setCode] = useState("");
  const [submittedCode, setSubmittedCode] = useState("");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [windowFilter, setWindowFilter] = useState<"all" | "month" | "week">("all");

  // Live ticket scanner/verifier state
  const [verifyQuery, setVerifyQuery] = useState("");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyMsg, setVerifyMsg] = useState<{ type: "success" | "warning" | "error"; text: string } | null>(null);

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
      supabase.from("events").select("id, title, organizer_name, organizer_code, is_paid, banner_image_url").eq("organizer_code", submittedCode),
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
          .select("id, event_id, tier_name, tier_price, ticket_code, payment_reference, checked_in, checked_in_at, receipt_number, purchaser_name, purchaser_email, created_at")
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

  const handleToggleCheckIn = async (ticket: TicketRow) => {
    setVerifyingId(ticket.id);
    const newStatus = !ticket.checked_in;
    const nowIso = newStatus ? new Date().toISOString() : null;

    try {
      const { error: updErr } = await supabase
        .from("event_tickets")
        .update({
          checked_in: newStatus,
          checked_in_at: nowIso,
          checked_in_by: submittedCode,
        })
        .eq("id", ticket.id);

      if (updErr) throw updErr;

      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, checked_in: newStatus, checked_in_at: nowIso } : t))
      );

      setVerifyMsg({
        type: newStatus ? "success" : "warning",
        text: newStatus
          ? `Checked in ${ticket.purchaser_name || "attendee"} (${ticket.ticket_code}) successfully!`
          : `Check-in reverted for ${ticket.purchaser_name || "attendee"}.`,
      });
    } catch (err: any) {
      alert(err?.message || "Failed to update check-in status.");
    } finally {
      setVerifyingId(null);
    }
  };

  // Live search result for verification tool
  const scannedTicket = useMemo(() => {
    const q = verifyQuery.trim().toUpperCase();
    if (!q) return null;
    return tickets.find(
      (t) =>
        t.ticket_code.toUpperCase() === q ||
        (t.receipt_number && t.receipt_number.toUpperCase() === q) ||
        (t.payment_reference && t.payment_reference.toUpperCase() === q)
    );
  }, [verifyQuery, tickets]);

  const markSaved = events.length > 0;

  return (
    <PublicShell backTo="/events" backLabel="Back to events">
      <SEO title="Organizer & Admin Dashboard" description="Monitor pageantry votes, contestants, event sales, ticket tiers, and check-ins." />
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        {/* Main Tab Navigation */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 max-w-md">
          <button
            onClick={() => {
              setMainSection("pageant");
              setSearchParams({ tab: "pageant" });
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              mainSection === "pageant"
                ? "bg-white text-[#2F4EA2] shadow-sm border border-gray-200"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <RiVipCrownLine className="w-4 h-4 text-amber-500" />
            <span>Face of Campus Guide (F.O.C.G)</span>
          </button>

          <button
            onClick={() => {
              setMainSection("events");
              setSearchParams({ tab: "events" });
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              mainSection === "events"
                ? "bg-white text-[#2F4EA2] shadow-sm border border-gray-200"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Ticket01Icon size={16} />
            <span>Event Ticket Sales</span>
          </button>
        </div>

        {mainSection === "pageant" ? (
          <AdminPageantManager />
        ) : (
          <>
            <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "#BFC3C6" }}>
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#111827" }}>
                    Sales transparency & ticket verification
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm" style={{ color: "#6B7280" }}>
                    Enter your organizer code to monitor ticket revenue, verify attendee passes at the gate, and check in students live.
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
                {/* Stats Summary */}
                <div className="grid gap-4 md:grid-cols-4">
                  <StatCard label="Tickets sold" value={String(stats.sold)} />
                  <StatCard label="Check-ins" value={`${stats.checkedIn} / ${stats.sold}`} />
                  <StatCard label="Gross revenue" value={currency(stats.gross)} />
                  <StatCard label="Net payout (95%)" value={currency(stats.net)} />
                </div>

                {/* Gate Ticket Verification Scanner */}
                <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <CheckmarkCircle02Icon size={20} className="text-[#2F4EA2]" />
                        Live Gate Pass Verification
                      </h3>
                      <p className="text-xs text-gray-600">
                        Type or paste a ticket code (e.g. <code>CG-TKT-XXXXXX</code>) or Receipt # to check in attendees instantly.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 max-w-xl">
                    <input
                      type="text"
                      value={verifyQuery}
                      onChange={(e) => {
                        setVerifyQuery(e.target.value);
                        setVerifyMsg(null);
                      }}
                      placeholder="Enter Ticket Code or Receipt # (e.g. CG-TKT-...)"
                      className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-mono uppercase outline-none focus:border-[#2F4EA2] focus:ring-2 focus:ring-blue-100"
                    />
                    {verifyQuery && (
                      <button
                        onClick={() => {
                          setVerifyQuery("");
                          setVerifyMsg(null);
                        }}
                        className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Verification Feedback Banner */}
                  {verifyMsg && (
                    <div
                      className={`mt-4 rounded-xl p-3.5 text-xs font-semibold flex items-center gap-2 ${
                        verifyMsg.type === "success"
                          ? "bg-green-100 text-green-900 border border-green-300"
                          : verifyMsg.type === "warning"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-red-100 text-red-900 border border-red-300"
                      }`}
                    >
                      <CheckmarkCircle02Icon size={16} />
                      {verifyMsg.text}
                    </div>
                  )}

                  {/* Scanned Result Card */}
                  {verifyQuery.trim() && (
                    <div className="mt-4">
                      {scannedTicket ? (
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-base text-gray-900">
                                  {scannedTicket.ticket_code}
                                </span>
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
                                  {scannedTicket.tier_name}
                                </span>
                                {scannedTicket.checked_in ? (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                                    Already Checked In
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                                    Valid Ticket
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-gray-700 font-medium">
                                Attendee: {scannedTicket.purchaser_name || "Unknown"} · {scannedTicket.purchaser_email || "No email"}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                Receipt: {scannedTicket.receipt_number || "-"} · Paid: {currency(scannedTicket.tier_price)}
                              </p>
                            </div>

                            <button
                              onClick={() => handleToggleCheckIn(scannedTicket)}
                              disabled={verifyingId === scannedTicket.id}
                              className={`rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all ${
                                scannedTicket.checked_in
                                  ? "bg-amber-600 hover:bg-amber-700"
                                  : "bg-emerald-600 hover:bg-emerald-700"
                              }`}
                            >
                              {verifyingId === scannedTicket.id ? (
                                "Updating..."
                              ) : scannedTicket.checked_in ? (
                                "Undo Check-In"
                              ) : (
                                "✓ Check In Attendee"
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800">
                          ✕ No ticket found matching "{verifyQuery}". Ensure the code was typed correctly.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
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

                <div className="grid gap-6">
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
                              {event.is_paid ? "Paid event" : "Free event"}
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
                                <th className="py-3 pr-4 font-semibold text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {eventTickets.map((ticket) => (
                                <tr key={ticket.id} className="border-b" style={{ borderColor: "#F3F4F6" }}>
                                  <td className="py-3 pr-4">{ticket.receipt_number || ticket.payment_reference || "-"}</td>
                                  <td className="py-3 pr-4">
                                    <div className="font-medium" style={{ color: "#111827" }}>{ticket.purchaser_name || "Unknown"}</div>
                                    <div style={{ color: "#6B7280" }}>{ticket.purchaser_email || "-"}</div>
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
                                        <Ticket01Icon size={14} /> Valid / Not used
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 pr-4 text-right">
                                    <button
                                      onClick={() => handleToggleCheckIn(ticket)}
                                      disabled={verifyingId === ticket.id}
                                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                                        ticket.checked_in
                                          ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                          : "bg-[#2F4EA2] text-white hover:opacity-90"
                                      }`}
                                    >
                                      {verifyingId === ticket.id ? "..." : ticket.checked_in ? "Undo" : "Check In"}
                                    </button>
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
          </>
        )}
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
