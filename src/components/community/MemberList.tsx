"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CrownIcon, UserIcon } from "@/components/icons";

interface Member {
  user_id: string;
  role: string;
  user_profile: {
    display_name: string;
    avatar_url: string;
    username: string;
  };
  isOnline?: boolean;
}

import { useSession } from "next-auth/react";

export function MemberList({ roomId }: { roomId: string }) {
  const { data: session } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchMembers();
    
    // Subscribe to presence
    const channel = supabase.channel(`room_presence:${roomId}`, {
      config: {
        presence: {
          key: roomId,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        // Flatten presence state to get user IDs
        const ids = Object.values(state).flat().map((p: any) => p.user_id);
        setOnlineUsers(ids);
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          const userId = (session?.user as any)?.id;
          if (userId) {
            await channel.track({ user_id: userId, online_at: new Date().toISOString() });
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, session]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("community_members")
        .select(`
          user_id,
          role,
          user_profile:users (
            display_name,
            avatar_url,
            username
          )
        `)
        .eq("room_id", roomId);
      
      setMembers(data || []);
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  };

  const sortedMembers = [...members].sort((a, b) => {
    // Admins first, then mods, then members
    const roles = { admin: 0, moderator: 1, member: 2 };
    const roleDiff = (roles as any)[a.role] - (roles as any)[b.role];
    if (roleDiff !== 0) return roleDiff;
    return a.user_profile.display_name.localeCompare(b.user_profile.display_name);
  });

  if (loading) return <div className="p-4 space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />)}</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Production Crew — {members.length}</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-1">
        {sortedMembers.map((member) => {
          const isOnline = onlineUsers.includes(member.user_id);
          return (
            <div 
              key={member.user_id}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-all group cursor-pointer"
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                  {member.user_profile.avatar_url ? (
                    <img src={member.user_profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-text-muted" />
                  )}
                </div>
                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-surface ${isOnline ? "bg-success" : "bg-text-muted"}`} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold truncate ${isOnline ? "text-white" : "text-text-muted"}`}>
                    {member.user_profile.display_name}
                  </span>
                  {member.role === "admin" && <CrownIcon className="w-3 h-3 text-amber shrink-0" />}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-text-muted truncate">@{member.user_profile.username}</span>
                  {member.role !== "member" && (
                    <span className="text-[8px] px-1 rounded bg-amber/10 text-amber border border-amber/20 font-black uppercase">
                      {member.role}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/5">
        <button className="w-full py-2 bg-amber/10 border border-amber/20 rounded-xl text-[10px] font-bold uppercase tracking-widest text-amber hover:bg-amber/20 transition-all">
          Recruit Crew
        </button>
      </div>
    </div>
  );
}
