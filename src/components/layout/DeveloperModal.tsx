import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Phone, ExternalLink, Award, Code2, Layers, Cpu } from "lucide-react";

function Github(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.18-.35 6.5-1.56 6.5-7.14a5.2 5.2 0 0 0-1.5-3.8c.15-.38.65-1.8-.15-3.75 0 0-1.25-.4-4 1.4a13.6 13.6 0 0 0-7 0c-2.75-1.8-4-1.4-4-1.4-.8 1.95-.3 3.37-.15 3.75a5.2 5.2 0 0 0-1.5 3.8c0 5.57 3.3 6.78 6.5 7.14a4.8 4.8 0 0 0-1 3.02v4" />
      <path d="M9 20c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

function Linkedin(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
import Image from "next/image";

interface DeveloperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeveloperModal({ isOpen, onClose }: DeveloperModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="bg-elevated border border-border-default rounded-3xl overflow-hidden shadow-2xl relative">
              {/* Header Gradient */}
              <div className="h-32 bg-gradient-to-br from-amber/20 via-amber/5 to-transparent absolute top-0 left-0 right-0 pointer-events-none" />
              
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full bg-black/20 hover:bg-black/40 text-text-muted hover:text-white transition-all z-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8 md:p-12 relative z-10">
                <div className="flex flex-col md:flex-row gap-10 items-start">
                  
                  {/* Photo & Quick Contact */}
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-background shadow-xl mb-6">
                      <Image 
                        src="/developer.jpeg" 
                        alt="Sumit Singh Bhadoria" 
                        fill
                        className="object-cover"
                      />
                    </div>
                    
                    <h2 className="text-2xl font-display font-bold text-white mb-2">Sumit Singh Bhadoria</h2>
                    <p className="text-amber font-mono text-sm mb-6">Full-Stack & AI Engineer</p>
                    
                    <div className="flex gap-4">
                      <a href="https://github.com/SSbhadoria21" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-background border border-border-default flex items-center justify-center hover:border-amber hover:text-amber transition-colors text-text-muted">
                        <Github className="w-5 h-5" />
                      </a>
                      <a href="https://linkedin.com/in/ss-bhadoria-rs2101" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-background border border-border-default flex items-center justify-center hover:border-amber hover:text-amber transition-colors text-text-muted">
                        <Linkedin className="w-5 h-5" />
                      </a>
                      <a href="https://ssb.sumitsbhadoria21.workers.dev" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-background border border-border-default flex items-center justify-center hover:border-amber hover:text-amber transition-colors text-text-muted">
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                  </div>

                  {/* About Content */}
                  <div className="flex-1 space-y-8">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Cpu className="w-5 h-5 text-amber" />
                        <h3 className="text-xl font-bold text-white">About the Developer</h3>
                      </div>
                      <p className="text-text-secondary leading-relaxed">
                        3rd-year B.Tech Computer Science student specializing in full-stack development and AI integration. 
                        Builds production-grade applications with a proven ability to architect scalable backends, real-time systems, and ML pipelines. 
                        Passionate about crafting premium cinematic web tools like <span className="text-amber font-bold">Track Reframe</span>.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-background/50 rounded-2xl p-5 border border-border-default/50">
                        <div className="flex items-center gap-2 mb-3">
                          <Code2 className="w-4 h-4 text-amber" />
                          <h4 className="text-sm font-bold text-white">Tech Stack</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {['Next.js 16', 'React 19', 'TypeScript', 'Node.js', 'Python', 'Tailwind v4'].map(t => (
                            <span key={t} className="px-2 py-1 rounded bg-elevated text-xs font-mono text-text-muted border border-border-default">{t}</span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-background/50 rounded-2xl p-5 border border-border-default/50">
                        <div className="flex items-center gap-2 mb-3">
                          <Layers className="w-4 h-4 text-amber" />
                          <h4 className="text-sm font-bold text-white">Database & Realtime</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {['Supabase', 'PostgreSQL', 'Yjs', 'WebRTC', 'Socket.io', 'MongoDB'].map(t => (
                            <span key={t} className="px-2 py-1 rounded bg-elevated text-xs font-mono text-text-muted border border-border-default">{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                       <div className="bg-background/50 rounded-2xl p-5 border border-border-default/50 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-4 h-4 text-amber" />
                          <h4 className="text-sm font-bold text-white">Achievements</h4>
                        </div>
                        <p className="text-sm text-text-secondary">250+ LeetCode problems solved (Java)</p>
                      </div>

                      <div className="bg-background/50 rounded-2xl p-5 border border-border-default/50 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4 text-amber" />
                          <h4 className="text-sm font-bold text-white">Contact</h4>
                        </div>
                        <p className="text-sm text-text-secondary flex items-center gap-2"><Mail className="w-3 h-3"/> sumitsbhadoria21@gmail.com</p>
                        <p className="text-sm text-text-secondary flex items-center gap-2 mt-1"><Phone className="w-3 h-3"/> +91-89620-74730</p>
                      </div>
                    </div>
                    
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
