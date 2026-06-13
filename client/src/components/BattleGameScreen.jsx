import React, { useState, useCallback, useEffect, useRef } from 'react';
import DrawingCanvas from './DrawingCanvas.jsx';
import Confetti from './Confetti.jsx';
import DHSLogo from './DHSLogo.jsx';

const RANK_ICONS = ['🥇', '🥈', '🥉'];

export default function BattleGameScreen({ battleState, myPlayerId, battleActions }) {
  const {
    players, currentRound, totalRounds, currentWord, currentDiff,
    roundTimeRemaining, mySubmittedWords, myResults,
    submissionStatus, wordWinners,
  } = battleState;

  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [aiToastVisible, setAiToastVisible] = useState(false);
  const toastIdRef = useRef(0);
  const aiToastTimerRef = useRef(null);

  const isPanic  = roundTimeRemaining <= 3 && roundTimeRemaining > 0;
  const isUrgent = roundTimeRemaining <= 5;

  const myScore  = players.find(p => p.id === myPlayerId)?.score ?? 0;
  const myRank   = [...players].sort((a,b) => b.score - a.score).findIndex(p => p.id === myPlayerId) + 1;
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const hasSubmitted = currentWord && mySubmittedWords.includes(currentWord);
  const roundStatus  = currentWord && submissionStatus[currentWord];
  const timerPct     = (roundTimeRemaining / 10) * 100;

  // Auto-dismiss AI toast after 3s
  useEffect(() => {
    if (!myResults[0]) return;
    setAiToastVisible(true);
    clearTimeout(aiToastTimerRef.current);
    aiToastTimerRef.current = setTimeout(() => setAiToastVisible(false), 3000);
    return () => clearTimeout(aiToastTimerRef.current);
  }, [myResults[0]?.id]); // eslint-disable-line

  // Word-winner toasts
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

      {/* AI result toast */}
      {aiToastVisible && myResults[0] && (
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
          <span className="battle-mode-chip">⚔️ Battle</span>
          {currentDiff && (
            <span className={`word-card__diff word-card__diff--${currentDiff}`}>
              {currentDiff[0].toUpperCase()}
            </span>
          )}
        </div>

        <div className="game-topbar__center">
          <div className="battle-round-indicator">
            <span className="battle-round-indicator__label">Round</span>
            <span className="battle-round-indicator__num">{currentRound}/{totalRounds}</span>
          </div>
          <div className={`game-timer ${isUrgent ? 'game-timer--urgent' : ''} ${isPanic ? 'game-timer--panic' : ''}`}>
            {isUrgent && <span className="game-timer__pulse" />}
            <span className="game-timer__value">0:{String(roundTimeRemaining).padStart(2, '0')}</span>
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
        {/* Center — Canvas (full width on mobile) */}
        <div className="game-panel game-panel--center">
          {hasSubmitted && (
            <div className="battle-submitted-overlay">
              <div className="battle-submitted-overlay__icon">✓</div>
              <div className="battle-submitted-overlay__text">Submitted!</div>
              <div className="battle-submitted-overlay__sub">
                {roundStatus
                  ? `${roundStatus.submittedCount}/${roundStatus.totalPlayers} players done`
                  : 'Waiting for others…'}
              </div>
            </div>
          )}
          <DrawingCanvas
            key={currentRound}
            selectedWord={currentWord}
            onSubmit={handleSubmit}
            disabled={roundTimeRemaining <= 0 || hasSubmitted}
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
