import React, { useState, useMemo } from 'react';

/**
 * WordPool — grid of selectable word cards.
 * Props:
 *   words: string[]
 *   selectedWord: string | null
 *   completedWords: string[]
 *   onSelectWord: (word: string) => void
 */
export default function WordPool({ words, selectedWord, completedWords, onSelectWord }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return words;
    const q = search.toLowerCase();
    return words.filter(w => w.toLowerCase().includes(q));
  }, [words, search]);

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
      <div className="word-pool__grid">
        {filtered.map(word => {
          const isCompleted = completedSet.has(word);
          const isSelected = selectedWord === word;
          return (
            <button
              key={word}
              className={[
                'word-card',
                isSelected ? 'word-card--selected' : '',
                isCompleted ? 'word-card--completed' : '',
              ].join(' ')}
              onClick={() => {
                if (!isCompleted) onSelectWord(word);
              }}
              disabled={isCompleted}
              title={isCompleted ? `${word} — already recognized!` : `Draw: ${word}`}
            >
              {isCompleted && <span className="word-card__check">✓</span>}
              <span className="word-card__text">{word}</span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="word-pool__no-results">No words match "{search}"</div>
        )}
      </div>
    </div>
  );
}
