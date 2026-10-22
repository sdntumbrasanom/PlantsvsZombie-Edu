import React from 'react';

// Pea projectile sprite (normal green)
export const PeaSprite: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={`drop-shadow-sm ${className}`}>
    <defs>
      <radialGradient id="peaGrad" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#86EFAC" />
        <stop offset="60%" stopColor="#22C55E" />
        <stop offset="100%" stopColor="#15803D" />
      </radialGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#peaGrad)" stroke="#166534" strokeWidth="1.5" />
    <circle cx="9" cy="9" r="2.5" fill="#DCFCE7" opacity="0.8" />
  </svg>
);

// Ice Pea projectile sprite (frosty cyan)
export const IcePeaSprite: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={`drop-shadow-md ${className}`}>
    <defs>
      <radialGradient id="icePeaGrad" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#E0F2FE" />
        <stop offset="50%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0284C7" />
      </radialGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#icePeaGrad)" stroke="#0369A1" strokeWidth="1.5" />
    <polygon points="12,3 14,8 19,8 15,11 17,16 12,13 7,16 9,11 5,8 10,8" fill="#BAE6FD" opacity="0.75" />
    <circle cx="8" cy="8" r="2.5" fill="#FFFFFF" opacity="0.9" />
  </svg>
);

// Radiant Sun Sprite
export const SunSprite: React.FC<{ size?: number; className?: string }> = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={`select-none ${className}`}>
    <defs>
      <radialGradient id="sunGrad" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="50%" stopColor="#FACC15" />
        <stop offset="100%" stopColor="#EA580C" />
      </radialGradient>
      <filter id="sunGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    {/* Sun Ray Petals */}
    <g className="animate-spin" style={{ transformOrigin: '32px 32px', animationDuration: '12s' }}>
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
        <path
          key={deg}
          d="M 32 6 L 36 20 L 28 20 Z"
          fill="#FDE047"
          stroke="#CA8A04"
          strokeWidth="1"
          transform={`rotate(${deg} 32 32)`}
        />
      ))}
    </g>
    {/* Sun Center Core */}
    <circle cx="32" cy="32" r="17" fill="url(#sunGrad)" stroke="#CA8A04" strokeWidth="2" filter="url(#sunGlow)" />
    {/* Friendly Face */}
    <circle cx="26" cy="29" r="2.5" fill="#451A03" />
    <circle cx="38" cy="29" r="2.5" fill="#451A03" />
    <path d="M 27 36 Q 32 41 37 36" fill="none" stroke="#451A03" strokeWidth="2" strokeLinecap="round" />
    <circle cx="24" cy="33" r="1.5" fill="#F87171" opacity="0.7" />
    <circle cx="40" cy="33" r="1.5" fill="#F87171" opacity="0.7" />
  </svg>
);

// Sunflower Plant Sprite
export const SunflowerSprite: React.FC<{ size?: number; isBoosted?: boolean }> = ({ size = 64, isBoosted = false }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className="overflow-visible select-none">
    <defs>
      <radialGradient id="sfFace" cx="45%" cy="45%" r="55%">
        <stop offset="0%" stopColor="#78350F" />
        <stop offset="80%" stopColor="#451A03" />
        <stop offset="100%" stopColor="#291202" />
      </radialGradient>
      <radialGradient id="sfPetal" cx="40%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="60%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#D97706" />
      </radialGradient>
    </defs>
    {/* Leaves & Stem at bottom */}
    <path d="M 32 40 Q 32 56 32 60" stroke="#15803D" strokeWidth="6" strokeLinecap="round" fill="none" />
    <path d="M 32 54 Q 18 48 14 54 Q 22 62 32 58" fill="#22C55E" stroke="#15803D" strokeWidth="1.5" />
    <path d="M 32 52 Q 46 46 50 52 Q 42 60 32 56" fill="#22C55E" stroke="#15803D" strokeWidth="1.5" />

    {/* Radiant Petals group */}
    <g className="animate-pulse" style={{ transformOrigin: '32px 30px', animationDuration: isBoosted ? '0.8s' : '2.5s' }}>
      {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg) => (
        <ellipse
          key={deg}
          cx="32"
          cy="12"
          rx="5"
          ry="9"
          fill="url(#sfPetal)"
          stroke="#B45309"
          strokeWidth="1.2"
          transform={`rotate(${deg} 32 30)`}
        />
      ))}
    </g>

    {/* Big Brown Sunflower Center */}
    <circle cx="32" cy="30" r="14" fill="url(#sfFace)" stroke="#78350F" strokeWidth="2" />

    {/* Cute Big Eyes */}
    <ellipse cx="27" cy="27" rx="2.5" ry="3.5" fill="#FFFFFF" />
    <ellipse cx="37" cy="27" rx="2.5" ry="3.5" fill="#FFFFFF" />
    <ellipse cx="28" cy="27" rx="1.5" ry="2" fill="#18181B" />
    <ellipse cx="38" cy="27" rx="1.5" ry="2" fill="#18181B" />
    <circle cx="28.5" cy="26" r="0.7" fill="#FFFFFF" />
    <circle cx="38.5" cy="26" r="0.7" fill="#FFFFFF" />

    {/* Cheerful Smile */}
    <path d="M 28 34 Q 32 38 36 34" fill="none" stroke="#FEF08A" strokeWidth="1.8" strokeLinecap="round" />
    {/* Rosy Cheeks */}
    <circle cx="25" cy="33" r="1.8" fill="#FB923C" opacity="0.8" />
    <circle cx="39" cy="33" r="1.8" fill="#FB923C" opacity="0.8" />
  </svg>
);

