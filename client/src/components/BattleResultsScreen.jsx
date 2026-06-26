import React from 'react';
import DHSLogo from './DHSLogo.jsx';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function BattleResultsScreen({ battleState, myPlayerId, onPlayAgain, onGoHome }) {
  const { finalPlayers, finalWordWinners, wordPool, wordDifficulty, finalSubmissions } = battleState;

  const me = finalPlayers.find(p => p.id === myPlayerId);

  return (
    <div className="results-screen battle-results">
      <div className="results-screen__inner">

        <div className="results-title">
          <span className="battle-results__icon">⚔️</span>{' '}
          <span className="results-title__glow">Battle Results</span>
        </div>

        {/* Podium */}
        {finalPlayers.length > 0 && (
          <div className="podium">
            {finalPlayers.slice(0, 3).map((p, i) => {
              const cls = ['gold', 'silver', 'bronze'][i];
              return (
                <div key={p.id} className={`podium-slot podium-slot--${cls}`}>
                  <div className="podium-slot__medal">{MEDALS[i]}</div>
                  <div className="podium-slot__name">
                    {p.name}
                    {p.id === myPlayerId && <span className="podium-slot__you"> (you)</span>}
                  </div>
                  <div className="podium-slot__score">{p.score} pts</div>
                  <div className="podium-slot__label">{['1st', '2nd', '3rd'][i]} Place</div>
                  <div className="podium-slot__block" />
                </div>
              );
            })}
          </div>
        )}

        {/* Full standings if >3 */}
        {finalPlayers.length > 3 && (
          <div className="results-rest">
            {finalPlayers.slice(3).map((p) => (
              <div key={p.id} className={`results-rest__row ${p.id === myPlayerId ? 'results-rest__row--me' : ''}`}>
                <span className="results-rest__rank">#{p.rank}</span>
                <span className="results-rest__name">{p.name}</span>
                <span className="results-rest__score">{p.score} pts</span>
              </div>
            ))}
          </div>
        )}

        {/* Per-word breakdown */}
        <div className="battle-breakdown">
          <div className="battle-breakdown__title">Word-by-Word Results</div>
          <div className="battle-breakdown__grid">
            {wordPool.map(word => {
              const winner = finalWordWinners[word];
              const diff   = wordDifficulty[word];
              const pts    = diff === 'hard' ? 4 : diff === 'medium' ? 3 : 2;
              const subs   = finalSubmissions[word] || {};
              const winnerPlayer = finalPlayers.find(p => p.id === winner);
              const iWon   = winner === myPlayerId;
              const isTie  = winner === 'tie';

              return (
                <div key={word} className={`battle-word-row ${iWon ? 'battle-word-row--won' : ''}`}>
                  <div className="battle-word-row__left">
                    <span className={`word-card__diff word-card__diff--${diff}`}>{diff}</span>
                    <span className="battle-word-row__word">{word}</span>
                    <span className="battle-word-row__pts">+{pts}pt</span>
                  </div>
                  <div className="battle-word-row__right">
                    {isTie ? (
                      <span className="battle-word-row__result battle-word-row__result--tie">🤝 Tie</span>
                    ) : winner && winnerPlayer ? (
                      <span className={`battle-word-row__result ${iWon ? 'battle-word-row__result--won' : 'battle-word-row__result--lost'}`}>
                        {iWon ? '🏆' : ''} {winnerPlayer.name}
                        {' '}
                        <span className="battle-word-row__conf">
                          {Math.round((subs[winner]?.confidence ?? 0) * 100)}%
                        </span>
                      </span>
                    ) : Object.keys(subs).length > 0 ? (
                      <span className="battle-word-row__result battle-word-row__result--none">
                        No winner — best {Math.round(Math.max(0, ...Object.values(subs).map(s => s.confidence || 0)) * 100)}%
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

        {/* My summary */}
        {me && (
          <div className="my-stats">
            <div className="my-stats__title">Your Battle Stats</div>
            <div className="my-stats__grid">
              <div className="stat-card">
                <div className="stat-card__value">{me.score}</div>
                <div className="stat-card__label">Points</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__value">#{me.rank}</div>
                <div className="stat-card__label">Rank</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__value">
                  {Object.values(finalWordWinners).filter(w => w === myPlayerId).length}
                </div>
                <div className="stat-card__label">Words Won</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__value">
                  {Object.values(finalSubmissions).filter(s => s[myPlayerId]).length}
                </div>
                <div className="stat-card__label">Submitted</div>
              </div>
            </div>
          </div>
        )}

        <div className="results-actions">
          <button className="btn btn--primary btn--large" onClick={onPlayAgain}>
            ⚔️ Play Again
          </button>
          <button className="btn btn--ghost btn--large" onClick={onGoHome}>
            🏠 Home
          </button>
        </div>
      </div>
    </div>
  );
}
