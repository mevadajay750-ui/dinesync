"use client";

import { motion, useReducedMotion } from "framer-motion";

const ACCENT = "#0EA5A4";
const NAVY = "#0f172a";
const NAVY_MID = "#1e293b";
const MUTED = "#94a3b8";
const WHITE = "#ffffff";

export function AuthIllustration() {
  const prefersReducedMotion = useReducedMotion();
  const noInfinite = Boolean(prefersReducedMotion);

  return (
    <div
      className="hidden w-full max-w-[480px] shrink-0 items-center justify-center md:flex"
      aria-hidden
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 360 200"
        className="h-auto w-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <defs>
          <linearGradient id="deviceHeader" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={NAVY_MID} />
            <stop offset="100%" stopColor={NAVY} />
          </linearGradient>
          <linearGradient id="blob" x1="30%" y1="20%" x2="70%" y2="80%">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.12" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0.04" />
          </linearGradient>
          <filter id="cardShadow" x="-25%" y="-15%" width="150%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor={NAVY} floodOpacity="0.2" />
          </filter>
          <filter id="dotShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor={ACCENT} floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Soft background blob */}
        <ellipse cx="180" cy="100" rx="140" ry="75" fill="url(#blob)" />

        {/* Sync rings — emanate from center (around device) */}
        <g transform="translate(180, 88)">
          <motion.circle
            cx="0"
            cy="0"
            r="52"
            fill="none"
            stroke={ACCENT}
            strokeWidth="1.2"
            opacity={0.35}
            animate={noInfinite ? undefined : { scale: [1, 1.15, 1], opacity: [0.35, 0.1, 0.35] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.circle
            cx="0"
            cy="0"
            r="38"
            fill="none"
            stroke={ACCENT}
            strokeWidth="1"
            opacity={0.4}
            animate={noInfinite ? undefined : { scale: [1, 1.2, 1], opacity: [0.4, 0.08, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
          />
        </g>

        {/* Hero device — single tablet in center */}
        <g filter="url(#cardShadow)" transform="translate(135, 42)">
          <rect x="0" y="0" width="90" height="92" rx="16" fill={WHITE} />
          <rect x="0" y="0" width="90" height="28" rx="16" fill="url(#deviceHeader)" />
          <rect x="0" y="0" width="90" height="28" rx="16" fill="none" stroke={NAVY} strokeWidth="0.5" strokeOpacity="0.2" />
          {/* Header */}
          <rect x="12" y="9" width="32" height="4" rx="2" fill={WHITE} opacity={0.9} />
          <circle cx="74" cy="14" r="2.5" fill={ACCENT} filter="url(#dotShadow)" />
          {/* List */}
          <rect x="12" y="38" width="58" height="5" rx="2.5" fill={MUTED} opacity={0.6} />
          <rect x="12" y="48" width="48" height="5" rx="2.5" fill={MUTED} opacity={0.45} />
          <rect x="12" y="58" width="52" height="5" rx="2.5" fill={MUTED} opacity={0.35} />
          {/* Checkbox + check on first row */}
          <rect x="12" y="36" width="16" height="9" rx="4.5" fill={WHITE} stroke={ACCENT} strokeWidth="1.2" />
          <path d="M 15.5 40.5 L 17.5 42.5 L 21 38.5" fill="none" stroke={ACCENT} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          {/* Synced pill */}
          <rect x="12" y="72" width="42" height="12" rx="6" fill={ACCENT} opacity={0.12} />
          <circle cx="20" cy="78" r="2" fill={ACCENT} />
          <rect x="26" y="76" width="22" height="4" rx="2" fill={NAVY} opacity={0.4} />
        </g>

        {/* Small “nodes” — Kitchen / Floor — connected by thin lines for “sync” story */}
        <g stroke={ACCENT} strokeWidth="1" fill="none" opacity={0.7}>
          <path d="M 95 95 Q 130 75 135 88" strokeDasharray="3 3" opacity={0.5} />
          <path d="M 265 88 Q 270 75 265 95" strokeDasharray="3 3" opacity={0.5} />
        </g>
        <g transform="translate(82, 92)">
          <circle r="14" fill={WHITE} opacity={0.95} />
          <circle r="14" fill="none" stroke={ACCENT} strokeWidth="1" opacity={0.4} />
          <path d="M -4 0 L 0 4 L 4 -2" fill="none" stroke={ACCENT} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <g transform="translate(278, 92)">
          <circle r="14" fill={WHITE} opacity={0.95} />
          <circle r="14" fill="none" stroke={ACCENT} strokeWidth="1" opacity={0.4} />
          <rect x="-3" y="-4" width="6" height="8" rx="1" fill={ACCENT} opacity={0.6} />
        </g>

        {/* Ground line — minimal “counter” */}
        <ellipse cx="180" cy="178" rx="120" ry="8" fill={NAVY} opacity={0.06} />

        {/* Floating orbs */}
        <motion.circle
          cx="55"
          cy="50"
          r="5"
          fill={ACCENT}
          opacity={0.4}
          animate={noInfinite ? undefined : { y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="305"
          cy="45"
          r="4"
          fill={ACCENT}
          opacity={0.35}
          animate={noInfinite ? undefined : { y: [0, -5, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.circle
          cx="320"
          cy="155"
          r="4"
          fill={WHITE}
          opacity={0.25}
          animate={noInfinite ? undefined : { y: [0, -5, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
        />
      </motion.svg>
    </div>
  );
}
