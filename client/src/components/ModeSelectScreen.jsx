import React from 'react';

// anim: 'float' | 'drift' | 'spin' | 'pulse'
const DOODLES = [
  { id: 1,  x: 5,  y: 8,  size: 64, delay: 0,   dur: 9,  rotate: 15,  anim: 'float', svg: <svg viewBox="0 0 50 50" fill="none"><path d="M25 5 L28 20 L43 20 L31 29 L35 44 L25 35 L15 44 L19 29 L7 20 L22 20 Z" stroke="#4F8EF7" strokeWidth="2" strokeLinejoin="round"/></svg> },
  { id: 2,  x: 87, y: 6,  size: 54, delay: 1.2, dur: 7,  rotate: -10, anim: 'spin',  svg: <svg viewBox="0 0 50 50" fill="none"><circle cx="25" cy="25" r="18" stroke="#38BDF8" strokeWidth="2" strokeDasharray="5 3"/><path d="M17 17 L33 33 M33 17 L17 33" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round"/></svg> },
  { id: 3,  x: 78, y: 50, size: 80, delay: 0.5, dur: 12, rotate: 0,   anim: 'drift', svg: <svg viewBox="0 0 90 30" fill="none"><path d="M4 15 C14 2, 22 28, 32 15 C42 2, 50 28, 60 15 C70 2, 78 28, 88 15" stroke="#4F8EF7" strokeWidth="2.5" strokeLinecap="round"/></svg> },
  { id: 4,  x: 3,  y: 62, size: 58, delay: 2,   dur: 8,  rotate: -20, anim: 'float', svg: <svg viewBox="0 0 40 40" fill="none"><rect x="5" y="5" width="30" height="30" rx="4" stroke="#38BDF8" strokeWidth="2"/><line x1="5" y1="15" x2="35" y2="15" stroke="#38BDF8" strokeWidth="1.5"/><line x1="15" y1="5" x2="15" y2="35" stroke="#38BDF8" strokeWidth="1.5"/></svg> },
  { id: 5,  x: 73, y: 76, size: 60, delay: 3,   dur: 10, rotate: 5,   anim: 'float', svg: <svg viewBox="0 0 50 50" fill="none"><circle cx="25" cy="25" r="16" stroke="#4F8EF7" strokeWidth="2"/><circle cx="25" cy="25" r="8" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4 3"/><circle cx="25" cy="25" r="3" stroke="#4F8EF7" strokeWidth="2"/></svg> },
  { id: 6,  x: 17, y: 83, size: 52, delay: 1,   dur: 8,  rotate: 10,  anim: 'pulse', svg: <svg viewBox="0 0 50 50" fill="none"><path d="M25 8 L44 40 L6 40 Z" stroke="#38BDF8" strokeWidth="2.5" strokeLinejoin="round"/></svg> },
  { id: 7,  x: 46, y: 3,  size: 44, delay: 2.5, dur: 7,  rotate: -15, anim: 'float', svg: <svg viewBox="0 0 50 50" fill="none"><path d="M25 10 L27 22 L39 22 L29 29 L33 41 L25 34 L17 41 L21 29 L11 22 L23 22 Z" stroke="#4F8EF7" strokeWidth="2" strokeLinejoin="round"/></svg> },
  { id: 8,  x: 60, y: 86, size: 56, delay: 0.8, dur: 9,  rotate: -8,  anim: 'drift', svg: <svg viewBox="0 0 50 50" fill="none"><path d="M25 38 C8 27, 8 16, 19 8 C22 9, 25 12, 25 12 C25 12, 28 9, 31 8 C42 10, 42 27, 25 38 Z" stroke="#4F8EF7" strokeWidth="2.5" strokeLinejoin="round"/></svg> },
  { id: 9,  x: 30, y: 12, size: 70, delay: 3.5, dur: 8,  rotate: 8,   anim: 'drift', svg: <svg viewBox="0 0 80 30" fill="none"><path d="M5 25 L15 5 L25 25 L35 5 L45 25 L55 5 L65 25 L75 5" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id: 10, x: 68, y: 20, size: 48, delay: 1.8, dur: 11, rotate: 0,   anim: 'spin',  svg: <svg viewBox="0 0 50 50" fill="none"><circle cx="25" cy="25" r="18" stroke="#4F8EF7" strokeWidth="2" strokeDasharray="8 4"/><circle cx="25" cy="25" r="9" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4 4"/></svg> },
  { id: 11, x: 91, y: 33, size: 56, delay: 4,   dur: 9,  rotate: 20,  anim: 'pulse', svg: <svg viewBox="0 0 50 50" fill="none"><circle cx="25" cy="25" r="6" stroke="#38BDF8" strokeWidth="2"/><ellipse cx="25" cy="12" rx="5" ry="8" stroke="#4F8EF7" strokeWidth="1.5"/><ellipse cx="25" cy="38" rx="5" ry="8" stroke="#4F8EF7" strokeWidth="1.5"/><ellipse cx="12" cy="25" rx="8" ry="5" stroke="#4F8EF7" strokeWidth="1.5"/><ellipse cx="38" cy="25" rx="8" ry="5" stroke="#4F8EF7" strokeWidth="1.5"/></svg> },
  { id: 12, x: 9,  y: 36, size: 52, delay: 2.8, dur: 7,  rotate: 35,  anim: 'float', svg: <svg viewBox="0 0 50 50" fill="none"><path d="M10 25 L38 25 M28 15 L40 25 L28 35" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id: 13, x: 50, y: 88, size: 46, delay: 1.5, dur: 10, rotate: -30, anim: 'float', svg: <svg viewBox="0 0 50 50" fill="none"><rect x="10" y="10" width="30" height="30" rx="6" stroke="#4F8EF7" strokeWidth="2"/><path d="M18 25 L23 30 L33 20" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id: 14, x: 22, y: 55, size: 38, delay: 0.3, dur: 6,  rotate: 0,   anim: 'pulse', svg: <svg viewBox="0 0 50 50" fill="none"><path d="M10 25 L18 10 L25 20 L32 5 L40 25" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id: 15, x: 55, y: 40, size: 42, delay: 5,   dur: 13, rotate: -5,  anim: 'drift', svg: <svg viewBox="0 0 60 20" fill="none"><path d="M4 10 C10 2, 16 18, 22 10 C28 2, 34 18, 40 10 C46 2, 52 18, 58 10" stroke="#4F8EF7" strokeWidth="2" strokeLinecap="round"/></svg> },
];

export default function ModeSelectScreen({ onSelectSolo, onSelectBattle, battleEnabled }) {
  const battleUnlocked = !!battleEnabled;
  return (
    <div className="mode-select">
      {/* Floating doodle background */}
      <div className="lobby-doodles">
        {DOODLES.map(d => (
          <div
            key={d.id}
            className={`lobby-doodle lobby-doodle--${d.anim}`}
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
          <h1 className="lobby-title">
            <span className="lobby-title__ai">AI</span>{' '}
            <span className="lobby-title__speed">SpeedSketch</span>{' '}
            <span className="lobby-title__arena">Arena</span>
          </h1>
          <p className="mode-select__sub">DataHack Summit 2026 · Choose your mode</p>
        </div>

        <div className={`mode-select__cards ${!battleUnlocked ? 'mode-select__cards--solo-only' : ''}`}>
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

          {/* Battle Mode — only shown when admin enables it */}
          {battleUnlocked && (
            <button className="mode-card mode-card--battle" onClick={onSelectBattle}>
              <div className="mode-card__badge">LIVE</div>
              <div className="mode-card__icon">⚔️</div>
              <div className="mode-card__name">Battle Mode</div>
              <div className="mode-card__desc">
                Top 8 solo players face off live. Everyone draws the same word — best AI confidence wins the round!
              </div>
              <div className="mode-card__pills">
                <span className="mode-pill">Top 8 Players</span>
                <span className="mode-pill">5 Rounds</span>
                <span className="mode-pill">Best Drawing Wins</span>
              </div>
              <div className="mode-card__cta">Start Battle →</div>
            </button>
          )}
        </div>

        {/* Marquee — only when battle mode is off */}
        {!battleUnlocked && (
          <div className="mode-marquee">
            <div className="mode-marquee__track">
              {[0, 1].map(i => (
                <span key={i} className="mode-marquee__text">
                  🏆 &nbsp;Top players on the leaderboard will be selected for an exclusive <strong>Battle Mode</strong> showdown live on stage &nbsp;·&nbsp;
                  🎁 &nbsp;Winners take home exciting prizes from <strong>Analytics Vidhya</strong> &nbsp;·&nbsp;
                  ⚔️ &nbsp;Draw fast, draw smart — only the top 8 make it to the battle &nbsp;·&nbsp;
                  🤖 &nbsp;AI judges every sketch in real time — confidence is everything &nbsp;·&nbsp;
                  🔥 &nbsp;Keep playing to climb the leaderboard and earn your spot &nbsp;·&nbsp;&nbsp;
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
