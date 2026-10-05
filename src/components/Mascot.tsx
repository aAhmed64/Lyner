import React from 'react';
import { MascotState } from '../types/lyner';

interface MascotProps {
  state?: MascotState;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showLabel?: boolean;
}

const STATE_LABELS: Record<MascotState, string> = {
  IDLE: 'Ready',
  LISTENING: 'Listening',
  THINKING: 'Thinking',
  CURIOUS: 'Curious',
  HELPING: 'Working with you',
  EXPLAINING: 'Connecting ideas',
  CONCERNED: 'Checking conflict',
  CELEBRATING: 'Clear direction',
};

/**
 * Canonical Lyner Mascot rendered with faithful 3D soft-shaded vector gradients,
 * exact proportions, forehead indigo patch, stubby royal-blue limbs, and
 * state-specific poses/props from the visual reference sheets.
 */
export const Mascot: React.FC<MascotProps> = ({
  state = 'IDLE',
  size = 'md',
  className = '',
  showLabel = false,
}) => {
  const pixelSize = {
    sm: 52,
    md: 84,
    lg: 112,
    xl: 136,
  }[size];

  const uid = React.useId().replace(/:/g, '');

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <div className="relative flex items-center justify-center animate-float">
        <svg
          width={pixelSize}
          height={pixelSize}
          viewBox="0 0 140 130"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label={`Lyner mascot (${STATE_LABELS[state]})`}
        >
          <defs>
            {/* 3D Soft White Body Gradient with Indigo/Periwinkle Rim Shading */}
            <radialGradient
              id={`bodyGrad-${uid}`}
              cx="46%"
              cy="38%"
              r="58%"
              fx="42%"
              fy="32%"
            >
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="62%" stopColor="#F5F7FF" />
              <stop offset="86%" stopColor="#DCE3FF" />
              <stop offset="100%" stopColor="#BDC9FF" />
            </radialGradient>

            {/* Signature Forehead Soft Indigo Patch */}
            <radialGradient id={`patchGrad-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#A5B4FC" stopOpacity="0.65" />
              <stop offset="65%" stopColor="#C7D2FE" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#E0E7FF" stopOpacity="0" />
            </radialGradient>

            {/* Royal Indigo Limbs Gradient */}
            <linearGradient id={`limbGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#312E81" />
            </linearGradient>

            {/* Soft Pink Cheek Blush */}
            <radialGradient id={`blushGrad-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FDA4AF" stopOpacity="0.58" />
              <stop offset="100%" stopColor="#FDA4AF" stopOpacity="0" />
            </radialGradient>

            {/* Ground Shadow */}
            <radialGradient id={`shadowGrad-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.22" />
              <stop offset="70%" stopColor="#4F46E5" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Ground Contact Shadow */}
          <ellipse cx="70" cy="118" rx="34" ry="6" fill={`url(#shadowGrad-${uid})`} />

          {/* ==================== BACKGROUND PROPS (EXPLAINING) ==================== */}
          {state === 'EXPLAINING' && (
            <g>
              {/* Floating Blue Card Left */}
              <g transform="translate(6, 26) rotate(-14)">
                <rect
                  x="0"
                  y="0"
                  width="30"
                  height="22"
                  rx="5"
                  fill="#60A5FA"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
                <line
                  x1="6"
                  y1="8"
                  x2="22"
                  y2="8"
                  stroke="#E0F2FE"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <line
                  x1="6"
                  y1="14"
                  x2="17"
                  y2="14"
                  stroke="#E0F2FE"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </g>
              {/* Floating Violet Card Right */}
              <g transform="translate(108, 48) rotate(15)">
                <rect
                  x="0"
                  y="0"
                  width="24"
                  height="20"
                  rx="5"
                  fill="#A78BFA"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
                <line
                  x1="5"
                  y1="7"
                  x2="18"
                  y2="7"
                  stroke="#F3E8FF"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <line
                  x1="5"
                  y1="13"
                  x2="14"
                  y2="13"
                  stroke="#F3E8FF"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </g>
            </g>
          )}

          {/* ==================== FEET ==================== */}
          <ellipse
            cx="57"
            cy="108"
            rx="8.5"
            ry="7"
            transform="rotate(-8 57 108)"
            fill={`url(#limbGrad-${uid})`}
          />
          <ellipse
            cx="83"
            cy="108"
            rx="8.5"
            ry="7"
            transform="rotate(8 83 108)"
            fill={`url(#limbGrad-${uid})`}
          />

          {/* ==================== MAIN CANONICAL BODY ==================== */}
          <path
            d="M 70 25 C 97 25, 111 52, 111 78 C 111 100, 95 108, 70 108 C 45 108, 29 100, 29 78 C 29 52, 43 25, 70 25 Z"
            fill={`url(#bodyGrad-${uid})`}
          />

          {/* THINKING head tuft (matches 2nd pose on character sheet) */}
          {state === 'THINKING' && (
            <path
              d="M 74 26 C 85 16, 102 22, 100 37 C 98 46, 86 48, 77 41 Z"
              fill="#D5DEFF"
            />
          )}

          {/* Forehead Soft Indigo Patch */}
          <ellipse
            cx="57"
            cy="43"
            rx="21"
            ry="15"
            transform="rotate(-18 57 43)"
            fill={`url(#patchGrad-${uid})`}
          />

          {/* ==================== CHEEK BLUSH ==================== */}
          <ellipse cx="47" cy="76" rx="7.5" ry="4.8" fill={`url(#blushGrad-${uid})`} />
          <ellipse cx="93" cy="76" rx="7.5" ry="4.8" fill={`url(#blushGrad-${uid})`} />

          {/* ==================== EYES ==================== */}
          {state === 'CELEBRATING' || state === 'IDLE' || state === 'HELPING' || state === 'EXPLAINING' || state === 'LISTENING' ? (
            <>
              {/* Left Oval Eye */}
              <ellipse cx="56" cy="67" rx="5.2" ry="7.2" fill="#0F172A" />
              <circle cx="54.2" cy="63.8" r="2" fill="#FFFFFF" />
              {/* Right Oval Eye */}
              <ellipse cx="84" cy="67" rx="5.2" ry="7.2" fill="#0F172A" />
              <circle cx="82.2" cy="63.8" r="2" fill="#FFFFFF" />
            </>
          ) : state === 'CURIOUS' || state === 'THINKING' ? (
            <>
              {/* Slightly wider inquisitive eyes + subtle brow */}
              <path
                d="M 51 56 Q 56 53 61 56"
                stroke="#1E1B4B"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M 79 55 Q 84 51 89 55"
                stroke="#1E1B4B"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <ellipse cx="56" cy="67" rx="5" ry="6.8" fill="#0F172A" />
              <circle cx="54.5" cy="64" r="1.9" fill="#FFFFFF" />
              <ellipse cx="84" cy="67" rx="5" ry="6.8" fill="#0F172A" />
              <circle cx="82.5" cy="64" r="1.9" fill="#FFFFFF" />
            </>
          ) : (
            /* CONCERNED */
            <>
              <path
                d="M 50 57 Q 56 59 61 55"
                stroke="#1E1B4B"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M 79 55 Q 84 59 90 57"
                stroke="#1E1B4B"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <ellipse cx="56" cy="68" rx="5" ry="6.8" fill="#0F172A" />
              <circle cx="54.5" cy="65" r="1.9" fill="#FFFFFF" />
              <ellipse cx="84" cy="68" rx="5" ry="6.8" fill="#0F172A" />
              <circle cx="82.5" cy="65" r="1.9" fill="#FFFFFF" />
            </>
          )}

          {/* ==================== MOUTH ==================== */}
          {state === 'IDLE' || state === 'HELPING' || state === 'EXPLAINING' || state === 'LISTENING' ? (
            <path
              d="M 65 75 Q 70 80 75 75"
              stroke="#0F172A"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          ) : state === 'CELEBRATING' ? (
            <path
              d="M 63 73 Q 70 84 77 73 Z"
              fill="#0F172A"
            />
          ) : state === 'CURIOUS' || state === 'THINKING' ? (
            <path
              d="M 66 77 Q 70 74 74 77"
              stroke="#0F172A"
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
            />
          ) : (
            /* CONCERNED */
            <path
              d="M 65 79 Q 70 74 75 79"
              stroke="#0F172A"
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* ==================== ARMS & FOREGROUND PROPS BY STATE ==================== */}
          {state === 'IDLE' && (
            <>
              {/* Left Arm Welcoming */}
              <ellipse
                cx="31"
                cy="82"
                rx="9"
                ry="14"
                transform="rotate(-24 31 82)"
                fill={`url(#limbGrad-${uid})`}
              />
              {/* Right Arm Resting */}
              <ellipse
                cx="104"
                cy="85"
                rx="13"
                ry="8.5"
                transform="rotate(-12 104 85)"
                fill={`url(#limbGrad-${uid})`}
              />
              {/* Top-left blue attention rays */}
              <line
                x1="28"
                y1="30"
                x2="35"
                y2="36"
                stroke="#60A5FA"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <line
                x1="38"
                y1="20"
                x2="42"
                y2="29"
                stroke="#60A5FA"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </>
          )}

          {state === 'LISTENING' && (
            <>
              {/* Left Arm Raised Near Ear */}
              <ellipse
                cx="27"
                cy="68"
                rx="8.5"
                ry="14"
                transform="rotate(22 27 68)"
                fill={`url(#limbGrad-${uid})`}
              />
              {/* Right Arm Relaxed */}
              <ellipse
                cx="106"
                cy="84"
                rx="9"
                ry="13"
                transform="rotate(-15 106 84)"
                fill={`url(#limbGrad-${uid})`}
              />
              {/* Sound wave arcs */}
              <path
                d="M 15 54 Q 9 65 15 76"
                stroke="#60A5FA"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 9 48 Q 1 65 9 82"
                stroke="#7C3AED"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            </>
          )}

          {state === 'CURIOUS' && (
            <>
              {/* Left Arm Down */}
              <ellipse
                cx="29"
                cy="84"
                rx="8.5"
                ry="14"
                transform="rotate(-12 29 84)"
                fill={`url(#limbGrad-${uid})`}
              />
              {/* Right Hand on Chin */}
              <ellipse
                cx="91"
                cy="85"
                rx="8.5"
                ry="14"
                transform="rotate(28 91 85)"
                fill={`url(#limbGrad-${uid})`}
              />
              {/* Blue Rays Left */}
              <line
                x1="28"
                y1="26"
                x2="34"
                y2="33"
                stroke="#3B82F6"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <line
                x1="38"
                y1="19"
                x2="41"
                y2="28"
                stroke="#3B82F6"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Violet Question Marks Right */}
              <text
                x="96"
                y="26"
                fill="#7C3AED"
                fontSize="20"
                fontWeight="800"
                transform="rotate(12 96 26)"
              >
                ?
              </text>
              <text
                x="110"
                y="38"
                fill="#7C3AED"
                fontSize="16"
                fontWeight="800"
                transform="rotate(24 110 38)"
              >
                ?
              </text>
            </>
          )}

          {state === 'THINKING' && (
            <>
              {/* Left Hand Raised to Chin */}
              <ellipse
                cx="47"
                cy="86"
                rx="14"
                ry="8.5"
                transform="rotate(-24 47 86)"
                fill={`url(#limbGrad-${uid})`}
              />
              {/* Right Arm Down */}
              <ellipse
                cx="109"
                cy="84"
                rx="8"
                ry="13"
                transform="rotate(-8 109 84)"
                fill={`url(#limbGrad-${uid})`}
              />
              {/* Thinking Dots Above Head */}
              <circle cx="59" cy="12" r="2.8" fill="#64748B" />
              <circle cx="70" cy="12" r="2.8" fill="#64748B" />
              <circle cx="81" cy="12" r="2.8" fill="#64748B" />
            </>
          )}

          {state === 'HELPING' && (
            <>
              {/* Left Arm Supporting */}
              <ellipse
                cx="31"
                cy="78"
                rx="8.5"
                ry="13"
                transform="rotate(10 31 78)"
                fill={`url(#limbGrad-${uid})`}
              />
              {/* Dark Slate Tablet Prop (from 4th pose in reference) */}
              <path
                d="M 76 74 L 112 67 L 104 99 L 68 104 Z"
                fill="#334155"
                stroke="#475569"
                strokeWidth="1.5"
                 strokeLinejoin="round"
              />
              {/* Right Hand Holding Tablet */}
              <ellipse
                cx="103"
                cy="95"
                rx="9"
                ry="7.5"
                fill={`url(#limbGrad-${uid})`}
              />
              {/* Blue Attention Rays Top-Right */}
              <line
                x1="88"
                y1="14"
                x2="85"
                y2="23"
                stroke="#60A5FA"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <line
                x1="99"
                y1="20"
                x2="93"
                y2="27"
                stroke="#60A5FA"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </>
          )}

          {state === 'EXPLAINING' && (
            <>
              {/* Small White Note Card Held in Left Hand */}
              <g transform="translate(18, 72) rotate(-10)">
                <rect
                  x="0"
                  y="0"
                  width="25"
                  height="19"
                  rx="4"
                  fill="#F8FAFC"
                  stroke="#CBD5E1"
                  strokeWidth="1.5"
                />
                <line
                  x1="5"
                  y1="7"
                  x2="18"
                  y2="7"
                  stroke="#94A3B8"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="5"
                  y1="12"
                  x2="14"
                  y2="12"
                  stroke="#94A3B8"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
              <ellipse
                cx="39"
                cy="76"
                rx="9"
                ry="12"
                transform="rotate(20 39 76)"
                fill={`url(#limbGrad-${uid})`}
              />
              <ellipse
                cx="98"
                cy="87"
                rx="13"
                ry="8.5"
                transform="rotate(-12 98 87)"
                fill={`url(#limbGrad-${uid})`}
              />
              {/* Top Sparks */}
              <line
                x1="56"
                y1="16"
                x2="60"
                y2="22"
                stroke="#60A5FA"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <line
                x1="68"
                y1="11"
                x2="70"
                y2="20"
                stroke="#3B82F6"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <line
                x1="81"
                y1="8"
                x2="78"
                y2="20"
                stroke="#7C3AED"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </>
          )}

          {state === 'CONCERNED' && (
            <>
              {/* Arms tucked down slightly */}
              <ellipse
                cx="33"
                cy="88"
                rx="9"
                ry="14"
                transform="rotate(-28 33 88)"
                fill={`url(#limbGrad-${uid})`}
              />
              <ellipse
                cx="106"
                cy="88"
                rx="8.5"
                ry="13"
                transform="rotate(14 106 88)"
                fill={`url(#limbGrad-${uid})`}
              />
              {/* Concerned Swirl Above Right Head */}
              <path
                d="M 96 14 C 106 12, 110 18, 100 20 C 92 21, 93 26, 102 26 C 107 26, 104 31, 98 31"
                stroke="#64748B"
                strokeWidth="2.6"
                strokeLinecap="round"
                fill="none"
              />
            </>
          )}

          {state === 'CELEBRATING' && (
            <>
              {/* Left Arm */}
              <ellipse
                cx="34"
                cy="84"
                rx="12"
                ry="8.5"
                transform="rotate(-24 34 84)"
                fill={`url(#limbGrad-${uid})`}
              />
              {/* Right Arm Holding Up Checkmark Badge */}
              <ellipse
                cx="109"
                cy="64"
                rx="8"
                ry="14"
                transform="rotate(24 109 64)"
                fill={`url(#limbGrad-${uid})`}
              />
              {/* Green Checkmark Circle Badge (Exact match to 7th pose) */}
              <circle cx="115" cy="36" r="16" fill="#22C55E" />
              <path
                d="M 108 36.5 L 113 41.5 L 122.5 31.5"
                stroke="#FFFFFF"
                strokeWidth="3.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Celebration Rays */}
              <line
                x1="23"
                y1="32"
                x2="31"
                y2="37"
                stroke="#7C3AED"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <line
                x1="18"
                y1="46"
                x2="27"
                y2="48"
                stroke="#7C3AED"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <line
                x1="54"
                y1="14"
                x2="56"
                y2="23"
                stroke="#F59E0B"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </>
          )}
        </svg>
      </div>
      {showLabel && (
        <span className="mt-1 text-xs font-medium text-slate-500">
          {STATE_LABELS[state]}
        </span>
      )}
    </div>
  );
};
