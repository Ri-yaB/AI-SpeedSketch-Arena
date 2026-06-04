import React, { useState } from 'react';

// Floating doodle shapes rendered as background decoration
const DOODLES = [
  // pencil, star, circle, squiggle, heart, triangle — as inline SVG paths
  { id: 1, emoji: '✏️', x: 8,  y: 12, size: 32, delay: 0,   dur: 8 },
  { id: 2, emoji: '⭐', x: 85, y: 8,  size: 28, delay: 1.5, dur: 7 },
  { id: 3, emoji: '🎨', x: 92, y: 55, size: 36, delay: 0.8, dur: 9 },
  { id: 4, emoji: '✏️', x: 5,  y: 70, size: 24, delay: 2.2, dur: 6 },
  { id: 5, emoji: '🖊️', x: 78, y: 80, size: 30, delay: 3,   dur: 8 },
  { id: 6, emoji: '⭐', x: 20, y: 88, size: 22, delay: 1,   dur: 7 },
  { id: 7, emoji: '✏️', x: 50, y: 5,  size: 26, delay: 2.5, dur: 9 },
  { id: 8, emoji: '🎨', x: 60, y: 90, size: 20, delay: 0.5, dur: 6 },
  { id: 9, emoji: '🖊️', x: 35, y: 15, size: 18, delay: 3.5, dur: 8 },
  { id:10, emoji: '⭐', x: 70, y: 30, size: 24, delay: 1.8, dur: 7 },
];

export default function LobbyScreen({ connected, connectionError, onJoinGame }) {
  const [playerName, setPlayerName] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePlay = () => {
    if (!playerName.trim()) { setError('Please enter your name.'); return; }
    if (!playerEmail.trim()) { setError('Please enter your email.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(playerEmail.trim())) {
      setError('Please enter a valid email address.'); return;
    }
    setLoading(true);
    setError('');
    onJoinGame({ playerName: playerName.trim(), playerEmail: playerEmail.trim() }, (res) => {
      setLoading(false);
      if (!res.success) setError(res.error || 'Failed to join. Please try again.');
    });
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handlePlay(); };

  return (
    <div className="lobby-screen">
      {/* Floating doodle background */}
      <div className="lobby-doodles" aria-hidden="true">
        {DOODLES.map(d => (
          <span
            key={d.id}
            className="lobby-doodle"
            style={{
              left: `${d.x}%`,
              top: `${d.y}%`,
              fontSize: `${d.size}px`,
              animationDelay: `${d.delay}s`,
              animationDuration: `${d.dur}s`,
            }}
          >
            {d.emoji}
          </span>
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
          <div className="lobby-conf-tag">DataHack Summit 2026</div>
        </div>

        {(!connected || connectionError) ? (
          <div className="lobby-error-banner">
            {connectionError
              ? `Cannot connect to server: ${connectionError}`
              : 'Connecting to server...'}
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
                {loading ? 'Joining...' : 'Play Now'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
