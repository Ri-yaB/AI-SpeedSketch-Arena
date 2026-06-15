import React from 'react';

export default function AVLogo({ height = 32, className = '' }) {
  return (
    <svg
      height={height}
      viewBox="0 0 200 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="av-chart-grad" x1="0" y1="40" x2="48" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#CC0000" />
          <stop offset="50%" stopColor="#6B3FA0" />
          <stop offset="100%" stopColor="#1A56DB" />
        </linearGradient>
      </defs>

      {/* Chart line */}
      <polyline
        points="4,38 14,28 24,34 38,10"
        stroke="url(#av-chart-grad)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Arrow head */}
      <polyline
        points="30,6 40,8 38,18"
        stroke="#1A56DB"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Red dot at start */}
      <circle cx="4" cy="38" r="3" fill="#CC0000" />

      {/* "Analytics" text */}
      <text
        x="54"
        y="22"
        fontFamily="'Inter', 'Segoe UI', Arial, sans-serif"
        fontWeight="700"
        fontSize="17"
        fill="#1A56DB"
        letterSpacing="0.2"
      >
        Analytics
      </text>
      {/* "Vidhya" text */}
      <text
        x="54"
        y="42"
        fontFamily="'Inter', 'Segoe UI', Arial, sans-serif"
        fontWeight="700"
        fontSize="17"
        fill="#1A56DB"
        letterSpacing="0.2"
      >
        Vidhya
      </text>
    </svg>
  );
}
