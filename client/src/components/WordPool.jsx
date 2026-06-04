import React, { useState, useMemo } from 'react';

const DIFFICULTY_CONFIG = {
  easy:   { label: 'Easy',   className: 'word-card--easy' },
  medium: { label: 'Medium', className: 'word-card--medium' },
  hard:   { label: 'Hard',   className: 'word-card--hard' },
};

export default function WordPool({ words, wordDifficulty = {}, selectedWord, completedWords, onSelectWord }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'easy' | 'medium' | 'hard'

  const filtered = useMemo(() => {
    return words.filter(w => {
      const matchesSearch = !search.trim() || w.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || wordDifficulty[w] === filter;
      return matchesSearch && matchesFilter;
    });
  }, [words, search, filter, wordDifficulty]);

  const completedSet = useMemo(() => new Set(completedWords), [completedWords]);

  return (
    <div className="word-pool">
      <div className="word-pool__header">
        <span className="word-pool__title">Word Pool</span>
        <span className="word-pool__count">
          {completedWords.length}/{words.length} done
        </span>
      </div>
      <div className="word-pool__search-wrap">
        <input
          className="word-pool__search"
          type="text"
          placeholder="Search words..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="word-pool__filters">
        {['all', 'easy', 'medium', 'hard'].map(f => (
          <button
            key={f}
            className={`word-pool__filter ${filter === f ? 'word-pool__filter--active' : ''} ${f !== 'all' ? `word-pool__filter--${f}` : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      <div className="word-pool__grid">
        {filtered.map(word => {
          const isCompleted = completedSet.has(word);
          const isSelected = selectedWord === word;
          const diff = wordDifficulty[word];
          const diffConfig = DIFFICULTY_CONFIG[diff];
          return (
            <button
              key={word}
              className={[
                'word-card',
                diffConfig ? diffConfig.className : '',
                isSelected ? 'word-card--selected' : '',
                isCompleted ? 'word-card--completed' : '',
              ].join(' ')}
              onClick={() => { if (!isCompleted) onSelectWord(word); }}
              disabled={isCompleted}
              title={isCompleted ? `${word} — already recognized!` : `Draw: ${word}`}
            >
              {isCompleted && <span className="word-card__check">✓</span>}
              <span className="word-card__text">{word}</span>
              {diffConfig && !isCompleted && (
                <span className={`word-card__diff word-card__diff--${diff}`}>{diffConfig.label}</span>
              )}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="word-pool__no-results">No words match</div>
        )}
      </div>
    </div>
  );
}
