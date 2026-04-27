"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { FilmIcon, PlayIcon, LinkIcon, SendIcon } from "@/components/icons";

import { useSession } from "next-auth/react";

export function WatchTogether({ roomId }: { roomId: string }) {
  const { data: session } = useSession();
  const [videoUrl, setVideoUrl] = useState("");
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchSession();
    
    // Subscribe to session updates
    const channel = supabase
      .channel(`watch:${roomId}`)
      .on("broadcast", { event: "video_update" }, ({ payload }: { payload: any }) => {
        setCurrentSession(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const fetchSession = async () => {
    const { data } = await supabase
      .from("watch_together_sessions")
      .select("*")
      .eq("room_id", roomId)
      .eq("is_active", true)
      .maybeSingle();
    
    setCurrentSession(data);
  };

  const startWatching = async () => {
    if (!videoUrl || !session?.user) return;
    const userId = (session.user as any).id;
    setLoading(true);
    try {

      // Pre-check room existence
      const { data: roomCheck } = await supabase
        .from("communities")
        .select("id")
        .eq("id", roomId)
        .maybeSingle();
      
      if (!roomCheck) {
        alert("This room no longer exists.");
        return;
      }
      
      const sessionData = {
        room_id: roomId,
        video_url: videoUrl,
        started_by: userId,
        is_active: true,
        started_at: new Date().toISOString()
      };

      // Use simplified insert
      const { error } = await supabase
        .from("watch_together_sessions")
        .insert(sessionData);

      if (error) throw error;

      // Fetch the inserted session to broadcast correctly
      const { data: newSession } = await supabase
        .from("watch_together_sessions")
        .select("*")
        .eq("room_id", roomId)
        .eq("is_active", true)
        .order("started_at", { ascending: false })
        .limit(1)
        .single();

      // Broadcast to other members
      await supabase.channel(`watch:${roomId}`).send({
        type: "broadcast",
        event: "video_update",
        payload: newSession,
      });

      setCurrentSession(newSession);
      setVideoUrl("");
    } catch (error) {
      console.error("Failed to start session:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo mb-2">Watch Together</h3>
        <p className="text-[11px] text-text-muted leading-relaxed">
          Screen your latest cuts or find inspiration with your crew in real-time.
        </p>
      </div>

      {currentSession ? (
        <div className="space-y-4">
          <div className="aspect-video w-full bg-black rounded-2xl border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-indigo/5" />
            <FilmIcon className="w-8 h-8 text-indigo/40" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest truncate">Now Screening</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-indigo/5 border border-indigo/10 rounded-2xl">
            <h4 className="text-xs font-bold text-white truncate mb-1">CineForge Production #1</h4>
            <p className="text-[10px] text-text-muted">Started by @owner</p>
            
            <button className="w-full mt-4 py-2.5 bg-indigo text-white font-bold text-xs rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
              <PlayIcon className="w-4 h-4" />
              Sync with Host
            </button>
          </div>

          <button 
            onClick={() => setCurrentSession(null)}
            className="w-full py-2 border border-white/10 rounded-xl text-[10px] font-bold text-text-muted hover:text-error hover:border-error/30 transition-all"
          >
            End Session
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl border-dashed flex flex-col items-center justify-center py-8 text-center">
            <FilmIcon className="w-10 h-10 text-white/10 mb-3" />
            <p className="text-xs text-text-muted px-4">No active screening. Paste a link to start watching together.</p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input 
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="YouTube or Vimeo link..." 
                className="w-full h-11 bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo transition-all"
              />
            </div>
            <button 
              onClick={startWatching}
              disabled={loading || !videoUrl}
              className="w-full h-11 bg-indigo text-white font-bold text-xs rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-indigo/20 disabled:opacity-50"
            >
              {loading ? "Initializing..." : "Start Screening"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
