"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CameraOff } from "lucide-react";
import { ClapperboardIcon } from "@/components/icons";

export function CameraSimulator() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);

  // Camera Settings
  const [iso, setIso] = useState("800");
  const [shutter, setShutter] = useState("1/48");
  const [wb, setWb] = useState("3200K");
  const [lens, setLens] = useState("35mm");
  const [fStop, setFStop] = useState("2.8");
  const [fps, setFps] = useState("24");

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }
      });
      setStream(mediaStream);
      setIsCameraOn(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsCameraOn(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Derive visual effects from settings
  const getFilterStyle = () => {
    let brightness = 100;
    let sepia = 0;
    let hue = 0;
    let contrast = 100;

    // ISO affects brightness
    if (iso === "100") brightness = 80;
    if (iso === "200") brightness = 90;
    if (iso === "400") brightness = 100;
    if (iso === "800") brightness = 115;
    if (iso === "1600") brightness = 130;
    if (iso === "3200") brightness = 150;

    // WB affects temperature
    if (wb === "3200K") { sepia = 30; hue = 10; }
    if (wb === "4500K") { sepia = 10; hue = 0; }
    if (wb === "5600K") { sepia = 0; hue = 0; }
    if (wb === "6500K") { sepia = 20; hue = -20; } // Cooler

    return `brightness(${brightness}%) sepia(${sepia}%) hue-rotate(${hue}deg) contrast(${contrast}%)`;
  };

  const getZoom = () => {
    if (lens === "24mm") return 1;
    if (lens === "35mm") return 1.2;
    if (lens === "50mm") return 1.5;
    if (lens === "85mm") return 2;
    return 1;
  };

  // Generate noise opacity based on ISO
  const getNoiseOpacity = () => {
    if (iso === "100") return 0.02;
    if (iso === "200") return 0.04;
    if (iso === "400") return 0.06;
    if (iso === "800") return 0.1;
    if (iso === "1600") return 0.15;
    if (iso === "3200") return 0.25;
    return 0.1;
  };

  return (
    <motion.div 
      className="relative hidden lg:block"
      initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ delay: 0.5, duration: 1, type: "spring" }}
    >
      <div className="absolute inset-0 bg-amber/10 blur-[100px] rounded-full" />
      <div className="relative border border-border-default rounded-3xl p-8 bg-elevated/80 backdrop-blur-xl shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isCameraOn ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className={`font-mono text-[10px] uppercase tracking-widest ${isCameraOn ? 'text-red-500' : 'text-gray-500'}`}>
              {isCameraOn ? 'REC' : 'STBY'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] text-text-muted">2.39 : 1</span>
            {isCameraOn ? (
              <button onClick={stopCamera} className="p-1.5 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500/40 transition-colors">
                <CameraOff className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={startCamera} className="p-1.5 rounded-full bg-amber/20 text-amber hover:bg-amber/40 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="w-full aspect-video bg-black rounded-xl relative overflow-hidden border border-border-default shadow-inner">
          <AnimatePresence>
            {!isCameraOn && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-br from-black/5 dark:from-white/5 to-transparent flex flex-col items-center justify-center cursor-pointer group"
                onClick={startCamera}
              >
                <motion.div whileHover={{ scale: 1.05 }} className="relative flex items-center justify-center w-full h-full">
                  <ClapperboardIcon className="w-32 h-32 text-amber animate-clap origin-top drop-shadow-[0_0_15px_rgba(255,184,0,0.3)] transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 backdrop-blur-sm transition-all duration-300">
                    <span className="px-6 py-3 rounded-full border border-amber/50 bg-amber/10 text-amber font-mono text-xs tracking-widest uppercase shadow-[0_0_20px_rgba(255,184,0,0.2)]">
                      Enable Camera
                    </span>
                  </div>
                </motion.div>
                <div className="absolute bottom-4 left-6 font-mono text-[10px] text-amber/60 group-hover:opacity-0 transition-opacity duration-300">
                  ROLL_001 • TAKE_07
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover transition-all duration-300 ease-in-out"
            style={{ 
              filter: getFilterStyle(),
              transform: `scale(${getZoom()})`,
              opacity: isCameraOn ? 1 : 0
            }}
          />

          {/* SVG Noise Overlay */}
          {isCameraOn && (
            <div 
              className="absolute inset-0 pointer-events-none mix-blend-overlay transition-opacity duration-300"
              style={{ 
                opacity: getNoiseOpacity(),
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
              }}
            />
          )}

          {/* Vignette for F-stop simulation */}
          {isCameraOn && (
            <div 
              className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] transition-opacity duration-300"
              style={{ opacity: fStop === "1.4" ? 1 : fStop === "2.8" ? 0.7 : fStop === "4.0" ? 0.4 : 0.2 }}
            />
          )}

          {isCameraOn && (
            <div className="absolute bottom-4 left-6 font-mono text-[10px] text-amber/80 drop-shadow-md">
              ROLL_001 • TAKE_07
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-8 mt-8">
          <SettingSelect label="ISO" value={iso} onChange={setIso} options={["100", "200", "400", "800", "1600", "3200"]} />
          <SettingSelect label="SHUT" value={shutter} onChange={setShutter} options={["1/24", "1/48", "1/100", "1/250"]} />
          <SettingSelect label="WB" value={wb} onChange={setWb} options={["3200K", "4500K", "5600K", "6500K"]} />
          <SettingSelect label="LENS" value={lens} onChange={setLens} options={["24mm", "35mm", "50mm", "85mm"]} />
          <SettingSelect label="F" value={fStop} onChange={setFStop} options={["1.4", "2.8", "4.0", "5.6"]} />
          <SettingSelect label="FPS" value={fps} onChange={setFps} options={["24", "30", "60"]} />
        </div>
      </div>
    </motion.div>
  );
}

function SettingSelect({ label, value, onChange, options }: { label: string, value: string, onChange: (val: string) => void, options: string[] }) {
  return (
    <div className="group relative">
      <div className="text-[9px] text-text-muted font-mono uppercase mb-1">{label}</div>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent text-xs font-bold font-mono text-white outline-none cursor-pointer hover:text-amber transition-colors w-full"
      >
        {options.map(opt => (
          <option key={opt} value={opt} className="bg-elevated text-white">{opt}</option>
        ))}
      </select>
    </div>
  );
}
