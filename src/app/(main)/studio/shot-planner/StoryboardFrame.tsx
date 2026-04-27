"use client";

/**
 * Programmatic SVG storyboard frame generator.
 * Creates instant visual storyboard sketches based on shot metadata
 * without any API calls — zero latency, zero rate limits.
 */

interface StoryboardFrameProps {
  shotType: string;
  cameraAngle: string;
  cameraMovement: string;
  lightingMood: string;
  description: string;
  className?: string;
}

/* Color palettes per lighting mood */
const MOOD_PALETTES: Record<string, { bg: string; fg: string; accent: string; grid: string }> = {
  WARM:        { bg: "#1a1510", fg: "#c4a66a", accent: "#e8a930", grid: "#2a2010" },
  COOL:        { bg: "#0d1520", fg: "#6a8ec4", accent: "#3090e8", grid: "#102030" },
  DRAMATIC:    { bg: "#0f0a14", fg: "#8a6ac4", accent: "#a040e8", grid: "#1a1025" },
  NATURAL:     { bg: "#121814", fg: "#7aaa6a", accent: "#40c850", grid: "#182518" },
  NEON:        { bg: "#0f0a18", fg: "#c46aaa", accent: "#e830c0", grid: "#1a1028" },
  "GOLDEN HOUR": { bg: "#1a1208", fg: "#c4966a", accent: "#e88a30", grid: "#2a1a10" },
  "BLUE HOUR": { bg: "#08101a", fg: "#6a80c4", accent: "#3070e8", grid: "#101830" },
  "HIGH KEY":  { bg: "#1a1a1a", fg: "#aaaaaa", accent: "#dddddd", grid: "#252525" },
  "LOW KEY":   { bg: "#080808", fg: "#555555", accent: "#888888", grid: "#111111" },
  CHIAROSCURO: { bg: "#0a0a0a", fg: "#7a6a50", accent: "#c4a060", grid: "#151510" },
  SILHOUETTE:  { bg: "#060810", fg: "#334", accent: "#556", grid: "#0a0c15" },
  NEUTRAL:     { bg: "#121215", fg: "#888890", accent: "#aaaabc", grid: "#1a1a20" },
};

function getPalette(mood: string) {
  const key = mood?.toUpperCase().trim() || "NEUTRAL";
  return MOOD_PALETTES[key] || MOOD_PALETTES.NEUTRAL;
}

/* Composition shapes based on shot type */
function getShotComposition(shotType: string): {
  label: string;
  frameInset: number; // percentage inset for subject area
  subjectShape: "full" | "bust" | "face" | "detail" | "environment" | "split";
  guideLine: "rule-of-thirds" | "center" | "diagonal" | "golden";
} {
  const t = shotType?.toUpperCase() || "";
  if (t.includes("EXTREME CLOSE") || t.includes("ECU"))
    return { label: "ECU", frameInset: 5, subjectShape: "detail", guideLine: "center" };
  if (t.includes("CLOSE"))
    return { label: "CU", frameInset: 15, subjectShape: "face", guideLine: "rule-of-thirds" };
  if (t.includes("MEDIUM CLOSE") || t.includes("MCU"))
    return { label: "MCU", frameInset: 20, subjectShape: "bust", guideLine: "rule-of-thirds" };
  if (t.includes("MEDIUM"))
    return { label: "MS", frameInset: 25, subjectShape: "bust", guideLine: "rule-of-thirds" };
  if (t.includes("WIDE") || t.includes("ESTABLISHING") || t.includes("MASTER"))
    return { label: "WS", frameInset: 5, subjectShape: "environment", guideLine: "rule-of-thirds" };
  if (t.includes("OVER THE SHOULDER") || t.includes("OTS"))
    return { label: "OTS", frameInset: 10, subjectShape: "split", guideLine: "rule-of-thirds" };
  if (t.includes("TWO"))
    return { label: "2-SHOT", frameInset: 15, subjectShape: "split", guideLine: "center" };
  if (t.includes("POV"))
    return { label: "POV", frameInset: 8, subjectShape: "environment", guideLine: "center" };
  if (t.includes("INSERT"))
    return { label: "INSERT", frameInset: 10, subjectShape: "detail", guideLine: "center" };
  if (t.includes("AERIAL") || t.includes("DRONE") || t.includes("BIRD"))
    return { label: "AERIAL", frameInset: 5, subjectShape: "environment", guideLine: "diagonal" };
  if (t.includes("DUTCH"))
    return { label: "DUTCH", frameInset: 15, subjectShape: "bust", guideLine: "diagonal" };
  if (t.includes("TRACKING") || t.includes("DOLLY") || t.includes("STEADICAM"))
    return { label: "TRACK", frameInset: 15, subjectShape: "full", guideLine: "golden" };
  return { label: "MS", frameInset: 20, subjectShape: "bust", guideLine: "rule-of-thirds" };
}

