import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight01Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Location01Icon,
  Loading01Icon,
  PrinterIcon,
  Ticket01Icon,
  Time01Icon,
  Cancel01Icon,
} from "hugeicons-react";
import { SEO } from "./SEO";
import { PublicShell } from "./PublicShell";
import { supabase } from "../../lib/supabase";
import { hasSupabaseEnv } from "../../lib/env";
import { useAuth } from "../../context/AuthContext";
import { initializeFlutterwavePayment, TicketOrderItem } from "../lib/flutterwavePayment";
import { whatsappLink, whatsappMessages } from "../../lib/whatsapp";

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  is_paid: boolean;
  banner_image_url: string | null;
  created_at: string;
}

interface TierRow {
  id: string;
  event_id: string;
  tier_name: string;
  tier_price: number;
  capacity: number | null;
  perks: string | null;
}

interface TicketRow {
  id: string;
  event_id: string;
  ticket_code: string;
  tier_name?: string;
  tier_price?: number;
  receipt_number?: string | null;
  payment_reference?: string | null;
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

function formatReceiptDate(value: string | null): string {
  if (!value) return new Date().toLocaleDateString("en-GB");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toLocaleDateString("en-GB");
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function currency(amount: number) {
  return `₦${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

interface ReceiptData {
  receiptNumber: string;
  eventName: string;
  eventDate: string | null;
  eventLocation: string | null;
  purchaserName: string;
  purchaserEmail: string;
  purchaseDate: string;
  items: Array<{
    tierName: string;
    unitPrice: number;
    quantity: number;
    amount: number;
  }>;
  ticketCodes: Array<{
    code: string;
    tierName: string;
    checkedIn: boolean;
  }>;
  subtotal: number;
  fee: number;
  total: number;
}

export function Events() {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [purchasingEvent, setPurchasingEvent] = useState<EventRow | null>(null);
  const [eventTiers, setEventTiers] = useState<TierRow[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [purchasing, setPurchasing] = useState(false);
  const [loadingTiers, setLoadingTiers] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<ReceiptData | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setEvents([]);
      return;
    }
    supabase
      .from("events")
      .select("id, title, description, event_date, location, is_paid, banner_image_url, created_at")
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
      .select("id, event_id, ticket_code, tier_name, tier_price, receipt_number, payment_reference, checked_in, purchaser_name, purchaser_email, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTickets((data as TicketRow[]) ?? []);
      });
  }, [user?.id]);

  const eventTicketsMap = useMemo(() => {
    const map: Record<string, TicketRow[]> = {};
    for (const t of tickets) {
      if (!map[t.event_id]) map[t.event_id] = [];
      map[t.event_id].push(t);
    }
    return map;
  }, [tickets]);

  const openPurchaseModal = async (event: EventRow) => {
    setPurchasingEvent(event);
    setQuantities({});
    setGuestName(profile?.name || "");
    setGuestEmail(user?.email || "");
    setGuestPhone(profile?.phone || "");
    setLoadingTiers(true);

    const { data } = await supabase
      .from("event_tiers")
      .select("id, event_id, tier_name, tier_price, capacity, perks")
      .eq("event_id", event.id)
      .order("tier_price", { ascending: true });

    const tiers = (data as TierRow[]) ?? [];
    setEventTiers(tiers);
    // Default 1 ticket on the first available tier
    if (tiers.length > 0) {
      setQuantities({ [tiers[0].id]: 1 });
    }
    setLoadingTiers(false);
  };

  const closePurchaseModal = () => {
    setPurchasingEvent(null);
    setEventTiers([]);
    setQuantities({});
  };

  const updateQuantity = (tierId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[tierId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [tierId]: next };
    });
  };

  const totalTicketsSelected = useMemo(() => {
    return Object.values(quantities).reduce((a, b) => a + b, 0);
  }, [quantities]);

  const subtotalAmount = useMemo(() => {
    return eventTiers.reduce((sum, tier) => {
      const qty = quantities[tier.id] || 0;
      return sum + Number(tier.tier_price || 0) * qty;
    }, 0);
  }, [eventTiers, quantities]);

  const processingFee = useMemo(() => {
    return subtotalAmount * 0.014;
  }, [subtotalAmount]);

  const grandTotalAmount = useMemo(() => {
    return subtotalAmount + processingFee;
  }, [subtotalAmount, processingFee]);

  const handlePurchaseTickets = async () => {
    if (!purchasingEvent || totalTicketsSelected <= 0) return;

    const buyerName = guestName.trim() || profile?.name || user?.email || "Student";
    const buyerEmail = guestEmail.trim() || user?.email;

    if (!buyerEmail) {
      alert("Please enter a valid email address to receive your tickets.");
      return;
    }

    const items: TicketOrderItem[] = eventTiers
      .filter((tier) => (quantities[tier.id] || 0) > 0)
      .map((tier) => ({
        tierId: tier.id,
        tierName: tier.tier_name,
        tierPrice: Number(tier.tier_price) || 0,
        quantity: quantities[tier.id] || 0,
      }));

    if (items.length === 0) return;

    setPurchasing(true);

    try {
      const checkoutUrl = await initializeFlutterwavePayment({
        amount: grandTotalAmount,
        paymentType: "ticket",
        userId: user?.id || "anonymous_user",
        email: buyerEmail,
        name: buyerName,
        course: profile?.course || "UNIPORT Student",
        eventId: purchasingEvent.id,
        items,
        whatsappNumber: guestPhone.trim() || "",
      });

      window.location.assign(checkoutUrl);
    } catch (err: any) {
      alert(err?.message || "Failed to initialize payment. Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  const handleViewReceiptForGroup = (eventId: string, receiptTickets: TicketRow[]) => {
    const event = events?.find((e) => e.id === eventId);
    if (!receiptTickets.length) return;

    const first = receiptTickets[0];
    const receiptNum = first.receipt_number || `RCPT-${first.id.substring(0, 8).toUpperCase()}`;

    // Aggregate tiers
    const tierMap: Record<string, { tierName: string; unitPrice: number; quantity: number }> = {};
    for (const t of receiptTickets) {
      const name = t.tier_name || "Regular";
      const price = Number(t.tier_price) || 0;
      if (!tierMap[name]) {
        tierMap[name] = { tierName: name, unitPrice: price, quantity: 0 };
      }
      tierMap[name].quantity += 1;
    }

    const items = Object.values(tierMap).map((it) => ({
      tierName: `${it.tierName} Ticket - ${event?.title || "Event Pass"}`,
      unitPrice: it.unitPrice,
      quantity: it.quantity,
      amount: it.unitPrice * it.quantity,
    }));

    const sub = items.reduce((sum, it) => sum + it.amount, 0);
    const fee = sub * 0.014;
    const tot = sub + fee;

    setActiveReceipt({
      receiptNumber: receiptNum,
      eventName: event?.title || "Campus Event",
      eventDate: event?.event_date || null,
      eventLocation: event?.location || null,
      purchaserName: first.purchaser_name || profile?.name || "Student",
      purchaserEmail: first.purchaser_email || user?.email || "",
      purchaseDate: first.created_at,
      items,
      ticketCodes: receiptTickets.map((t) => ({
        code: t.ticket_code,
        tierName: t.tier_name || "Regular",
        checkedIn: !!t.checked_in,
      })),
      subtotal: sub,
      fee,
      total: tot,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <PublicShell backTo="/dashboard" backLabel="Back to dashboard">
      <SEO
        title="Campus Events & Ticket Booking"
        description="Seminars, workshops, concerts, and student gatherings around UNIPORT with instant ticket purchase and digital receipts."
        canonical="https://campusguide.ng/events"
      />

      <div className="border-b" style={{ borderColor: BORDER, backgroundColor: SECTION_BG }}>
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-5xl" style={{ color: INK }}>
            Never miss what is happening on campus.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed" style={{ color: MUTED }}>
            Seminars, workshops, parties, and student gatherings around UNIPORT, with verified tickets and instant receipts in one place.
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
              Events are being scheduled. Check back soon, or follow us on social media for announcements.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {events.map((event) => {
              const time = formatEventTime(event.event_date);
              const eventTickets = eventTicketsMap[event.id] || [];
              const hasBought = eventTickets.length > 0;

              // Group tickets by receipt_number
              const receiptGroups: Record<string, TicketRow[]> = {};
              for (const t of eventTickets) {
                const key = t.receipt_number || t.payment_reference || t.id;
                if (!receiptGroups[key]) receiptGroups[key] = [];
                receiptGroups[key].push(t);
              }

              return (
                <article
                  key={event.id}
                  className="flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md sm:flex-row"
                  style={{ borderColor: BORDER }}
                >
                  {event.banner_image_url ? (
                    <div className="shrink-0 sm:w-56 md:w-64">
                      <img src={event.banner_image_url} alt={event.title} className="h-48 w-full object-cover sm:h-full" />
                    </div>
                  ) : (
                    <div
                      className="flex shrink-0 flex-col items-center justify-center gap-1 px-8 py-8 sm:w-48 sm:py-0"
                      style={{ backgroundColor: PRIMARY }}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-white">
                        {event.event_date ? new Date(event.event_date).toLocaleDateString("en-US", { month: "short" }) : "TBA"}
                      </span>
                      <span className="text-4xl font-bold leading-none text-white">
                        {event.event_date ? new Date(event.event_date).toLocaleDateString("en-US", { day: "numeric" }) : "--"}
                      </span>
                      {event.event_date && (
                        <span className="text-xs text-white" style={{ opacity: 0.85 }}>
                          {new Date(event.event_date).toLocaleDateString("en-US", { year: "numeric" })}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex flex-1 flex-col justify-between p-6 sm:p-7">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h2 className="text-xl font-bold tracking-tight" style={{ color: INK }}>
                          {event.title}
                        </h2>
                        {event.is_paid ? (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#2F4EA2] border border-blue-200">
                            Ticketed Event
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 border border-green-200">
                            Free Admission
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm" style={{ color: MUTED }}>
                        <span className="flex items-center gap-1.5">
                          <Calendar03Icon size={16} color={PRIMARY} /> {formatEventDate(event.event_date)}
                          {time && ` at ${time}`}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1.5">
                            <Location01Icon size={16} color={PRIMARY} /> {event.location}
                          </span>
                        )}
                      </div>

                      {event.description && (
                        <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
                          {event.description}
                        </p>
                      )}
                    </div>

                    {/* Ticket section */}
                    <div className="mt-6 border-t pt-5" style={{ borderColor: "#F3F4F6" }}>
                      {event.is_paid ? (
                        hasBought ? (
                          <div className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <span
                                className="inline-flex items-center gap-2 rounded-lg bg-green-50 border px-3 py-1.5 text-xs font-bold"
                                style={{ borderColor: "#86EFAC", color: "#166534" }}
                              >
                                <CheckmarkCircle02Icon size={16} />
                                {eventTickets.length} Ticket{eventTickets.length > 1 ? "s" : ""} Active
                              </span>

                              <button
                                onClick={() => openPurchaseModal(event)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2F4EA2] hover:underline"
                              >
                                <Ticket01Icon size={14} /> Buy More Tickets
                              </button>
                            </div>

                            {/* Receipts summary */}
                            <div className="space-y-3">
                              {Object.entries(receiptGroups).map(([receiptKey, groupTickets]) => {
                                const first = groupTickets[0];
                                const receiptDisplay = first.receipt_number || receiptKey;
                                return (
                                  <div
                                    key={receiptKey}
                                    className="rounded-xl border bg-slate-50/50 p-4 transition-all hover:bg-slate-50"
                                    style={{ borderColor: "#D1D9F0" }}
                                  >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2F4EA2]">
                                            RECEIPT
                                          </span>
                                          <span className="font-mono text-xs font-semibold" style={{ color: INK }}>
                                            {receiptDisplay}
                                          </span>
                                        </div>
                                        <p className="mt-1 text-xs" style={{ color: MUTED }}>
                                          {groupTickets.length} Ticket{groupTickets.length > 1 ? "s" : ""} · {groupTickets.map((t) => t.tier_name || "Regular").join(", ")}
                                        </p>
                                      </div>

                                      <button
                                        onClick={() => handleViewReceiptForGroup(event.id, groupTickets)}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
                                        style={{ backgroundColor: PRIMARY }}
                                      >
                                        <PrinterIcon size={14} /> View / Print Receipt
                                      </button>
                                    </div>

                                    {/* Ticket codes list */}
                                    <div className="mt-3 flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                                      {groupTickets.map((t) => (
                                        <div
                                          key={t.id}
                                          className="flex items-center gap-2 rounded-lg bg-white border px-2.5 py-1.5 text-xs shadow-xs"
                                          style={{ borderColor: "#E5E7EB" }}
                                        >
                                          <span className="font-mono font-bold text-gray-800">{t.ticket_code}</span>
                                          <span className="text-[10px] text-gray-500">({t.tier_name || "Regular"})</span>
                                          {t.checked_in ? (
                                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                                              Checked in
                                            </span>
                                          ) : (
                                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-800">
                                              Valid Pass
                                            </span>
                                          )}
                                          <button
                                            onClick={() => copyToClipboard(t.ticket_code)}
                                            title="Copy ticket code"
                                            className="text-gray-400 hover:text-gray-700 transition-colors"
                                          >
                                            <Copy01Icon size={13} />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs" style={{ color: MUTED }}>
                              Multiple ticket tiers & group bookings available
                            </span>
                            <button
                              onClick={() => openPurchaseModal(event)}
                              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:opacity-95 hover:shadow"
                              style={{ backgroundColor: PRIMARY }}
                            >
                              <Ticket01Icon size={16} />
                              Get Tickets
                            </button>
                          </div>
                        )
                      ) : (
                        <span
                          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold"
                          style={{ borderColor: BORDER, color: MUTED }}
                        >
                          <Time01Icon size={15} />
                          Free Admission · No gate ticket required
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

      {/* Host event banner */}
      <div className="mx-auto max-w-5xl px-4 pb-16">
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border p-6 md:flex-row" style={{ borderColor: "#D1D9F0", backgroundColor: "#EEF2FC" }}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "#FFFFFF" }}>
              <Calendar03Icon size={20} color={PRIMARY} />
            </span>
            <div>
              <p className="text-sm font-bold" style={{ color: INK }}>
                Organising an event on campus?
              </p>
              <p className="text-sm" style={{ color: MUTED }}>
                Get it listed here to sell tickets with multi-tier pricing and real-time gate pass verification.
              </p>
            </div>
          </div>
          <a
            href={whatsappLink(whatsappMessages.organizeEvent())}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
            style={{ backgroundColor: "#25D366" }}
          >
            Submit an event <ArrowRight01Icon size={15} />
          </a>
        </div>
      </div>

      {/* Multi-Ticket Purchase Modal */}
      {purchasingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-7 shadow-2xl my-8">
            <button
              onClick={closePurchaseModal}
              className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <Cancel01Icon size={20} />
            </button>

            <div className="mb-5">
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#2F4EA2]">
                Select Tickets
              </span>
              <h2 className="text-xl font-bold mt-0.5" style={{ color: INK }}>
                {purchasingEvent.title}
              </h2>
              <p className="text-xs mt-1" style={{ color: MUTED }}>
                Choose the quantity for each tier. You can buy multiple tickets and multiple tiers at once.
              </p>
            </div>

            {loadingTiers ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm" style={{ color: MUTED }}>
                <Loading01Icon className="animate-spin" size={20} /> Loading ticket tiers...
              </div>
            ) : eventTiers.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: MUTED }}>No ticket tiers configured for this event yet.</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
                {eventTiers.map((tier) => {
                  const qty = quantities[tier.id] || 0;
                  const soldOut = tier.capacity != null && tier.capacity <= 0;

                  return (
                    <div
                      key={tier.id}
                      className="rounded-xl border p-4 transition-all duration-150"
                      style={{
                        borderColor: qty > 0 ? PRIMARY : BORDER,
                        backgroundColor: qty > 0 ? "#F8FAFF" : "#FFFFFF",
                        opacity: soldOut ? 0.6 : 1,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold" style={{ color: INK }}>
                              {tier.tier_name}
                            </span>
                            {tier.capacity != null && (
                              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                                {tier.capacity > 0 ? `${tier.capacity} left` : "Sold out"}
                              </span>
                            )}
                          </div>
                          {tier.perks && (
                            <p className="mt-1 text-xs leading-relaxed" style={{ color: MUTED }}>
                              {tier.perks}
                            </p>
                          )}
                          <p className="mt-2 text-base font-extrabold" style={{ color: PRIMARY }}>
                            {currency(tier.tier_price)}
                          </p>
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center gap-2 rounded-lg border bg-white p-1" style={{ borderColor: "#D1D5DB" }}>
                          <button
                            type="button"
                            disabled={qty <= 0 || soldOut}
                            onClick={() => updateQuantity(tier.id, -1)}
                            className="flex h-7 w-7 items-center justify-center rounded-md font-bold text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-30"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-sm font-bold" style={{ color: INK }}>
                            {qty}
                          </span>
                          <button
                            type="button"
                            disabled={soldOut || (tier.capacity != null && qty >= tier.capacity)}
                            onClick={() => updateQuantity(tier.id, 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-md font-bold text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Guest buyer info (if not signed in) */}
            {!user?.id && (
              <div className="mt-4 space-y-2.5 rounded-xl border p-3.5 bg-gray-50 text-xs" style={{ borderColor: "#E5E7EB" }}>
                <p className="font-bold text-gray-700">Recipient Details (Where tickets will be sent)</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full rounded-lg border bg-white px-3 py-2 text-xs outline-none"
                    style={{ borderColor: BORDER }}
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full rounded-lg border bg-white px-3 py-2 text-xs outline-none"
                    style={{ borderColor: BORDER }}
                  />
                </div>
                <input
                  type="tel"
                  placeholder="WhatsApp Phone Number"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full rounded-lg border bg-white px-3 py-2 text-xs outline-none"
                  style={{ borderColor: BORDER }}
                />
              </div>
            )}

            {/* Price breakdown */}
            {totalTicketsSelected > 0 && (
              <div className="mt-4 rounded-xl border p-3.5" style={{ borderColor: "#D1D9F0", backgroundColor: "#F8FAFF" }}>
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Selected items ({totalTicketsSelected} ticket{totalTicketsSelected > 1 ? "s" : ""})</span>
                  <span className="font-semibold text-gray-900">{currency(subtotalAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span>Processing fee (1.4%)</span>
                  <span>{currency(processingFee)}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-blue-100">
                  <span style={{ color: INK }}>Total to Pay</span>
                  <span className="text-base text-[#2F4EA2]">{currency(grandTotalAmount)}</span>
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closePurchaseModal}
                className="flex-1 rounded-xl border py-3 text-sm font-semibold transition-colors hover:bg-gray-50"
                style={{ borderColor: BORDER, color: INK }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurchaseTickets}
                disabled={purchasing || totalTicketsSelected <= 0}
                className="flex-2 inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-sm transition-all hover:opacity-95 disabled:opacity-50"
                style={{ backgroundColor: PRIMARY }}
              >
                {purchasing ? (
                  <Loading01Icon size={18} className="animate-spin" />
                ) : (
                  <Ticket01Icon size={18} />
                )}
                {purchasing
                  ? "Processing..."
                  : totalTicketsSelected > 0
                  ? `Pay ${currency(grandTotalAmount)}`
                  : "Select Tickets"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Receipt Modal matching media_1789312410620.png */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl my-8 print:p-0 print:shadow-none print:max-w-none print:w-full">
            {/* Modal Controls (Hidden when printing) */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200 print:hidden">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Official Payment Receipt</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  <PrinterIcon size={14} /> Print / Save PDF
                </button>
                <button
                  onClick={() => setActiveReceipt(null)}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                >
                  <Cancel01Icon size={18} />
                </button>
              </div>
            </div>

            {/* Printable Receipt Container */}
            <div className="bg-white text-gray-900 font-sans space-y-6">
              {/* Receipt Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight text-gray-950 uppercase">
                    CAMPUS GUIDE UNIPORT
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    University of Port Harcourt, Choba, Rivers State
                  </p>
                  <p className="text-xs text-gray-500">
                    Email: info@campusguide.ng · www.campusguide.ng
                  </p>
                </div>

                <div className="sm:text-right">
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: PRIMARY }}>
                    RECEIPT
                  </h1>
                </div>
              </div>

              {/* Billed To & Receipt Details Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">BILLED TO:</p>
                  <p className="text-sm font-bold text-gray-950 mt-0.5">{activeReceipt.purchaserName}</p>
                  <p className="text-gray-600">{activeReceipt.purchaserEmail}</p>
                  <p className="text-gray-600 mt-1 font-medium">{activeReceipt.eventName}</p>
                  {activeReceipt.eventLocation && (
                    <p className="text-gray-500">{activeReceipt.eventLocation}</p>
                  )}
                </div>

                <div className="sm:text-right space-y-1">
                  <div>
                    <span className="font-bold text-gray-700">Receipt #: </span>
                    <span className="font-mono font-bold text-gray-950">{activeReceipt.receiptNumber}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700">Receipt date: </span>
                    <span className="text-gray-950">{formatReceiptDate(activeReceipt.purchaseDate)}</span>
                  </div>
                  {activeReceipt.eventDate && (
                    <div>
                      <span className="font-bold text-gray-700">Event date: </span>
                      <span className="text-gray-950">{formatEventDate(activeReceipt.eventDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items Table with Blue Header */}
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: PRIMARY }} className="text-white">
                      <th className="py-2.5 px-3 font-semibold text-center w-12">QTY</th>
                      <th className="py-2.5 px-3 font-semibold">Description</th>
                      <th className="py-2.5 px-3 font-semibold text-right w-28">Unit Price</th>
                      <th className="py-2.5 px-3 font-semibold text-right w-28">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {activeReceipt.items.map((item, idx) => (
                      <tr key={idx} className="text-gray-800">
                        <td className="py-2.5 px-3 text-center font-medium">{item.quantity}</td>
                        <td className="py-2.5 px-3 font-medium">{item.tierName}</td>
                        <td className="py-2.5 px-3 text-right text-gray-600">{currency(item.unitPrice)}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-gray-950">{currency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Subtotal & Total Block */}
              <div className="flex justify-end text-xs">
                <div className="w-64 space-y-1.5">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium">{currency(activeReceipt.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-[11px]">
                    <span>Processing & Platform Fee</span>
                    <span>{currency(activeReceipt.fee)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-extrabold pt-2 border-t border-gray-200" style={{ color: PRIMARY }}>
                    <span>Total</span>
                    <span>{currency(activeReceipt.total)}</span>
                  </div>
                </div>
              </div>

              {/* Ticket Pass Codes (For Gate Verification) */}
              <div className="rounded-xl border border-gray-200 bg-slate-50/70 p-4">
                <p className="text-[11px] font-extrabold text-gray-800 uppercase tracking-wider mb-2">
                  Official Gate Admission Pass Code(s)
                </p>
                <p className="text-[11px] text-gray-500 mb-3">
                  Present these unique codes at the entrance gate for instant organizer check-in verification.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {activeReceipt.ticketCodes.map((tc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg bg-white border border-gray-200 px-3 py-2 text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-gray-900 text-sm block">{tc.code}</span>
                        <span className="text-[10px] text-gray-500">{tc.tierName} Pass</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {tc.checkedIn ? (
                          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            Checked In
                          </span>
                        ) : (
                          <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                            Active Pass
                          </span>
                        )}
                        <button
                          onClick={() => copyToClipboard(tc.code)}
                          className="p-1 text-gray-400 hover:text-gray-700 print:hidden transition-colors"
                          title="Copy Code"
                        >
                          <Copy01Icon size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="text-center pt-2 text-[11px] text-gray-400 border-t border-gray-100">
                <p>Thank you for using Campus Guide UNIPORT. All rights reserved.</p>
              </div>
            </div>

            {copiedCode && (
              <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-gray-900 px-4 py-2 text-xs font-bold text-white shadow-lg animate-fade-in print:hidden">
                Code copied to clipboard: {copiedCode}
              </div>
            )}
          </div>
        </div>
      )}
    </PublicShell>
  );
}
