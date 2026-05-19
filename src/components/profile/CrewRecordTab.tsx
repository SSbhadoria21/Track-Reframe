"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface CrewRecordTabProps {
  userId?: string;
  isOwner?: boolean;
}

export function CrewRecordTab({ userId, isOwner = true }: CrewRecordTabProps) {
  const [skills, setSkills] = useState<any[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [collaborations, setCollaborations] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Rating Modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingVal, setRatingVal] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [activeCollab, setActiveCollab] = useState<any>(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Fetch skills and collaborations
  useEffect(() => {
    if (!userId) return;

    // Fetch Skills
    fetch(`/api/crew/skills?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => setSkills(data.skills || []))
      .catch(() => {});

    // Fetch Collaborations
    fetch(`/api/crew/collaborations?user_id=${userId}`)
      .then((res) => res.json())
      .then((data) => setCollaborations(data.collaborations || []))
      .catch(() => {});
  }, [userId, refreshTrigger]);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;

    try {
      const res = await fetch("/api/crew/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillName: newSkill.trim(), action: "add" }),
      });

      if (!res.ok) throw new Error();
      toast.success("Skill added!");
      setNewSkill("");
      setRefreshTrigger((p) => p + 1);
    } catch {
      toast.error("Failed to add skill");
    }
  };

  const handleVerifySkill = async (skillId: string) => {
    try {
      const res = await fetch("/api/crew/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId, action: "verify" }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to endorse skill");
      }

      toast.success("Endorsed skill successfully!");
      setRefreshTrigger((p) => p + 1);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleStatusChange = async (collabId: string, status: string) => {
    try {
      const res = await fetch("/api/crew/collaborations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collaborationId: collabId, status }),
      });

      if (!res.ok) throw new Error();
      toast.success(`Collaboration ${status}!`);
      setRefreshTrigger((p) => p + 1);
    } catch {
      toast.error("Failed to update collaboration");
    }
  };

  const openRatingModal = (collab: any) => {
    setActiveCollab(collab);
    setShowRatingModal(true);
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCollab) return;
    setIsSubmittingRating(true);

    const rateeId = activeCollab.sender_id === userId ? activeCollab.receiver_id : activeCollab.sender_id;

    try {
      const res = await fetch("/api/crew/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collaborationId: activeCollab.id,
          rateeId,
          rating: ratingVal,
          reviewText,
        }),
      });

      if (!res.ok) throw new Error("Failed to post rating");
      toast.success("Review posted successfully!");
      setShowRatingModal(false);
      setReviewText("");
      setRefreshTrigger((p) => p + 1);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  return (
    <div className="space-y-8 select-text">
      {/* Vetted Skills Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-mono tracking-[0.2em] text-white uppercase font-bold">
          Vetted Skills
        </h3>

        <div className="flex flex-wrap gap-2.5">
          {skills.map((s) => (
            <div
              key={s.id}
              className="bg-surface border border-white/5 pl-3 pr-2 py-1.5 rounded-lg flex items-center gap-3 text-xs"
            >
              <span className="font-semibold text-white">{s.skill_name}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-text-muted bg-white/5 px-2 py-0.5 rounded">
                  {s.verification_count || 0} endorsements
                </span>
                {!isOwner && (
                  <button
                    onClick={() => handleVerifySkill(s.id)}
                    className="w-5 h-5 rounded-full bg-amber/10 border border-amber/20 hover:bg-amber hover:text-surface text-[11px] font-bold flex items-center justify-center cursor-pointer transition-all"
                    title="Endorse this skill"
                  >
                    +
                  </button>
                )}
              </div>
            </div>
          ))}

          {skills.length === 0 && (
            <p className="text-xs text-text-muted">No skills listed yet.</p>
          )}
        </div>

        {isOwner && (
          <form onSubmit={handleAddSkill} className="flex gap-2 max-w-sm">
            <input
              type="text"
              placeholder="e.g. Colorist, Gaffer, First AD"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="flex-1 bg-surface border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:border-amber/50 outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-amber hover:bg-amber-hover text-surface text-xs font-bold transition-colors cursor-pointer"
            >
              Add
            </button>
          </form>
        )}
      </div>

      {/* Collaborations History */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        <h3 className="text-sm font-mono tracking-[0.2em] text-white uppercase font-bold">
          Collaboration History
        </h3>

        <div className="space-y-3">
          {collaborations.map((collab) => {
            const isSender = collab.sender_id === userId;
            const partner = isSender ? collab.receiver : collab.sender;
            const lowRole = isSender ? collab.role_receiver : collab.role_sender;
            const myRole = isSender ? collab.role_sender : collab.role_receiver;

            return (
              <div
                key={collab.id}
                className="bg-surface border border-white/5 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{collab.project_name}</span>
                    <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] text-text-secondary capitalize">
                      {collab.project_type}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    Partner: <span className="font-semibold text-text-secondary">@{partner?.username}</span> ({lowRole})
                  </p>
                  <p className="text-[10px] text-text-muted">
                    My Role: <span className="font-semibold text-text-secondary">{myRole}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      collab.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : collab.status === "accepted"
                        ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                        : collab.status === "declined"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-amber-500/10 text-amber border border-amber-500/20"
                    }`}
                  >
                    {collab.status}
                  </span>

                  {/* Accept / Decline actions if pending & user is receiver */}
                  {collab.status === "pending" && !isSender && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleStatusChange(collab.id, "accepted")}
                        className="px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] active:scale-95 cursor-pointer"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleStatusChange(collab.id, "declined")}
                        className="px-2.5 py-1 rounded bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-[10px] active:scale-95 cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {/* Complete / Rate action if accepted */}
                  {collab.status === "accepted" && (
                    <button
                      onClick={() => handleStatusChange(collab.id, "completed")}
                      className="px-2.5 py-1 rounded bg-indigo/20 border border-indigo/30 text-indigo font-bold text-[10px] active:scale-95 cursor-pointer"
                    >
                      Complete Project
                    </button>
                  )}

                  {/* Rate Partner if completed */}
                  {collab.status === "completed" && (
                    <button
                      onClick={() => openRatingModal(collab)}
                      className="px-2.5 py-1 rounded bg-amber/10 border border-amber/20 text-amber font-bold text-[10px] hover:bg-amber hover:text-surface transition-all active:scale-95 cursor-pointer"
                    >
                      Rate Partner
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {collaborations.length === 0 && (
            <p className="text-xs text-text-muted">No collaboration entries recorded.</p>
          )}
        </div>
      </div>

      {/* Testimonials / Reviews Received */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        <h3 className="text-sm font-mono tracking-[0.2em] text-white uppercase font-bold">
          Reviews & Testimonials
        </h3>

        <div className="text-xs text-text-muted">
          Reviews are generated upon completed collaboration projects and feed directly into the user's trust reliability score.
        </div>
      </div>

      {/* Rate/Review Modal */}
      <AnimatePresence>
        {showRatingModal && activeCollab && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-display text-lg font-bold text-white">Rate Collaborator</h3>
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="text-text-muted hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRatingSubmit} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-text-secondary uppercase font-bold block">
                    Rating (1-5 Stars)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setRatingVal(val)}
                        className={`w-9 h-9 rounded-lg border font-mono text-sm font-bold flex items-center justify-center transition-all ${
                          ratingVal >= val
                            ? "bg-amber border-amber text-surface"
                            : "bg-[#0d0d12] border-white/5 text-text-muted"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">
                    Review / Testimonial
                  </label>
                  <textarea
                    required
                    placeholder="Describe your working experience with this partner on this project..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full h-24 bg-[#0d0d12] border border-white/5 rounded-lg p-3 text-white focus:border-amber/50 outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingRating}
                  className="w-full h-11 rounded-lg bg-amber hover:bg-amber-hover text-surface text-xs font-bold active:scale-95 transition-all flex items-center justify-center"
                >
                  {isSubmittingRating ? "Submitting..." : "Post Review"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
