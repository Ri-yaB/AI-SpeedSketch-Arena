import React, { useState } from 'react';
import DHSLogo from './DHSLogo.jsx';

const ADMIN_PASSWORD = 'dhs2026';

const BATTLE_INSTRUCTIONS = [
  { num: '01', icon: '⚔️', label: 'Same Word, Same Time', text: '12 rounds of 10 seconds each. All players draw the exact same word simultaneously.' },
  { num: '02', icon: '🤖', label: 'Best Drawing Wins', text: 'AI judges every sketch. The highest confidence score claims the round. Easy +2 pts, Hard +4 pts.' },
  { num: '03', icon: '🚫', label: 'No Cheating', text: 'Writing the word on canvas is detected instantly and costs 1 point. Draw, never spell.' },
];

export default function BattleLobbyScreen({ onBack, battleState, battleActions, myPlayerId }) {
  const { status, roomCode, isHost, players } = battleState;

  // Player join state
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [copied, setCopied]     = useState(false);

  // Admin state
  const [isAdmin, setIsAdmin]               = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPass, setAdminPass]           = useState('');
  const [adminError, setAdminError]         = useState('');

  // Instructions overlay (players only)
  const [showInstructions, setShowInstructions] = useState(false);

  const inLobby = status === 'lobby';

  // ── Player join ────────────────────────────────────────────────────────────
  const handleJoin = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Name is required.'); return; }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setError('Valid email is required.'); return; }
    if (!joinCode.trim()) { setError('Room code is required.'); return; }
    setShowInstructions(true);
  };

  const handleJoinConfirm = async () => {
    setShowInstructions(false);
    setLoading(true);
    const res = await battleActions.joinRoom(joinCode.trim(), name.trim(), email.trim());
    if (!res.success) setError(res.error || 'Could not join room.');
    setLoading(false);
  };

  // ── Admin room creation ────────────────────────────────────────────────────
  const handleAdminCreateRoom = async () => {
    setError('');
    setLoading(true);
    const res = await battleActions.createRoom('Admin', 'admin@dhs2026.com', true);
    if (!res.success) setError(res.error || 'Could not create room.');
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

  // ── Admin password modal ───────────────────────────────────────────────────
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPass === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowAdminModal(false);
      setAdminPass('');
      setAdminError('');
    } else {
      setAdminError('Incorrect password.');
    }
  };

  const AdminModal = () => (
    <div className="admin-modal-backdrop" onClick={() => { setShowAdminModal(false); setAdminError(''); }}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <div className="admin-modal__title">🔐 Admin Access</div>
        <form onSubmit={handleAdminLogin}>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Enter admin password"
              value={adminPass}
              onChange={e => setAdminPass(e.target.value)}
              autoFocus
            />
          </div>
          {adminError && <div className="battle-error">{adminError}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="submit" className="btn btn--primary">Unlock</button>
            <button type="button" className="btn btn--ghost" onClick={() => { setShowAdminModal(false); setAdminError(''); }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );

  // ── Admin panel (logged in, no room yet) ───────────────────────────────────
  if (isAdmin && !inLobby) {
    return (
      <div className="battle-lobby">
        <div className="battle-lobby__inner">
          <div className="battle-lobby__header">
            <DHSLogo height={28} />
            <span className="battle-lobby__mode-tag">🔐 Admin Panel</span>
            <button className="battle-lobby__back" onClick={onBack}>← Back</button>
          </div>

          <div className="admin-panel">
            <div className="admin-panel__title">Create a Battle Room</div>
            <div className="admin-panel__sub">
              One click generates a room code you can share with players.
            </div>
            {error && <div className="battle-error">{error}</div>}
            <button
              className={`btn btn--primary btn--large ${loading ? 'btn--disabled' : ''}`}
              onClick={handleAdminCreateRoom}
              disabled={loading}
            >
              {loading ? 'Creating…' : '⚔️ Generate Room Code'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Instructions overlay (player join flow) ────────────────────────────────
  if (showInstructions) {
    return (
      <div className="battle-lobby">
        <div className="battle-lobby__inner">
          <div className="battle-lobby__header">
            <DHSLogo height={28} />
            <span className="battle-lobby__mode-tag">⚔️ Battle Mode</span>
          </div>
          <div className="inst-inline">
            <div className="inst-inline__header">
              <div className="inst-inline__eyebrow inst-inline__eyebrow--battle">Battle Mode</div>
              <div className="inst-inline__title">How to Play</div>
            </div>
            <div className="inst-inline__steps">
              {BATTLE_INSTRUCTIONS.map((item) => (
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
                onClick={handleJoinConfirm}
                disabled={loading}
              >
                {loading ? 'Joining…' : 'Join Room →'}
              </button>
              <button className="btn btn--ghost" onClick={() => setShowInstructions(false)}>
                ← Back
              </button>
            </div>
            {error && <div className="battle-error">{error}</div>}
          </div>
        </div>
      </div>
    );
  }

  // ── In lobby (room created/joined) ─────────────────────────────────────────
  if (inLobby) {
    return (
      <div className="battle-lobby">
        <div className="battle-lobby__inner">
          <div className="battle-lobby__header">
            <DHSLogo height={28} />
            <span className="battle-lobby__mode-tag">{isAdmin ? '🔐 Admin Panel' : '⚔️ Battle Mode'}</span>
            <button className="battle-lobby__back" onClick={onBack}>← Back</button>
          </div>

          <div className="battle-code-card">
            <div className="battle-code-card__label">Room Code</div>
            <div className="battle-code-card__code">{roomCode}</div>
            <button className="battle-code-card__copy" onClick={copyCode}>
              {copied ? '✓ Copied!' : 'Copy Code'}
            </button>
            <p className="battle-code-card__hint">Share this code with players to join</p>
          </div>

          <div className="battle-players-card">
            <div className="battle-players-card__title">
              Players ({players.length}/8)
              {players.length < 2 && (
                <span className="battle-players-card__waiting"> — Waiting for players…</span>
              )}
            </div>
            <div className="battle-players-card__list">
              {players.map((p, i) => (
                <div key={p.id} className={`battle-player-row ${p.id === myPlayerId ? 'battle-player-row--me' : ''}`}>
                  <span className="battle-player-row__num">{i + 1}</span>
                  <span className="battle-player-row__name">
                    {p.name}
                    {p.id === myPlayerId && <span className="battle-player-row__you"> (you)</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="battle-info-card">
            <span>⚔️</span>
            <span>12 rounds — 4 Easy · 4 Medium · 4 Hard · 10 seconds each</span>
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

  // ── Player join form ───────────────────────────────────────────────────────
  return (
    <div className="battle-lobby">
      {showAdminModal && <AdminModal />}

      <div className="battle-lobby__inner">
        <div className="battle-lobby__header">
          <DHSLogo height={28} />
          <span className="battle-lobby__mode-tag">⚔️ Battle Mode</span>
          <button className="battle-lobby__back" onClick={onBack}>← Back</button>
        </div>

        <form className="battle-form" onSubmit={handleJoin}>
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
          {error && <div className="battle-error">{error}</div>}
          <button
            type="submit"
            className={`btn btn--primary btn--large ${loading ? 'btn--disabled' : ''}`}
            disabled={loading}
          >
            {loading ? 'Joining…' : 'Join Room →'}
          </button>
        </form>

        <button
          className="admin-unlock-btn"
          onClick={() => setShowAdminModal(true)}
        >
          🔐 Admin
        </button>
      </div>
    </div>
  );
}
