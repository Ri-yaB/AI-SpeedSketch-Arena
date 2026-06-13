import React from 'react';
import DHSLogo from './DHSLogo.jsx';

// Same floating doodles as the lobby
const DOODLES = [
  { id: 1,  x: 6,  y: 10, size: 52, delay: 0,   dur: 9,  rotate: 15,  svg: <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M25 5 L28 20 L43 20 L31 29 L35 44 L25 35 L15 44 L19 29 L7 20 L22 20 Z" stroke="#4F8EF7" strokeWidth="2" strokeLinejoin="round" fill="none"/></svg> },
  { id: 2,  x: 88, y: 7,  size: 44, delay: 1.2, dur: 7,  rotate: -10, svg: <svg viewBox="0 0 50 50" fill="none"><circle cx="25" cy="25" r="18" stroke="#38BDF8" strokeWidth="2.5"/><path d="M17 17 L33 33 M33 17 L17 33" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round"/></svg> },
  { id: 3,  x: 80, y: 52, size: 70, delay: 0.5, dur: 11, rotate: 20,  svg: <svg viewBox="0 0 80 30" fill="none"><path d="M4 15 C12 5, 20 25, 28 15 C36 5, 44 25, 52 15 C60 5, 68 25, 76 15" stroke="#4F8EF7" strokeWidth="2.5" strokeLinecap="round" fill="none"/></svg> },
  { id: 4,  x: 4,  y: 65, size: 56, delay: 2,   dur: 8,  rotate: -25, svg: <svg viewBox="0 0 30 80" fill="none"><rect x="10" y="5" width="10" height="55" rx="2" stroke="#38BDF8" strokeWidth="2"/><polygon points="10,60 20,60 15,75" stroke="#38BDF8" strokeWidth="2" strokeLinejoin="round" fill="none"/><line x1="10" y1="13" x2="20" y2="13" stroke="#38BDF8" strokeWidth="2"/></svg> },
  { id: 5,  x: 75, y: 78, size: 55, delay: 3,   dur: 10, rotate: 5,   svg: <svg viewBox="0 0 50 50" fill="none"><path d="M25 25 C25 20, 30 15, 35 20 C40 25, 35 35, 25 35 C15 35, 10 25, 15 18 C20 11, 30 10, 37 16" stroke="#4F8EF7" strokeWidth="2.5" strokeLinecap="round" fill="none"/></svg> },
  { id: 6,  x: 18, y: 85, size: 48, delay: 1,   dur: 8,  rotate: 10,  svg: <svg viewBox="0 0 50 50" fill="none"><path d="M25 8 L44 40 L6 40 Z" stroke="#38BDF8" strokeWidth="2.5" strokeLinejoin="round" fill="none"/></svg> },
  { id: 7,  x: 48, y: 4,  size: 36, delay: 2.5, dur: 7,  rotate: -15, svg: <svg viewBox="0 0 50 50" fill="none"><path d="M25 10 L27 22 L39 22 L29 29 L33 41 L25 34 L17 41 L21 29 L11 22 L23 22 Z" stroke="#4F8EF7" strokeWidth="2" strokeLinejoin="round" fill="none"/></svg> },
  { id: 8,  x: 62, y: 88, size: 46, delay: 0.8, dur: 9,  rotate: -8,  svg: <svg viewBox="0 0 50 50" fill="none"><path d="M25 38 C25 38, 8 27, 8 16 C8 10, 13 6, 19 8 C22 9, 25 12, 25 12 C25 12, 28 9, 31 8 C37 6, 42 10, 42 16 C42 27, 25 38, 25 38 Z" stroke="#4F8EF7" strokeWidth="2.5" strokeLinejoin="round" fill="none"/></svg> },
  { id: 9,  x: 32, y: 14, size: 60, delay: 3.5, dur: 8,  rotate: 8,   svg: <svg viewBox="0 0 70 30" fill="none"><path d="M5 25 L15 5 L25 25 L35 5 L45 25 L55 5 L65 25" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg> },
  { id: 10, x: 70, y: 22, size: 42, delay: 1.8, dur: 10, rotate: 0,   svg: <svg viewBox="0 0 50 50" fill="none"><circle cx="25" cy="25" r="18" stroke="#4F8EF7" strokeWidth="2.5" strokeDasharray="6 4"/></svg> },
  { id: 11, x: 92, y: 35, size: 50, delay: 4,   dur: 9,  rotate: 20,  svg: <svg viewBox="0 0 50 50" fill="none"><circle cx="25" cy="25" r="6" stroke="#38BDF8" strokeWidth="2"/><ellipse cx="25" cy="12" rx="5" ry="8" stroke="#4F8EF7" strokeWidth="2" fill="none"/><ellipse cx="25" cy="38" rx="5" ry="8" stroke="#4F8EF7" strokeWidth="2" fill="none"/><ellipse cx="12" cy="25" rx="8" ry="5" stroke="#4F8EF7" strokeWidth="2" fill="none"/><ellipse cx="38" cy="25" rx="8" ry="5" stroke="#4F8EF7" strokeWidth="2" fill="none"/></svg> },
  { id: 12, x: 10, y: 38, size: 50, delay: 2.8, dur: 7,  rotate: 35,  svg: <svg viewBox="0 0 50 50" fill="none"><path d="M10 25 L38 25 M28 15 L40 25 L28 35" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg> },
];

export default function ModeSelectScreen({ onSelectSolo, onSelectBattle }) {
  return (
    <div className="mode-select">
      {/* Floating doodle background */}
      <div className="lobby-doodles">
        {DOODLES.map(d => (
          <div
            key={d.id}
            className="lobby-doodle"
            style={{
              left: `${d.x}%`,
              top:  `${d.y}%`,
              width:  d.size,
              height: d.size,
              animationDelay:    `${d.delay}s`,
              animationDuration: `${d.dur}s`,
              transform: `rotate(${d.rotate}deg)`,
            }}
          >
            {d.svg}
          </div>
        ))}
      </div>

      <div className="mode-select__inner">
        <div className="mode-select__header">
          <DHSLogo height={36} />
          <h1 className="lobby-title">
            <span className="lobby-title__ai">AI</span>{' '}
            <span className="lobby-title__speed">SpeedSketch</span>{' '}
            <span className="lobby-title__arena">Arena</span>
          </h1>
          <p className="mode-select__sub">DataHack Summit 2026 — Choose your mode</p>
        </div>

        <div className="mode-select__cards">
          {/* Solo Mode */}
          <button className="mode-card mode-card--solo" onClick={onSelectSolo}>
            <div className="mode-card__icon">🎮</div>
            <div className="mode-card__name">Solo Mode</div>
            <div className="mode-card__desc">
              Join the global arena. Draw words against the AI, score points, and climb the live leaderboard with everyone playing.
            </div>
            <div className="mode-card__pills">
              <span className="mode-pill">100 Words</span>
              <span className="mode-pill">90 Seconds</span>
              <span className="mode-pill">Live Leaderboard</span>
            </div>
            <div className="mode-card__cta">Play Solo →</div>
          </button>

          {/* Battle Mode */}
          <button className="mode-card mode-card--battle" onClick={onSelectBattle}>
            <div className="mode-card__badge">NEW</div>
            <div className="mode-card__icon">⚔️</div>
            <div className="mode-card__name">Battle Mode</div>
            <div className="mode-card__desc">
              Create a private room or join a friend's. Everyone draws the same word — 12 rounds, 10 seconds each. Best AI confidence wins the round!
            </div>
            <div className="mode-card__pills">
              <span className="mode-pill">12 Rounds</span>
              <span className="mode-pill">10s Per Word</span>
              <span className="mode-pill">Best Drawing Wins</span>
            </div>
            <div className="mode-card__cta">Start Battle →</div>
          </button>
        </div>
      </div>
    </div>
  );
}
