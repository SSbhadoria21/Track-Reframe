"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

import { CoverBanner } from "@/components/profile/CoverBanner";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatsRow } from "@/components/profile/StatsRow";
import { BadgesSection } from "@/components/profile/BadgesSection";
import { CineForgeStatsBar } from "@/components/profile/CineForgeStatsBar";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { TrophyIcon } from "@/components/icons";
import { CreateCompetitionModal } from "@/components/competitions/CreateCompetitionModal";
import { WinAppreciation } from "@/components/competitions/WinAppreciation";


export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [winningComp, setWinningComp] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);


  const fetchUser = async () => {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (authUser) {
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();
      
      
      if (profile) {
        setUser(profile);
        // Check for unseen wins
        const { data: win } = await supabase
          .from("competition_submissions")
          .select("*, competition:competitions(title)")
          .eq("user_id", authUser.id)
          .eq("submission_status", "winner")
          .eq("win_animation_seen", false)
          .limit(1)
          .maybeSingle();

        if (win) {
          setWinningComp(win);
          setShowWinAnimation(true);
          // Mark as seen
          await supabase
            .from("competition_submissions")
            .update({ win_animation_seen: true })
            .eq("id", win.id);
        }
      } else {

        // Fallback if no profile row
        setUser({
          id: authUser.id,
          display_name: authUser.user_metadata?.display_name || "Creator Profile",
          username: authUser.user_metadata?.username || "creator",
          role: authUser.user_metadata?.role || "Director",
        });
      }
    }
  };

  useEffect(() => {
    fetchUser();
  }, [refreshTrigger]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-2 border-amber border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = (user.display_name || "CR").substring(0, 2).toUpperCase();
  const location = user.city && user.country ? `${user.city}, ${user.country}` : user.city || user.country || "Earth";
  const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "Recently";
  const role = (user.roles && user.roles.length > 0) ? user.roles[0] : (user.role || "Creator");

  return (
    <div className="max-w-[900px] mx-auto pb-20 overflow-y-auto scrollbar-hide">
      <CoverBanner 
        coverUrl={user.cover_url} 
        userId={user.id} 
        isOwner={true}
        onUpdate={() => setRefreshTrigger(prev => prev + 1)} 
      />
      <ProfileHeader
        userId={user.id}
        displayName={user.display_name}
        username={user.username}
        initials={initials}
        role={role}
        bio={user.bio || "No bio added yet."}
        location={location}
        joinDate={joinDate}
        website={user.portfolio_url || ""}
        isVerified={user.is_verified || false}
        avatarUrl={user.avatar_url || null}
        isOwner={true}
        onUpdate={() => setRefreshTrigger(prev => prev + 1)}
      />
      <StatsRow userId={user.id} />
      <BadgesSection userId={user.id} />
      <CineForgeStatsBar userId={user.id} />
      <ProfileTabs userId={user.id} isOwner={true} />

      {/* Create Competition Button */}
      <div className="fixed bottom-10 right-10 z-50">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowCreateModal(true)}
            className="w-16 h-16 rounded-full bg-amber shadow-2xl shadow-amber/40 flex items-center justify-center text-black"
          >
            <TrophyIcon className="w-8 h-8 fill-black" />
          </motion.button>
      </div>

      <CreateCompetitionModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        onSuccess={() => setRefreshTrigger(prev => prev + 1)}
      />

      <WinAppreciation 
        isOpen={showWinAnimation} 
        onClose={() => setShowWinAnimation(false)} 
        compTitle={winningComp?.competition?.title}
      />
    </div>

  );
}
