"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { CertificateCard } from "./CertificateCard";
import { TrophyIcon } from "@/components/icons";

interface CertificatesTabProps {
  userId?: string;
  isOwner?: boolean;
}

export function CertificatesTab({ userId, isOwner }: CertificatesTabProps) {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!userId) return;
      const { data } = await supabase
        .from("competition_submissions")
        .select("*, competition:competitions(title, theme, round1_end)")
        .eq("user_id", userId)
        .eq("submission_status", "winner");
      
      if (data) setCertificates(data);
      setLoading(false);
    };

    fetchCertificates();
  }, [userId]);

  if (loading) return (
    <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (certificates.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
            <TrophyIcon className="w-16 h-16 mb-4 text-text-muted" />
            <h3 className="font-display font-bold text-lg text-white">No Certificates Yet</h3>
            <p className="text-sm text-text-muted max-w-xs mx-auto">Win competitions to unlock professional film-making certificates.</p>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {certificates.map((cert) => (
            <CertificateCard key={cert.id} certificate={cert} />
        ))}
    </div>
  );
}
