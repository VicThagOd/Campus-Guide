import { useEffect, useState } from "react";
import {
  ArrowRight01Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Location01Icon,
  Loading01Icon,
  Ticket01Icon,
  Time01Icon,
} from "hugeicons-react";
import { SEO } from "./SEO";
import { PublicShell } from "./PublicShell";
import { supabase } from "../../lib/supabase";
import { hasSupabaseEnv } from "../../lib/env";
import { useAuth } from "../../context/AuthContext";
import { initializeFlutterwavePayment } from "../lib/flutterwavePayment";

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  is_paid: boolean;
  ticket_price: number;
  created_at: string;
}

interface TicketRow {
  id: string;
  event_id: string;
  ticket_code: string;
  whatsapp_number: string;
  tier_name?: string;
  tier_price?: number;
  receipt_number?: string | null;
  checked_in?: boolean;
  purchaser_name?: string | null;
  purchaser_email?: string | null;
  created_at: string;
}

const PRIMARY = "#2F4EA2";
const INK = "#111827";
const MUTED = "#6B7280";
const BORDER = "#BFC3C6";
const SECTION_BG = "#F7F8FA";

function formatEventDate(value: string | null): string {
  if (!value) return "Date to be announced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be announced";
  const day = date.toLocaleDateString("en-US", { day: "numeric" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const year = date.toLocaleDateString("en-US", { year: "numeric" });
  return `${day} ${month}, ${year}`;
}

function formatEventTime(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function Events() {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [purchasingEvent, setPurchasingEvent] = useState<EventRow | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [selectedTier, setSelectedTier] = useState<"regular" | "vip">("regular");
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setEvents([]);
      return;
    }
    supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          setEvents([]);
          return;
        }
        setEvents((data as EventRow[]) ?? []);
      });
  }, []);

  useEffect(() => {
    if (!user?.id || !hasSupabaseEnv) return;
    supabase
      .from("event_tickets")
      .select("id, event_id, ticket_code, whatsapp_number, tier_name, tier_price, receipt_number, checked_in, purchaser_name, purchaser_email, created_at")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setTickets((data as TicketRow[]) ?? []);
      });
  }, [user?.id]);

  const hasTicket = (eventId: string) => tickets.some((t) => t.event_id === eventId);

  const handlePurchaseTicket = async () => {
    if (!purchasingEvent || !user?.id || !whatsappNumber.trim()) return;
    setPurchasing(true);

    try {
      const basePrice = purchasingEvent.ticket_price || 0;
      const flwFee = basePrice * 0.014;
      const totalAmount = basePrice + flwFee;
      const tierPrice = selectedTier === "vip" ? totalAmount * 1.5 : totalAmount;
      const tierLabel = selectedTier === "vip" ? "VIP" : "Regular";

      const checkoutUrl = await initializeFlutterwavePayment({
        amount: tierPrice,
        paymentType: "ticket",
        userId: user.id,
        email: user.email || "",
        name: profile?.name || user.email || "Student",
        course: profile?.course || "Post UTME Candidate",
        eventId: purchasingEvent.id,
        tierName: tierLabel,
        ticketPrice: tierPrice,
        whatsappNumber: whatsappNumber.trim(),
      });

      // Redirect student to Flutterwave checkout portal
      window.location.assign(checkoutUrl);
    } catch (err: any) {
      alert(err?.message || "Failed to initialize payment. Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  const closePurchaseModal = () => {
    setPurchasingEvent(null);
    setWhatsappNumber("");
    setPurchaseSuccess(false);
    setSelectedTier("regular");
  };

  return (
    <PublicShell backTo="/dashboard" backLabel="Back to dashboard">
      <SEO
        title="Campus Events"
        description="Seminars, workshops and student gatherings around UNIPORT with dates, venues and registration links."
        canonical="https://campusguide.ng/events"
      />

      <div className="border-b" style={{ borderColor: BORDER, backgroundColor: SECTION_BG }}>
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
          <p className="mb-3 text-xs font-semibold tracking-[0.18em]" style={{ color: PRIMARY }}>
            EVENTS
          </p>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-5xl" style={{ color: INK }}>
            Never miss what is happening on campus.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed" style={{ color: MUTED }}>
            Seminars, workshops and student gatherings around UNIPORT, with dates, venues and
            registration links in one place.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12">
        {events === null ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-xl border" style={{ borderColor: BORDER, backgroundColor: "#ECEEF1" }} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border bg-white px-6 py-20 text-center" style={{ borderColor: BORDER }}>
            <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "#EEF2FC" }}>
              <Calendar03Icon size={32} color={PRIMARY} />
            </span>
            <h2 className="text-xl font-bold tracking-tight" style={{ color: INK }}>
              No upcoming events
            </h2>
            <p className="mx-auto mt-2 max-w-sm leading-relaxed" style={{ color: MUTED }}>
              Events are being scheduled. Check back soon, or follow us on social media for
              announcements.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {events.map((event) => {
              const time = formatEventTime(event.event_date);
              return (
                <article
                  key={event.id}
                  className="flex flex-col overflow-hidden rounded-xl border bg-white sm:flex-row"
                  style={{ borderColor: BORDER }}
                >
                  <div
                    className="flex shrink-0 flex-col items-center justify-center gap-1 px-8 py-6 sm:w-40 sm:py-0"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white">
                      {event.event_date ? new Date(event.event_date).toLocaleDateString("en-US", { month: "short" }) : "TBA"}
                    </span>
                    <span className="text-3xl font-bold leading-none text-white">
                      {event.event_date ? new Date(event.event_date).toLocaleDateString("en-US", { day: "numeric" }) : "--"}
                    </span>
                    {event.event_date && (
                      <span className="text-[11px] text-white" style={{ opacity: 0.85 }}>
                        {new Date(event.event_date).toLocaleDateString("en-US", { year: "numeric" })}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <h2 className="text-lg font-bold tracking-tight" style={{ color: INK }}>
                      {event.title}
                    </h2>
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm" style={{ color: MUTED }}>
                      <span className="flex items-center gap-1.5">
                        <Calendar03Icon size={15} color={PRIMARY} /> {formatEventDate(event.event_date)}
                        {time && ` at ${time}`}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1.5">
                          <Location01Icon size={15} color={PRIMARY} /> {event.location}
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
                        {event.description}
                      </p>
                    )}
                    <div className="mt-1">
                      {event.is_paid && event.ticket_price > 0 ? (
                          hasTicket(event.id) ? (
                            <div className="space-y-3">
                              <span
                                className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold"
                                style={{ borderColor: "#16A34A", color: "#16A34A" }}
                              >
                                <CheckmarkCircle02Icon size={16} />
                                Ticket Purchased
                              </span>
                              {tickets
                                .filter((ticket) => ticket.event_id === event.id)
                                .slice(0, 1)
                                .map((ticket) => (
                                  <div key={ticket.id} className="rounded-xl border bg-white p-4" style={{ borderColor: "#D1D9F0" }}>
                                    <p className="text-xs font-semibold tracking-[0.18em]" style={{ color: PRIMARY }}>
                                      RECEIPT
                                    </p>
                                    <p className="mt-1 text-sm font-semibold" style={{ color: INK }}>
                                      {ticket.receipt_number || ticket.ticket_code}
                                    </p>
                                    <p className="mt-1 text-sm" style={{ color: MUTED }}>
                                      {ticket.purchaser_name || "Ticket holder"} · {ticket.tier_name || "Regular"}
                                    </p>
                                    <div className="mt-3 grid gap-2 text-xs" style={{ color: MUTED }}>
                                      <div className="flex items-center justify-between">
                                        <span>Amount</span>
                                        <span className="font-semibold" style={{ color: INK }}>
                                          {`\u20A6${Number(ticket.tier_price || 0).toLocaleString()}`}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span>Ticket code</span>
                                        <span className="font-mono font-semibold" style={{ color: INK }}>
                                          {ticket.ticket_code}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <button
                              onClick={() => setPurchasingEvent(event)}
                            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
                            style={{ backgroundColor: PRIMARY }}
                          >
                            <Ticket01Icon size={16} />
                            Buy Ticket ({`\u20A6${event.ticket_price.toLocaleString()}`})
                          </button>
                        )
                      ) : (
                        <span
                          className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold"
                          style={{ borderColor: BORDER, color: MUTED }}
                        >
                          <Time01Icon size={16} />
                          Registration details coming soon
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-16">
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border p-6 md:flex-row" style={{ borderColor: "#D1D9F0", backgroundColor: "#EEF2FC" }}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "#FFFFFF" }}>
              <Calendar03Icon size={20} color={PRIMARY} />
            </span>
            <div>
              <p className="text-sm font-semibold" style={{ color: INK }}>
                Organising an event on campus?
              </p>
              <p className="text-sm" style={{ color: MUTED }}>
                Get it listed here so students can find it. Talk to the team on WhatsApp.
              </p>
            </div>
          </div>
          <a
            href="https://wa.link/wx16gs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
            style={{ backgroundColor: "#25D366" }}
          >
            Submit an event <ArrowRight01Icon size={15} />
          </a>
        </div>
      </div>

      {/* Ticket Purchase Modal */}
      {purchasingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            {purchaseSuccess ? (
              <div className="text-center">
                <CheckmarkCircle02Icon size={52} color="#16A34A" className="mx-auto mb-4" />
                <h2 className="mb-2 text-xl font-bold" style={{ color: INK }}>
                  Ticket Purchased!
                </h2>
                <p className="mb-6 text-sm" style={{ color: MUTED }}>
                  Your ticket for <span className="font-semibold">{purchasingEvent.title}</span> has been confirmed.
                  The admin will contact you via WhatsApp.
                </p>
                <button
                  onClick={closePurchaseModal}
                  className="w-full rounded-lg py-3 font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: PRIMARY }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold" style={{ color: INK }}>
                    Purchase Ticket
                  </h2>
                  <p className="text-sm" style={{ color: MUTED }}>
                    {purchasingEvent.title} - {`\u20A6${purchasingEvent.ticket_price.toLocaleString()}`}
                  </p>
                </div>

                <div className="mb-4">
                  <label className="mb-2 block text-sm font-semibold" style={{ color: INK }}>
                    Ticket Tier
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedTier("regular")}
                      className="rounded-lg border px-4 py-3 text-left"
                      style={{
                        borderColor: selectedTier === "regular" ? PRIMARY : BORDER,
                        backgroundColor: selectedTier === "regular" ? "#EEF2FC" : "#FFFFFF",
                      }}
                    >
                      <span className="block text-sm font-semibold" style={{ color: INK }}>Regular</span>
                      <span className="block text-xs" style={{ color: MUTED }}>Standard entry</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTier("vip")}
                      className="rounded-lg border px-4 py-3 text-left"
                      style={{
                        borderColor: selectedTier === "vip" ? PRIMARY : BORDER,
                        backgroundColor: selectedTier === "vip" ? "#EEF2FC" : "#FFFFFF",
                      }}
                    >
                      <span className="block text-sm font-semibold" style={{ color: INK }}>VIP</span>
                      <span className="block text-xs" style={{ color: MUTED }}>Premium seating</span>
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="mb-2 block text-sm font-semibold" style={{ color: INK }}>
                    Your WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="e.g. 08012345678"
                    className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: BORDER, color: INK }}
                    required
                  />
                  <p className="mt-1 text-xs" style={{ color: MUTED }}>
                    We will use this to send your ticket and event updates.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={closePurchaseModal}
                    className="flex-1 rounded-lg border py-3 font-semibold transition-colors hover:bg-gray-50"
                    style={{ borderColor: BORDER, color: INK }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePurchaseTicket}
                    disabled={purchasing || !whatsappNumber.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    {purchasing ? (
                      <Loading01Icon size={18} className="animate-spin" />
                    ) : (
                      <Ticket01Icon size={18} />
                    )}
                    {purchasing ? "Processing..." : "Confirm Purchase"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </PublicShell>
  );
}
