import React, { useState, useCallback, useEffect, useRef } from 'react';
import DrawingCanvas from './DrawingCanvas.jsx';
import WordPool from './WordPool.jsx';
import Leaderboard from './Leaderboard.jsx';
import AIFeedback from './AIFeedback.jsx';
import Confetti from './Confetti.jsx';
import DHSLogo from './DHSLogo.jsx';

const RANK_ICONS = ['🥇', '🥈', '🥉'];

const STREAK_LABELS = {
  2: { text: '🔥 On Fire!',    color: '#f97316' },
  3: { text: '🔥🔥 Hot Streak!', color: '#ef4444' },
  5: { text: '💥 UNSTOPPABLE!', color: '#a855f7' },
};

const DIFF_COLORS = { easy: '#15803D', medium: '#B45309', hard: '#DC2626' };

function WordSelectModal({ words, wordDifficulty, completedWords, onSelect }) {
  const available = words.filter(w => !completedWords.includes(w));
  const groups = { easy: [], medium: [], hard: [] };
  for (const w of available) groups[wordDifficulty[w] || 'easy'].push(w);

  return (
    <div className="word-modal-overlay">
      <div className="word-modal">
        <div className="word-modal__title">Choose a word to draw</div>
        <div className="word-modal__subtitle">Pick any word. Canvas unlocks once you choose.</div>
        {['easy', 'medium', 'hard'].map(diff => groups[diff].length > 0 && (
          <div key={diff} className="word-modal__group">
            <div className="word-modal__group-label" style={{ color: DIFF_COLORS[diff] }}>
              {diff} · {diff === 'easy' ? '2 pts' : diff === 'medium' ? '3 pts' : '4 pts'}
            </div>
            <div className="word-modal__words">
              {groups[diff].map(w => (
                <button key={w} className="word-modal__btn" onClick={() => onSelect(w)}>
                  {w}
                </button>
              ))}
            </div>
          </div>
        ))}
        {available.length === 0 && (
          <div className="word-modal__done">All words completed!</div>
        )}
      </div>
    </div>
  );
}

export default function GameScreen({ state, myPlayerId, actions }) {
  const {
    timeRemaining, myScore, selectedWord, completedWords,
    wordPool, wordDifficulty, leaderboard, drawingResults, hintsRemaining, hintWord,
    pendingJudgments,
  } = state;

  const [activeTab, setActiveTab] = useState('draw');
  const [showWordModal, setShowWordModal] = useState(true);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [scorePops, setScorePops] = useState([]); // { id, value }
  const [streak, setStreak] = useState(0);
  const [streakBanner, setStreakBanner] = useState(null);
  const streakTimerRef = useRef(null);
  const prevResultRef = useRef(null);
  const popIdRef = useRef(0);

  const isPanic = timeRemaining <= 10 && timeRemaining > 0;
  const isUrgent = timeRemaining <= 15;

  // React to new drawing results
  useEffect(() => {
    if (!drawingResults || drawingResults.length === 0) return;
    const latest = drawingResults[0];
    if (latest === prevResultRef.current) return;
    prevResultRef.current = latest;

    if (latest.correct) {
      // Confetti
      setConfettiTrigger(t => t + 1);

      // Score pop
      const popId = ++popIdRef.current;
      const pts = latest.points || 2;
      setScorePops(prev => [...prev, { id: popId, value: `+${pts}` }]);
      setTimeout(() => setScorePops(prev => prev.filter(p => p.id !== popId)), 1200);

      // Streak
      setStreak(s => {
        const next = s + 1;
        const label = next >= 5 ? STREAK_LABELS[5] : STREAK_LABELS[next] || null;
        if (label) {
          clearTimeout(streakTimerRef.current);
          setStreakBanner(label);
          streakTimerRef.current = setTimeout(() => setStreakBanner(null), 2200);
        }
        return next;
      });
    } else {
      setStreak(0);
    }
  }, [drawingResults[0]]);

  const handleSubmit = useCallback(({ word, imageData, textPenalty }) => {
    actions.submitDrawing({ word, imageData, textPenalty });
  }, [actions]);

  const handleSelectWord = useCallback((word) => {
    actions.selectWord(word);
    setShowWordModal(false);
  }, [actions]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const timerPct = (timeRemaining / 90) * 100;
  const myRank = leaderboard.findIndex(p => p.id === myPlayerId) + 1;

  // Re-open modal when a word is submitted (selectedWord clears) and words remain
  const prevWordRef = useRef(selectedWord);
  useEffect(() => {
    if (prevWordRef.current && !selectedWord && timeRemaining > 0) {
      setShowWordModal(true);
    }
    prevWordRef.current = selectedWord;
  }, [selectedWord, timeRemaining]);

  const needsWordPick = showWordModal && !selectedWord && timeRemaining > 0;

  return (
    <div className={`game-screen ${isPanic ? 'game-screen--panic' : ''}`}>
      <Confetti trigger={confettiTrigger} />

      {needsWordPick && (
        <WordSelectModal
          words={wordPool}
          wordDifficulty={wordDifficulty}
          completedWords={completedWords}
          onSelect={handleSelectWord}
        />
      )}

      {/* Floating +2 score pops */}
      <div className="score-pops">
        {scorePops.map(p => (
          <div key={p.id} className="score-pop">{p.value}</div>
        ))}
      </div>

      {/* Streak banner */}
      {streakBanner && (
        <div className="streak-banner" style={{ color: streakBanner.color }}>
          {streakBanner.text}
        </div>
      )}

      {/* Top bar */}
      <div className="game-topbar">
        <div className="game-topbar__left">
          <div className="topbar-dhs-logo">
            <DHSLogo height={16} />
          </div>
          <div className="game-topbar__divider" />
          <div className="game-brand">SpeedSketch Arena</div>
          {streak >= 2 && (
            <div className="streak-chip">🔥 {streak}x</div>
          )}
        </div>

        <div className="game-topbar__center">
          <div className={`game-timer ${isUrgent ? 'game-timer--urgent' : ''} ${isPanic ? 'game-timer--panic' : ''}`}>
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
              disabled={timeRemaining <= 0 || !selectedWord}
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
        <div className="leaderboard-tab-view">
          <div className="leaderboard-tab-header">Live Rankings</div>
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
                    <span style={{ color: '#2D5BE3', marginLeft: 6, fontSize: 11 }}>(you)</span>
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

      {pendingJudgments > 0 && (
        <div className="ai-judging-pill">
          <span className="ai-judging-pill__spinner" />
          🤖 AI is judging your drawing…
        </div>
      )}

      <AIFeedback results={drawingResults} />
    </div>
  );
}
