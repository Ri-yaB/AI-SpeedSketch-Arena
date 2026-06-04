import React, { useEffect, useState } from 'react';
import DHSLogo from './DHSLogo.jsx';

const RANK_ICONS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage({ socketRef }) {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    const s = socketRef?.current;
    if (!s) return;

    s.emit('get-alltime-leaderboard', (res) => {
      if (res?.leaderboard) setEntries(res.leaderboard);
    });

    const onUpdate = ({ leaderboard }) => setEntries(leaderboard);
    s.on('alltime-leaderboard', onUpdate);

    return () => s.off('alltime-leaderboard', onUpdate);
  }, [socketRef]);

  return (
    <div className="lb-page">
      <div className="lb-page__header">
        <DHSLogo height={32} />
        <div className="lb-page__title">Leaderboard</div>
      </div>

      <div className="lb-page__body">
        {entries.length === 0 ? (
          <div className="lb-page__empty">No scores yet — be the first to play!</div>
        ) : (
          <div className="lb-page__list">
            <div className="lb-page__col-headers">
              <span style={{ minWidth: 48 }}></span>
              <span style={{ flex: 1 }}>Player</span>
              <span className="lb-page__col-label">Score</span>
              <span className="lb-page__col-label">Words</span>
            </div>
            {entries.map((entry, index) => (
              <div
                key={entry.email || entry.name}
                className={`lb-page__row ${index < 3 ? `lb-page__row--top${index + 1}` : ''}`}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <span className="lb-page__row-rank">
                  {index < 3 ? RANK_ICONS[index] : `#${index + 1}`}
                </span>
                <span className="lb-page__row-name">
                  {entry.name}
                  {entry.email && <span className="lb-page__row-email">{entry.email}</span>}
                </span>
                <span className="lb-page__row-score">{entry.bestScore} pts</span>
                <span className="lb-page__row-words">{entry.completedWords}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
