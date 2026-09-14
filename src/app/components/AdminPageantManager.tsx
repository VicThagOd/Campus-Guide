import { useEffect, useState } from "react";
import {
  RiVipCrownLine,
  RiTrophyLine,
  RiUserHeartLine,
  RiDeleteBin6Line,
  RiEyeLine,
  RiEyeOffLine,
  RiSearch2Line,
  RiCloseLine,
  RiMoneyDollarCircleLine,
  RiShieldCheckLine,
} from "react-icons/ri";
import { HiOutlineAcademicCap, HiOutlineSparkles } from "react-icons/hi2";
import { TbLoader2, TbRefresh, TbTrash, TbCheck, TbPhoto } from "react-icons/tb";
import { PiGenderFemaleBold, PiGenderMaleBold, PiMedalDuotone } from "react-icons/pi";
import { supabase } from "../../lib/supabase";
import { invalidateCache } from "../lib/queryCache";
import { formatContestantBadge } from "./PageantVoting";

interface ContestantAdminRow {
  id: string;
  contestant_number: number;
  category_number?: number;
  contestant_code?: string;
  name: string;
  email: string;
  phone_number: string;
  matric_number: string | null;
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
  payment_status: string;
  is_approved: boolean;
  votes_count: number;
  created_at: string;
}