/* Camera angle tilt for the frame */
function getAngleTilt(angle: string): { rotation: number; perspectiveLabel: string } {
  const a = angle?.toUpperCase() || "";
  if (a.includes("LOW")) return { rotation: 0, perspectiveLabel: "↑ LOW" };
  if (a.includes("HIGH") || a.includes("BIRD")) return { rotation: 0, perspectiveLabel: "↓ HIGH" };
  if (a.includes("DUTCH")) return { rotation: 15, perspectiveLabel: "◇ DUTCH" };
  if (a.includes("WORM")) return { rotation: 0, perspectiveLabel: "⤊ WORM" };
  return { rotation: 0, perspectiveLabel: "— EYE" };
}

/* Movement arrow indicator */
function getMovementArrow(movement: string): string {
  const m = movement?.toUpperCase() || "";
  if (m.includes("PAN LEFT")) return "←";
  if (m.includes("PAN RIGHT")) return "→";
  if (m.includes("TILT UP")) return "↑";
  if (m.includes("TILT DOWN")) return "↓";
  if (m.includes("DOLLY IN") || m.includes("PUSH IN") || m.includes("ZOOM IN")) return "⊕";
  if (m.includes("DOLLY OUT") || m.includes("PULL OUT") || m.includes("ZOOM OUT")) return "⊖";
  if (m.includes("TRACKING") || m.includes("FOLLOW")) return "⟿";
  if (m.includes("CRANE UP")) return "⤒";
  if (m.includes("CRANE DOWN")) return "⤓";
  if (m.includes("STEADICAM")) return "∿";
  if (m.includes("HANDHELD")) return "≋";
  if (m.includes("WHIP")) return "⚡";
  if (m.includes("STATIC") || m.includes("NONE")) return "●";
  return "";
}

