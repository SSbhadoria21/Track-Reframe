"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CustomCursor() {
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // High stiffness for immediate feel but slight damping for smoothness
  const springX = useSpring(mouseX, { stiffness: 1000, damping: 40 });
  const springY = useSpring(mouseY, { stiffness: 1000, damping: 40 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.body.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [mouseX, mouseY, isVisible]);

  if (!isVisible) return null;

  return (
    <motion.div
      style={{
        x: springX,
        y: springY,
        translateX: "-20%", // offset to center the pointer tip roughly
        translateY: "-20%",
      }}
      className="fixed top-0 left-0 z-[99999] pointer-events-none"
    >
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="w-7 h-7 text-amber drop-shadow-[0_0_8px_rgba(255,184,0,0.5)]"
      >
        {/* Bottom Body */}
        <path d="M4 11v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8H4Z" />
        
        {/* Top stick (claps on click) */}
        <motion.g
          initial={{ rotate: 0 }}
          animate={{ rotate: isClicking ? 18 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          style={{ transformOrigin: "4px 11px" }}
        >
          <path d="m4 11-.88-2.87a2 2 0 0 1 1.33-2.5l11.48-3.5a2 2 0 0 1 2.5 1.32l.87 2.87L4 11.01Z" />
          <path d="m6.6 8.78 3.15-1.05M11.2 10.2l3.15-1.05M15.8 11.6l3.15-1.05" />
        </motion.g>
      </svg>
    </motion.div>
  );
}
