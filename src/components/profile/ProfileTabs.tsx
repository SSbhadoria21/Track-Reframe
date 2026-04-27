"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FilmsTab } from "./FilmsTab";
import { ScriptsTab } from "./ScriptsTab";
import { CertificatesTab } from "./CertificatesTab";


type Tab = "films" | "scripts" | "awards" | "certificates";


interface ProfileTabsProps {
  userId?: string;
  isOwner?: boolean;
}

export function ProfileTabs({ userId, isOwner = true }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("films");

  return (
    <div className="mt-8 px-4 md:px-0">
      {/* Tab navigation */}
      <div className="flex items-center gap-6 border-b border-white/10 mb-6 px-2">
        <TabButton active={activeTab === "films"} onClick={() => setActiveTab("films")} label="Films" />
        <TabButton active={activeTab === "scripts"} onClick={() => setActiveTab("scripts")} label="Scripts" />
        <TabButton active={activeTab === "awards"} onClick={() => setActiveTab("awards")} label="Awards" />
        <TabButton active={activeTab === "certificates"} onClick={() => setActiveTab("certificates")} label="Certificates" />

      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === "films" && <FilmsTab userId={userId} isOwner={isOwner} />}
        {activeTab === "scripts" && <ScriptsTab isOwner={isOwner} />}
        {activeTab === "certificates" && <CertificatesTab userId={userId} isOwner={isOwner} />}
        {activeTab === "awards" && (

          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="font-display font-bold text-lg text-white mb-1">No Awards Yet</h3>
            <p className="text-sm text-text-muted max-w-sm">
              Participate in Track Reframe competitions and community challenges to earn awards.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`relative pb-4 text-sm font-bold uppercase tracking-wider transition-colors ${
        active ? "text-white" : "text-text-muted hover:text-white"
      }`}
    >
      <div className="flex items-center gap-2">
        {label}
        {count !== undefined && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-white/5 text-text-muted"}`}>
            {count}
          </span>
        )}
      </div>
      {active && (
        <motion.div
          layoutId="profileTabIndicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber rounded-t-full"
        />
      )}
    </button>
  );
}