// Peashooter Plant Sprite
export const PeashooterSprite: React.FC<{ size?: number; isShooting?: boolean; isBoosted?: boolean }> = ({ size = 64, isShooting = false }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className="overflow-visible select-none">
    <defs>
      <radialGradient id="psHeadGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#86EFAC" />
        <stop offset="60%" stopColor="#22C55E" />
        <stop offset="100%" stopColor="#15803D" />
      </radialGradient>
    </defs>
    {/* Base Leaves on ground */}
    <ellipse cx="32" cy="58" rx="16" ry="4" fill="#14532D" opacity="0.4" />
    <path d="M 24 58 Q 12 50 18 44 Q 28 48 26 56" fill="#16A34A" stroke="#15803D" strokeWidth="1.5" />
    <path d="M 38 58 Q 50 50 44 44 Q 36 48 38 56" fill="#16A34A" stroke="#15803D" strokeWidth="1.5" />

    {/* Stem curving up */}
    <path d="M 30 56 Q 26 42 32 32" stroke="#15803D" strokeWidth="5.5" strokeLinecap="round" fill="none" />
    {/* Small leaf on stem */}
    <path d="M 29 44 Q 18 42 22 36 Q 30 38 29 44" fill="#22C55E" stroke="#15803D" strokeWidth="1.2" />

    {/* Head & Snout */}
    <g className={isShooting ? 'animate-bounce' : ''} style={{ transformOrigin: '32px 28px' }}>
      {/* Back leaf ponytail */}
      <path d="M 24 24 Q 14 18 10 24 Q 16 30 24 28" fill="#16A34A" stroke="#15803D" strokeWidth="1.5" />

      {/* Main Round Head */}
      <circle cx="32" cy="26" r="13" fill="url(#psHeadGrad)" stroke="#166534" strokeWidth="2" />

      {/* Snout / Barrel pointing right */}
      <ellipse cx="44" cy="26" rx="6" ry="7" fill="url(#psHeadGrad)" stroke="#166534" strokeWidth="2" />
      <ellipse cx="45" cy="26" rx="3.5" ry="5.5" fill="#14532D" />

      {/* Big cartoon eye */}
      <circle cx="35" cy="21" r="4" fill="#FFFFFF" stroke="#166534" strokeWidth="1" />
      <circle cx="36.5" cy="21" r="2.2" fill="#0F172A" />
      <circle cx="37" cy="20" r="0.8" fill="#FFFFFF" />
    </g>
  </svg>
);

