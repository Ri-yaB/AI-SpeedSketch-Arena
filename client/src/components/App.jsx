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
  const [activeTab, setActiveTab]       = useState('game');
  const [mode, setMode]             = useState(null); // null | 'solo' | 'battle'
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
        </nav>
      )}

      <div className={`app-content ${showNav ? 'app-content--with-nav' : ''}`}>
        {activeTab === 'game'        && renderGameContent()}
        {activeTab === 'leaderboard' && <LeaderboardPage socketRef={socketRef} />}
      </div>
    </div>
  );
}
