"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ApertureIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { signIn } from "next-auth/react";
import Link from "next/link";

interface AuthCardProps {
  initialView: "login" | "signup";
}

export function AuthCard({ initialView }: AuthCardProps) {
  const [isLogin, setIsLogin] = useState(initialView === "login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("Director");
  
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const res = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (res?.error) {
          throw new Error(res.error === "CredentialsSignin" ? "Invalid email or password." : res.error);
        }
        
        // On success, redirect to feed
        router.push("/feed");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
              username: username,
              role: role,
            }
          }
        });
        if (error) throw error;
        
        // Auto-signin with NextAuth after signup
        const res = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (res?.error) {
          throw new Error(res.error);
        }

        // On success signup, redirect to onboarding
        router.push("/onboarding");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const roles = ["Director", "Writer", "Cinematographer", "Editor", "Producer"];

  return (
    <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center p-4 lg:p-12 relative overflow-hidden font-sans">
      {/* Back Button */}
      <Link href="/" className="absolute top-6 left-6 z-50 flex items-center gap-3 text-white/50 hover:text-amber transition-all group">
        <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center group-hover:border-amber/50 group-hover:bg-amber/10 transition-all shadow-lg backdrop-blur-md">
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </div>
        <span className="text-xs font-mono uppercase tracking-widest mt-0.5 hidden sm:block">Return to Base</span>
      </Link>

      {/* Background Cinematic Elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,184,0,0.06)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,184,0,0.04)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-grain opacity-20 mix-blend-overlay" />
        
        {/* Animated Film strip accents */}
        <div className="absolute left-6 top-0 bottom-0 w-8 flex flex-col justify-around py-8 opacity-[0.07] hidden md:flex">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="w-4 h-3 border border-white/40 rounded-[2px] mx-auto" />
          ))}
        </div>
        <div className="absolute right-6 top-0 bottom-0 w-8 flex flex-col justify-around py-8 opacity-[0.07] hidden md:flex">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="w-4 h-3 border border-white/40 rounded-[2px] mx-auto" />
          ))}
        </div>

        {/* Viewfinder brackets */}
        <div className="absolute top-24 left-24 w-16 h-16 border-t-[2px] border-l-[2px] border-amber/20 hidden lg:block" />
        <div className="absolute top-24 right-24 w-16 h-16 border-t-[2px] border-r-[2px] border-amber/20 hidden lg:block" />
        <div className="absolute bottom-24 left-24 w-16 h-16 border-b-[2px] border-l-[2px] border-amber/20 hidden lg:block" />
        <div className="absolute bottom-24 right-24 w-16 h-16 border-b-[2px] border-r-[2px] border-amber/20 hidden lg:block" />
      </div>

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        
        {/* Left Typography / Branding */}
        <div className="hidden lg:flex flex-col text-left">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="flex items-center gap-6 mb-10">
              <span className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-500 font-mono text-xs font-bold rounded-sm uppercase tracking-widest">
                <motion.span 
                  animate={{ opacity: [1, 0, 1] }} 
                  transition={{ duration: 2, repeat: Infinity }} 
                  className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                /> 
                REC
              </span>
              <div className="font-mono text-amber/80 text-sm tracking-widest flex gap-2">
                <span>01</span>:<span>24</span>:<span>42</span>:<span>15</span>
              </div>
            </div>
            
            <h1 className="font-display text-5xl xl:text-7xl font-bold leading-[1.05] mb-6 text-white">
              The <span className="text-amber italic serif font-normal">Director's</span><br />
              Dashboard
            </h1>
            
            <p className="text-text-secondary text-lg max-w-md leading-relaxed mb-12">
              Your entire film set in the browser. Write scripts, plan shots, and collaborate with your crew effortlessly.
            </p>

            <div className="grid grid-cols-2 gap-x-12 gap-y-8 opacity-60">
               <div>
                  <div className="font-mono text-[10px] text-text-muted uppercase tracking-widest mb-1.5">Framerate</div>
                  <div className="font-bold text-white tracking-wider">24.000 FPS</div>
               </div>
               <div>
                  <div className="font-mono text-[10px] text-text-muted uppercase tracking-widest mb-1.5">Resolution</div>
                  <div className="font-bold text-white tracking-wider">4K DCI (4096×2160)</div>
               </div>
               <div>
                  <div className="font-mono text-[10px] text-text-muted uppercase tracking-widest mb-1.5">Color Space</div>
                  <div className="font-bold text-white tracking-wider">LogC3 / Rec.709</div>
               </div>
               <div>
                  <div className="font-mono text-[10px] text-text-muted uppercase tracking-widest mb-1.5">White Balance</div>
                  <div className="font-bold text-white tracking-wider">5600K</div>
               </div>
            </div>
          </motion.div>
        </div>

        {/* Right side - The Flip Card */}
        <div className="w-full max-w-[440px] mx-auto perspective-[1200px]">
          <motion.div
            className="relative w-full h-[650px]"
            initial={false}
            animate={{ rotateY: isLogin ? 0 : 180 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 200, damping: 20 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* LOGIN FRONT FACE */}
            <div 
              className="absolute inset-0 bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 sm:p-10 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.3)]"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber/20 to-amber/5 border border-amber/20 flex items-center justify-center mb-4 shadow-lg shadow-amber/10">
                  <ApertureIcon className="w-8 h-8 text-amber" />
                </div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-white">Track Reframe</h2>
                <p className="text-sm text-text-secondary mt-1">Welcome back to the set</p>
              </div>

              <form onSubmit={handleAuth} className="flex-1 flex flex-col space-y-4">
                {error && isLogin && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                    {error}
                  </motion.div>
                )}
                
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5 ml-1">Email</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 bg-black/20 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-amber/50 focus:bg-black/40 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5 ml-1">Password</label>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 bg-black/20 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-amber/50 focus:bg-black/40 transition-all" 
                  />
                </div>
                
                <div className="flex items-center justify-between mt-2 px-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-4 h-4 border border-white/20 rounded bg-black/20 group-hover:border-amber/50 transition-colors">
                      <input type="checkbox" className="absolute opacity-0 w-full h-full cursor-pointer peer" />
                      <svg className="w-3 h-3 text-amber opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Remember me</span>
                  </label>
                  <button type="button" className="text-sm text-amber hover:text-amber-hover transition-colors">Forgot password?</button>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 mt-6 bg-gradient-to-r from-amber to-yellow-500 text-black font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,184,0,0.3)]"
                >
                  {loading ? "Rolling..." : "Action!"}
                </button>

                <div className="relative my-6 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                  <div className="relative px-4 text-xs font-mono uppercase tracking-widest text-text-muted bg-[#0B0B0E]">OR</div>
                </div>

                <button 
                  type="button" 
                  onClick={() => signIn("google", { callbackUrl: "/feed" })}
                  className="w-full h-12 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                  Continue with Google
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-text-secondary">
                New to Track Reframe?{" "}
                <button 
                  type="button"
                  onClick={() => { setError(null); setIsLogin(false); }} 
                  className="text-amber font-bold hover:underline"
                >
                  Join the crew
                </button>
              </p>
            </div>

            {/* SIGNUP BACK FACE */}
            <div 
              className="absolute inset-0 bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 sm:p-10 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.3)]"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <div className="flex flex-col items-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber/20 to-amber/5 border border-amber/20 flex items-center justify-center mb-3">
                  <ApertureIcon className="w-6 h-6 text-amber" />
                </div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-white">Join the Crew</h2>
              </div>

              <form onSubmit={handleAuth} className="flex-1 flex flex-col space-y-3">
                {error && !isLogin && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center">
                    {error}
                  </motion.div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1 ml-1">Display Name</label>
                    <input 
                      type="text" 
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full h-10 bg-black/20 border border-white/10 rounded-xl px-3 text-white focus:outline-none focus:border-amber/50 transition-all text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1 ml-1">Username</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-text-muted text-sm">@</span>
                      <input 
                        type="text" 
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                        className="w-full h-10 bg-black/20 border border-white/10 rounded-xl pl-7 pr-3 text-white focus:outline-none focus:border-amber/50 transition-all text-sm" 
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1 ml-1">Email</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 bg-black/20 border border-white/10 rounded-xl px-3 text-white focus:outline-none focus:border-amber/50 transition-all text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-1 ml-1">Password</label>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 bg-black/20 border border-white/10 rounded-xl px-3 text-white focus:outline-none focus:border-amber/50 transition-all text-sm" 
                  />
                  <div className="flex gap-1 mt-2 h-1 px-1">
                    <div className={`flex-1 rounded-full transition-colors ${password.length > 0 ? 'bg-red-500' : 'bg-white/10'}`}></div>
                    <div className={`flex-1 rounded-full transition-colors ${password.length >= 6 ? 'bg-amber' : 'bg-white/10'}`}></div>
                    <div className={`flex-1 rounded-full transition-colors ${password.length >= 8 ? 'bg-green-500' : 'bg-white/10'}`}></div>
                    <div className={`flex-1 rounded-full transition-colors ${password.length >= 12 ? 'bg-green-500' : 'bg-white/10'}`}></div>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-text-secondary mb-2 ml-1">My Role</label>
                  <div className="flex flex-wrap gap-2">
                    {roles.map(r => (
                      <button 
                        type="button" 
                        key={r} 
                        onClick={() => setRole(r)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          role === r 
                            ? "border-amber bg-amber/10 text-amber shadow-[0_0_10px_rgba(255,184,0,0.2)]" 
                            : "border-white/10 bg-white/5 text-text-secondary hover:border-amber/40 hover:text-white"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 mt-4 bg-gradient-to-r from-amber to-yellow-500 text-black font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,184,0,0.3)]"
                >
                  {loading ? "Preparing set..." : "Sign the call sheet"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-text-secondary">
                Already on the call sheet?{" "}
                <button 
                  type="button"
                  onClick={() => { setError(null); setIsLogin(true); }} 
                  className="text-amber font-bold hover:underline"
                >
                  Log in
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
