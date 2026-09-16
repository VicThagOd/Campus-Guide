import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RiVipCrownLine, RiSparklingFill, RiCameraLensLine, RiInstagramLine, RiTwitterXLine, RiTiktokLine, RiShieldCheckLine, RiArrowLeftLine, RiTimeLine } from "react-icons/ri";
import { HiOutlineSparkles, HiOutlineIdentification, HiOutlineAcademicCap } from "react-icons/hi2";
import { TbCameraPlus, TbCheck, TbLoader2, TbTrash } from "react-icons/tb";
import { PiGenderIntersexBold, PiMapPinDuotone, PiPhoneCallDuotone, PiUserBold } from "react-icons/pi";
import { SEO } from "./SEO";
import { PublicShell } from "./PublicShell";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { initializeFlutterwavePayment } from "../lib/flutterwavePayment";

import { compressImage } from "../lib/imageCompressor";
import { invalidateCache } from "../lib/queryCache";

const PRIMARY = "#2F4EA2";
const ACCENT = "#F5B942";

const FACULTIES_AND_DEPTS = [
  "Agriculture",
  "Allied Health Sciences",
  "Basic Medical Sciences",
  "Clinical Sciences",
  "Communication and Media Studies",
  "Computing",
  "Dentistry",
  "Education",
  "Engineering",
  "Humanities",
  "Law",
  "Management Sciences",
  "Pharmaceutical Sciences",
  "School of Science Laboratory Technology",
  "Science",
  "Social Sciences",
];

const LEVELS = ["100L", "200L", "300L", "400L", "500L", "600L"];

function RegistrationTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mb-8 flex flex-col items-center justify-center text-center shadow-sm">
      <h3 className="text-red-700 font-bold text-sm mb-4 uppercase tracking-widest flex items-center gap-2">
        <RiTimeLine className="w-5 h-5" /> Registration Closes In
      </h3>
      <div className="flex gap-4 sm:gap-6">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white border border-red-200 rounded-xl flex items-center justify-center text-red-700 font-bold text-2xl sm:text-3xl shadow-sm">
            {timeLeft.days.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-red-600 font-semibold uppercase mt-2">Days</div>
        </div>
        <div className="text-red-300 font-bold text-3xl pt-2">:</div>
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white border border-red-200 rounded-xl flex items-center justify-center text-red-700 font-bold text-2xl sm:text-3xl shadow-sm">
            {timeLeft.hours.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-red-600 font-semibold uppercase mt-2">Hours</div>
        </div>
        <div className="text-red-300 font-bold text-3xl pt-2">:</div>
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white border border-red-200 rounded-xl flex items-center justify-center text-red-700 font-bold text-2xl sm:text-3xl shadow-sm">
            {timeLeft.minutes.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-red-600 font-semibold uppercase mt-2">Mins</div>
        </div>
        <div className="text-red-300 font-bold text-3xl pt-2">:</div>
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white border border-red-200 rounded-xl flex items-center justify-center text-red-700 font-bold text-2xl sm:text-3xl shadow-sm">
            {timeLeft.seconds.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-red-600 font-semibold uppercase mt-2">Secs</div>
        </div>
      </div>
    </div>
  );
}

export function PageantRegister() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successContestant, setSuccessContestant] = useState<{
    number: number;
    code: string;
    name: string;
    gender: "male" | "female";
  } | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState(profile?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [matricNumber, setMatricNumber] = useState("");
  const [gender, setGender] = useState<"male" | "female">("female");
  const [department, setDepartment] = useState(profile?.course || "");
  const [level, setLevel] = useState("100L");
  const [stateOfOrigin, setStateOfOrigin] = useState("");
  const [bio, setBio] = useState("");
  const [whyFaceOfCg, setWhyFaceOfCg] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [twitter, setTwitter] = useState("");

  // Photos
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(null);
  const [seatedPhotoFile, setSeatedPhotoFile] = useState<File | null>(null);
  const [seatedPhotoPreview, setSeatedPhotoPreview] = useState<string | null>(null);
  const [standingPhotoFile, setStandingPhotoFile] = useState<File | null>(null);
  const [standingPhotoPreview, setStandingPhotoPreview] = useState<string | null>(null);

  // Settings & Schedule
  const [targetDeadline, setTargetDeadline] = useState<Date>(new Date("2026-09-24T23:59:59+01:00"));
  const [isRegistrationOpen, setIsRegistrationOpen] = useState<boolean>(true);

  useEffect(() => {
    async function loadPageantSettings() {
      try {
        const { data } = await supabase.from("pageant_settings").select("*").limit(1);
        if (data && data[0]) {
          const s = data[0];
          setIsRegistrationOpen(s.registration_open !== false);
          if (s.registration_end_date) {
            setTargetDeadline(new Date(s.registration_end_date));
          }
        }
      } catch (err) {
        console.error("Failed to load pageant settings:", err);
      }
    }
    loadPageantSettings();
  }, []);

  const isClosed = !isRegistrationOpen || new Date() > targetDeadline;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "cover" | "seated" | "standing") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("Please select an image smaller than 15MB");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (type === "cover") {
      setCoverPhotoFile(file);
      setCoverPhotoPreview(previewUrl);
    } else if (type === "seated") {
      setSeatedPhotoFile(file);
      setSeatedPhotoPreview(previewUrl);
    } else if (type === "standing") {
      setStandingPhotoFile(file);
      setStandingPhotoPreview(previewUrl);
    }
  };

  const uploadPhotoToSupabase = async (file: File, prefix: string): Promise<string> => {
    const compressed = await compressImage(file);
    const fileExt = compressed.name.split(".").pop() || "jpg";
    const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `contestants/${fileName}`;

    const { error: uploadErr } = await supabase.storage
      .from("pageant_photos")
      .upload(filePath, compressed, {
        cacheControl: "31536000",
        upsert: true,
        contentType: "image/jpeg",
      });

    if (uploadErr) {
      throw new Error(`Failed to upload photo (${prefix}): ` + uploadErr.message);
    }

    const { data: publicData } = supabase.storage.from("pageant_photos").getPublicUrl(filePath);
    return publicData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !phoneNumber.trim()) {
      setError("Please fill in your name, email, and phone number.");
      return;
    }

    if (!coverPhotoFile || !seatedPhotoFile || !standingPhotoFile) {
      setError("All 3 photos (Cover Picture, Seated Picture, Standing Picture) are required.");
      return;
    }

    setLoading(true);

    try {
      // 1. Upload photos to storage (compressed automatically)
      const [coverUrl, seatedUrl, standingUrl] = await Promise.all([
        uploadPhotoToSupabase(coverPhotoFile, "cover"),
        uploadPhotoToSupabase(seatedPhotoFile, "seated"),
        uploadPhotoToSupabase(standingPhotoFile, "standing"),
      ]);

      const category = gender === "male" ? "mr_campus_guide" : "miss_campus_guide";

      // 2. Count existing contestants in this gender category to ensure sequential code
      const { count } = await supabase
        .from("pageant_contestants")
        .select("id", { count: "exact", head: true })
        .eq("gender", gender);

      const nextNum = (count || 0) + 1;
      const contestantCode = gender === "female"
        ? `contestants_f_${String(nextNum).padStart(2, "0")}`
        : `contestants_m_${String(nextNum).padStart(2, "0")}`;

      // 3. Insert contestant record
      const { data: contestant, error: insertErr } = await supabase
        .from("pageant_contestants")
        .insert({
          user_id: user?.id || null,
          name: fullName.trim(),
          email: email.trim(),
          phone_number: phoneNumber.trim(),
          matric_number: matricNumber.trim() || null,
          gender,
          category,
          category_number: nextNum,
          contestant_code: contestantCode,
          department: department.trim() || "General",
          level,
          state_of_origin: stateOfOrigin.trim() || null,
          bio: bio.trim() || null,
          why_face_of_cg: whyFaceOfCg.trim() || null,
          social_handles: {
            instagram: instagram.trim() || undefined,
            tiktok: tiktok.trim() || undefined,
            twitter: twitter.trim() || undefined,
          },
          cover_photo_url: coverUrl,
          seated_photo_url: seatedUrl,
          standing_photo_url: standingUrl,
          payment_status: "completed",
        })
        .select("id, contestant_number, category_number, contestant_code, name, gender")
        .single();

      if (insertErr || !contestant) {
        throw new Error(insertErr?.message || "Failed to register contestant profile.");
      }

      // Invalidate public cached query so new contestant shows immediately
      invalidateCache("pageant_contestants");

      // 4. Trigger Flutterwave Payment (Flat ₦1,000)
      const totalAmount = 1000;

      try {
        const checkoutUrl = await initializeFlutterwavePayment({
          amount: totalAmount,
          paymentType: "pageant",
          userId: user?.id || contestant.id,
          email: email.trim(),
          name: fullName.trim(),
          course: department.trim() || "Student",
          contestantId: contestant.id,
        });

        // Redirect to payment gateway
        window.location.assign(checkoutUrl);
      } catch (payErr: any) {
        console.warn("Payment initialization notice:", payErr);
        setSuccessContestant({
          number: contestant.category_number || nextNum,
          code: contestant.contestant_code || contestantCode,
          name: contestant.name,
          gender: contestant.gender,
        });
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (successContestant) {
    const isFemale = successContestant.gender === "female";
    const badgeLabel = isFemale
      ? `Contestant F-${String(successContestant.number).padStart(2, "0")}`
      : `Contestant M-${String(successContestant.number).padStart(2, "0")}`;

    return (
      <PublicShell>
        <SEO
          title="Registration Successful | Campus Guide Pageantry"
          description="Your registration for Face of Campus Guide has been submitted successfully."
        />
        <div className="max-w-xl mx-auto py-16 px-4 text-center">
          <div className="w-16 h-16 bg-[#EEF2FC] rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#2F4EA2]">
            <RiVipCrownLine className="w-8 h-8" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-800">
              {badgeLabel}
            </span>
            <span className="bg-gray-100 text-gray-700 text-xs font-mono px-2.5 py-1 rounded-md">
              Code: {successContestant.code}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            You are Officially Registered
          </h1>
          <p className="text-gray-600 mb-6 text-sm sm:text-base leading-relaxed">
            Congratulations <strong>{successContestant.name}</strong>. Your profile has been assigned <strong>{badgeLabel}</strong> ({successContestant.code}) for {isFemale ? "Miss Campus Guide" : "Mr Campus Guide"}.
          </p>

          <div className="border border-gray-200 rounded-2xl p-6 mb-8 text-left bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-2">
              What Happens Next?
            </h3>
            <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
              <li>Your profile will be showcased in the official voting portal.</li>
              <li>Tell voters to search for your code <strong>{badgeLabel}</strong> or your name to vote.</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/pageant/vote"
              className="px-6 py-2.5 bg-[#2F4EA2] text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors text-sm"
            >
              View Voting Portal
            </Link>
            <Link
              to={user ? "/dashboard" : "/"}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              {user ? "Back to Dashboard" : "Back to Home"}
            </Link>
          </div>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <SEO
        title="Register for Mr & Miss Campus Guide | Pageantry"
        description="Register to become the official Face of Campus Guide. Upload your photos, fill your bio, and join the race for Mr and Miss Campus Guide."
      />

      <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
        {/* Header Section */}
        <div className="border border-gray-200 bg-white rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
          <Link
            to="/pageant/vote"
            className="inline-flex items-center gap-1 text-xs text-[#2F4EA2] hover:underline mb-3"
          >
            <RiArrowLeftLine className="w-4 h-4" /> Go to Voting Portal
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Mr & Miss Campus Guide Registration
          </h1>
          <p className="text-gray-600 text-sm max-w-xl leading-relaxed">
            Register to become a contestant for Mr or Miss Campus Guide.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-gray-700">
            <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg font-medium">
              <RiShieldCheckLine className="w-4 h-4 text-[#2F4EA2]" /> Registration Fee: <strong>₦1,000</strong>
            </span>
          </div>
        </div>

        {/* Live Timer */}
        <RegistrationTimer targetDate={targetDeadline} />

        {isClosed && (
          <div className="mb-8 p-6 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-center shadow-sm">
            <h3 className="text-base font-bold mb-1">Registration Portal Closed</h3>
            <p className="text-xs text-amber-700 leading-relaxed">
              Pageant registration for Face of Campus Guide is currently closed. If you have already registered, check the voting portal for updates.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
          {/* Section 1: Category & Gender */}
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">
              Select Category
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setGender("female")}
                className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                  gender === "female"
                    ? "border-[#2F4EA2] bg-[#EEF2FC] text-[#2F4EA2] font-bold"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="font-semibold text-sm sm:text-base">Miss Campus Guide</div>
                <div className="text-xs text-gray-500 font-normal">Female Category</div>
              </button>

              <button
                type="button"
                onClick={() => setGender("male")}
                className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                  gender === "male"
                    ? "border-[#2F4EA2] bg-[#EEF2FC] text-[#2F4EA2] font-bold"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="font-semibold text-sm sm:text-base">Mr Campus Guide</div>
                <div className="text-xs text-gray-500 font-normal">Male Category</div>
              </button>
            </div>
          </div>

          {/* Section 2: Three Required Photos */}
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-1">
              3 Contestant Photos (Required)
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Upload clear photos for the voters and judging showcase.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Photo 1: Cover Picture */}
              <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 flex flex-col items-center text-center">
                <span className="text-xs font-semibold text-gray-800 bg-white border border-gray-200 px-2.5 py-0.5 rounded-full mb-2">
                  1. Cover Photo
                </span>
                <p className="text-[11px] text-gray-500 mb-2">Main showcase portrait</p>
                {coverPhotoPreview ? (
                  <div className="relative w-full h-44 rounded-lg overflow-hidden group shadow-inner mb-2">
                    <img src={coverPhotoPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setCoverPhotoFile(null);
                        setCoverPhotoPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow hover:bg-red-700 transition-colors"
                    >
                      <TbTrash className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-44 border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-white transition-all p-4">
                    <TbCameraPlus className="w-8 h-8 text-gray-400 mb-1" />
                    <span className="text-xs text-[#2F4EA2] font-medium">Upload Cover</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoSelect(e, "cover")}
                    />
                  </label>
                )}
              </div>

              {/* Photo 2: Seated Picture */}
              <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 flex flex-col items-center text-center">
                <span className="text-xs font-semibold text-gray-800 bg-white border border-gray-200 px-2.5 py-0.5 rounded-full mb-2">
                  2. Seated Picture
                </span>
                <p className="text-[11px] text-gray-500 mb-2">Seated posture pose</p>
                {seatedPhotoPreview ? (
                  <div className="relative w-full h-44 rounded-lg overflow-hidden group shadow-inner mb-2">
                    <img src={seatedPhotoPreview} alt="Seated Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setSeatedPhotoFile(null);
                        setSeatedPhotoPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow hover:bg-red-700 transition-colors"
                    >
                      <TbTrash className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-44 border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-white transition-all p-4">
                    <TbCameraPlus className="w-8 h-8 text-gray-400 mb-1" />
                    <span className="text-xs text-[#2F4EA2] font-medium">Upload Seated</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoSelect(e, "seated")}
                    />
                  </label>
                )}
              </div>

              {/* Photo 3: Standing Picture */}
              <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 flex flex-col items-center text-center">
                <span className="text-xs font-semibold text-gray-800 bg-white border border-gray-200 px-2.5 py-0.5 rounded-full mb-2">
                  3. Standing Picture
                </span>
                <p className="text-[11px] text-gray-500 mb-2">Full-length standing pose</p>
                {standingPhotoPreview ? (
                  <div className="relative w-full h-44 rounded-lg overflow-hidden group shadow-inner mb-2">
                    <img src={standingPhotoPreview} alt="Standing Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setStandingPhotoFile(null);
                        setStandingPhotoPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow hover:bg-red-700 transition-colors"
                    >
                      <TbTrash className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-44 border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-white transition-all p-4">
                    <TbCameraPlus className="w-8 h-8 text-gray-400 mb-1" />
                    <span className="text-xs text-[#2F4EA2] font-medium">Upload Standing</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoSelect(e, "standing")}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Personal & Academic Info */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900 pb-2 border-b border-gray-100">
              Personal & Academic Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Joy Daniels"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2F4EA2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2F4EA2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp / Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 08012345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2F4EA2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Matric Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. PU/2023/1234"
                  value={matricNumber}
                  onChange={(e) => setMatricNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2F4EA2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Faculty / Department *</label>
                <select
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2F4EA2] bg-white"
                >
                  <option value="">Select Faculty / Department</option>
                  {FACULTIES_AND_DEPTS.map((fac) => (
                    <option key={fac} value={fac}>
                      {fac}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Academic Level *</label>
                <select
                  required
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2F4EA2] bg-white"
                >
                  {LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">State of Origin (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Rivers, Delta, Lagos..."
                  value={stateOfOrigin}
                  onChange={(e) => setStateOfOrigin(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2F4EA2]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Pageant Bio & Essay */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900 pb-2 border-b border-gray-100">
              About You & Pageant Statement
            </h2>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Short Bio / About Me (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Tell voters a bit about your passions, hobbies, and personality..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2F4EA2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Why do you feel you should be the Face of Campus Guide? *
              </label>
              <textarea
                rows={3}
                required
                placeholder="What values do you bring to represent our campus community?"
                value={whyFaceOfCg}
                onChange={(e) => setWhyFaceOfCg(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2F4EA2]"
              />
            </div>

            {/* Social Media Handles - Optional */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <RiInstagramLine className="w-3.5 h-3.5 text-pink-600" /> Instagram <span className="font-normal text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="@yourusername"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#2F4EA2]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <RiTiktokLine className="w-3.5 h-3.5 text-black" /> TikTok <span className="font-normal text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="@yourusername"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#2F4EA2]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <RiTwitterXLine className="w-3.5 h-3.5 text-gray-800" /> X / Twitter <span className="font-normal text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="@yourusername"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#2F4EA2]"
                />
              </div>
            </div>
          </div>

          {/* Registration Fee Summary & Submit */}
          <div className="border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Registration Fee</div>
              <div className="text-2xl font-bold text-gray-900">
                ₦1,000
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">Pay via Bank Transfer or Card</div>
            </div>

            <button
              type="submit"
              disabled={loading || isClosed}
              className="w-full sm:w-auto px-8 py-3 bg-[#2F4EA2] text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <TbLoader2 className="w-4 h-4 animate-spin" /> Uploading & Processing...
                </>
              ) : isClosed ? (
                <>Registration Closed</>
              ) : (
                <>
                  Submit & Pay ₦1,000
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </PublicShell>
  );
}
