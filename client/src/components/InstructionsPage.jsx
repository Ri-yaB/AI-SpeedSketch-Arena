import React, { useState } from 'react';
import DHSLogo from './DHSLogo.jsx';

const SOLO_STEPS = [
  {
    step: '01', icon: '✍️',
    title: 'Enter your name & email',
    desc: 'Join the global game from the home screen. Your score is tracked on the live leaderboard.',
  },
  {
    step: '02', icon: '🎨',
    title: 'Pick a word to draw',
    desc: 'Choose any word from your pool on the left. Easy & Medium words give +2 pts; Hard words give +4 pts.',
  },
  {
    step: '03', icon: '🖌️',
    title: 'Draw it on the canvas',
    desc: 'Use the brush, shapes, and colour tools to sketch your word. You have 90 seconds. Draw as many as you can!',
  },
  {
    step: '04', icon: '🤖',
    title: 'AI judges your drawing',
    desc: 'Claude AI analyses your sketch and decides if it matches the word. Correct? You score points instantly!',
  },
  {
    step: '05', icon: '💡',
    title: 'Use hints wisely',
    desc: 'You get 2 hints per game. A hint auto-selects a word and shows you a reference emoji to draw from.',
  },
  {
    step: '06', icon: '🚫',
    title: "Don't write the word",
    desc: "Writing the word on the canvas is detected and costs you 1 point penalty. Draw, don't spell!",
  },
];

const BATTLE_STEPS = [
  {
    step: '01', icon: '🏠',
    title: 'Create or join a room',
    desc: 'One player creates a room and shares the 6-character code. Up to 8 players can join before the host starts.',
  },
  {
    step: '02', icon: '🃏',
    title: 'Everyone gets the same 5 words',
    desc: 'The host hits Start and all players play the same 5 rounds: 2 Easy, 2 Medium, and 1 Hard word.',
  },
  {
    step: '03', icon: '🖌️',
    title: 'Draw the word in 15 seconds',
    desc: 'Each round you have 15 seconds to draw the word and submit. Run out of time and your drawing is submitted automatically. The AI scores it with a confidence percentage.',
  },
  {
    step: '04', icon: '🏆',
    title: 'Best drawing wins the word',
    desc: 'For each word, the player whose drawing gets the highest AI confidence wins the points. Ties split the points.',
  },
  {
    step: '05', icon: '⚡',
    title: 'Live word-winner announcements',
    desc: "As soon as all players submit a word, the winner is announced in real time - don't wait for the timer!",
  },
  {
    step: '06', icon: '📊',
    title: 'Word-by-word breakdown at the end',
    desc: 'Results show who won each word and with what confidence, so you know exactly where you beat (or lost to) your friends.',
  },
];

const SOLO_SCORING = [
  { label: 'Easy / Medium correct',  points: '+2 pts' },
  { label: 'Hard correct',            points: '+4 pts' },
  { label: 'Writing word detected',   points: '−1 pt'  },
];

const BATTLE_SCORING = [
  { label: 'Win a word (Easy / Medium)', points: '+2 pts' },
  { label: 'Win a word (Hard)',           points: '+4 pts' },
  { label: 'Tie on a word',              points: 'Split' },
  { label: 'Writing word detected',      points: '−1 pt'  },
];

export default function InstructionsPage() {
  const [tab, setTab] = useState('solo');
  const isSolo = tab === 'solo';
  const steps   = isSolo ? SOLO_STEPS   : BATTLE_STEPS;
  const scoring = isSolo ? SOLO_SCORING : BATTLE_SCORING;

  return (
    <div className="inst-page">
      <div className="inst-page__header">
        <DHSLogo height={32} />
        <div className="inst-page__title">How to Play</div>
        <p className="inst-page__subtitle">AI SpeedSketch Arena - DataHack Summit 2026</p>
      </div>

      {/* Mode tabs */}
      <div className="inst-mode-tabs">
        <button
          className={`inst-mode-tab ${isSolo ? 'inst-mode-tab--active' : ''}`}
          onClick={() => setTab('solo')}
        >
          🎮 Solo Mode
        </button>
        <button
          className={`inst-mode-tab inst-mode-tab--battle ${!isSolo ? 'inst-mode-tab--active' : ''}`}
          onClick={() => setTab('battle')}
        >
          ⚔️ Battle Mode
        </button>
      </div>

      <div className="inst-page__body">
        {/* Mode banner */}
        <div className={`inst-mode-banner ${!isSolo ? 'inst-mode-banner--battle' : ''}`}>
          <span className="inst-mode-banner__icon">{isSolo ? '🎮' : '⚔️'}</span>
          <div>
            <div className="inst-mode-banner__name">{isSolo ? 'Solo Mode' : 'Battle Mode'}</div>
            <div className="inst-mode-banner__desc">
              {isSolo
                ? 'Play in the global arena against the AI. Race the clock and climb the live leaderboard.'
                : 'Private rooms, shared words. Draw the same words as your friends - whoever impresses the AI most wins!'}
            </div>
          </div>
        </div>

        <div className="inst-steps">
          {steps.map(({ step, icon, title, desc }) => (
            <div key={step} className="inst-step">
              <div className="inst-step__num">{step}</div>
              <div className="inst-step__icon">{icon}</div>
              <div className="inst-step__content">
                <div className="inst-step__title">{title}</div>
                <div className="inst-step__desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="inst-scoring">
          <div className="inst-scoring__title">Scoring</div>
          <div className="inst-scoring__grid">
            {scoring.map(({ label, points }) => (
              <div key={label} className="inst-scoring__row">
                <span className="inst-scoring__label">{label}</span>
                <span className={`inst-scoring__pts ${points.startsWith('−') ? 'inst-scoring__pts--neg' : ''}`}>
                  {points}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="inst-tip">
          <span className="inst-tip__icon">⚡</span>
          <span>
            {isSolo
              ? 'Pro tip: Start with Hard words while your energy is high - they\'re worth double the points!'
              : 'Pro tip: In Battle Mode, prioritise Hard words - 4 pts if you nail the best drawing!'}
          </span>
        </div>
      </div>
    </div>
  );
}
