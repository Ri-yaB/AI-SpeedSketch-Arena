import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '../hooks/useSocket.js';
import { useGameState } from '../hooks/useGameState.js';
import LobbyScreen from './LobbyScreen.jsx';
import GameScreen from './GameScreen.jsx';
import ResultsScreen from './ResultsScreen.jsx';
import LeaderboardPage from './LeaderboardPage.jsx';
import InstructionsPage from './InstructionsPage.jsx';
import DHSLogo from './DHSLogo.jsx';

const NAV_TABS = [
  { id: 'game',        label: 'Game',         icon: '🎮' },
  { id: 'leaderboard', label: 'Leaderboard',  icon: '🏆' },
  { id: 'instructions',label: 'How to Play',  icon: '📖' },
];

export default function App() {
  const { socketRef, connected, connectionError } = useSocket();
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [activeTab, setActiveTab] = useState('game');
  const spectatedRef = useRef(false);

  const { state, actions } = useGameState(socketRef, myPlayerId);

  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;

    const onConnect = () => setMyPlayerId(s.id);
    const onDisconnect = () => setMyPlayerId(null);

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    if (s.connected) setMyPlayerId(s.id);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, [socketRef]);

  // When leaderboard tab is opened and user is not a player, spectate to get live updates
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

  // During active game, hide the nav to keep the game screen clean
  const showNav = !(joined && gameState === 'playing');

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const renderGameContent = () => {
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
        <div className="lobby-screen">
          <div className="lobby-screen__inner">
            <h1 className="lobby-title">
              <span className="lobby-title__ai">AI</span>
              <span className="lobby-title__speed"> SpeedSketch</span>
              <span className="lobby-title__arena"> Arena</span>
            </h1>
            <div className="lobby-waiting">
              <div className="lobby-waiting__spinner" />
              <p>Game starting soon...</p>
              <p className="lobby-waiting__sub">Get ready to draw!</p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <LobbyScreen
        connected={connected}
        connectionError={connectionError}
        onJoinGame={actions.joinGame}
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
                onClick={() => handleTabChange(tab.id)}
              >
                <span className="app-nav__tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      )}

      <div className={`app-content ${showNav ? 'app-content--with-nav' : ''}`}>
        {activeTab === 'game' && renderGameContent()}
        {activeTab === 'leaderboard' && (
          <LeaderboardPage
            socketRef={socketRef}
            leaderboard={state.leaderboard}
            gameState={state.gameState}
            timeRemaining={state.timeRemaining}
          />
        )}
        {activeTab === 'instructions' && <InstructionsPage />}
      </div>
    </div>
  );
}
