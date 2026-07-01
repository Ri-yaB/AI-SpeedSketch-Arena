import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '../hooks/useSocket.js';
import { useGameState } from '../hooks/useGameState.js';
import { useBattleState } from '../hooks/useBattleState.js';
import ModeSelectScreen from './ModeSelectScreen.jsx';
import LobbyScreen from './LobbyScreen.jsx';
import GameScreen from './GameScreen.jsx';
import ResultsScreen from './ResultsScreen.jsx';
import BattleLobbyScreen from './BattleLobbyScreen.jsx';
import BattleGameScreen from './BattleGameScreen.jsx';
import BattleResultsScreen from './BattleResultsScreen.jsx';
import LeaderboardPage from './LeaderboardPage.jsx';
import DHSLogo from './DHSLogo.jsx';
import AVLogo from './AVLogo.jsx';
import DHSOrb from './DHSOrb.jsx';

const NAV_TABS = [
  { id: 'game',        label: 'Game',        icon: '🎮' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
];

export default function App() {
  const { socketRef, connected, connectionError } = useSocket();
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [activeTab, setActiveTab]   = useState('game');
  const [mode, setMode]             = useState(null); // null | 'solo' | 'battle'
  const [battleEnabled, setBattleEnabled] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPass, setAdminPass]   = useState('');
  const [adminError, setAdminError] = useState('');
  const [battleModeOn, setBattleModeOn] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  const ADMIN_PASSWORD = 'dhs2026';
  const spectatedRef = useRef(false);

  const { state, actions }               = useGameState(socketRef, myPlayerId);
  const { state: battleState, actions: battleActions } = useBattleState(socketRef, myPlayerId);

  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;
    const onConnect    = () => setMyPlayerId(s.id);
    const onDisconnect = () => setMyPlayerId(null);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    if (s.connected) setMyPlayerId(s.id);
    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, [socketRef]);

  // Sync battle mode enabled state from server
  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;
    s.emit('get-battle-status', null, (res) => {
      if (res) { setBattleEnabled(res.enabled); setBattleModeOn(res.enabled); }
    });
    const onChanged = ({ enabled }) => { setBattleEnabled(enabled); setBattleModeOn(enabled); };
    s.on('battle-mode-changed', onChanged);
    return () => s.off('battle-mode-changed', onChanged);
  }, [socketRef]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPass === ADMIN_PASSWORD) {
      setAdminError('');
      setAdminPass('');
      // don't close — show toggle UI inline
    } else {
      setAdminError('Incorrect password.');
    }
  };

  const handleToggleBattleMode = () => {
    const s = socketRef.current;
    if (!s) return;
    setToggleLoading(true);
    s.emit('admin-set-battle-enabled', { enabled: !battleModeOn, adminPassword: ADMIN_PASSWORD }, (res) => {
      if (res?.success) setBattleModeOn(res.enabled);
      setToggleLoading(false);
    });
  };

  const isAdminUnlocked = adminPass === '' && adminError === '' && showAdminModal && toggleLoading !== null;

  useEffect(() => {
    if (activeTab === 'leaderboard' && !state.joined && !spectatedRef.current) {
      const s = socketRef.current;
      if (s?.connected) {
        s.emit('spectate');
        spectatedRef.current = true;
      }
    }
  }, [activeTab, state.joined, socketRef]);

  const { gameState, joined } = state;

  // Hide nav during active games
  const inSoloGame   = mode === 'solo'   && joined && gameState === 'playing';
  const inBattleGame = mode === 'battle' && (battleState.status === 'playing' || battleState.status === 'starting' || battleState.status === 'finished');
  const showNav      = !inSoloGame && !inBattleGame;

  // ── Game content renderer ──────────────────────────────────────
  const renderGameContent = () => {
    // No mode chosen yet → Mode Select
    if (!mode) {
      return (
        <ModeSelectScreen
          onSelectSolo={() => setMode('solo')}
          onSelectBattle={() => setMode('battle')}
          battleEnabled={battleEnabled}
        />
      );
    }

    // ── Battle mode ──────────────────────────────────────────────
    if (mode === 'battle') {
      if (battleState.status === 'finished') {
        return (
          <BattleResultsScreen
            battleState={battleState}
            myPlayerId={myPlayerId}
            onPlayAgain={() => {
              battleActions.reset();
            }}
            onGoHome={() => {
              battleActions.reset();
              setMode(null);
            }}
          />
        );
      }
      if (battleState.status === 'starting') {
        return <DHSOrb text="Battle starting..." sub="Get ready to draw!" />;
      }
      if (battleState.status === 'playing') {
        return (
          <BattleGameScreen
            battleState={battleState}
            myPlayerId={myPlayerId}
            battleActions={battleActions}
          />
        );
      }
      // lobby or idle
      return (
        <BattleLobbyScreen
          onBack={() => { battleActions.reset(); setMode(null); }}
          battleState={battleState}
          battleActions={battleActions}
          myPlayerId={myPlayerId}
          socketRef={socketRef}
        />
      );
    }

    // ── Solo mode ────────────────────────────────────────────────
    if (joined && gameState === 'playing') {
      return <GameScreen state={state} myPlayerId={myPlayerId} actions={actions} />;
    }
    if (joined && gameState === 'finished') {
      return (
        <ResultsScreen
          leaderboard={state.leaderboard}
          myPlayerId={myPlayerId}
        />
      );
    }
    if (joined && gameState === 'waiting') {
      return <DHSOrb />;
    }
    return (
      <LobbyScreen
        connected={connected}
        connectionError={connectionError}
        onJoinGame={actions.joinGame}
        onBack={() => setMode(null)}
      />
    );
  };

  return (
    <div className="app-root">
      {/* Global admin modal */}
      {showAdminModal && (
        <div className="admin-modal-backdrop" onClick={() => { setShowAdminModal(false); setAdminPass(''); setAdminError(''); }}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal__title">🔐 Admin Panel</div>

            {/* Not yet authenticated — show password form */}
            {!adminPass.startsWith('__ok') ? (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (adminPass === ADMIN_PASSWORD) {
                  setAdminPass('__ok');
                  setAdminError('');
                } else {
                  setAdminError('Incorrect password.');
                }
              }}>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Enter admin password"
                    value={adminPass.startsWith('__ok') ? '' : adminPass}
                    onChange={e => setAdminPass(e.target.value)}
                    autoFocus
                  />
                </div>
                {adminError && <div className="battle-error">{adminError}</div>}
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button type="submit" className="btn btn--primary">Unlock</button>
                  <button type="button" className="btn btn--ghost" onClick={() => { setShowAdminModal(false); setAdminPass(''); setAdminError(''); }}>Cancel</button>
                </div>
              </form>
            ) : (
              /* Authenticated — show controls */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="admin-toggle-row">
                  <div className="admin-toggle-info">
                    <div className="admin-toggle-info__title">Battle Mode</div>
                    <div className="admin-toggle-info__sub">
                      {battleModeOn ? 'Visible to all players' : 'Hidden from players'}
                    </div>
                  </div>
                  <button
                    className={`admin-toggle-btn ${battleModeOn ? 'admin-toggle-btn--on' : 'admin-toggle-btn--off'}`}
                    onClick={handleToggleBattleMode}
                    disabled={toggleLoading}
                  >
                    <span className="admin-toggle-btn__track">
                      <span className="admin-toggle-btn__thumb" />
                    </span>
                    <span className="admin-toggle-btn__label">{battleModeOn ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
                <button className="btn btn--ghost" onClick={() => { setShowAdminModal(false); setAdminPass(''); }}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showNav && (
        <nav className="app-nav">
          <div className="app-nav__logo">
            <DHSLogo height={26} />
            <div className="app-nav__logo-divider" />
            <AVLogo height={26} />
          </div>
          <div className="app-nav__tabs">
            {NAV_TABS.map(tab => (
              <button
                key={tab.id}
                className={`app-nav__tab ${activeTab === tab.id ? 'app-nav__tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="app-nav__tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
          <button
            className="app-nav__admin-btn"
            onClick={() => { setShowAdminModal(true); setAdminError(''); }}
            title="Admin"
          >
            🔐
          </button>
        </nav>
      )}

      <div className={`app-content ${showNav ? 'app-content--with-nav' : ''}`}>
        {activeTab === 'game'        && renderGameContent()}
        {activeTab === 'leaderboard' && <LeaderboardPage socketRef={socketRef} />}
      </div>
    </div>
  );
}
