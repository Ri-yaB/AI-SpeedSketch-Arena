import React from 'react';

const PODIUM_CLASSES = ['gold', 'silver', 'bronze'];
const PODIUM_LABELS = ['1st Place', '2nd Place', '3rd Place'];

export default function ResultsScreen({ leaderboard, myPlayerId }) {
  const myStats = leaderboard.find(p => p.id === myPlayerId);
  const accuracy = myStats && myStats.wordsAttempted > 0
    ? Math.round((myStats.completedWords?.length / myStats.wordsAttempted) * 100)
    : 0;

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="results-screen">
      <div className="results-screen__inner">
        <h1 className="results-title">
          <span className="results-title__glow">Game Over!</span>
        </h1>
        <p className="results-subtitle">New game starting in a few seconds...</p>

        <div className="podium">
          {topThree.map((player, index) => (
            <div key={player.id} className={`podium-slot podium-slot--${PODIUM_CLASSES[index]}`}>
              <div className="podium-slot__medal">{['🥇', '🥈', '🥉'][index]}</div>
              <div className="podium-slot__name">
                {player.name}
                {player.id === myPlayerId && <span className="podium-slot__you"> (you)</span>}
              </div>
              <div className="podium-slot__score">{player.score} pts</div>
              <div className="podium-slot__label">{PODIUM_LABELS[index]}</div>
              <div className={`podium-slot__block podium-slot__block--${PODIUM_CLASSES[index]}`} />
            </div>
          ))}
        </div>

        {rest.length > 0 && (
          <div className="results-rest">
            {rest.map((player, i) => (
              <div
                key={player.id}
                className={`results-rest__row ${player.id === myPlayerId ? 'results-rest__row--me' : ''}`}
              >
                <span className="results-rest__rank">#{i + 4}</span>
                <span className="results-rest__name">{player.name}</span>
                <span className="results-rest__score">{player.score} pts</span>
              </div>
            ))}
          </div>
        )}

        {myStats && (
          <div className="my-stats">
            <h3 className="my-stats__title">Your Stats</h3>
            <div className="my-stats__grid">
              <div className="stat-card">
                <div className="stat-card__value">{myStats.score}</div>
                <div className="stat-card__label">Score</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__value">{myStats.wordsAttempted}</div>
                <div className="stat-card__label">Attempts</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__value">{myStats.completedWords?.length || 0}</div>
                <div className="stat-card__label">Recognized</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__value">{accuracy}%</div>
                <div className="stat-card__label">Accuracy</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
