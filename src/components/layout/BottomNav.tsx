"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FilmReelIcon,
  CameraIcon,
  ApertureIcon,
  ClapperboardIcon,
  UserIcon,
} from "@/components/icons";

export function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { name: "Feed", href: "/feed", icon: FilmReelIcon },
    { name: "Studio", href: "/studio", icon: CameraIcon },
    { name: "Discover", href: "/discover", icon: ApertureIcon },
    { name: "Community", href: "/community", icon: ClapperboardIcon },
    { name: "Dashboard", href: "/dashboard", icon: UserIcon },
  ];

  return (
    <>
      {/* Floating Action Button (Compose) */}
      <div className="md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
        <button className="w-14 h-14 rounded-full bg-amber text-[#0A0A0F] flex items-center justify-center shadow-lg shadow-amber/20 hover:scale-105 active:scale-95 transition-transform">
          <ApertureIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-lg border-t border-border-default z-30 px-2 pb-safe flex justify-between items-center">
        {tabs.map((tab, index) => {
          const isActive = pathname.startsWith(tab.href);
          
          // Add extra space in the middle for the FAB
          const isMiddle = index === 2;
          
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isMiddle ? "mr-12" : index === 3 ? "ml-12" : ""
              } ${isActive ? "text-amber" : "text-text-muted hover:text-text-secondary"}`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
