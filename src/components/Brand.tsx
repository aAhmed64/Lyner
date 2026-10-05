import React from 'react';

interface BrandProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Canonical Y-shaped connected-node mark from the Lyner brand identity.
 * Meaning: connect people + connect ideas + bring everyone into the same project.
 */
export const LynerMark: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      {/* Connecting struts */}
      <line
        x1="25"
        y1="27"
        x2="50"
        y2="51"
        stroke="#3368FF"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <line
        x1="75"
        y1="27"
        x2="50"
        y2="51"
        stroke="#5E47F5"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <line
        x1="50"
        y1="51"
        x2="50"
        y2="78"
        stroke="#2C58F5"
        strokeWidth="21"
        strokeLinecap="round"
      />

      {/* Top-Left Node (Soft Blue) */}
      <circle cx="25" cy="27" r="17.5" fill="#2A7FFF" />

      {/* Top-Right Node (AI Violet) */}
      <circle cx="75" cy="27" r="17.5" fill="#9554FF" />

      {/* Bottom Node (Blue) */}
      <circle cx="50" cy="78" r="16.5" fill="#2B74FF" />

      {/* Central Hub Node (Primary Indigo) */}
      <circle cx="50" cy="50" r="16.5" fill="#3127DC" />
    </svg>
  );
};

/**
 * Canonical LYNER Wordmark where the Y is the connected-node logo mark.
 */
export const LynerWordmark: React.FC<BrandProps> = ({
  size = 'md',
  className = '',
}) => {
  const dimensions = {
    sm: { mark: 22, text: 'text-xl', gap: 'gap-0.5' },
    md: { mark: 28, text: 'text-2xl', gap: 'gap-0.5' },
    lg: { mark: 36, text: 'text-3xl', gap: 'gap-1' },
  }[size];

  return (
    <div
      className={`inline-flex items-center font-extrabold tracking-tight text-[#0A0E24] select-none ${dimensions.gap} ${className}`}
      aria-label="LYNER"
    >
      <span className={`${dimensions.text} leading-none font-black`}>L</span>
      <LynerMark size={dimensions.mark} className="-mx-0.5" />
      <span className={`${dimensions.text} leading-none font-black tracking-tight`}>
        NER
      </span>
    </div>
  );
};