// Snow Pea Plant Sprite (Ice shooter)
export const SnowPeaSprite: React.FC<{ size?: number; isShooting?: boolean }> = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className="overflow-visible select-none">
    <defs>
      <radialGradient id="snowHeadGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#BAE6FD" />
        <stop offset="60%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0284C7" />
      </radialGradient>
    </defs>
    {/* Base Leaves */}
    <ellipse cx="32" cy="58" rx="16" ry="4" fill="#0C4A6E" opacity="0.3" />
    <path d="M 24 58 Q 12 50 18 44 Q 28 48 26 56" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.5" />
    <path d="M 38 58 Q 50 50 44 44 Q 36 48 38 56" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.5" />

    {/* Stem */}
    <path d="M 30 56 Q 26 42 32 32" stroke="#0284C7" strokeWidth="5.5" strokeLinecap="round" fill="none" />

    {/* Frost Spikes on back of head */}
    <polygon points="20,20 12,12 18,24" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.2" />
    <polygon points="22,14 18,4 26,16" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1.2" />
    <polygon points="18,26 8,24 16,32" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.2" />

    {/* Head & Snout */}
    <circle cx="32" cy="26" r="13" fill="url(#snowHeadGrad)" stroke="#0369A1" strokeWidth="2" />
    <ellipse cx="44" cy="26" rx="6" ry="7" fill="url(#snowHeadGrad)" stroke="#0369A1" strokeWidth="2" />
    <ellipse cx="45" cy="26" rx="3.5" ry="5.5" fill="#082F49" />

    {/* Eye */}
    <circle cx="35" cy="21" r="4" fill="#FFFFFF" stroke="#0369A1" strokeWidth="1" />
    <circle cx="36.5" cy="21" r="2.2" fill="#0F172A" />
    <circle cx="37" cy="20" r="0.8" fill="#FFFFFF" />
  </svg>
);

// Wall-nut Plant Sprite (Defensive shield with HP cracking)
export const WallnutSprite: React.FC<{ size?: number; hpPercent?: number }> = ({ size = 64, hpPercent = 100 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className="overflow-visible select-none">
    <defs>
      <radialGradient id="nutGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#D97706" />
        <stop offset="60%" stopColor="#92400E" />
        <stop offset="100%" stopColor="#451A03" />
      </radialGradient>
    </defs>
    <ellipse cx="32" cy="58" rx="15" ry="4" fill="#291202" opacity="0.35" />

    {/* Nut body */}
    <path
      d="M 32 8 C 46 8 50 20 49 38 C 48 52 42 58 32 58 C 22 58 16 52 15 38 C 14 20 18 8 32 8 Z"
      fill="url(#nutGrad)"
      stroke="#451A03"
      strokeWidth="2.5"
    />

    {/* Large friendly eyes */}
    <ellipse cx="26" cy="28" rx="4.5" ry="6" fill="#FFFFFF" stroke="#451A03" strokeWidth="1.2" />
    <ellipse cx="38" cy="28" rx="4.5" ry="6" fill="#FFFFFF" stroke="#451A03" strokeWidth="1.2" />
    <circle cx="28" cy="29" r="2.8" fill="#18181B" />
    <circle cx="40" cy="29" r="2.8" fill="#18181B" />
    <circle cx="29" cy="27.5" r="1" fill="#FFFFFF" />
    <circle cx="41" cy="27.5" r="1" fill="#FFFFFF" />

    {/* Smile or Worried expression depending on HP */}
    {hpPercent > 50 ? (
      <path d="M 27 42 Q 32 46 37 42" fill="none" stroke="#FEF3C7" strokeWidth="2" strokeLinecap="round" />
    ) : (
      <path d="M 27 45 Q 32 40 37 45" fill="none" stroke="#FEF3C7" strokeWidth="2" strokeLinecap="round" />
    )}

    {/* Crack lines if damaged */}
    {hpPercent <= 66 && (
      <path d="M 44 18 L 38 24 L 42 32" stroke="#451A03" strokeWidth="2" strokeLinecap="round" fill="none" />
    )}
    {hpPercent <= 33 && (
      <path d="M 18 32 L 22 38 L 19 46" stroke="#451A03" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    )}
  </svg>
);

// Repeater Plant Sprite (Two shoots)
export const RepeaterSprite: React.FC<{ size?: number }> = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className="overflow-visible select-none">
    <defs>
      <radialGradient id="repHeadGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#86EFAC" />
        <stop offset="60%" stopColor="#16A34A" />
        <stop offset="100%" stopColor="#14532D" />
      </radialGradient>
    </defs>
    <ellipse cx="32" cy="58" rx="16" ry="4" fill="#14532D" opacity="0.4" />
    <path d="M 24 58 Q 12 50 18 44 Q 28 48 26 56" fill="#16A34A" stroke="#15803D" strokeWidth="1.5" />
    <path d="M 38 58 Q 50 50 44 44 Q 36 48 38 56" fill="#16A34A" stroke="#15803D" strokeWidth="1.5" />

    {/* Stem */}
    <path d="M 30 56 Q 26 42 32 32" stroke="#15803D" strokeWidth="5.5" strokeLinecap="round" fill="none" />

    {/* Double Leaf Brow / Helmet */}
    <path d="M 22 18 Q 30 14 36 12 Q 42 16 36 20 Q 28 20 22 18" fill="#15803D" stroke="#052E16" strokeWidth="1.5" />

    {/* Head & Double Barrel */}
    <circle cx="30" cy="27" r="13" fill="url(#repHeadGrad)" stroke="#166534" strokeWidth="2" />
    <ellipse cx="44" cy="24" rx="5.5" ry="6" fill="url(#repHeadGrad)" stroke="#166534" strokeWidth="1.8" />
    <ellipse cx="45" cy="24" rx="3" ry="4.5" fill="#052E16" />
    <ellipse cx="42" cy="34" rx="5" ry="5.5" fill="url(#repHeadGrad)" stroke="#166534" strokeWidth="1.8" />
    <ellipse cx="43" cy="34" rx="2.8" ry="4" fill="#052E16" />

    {/* Determined Eye */}
    <circle cx="33" cy="21" r="4" fill="#FFFFFF" stroke="#166534" strokeWidth="1" />
    <circle cx="34.5" cy="21" r="2.2" fill="#0F172A" />
  </svg>
);