export default function StoryboardFrame({
  shotType, cameraAngle, cameraMovement, lightingMood, description, className = "",
}: StoryboardFrameProps) {
  const palette = getPalette(lightingMood);
  const comp = getShotComposition(shotType);
  const tilt = getAngleTilt(cameraAngle);
  const moveArrow = getMovementArrow(cameraMovement);
  const W = 400;
  const H = 225; // 16:9

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`w-full ${className}`} xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <rect width={W} height={H} fill={palette.bg} />

      {/* Mood gradient overlay */}
      <defs>
        <linearGradient id={`mood-${lightingMood}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.accent} stopOpacity="0.08" />
          <stop offset="100%" stopColor={palette.bg} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`spotlight-${lightingMood}`} cx="0.5" cy="0.4" r="0.6">
          <stop offset="0%" stopColor={palette.accent} stopOpacity="0.12" />
          <stop offset="100%" stopColor={palette.bg} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#mood-${lightingMood})`} />
      <rect width={W} height={H} fill={`url(#spotlight-${lightingMood})`} />

      {/* Rule of thirds grid */}
      <g opacity="0.25" stroke={palette.grid} strokeWidth="0.5" strokeDasharray="4 4">
        <line x1={W / 3} y1="0" x2={W / 3} y2={H} />
        <line x1={(2 * W) / 3} y1="0" x2={(2 * W) / 3} y2={H} />
        <line x1="0" y1={H / 3} x2={W} y2={H / 3} />
        <line x1="0" y1={(2 * H) / 3} x2={W} y2={(2 * H) / 3} />
      </g>

      {/* Subject silhouette based on shot type */}
      <g transform={`rotate(${tilt.rotation} ${W / 2} ${H / 2})`}>
        {comp.subjectShape === "face" && (
          <g opacity="0.6">
            <ellipse cx={W * 0.42} cy={H * 0.45} rx="55" ry="65" fill="none" stroke={palette.fg} strokeWidth="1.5" />
            <line x1={W * 0.42 - 15} y1={H * 0.38} x2={W * 0.42 - 5} y2={H * 0.38} stroke={palette.fg} strokeWidth="1" />
            <line x1={W * 0.42 + 5} y1={H * 0.38} x2={W * 0.42 + 15} y2={H * 0.38} stroke={palette.fg} strokeWidth="1" />
            <ellipse cx={W * 0.42} cy={H * 0.52} rx="8" ry="4" fill="none" stroke={palette.fg} strokeWidth="1" />
          </g>
        )}
        {comp.subjectShape === "bust" && (
          <g opacity="0.5">
            <ellipse cx={W * 0.38} cy={H * 0.32} rx="30" ry="35" fill="none" stroke={palette.fg} strokeWidth="1.5" />
            <path d={`M${W * 0.38 - 40} ${H * 0.7} Q${W * 0.38 - 45} ${H * 0.5} ${W * 0.38 - 28} ${H * 0.55} L${W * 0.38 + 28} ${H * 0.55} Q${W * 0.38 + 45} ${H * 0.5} ${W * 0.38 + 40} ${H * 0.7}`}
              fill="none" stroke={palette.fg} strokeWidth="1.5" />
            <line x1={W * 0.38} y1={H * 0.67} x2={W * 0.38} y2={H} stroke={palette.fg} strokeWidth="1" strokeDasharray="3 3" />
          </g>
        )}
        {comp.subjectShape === "full" && (
          <g opacity="0.45">
            <ellipse cx={W * 0.4} cy={H * 0.18} rx="18" ry="22" fill="none" stroke={palette.fg} strokeWidth="1.5" />
            <line x1={W * 0.4} y1={H * 0.4} x2={W * 0.4} y2={H * 0.7} stroke={palette.fg} strokeWidth="1.5" />
            <line x1={W * 0.4 - 25} y1={H * 0.5} x2={W * 0.4 + 25} y2={H * 0.5} stroke={palette.fg} strokeWidth="1.2" />
            <line x1={W * 0.4} y1={H * 0.7} x2={W * 0.4 - 18} y2={H * 0.95} stroke={palette.fg} strokeWidth="1.2" />
            <line x1={W * 0.4} y1={H * 0.7} x2={W * 0.4 + 18} y2={H * 0.95} stroke={palette.fg} strokeWidth="1.2" />
          </g>
        )}
        {comp.subjectShape === "environment" && (
          <g opacity="0.35">
            <path d={`M0 ${H * 0.7} L${W * 0.15} ${H * 0.5} L${W * 0.3} ${H * 0.65} L${W * 0.5} ${H * 0.35} L${W * 0.7} ${H * 0.55} L${W * 0.85} ${H * 0.4} L${W} ${H * 0.6}`}
              fill="none" stroke={palette.fg} strokeWidth="1" />
            <rect x={W * 0.6} y={H * 0.3} width="30" height="50" fill="none" stroke={palette.fg} strokeWidth="1" rx="1" />
            <rect x={W * 0.65} y={H * 0.25} width="35" height="55" fill="none" stroke={palette.fg} strokeWidth="1" rx="1" />
            <rect x={W * 0.2} y={H * 0.5} width="20" height="35" fill="none" stroke={palette.fg} strokeWidth="0.8" rx="1" />
            <line x1="0" y1={H * 0.75} x2={W} y2={H * 0.75} stroke={palette.fg} strokeWidth="0.5" strokeDasharray="2 4" />
          </g>
        )}
        {comp.subjectShape === "detail" && (
          <g opacity="0.5">
            <circle cx={W / 2} cy={H / 2} r="60" fill="none" stroke={palette.fg} strokeWidth="1.5" />
            <circle cx={W / 2} cy={H / 2} r="40" fill="none" stroke={palette.fg} strokeWidth="0.8" strokeDasharray="3 3" />
            <line x1={W / 2 - 10} y1={H / 2} x2={W / 2 + 10} y2={H / 2} stroke={palette.accent} strokeWidth="1" />
            <line x1={W / 2} y1={H / 2 - 10} x2={W / 2} y2={H / 2 + 10} stroke={palette.accent} strokeWidth="1" />
          </g>
        )}
        {comp.subjectShape === "split" && (
          <g opacity="0.45">
            <ellipse cx={W * 0.28} cy={H * 0.35} rx="25" ry="30" fill="none" stroke={palette.fg} strokeWidth="1.5" />
            <path d={`M${W * 0.28 - 30} ${H * 0.72} Q${W * 0.28 - 32} ${H * 0.55} ${W * 0.28 - 22} ${H * 0.58} L${W * 0.28 + 22} ${H * 0.58} Q${W * 0.28 + 32} ${H * 0.55} ${W * 0.28 + 30} ${H * 0.72}`}
              fill="none" stroke={palette.fg} strokeWidth="1.2" />
            <ellipse cx={W * 0.68} cy={H * 0.38} rx="22" ry="26" fill="none" stroke={palette.fg} strokeWidth="1.2" />
            <path d={`M${W * 0.68 - 26} ${H * 0.72} Q${W * 0.68 - 28} ${H * 0.56} ${W * 0.68 - 19} ${H * 0.6} L${W * 0.68 + 19} ${H * 0.6} Q${W * 0.68 + 28} ${H * 0.56} ${W * 0.68 + 26} ${H * 0.72}`}
              fill="none" stroke={palette.fg} strokeWidth="1.2" />
          </g>
        )}
      </g>

      {/* Safe area frame */}
      <rect x={comp.frameInset} y={comp.frameInset}
        width={W - comp.frameInset * 2} height={H - comp.frameInset * 2}
        fill="none" stroke={palette.fg} strokeWidth="0.5" strokeDasharray="6 3" opacity="0.2" rx="2" />

      {/* HUD: Shot type label — top left */}
      <rect x="8" y="8" width={comp.label.length * 10 + 16} height="20" rx="3" fill={palette.accent} fillOpacity="0.2" stroke={palette.accent} strokeWidth="0.5" strokeOpacity="0.5" />
      <text x="16" y="22" fill={palette.accent} fontSize="11" fontFamily="monospace" fontWeight="bold">{comp.label}</text>

      {/* HUD: Camera angle — top right */}
      <text x={W - 10} y="22" fill={palette.fg} fontSize="9" fontFamily="monospace" textAnchor="end" opacity="0.7">{tilt.perspectiveLabel}</text>

      {/* HUD: Movement indicator — bottom right */}
      {moveArrow && (
        <g>
          <circle cx={W - 22} cy={H - 22} r="14" fill={palette.bg} fillOpacity="0.6" stroke={palette.fg} strokeWidth="0.5" opacity="0.8" />
          <text x={W - 22} y={H - 17} fill={palette.accent} fontSize="14" fontFamily="monospace" textAnchor="middle">{moveArrow}</text>
        </g>
      )}

      {/* HUD: Lighting mood — bottom left */}
      <text x="10" y={H - 12} fill={palette.fg} fontSize="8" fontFamily="monospace" opacity="0.5">{lightingMood?.toUpperCase()}</text>

      {/* Film frame border */}
      <rect x="0.5" y="0.5" width={W - 1} height={H - 1} fill="none" stroke={palette.fg} strokeWidth="1" opacity="0.3" rx="2" />

      {/* Sprocket holes (film look) */}
      {[...Array(8)].map((_, i) => (
        <g key={i}>
          <rect x="2" y={8 + i * 28} width="5" height="12" rx="1.5" fill={palette.fg} fillOpacity="0.1" stroke={palette.fg} strokeWidth="0.3" strokeOpacity="0.2" />
          <rect x={W - 7} y={8 + i * 28} width="5" height="12" rx="1.5" fill={palette.fg} fillOpacity="0.1" stroke={palette.fg} strokeWidth="0.3" strokeOpacity="0.2" />
        </g>
      ))}
    </svg>
  );
}
