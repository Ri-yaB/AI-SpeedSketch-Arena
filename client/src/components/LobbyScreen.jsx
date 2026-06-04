import React, { useState } from 'react';

export default function LobbyScreen({ connected, connectionError, onJoinGame }) {
  const [playerName, setPlayerName] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePlay = () => {
    if (!playerName.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!playerEmail.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(playerEmail.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    onJoinGame({ playerName: playerName.trim(), playerEmail: playerEmail.trim() }, (res) => {
      setLoading(false);
      if (!res.success) {
        setError(res.error || 'Failed to join. Please try again.');
      }
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handlePlay();
  };

  return (
    <div className="lobby-screen">
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
