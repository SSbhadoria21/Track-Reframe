"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CoverBanner } from "@/components/profile/CoverBanner";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatsRow } from "@/components/profile/StatsRow";
import { BadgesSection } from "@/components/profile/BadgesSection";
import { CineForgeStatsBar } from "@/components/profile/CineForgeStatsBar";
import { ProfileTabs } from "@/components/profile/ProfileTabs";

export default function CreatorProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      setLoading(true);
      const supabase = createClient();
      
      try {
        // Fetch profile by username
        const { data: userData, error } = await supabase
          .from("users")
          .select("*")
          .eq("username", username)
          .single();

        if (userData) {
          setProfile(userData);
          
          // Check if current user is owner
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser && authUser.id === userData.id) {
            setIsOwner(true);
          }
        }
      } catch (error) {
        console.error("Error fetching creator profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-2 border-amber border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Creator Not Found</h2>
        <p className="text-text-muted">The spotlight is empty. This creator hasn't joined the cast yet.</p>
      </div>
    );
  }

  const initials = (profile.display_name || profile.username || "CR").substring(0, 2).toUpperCase();
  const location = profile.city && profile.country ? `${profile.city}, ${profile.country}` : profile.city || profile.country || "Earth";
  const joinDate = profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "Recently";
  const role = (profile.roles && profile.roles.length > 0) ? profile.roles[0] : (profile.role || "Creator");

  return (
    <div className="max-w-[900px] mx-auto pb-20 overflow-y-auto scrollbar-hide">
      <CoverBanner 
        coverUrl={profile.cover_url} 
        userId={profile.id} 
        isOwner={isOwner}
      />
      <ProfileHeader
        userId={profile.id}
        displayName={profile.display_name}
        username={profile.username}
        initials={initials}
        role={role}
        bio={profile.bio || "No bio added yet."}
        location={location}
        joinDate={joinDate}
        website={profile.portfolio_url || ""}
        isVerified={profile.is_verified || false}
        avatarUrl={profile.avatar_url || null}
        isOwner={isOwner}
      />
      <StatsRow userId={profile.id} />
      <BadgesSection userId={profile.id} />
      <CineForgeStatsBar userId={profile.id} />
      <ProfileTabs userId={profile.id} isOwner={isOwner} />
    </div>
  );
}
