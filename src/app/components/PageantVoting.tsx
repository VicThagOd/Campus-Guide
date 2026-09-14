import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  RiVipCrownLine,
  RiSparklingFill,
  RiSearch2Line,
  RiHeart3Fill,
  RiHeart3Line,
  RiShieldCheckLine,
  RiInstagramLine,
  RiTwitterXLine,
  RiTiktokLine,
  RiCloseLine,
  RiUserHeartLine,
  RiTrophyLine,
  RiArrowRightLine,
  RiArrowLeftLine,
} from "react-icons/ri";
import { HiOutlineSparkles, HiOutlineAcademicCap } from "react-icons/hi2";
import { TbCheck, TbLoader2, TbPhoto, TbShare, TbUserCheck } from "react-icons/tb";
import { PiGenderFemaleBold, PiGenderMaleBold, PiMedalDuotone, PiMapPinDuotone } from "react-icons/pi";
import { SEO } from "./SEO";
import { PublicShell } from "./PublicShell";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

import { fetchWithCache, invalidateCache } from "../lib/queryCache";

interface Contestant {
  id: string;
  contestant_number: number;
  category_number?: number;
  contestant_code?: string;
  name: string;
  gender: "male" | "female";
  category: "mr_campus_guide" | "miss_campus_guide" | "mrs_campus_guide";
  department: string;
  level: string;
  state_of_origin: string | null;
  bio: string | null;
  why_face_of_cg: string | null;
  social_handles: {
    instagram?: string;
    tiktok?: string;
    twitter?: string;
  };
  cover_photo_url: string;
  seated_photo_url: string;
  standing_photo_url: string;
  votes_count: number;
  created_at: string;
}

export function formatContestantBadge(c: Contestant): string {
  const num = c.category_number || c.contestant_number || 1;
  const prefix = c.gender === "female" ? "F" : "M";
  return `Contestant ${prefix}-${String(num).padStart(2, "0")}`;
}

