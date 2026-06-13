import React, { useState } from 'react';
import DHSLogo from './DHSLogo.jsx';

const ADMIN_PASSWORD = 'dhs2026';

const BATTLE_INSTRUCTIONS = [
  { icon: '⚔️', text: '12 rounds · 10s each · everyone draws the same word' },
  { icon: '🤖', text: 'Highest AI confidence wins the round — Easy +2 · Hard +4 pts' },
  { icon: '🚫', text: "Don't write the word — detected and costs 1 pt!" },
];

export default function BattleLobbyScreen({ onBack, battleState, battleActions, myPlayerId }) {
  const { status, roomCode, isHost, players } = battleState;

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [copied, setCopied]     = useState(false);

  // Admin state
  const [isAdmin, setIsAdmin]           = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPass, setAdminPass]       = useState('');
  const [adminError, setAdminError]     = useState('');
  const [tab, setTab]                   = useState('join'); // 'join' | 'create'

  // Instructions overlay
  const [showInstructions, setShowInstructions] = useState(false);
  const [pendingAction, setPendingAction]       = useState(null);

  const inLobby = status === 'lobby';

  const validateForm = (needCode) => {
    if (!name.trim()) { setError('Name is required.'); return false; }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setError('Valid email is required.'); return false; }
    if (needCode && !joinCode.trim()) { setError('Room code is required.'); return false; }
    return true;
  };

  const handleJoin = (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm(true)) return;
    setPendingAction('join');
    setShowInstructions(true);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm(false)) return;
    setPendingAction('create');
    setShowInstructions(true);
  };

  const handleContinue = async () => {
    setShowInstructions(false);
    setLoading(true);
    if (pendingAction === 'create') {
      const res = await battleActions.createRoom(name.trim(), email.trim());
      if (!res.success) setError(res.error || 'Could not create room.');
    } else {
      const res = await battleActions.joinRoom(joinCode.trim(), name.trim(), email.trim());
      if (!res.success) setError(res.error || 'Could not join room.');
    }
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

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPass === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setTab('create');
      setShowAdminModal(false);
      setAdminPass('');
      setAdminError('');
    } else {
      setAdminError('Incorrect password.');
    }
  };

  // ── Admin password modal ───────────────────────────────────────────────────
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

  // ── Instructions overlay ───────────────────────────────────────────────────
  if (showInstructions) {
    return (
      <div className="battle-lobby">
        <div className="battle-lobby__inner">
          <div className="battle-lobby__header">
            <DHSLogo height={28} />
            <span className="battle-lobby__mode-tag">⚔️ Battle Mode</span>
          </div>
          <div className="inst-inline">
            <div className="inst-inline__title">⚔️ How Battle Mode Works</div>
            <div className="inst-inline__steps">
              {BATTLE_INSTRUCTIONS.map((item, i) => (
                <div key={i} className="inst-inline__step">
                  <span className="inst-inline__step-icon">{item.icon}</span>
                  <span className="inst-inline__step-text">{item.text}</span>
                </div>
              ))}
            </div>
            <div className="lobby-cta-buttons">
              <button
                className="btn btn--primary btn--large"
                onClick={handleContinue}
                disabled={loading}
              >
                {loading ? 'Loading…' : pendingAction === 'create' ? 'Create Room →' : 'Join Room →'}
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
            <span className="battle-lobby__mode-tag">⚔️ Battle Mode</span>
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

  // ── Pre-join form ──────────────────────────────────────────────────────────
  return (
    <div className="battle-lobby">
      {showAdminModal && <AdminModal />}

      <div className="battle-lobby__inner">
        <div className="battle-lobby__header">
          <DHSLogo height={28} />
          <span className="battle-lobby__mode-tag">⚔️ Battle Mode</span>
          <button className="battle-lobby__back" onClick={onBack}>← Back</button>
        </div>

        {/* Tabs — admin sees both, users see only Join */}
        {isAdmin && (
          <div className="battle-tabs">
            <button
              className={`battle-tab ${tab === 'join' ? 'battle-tab--active' : ''}`}
              onClick={() => { setTab('join'); setError(''); }}
            >Join Room</button>
            <button
              className={`battle-tab ${tab === 'create' ? 'battle-tab--active' : ''}`}
              onClick={() => { setTab('create'); setError(''); }}
            >Create Room</button>
          </div>
        )}

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
            {loading ? 'Loading…' : tab === 'create' ? 'Create Room →' : 'Join Room →'}
          </button>
        </form>

        {/* Subtle admin link */}
        {!isAdmin && (
          <button
            className="admin-unlock-btn"
            onClick={() => setShowAdminModal(true)}
          >
            🔐 Admin
          </button>
        )}
      </div>
    </div>
  );
}
