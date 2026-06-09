import React, { useState, useCallback, useEffect, useRef } from 'react';
import DrawingCanvas from './DrawingCanvas.jsx';
import Confetti from './Confetti.jsx';
import DHSLogo from './DHSLogo.jsx';

const RANK_ICONS = ['🥇', '🥈', '🥉'];

export default function BattleGameScreen({ battleState, myPlayerId, battleActions }) {
  const {
    players, wordPool, wordDifficulty, timeRemaining,
    selectedWord, mySubmittedWords, myResults,
    submissionStatus, wordWinners,
  } = battleState;

  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const prevResultRef = useRef(null);

  const isPanic  = timeRemaining <= 10 && timeRemaining > 0;
  const isUrgent = timeRemaining <= 15;

  const timerPct = (timeRemaining / 90) * 100;
  const myScore  = players.find(p => p.id === myPlayerId)?.score ?? 0;
  const myRank   = [...players].sort((a,b) => b.score - a.score).findIndex(p => p.id === myPlayerId) + 1;
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // Toast new word-winners
  useEffect(() => {
    const latest = Object.entries(wordWinners).pop();
    if (!latest) return;
    const [word, info] = latest;
    if (!info) return;
    const id = ++toastIdRef.current;
    const isMe = info.winnerId === myPlayerId;
    if (isMe) setConfettiTrigger(t => t + 1);
    setToasts(prev => [{ id, word, ...info, isMe }, ...prev].slice(0, 4));
    const t = setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 4000);
    return () => clearTimeout(t);
  }, [Object.keys(wordWinners).length]); // eslint-disable-line

  const handleSubmit = useCallback(({ word, imageData, textPenalty }) => {
    battleActions.submitDrawing({ word, imageData, textPenalty });
  }, [battleActions]);

  const handleSelectWord = useCallback((word) => {
    battleActions.selectWord(word);
  }, [battleActions]);

  const completedSet = new Set(mySubmittedWords);

  return (
    <div className={`game-screen battle-game-screen ${isPanic ? 'game-screen--panic' : ''}`}>
      <Confetti trigger={confettiTrigger} />

      {/* Word-winner toasts */}
      <div className="battle-toasts">
        {toasts.map(t => (
          <div key={t.id} className={`battle-toast ${t.isMe ? 'battle-toast--win' : ''}`}>
            {t.isTie ? (
              <>🤝 Tie on <strong>{t.word}</strong>! ({t.topConfidence}%)</>
            ) : t.winnerId ? (
              t.isMe
                ? <>🏆 You won <strong>{t.word}</strong>! ({t.topConfidence}%)</>
                : <><strong>{t.winnerName}</strong> won <strong>{t.word}</strong> ({t.topConfidence}%)</>
            ) : (
              <>No one submitted <strong>{t.word}</strong></>
            )}
          </div>
        ))}
      </div>

      {/* AI result toast — always visible (floats over canvas on iPad) */}
      {myResults[0] && (
        <div className={`battle-ai-toast ${myResults[0].correct ? 'battle-ai-toast--ok' : 'battle-ai-toast--fail'}`}>
          <span className="battle-ai-toast__icon">{myResults[0].correct ? '✓' : '✗'}</span>
          <div className="battle-ai-toast__body">
            <div className="battle-ai-toast__word">
              {myResults[0].word} · {Math.round(myResults[0].confidence * 100)}%
            </div>
            <div className="battle-ai-toast__msg">{myResults[0].funnyMessage}</div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="game-topbar">
        <div className="game-topbar__left">
          <div className="topbar-dhs-logo"><DHSLogo height={16} /></div>
          <div className="game-topbar__divider" />
          <div className="game-brand">
            <span className="topbar-brand-ai">AI</span> SpeedSketch Arena
          </div>
          <span className="battle-mode-chip">⚔️ Battle</span>
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
        </div>
      </div>

      {/* Main layout */}
      <div className="game-main battle-game-main">
        {/* Left — Word pool */}
        <div className="game-panel game-panel--left">
          <div className="word-pool">
            <div className="word-pool__header">
              <span className="word-pool__title">Shared Words</span>
              <span className="word-pool__count">{mySubmittedWords.length}/{wordPool.length}</span>
            </div>
            <div className="word-pool__grid battle-word-grid">
              {wordPool.map(word => {
                const submitted  = completedSet.has(word);
                const isSelected = selectedWord === word;
                const diff       = wordDifficulty[word];
                const status     = submissionStatus[word] || { submittedCount: 0, totalPlayers: players.length };
                const winner     = wordWinners[word];
                const iWon       = winner?.winnerId === myPlayerId;

                return (
                  <button
                    key={word}
                    className={[
                      'word-card battle-word-card',
                      isSelected  ? 'word-card--selected' : '',
                      submitted   ? 'word-card--completed' : '',
                      iWon        ? 'battle-word-card--won' : '',
                      winner && !iWon ? 'battle-word-card--lost' : '',
                    ].join(' ')}
                    onClick={() => { if (!submitted) handleSelectWord(word); }}
                    disabled={submitted}
                    title={submitted ? `${word} — submitted` : `Draw: ${word}`}
                  >
                    {submitted && !winner && <span className="word-card__check">✓</span>}
                    {iWon        && <span className="word-card__check">🏆</span>}
                    {winner && !iWon && winner.winnerId && <span className="word-card__check">✗</span>}
                    <span className="word-card__text">{word}</span>
                    {diff && !submitted && (
                      <span className={`word-card__diff word-card__diff--${diff}`}>{diff[0].toUpperCase()}</span>
                    )}
                    {/* Submission counter */}
                    <span className="battle-word-count">
                      {status.submittedCount}/{status.totalPlayers}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center — Canvas */}
        <div className="game-panel game-panel--center">
          <DrawingCanvas
            selectedWord={selectedWord}
            onSubmit={handleSubmit}
            disabled={timeRemaining <= 0}
            hintsRemaining={0}
            hintWord={null}
            onUseHint={() => {}}
          />
        </div>

        {/* Right — Live standings */}
        <div className="game-panel game-panel--right">
          <div className="leaderboard">
            <div className="leaderboard__header">
              <div className="leaderboard__title">⚔️ Standings</div>
            </div>
            <div className="leaderboard__list">
              {sortedPlayers.map((p, i) => (
                <div
                  key={p.id}
                  className={`leaderboard__row ${p.id === myPlayerId ? 'leaderboard__row--me' : ''}`}
                >
                  <span className="leaderboard__rank">
                    {i < 3 ? RANK_ICONS[i] : `#${i + 1}`}
                  </span>
                  <span className="leaderboard__name">
                    {p.name}
                    {p.id === myPlayerId && <span className="leaderboard__you"> (you)</span>}
                  </span>
                  <span className="leaderboard__score">{p.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Latest AI result for me */}
          {myResults[0] && (
            <div className={`battle-my-result ${myResults[0].correct ? 'battle-my-result--ok' : 'battle-my-result--fail'}`}>
              <div className="battle-my-result__word">{myResults[0].word}</div>
              <div className="battle-my-result__conf">
                {Math.round(myResults[0].confidence * 100)}% confidence
              </div>
              <div className="battle-my-result__msg">{myResults[0].funnyMessage}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
