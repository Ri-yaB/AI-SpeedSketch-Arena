import React, { useState, useEffect } from 'react';
import DHSLogo from './DHSLogo.jsx';

const MEDALS = ['🥇', '🥈', '🥉'];

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function BattleLeaderboardPage({ socketRef, defaultCode }) {
  const [inputCode, setInputCode] = useState(defaultCode || '');
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // Auto-load when defaultCode is provided (e.g., user just finished a battle)
  useEffect(() => {
    if (defaultCode) {
      setInputCode(defaultCode);
      fetchLeaderboard(defaultCode);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCode]);

  function fetchLeaderboard(code) {
    const s = socketRef?.current;
    if (!s) return;
    const trimmed = (code || inputCode).trim().toUpperCase();
    if (!trimmed) { setError('Enter a room code to look up.'); return; }

    setLoading(true);
    setError('');
    setResult(null);

    s.emit('get-battle-leaderboard', { roomCode: trimmed }, (res) => {
      setLoading(false);
      if (res?.success) {
        setResult(res.result);
      } else {
        setError(res?.error || 'Room not found.');
      }
    });
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchLeaderboard();
  };

  return (
    <div className="blb-page">
      <div className="blb-page__header">
        <DHSLogo height={32} />
        <div className="blb-page__title">⚔️ Battle Leaderboard</div>
        <p className="blb-page__subtitle">Look up a finished battle room by its code</p>
      </div>

      {/* Room code search */}
      <form className="blb-search" onSubmit={handleSubmit}>
        <input
          className="blb-search__input"
          type="text"
          placeholder="Enter room code (e.g. 42)"
          value={inputCode}
          onChange={e => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 2))}
          maxLength={2}
          inputMode="numeric"
          spellCheck={false}
        />
        <button className="blb-search__btn btn btn--primary" type="submit" disabled={loading}>
          {loading ? 'Loading…' : 'Search'}
        </button>
      </form>

      {error && <div className="blb-error">{error}</div>}

      {result && (
        <div className="blb-result">
          {/* Room header */}
          <div className="blb-result__header">
            <span className="blb-result__code">{result.code}</span>
            <span className="blb-result__time">{timeAgo(result.endedAt)}</span>
          </div>

          {/* Podium */}
          {result.players.length > 0 && (
            <div className="podium">
              {result.players.slice(0, 3).map((p, i) => {
                const cls = ['gold', 'silver', 'bronze'][i];
                return (
                  <div key={p.id} className={`podium-slot podium-slot--${cls}`}>
                    <div className="podium-slot__medal">{MEDALS[i]}</div>
                    <div className="podium-slot__name">{p.name}</div>
                    <div className="podium-slot__score">{p.score} pts</div>
                    <div className="podium-slot__label">{['1st', '2nd', '3rd'][i]} Place</div>
                    <div className="podium-slot__block" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Full standings if >3 */}
          {result.players.length > 3 && (
            <div className="results-rest">
              {result.players.slice(3).map((p, i) => (
                <div key={p.id} className="results-rest__row">
                  <span className="results-rest__rank">#{i + 4}</span>
                  <span className="results-rest__name">{p.name}</span>
                  <span className="results-rest__score">{p.score} pts</span>
                </div>
              ))}
            </div>
          )}

          {/* Word-by-word breakdown */}
          <div className="battle-breakdown">
            <div className="battle-breakdown__title">Word-by-Word Results</div>
            <div className="battle-breakdown__grid">
              {result.wordPool.map(word => {
                const winner = result.wordWinners[word];
                const diff   = result.wordDifficulty[word];
                const pts    = diff === 'hard' ? 4 : 2;
                const subs   = result.submissions[word] || {};
                const winnerPlayer = result.players.find(p => p.id === winner);
                const isTie  = winner === 'tie';

                return (
                  <div key={word} className="battle-word-row">
                    <div className="battle-word-row__left">
                      <span className={`word-card__diff word-card__diff--${diff}`}>{diff}</span>
                      <span className="battle-word-row__word">{word}</span>
                      <span className="battle-word-row__pts">+{pts}pt</span>
                    </div>
                    <div className="battle-word-row__right">
                      {isTie ? (
                        <span className="battle-word-row__result battle-word-row__result--tie">🤝 Tie</span>
                      ) : winner && winnerPlayer ? (
                        <span className="battle-word-row__result battle-word-row__result--won">
                          🏆 {winnerPlayer.name}{' '}
                          <span className="battle-word-row__conf">
                            {Math.round((subs[winner]?.confidence ?? 0) * 100)}%
                          </span>
                        </span>
                      ) : (
                        <span className="battle-word-row__result battle-word-row__result--none">— No one drew this</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
