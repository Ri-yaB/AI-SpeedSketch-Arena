import React, { useState, useCallback } from 'react';
import DrawingCanvas from './DrawingCanvas.jsx';
import WordPool from './WordPool.jsx';
import Leaderboard from './Leaderboard.jsx';
import AIFeedback from './AIFeedback.jsx';
import DHSLogo from './DHSLogo.jsx';

const RANK_ICONS = ['🥇', '🥈', '🥉'];

export default function GameScreen({ state, myPlayerId, actions }) {
  const {
    timeRemaining, myScore, selectedWord, completedWords,
    wordPool, wordDifficulty, leaderboard, drawingResults, hintsRemaining, hintWord,
  } = state;

  const [activeTab, setActiveTab] = useState('draw');
  const isUrgent = timeRemaining <= 15;

  // Submit is fire-and-forget — callback fires instantly (server acks before AI runs)
  const handleSubmit = useCallback(({ word, imageData, textPenalty }) => {
    actions.submitDrawing({ word, imageData, textPenalty });
  }, [actions]);

  const handleSelectWord = useCallback((word) => {
    actions.selectWord(word);
  }, [actions]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const timerPct = (timeRemaining / 90) * 100;
  const myRank = leaderboard.findIndex(p => p.id === myPlayerId) + 1;

  return (
    <div className="game-screen">
      {/* Top bar */}
      <div className="game-topbar">
        <div className="game-topbar__left">
          <div className="topbar-dhs-logo">
            <DHSLogo height={16} />
          </div>
          <div className="game-topbar__divider" />
          <div className="game-brand">SpeedSketch Arena</div>
        </div>

        <div className="game-topbar__center">
          <div className={`game-timer ${isUrgent ? 'game-timer--urgent' : ''}`}>
            {isUrgent && <span className="game-timer__pulse" />}
            <span className="game-timer__value">{formatTime(timeRemaining)}</span>
            <div className="game-timer__bar">
              <div className="game-timer__fill" style={{ width: `${timerPct}%` }} />
            </div>
          </div>
        </div>

        <div className="game-topbar__right">
          <div className="game-score">
            <span className="game-score__value">{myScore}</span>
            <span className="game-score__label">pts</span>
          </div>
          {myRank > 0 && (
            <div className="game-rank-badge">
              <span className="game-rank-badge__label">Rank</span>
              <span className="game-rank-badge__value">#{myRank}</span>
            </div>
          )}
          <div className={`hint-counter ${hintsRemaining === 0 ? 'hint-counter--empty' : ''}`}>
            <span>💡</span>
            <span>{hintsRemaining}</span>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="game-tabs">
        <button
          className={`game-tab-btn ${activeTab === 'draw' ? 'game-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('draw')}
        >
          🎨 Draw
        </button>
        <button
          className={`game-tab-btn ${activeTab === 'leaderboard' ? 'game-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          <span className="live-dot" />
          Leaderboard ({leaderboard.length})
        </button>
      </div>

      {activeTab === 'draw' ? (
        /* ---- Draw Tab ---- */
        <div className="game-main">
          <div className="game-panel game-panel--left">
            <WordPool
              words={wordPool}
              wordDifficulty={wordDifficulty}
              selectedWord={selectedWord}
              completedWords={completedWords}
              onSelectWord={handleSelectWord}
            />
          </div>

          <div className="game-panel game-panel--center">
            <DrawingCanvas
              selectedWord={selectedWord}
              onSubmit={handleSubmit}
              disabled={timeRemaining <= 0}
              hintsRemaining={hintsRemaining}
              hintWord={hintWord}
              onUseHint={actions.useHint}
            />
          </div>

          <div className="game-panel game-panel--right">
            <Leaderboard leaderboard={leaderboard} myPlayerId={myPlayerId} />
          </div>
        </div>
      ) : (
        /* ---- Leaderboard Tab ---- */
        <div className="leaderboard-tab-view">
          <div className="leaderboard-tab-header">
            Live Rankings
          </div>
          {leaderboard.length === 0 ? (
            <div style={{ color: '#4A5568', textAlign: 'center', padding: '40px' }}>
              No players yet...
            </div>
          ) : (
            leaderboard.map((player, index) => (
              <div
                key={player.id}
                className={`leaderboard-full-row ${player.id === myPlayerId ? 'leaderboard-full-row--me' : ''}`}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <span className={`leaderboard-full-row__rank ${index < 3 ? 'leaderboard-full-row__rank--top' : ''}`}>
                  {index < 3 ? RANK_ICONS[index] : `#${index + 1}`}
                </span>
                <span className="leaderboard-full-row__name">
                  {player.name}
                  {player.id === myPlayerId && (
                    <span style={{ color: '#FF6B2B', marginLeft: 6, fontSize: 11 }}>(you)</span>
                  )}
                </span>
                <span className="leaderboard-full-row__words">
                  {player.completedWords?.length || 0} words
                </span>
                <span className="leaderboard-full-row__score">
                  {player.score} pts
                </span>
              </div>
            ))
          )}
        </div>
      )}

      <AIFeedback results={drawingResults} />
    </div>
  );
}
