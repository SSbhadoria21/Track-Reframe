"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ProfileActionsProps {
  targetUserId: string;
}

export function ProfileActions({ targetUserId }: ProfileActionsProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hoveringFollow, setHoveringFollow] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);

  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const res = await fetch(`/api/user/follow?targetId=${targetUserId}`);
        if (res.ok) {
          const data = await res.json();
          setIsFollowing(data.following || false);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (targetUserId) checkFollowStatus();
  }, [targetUserId]);

  const handleFollowToggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/user/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_user_id: targetUserId,
        })
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.following);
        // Dispatch event to update stats locally
        window.dispatchEvent(new CustomEvent('followToggled', { detail: { targetId: targetUserId, following: data.following } }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this creator on Track Reframe',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  if (loading && !isFollowing) {
    return <div className="w-24 h-10 bg-white/5 animate-pulse rounded-xl" />;
  }

  return (
    <>
      <div className="flex items-center gap-3 md:pt-8 shrink-0">
        <button
          onClick={handleFollowToggle}
          onMouseEnter={() => setHoveringFollow(true)}
          onMouseLeave={() => setHoveringFollow(false)}
          className={`min-w-[110px] px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer flex justify-center items-center ${
            isFollowing 
              ? hoveringFollow 
                ? "bg-red-500/10 text-red-500 border border-red-500/50" 
                : "bg-transparent text-amber border border-amber/50"
              : "bg-amber text-[#0A0A0F] border border-amber shadow-lg shadow-amber/20 hover:scale-[1.02] active:scale-95"
          }`}
        >
          {isFollowing ? (hoveringFollow ? "Unfollow" : "Following") : "Follow"}
        </button>

        <button 
          onClick={() => setIsMessageOpen(true)}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/10 transition-colors"
          title="Message"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>

        <button 
          onClick={handleShare}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/10 transition-colors"
          title="Share Profile"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {isMessageOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[100]"
              onClick={() => setIsMessageOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[360px] bg-surface border-l border-white/10 z-[101] flex flex-col shadow-2xl"
            >
              <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/20">
                <h3 className="font-display font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Messages
                </h3>
                <button onClick={() => setIsMessageOpen(false)} className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-black/10">
                <div className="w-16 h-16 rounded-2xl bg-indigo/10 flex items-center justify-center mb-4 border border-indigo/20">
                  <svg className="w-8 h-8 text-indigo" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <h4 className="font-bold text-white mb-2">Direct Messaging Coming Soon</h4>
                <p className="text-sm text-text-secondary">Slide into the director's chair. Private messaging will be available in the next feature rollout.</p>
                <button 
                  onClick={() => setIsMessageOpen(false)}
                  className="mt-6 px-6 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
