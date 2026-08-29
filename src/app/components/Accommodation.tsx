import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ApartmentIcon,
  BedDoubleIcon,
  BedIcon,
  Building01Icon,
  House01Icon,
  Location01Icon,
  RulerIcon,
  Wallet01Icon,
} from "hugeicons-react";
import { SEO } from "./SEO";
import { PublicShell } from "./PublicShell";
import { supabase } from "../../lib/supabase";
import { hasSupabaseEnv } from "../../lib/env";

export interface AccommodationRow {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  location: string | null;
  distance_from_school: string | null;
  room_type: string | null;
  amenities: string[] | null;
  contact_info: string | null;
  image_urls: string[] | null;
  video_url: string | null;
  created_at: string;
}

const PRIMARY = "#2F4EA2";
const INK = "#111827";
const MUTED = "#6B7280";
const BORDER = "#BFC3C6";
const SECTION_BG = "#F7F8FA";

export function formatPrice(price: number | null): string {
  if (price === null || Number.isNaN(price)) return "Price on request";
  return `\u20A6${Number(price).toLocaleString("en-NG")}`;
}

export function roomTypeStyle(roomType: string | null): { band: string; icon: React.ReactNode } {
  const key = (roomType ?? "").toLowerCase();
  if (key.includes("self")) return { band: "#EEF2FC", icon: <House01Icon size={28} color={PRIMARY} /> };
  if (key.includes("double")) return { band: "#E7F6EC", icon: <BedDoubleIcon size={28} color="#16A34A" /> };
  if (key.includes("single")) return { band: "#FEF1D6", icon: <BedIcon size={28} color="#B7791F" /> };
  if (key.includes("flat")) return { band: "#E8ECF4", icon: <ApartmentIcon size={28} color="#4B5563" /> };
  if (key.includes("hostel")) return { band: "#FBE7E2", icon: <Building01Icon size={28} color="#C2410C" /> };
  return { band: "#EEF2FC", icon: <House01Icon size={28} color={PRIMARY} /> };
}

export function Accommodation() {
  const [listings, setListings] = useState<AccommodationRow[] | null>(null);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setListings([]);
      return;
    }
    supabase
      .from("accommodations")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setListings([]);
          return;
        }
        setListings((data as AccommodationRow[]) ?? []);
      });
  }, []);

  return (
    <PublicShell backTo="/dashboard" backLabel="Back to dashboard">
      <SEO
        title="Student Accommodation"
        description="Student housing around UNIPORT, Choba: prices, distance from school, room types and photos."
        canonical="https://campusguide.ng/accommodation"
      />

      <div className="border-b" style={{ borderColor: BORDER, backgroundColor: SECTION_BG }}>
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
          <p className="mb-3 text-xs font-semibold tracking-[0.18em]" style={{ color: PRIMARY }}>
            ACCOMMODATION
          </p>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-5xl" style={{ color: INK }}>
            A place to stay, without the hostel hunt stress.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed" style={{ color: MUTED }}>
            Student housing around Choba with the price, location and distance from school on every
            listing, so you can compare before you visit.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12">
        {listings === null ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 rounded-xl border" style={{ borderColor: BORDER, backgroundColor: "#ECEEF1" }} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border bg-white px-6 py-20 text-center" style={{ borderColor: BORDER }}>
            <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "#EEF2FC" }}>
              <House01Icon size={32} color={PRIMARY} />
            </span>
            <h2 className="text-xl font-bold tracking-tight" style={{ color: INK }}>
              No listings available yet
            </h2>
            <p className="mx-auto mt-2 max-w-sm leading-relaxed" style={{ color: MUTED }}>
              Landlords and student agents are being onboarded. Check back soon, or tell us what you are
              looking for on WhatsApp.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => {
              const style = roomTypeStyle(listing.room_type);
              return (
                <Link
                  key={listing.id}
                  to={`/accommodation/${listing.id}`}
                  className="group overflow-hidden rounded-xl border bg-white transition-colors duration-150 hover:border-[#2F4EA2]"
                  style={{ borderColor: BORDER }}
                >
                  <div className="relative flex h-36 items-center justify-center overflow-hidden" style={{ backgroundColor: style.band }}>
                    {listing.image_urls && listing.image_urls.length > 0 ? (
                      <img
                        src={listing.image_urls[0]}
                        alt={listing.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      style.icon
                    )}
                    {listing.room_type && (
                      <span
                        className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold"
                        style={{ color: INK, border: `1px solid ${BORDER}` }}
                      >
                        {listing.room_type}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h2 className="mb-2 text-base font-bold tracking-tight" style={{ color: INK }}>
                      {listing.title}
                    </h2>
                    <p className="mb-3 text-2xl font-bold tracking-tight" style={{ color: PRIMARY }}>
                      {formatPrice(listing.price)}
                    </p>
                    <div className="space-y-1.5 text-sm" style={{ color: MUTED }}>
                      {listing.location && (
                        <p className="flex items-center gap-1.5">
                          <Location01Icon size={14} color={PRIMARY} /> {listing.location}
                        </p>
                      )}
                      {listing.distance_from_school && (
                        <p className="flex items-center gap-1.5">
                          <RulerIcon size={14} color={PRIMARY} /> {listing.distance_from_school} from school
                        </p>
                      )}
                    </div>
                    {listing.amenities && listing.amenities.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {listing.amenities.slice(0, 3).map((amenity) => (
                          <span
                            key={amenity}
                            className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
                            style={{ borderColor: BORDER, color: MUTED }}
                          >
                            {amenity}
                          </span>
                        ))}
                        {listing.amenities.length > 3 && (
                          <span className="text-[11px] font-medium" style={{ color: MUTED }}>
                            +{listing.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-16">
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border p-6 md:flex-row" style={{ borderColor: "#D1D9F0", backgroundColor: "#EEF2FC" }}>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "#FFFFFF" }}>
              <Wallet01Icon size={20} color={PRIMARY} />
            </span>
            <div>
              <p className="text-sm font-semibold" style={{ color: INK }}>
                Are you a landlord or agent?
              </p>
              <p className="text-sm" style={{ color: MUTED }}>
                List your rooms here so students can find you. Talk to the team on WhatsApp.
              </p>
            </div>
          </div>
          <a
            href="https://wa.link/wx16gs"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
            style={{ backgroundColor: "#25D366" }}
          >
            Contact Campus Guide
          </a>
        </div>
      </div>
    </PublicShell>
  );
}