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
import InstructionsPage from './InstructionsPage.jsx';
import DHSLogo from './DHSLogo.jsx';

const NAV_TABS = [
  { id: 'game',         label: 'Game',        icon: '🎮' },
  { id: 'leaderboard',  label: 'Leaderboard', icon: '🏆' },
  { id: 'instructions', label: 'How to Play', icon: '📖' },
];

export default function App() {
  const { socketRef, connected, connectionError } = useSocket();
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [activeTab, setActiveTab]   = useState('game');
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
  const inBattleGame = mode === 'battle' && battleState.status === 'playing';
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
      return (
        <div className="dhs-waiting-screen">
          <div className="dhs-orb">
            <div className="dhs-halo" />
            <svg className="dhs-mark" viewBox="-300 -300 600 600" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="dhsHaloRadial" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor="#00c2d4" stopOpacity="0.30" />
                  <stop offset="45%"  stopColor="#4a3cd9" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#4a3cd9" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="dhsCoreRadial" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor="#ffffff"  stopOpacity="1" />
                  <stop offset="18%"  stopColor="#bff3ff"  stopOpacity="0.92" />
                  <stop offset="45%"  stopColor="#00c2d4"  stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#0087c8"  stopOpacity="0" />
                </radialGradient>
                <linearGradient id="dhsPetalA" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%"   stopColor="#00e1ff" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#0087c8" stopOpacity="0.38" />
                </linearGradient>
                <linearGradient id="dhsPetalB" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%"   stopColor="#4a3cd9" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#00c2d4" stopOpacity="0.34" />
                </linearGradient>
                <linearGradient id="dhsPetalC" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%"   stopColor="#7c5fff" stopOpacity="0.80" />
                  <stop offset="100%" stopColor="#4a3cd9" stopOpacity="0.30" />
                </linearGradient>
              </defs>
              <circle className="dhs-svg-halo" cx="0" cy="0" r="285" fill="url(#dhsHaloRadial)" />
              <g className="dhs-outer-rot"><g className="dhs-outer-scale">
                <g transform="rotate(0)">  <rect fill="url(#dhsPetalA)" x="-115" y="-78" width="230" height="156" rx="78" /></g>
                <g transform="rotate(45)"> <rect fill="url(#dhsPetalB)" x="-115" y="-78" width="230" height="156" rx="78" /></g>
                <g transform="rotate(90)"> <rect fill="url(#dhsPetalC)" x="-115" y="-78" width="230" height="156" rx="78" /></g>
                <g transform="rotate(135)"><rect fill="url(#dhsPetalA)" x="-115" y="-78" width="230" height="156" rx="78" /></g>
                <g transform="rotate(180)"><rect fill="url(#dhsPetalB)" x="-115" y="-78" width="230" height="156" rx="78" /></g>
                <g transform="rotate(225)"><rect fill="url(#dhsPetalC)" x="-115" y="-78" width="230" height="156" rx="78" /></g>
                <g transform="rotate(270)"><rect fill="url(#dhsPetalA)" x="-115" y="-78" width="230" height="156" rx="78" /></g>
                <g transform="rotate(315)"><rect fill="url(#dhsPetalB)" x="-115" y="-78" width="230" height="156" rx="78" /></g>
              </g></g>
              <g className="dhs-inner-rot"><g className="dhs-inner-scale">
                <g transform="rotate(0)">  <rect fill="url(#dhsPetalC)" x="-72" y="-48" width="144" height="96" rx="48" /></g>
                <g transform="rotate(60)"> <rect fill="url(#dhsPetalA)" x="-72" y="-48" width="144" height="96" rx="48" /></g>
                <g transform="rotate(120)"><rect fill="url(#dhsPetalB)" x="-72" y="-48" width="144" height="96" rx="48" /></g>
                <g transform="rotate(180)"><rect fill="url(#dhsPetalC)" x="-72" y="-48" width="144" height="96" rx="48" /></g>
                <g transform="rotate(240)"><rect fill="url(#dhsPetalA)" x="-72" y="-48" width="144" height="96" rx="48" /></g>
                <g transform="rotate(300)"><rect fill="url(#dhsPetalB)" x="-72" y="-48" width="144" height="96" rx="48" /></g>
              </g></g>
              <circle className="dhs-core-glow" cx="0" cy="0" r="92" fill="url(#dhsCoreRadial)" />
            </svg>
          </div>
          <p className="dhs-waiting-text">Game starting soon...</p>
          <p className="dhs-waiting-sub">Get ready to draw!</p>
        </div>
      );
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
        {activeTab === 'instructions' && <InstructionsPage />}
      </div>
    </div>
  );
}