export function ContestantPhotoCarousel({
  photos,
  contestantName,
}: {
  photos: { url: string; label: string }[];
  contestantName: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const validPhotos = photos.filter((p) => Boolean(p.url));

  // Auto-advance smoothly from left to right every 3.5s
  useEffect(() => {
    if (validPhotos.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validPhotos.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [validPhotos.length, isPaused]);

  if (validPhotos.length === 0) return null;

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden bg-gray-950 group shadow-inner select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Carousel Track */}
      <div className="w-full h-72 sm:h-96 relative overflow-hidden">
        <div
          className="flex h-full transition-transform duration-500 ease-out will-change-transform"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {validPhotos.map((photo, idx) => (
            <div key={idx} className="w-full h-full shrink-0 flex items-center justify-center bg-gray-950">
              <img
                src={photo.url}
                alt={`${contestantName} - ${photo.label}`}
                className="w-full h-full object-contain"
                loading={idx === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Current Photo Label Badge */}
      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 rounded-full shadow border border-white/10 flex items-center gap-1.5">
        <TbPhoto className="w-3.5 h-3.5 text-blue-400" />
        <span>{validPhotos[currentIndex]?.label || "Photo"}</span>
        <span className="text-gray-400 text-[10px]">({currentIndex + 1}/{validPhotos.length})</span>
      </div>

      {/* Navigation Arrows (Prev / Next) */}
      {validPhotos.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev === 0 ? validPhotos.length - 1 : prev - 1));
            }}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white p-2 rounded-full backdrop-blur-sm transition-all shadow-md active:scale-95"
          >
            <RiArrowLeftLine className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev + 1) % validPhotos.length);
            }}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white p-2 rounded-full backdrop-blur-sm transition-all shadow-md active:scale-95"
          >
            <RiArrowRightLine className="w-4 h-4" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            {validPhotos.map((photo, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all rounded-full ${
                  currentIndex === idx ? "w-6 h-2 bg-blue-500" : "w-2 h-2 bg-white/60 hover:bg-white"
                }`}
                title={photo.label}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function PageantVoting() {
  const { user, profile } = useAuth();

  // Female category (Miss Campus Guide) comes FIRST by default
  const [activeCategory, setActiveCategory] = useState<"miss_campus_guide" | "mr_campus_guide">("miss_campus_guide");
  const [searchQuery, setSearchQuery] = useState("");
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [loading, setLoading] = useState(true);

  // User's voted contestant IDs map (category -> contestantId)
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});

  // Selected contestant modal
  const [selectedContestant, setSelectedContestant] = useState<Contestant | null>(null);
  const [modalPhotoTab, setModalPhotoTab] = useState<"cover" | "seated" | "standing">("cover");

  // Voting state
  const [votingContestantId, setVotingContestantId] = useState<string | null>(null);
  const [voteSuccessMessage, setVoteSuccessMessage] = useState<string | null>(null);

  // Fetch contestants with client-side SWR caching
  const fetchContestants = async (forceRefresh = false) => {
    if (forceRefresh) {
      invalidateCache("pageant_contestants");
    }
    setLoading(true);
    try {
      const data = await fetchWithCache(
        "pageant_contestants_approved",
        async () => {
          const { data, error } = await supabase
            .from("pageant_contestants")
            .select("id, contestant_number, category_number, contestant_code, name, gender, category, department, level, state_of_origin, bio, why_face_of_cg, social_handles, cover_photo_url, seated_photo_url, standing_photo_url, votes_count, created_at")
            .eq("is_approved", true)
            .order("category_number", { ascending: true });

          if (error) throw error;
          return (data as Contestant[]) || [];
        },
        60 // 60s cache TTL
      );

      setContestants(data);
    } catch (err) {
      console.error("Failed to load contestants:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch current user's votes
  const fetchUserVotes = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("pageant_votes")
      .select("category, contestant_id")
      .eq("user_id", user.id);

    if (data) {
      const votesMap: Record<string, string> = {};
      data.forEach((v) => {
        const cat = v.category === "mrs_campus_guide" ? "miss_campus_guide" : v.category;
        votesMap[cat] = v.contestant_id;
      });
      setUserVotes(votesMap);
    }
  };

  useEffect(() => {
    fetchContestants();
  }, []);

  useEffect(() => {
    fetchUserVotes();
  }, [user]);

  // Handle Cast Vote
  const handleVote = async (contestant: Contestant) => {
    if (!user) {
      alert("Please log in to your student account to vote.");
      return;
    }

    const effectiveCategory = contestant.gender === "female" ? "miss_campus_guide" : "mr_campus_guide";

    if (userVotes[effectiveCategory]) {
      alert(
        `You have already voted for ${
          effectiveCategory === "mr_campus_guide" ? "Mr Campus Guide" : "Miss Campus Guide"
        }. Only 1 vote per category is allowed per student.`
      );
      return;
    }

    const confirmVote = window.confirm(
      `Confirm your vote for ${formatContestantBadge(contestant)} (${contestant.name})? This choice cannot be changed once submitted.`
    );
    if (!confirmVote) return;

    setVotingContestantId(contestant.id);
    setVoteSuccessMessage(null);

    try {
      const { data, error } = await supabase.rpc("cast_pageant_vote", {
        p_contestant_id: contestant.id,
        p_category: effectiveCategory,
        p_voter_name: profile?.name || user.email || "Student",
        p_voter_phone: profile?.username || null,
      });

      if (error) throw error;

      if (data && !data.success) {
        throw new Error(data.error || "Could not record vote.");
      }

      // Update state locally
      setUserVotes((prev) => ({ ...prev, [effectiveCategory]: contestant.id }));
      setContestants((prev) =>
        prev.map((c) =>
          c.id === contestant.id ? { ...c, votes_count: (c.votes_count || 0) + 1 } : c
        )
      );

      // Invalidate public query cache
      invalidateCache("pageant_contestants_approved");

      setVoteSuccessMessage(
        `Your vote for ${formatContestantBadge(contestant)} (${contestant.name}) has been verified and recorded.`
      );
    } catch (err: any) {
      alert(err?.message || "Failed to cast vote. Please try again.");
    } finally {
      setVotingContestantId(null);
    }
  };

  // In-memory filtered list
  const filteredContestants = contestants.filter((c) => {
    const isFemale = c.gender === "female" || c.category === "miss_campus_guide" || c.category === "mrs_campus_guide";
    const targetFemale = activeCategory === "miss_campus_guide";
    if (targetFemale !== isFemale) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();

    const matchesName = c.name.toLowerCase().includes(query);
    const matchesCode = (c.contestant_code || "").toLowerCase().includes(query);
    const numStr = String(c.category_number || c.contestant_number || "");
    const matchesNum = numStr === query || `#${numStr}`.includes(query);
    const matchesDept = c.department.toLowerCase().includes(query);

    return matchesName || matchesCode || matchesNum || matchesDept;
  });

  return (
    <PublicShell>
      <SEO
        title="Vote: Mr & Miss Campus Guide | Official Pageantry"
        description="Cast your official vote for Mr & Miss Campus Guide. Browse contestant photos, bios, and support your favorite student ambassador."
      />

      <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6">
        {/* Banner */}
        <div className="border border-gray-200 bg-white rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Mr & Miss Campus Guide Voting
              </h1>
              <p className="text-gray-600 text-sm max-w-xl leading-relaxed">
                Browse contestant profiles and cast your vote.
              </p>
            </div>

            <Link
              to="/pageant/register"
              className="px-5 py-2.5 bg-[#2F4EA2] hover:bg-blue-800 text-white font-semibold rounded-lg transition-colors text-sm whitespace-nowrap"
            >
              Register as Contestant
            </Link>
          </div>

          {/* Rules */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <RiShieldCheckLine className="w-4 h-4 text-[#2F4EA2]" />
              <span>
                <strong>1 Student = 1 Vote per category</strong>
              </span>
            </div>
            {!user && (
              <Link to="/login" className="text-[#2F4EA2] font-semibold hover:underline">
                Log in to vote →
              </Link>
            )}
          </div>
        </div>

        {voteSuccessMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-sm font-medium">
            {voteSuccessMessage}
          </div>
        )}

        {/* Category Switcher & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
          {/* Category Tabs */}
          <div className="bg-gray-100 p-1 rounded-xl flex gap-1 border border-gray-200">
            <button
              onClick={() => setActiveCategory("miss_campus_guide")}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
                activeCategory === "miss_campus_guide"
                  ? "bg-white text-[#2F4EA2] shadow-sm border border-gray-200 font-bold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <PiGenderFemaleBold className="w-4 h-4 text-pink-600" />
              <span>Miss Campus Guide</span>
              {userVotes["miss_campus_guide"] && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Voted" />
              )}
            </button>

            <button
              onClick={() => setActiveCategory("mr_campus_guide")}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
                activeCategory === "mr_campus_guide"
                  ? "bg-white text-[#2F4EA2] shadow-sm border border-gray-200 font-bold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <PiGenderMaleBold className="w-4 h-4 text-blue-600" />
              <span>Mr Campus Guide</span>
              {userVotes["mr_campus_guide"] && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Voted" />
              )}
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <RiSearch2Line className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, contestant # (e.g. #01), or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#2F4EA2]"
            />
          </div>
        </div>

        {/* Contestants Grid */}
        {loading ? (
          <div className="py-20 text-center text-gray-500">
            <TbLoader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#2F4EA2]" />
            <p className="text-sm">Loading contestants...</p>
          </div>
        ) : filteredContestants.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-3xl p-12 text-center">
            <RiVipCrownLine className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800 mb-1 font-sora">No Contestants Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
              {searchQuery
                ? `No contestants matching "${searchQuery}" in this category.`
                : "No contestants have registered for this category yet. Be the first to register!"}
            </p>
            <Link
              to="/pageant/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2F4EA2] text-white text-xs font-bold rounded-xl hover:bg-blue-800 transition-colors shadow"
            >
              <RiVipCrownLine className="w-4 h-4" /> Register Now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContestants.map((contestant) => {
              const isVotedForThis = userVotes[contestant.category] === contestant.id;
              const hasVotedInCategory = Boolean(userVotes[contestant.category]);

              return (
                <div
                  key={contestant.id}
                  className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
                >
                  {/* Cover Photo Container */}
                  <div
                    onClick={() => {
                      setSelectedContestant(contestant);
                      setModalPhotoTab("cover");
                    }}
                    className="relative h-72 sm:h-80 w-full overflow-hidden bg-gray-100 cursor-pointer"
                  >
                    <img
                      src={contestant.cover_photo_url}
                      alt={contestant.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Contestant Number Badge */}
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-amber-300 border border-amber-400/40 text-xs font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                      <RiVipCrownLine className="w-3.5 h-3.5 text-amber-400" />
                      <span>{formatContestantBadge(contestant)}</span>
                    </div>

                    {/* Voted Indicator */}
                    {isVotedForThis && (
                      <div className="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                        <TbCheck className="w-4 h-4" /> Your Vote
                      </div>
                    )}

                    {/* View Photos Pill overlay */}
                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-gray-800 text-[11px] font-bold px-2.5 py-1 rounded-full shadow flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <TbPhoto className="w-3.5 h-3.5 text-blue-600" /> 3 Photos
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3
                          onClick={() => setSelectedContestant(contestant)}
                          className="font-bold text-gray-900 text-base sm:text-lg font-sora hover:text-blue-600 cursor-pointer transition-colors"
                        >
                          {contestant.name}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-3">
                        <span className="bg-blue-50 text-blue-800 font-medium px-2 py-0.5 rounded-md">
                          {contestant.department}
                        </span>
                        <span className="bg-gray-100 text-gray-700 font-medium px-2 py-0.5 rounded-md">
                          {contestant.level}
                        </span>
                        {contestant.state_of_origin && (
                          <span className="text-gray-400">• {contestant.state_of_origin}</span>
                        )}
                      </div>

                      {contestant.bio && (
                        <p className="text-xs text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                          "{contestant.bio}"
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedContestant(contestant);
                          setModalPhotoTab("cover");
                        }}
                        className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1"
                      >
                        <TbPhoto className="w-4 h-4" /> Portfolio
                      </button>

                      <button
                        onClick={() => handleVote(contestant)}
                        disabled={hasVotedInCategory || votingContestantId === contestant.id}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                          isVotedForThis
                            ? "bg-emerald-600 text-white cursor-default"
                            : hasVotedInCategory
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                            : "bg-[#2F4EA2] hover:bg-blue-800 text-white shadow-blue-500/20"
                        }`}
                      >
                        {votingContestantId === contestant.id ? (
                          <>
                            <TbLoader2 className="w-4 h-4 animate-spin" /> Recording...
                          </>
                        ) : isVotedForThis ? (
                          <>
                            <TbCheck className="w-4 h-4" /> Voted
                          </>
                        ) : hasVotedInCategory ? (
                          <>Already Voted</>
                        ) : (
                          <>
                            <RiHeart3Fill className="w-4 h-4 text-pink-300" /> Vote for {formatContestantBadge(contestant).replace("Contestant ", "")}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Contestant Details / Photo Portfolio Modal */}
        {selectedContestant && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-fadeIn">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    selectedContestant.gender === "female" ? "bg-pink-100 text-pink-900" : "bg-blue-100 text-blue-900"
                  }`}>
                    {formatContestantBadge(selectedContestant)}
                  </span>
                  {selectedContestant.contestant_code && (
                    <span className="text-[11px] font-mono text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                      {selectedContestant.contestant_code}
                    </span>
                  )}
                  <h3 className="font-bold text-gray-900 font-sora text-base sm:text-lg">
                    {selectedContestant.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedContestant(null)}
                  className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <RiCloseLine className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
                {/* 3-Photo Left-to-Right Carousel */}
                <div>
                  <ContestantPhotoCarousel
                    contestantName={selectedContestant.name}
                    photos={[
                      { url: selectedContestant.cover_photo_url, label: "Cover Picture" },
                      { url: selectedContestant.seated_photo_url, label: "Seated Picture" },
                      { url: selectedContestant.standing_photo_url, label: "Standing Picture" },
                    ]}
                  />
                </div>

                {/* Academic & Bio Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="text-[11px] text-gray-500 font-semibold uppercase">Department</div>
                      <div className="text-xs sm:text-sm font-bold text-gray-900">{selectedContestant.department}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="text-[11px] text-gray-500 font-semibold uppercase">Level</div>
                      <div className="text-xs sm:text-sm font-bold text-gray-900">{selectedContestant.level}</div>
                    </div>
                    {selectedContestant.state_of_origin && (
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 col-span-2 sm:col-span-1">
                        <div className="text-[11px] text-gray-500 font-semibold uppercase">State of Origin</div>
                        <div className="text-xs sm:text-sm font-bold text-gray-900">{selectedContestant.state_of_origin}</div>
                      </div>
                    )}
                  </div>

                  {selectedContestant.bio && (
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                      <div className="text-xs font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                        <RiSparklingFill className="w-3.5 h-3.5 text-amber-500" /> About Me
                      </div>
                      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                        {selectedContestant.bio}
                      </p>
                    </div>
                  )}

                  {selectedContestant.why_face_of_cg && (
                    <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
                      <div className="text-xs font-bold text-amber-950 mb-1 flex items-center gap-1.5">
                        <RiVipCrownLine className="w-4 h-4 text-amber-600" /> Why I Should Be the Face of Campus Guide
                      </div>
                      <p className="text-xs sm:text-sm text-gray-800 leading-relaxed font-medium">
                        "{selectedContestant.why_face_of_cg}"
                      </p>
                    </div>
                  )}

                  {/* Social Handles */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {selectedContestant.social_handles?.instagram && (
                      <span className="inline-flex items-center gap-1 text-xs bg-pink-50 text-pink-700 px-3 py-1 rounded-full font-medium">
                        <RiInstagramLine className="w-3.5 h-3.5 text-pink-600" /> {selectedContestant.social_handles.instagram}
                      </span>
                    )}
                    {selectedContestant.social_handles?.tiktok && (
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-800 px-3 py-1 rounded-full font-medium">
                        <RiTiktokLine className="w-3.5 h-3.5 text-black" /> {selectedContestant.social_handles.tiktok}
                      </span>
                    )}
                    {selectedContestant.social_handles?.twitter && (
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-800 px-3 py-1 rounded-full font-medium">
                        <RiTwitterXLine className="w-3.5 h-3.5" /> {selectedContestant.social_handles.twitter}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedContestant(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>

                <button
                  onClick={() => handleVote(selectedContestant)}
                  disabled={Boolean(userVotes[selectedContestant.category]) || votingContestantId === selectedContestant.id}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow ${
                    userVotes[selectedContestant.category] === selectedContestant.id
                      ? "bg-emerald-600 text-white"
                      : userVotes[selectedContestant.category]
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-[#2F4EA2] hover:bg-blue-800 text-white"
                  }`}
                >
                  {votingContestantId === selectedContestant.id ? (
                    <>
                      <TbLoader2 className="w-4 h-4 animate-spin" /> Recording Vote...
                    </>
                  ) : userVotes[selectedContestant.category] === selectedContestant.id ? (
                    <>
                      <TbCheck className="w-4 h-4" /> Voted for this candidate
                    </>
                  ) : userVotes[selectedContestant.category] ? (
                    <>Already Voted in Category</>
                  ) : (
                    <>
                      <RiHeart3Fill className="w-4 h-4 text-pink-300" /> Cast Your Vote for #{selectedContestant.contestant_number}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
