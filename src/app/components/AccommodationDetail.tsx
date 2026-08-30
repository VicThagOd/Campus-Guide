import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft01Icon,
  CallIcon,
  CheckmarkCircle02Icon,
  Loading01Icon,
  Location01Icon,
  RulerIcon,
} from "hugeicons-react";
import { SiWhatsapp } from "react-icons/si";
import { SEO } from "./SEO";
import { PublicShell } from "./PublicShell";
import { supabase } from "../../lib/supabase";
import { hasSupabaseEnv } from "../../lib/env";
import { AccommodationRow, formatPrice, roomTypeStyle } from "./Accommodation";
import { useAuth } from "../../context/AuthContext";
import { initializeFlutterwavePayment } from "../lib/flutterwavePayment";

const PRIMARY = "#2F4EA2";
const INK = "#111827";
const MUTED = "#6B7280";
const BORDER = "#BFC3C6";
const SECTION_BG = "#F7F8FA";

interface InspectionPayment {
  id: string;
  accommodation_id: string;
  whatsapp_number: string;
  amount: number;
  created_at: string;
}

export function AccommodationDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const [listing, setListing] = useState<AccommodationRow | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [inspectionPayments, setInspectionPayments] = useState<InspectionPayment[]>([]);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (!id || !hasSupabaseEnv) {
      setNotFound(true);
      return;
    }
    supabase
      .from("accommodations")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
          return;
        }
        setListing(data as AccommodationRow);
      });
  }, [id]);

  useEffect(() => {
    if (!user?.id || !id || !hasSupabaseEnv) return;
    supabase
      .from("inspection_payments")
      .select("id, accommodation_id, whatsapp_number, amount, created_at")
      .eq("user_id", user.id)
      .eq("accommodation_id", id)
      .then(({ data }) => {
        setInspectionPayments((data as InspectionPayment[]) ?? []);
      });
  }, [user?.id, id]);

  const hasPaidInspection = inspectionPayments.length > 0;

  const handlePayInspection = async () => {
    if (!user?.id || !id || !whatsappNumber.trim()) return;
    setPaying(true);

    try {
      const basePrice = 5000;
      const flwFee = basePrice * 0.014;
      const totalAmount = basePrice + flwFee;

      const checkoutUrl = await initializeFlutterwavePayment({
        amount: totalAmount,
        paymentType: "inspection",
        userId: user.id,
        email: user.email || "",
        name: profile?.name || user.email || "Student",
        course: profile?.course || "Post UTME Candidate",
        accommodationId: id,
        whatsappNumber: whatsappNumber.trim(),
      });

      // Redirect student to Flutterwave checkout portal
      window.location.assign(checkoutUrl);
    } catch (err: any) {
      alert(err?.message || "Failed to initialize payment. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  const closeInspectionModal = () => {
    setShowInspectionModal(false);
    setWhatsappNumber("");
    setPaymentSuccess(false);
  };

  return (
    <PublicShell backTo="/dashboard" backLabel="Back to dashboard">
      {notFound && !listing ? (
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: INK }}>
            Listing not found
          </h1>
          <p className="mt-3" style={{ color: MUTED }}>
            This accommodation may have been removed or the link is wrong.
          </p>
          <Link
            to="/accommodation"
            className="mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
            style={{ backgroundColor: PRIMARY }}
          >
            <ArrowLeft01Icon size={16} /> Back to listings
          </Link>
        </div>
      ) : listing ? (
        <div className="mx-auto max-w-4xl px-4 py-10">
          <SEO title={listing.title} description={listing.description ?? `${listing.title} on Campus Guide`} />

          <Link
            to="/accommodation"
            className="mb-6 inline-flex items-center gap-1.5 rounded-lg border px-4 py-1.5 text-sm font-semibold transition-colors duration-150 hover:bg-white"
            style={{ color: PRIMARY, border: `1px solid ${BORDER}` }}
          >
            <ArrowLeft01Icon size={14} />
            Back to listings
          </Link>

          <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: BORDER }}>
            {listing.image_urls && listing.image_urls.length > 0 ? (
              <div className="grid gap-1 md:grid-cols-2">
                {listing.image_urls.slice(0, 2).map((url, index) => (
                  <img
                    key={url}
                    src={url}
                    alt={`${listing.title} photo ${index + 1}`}
                    className="h-56 w-full object-cover md:h-64"
                    loading="lazy"
                  />
                ))}
              </div>
            ) : (
              <div className="relative flex h-56 items-center justify-center md:h-64" style={{ backgroundColor: roomTypeStyle(listing.room_type).band }}>
                <div className="flex flex-col items-center gap-2">
                  <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white" style={{ border: `1px solid ${BORDER}` }}>
                    {roomTypeStyle(listing.room_type).icon}
                  </span>
                  {listing.room_type && (
                    <span className="text-sm font-semibold" style={{ color: INK }}>{listing.room_type}</span>
                  )}
                </div>
              </div>
            )}
            {listing.video_url && (
              <div className="border-t p-4" style={{ borderColor: BORDER, backgroundColor: SECTION_BG }}>
                <video src={listing.video_url} controls className="max-h-72 w-full rounded-lg bg-black" preload="metadata" />
              </div>
            )}

            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <h1 className="max-w-md text-2xl font-bold tracking-tight md:text-3xl" style={{ color: INK }}>
                  {listing.title}
                </h1>
                <p className="text-3xl font-bold tracking-tight" style={{ color: PRIMARY }}>
                  {formatPrice(listing.price)}
                </p>
              </div>

              <div className="mt-5 space-y-2 text-sm" style={{ color: MUTED }}>
                {listing.location && (
                  <p className="flex items-center gap-2">
                    <Location01Icon size={16} color={PRIMARY} /> {listing.location}
                  </p>
                )}
                {listing.distance_from_school && (
                  <p className="flex items-center gap-2">
                    <RulerIcon size={16} color={PRIMARY} /> {listing.distance_from_school} from school
                  </p>
                )}
              </div>

              {listing.amenities && listing.amenities.length > 0 && (
                <div className="mt-6">
                  <h2 className="mb-3 text-sm font-semibold tracking-tight" style={{ color: INK }}>
                    Amenities
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {listing.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="rounded-full border px-3 py-1 text-xs font-medium"
                        style={{ borderColor: BORDER, color: INK, backgroundColor: SECTION_BG }}
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {listing.description && (
                <div className="mt-6">
                  <h2 className="mb-2 text-sm font-semibold tracking-tight" style={{ color: INK }}>
                    About this place
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
                    {listing.description}
                  </p>
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {hasPaidInspection ? (
                  <span
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold"
                    style={{ borderColor: "#16A34A", color: "#16A34A", border: "1px solid" }}
                  >
                    <CheckmarkCircle02Icon size={18} />
                    Inspection Fee Paid
                  </span>
                ) : (
                  <button
                    onClick={() => setShowInspectionModal(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition-opacity duration-150 hover:opacity-90"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    Pay Inspection Fee ({`\u20A65,000`})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="h-96 rounded-2xl border" style={{ borderColor: BORDER, backgroundColor: "#ECEEF1" }} />
        </div>
      )}

      {/* Inspection Payment Modal */}
      {showInspectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            {paymentSuccess ? (
              <div className="text-center">
                <CheckmarkCircle02Icon size={52} color="#16A34A" className="mx-auto mb-4" />
                <h2 className="mb-2 text-xl font-bold" style={{ color: INK }}>
                  Payment Confirmed!
                </h2>
                <p className="mb-6 text-sm" style={{ color: MUTED }}>
                  Your inspection fee of {`\u20A65,000`} has been received. The admin will contact you via WhatsApp to schedule the inspection.
                </p>
                <button
                  onClick={closeInspectionModal}
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
                    Pay Inspection Fee
                  </h2>
                  <p className="text-sm" style={{ color: MUTED }}>
                    {listing?.title} - {`\u20A65,000`}
                  </p>
                </div>

                <div className="mb-4 rounded-lg bg-gray-50 p-4 text-center">
                  <p className="mb-1 text-sm" style={{ color: MUTED }}>
                    Amount to pay
                  </p>
                  <p className="text-3xl font-bold" style={{ color: PRIMARY }}>
                    {`\u20A65,000`}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: MUTED }}>
                    One-time inspection fee
                  </p>
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
                    The admin will contact you via WhatsApp to schedule the inspection.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={closeInspectionModal}
                    className="flex-1 rounded-lg border py-3 font-semibold transition-colors hover:bg-gray-50"
                    style={{ borderColor: BORDER, color: INK }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePayInspection}
                    disabled={paying || !whatsappNumber.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    {paying ? (
                      <Loading01Icon size={18} className="animate-spin" />
                    ) : (
                      <SiWhatsapp size={18} />
                    )}
                    {paying ? "Processing..." : "Pay & Share WhatsApp"}
                  </button>
                </div>

                <p className="mt-4 text-center text-xs" style={{ color: MUTED }}>
                  Secure payment powered by Flutterwave
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </PublicShell>
  );
}