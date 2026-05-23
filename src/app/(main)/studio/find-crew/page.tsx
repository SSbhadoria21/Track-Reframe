"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CameraIcon, UsersIcon } from "@/components/icons";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { createClient } from "@/lib/supabase/client";

interface Listing {
  id: string;
  project_title: string;
  project_type: string;
  roles_needed: string[];
  description: string;
  experience_level: string;
  city: string;
  country: string;
  shoot_start_date: string;
  shoot_end_date: string;
  compensation_type: string;
  compensation_details: string;
  contact_method: string;
  contact_value: string;
  is_active: boolean;
  interest_count: number;
  created_at: string;
  users: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    avg_rating_received?: number;
    total_ratings_received?: number;
  };
}

export default function FindCrewPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filter States
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [compensationFilter, setCompensationFilter] = useState("");

  // Modals state
  const [showPostModal, setShowPostModal] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  
  // Applications State
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);

  // Current User State
  const { data: session } = useSession();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const email = session?.user?.email;
      if (!email) return;

      const supabase = createClient();
      const { data: profile } = await supabase
        .from("users")
        .select("id, display_name, username, avatar_url")
        .eq("email", email)
        .single();
      
      if (profile) {
        setCurrentUser(profile);
      }
    };
    getUser();
  }, [session]);

  // Post Listing Form state
  const [postForm, setPostForm] = useState({
    projectTitle: "",
    projectType: "Short Film",
    rolesNeeded: "",
    description: "",
    experienceLevel: "Intermediate",
    city: "",
    country: "India",
    shootStartDate: "",
    shootEndDate: "",
    compensationType: "Paid",
    compensationDetails: "",
    contactMethod: "email",
    contactValue: "",
  });
  const [isPosting, setIsPosting] = useState(false);
  const [postMode, setPostMode] = useState<"create" | "edit">("create");
  const [editingListingId, setEditingListingId] = useState<string | null>(null);

  // Interest Form state
  const [interestMessage, setInterestMessage] = useState("");
  const [isSubmittingInterest, setIsSubmittingInterest] = useState(false);

  // Fetch listings
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (roleFilter) params.append("role", roleFilter);
    if (cityFilter) params.append("city", cityFilter);
    if (compensationFilter) params.append("compensation", compensationFilter);

    fetch(`/api/crew/listings?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setListings(data.listings || []);
      })
      .catch(() => toast.error("Failed to load listings"))
      .finally(() => setLoading(false));
  }, [search, roleFilter, cityFilter, compensationFilter, refreshTrigger]);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPosting(true);

    try {
      const rolesArray = postForm.rolesNeeded
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);

      let res;
      if (postMode === "edit" && editingListingId) {
        res = await fetch(`/api/crew/listings/${editingListingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...postForm,
            rolesNeeded: rolesArray,
          }),
        });
      } else {
        res = await fetch("/api/crew/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...postForm,
            rolesNeeded: rolesArray,
          }),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to ${postMode} listing`);
      }
      toast.success(`Listing ${postMode === "edit" ? "updated" : "posted"} successfully!`);
      setShowPostModal(false);
      setPostMode("create");
      setEditingListingId(null);
      setPostForm({
        projectTitle: "",
        projectType: "Short Film",
        rolesNeeded: "",
        description: "",
        experienceLevel: "Intermediate",
        city: "",
        country: "India",
        shootStartDate: "",
        shootEndDate: "",
        compensationType: "Paid",
        compensationDetails: "",
        contactMethod: "email",
        contactValue: "",
      });
      setRefreshTrigger((p) => p + 1);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsPosting(false);
    }
  };

  const handleInterestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;
    setIsSubmittingInterest(true);

    try {
      const res = await fetch("/api/crew/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: selectedListing.id,
          message: interestMessage,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to submit interest");
      }

      toast.success("Your application/interest was recorded!");
      setShowInterestModal(false);
      setInterestMessage("");
      setRefreshTrigger((p) => p + 1);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmittingInterest(false);
    }
  };

  const handleViewApplications = async (listing: Listing) => {
    setSelectedListing(listing);
    setShowApplicationsModal(true);
    setLoadingApplications(true);
    try {
      const res = await fetch(`/api/crew/listings/applications?listingId=${listing.id}`);
      if (!res.ok) throw new Error("Failed to load applications");
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleEditClick = (listing: Listing) => {
    setPostMode("edit");
    setEditingListingId(listing.id);
    setPostForm({
      projectTitle: listing.project_title,
      projectType: listing.project_type,
      rolesNeeded: listing.roles_needed.join(", "),
      description: listing.description,
      experienceLevel: listing.experience_level,
      city: listing.city,
      country: listing.country,
      shootStartDate: listing.shoot_start_date ? listing.shoot_start_date.substring(0, 10) : "",
      shootEndDate: listing.shoot_end_date ? listing.shoot_end_date.substring(0, 10) : "",
      compensationType: listing.compensation_type,
      compensationDetails: listing.compensation_details || "",
      contactMethod: listing.contact_method,
      contactValue: listing.contact_value,
    });
    setShowPostModal(true);
  };

  const handleCloseListing = async (listingId: string) => {
    if (!confirm("Are you sure you want to close this listing? Applications will no longer be accepted.")) return;
    try {
      const res = await fetch(`/api/crew/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false })
      });
      if (!res.ok) throw new Error("Failed to close listing");
      toast.success("Listing closed");
      setRefreshTrigger(p => p + 1);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Helper to draw circular reliability ring
  const renderReliabilityRing = (rating: number | undefined) => {
    const score = rating ? Math.min(100, Math.round((rating / 5.0) * 100)) : 80; // default to 80 if no rating yet
    const circumference = 2 * Math.PI * 14;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
        <svg className="absolute w-full h-full rotate-[-90deg]">
          <circle
            cx="18"
            cy="18"
            r="14"
            className="stroke-white/5"
            strokeWidth="2.5"
            fill="transparent"
          />
          <circle
            cx="18"
            cy="18"
            r="14"
            className="stroke-amber"
            strokeWidth="2.5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <span className="text-[10px] font-extrabold font-mono text-amber">
          {score}
        </span>
      </div>
    );
  };

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-[900px] mx-auto space-y-8 select-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <CameraIcon className="w-8 h-8 text-amber" />
            <h1 className="font-display text-3xl font-bold text-white tracking-tight">
              Crew Network
            </h1>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            Find vetted crew members and trust collaborators for your next indie project.
          </p>
        </div>

        <button
          onClick={() => {
            setPostMode("create");
            setEditingListingId(null);
            setPostForm({
              projectTitle: "",
              projectType: "Short Film",
              rolesNeeded: "",
              description: "",
              experienceLevel: "Intermediate",
              city: "",
              country: "India",
              shootStartDate: "",
              shootEndDate: "",
              compensationType: "Paid",
              compensationDetails: "",
              contactMethod: "email",
              contactValue: "",
            });
            setShowPostModal(true);
          }}
          className="h-11 px-5 rounded-xl bg-amber hover:bg-amber-hover text-surface text-xs font-bold shadow-lg shadow-amber/10 active:scale-95 transition-all cursor-pointer"
        >
          + Post a Listing
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface p-4 rounded-xl border border-white/5 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 bg-[#0d0d12] border border-white/5 rounded-lg pl-8 pr-3 text-xs text-white placeholder-text-muted focus:border-amber/50 outline-none"
          />
          <span className="absolute left-2.5 top-3 text-[10px]">🔍</span>
        </div>

        <div>
          <input
            type="text"
            placeholder="Filter by role (e.g. Editor)"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full h-10 bg-[#0d0d12] border border-white/5 rounded-lg px-3 text-xs text-white placeholder-text-muted focus:border-amber/50 outline-none"
          />
        </div>

        <div>
          <input
            type="text"
            placeholder="Filter by city (e.g. Mumbai)"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full h-10 bg-[#0d0d12] border border-white/5 rounded-lg px-3 text-xs text-white placeholder-text-muted focus:border-amber/50 outline-none"
          />
        </div>

        <div>
          <select
            value={compensationFilter}
            onChange={(e) => setCompensationFilter(e.target.value)}
            className="w-full h-10 bg-[#0d0d12] border border-white/5 rounded-lg px-3 text-xs text-white focus:border-amber/50 outline-none cursor-pointer"
          >
            <option value="">Any Compensation</option>
            <option value="Paid">Paid</option>
            <option value="Profit Share">Profit Share</option>
            <option value="Deferred">Deferred</option>
            <option value="Volunteer">Volunteer</option>
          </select>
        </div>
      </div>

      {/* Main content grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[210px] rounded-xl bg-surface border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 bg-surface rounded-xl border border-white/5">
          <p className="text-sm text-text-secondary font-bold">No active listings match your filters.</p>
          <p className="text-xs text-text-muted mt-1">
            Try resetting your inputs or be the first to create a post!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {listings.map((l) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-surface border ${l.is_active ? 'border-white/5 hover:border-white/10 hover:shadow-xl' : 'border-white/5 opacity-75 grayscale'} rounded-xl p-5 transition-all flex flex-col md:flex-row justify-between gap-5 relative overflow-hidden`}
            >
              {/* Closed Badge */}
              {!l.is_active && (
                <div className="absolute top-4 right-4 bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                  Closed
                </div>
              )}

              {/* Creator details Left */}
              <div className="flex-1 space-y-4">
                <div className="flex gap-3.5 items-start">
                  {/* Circular Avatar + Ring */}
                  <div className="relative shrink-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border border-white/5 bg-[#0d0d12] flex items-center justify-center text-lg font-bold font-display text-white">
                      {l.users?.avatar_url ? (
                        <img src={l.users.avatar_url} alt={l.users.display_name} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        l.users?.display_name?.charAt(0) || "?"
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-display text-base font-bold text-white leading-tight">
                      {l.project_title}
                    </h3>
                    <p className="text-xs text-text-muted mt-1">
                      Posted by <span className="font-semibold text-text-secondary">@{l.users?.username}</span> • {formatTime(l.created_at)}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">
                  {l.description}
                </p>

                {/* Roles tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {l.roles_needed?.map((role) => (
                    <span
                      key={role}
                      className="px-2.5 py-1 rounded bg-amber/10 border border-amber/20 text-amber text-[10px] font-bold"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              {/* Side Info Right */}
              <div className="md:w-60 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-5 flex flex-col justify-between items-stretch gap-4 shrink-0">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted">Reliability Score</span>
                    {renderReliabilityRing(l.users?.avg_rating_received)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Type</span>
                    <span className="font-semibold text-white">{l.project_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Location</span>
                    <span className="font-semibold text-white">📍 {l.city || "Remote"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Compensation</span>
                    <span className="font-semibold text-amber">{l.compensation_type}</span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {!l.is_active ? (
                    <div className="flex-1 w-full h-9 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-text-muted flex items-center justify-center cursor-not-allowed">
                      No longer accepting applications
                    </div>
                  ) : currentUser?.id === l.users?.id ? (
                    <div className="flex flex-col gap-2 w-full">
                      <button
                        onClick={() => handleViewApplications(l)}
                        className="w-full h-9 rounded-lg bg-amber/10 border border-amber/30 hover:bg-amber/20 text-xs font-bold text-amber flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        <UsersIcon className="w-3.5 h-3.5" />
                        View Applications ({l.interest_count || 0})
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(l)}
                          className="flex-1 h-8 rounded-lg bg-white/5 border border-white/10 hover:border-white/30 text-[11px] font-bold text-text-secondary hover:text-white flex items-center justify-center cursor-pointer transition-all active:scale-95"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleCloseListing(l.id)}
                          className="flex-1 h-8 rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-[11px] font-bold text-red-500 flex items-center justify-center cursor-pointer transition-all active:scale-95"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedListing(l);
                        setShowInterestModal(true);
                      }}
                      className="flex-1 h-9 rounded-lg bg-white/5 border border-white/10 hover:border-amber/30 text-xs font-bold text-text-secondary hover:text-white flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <span>✉</span> Send Application
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Post Listing Modal */}
      <AnimatePresence>
        {showPostModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 my-8"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-display text-lg font-bold text-white">{postMode === "edit" ? "Edit Crew Listing" : "Create a Crew Listing"}</h3>
                <button onClick={() => setShowPostModal(false)} className="text-text-muted hover:text-white font-bold text-lg">
                  ✕
                </button>
              </div>

              <form onSubmit={handlePostSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">Project Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shadow of Hope"
                      value={postForm.projectTitle}
                      onChange={(e) => setPostForm({ ...postForm, projectTitle: e.target.value })}
                      className="w-full bg-[#0d0d12] border border-white/5 rounded-lg px-3 py-2 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">Project Type</label>
                    <select
                      value={postForm.projectType}
                      onChange={(e) => setPostForm({ ...postForm, projectType: e.target.value })}
                      className="w-full bg-[#0d0d12] border border-white/5 rounded-lg px-3 py-2 text-white outline-none cursor-pointer"
                    >
                      <option value="Feature Film">Feature Film</option>
                      <option value="Short Film">Short Film</option>
                      <option value="Web Series Episode">Web Series Episode</option>
                      <option value="Music Video">Music Video</option>
                      <option value="Documentary">Documentary</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">Roles Needed (Comma Separated) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Editor, Sound Recordist, DIT"
                    value={postForm.rolesNeeded}
                    onChange={(e) => setPostForm({ ...postForm, rolesNeeded: e.target.value })}
                    className="w-full bg-[#0d0d12] border border-white/5 rounded-lg px-3 py-2 text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mumbai"
                      value={postForm.city}
                      onChange={(e) => setPostForm({ ...postForm, city: e.target.value })}
                      className="w-full bg-[#0d0d12] border border-white/5 rounded-lg px-3 py-2 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">Country</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. India"
                      value={postForm.country}
                      onChange={(e) => setPostForm({ ...postForm, country: e.target.value })}
                      className="w-full bg-[#0d0d12] border border-white/5 rounded-lg px-3 py-2 text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">Shoot Start Date</label>
                    <input
                      type="date"
                      value={postForm.shootStartDate}
                      onChange={(e) => setPostForm({ ...postForm, shootStartDate: e.target.value })}
                      className="w-full bg-[#0d0d12] border border-white/5 rounded-lg px-3 py-2 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">Shoot End Date</label>
                    <input
                      type="date"
                      value={postForm.shootEndDate}
                      onChange={(e) => setPostForm({ ...postForm, shootEndDate: e.target.value })}
                      className="w-full bg-[#0d0d12] border border-white/5 rounded-lg px-3 py-2 text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">Compensation Type</label>
                    <select
                      value={postForm.compensationType}
                      onChange={(e) => setPostForm({ ...postForm, compensationType: e.target.value })}
                      className="w-full bg-[#0d0d12] border border-white/5 rounded-lg px-3 py-2 text-white outline-none cursor-pointer"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Profit Share">Profit Share</option>
                      <option value="Deferred">Deferred</option>
                      <option value="Volunteer">Volunteer</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">Compensation Details</label>
                    <input
                      type="text"
                      placeholder="e.g. ₹2000 per day + meals"
                      value={postForm.compensationDetails}
                      onChange={(e) => setPostForm({ ...postForm, compensationDetails: e.target.value })}
                      className="w-full bg-[#0d0d12] border border-white/5 rounded-lg px-3 py-2 text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">Contact Method</label>
                    <select
                      value={postForm.contactMethod}
                      onChange={(e) => setPostForm({ ...postForm, contactMethod: e.target.value })}
                      className="w-full bg-[#0d0d12] border border-white/5 rounded-lg px-3 py-2 text-white outline-none cursor-pointer"
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="dm">Platform DM</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">Contact Detail</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. producer@shadow.com"
                      value={postForm.contactValue}
                      onChange={(e) => setPostForm({ ...postForm, contactValue: e.target.value })}
                      className="w-full bg-[#0d0d12] border border-white/5 rounded-lg px-3 py-2 text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">Project Description *</label>
                  <textarea
                    required
                    placeholder="Provide details about the shoot structure, visual reference, and what roles will be doing..."
                    value={postForm.description}
                    onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                    className="w-full h-24 bg-[#0d0d12] border border-white/5 rounded-lg p-3 text-white focus:border-amber/50 outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPosting}
                  className="w-full h-11 rounded-lg bg-amber hover:bg-amber-hover text-surface text-xs font-bold active:scale-95 transition-all flex items-center justify-center"
                >
                  {isPosting ? "Posting..." : "Create Listing"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Express Interest Modal */}
      <AnimatePresence>
        {showInterestModal && selectedListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-display text-lg font-bold text-white">Express Interest</h3>
                <button
                  onClick={() => setShowInterestModal(false)}
                  className="text-text-muted hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="bg-[#0d0d12] p-4 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-text-muted font-mono uppercase block">Project</span>
                <h4 className="text-sm font-bold text-white">{selectedListing.project_title}</h4>
                <p className="text-xs text-amber font-semibold">{selectedListing.roles_needed.join(", ")}</p>
              </div>

              <form onSubmit={handleInterestSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">
                    Introduce yourself & mention your relevant works *
                  </label>
                  <textarea
                    required
                    placeholder="e.g. Hi! I'm a colorist with 3 years of experience. Here is my portfolio..."
                    value={interestMessage}
                    onChange={(e) => setInterestMessage(e.target.value)}
                    className="w-full h-28 bg-[#0d0d12] border border-white/5 rounded-lg p-3 text-white focus:border-amber/50 outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingInterest}
                  className="w-full h-11 rounded-lg bg-amber hover:bg-amber-hover text-surface text-xs font-bold active:scale-95 transition-all flex items-center justify-center"
                >
                  {isSubmittingInterest ? "Submitting..." : "Send Application"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Applications Modal */}
      <AnimatePresence>
        {showApplicationsModal && selectedListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5 my-8 max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-display text-lg font-bold text-white">Applications Received</h3>
                  <p className="text-xs text-text-muted mt-0.5">{selectedListing.project_title}</p>
                </div>
                <button
                  onClick={() => setShowApplicationsModal(false)}
                  className="text-text-muted hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {loadingApplications ? (
                  <div className="flex flex-col gap-3">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-28 bg-[#0d0d12] rounded-xl border border-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-12 bg-[#0d0d12] rounded-xl border border-white/5">
                    <p className="text-sm text-text-muted font-bold">No applications yet.</p>
                  </div>
                ) : (
                  applications.map((app) => (
                    <div key={app.id} className="bg-[#0d0d12] p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row gap-4 relative">
                      <div className="flex gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm overflow-hidden border border-white/10 shrink-0">
                          {app.users?.avatar_url ? (
                            <img src={app.users.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            (app.users?.display_name || "A").charAt(0)
                          )}
                        </div>
                        <div className="sm:hidden">
                          <h4 className="text-sm font-bold text-white leading-tight">{app.users?.display_name}</h4>
                          <p className="text-xs text-text-muted">@{app.users?.username}</p>
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="hidden sm:block">
                          <h4 className="text-sm font-bold text-white leading-tight">{app.users?.display_name}</h4>
                          <p className="text-xs text-text-muted">@{app.users?.username}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 text-xs text-text-secondary leading-relaxed">
                          {app.message}
                        </div>
                        <p className="text-[10px] text-text-muted text-right">
                          Applied {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-start">
                        {/* Option C: Temporary Chat redirecting to profile */}
                        <a
                          href={`/messages/${app.users?.username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="h-8 px-4 rounded-lg bg-amber hover:bg-amber-hover text-surface text-xs font-bold transition-all flex items-center justify-center whitespace-nowrap shadow-lg shadow-amber/10 active:scale-95"
                        >
                          Message
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper to format timestamps
function formatTime(dateStr: string | null): string {
  if (!dateStr) return "Just now";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
