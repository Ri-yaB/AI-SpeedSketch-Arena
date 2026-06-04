import React, { useEffect, useRef, useState } from 'react';

const RANK_ICONS = ['🥇', '🥈', '🥉'];

/**
 * Leaderboard — live-updated sorted player rankings.
 * Props:
 *   leaderboard: Array<{ id, name, score, completedWords }>
 *   myPlayerId: string
 */
export default function Leaderboard({ leaderboard, myPlayerId }) {
  const [animatingIds, setAnimatingIds] = useState(new Set());
  const prevScores = useRef({});

  useEffect(() => {
    const newAnimating = new Set();
    for (const player of leaderboard) {
      const prev = prevScores.current[player.id];
      if (prev !== undefined && prev !== player.score) {
        newAnimating.add(player.id);
      }
    }

    if (newAnimating.size > 0) {
      setAnimatingIds(newAnimating);
      const timer = setTimeout(() => setAnimatingIds(new Set()), 600);
      // Update prev scores
      for (const player of leaderboard) {
        prevScores.current[player.id] = player.score;
      }
      return () => clearTimeout(timer);
    }

    for (const player of leaderboard) {
      prevScores.current[player.id] = player.score;
    }
  }, [leaderboard]);

  return (
    <div className="leaderboard">
      <div className="leaderboard__header">
        <span className="leaderboard__title">Leaderboard</span>
      </div>
      <div className="leaderboard__list">
        {leaderboard.length === 0 && (
          <div className="leaderboard__empty">Waiting for players...</div>
        )}
        {leaderboard.map((player, index) => (
          <div
            key={player.id}
            className={[
              'leaderboard__row',
              player.id === myPlayerId ? 'leaderboard__row--me' : '',
              animatingIds.has(player.id) ? 'leaderboard__row--score-up' : '',
            ].join(' ')}
          >
            <span className="leaderboard__rank">
              {index < 3 ? RANK_ICONS[index] : `#${index + 1}`}
            </span>
            <span className="leaderboard__name">
              {player.name}
              {player.id === myPlayerId && <span className="leaderboard__you"> (you)</span>}
            </span>
            <span className={`leaderboard__score ${animatingIds.has(player.id) ? 'score-flash' : ''}`}>
              {player.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
