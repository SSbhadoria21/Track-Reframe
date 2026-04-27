"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ApertureIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { signIn } from "next-auth/react";

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
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // On success, redirect to feed
        router.push("/feed");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({
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
    <div className="min-h-screen w-full bg-background bg-grain flex items-center justify-center p-4" style={{ perspective: "1000px" }}>
      <motion.div
        className="relative w-full max-w-[480px] h-[650px]"
        initial={false}
        animate={{ rotateY: isLogin ? 0 : 180 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* LOGIN FRONT FACE */}
        <div 
          className="absolute inset-0 bg-elevated border border-white/10 rounded-2xl p-10 flex flex-col shadow-2xl"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex flex-col items-center mb-6">
            <ApertureIcon className="w-9 h-9 text-amber mb-3" />
            <h1 className="font-display text-2xl font-bold">Track Reframe</h1>
          </div>

          <form onSubmit={handleAuth} className="flex-1 flex flex-col space-y-4">
            {error && isLogin && (
              <div className="p-3 rounded-md bg-error/10 border border-error/20 text-error text-sm text-center">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 bg-[#0D0D12] border border-white/10 rounded-md px-4 text-white focus:outline-none focus:border-amber transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 bg-[#0D0D12] border border-white/10 rounded-md px-4 text-white focus:outline-none focus:border-amber transition-colors" 
              />
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded bg-[#0D0D12] border-white/10 text-amber focus:ring-amber focus:ring-offset-[#1A1A25]" />
                <span className="text-sm text-text-secondary">Remember me</span>
              </label>
              <button type="button" className="text-sm text-amber hover:text-amber-hover">Forgot password?</button>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 mt-6 bg-amber text-[#0A0A0F] font-bold rounded-md hover:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>

            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
              <div className="relative bg-elevated px-4 text-sm text-text-muted">or</div>
            </div>

            <button 
              type="button" 
              onClick={() => signIn("google", { callbackUrl: "/feed" })}
              className="w-full h-12 bg-white text-black font-medium rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
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
              className="text-amber font-medium hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>

        {/* SIGNUP BACK FACE */}
        <div 
          className="absolute inset-0 bg-elevated border border-white/10 rounded-2xl p-10 flex flex-col shadow-2xl"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="flex flex-col items-center mb-4">
            <ApertureIcon className="w-9 h-9 text-amber mb-2" />
            <h1 className="font-display text-2xl font-bold">Create Account</h1>
          </div>

          <form onSubmit={handleAuth} className="flex-1 flex flex-col space-y-3">
            {error && !isLogin && (
              <div className="p-2 rounded-md bg-error/10 border border-error/20 text-error text-xs text-center">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Display Name</label>
                <input 
                  type="text" 
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full h-10 bg-[#0D0D12] border border-white/10 rounded-md px-3 text-white focus:outline-none focus:border-amber text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-text-muted text-sm">@</span>
                  <input 
                    type="text" 
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                    className="w-full h-10 bg-[#0D0D12] border border-white/10 rounded-md pl-7 pr-3 text-white focus:outline-none focus:border-amber text-sm" 
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 bg-[#0D0D12] border border-white/10 rounded-md px-3 text-white focus:outline-none focus:border-amber text-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 bg-[#0D0D12] border border-white/10 rounded-md px-3 text-white focus:outline-none focus:border-amber text-sm" 
              />
              <div className="flex gap-1 mt-1.5 h-1">
                <div className={`flex-1 rounded-full ${password.length > 0 ? 'bg-error' : 'bg-white/10'}`}></div>
                <div className={`flex-1 rounded-full ${password.length >= 6 ? 'bg-warning' : 'bg-white/10'}`}></div>
                <div className={`flex-1 rounded-full ${password.length >= 8 ? 'bg-success' : 'bg-white/10'}`}></div>
                <div className={`flex-1 rounded-full ${password.length >= 12 ? 'bg-success' : 'bg-white/10'}`}></div>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-medium text-text-secondary mb-2">I am a:</label>
              <div className="flex flex-wrap gap-2">
                {roles.map(r => (
                  <button 
                    type="button" 
                    key={r} 
                    onClick={() => setRole(r)}
                    className={`px-3 py-1 rounded-full border text-xs transition-colors ${
                      role === r ? "border-amber text-amber bg-amber/10" : "border-white/15 text-text-secondary hover:border-amber/50"
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
              className="w-full h-12 mt-4 bg-amber text-[#0A0A0F] font-bold rounded-md hover:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <button 
              type="button"
              onClick={() => { setError(null); setIsLogin(true); }} 
              className="text-amber font-medium hover:underline"
            >
              Log in
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
