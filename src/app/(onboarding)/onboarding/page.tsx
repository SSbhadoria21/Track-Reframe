"use client";

import { useState, useEffect, useRef
  
 } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { createClient } from "@/lib/supabase/client";

const CRAFTS = [
  { id: "director", title: "Director", desc: "Calls action. Owns the vision." },
  { id: "cinematographer", title: "Cinematographer", desc: "Light, lens and composition." },
  { id: "writer", title: "Writer", desc: "The page before the screen." },
  { id: "editor", title: "Editor", desc: "Where the film is really made." },
  { id: "producer", title: "Producer", desc: "Makes the impossible possible." },
  { id: "all", title: "All of the above", desc: "A one-person crew." },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [username, setUsername] = useState("");
  const [selectedCraft, setSelectedCraft] = useState("");
  const [tagline, setTagline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (status === "loading" || hasChecked.current) return;
    
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    const checkProfile = async () => {
      hasChecked.current = true;
      const supabase = createClient();
      let userId = (session?.user as any)?.id;
      const userEmail = session?.user?.email;

      // Resolve UUID if needed
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId || "");
      
      if (!isUuid && userEmail) {
        const { data: profile } = await supabase
          .from("users")
          .select("id")
          .eq("email", userEmail)
          .single();
        
        if (profile) userId = profile.id;
      }
      
      if (!userId) return;

      const { data: profile } = await supabase
        .from("users")
        .select("onboarding_complete, username")
        .eq("id", userId)
        .single();
      
      if (profile?.onboarding_complete) {
        router.push("/feed");
      } else if (profile?.username) {
        setUsername(profile.username);
      }
    };
    
    if (session?.user) {
      checkProfile();
    }
  }, [session, status, router]);

  const handleSubmit = async () => {
    if (!username || !selectedCraft) {
      setError("Please pick a handle and a craft.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      let userId = (session?.user as any)?.id;
      const userEmail = session?.user?.email;

      // Ensure we have a valid UUID for the database update
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId || "");
      
      if (!isUuid && userEmail) {
        const { data: profile } = await supabase
          .from("users")
          .select("id")
          .eq("email", userEmail)
          .single();
        
        if (profile) userId = profile.id;
      }

      if (!userId) throw new Error("Could not find your user ID. Please sign in again.");

      // Use upsert to handle cases where the profile row might not exist yet
      const { error: updateErr } = await supabase
        .from("users")
        .upsert({
          id: userId,
          username: username.toLowerCase().replace(/\s+/g, "_"),
          display_name: session?.user?.name || username,
          email: session?.user?.email,
          roles: [selectedCraft],
          bio: tagline,
          onboarding_complete: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (updateErr) {
        if (updateErr.code === '23505') {
          throw new Error("This username is already taken. Please try another one.");
        }
        throw updateErr;
      }

      // Force a short wait to let the DB synchronize
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Navigate to feed using full reload to clear layout cache
      window.location.href = "/feed";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col items-center justify-center p-6 bg-grain">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <header className="mb-12">
          <span className="font-mono text-[10px] tracking-[0.4em] text-amber uppercase mb-4 block">PRODUCTION SLATE</span>
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
            Set your <span className="text-amber italic serif font-normal">slate.</span>
          </h1>
          <p className="text-text-secondary text-lg">
            Pick a handle, your craft, and a one-line tagline. You can change it anytime.
          </p>
        </header>

        <div className="flex gap-2 mb-12 opacity-40">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="h-4 w-8 bg-amber transform -skew-x-[30deg]" />
          ))}
        </div>

        <div className="space-y-12">
          <section>
            <label className="font-mono text-[9px] uppercase tracking-widest text-text-muted mb-4 block">USERNAME</label>
            <div className="relative group">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-amber font-mono">@</span>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="handle_name"
                className="w-full h-16 bg-[#0E0E14] border border-white/5 rounded-2xl pl-12 pr-6 font-mono text-lg focus:outline-none focus:border-amber/50 focus:bg-[#12121A] transition-all"
              />
            </div>
          </section>

          <section>
            <label className="font-mono text-[9px] uppercase tracking-widest text-text-muted mb-4 block">YOUR CRAFT</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CRAFTS.map((craft) => (
                <button
                  key={craft.id}
                  onClick={() => setSelectedCraft(craft.id)}
                  className={`relative p-6 rounded-2xl border text-left transition-all group ${
                    selectedCraft === craft.id 
                      ? "bg-amber/5 border-amber shadow-[0_0_20px_rgba(255,184,0,0.1)]" 
                      : "bg-[#0E0E14] border-white/5 hover:border-white/20"
                  }`}
                >
                  <div className={`absolute top-2 left-2 w-2 h-2 border-t border-l ${selectedCraft === craft.id ? "border-amber" : "border-white/20"}`} />
                  <div className={`absolute bottom-2 right-2 w-2 h-2 border-b border-r ${selectedCraft === craft.id ? "border-amber" : "border-white/20"}`} />
                  <h3 className="text-xl font-bold mb-1">{craft.title}</h3>
                  <p className="text-[11px] text-text-muted">{craft.desc}</p>
                </button>
              ))}
            </div>
          </section>

          <section>
            <label className="font-mono text-[9px] uppercase tracking-widest text-text-muted mb-4 block">TAGLINE (OPTIONAL)</label>
            <div className="relative">
              <textarea 
                value={tagline}
                onChange={(e) => setTagline(e.target.value.slice(0, 160))}
                placeholder="Telling stories one frame at a time."
                className="w-full h-32 bg-[#0E0E14] border border-white/5 rounded-2xl p-6 text-text-primary focus:outline-none focus:border-amber/50 focus:bg-[#12121A] transition-all resize-none"
              />
              <div className="absolute bottom-4 right-6 font-mono text-[9px] text-text-muted">
                {tagline.length}/160
              </div>
            </div>
          </section>

          {error && (
            <p className="text-red-500 text-sm font-mono">{error}</p>
          )}

          <div className="flex items-center gap-6 pt-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="h-16 px-10 rounded-full bg-amber text-black font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,184,0,0.3)] disabled:opacity-50"
            >
              {loading ? "Processing..." : "Roll camera"}
            </button>
            <span className="hidden md:block font-mono text-[10px] text-text-muted tracking-widest">CTRL+ENTER</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
