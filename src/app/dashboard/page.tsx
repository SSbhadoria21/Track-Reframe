import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuthButton } from "@/components/auth/AuthButton";
import Link from "next/link";
import { ArrowLeft, Mail, Clapperboard, Users, LayoutDashboard, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase.from('users').select('id, roles, bio').eq('email', session.user.email).maybeSingle();
  
  let activeProjects = 0;
  if (profile?.id) {
     const { count } = await supabase.from('films').select('*', { count: 'exact', head: true }).eq('user_id', profile.id);
     activeProjects = count || 0;
  }
  
  const designation = profile?.roles?.[0] || "Indie Filmmaker";

  return (
    <div className="min-h-screen bg-background p-6 md:p-10 flex flex-col items-center py-20 relative">
      <Link href="/" className="absolute top-10 left-10 flex items-center gap-2 text-text-muted hover:text-amber transition-colors">
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Back to Home</span>
      </Link>

      <div className="max-w-3xl w-full bg-elevated border border-border-default rounded-[40px] p-8 md:p-12 shadow-2xl mt-12">
        <div className="flex flex-col items-center text-center mb-10">
           <div className="w-28 h-28 rounded-full border-4 border-amber p-1 flex items-center justify-center bg-black/5 dark:bg-white/5 mb-6 shadow-[0_0_30px_rgba(255,184,0,0.2)]">
             {session.user?.image ? (
               <img 
                 src={session.user.image} 
                 alt={session.user?.name || "User"} 
                 className="w-full h-full rounded-full object-cover"
               />
             ) : (
               <span className="text-5xl font-bold text-amber">
                 {session.user?.name?.[0]?.toUpperCase() || "U"}
               </span>
             )}
           </div>
           <h1 className="font-display text-4xl font-bold text-text-primary mb-2">
             {session.user?.name}
           </h1>
           <div className="flex items-center gap-2 text-text-secondary bg-black/5 dark:bg-white/5 px-4 py-1.5 rounded-full border border-border-default">
             <Mail className="w-4 h-4 text-amber" />
             <span className="text-sm">{session.user?.email}</span>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="p-6 rounded-3xl bg-black/5 dark:bg-white/5 border border-border-default flex flex-col items-center justify-center text-center">
            <span className="text-text-muted text-sm uppercase tracking-widest font-mono mb-2">Current Role</span>
            <span className="text-2xl font-bold text-amber">{designation}</span>
          </div>
          <div className="p-6 rounded-3xl bg-black/5 dark:bg-white/5 border border-border-default flex flex-col items-center justify-center text-center">
            <span className="text-text-muted text-sm uppercase tracking-widest font-mono mb-2">Active Projects</span>
            <span className="text-2xl font-bold text-text-primary">{activeProjects}</span>
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-sm uppercase tracking-widest font-mono text-text-muted mb-4 px-2">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/studio" className="flex items-center gap-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-border-default hover:border-amber/50 hover:bg-amber/5 transition-all group">
              <div className="w-10 h-10 rounded-full bg-amber/10 flex items-center justify-center text-amber group-hover:scale-110 transition-transform">
                <Clapperboard className="w-5 h-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-text-primary group-hover:text-amber transition-colors">The Studio</span>
                <span className="text-xs text-text-muted">Write & Plan Scripts</span>
              </div>
            </Link>
            
            <Link href="/community" className="flex items-center gap-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-border-default hover:border-amber/50 hover:bg-amber/5 transition-all group">
              <div className="w-10 h-10 rounded-full bg-amber/10 flex items-center justify-center text-amber group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-text-primary group-hover:text-amber transition-colors">The Crew</span>
                <span className="text-xs text-text-muted">Chat & Network</span>
              </div>
            </Link>

            <Link href="/feed" className="flex items-center gap-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-border-default hover:border-amber/50 hover:bg-amber/5 transition-all group">
              <div className="w-10 h-10 rounded-full bg-amber/10 flex items-center justify-center text-amber group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-text-primary group-hover:text-amber transition-colors">Social Feed</span>
                <span className="text-xs text-text-muted">Explore latest updates</span>
              </div>
            </Link>

            <button className="flex items-center gap-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-border-default hover:border-amber/50 hover:bg-amber/5 transition-all group opacity-70">
              <div className="w-10 h-10 rounded-full bg-amber/10 flex items-center justify-center text-amber group-hover:scale-110 transition-transform">
                <Settings className="w-5 h-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-text-primary group-hover:text-amber transition-colors">Settings</span>
                <span className="text-xs text-text-muted">Manage profile (Coming Soon)</span>
              </div>
            </button>
          </div>
        </div>

        <div className="flex justify-center border-t border-border-default pt-8 mt-8">
           <AuthButton />
        </div>
      </div>
    </div>
  );
}
