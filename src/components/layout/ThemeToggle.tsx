"use client";

import { SunIcon, MoonIcon } from "@/components/icons";
import { useTheme } from "@/components/layout/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-surface border border-border-default hover:border-amber/50 hover:bg-amber/5 transition-all relative overflow-hidden group"
      aria-label="Toggle Theme"
      suppressHydrationWarning
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === "dark" ? (
          <motion.div
            key="moon"
            initial={{ y: 20, opacity: 0, rotate: 45 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: -45 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <MoonIcon className="w-5 h-5 text-amber" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ y: 20, opacity: 0, rotate: -45 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -20, opacity: 0, rotate: 45 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <SunIcon className="w-5 h-5 text-amber" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Subtle glow effect */}
      <div className="absolute inset-0 bg-amber/0 group-hover:bg-amber/5 transition-colors" />
    </button>
  );
}
