import React, { useState } from 'react';

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
];

const SOLO_INSTRUCTIONS = [
  { num: '01', icon: '🎨', label: 'Pick & Draw', text: 'Choose any word from your pool and sketch it. 90 seconds on the clock. Draw as many as you can.' },
  { num: '02', icon: '🤖', label: 'AI Judges', text: 'The AI analyses your sketch. Easy and Medium words score +2 pts; Hard words score +4 pts.' },
  { num: '03', icon: '🚫', label: 'No Cheating', text: 'Writing the word on canvas is detected instantly and costs you 1 point. Draw, never spell.' },
];

export default function LobbyScreen({ connected, connectionError, onJoinGame, onBack }) {
  const [playerName, setPlayerName]       = useState('');
  const [playerEmail, setPlayerEmail]     = useState('');
  const [error, setError]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [pendingData, setPendingData]     = useState(null);

  const handlePlay = () => {
    if (!playerName.trim()) { setError('Please enter your name.'); return; }
    if (!playerEmail.trim()) { setError('Please enter your email.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(playerEmail.trim())) {
      setError('Please enter a valid email address.'); return;
    }
    setError('');
    setPendingData({ playerName: playerName.trim(), playerEmail: playerEmail.trim() });
    setShowInstructions(true);
  };

  const handleStartGame = () => {
    if (!pendingData) return;
    setLoading(true);
    setShowInstructions(false);
    onJoinGame(pendingData, (res) => {
      setLoading(false);
      if (!res.success) setError(res.error || 'Failed to join. Please try again.');
    });
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handlePlay(); };

  return (
    <div className="lobby-screen">
      <div className="lobby-doodles" aria-hidden="true">
        {DOODLES.map(d => (
          <div
            key={d.id}
            className={`lobby-doodle lobby-doodle--${d.anim}`}
            style={{
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: `${d.size}px`,
              height: `${d.size}px`,
              animationDelay: `${d.delay}s`,
              animationDuration: `${d.dur}s`,
              transform: `rotate(${d.rotate}deg)`,
            }}
          >
            {d.svg}
          </div>
        ))}
      </div>

      <div className="lobby-screen__inner">
        <div className="lobby-hero">
          <h1 className="lobby-title">
            <span className="lobby-title__ai">AI</span>
            <span className="lobby-title__speed"> SpeedSketch</span>
            <span className="lobby-title__arena"> Arena</span>
          </h1>
          <p className="lobby-subtitle">
            Draw fast. Beat the AI. Score big. 90 seconds on the clock.
          </p>
        </div>

        {(!connected || connectionError) ? (
          <div className="lobby-error-banner">
            {connectionError
              ? `Cannot connect to server: ${connectionError}`
              : 'Connecting to server...'}
          </div>
        ) : loading ? (
          <div className="lobby-loading">
            <div className="lobby-loading__spinner" />
            <div className="lobby-loading__text">Getting your canvas ready…</div>
          </div>
        ) : showInstructions ? (
          <div className="inst-inline">
            <div className="inst-inline__header">
              <div className="inst-inline__eyebrow">Solo Mode</div>
              <div className="inst-inline__title">How to Play</div>
            </div>
            <div className="inst-inline__steps">
              {SOLO_INSTRUCTIONS.map((item) => (
                <div key={item.num} className="inst-inline__step">
                  <div className="inst-inline__step-left">
                    <div className="inst-inline__step-num">{item.num}</div>
                    <div className="inst-inline__step-icon">{item.icon}</div>
                  </div>
                  <div className="inst-inline__step-body">
                    <div className="inst-inline__step-label">{item.label}</div>
                    <div className="inst-inline__step-text">{item.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="inst-inline__actions">
              <button
                className="btn btn--primary btn--large"
                onClick={handleStartGame}
                disabled={loading}
              >
                {loading ? 'Joining...' : "Let's Draw! 🚀"}
              </button>
              <button className="btn btn--ghost" onClick={() => setShowInstructions(false)}>
                ← Back
              </button>
            </div>
          </div>
        ) : (
          <div className="lobby-form">
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="Enter your name..."
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={30}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="Enter your email..."
                value={playerEmail}
                onChange={e => setPlayerEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={100}
              />
            </div>
            {error && <div className="lobby-error">{error}</div>}
            <div className="lobby-cta-buttons">
              <button
                className="btn btn--primary btn--large"
                onClick={handlePlay}
                disabled={loading || !connected}
              >
                {loading ? 'Joining...' : 'Play Now →'}
              </button>
              {onBack && (
                <button className="btn btn--ghost" onClick={onBack}>
                  ← Change Mode
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
