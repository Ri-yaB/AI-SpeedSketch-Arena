import React from 'react';

/**
 * DHSOrb — shared waiting/loading animation for Solo and Battle modes.
 * Props:
 *   text: string  (default "Game starting soon...")
 *   sub:  string  (default "Get ready to draw!")
 */
export default function DHSOrb({ text = 'Game starting soon...', sub = 'Get ready to draw!' }) {
  return (
    <div className="dhs-waiting-screen">
      <div className="dhs-orb">
        <div className="dhs-halo" />
        <svg className="dhs-mark" viewBox="-300 -300 600 600" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="dhsHaloRadial" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#00c2d4" stopOpacity="0.30" />
              <stop offset="45%"  stopColor="#4a3cd9" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#4a3cd9" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="dhsCoreRadial" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#ffffff"  stopOpacity="1" />
              <stop offset="18%"  stopColor="#bff3ff"  stopOpacity="0.92" />
              <stop offset="45%"  stopColor="#00c2d4"  stopOpacity="0.45" />
              <stop offset="100%" stopColor="#0087c8"  stopOpacity="0" />
            </radialGradient>
            <linearGradient id="dhsPetalA" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#00e1ff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0087c8" stopOpacity="0.38" />
            </linearGradient>
            <linearGradient id="dhsPetalB" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#4a3cd9" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#00c2d4" stopOpacity="0.34" />
            </linearGradient>
            <linearGradient id="dhsPetalC" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#7c5fff" stopOpacity="0.80" />
              <stop offset="100%" stopColor="#4a3cd9" stopOpacity="0.30" />
            </linearGradient>
          </defs>
          <circle className="dhs-svg-halo" cx="0" cy="0" r="285" fill="url(#dhsHaloRadial)" />
          <g className="dhs-outer-rot"><g className="dhs-outer-scale">
            <g transform="rotate(0)">  <rect fill="url(#dhsPetalA)" x="-115" y="-78" width="230" height="156" rx="78" /></g>
            <g transform="rotate(45)"> <rect fill="url(#dhsPetalB)" x="-115" y="-78" width="230" height="156" rx="78" /></g>
            <g transform="rotate(90)"> <rect fill="url(#dhsPetalC)" x="-115" y="-78" width="230" height="156" rx="78" /></g>
            <g transform="rotate(135)"><rect fill="url(#dhsPetalA)" x="-115" y="-78" width="230" height="156" rx="78" /></g>
            <g transform="rotate(180)"><rect fill="url(#dhsPetalB)" x="-115" y="-78" width="230" height="156" rx="78" /></g>
            <g transform="rotate(225)"><rect fill="url(#dhsPetalC)" x="-115" y="-78" width="230" height="156" rx="78" /></g>
            <g transform="rotate(270)"><rect fill="url(#dhsPetalA)" x="-115" y="-78" width="230" height="156" rx="78" /></g>
            <g transform="rotate(315)"><rect fill="url(#dhsPetalB)" x="-115" y="-78" width="230" height="156" rx="78" /></g>
          </g></g>
          <g className="dhs-inner-rot"><g className="dhs-inner-scale">
            <g transform="rotate(0)">  <rect fill="url(#dhsPetalC)" x="-72" y="-48" width="144" height="96" rx="48" /></g>
            <g transform="rotate(60)"> <rect fill="url(#dhsPetalA)" x="-72" y="-48" width="144" height="96" rx="48" /></g>
            <g transform="rotate(120)"><rect fill="url(#dhsPetalB)" x="-72" y="-48" width="144" height="96" rx="48" /></g>
            <g transform="rotate(180)"><rect fill="url(#dhsPetalC)" x="-72" y="-48" width="144" height="96" rx="48" /></g>
            <g transform="rotate(240)"><rect fill="url(#dhsPetalA)" x="-72" y="-48" width="144" height="96" rx="48" /></g>
            <g transform="rotate(300)"><rect fill="url(#dhsPetalB)" x="-72" y="-48" width="144" height="96" rx="48" /></g>
          </g></g>
          <circle className="dhs-core-glow" cx="0" cy="0" r="92" fill="url(#dhsCoreRadial)" />
        </svg>
      </div>
      <p className="dhs-waiting-text">{text}</p>
      <p className="dhs-waiting-sub">{sub}</p>
    </div>
  );
}
