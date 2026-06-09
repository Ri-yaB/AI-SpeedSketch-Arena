import React, { useState } from 'react';
import DHSLogo from './DHSLogo.jsx';

export default function BattleLobbyScreen({ onBack, battleState, battleActions, myPlayerId }) {
  const { status, roomCode, isHost, players } = battleState;

  const [tab, setTab]         = useState('create'); // 'create' | 'join'
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [copied, setCopied]   = useState(false);

  // Already in a lobby room
  const inLobby = status === 'lobby';

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Name is required.');
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return setError('Valid email is required.');
    setLoading(true);
    const res = await battleActions.createRoom(name.trim(), email.trim());
    if (!res.success) setError(res.error || 'Could not create room.');
    setLoading(false);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim())     return setError('Name is required.');
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return setError('Valid email is required.');
    if (!joinCode.trim()) return setError('Room code is required.');
    setLoading(true);
    const res = await battleActions.joinRoom(joinCode.trim(), name.trim(), email.trim());
    if (!res.success) setError(res.error || 'Could not join room.');
    setLoading(false);
  };

  const handleStart = async () => {
    setError('');
    setLoading(true);
    const res = await battleActions.startGame();
    if (!res.success) setError(res.error || 'Could not start game.');
    setLoading(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── In lobby (room created/joined) ────────────────────────────
  if (inLobby) {
    return (
      <div className="battle-lobby">
        <div className="battle-lobby__inner">
          <div className="battle-lobby__header">
            <DHSLogo height={28} />
            <span className="battle-lobby__mode-tag">⚔️ Battle Mode</span>
            <button className="battle-lobby__back" onClick={onBack}>← Back</button>
          </div>

          {/* Room code */}
          <div className="battle-code-card">
            <div className="battle-code-card__label">Room Code</div>
            <div className="battle-code-card__code">{roomCode}</div>
            <button className="battle-code-card__copy" onClick={copyCode}>
              {copied ? '✓ Copied!' : 'Copy Code'}
            </button>
            <p className="battle-code-card__hint">Share this code with players to join</p>
          </div>

          {/* Player list */}
          <div className="battle-players-card">
            <div className="battle-players-card__title">
              Players ({players.length}/8)
              {players.length < 2 && (
                <span className="battle-players-card__waiting"> — Waiting for more players…</span>
              )}
            </div>
            <div className="battle-players-card__list">
              {players.map((p, i) => (
                <div key={p.id} className={`battle-player-row ${p.id === myPlayerId ? 'battle-player-row--me' : ''}`}>
                  <span className="battle-player-row__num">{i + 1}</span>
                  <span className="battle-player-row__name">
                    {p.name}
                    {p.id === myPlayerId && <span className="battle-player-row__you"> (you)</span>}
                    {p.id === players[0]?.id && <span className="battle-player-row__host"> 👑 Host</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Word info */}
          <div className="battle-info-card">
            <span>🃏</span>
            <span>10 shared words — 4 Easy · 4 Medium · 2 Hard · 90 seconds</span>
          </div>

          {error && <div className="battle-error">{error}</div>}

          {isHost ? (
            <button
              className={`btn btn--primary btn--large ${(players.length < 2 || loading) ? 'btn--disabled' : ''}`}
              onClick={handleStart}
              disabled={players.length < 2 || loading}
            >
              {loading ? 'Starting…' : `Start Battle (${players.length} players)`}
            </button>
          ) : (
            <div className="battle-waiting-msg">
              Waiting for the host to start the game…
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Pre-join: create or join form ─────────────────────────────
  return (
    <div className="battle-lobby">
      <div className="battle-lobby__inner">
        <div className="battle-lobby__header">
          <DHSLogo height={28} />
          <span className="battle-lobby__mode-tag">⚔️ Battle Mode</span>
          <button className="battle-lobby__back" onClick={onBack}>← Back</button>
        </div>

        <div className="battle-tabs">
          <button
            className={`battle-tab ${tab === 'create' ? 'battle-tab--active' : ''}`}
            onClick={() => { setTab('create'); setError(''); }}
          >Create Room</button>
          <button
            className={`battle-tab ${tab === 'join' ? 'battle-tab--active' : ''}`}
            onClick={() => { setTab('join'); setError(''); }}
          >Join Room</button>
        </div>

        <form className="battle-form" onSubmit={tab === 'create' ? handleCreate : handleJoin}>
          <div className="form-group">
            <label className="form-label">Your Name</label>
            <input
              className="form-input"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={30}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          {tab === 'join' && (
            <div className="form-group">
              <label className="form-label">Room Code</label>
              <input
                className="form-input form-input--code"
                type="text"
                placeholder="e.g. 42"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 2))}
                maxLength={2}
                inputMode="numeric"
              />
            </div>
          )}
          {error && <div className="battle-error">{error}</div>}
          <button
            type="submit"
            className={`btn btn--primary btn--large ${loading ? 'btn--disabled' : ''}`}
            disabled={loading}
          >
            {loading ? 'Loading…' : tab === 'create' ? 'Create Room' : 'Join Room'}
          </button>
        </form>

        <div className="battle-rules">
          <div className="battle-rules__title">How Battle Mode Works</div>
          <div className="battle-rules__list">
            <div className="battle-rule">🃏 Everyone gets the same 10 words (4 Easy + 4 Medium + 2 Hard)</div>
            <div className="battle-rule">🎨 Draw any word in 90 seconds — the AI scores your drawing</div>
            <div className="battle-rule">🏆 For each word, the player with the highest AI confidence wins the points</div>
            <div className="battle-rule">⚡ Winners announced live as soon as all players submit for a word</div>
          </div>
        </div>
      </div>
    </div>
  );
}
