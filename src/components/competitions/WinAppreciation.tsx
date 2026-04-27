"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { CrownIcon, TrophyIcon, StarIcon } from "@/components/icons";

interface WinAppreciationProps {
  isOpen: boolean;
  onClose: () => void;
  compTitle?: string;
}

export function WinAppreciation({ isOpen, onClose, compTitle }: WinAppreciationProps) {
  useEffect(() => {
    if (isOpen) {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 200 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 text-center space-y-8"
      >
        <div className="relative inline-block">
            <motion.div 
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-amber via-yellow-200 to-amber opacity-20 blur-3xl"
            />
            <div className="relative w-48 h-48 rounded-full bg-surface border-4 border-amber flex items-center justify-center shadow-[0_0_50px_rgba(245,166,35,0.3)]">
                <TrophyIcon className="w-24 h-24 text-amber" />
            </div>
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-amber flex items-center justify-center text-black"
            >
                <CrownIcon className="w-8 h-8" />
            </motion.div>
        </div>

        <div className="space-y-4">
            <h1 className="font-display text-6xl md:text-8xl font-black text-white uppercase tracking-tighter italic">
                Champion!
            </h1>
            <p className="text-xl md:text-2xl text-amber font-bold tracking-widest uppercase">
                Winner of {compTitle || "The Film Challenge"}
            </p>
        </div>

        <p className="text-text-muted max-w-md mx-auto leading-relaxed">
            Congratulations! Your masterpiece has taken the top spot. Your legendary badge and e-certificate have been added to your profile.
        </p>

        <div className="pt-10">
            <button 
                onClick={onClose}
                className="px-10 py-4 rounded-full bg-amber text-black font-black uppercase tracking-widest hover:scale-110 transition-transform shadow-xl shadow-amber/20"
            >
                Claim My Rewards
            </button>
        </div>
      </motion.div>
    </div>
  );
}
