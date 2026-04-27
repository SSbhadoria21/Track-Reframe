"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon, CheckIcon, ShieldCheckIcon, TrophyIcon, PlusIcon, UsersIcon } from "@/components/icons";
import { toast } from "react-hot-toast";

interface CreateCompetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export function CreateCompetitionModal({ isOpen, onClose, onSuccess, initialData }: CreateCompetitionModalProps) {
  const [step, setStep] = useState(3); 
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [vCode, setVCode] = useState("");
  const [isHuman, setIsHuman] = useState(false);

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    theme: initialData?.theme || "",
    description: initialData?.description || "",
    rules: initialData?.rules || "Original work only\nMaximum 30-minute runtime\nHold all rights to the work",
    round1_start: initialData?.round1_start || new Date().toISOString(),
    round1_end: initialData?.round1_end || "",
    prize_coins: initialData?.prize_coins || 500,
    post_to_feed: true,
    host_production_name: initialData?.host_production_name || "",
    host_company_name: initialData?.host_company_name || "",
    host_contact_info: initialData?.host_contact_info || ""
  });


  const sendVerificationCode = async () => {
    if (!email.includes("@")) return toast.error("Please enter a valid email");
    setLoading(true);
    try {
        const res = await fetch("/api/auth/otp/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (data.success) {
            setVerificationSent(true);
            toast.success("Verification code sent to your email!");
        } else {
            throw new Error(data.error);
        }
    } catch (err: any) {
        toast.error(err.message || "Failed to send code");
    } finally {
        setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (vCode.length < 6) return toast.error("Enter 6-digit code");
    setLoading(true);
    try {
        const res = await fetch("/api/auth/otp/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp: vCode })
        });
        const data = await res.json();
        if (data.success) {
            setStep(2);
            toast.success("Identity Verified!");
        } else {
            throw new Error(data.error);
        }
    } catch (err: any) {
        toast.error(err.message || "Invalid or expired code");
    } finally {
        setLoading(false);
    }
  };



  const handleSubmit = async () => {
    let finalDate = formData.round1_end;
    if (finalDate && finalDate.length === 10) {
        finalDate = `${finalDate}T23:59`;
    }
    if (!finalDate) return toast.error("Please select a valid end date");
    
    setLoading(true);
    try {
      const res = await fetch("/api/competitions", {
        method: initialData ? "PATCH" : "POST",
        body: JSON.stringify({ ...formData, id: initialData?.id, round1_end: finalDate })
      });
      if (res.ok) {
        toast.success("Competition launched!");
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Failed to launch competition");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl h-[90vh] flex flex-col bg-surface border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center">
                    <TrophyIcon className="w-5 h-5 text-amber" />
                </div>
                <h2 className="font-display text-2xl font-bold text-white uppercase tracking-tighter">
                    {initialData ? "Edit Challenge" : "New Challenge"}
                </h2>

            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-text-muted transition-all">
                <XIcon className="w-6 h-6" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-12 scrollbar-hide">
            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-md mx-auto space-y-8 py-10">
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 rounded-[32px] bg-amber/10 border border-amber/20 flex items-center justify-center mx-auto">
                                <ShieldCheckIcon className="w-10 h-10 text-amber" />
                            </div>
                            <h3 className="text-3xl font-display font-bold text-white tracking-tighter">Creator Authentication</h3>
                            <p className="text-sm text-text-muted">Verify your identity to launch a professional challenge.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-amber uppercase tracking-widest">Registered Email</label>
                                <input type="email" placeholder="name@studio.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-amber/50 outline-none transition-all" />
                            </div>
                            {verificationSent ? (
                                <div className="space-y-4">
                                    <input type="text" placeholder="000000" maxLength={6} value={vCode} onChange={(e) => setVCode(e.target.value)} className="w-full bg-black/40 border border-amber/30 rounded-2xl p-4 text-center text-2xl font-mono tracking-[0.5em] text-amber outline-none" />
                                    <button onClick={verifyCode} className="w-full py-4 rounded-2xl bg-amber text-black font-black uppercase tracking-widest hover:bg-amber/90 transition-all">Verify Identity</button>
                                </div>
                            ) : (
                                <button onClick={sendVerificationCode} disabled={loading || !email} className="w-full py-4 rounded-2xl bg-white/10 text-white font-black uppercase tracking-widest hover:bg-white/20 transition-all disabled:opacity-30">
                                    {loading ? "Sending..." : "Send Verification Code"}
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-md mx-auto space-y-8 py-10">
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 rounded-[32px] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/10">
                                <UsersIcon className="w-10 h-10 text-blue-400" />
                            </div>
                            <h3 className="text-3xl font-display font-bold text-white tracking-tighter">Human Verification</h3>
                            <p className="text-sm text-text-muted">Challenges must be launched by human creators.</p>
                        </div>

                        <div className="p-8 rounded-[40px] bg-white/5 border border-white/10 space-y-6 text-center">
                            <button onClick={() => setIsHuman(!isHuman)} className={`w-full py-6 rounded-3xl border-2 transition-all flex items-center justify-center gap-4 ${isHuman ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-white/5 border-white/10 text-text-muted hover:border-white/30"}`}>
                                {isHuman ? <CheckIcon className="w-6 h-6" /> : <div className="w-6 h-6 rounded-full border-2 border-current animate-pulse" />}
                                <span className="font-bold uppercase tracking-widest text-sm">{isHuman ? "Human Verified" : "Verify Humanity"}</span>
                            </button>
                            <button disabled={!isHuman} onClick={() => setStep(3)} className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-white/90 transition-all disabled:opacity-20">Proceed to Launch</button>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-amber uppercase tracking-widest">Challenge Title</label>
                            <input type="text" placeholder="e.g. Noir Underbelly" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-amber/50 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-amber uppercase tracking-widest">Theme</label>
                            <input type="text" placeholder="e.g. 60-second practical lighting noir" value={formData.theme} onChange={(e) => setFormData({...formData, theme: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-amber/50 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-amber uppercase tracking-widest">Rules (one per line)</label>
                            <textarea rows={4} value={formData.rules} onChange={(e) => setFormData({...formData, rules: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-amber/50 outline-none resize-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-amber uppercase tracking-widest">Prize Coins</label>
                                <input type="number" value={formData.prize_coins} onChange={(e) => setFormData({...formData, prize_coins: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-amber/50 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-amber uppercase tracking-widest">End Date</label>
                                <input type="datetime-local" value={formData.round1_end} onChange={(e) => setFormData({...formData, round1_end: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-amber/50 outline-none" />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                            <input type="checkbox" id="post_to_feed" checked={formData.post_to_feed} onChange={(e) => setFormData({...formData, post_to_feed: e.target.checked})} className="w-5 h-5 accent-amber" />
                            <label htmlFor="post_to_feed" className="text-sm text-text-secondary cursor-pointer">Post announcement to the community feed automatically</label>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div />

                            <button onClick={() => setStep(4)} className="py-4 rounded-2xl bg-amber text-black font-black uppercase tracking-widest hover:bg-amber/90 transition-all">Next: Branding</button>
                        </div>
                    </motion.div>
                )}

                {step === 4 && (
                    <motion.div key="step4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                        <div className="p-6 rounded-3xl bg-amber/5 border border-amber/20 mb-4">
                            <h3 className="text-amber font-bold uppercase tracking-widest text-xs mb-2">Production Branding</h3>
                            <p className="text-text-muted text-[10px] leading-relaxed">This info will be featured on the official winner's certificate.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-amber uppercase tracking-widest">Organizing Production</label>
                            <input type="text" placeholder="e.g. CineForge Studios" value={formData.host_production_name} onChange={(e) => setFormData({...formData, host_production_name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-amber/50 outline-none" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-amber uppercase tracking-widest">Company Name</label>
                            <input type="text" placeholder="e.g. FrameWorks Media Inc." value={formData.host_company_name} onChange={(e) => setFormData({...formData, host_company_name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-amber/50 outline-none" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-amber uppercase tracking-widest">Contact Information</label>
                            <input type="text" placeholder="e.g. contact@cineforge.com" value={formData.host_contact_info} onChange={(e) => setFormData({...formData, host_contact_info: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:border-amber/50 outline-none" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <button onClick={() => setStep(3)} className="py-4 rounded-2xl bg-white/5 text-white font-bold uppercase tracking-widest hover:bg-white/10 transition-all">Back</button>
                            <button onClick={handleSubmit} disabled={loading} className="py-4 rounded-2xl bg-amber text-black font-black uppercase tracking-widest hover:bg-amber/90 transition-all disabled:opacity-50">
                                {loading ? "Processing..." : initialData ? "Update Challenge" : "Launch Competition"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
