import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { createClient } from "@/lib/supabase/server";
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

  const userId = (session.user as any).id;
  const supabase = await createClient();

  // Check if onboarding is complete
  const { data: profile } = await supabase
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
