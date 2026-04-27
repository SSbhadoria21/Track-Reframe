import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuthButton } from "@/components/auth/AuthButton";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background p-10 flex flex-col items-center justify-center space-y-8">
      <div className="max-w-2xl w-full bg-elevated border border-white/10 rounded-[40px] p-12 text-center shadow-2xl">
        <h1 className="font-display text-5xl font-bold text-white mb-6">
          Welcome back, {session.user?.name}!
        </h1>
        <p className="text-text-secondary text-lg mb-10">
          This is a server-side protected route. Only authenticated users can see this.
        </p>
        <div className="flex flex-col items-center gap-6">
           <div className="w-24 h-24 rounded-full border-4 border-amber p-1">
             <img 
               src={session.user?.image || ""} 
               alt="" 
               className="w-full h-full rounded-full object-cover"
             />
           </div>
           <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left w-full overflow-hidden">
             <pre className="text-xs text-amber font-mono truncate">
               {JSON.stringify(session, null, 2)}
             </pre>
           </div>
           <AuthButton />
        </div>
      </div>
    </div>
  );
}
