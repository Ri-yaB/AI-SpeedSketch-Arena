import React, { useState, useEffect } from 'react';

const MEDALS = ['🥇', '🥈', '🥉'];

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function BattleLeaderboardPage({ socketRef }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  function fetchAll() {
    const s = socketRef?.current;
    if (!s) return;
    setLoading(true);
    s.emit('get-all-battle-results', {}, (res) => {
      setLoading(false);
      if (res?.success) setResults(res.results || []);
    });
  }

  useEffect(() => {
    fetchAll();
  }, [socketRef]); // eslint-disable-line

  return (
    <div className="blb-page">
      <div className="blb-page__header">
        <div className="blb-page__title">⚔️ Battle Leaderboard</div>
        <p className="blb-page__subtitle">All finished battle rooms, most recent first</p>
      </div>

      {loading && (
        <div className="blb-loading">
          <div className="lobby-loading__spinner" />
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="blb-empty">No battle rooms finished yet. Start a battle to see results here!</div>
      )}

      {!loading && results.map(result => (
        <div key={result.code} className="blb-result">
          {/* Room header */}
          <div className="blb-result__header">
            <span className="blb-result__code">Room {result.code}</span>
            <span className="blb-result__time">{timeAgo(result.endedAt)}</span>
          </div>

          {/* Rankings table */}
          <div className="blb-rankings">
            <div className="blb-rankings__head">
              <span className="blb-rankings__col-rank">Rank</span>
              <span className="blb-rankings__col-name">Player</span>
              <span className="blb-rankings__col-score">Score</span>
              <span className="blb-rankings__col-rounds">Rounds Won</span>
            </div>
            {result.players.map((p, i) => (
              <div
                key={p.id}
                className={`blb-rankings__row ${i < 3 ? `blb-rankings__row--top${i + 1}` : ''}`}
              >
                <span className="blb-rankings__col-rank">
                  {i < 3 ? MEDALS[i] : `#${i + 1}`}
                </span>
                <span className="blb-rankings__col-name">{p.name}</span>
                <span className="blb-rankings__col-score">{p.score} pts</span>
                <span className="blb-rankings__col-rounds">
                  {Object.values(result.wordWinners || {}).filter(w => w === p.id).length}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
