"use client";

import { motion } from "framer-motion";

interface GradeCardProps {
  criterion: string;
  grade: string;
  explanation: string;
  delay: number;
}

const gradeColors: Record<string, { bg: string; text: string }> = {
  A: { bg: "bg-emerald-500/20 border-emerald-500/30", text: "text-emerald-400" },
  B: { bg: "bg-teal-500/20 border-teal-500/30", text: "text-teal-400" },
  C: { bg: "bg-amber-500/20 border-amber-500/30", text: "text-amber" },
  D: { bg: "bg-orange-500/20 border-orange-500/30", text: "text-orange-400" },
  F: { bg: "bg-red-500/20 border-red-500/30", text: "text-red-400" },
};

function GradeCard({ criterion, grade, explanation, delay }: GradeCardProps) {
  const normGrade = grade?.charAt(0).toUpperCase() || "C";
  const colors = gradeColors[normGrade] || gradeColors.C;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: delay,
      }}
      className="p-5 rounded-2xl bg-surface border border-white/5 hover:border-white/10 hover:-translate-y-0.5 transition-all flex flex-col justify-between group h-32"
    >
      <div className="flex justify-between items-start">
        <span className="text-sm font-medium text-text-secondary">{criterion}</span>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border font-bold text-lg ${colors.bg} ${colors.text} shadow-md`}>
          {grade}
        </div>
      </div>
      <p className="text-xs text-text-muted line-clamp-2 mt-2 leading-relaxed">{explanation}</p>
    </motion.div>
  );
}

interface CoverageGradesProps {
  grades: {
    story_structure?: string;
    story_structure_explanation?: string;
    character_development?: string;
    character_development_explanation?: string;
    dialogue?: string;
    dialogue_explanation?: string;
    pacing?: string;
    pacing_explanation?: string;
    theme_subtext?: string;
    theme_subtext_explanation?: string;
    originality?: string;
    originality_explanation?: string;
    commercial_viability?: string;
    commercial_viability_explanation?: string;
    overall?: string;
    overall_explanation?: string;
  };
}

export function CoverageGrades({ grades }: CoverageGradesProps) {
  const criteria = [
    { key: "story_structure", label: "Story Structure" },
    { key: "character_development", label: "Character Development" },
    { key: "dialogue", label: "Dialogue" },
    { key: "pacing", label: "Pacing" },
    { key: "theme_subtext", label: "Theme & Subtext" },
    { key: "originality", label: "Originality" },
    { key: "commercial_viability", label: "Commercial Viability" },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-mono tracking-[0.2em] text-amber uppercase">Coverage Grades</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {criteria.map((item, idx) => {
          const grade = (grades as any)[item.key] || "-";
          const explanation = (grades as any)[`${item.key}_explanation`] || "Analyzing...";
          return (
            <GradeCard
              key={item.key}
              criterion={item.label}
              grade={grade}
              explanation={explanation}
              delay={idx * 0.08}
            />
          );
        })}
      </div>
    </div>
  );
}