export function AdminPageantManager() {
  const [contestants, setContestants] = useState<ContestantAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"female" | "male" | "leaderboard">("female");
  const [search, setSearch] = useState("");
  const [selectedContestant, setSelectedContestant] = useState<ContestantAdminRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalPhotoTab, setModalPhotoTab] = useState<"cover" | "seated" | "standing">("cover");

  const fetchContestants = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pageant_contestants")
      .select("*")
      .order("votes_count", { ascending: false });

    if (!error && data) {
      setContestants(data as ContestantAdminRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContestants();
  }, []);

  const handleDeleteContestant = async (contestant: ContestantAdminRow) => {
    const badge = formatContestantBadge(contestant as any);
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${badge} (${contestant.name})? This will delete their profile and all associated votes permanently.`
    );
    if (!confirmDelete) return;

    setDeletingId(contestant.id);
    try {
      const { error } = await supabase
        .from("pageant_contestants")
        .delete()
        .eq("id", contestant.id);

      if (error) {
        throw error;
      }

      invalidateCache("pageant_contestants");
      setContestants((prev) => prev.filter((c) => c.id !== contestant.id));
      if (selectedContestant?.id === contestant.id) {
        setSelectedContestant(null);
      }
      alert(`Contestant ${badge} (${contestant.name}) has been deleted.`);
    } catch (err: any) {
      alert("Failed to delete contestant: " + (err?.message || "Unknown error"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleApproval = async (contestant: ContestantAdminRow) => {
    const newStatus = !contestant.is_approved;
    try {
      const { error } = await supabase
        .from("pageant_contestants")
        .update({ is_approved: newStatus })
        .eq("id", contestant.id);

      if (error) throw error;

      invalidateCache("pageant_contestants");
      setContestants((prev) =>
        prev.map((c) => (c.id === contestant.id ? { ...c, is_approved: newStatus } : c))
      );
    } catch (err: any) {
      alert("Failed to update status: " + err?.message);
    }
  };

  // Stats calculation
  const totalContestants = contestants.length;
  const femaleContestants = contestants.filter((c) => c.gender === "female" || c.category === "miss_campus_guide" || c.category === "mrs_campus_guide");
  const maleContestants = contestants.filter((c) => c.gender === "male" || c.category === "mr_campus_guide");
  const totalVotesCast = contestants.reduce((acc, c) => acc + (c.votes_count || 0), 0);
  const totalRevenue = totalContestants * 1000;

  // Filtered List
  const listToRender = (
    activeTab === "female"
      ? femaleContestants
      : activeTab === "male"
      ? maleContestants
      : contestants
  ).filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.contestant_code || "").toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q) ||
      c.phone_number.includes(q)
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 font-sora">
            Mr & Miss Campus Guide Management
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Monitor live votes, inspect contestant portfolios, manage approval, and delete entries.
          </p>
        </div>

        <button
          onClick={fetchContestants}
          disabled={loading}
          className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl text-xs border border-gray-200 transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <TbRefresh className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh Live Data
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Female Contestants</div>
          <div className="text-2xl font-bold text-gray-900 font-sora mt-1">
            {femaleContestants.length}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">Miss Campus Guide</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Male Contestants</div>
          <div className="text-2xl font-bold text-gray-900 font-sora mt-1">
            {maleContestants.length}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">Mr Campus Guide</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Total Votes Cast</div>
          <div className="text-2xl font-bold text-gray-900 font-sora mt-1">
            {totalVotesCast.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">Across all students</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Registration Revenue</div>
          <div className="text-2xl font-bold text-gray-900 font-sora mt-1">
            ₦{totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">@ ₦1,000 / entry</div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-1">
        <div className="bg-gray-50 p-1 rounded-xl flex gap-1 border border-gray-200">
          <button
            onClick={() => setActiveTab("female")}
            className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === "female"
                ? "bg-[#2F4EA2] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>Miss Campus Guide ({femaleContestants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("male")}
            className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === "male"
                ? "bg-[#2F4EA2] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>Mr Campus Guide ({maleContestants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 ${
              activeTab === "leaderboard"
                ? "bg-[#2F4EA2] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>Leaderboard</span>
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <RiSearch2Line className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search contestant by name, code, dept, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 bg-white"
          />
        </div>
      </div>

      {/* Table List */}
      {loading ? (
        <div className="py-16 text-center text-gray-500">
          <TbLoader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#2F4EA2]" />
          <p className="text-xs">Loading contestants data...</p>
        </div>
      ) : listToRender.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-2xl p-10 text-center text-gray-500 text-xs">
          No contestants found matching your filter.
        </div>
      ) : (
        <div className="border border-gray-200 rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Contestant</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Faculty & Level</th>
                <th className="py-3 px-4">Phone & Email</th>
                <th className="py-3 px-4 text-center">Votes</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listToRender.map((c) => {
                const badge = formatContestantBadge(c as any);
                const isFemale = c.gender === "female";

                return (
                  <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Photo & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={c.cover_photo_url}
                          alt={c.name}
                          className="w-10 h-10 rounded-xl object-cover border border-gray-200 shadow-sm"
                        />
                        <div>
                          <div className="font-bold text-gray-900 font-sora">{c.name}</div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isFemale ? "bg-pink-100 text-pink-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {badge}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Code */}
                    <td className="py-3 px-4 font-mono font-bold text-gray-700">
                      {c.contestant_code || "—"}
                    </td>

                    {/* Academic */}
                    <td className="py-3 px-4 text-gray-600">
                      <div className="font-medium text-gray-800">{c.department}</div>
                      <div className="text-[11px] text-gray-500">{c.level} • {c.state_of_origin || "N/A"}</div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4 text-gray-600">
                      <div className="font-mono text-gray-800">{c.phone_number}</div>
                      <div className="text-[11px] text-gray-500">{c.email}</div>
                    </td>

                    {/* Votes Count */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-black text-sm text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                        <RiTrophyLine className="w-3.5 h-3.5 text-amber-500" />
                        {c.votes_count || 0}
                      </span>
                    </td>

                    {/* Approval Status */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleApproval(c)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors ${
                          c.is_approved
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                      >
                        {c.is_approved ? "Live / Active" : "Hidden"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedContestant(c);
                            setModalPhotoTab("cover");
                          }}
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                          title="View Full Profile & Photos"
                        >
                          <TbPhoto className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteContestant(c)}
                          disabled={deletingId === c.id}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete Contestant"
                        >
                          {deletingId === c.id ? (
                            <TbLoader2 className="w-4 h-4 animate-spin text-red-600" />
                          ) : (
                            <RiDeleteBin6Line className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin Contestant Profile & 3 Photos Modal */}
      {selectedContestant && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-fadeIn">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-900 text-xs font-bold px-3 py-1 rounded-full">
                  {formatContestantBadge(selectedContestant as any)}
                </span>
                <span className="font-mono text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded">
                  {selectedContestant.contestant_code}
                </span>
                <h3 className="font-bold text-gray-900 font-sora text-base sm:text-lg">
                  {selectedContestant.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedContestant(null)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-200"
              >
                <RiCloseLine className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Photo Switcher */}
              <div>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <button
                    onClick={() => setModalPhotoTab("cover")}
                    className={`px-4 py-1 rounded-xl text-xs font-bold ${
                      modalPhotoTab === "cover" ? "bg-[#2F4EA2] text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    Cover Picture
                  </button>
                  <button
                    onClick={() => setModalPhotoTab("seated")}
                    className={`px-4 py-1 rounded-xl text-xs font-bold ${
                      modalPhotoTab === "seated" ? "bg-[#2F4EA2] text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    Seated Picture
                  </button>
                  <button
                    onClick={() => setModalPhotoTab("standing")}
                    className={`px-4 py-1 rounded-xl text-xs font-bold ${
                      modalPhotoTab === "standing" ? "bg-[#2F4EA2] text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    Standing Picture
                  </button>
                </div>

                <div className="w-full h-80 rounded-2xl overflow-hidden bg-gray-900 flex items-center justify-center">
                  <img
                    src={
                      modalPhotoTab === "cover"
                        ? selectedContestant.cover_photo_url
                        : modalPhotoTab === "seated"
                        ? selectedContestant.seated_photo_url
                        : selectedContestant.standing_photo_url
                    }
                    alt={selectedContestant.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Bio & Details */}
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-4 rounded-2xl">
                  <div><strong>Phone:</strong> {selectedContestant.phone_number}</div>
                  <div><strong>Email:</strong> {selectedContestant.email}</div>
                  <div><strong>Department:</strong> {selectedContestant.department}</div>
                  <div><strong>Level:</strong> {selectedContestant.level}</div>
                  <div><strong>Matric:</strong> {selectedContestant.matric_number || "None"}</div>
                  <div><strong>Origin:</strong> {selectedContestant.state_of_origin || "None"}</div>
                  <div><strong>Votes:</strong> {selectedContestant.votes_count || 0} votes</div>
                  <div><strong>Payment:</strong> <span className="text-emerald-600 font-bold uppercase">{selectedContestant.payment_status}</span></div>
                </div>

                {selectedContestant.bio && (
                  <div className="p-3 bg-blue-50/60 rounded-xl">
                    <div className="font-bold text-blue-900 mb-1">Bio</div>
                    <p className="text-gray-700">{selectedContestant.bio}</p>
                  </div>
                )}

                {selectedContestant.why_face_of_cg && (
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                    <div className="font-bold text-amber-950 mb-1">Why Face of Campus Guide:</div>
                    <p className="text-gray-800">{selectedContestant.why_face_of_cg}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <button
                onClick={() => handleDeleteContestant(selectedContestant)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <RiDeleteBin6Line className="w-4 h-4" /> Delete Contestant
              </button>

              <button
                onClick={() => setSelectedContestant(null)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