// Cherry Bomb Plant Sprite
export const CherryBombSprite: React.FC<{ size?: number; isExploding?: boolean }> = ({ size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className="overflow-visible select-none">
    <defs>
      <radialGradient id="cherryGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#F87171" />
        <stop offset="60%" stopColor="#DC2626" />
        <stop offset="100%" stopColor="#7F1D1D" />
      </radialGradient>
    </defs>
    {/* Stems connecting at top */}
    <path d="M 24 34 Q 28 14 36 10" stroke="#15803D" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M 44 38 Q 40 18 36 10" stroke="#15803D" strokeWidth="3" fill="none" strokeLinecap="round" />

    {/* Sparking Fuse */}
    <circle cx="36" cy="10" r="4" fill="#FACC15" className="animate-ping" />
    <circle cx="36" cy="10" r="2" fill="#EA580C" />

    {/* Left Angry Cherry */}
    <g transform="translate(0, 0)">
      <circle cx="24" cy="40" r="12" fill="url(#cherryGrad)" stroke="#7F1D1D" strokeWidth="1.8" />
      <ellipse cx="20" cy="38" rx="2" ry="2.5" fill="#FEF2F2" />
      <circle cx="21" cy="38" r="1.3" fill="#18181B" />
      <ellipse cx="28" cy="38" rx="2" ry="2.5" fill="#FEF2F2" />
      <circle cx="27" cy="38" r="1.3" fill="#18181B" />
      <path d="M 21 44 Q 24 41 27 44" stroke="#450A0A" strokeWidth="1.5" fill="none" />
    </g>

    {/* Right Angry Cherry */}
    <g transform="translate(0, 0)">
      <circle cx="44" cy="42" r="12" fill="url(#cherryGrad)" stroke="#7F1D1D" strokeWidth="1.8" />
      <ellipse cx="41" cy="40" rx="2" ry="2.5" fill="#FEF2F2" />
      <circle cx="42" cy="40" r="1.3" fill="#18181B" />
      <ellipse cx="48" cy="40" rx="2" ry="2.5" fill="#FEF2F2" />
      <circle cx="47" cy="40" r="1.3" fill="#18181B" />
      <path d="M 42 46 Q 45 43 48 46" stroke="#450A0A" strokeWidth="1.5" fill="none" />
    </g>
  </svg>
);

// Potato Mine Plant Sprite
export const PotatoMineSprite: React.FC<{ size?: number; isArmed?: boolean }> = ({ size = 64, isArmed = true }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className="overflow-visible select-none">
    <defs>
      <radialGradient id="potatoGrad" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#D97706" />
        <stop offset="70%" stopColor="#B45309" />
        <stop offset="100%" stopColor="#78350F" />
      </radialGradient>
    </defs>
    {/* Dirt mound */}
    <ellipse cx="32" cy="54" rx="20" ry="6" fill="#713F12" stroke="#451A03" strokeWidth="1.5" />
    <circle cx="20" cy="55" r="2.5" fill="#54300E" />
    <circle cx="42" cy="53" r="2" fill="#54300E" />

    {/* Potato head sticking out */}
    <path
      d={isArmed 
        ? "M 20 52 C 18 36 24 30 32 30 C 40 30 46 36 44 52 Z"
        : "M 22 52 C 20 44 26 42 32 42 C 38 42 44 44 42 52 Z"
      }
      fill="url(#potatoGrad)"
      stroke="#78350F"
      strokeWidth="2"
    />

    {/* Blinking Antenna */}
    <line x1="32" y1={isArmed ? "30" : "42"} x2="32" y2={isArmed ? "16" : "28"} stroke="#451A03" strokeWidth="2.5" />
    <circle
      cx="32"
      cy={isArmed ? "15" : "27"}
      r="4"
      fill={isArmed ? "#EF4444" : "#9CA3AF"}
      className={isArmed ? "animate-ping" : ""}
    />
    <circle
      cx="32"
      cy={isArmed ? "15" : "27"}
      r="3"
      fill={isArmed ? "#EF4444" : "#6B7280"}
    />

    {/* Cute eyes */}
    {isArmed && (
      <>
        <circle cx="28" cy="40" r="2.5" fill="#FFFFFF" />
        <circle cx="36" cy="40" r="2.5" fill="#FFFFFF" />
        <circle cx="28.5" cy="40" r="1.3" fill="#18181B" />
        <circle cx="36.5" cy="40" r="1.3" fill="#18181B" />
      </>
    )}
  </svg>
);

// Zombie Sprite with armor accessories (Cone, Bucket, Flag)
export const ZombieSprite: React.FC<{
  size?: number;
  type?: 'regular' | 'conehead' | 'buckethead' | 'flag' | 'speedy';
  isFrozen?: boolean;
  isHit?: boolean;
  walkCycle?: number;
}> = ({ size = 72, type = 'regular', isFrozen = false, isHit = false, walkCycle = 0 }) => {
  const legOffset = Math.sin(walkCycle * 0.1) * 4;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={`overflow-visible select-none ${isHit ? 'brightness-150 contrast-125' : ''}`}
      style={{ filter: isFrozen ? 'hue-rotate(180deg) saturate(1.8)' : undefined }}
    >
      <defs>
        <radialGradient id="zombieSkin" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#A3E635" />
          <stop offset="70%" stopColor="#65A30D" />
          <stop offset="100%" stopColor="#3F6212" />
        </radialGradient>
      </defs>

      {/* Shadow */}
      <ellipse cx="32" cy="60" rx="14" ry="3.5" fill="#000000" opacity="0.3" />

      {/* Legs (Animated walk) */}
      <line x1="28" y1="46" x2={26 - legOffset} y2="58" stroke="#1E293B" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="36" y1="46" x2={38 + legOffset} y2="58" stroke="#1E293B" strokeWidth="4.5" strokeLinecap="round" />
      {/* Brown Shoes */}
      <ellipse cx={24 - legOffset} cy="58" rx="4" ry="2" fill="#78350F" />
      <ellipse cx={39 + legOffset} cy="58" rx="4" ry="2" fill="#78350F" />

      {/* Body / Ragged Suit Coat */}
      <path d="M 24 28 L 40 28 L 42 46 L 22 46 Z" fill="#64748B" stroke="#334155" strokeWidth="1.5" />
      {/* Red / Orange Tie */}
      <polygon points="32,28 34,38 32,42 30,38" fill="#EF4444" />

      {/* Arms stretched left (toward plants) */}
      <path d="M 25 32 L 10 32 L 6 35" stroke="url(#zombieSkin)" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* Dirty Hand fingers */}
      <circle cx="5" cy="35" r="2.2" fill="#4D7C0F" />

      {/* Head */}
      <ellipse cx="34" cy="20" rx="10" ry="11" fill="url(#zombieSkin)" stroke="#365314" strokeWidth="1.8" />

      {/* Goofy Zombie Eyes (one big, one small) */}
      <circle cx="30" cy="18" r="3.8" fill="#FEF08A" stroke="#365314" strokeWidth="1" />
      <circle cx="29" cy="18" r="1.5" fill="#18181B" />
      <circle cx="38" cy="19" r="2.5" fill="#FEF08A" stroke="#365314" strokeWidth="1" />
      <circle cx="38" cy="19" r="1.2" fill="#18181B" />

      {/* Zombie mouth with ragged tooth */}
      <path d="M 28 26 Q 34 29 38 25" stroke="#1C1917" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="31" y="25" width="2" height="2.5" fill="#FEF3C7" />

      {/* Hair strands */}
      <path d="M 30 9 Q 28 4 25 6" stroke="#44403C" strokeWidth="1.5" fill="none" />
      <path d="M 35 9 Q 36 3 39 5" stroke="#44403C" strokeWidth="1.5" fill="none" />

      {/* Headwear / Armor Accessories */}
      {type === 'conehead' && (
        <g transform="translate(0, -6)">
          <polygon points="34,2 25,18 43,18" fill="#F97316" stroke="#C2410C" strokeWidth="1.5" />
          {/* Reflective white stripe on cone */}
          <polygon points="34,8 29,14 39,14" fill="#FFFFFF" opacity="0.9" />
          <ellipse cx="34" cy="18" rx="9" ry="2.5" fill="#EA580C" />
        </g>
      )}

      {type === 'buckethead' && (
        <g transform="translate(0, -4)">
          <path d="M 24 16 L 26 5 L 42 5 L 44 16 Z" fill="#94A3B8" stroke="#475569" strokeWidth="2" />
          <ellipse cx="34" cy="5" rx="8" ry="2" fill="#CBD5E1" stroke="#475569" strokeWidth="1" />
          <ellipse cx="34" cy="16" rx="10" ry="2.5" fill="#64748B" />
          {/* Handle */}
          <path d="M 24 16 Q 34 22 44 16" stroke="#475569" strokeWidth="1.5" fill="none" />
        </g>
      )}

      {type === 'flag' && (
        <g transform="translate(8, -8)">
          <line x1="28" y1="50" x2="28" y2="4" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="28,4 12,12 28,20" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5" />
          {/* Brain symbol on flag */}
          <circle cx="21" cy="12" r="3" fill="#F472B6" />
        </g>
      )}

      {type === 'speedy' && (
        <g transform="translate(0, -2)">
          {/* Red athletic headband */}
          <path d="M 24 13 L 44 13" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
};

// Lawnmower Sprite
export const LawnmowerSprite: React.FC<{ size?: number; isSpinning?: boolean }> = ({ size = 52, isSpinning = false }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className="overflow-visible select-none">
    {/* Shadow */}
    <ellipse cx="32" cy="54" rx="18" ry="4" fill="#000000" opacity="0.3" />

    {/* Wheels */}
    <circle cx="20" cy="50" r="7" fill="#18181B" stroke="#71717A" strokeWidth="2" />
    <circle cx="20" cy="50" r="3" fill="#A1A1AA" />
    <circle cx="44" cy="50" r="7" fill="#18181B" stroke="#71717A" strokeWidth="2" />
    <circle cx="44" cy="50" r="3" fill="#A1A1AA" />

    {/* Red Body casing */}
    <path d="M 14 46 L 50 46 L 46 34 L 18 34 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="2" />

    {/* Engine motor center */}
    <rect x="24" y="24" width="16" height="12" rx="2" fill="#475569" stroke="#1E293B" strokeWidth="1.5" />

    {/* Handlebar */}
    <line x1="18" y1="36" x2="6" y2="16" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
    <line x1="4" y1="16" x2="10" y2="16" stroke="#18181B" strokeWidth="4" strokeLinecap="round" />

    {/* Spinning blade in front */}
    <circle
      cx="52"
      cy="44"
      r="6"
      fill="#E2E8F0"
      stroke="#64748B"
      strokeWidth="1.5"
      className={isSpinning ? "animate-spin" : ""}
      style={{ transformOrigin: '52px 44px' }}
    />
  </svg>
);
