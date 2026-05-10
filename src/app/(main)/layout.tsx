import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MainLayoutContent>{children}</MainLayoutContent>
  );
}

async function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  let userId = (session.user as any).id;
  const userEmail = session.user?.email;

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Resolve UUID if needed
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId || "");
  
  if (!isUuid && userEmail) {
    const { data: userProfile } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", userEmail)
      .maybeSingle();
    
    if (userProfile) {
      userId = userProfile.id;
    }
  }

  // Check if onboarding is complete
  const { data: profile, error } = await supabaseAdmin
    .from("users")
    .select("onboarding_complete")
    .eq("id", userId)
    .single();

  if (!profile?.onboarding_complete) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 pb-20 md:pb-0 overflow-x-hidden">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
