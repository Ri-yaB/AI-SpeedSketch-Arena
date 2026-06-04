import React from 'react';
import DHSLogo from './DHSLogo.jsx';

const STEPS = [
  {
    step: '01',
    icon: '✍️',
    title: 'Enter your name & email',
    desc: 'Join the game from the home screen. Your score will be tracked on the live leaderboard.',
  },
  {
    step: '02',
    icon: '🎨',
    title: 'Pick a word to draw',
    desc: 'Choose any word from your pool on the left. Each word has a different point value based on difficulty.',
  },
  {
    step: '03',
    icon: '🖌️',
    title: 'Draw it on the canvas',
    desc: 'Use the brush, shapes, and color tools to sketch your word. You have the full 90-second timer to draw as many as possible.',
  },
  {
    step: '04',
    icon: '🤖',
    title: 'AI judges your drawing',
    desc: 'Claude AI analyses your sketch and decides if it matches the word. Correct? You score points instantly!',
  },
  {
    step: '05',
    icon: '💡',
    title: 'Use hints wisely',
    desc: 'You get 2 hints per game. A hint auto-selects a word and shows you a reference image to draw from.',
  },
  {
    step: '06',
    icon: '🚫',
    title: "Don't write the word",
    desc: 'Writing the word on the canvas is detected and costs you 1 point penalty. Draw, don\'t spell!',
  },
];

const SCORING = [
  { label: 'Easy / Medium correct', points: '+2 pts' },
  { label: 'Hard correct', points: '+4 pts' },
  { label: 'Writing word detected', points: '−1 pt' },
];

export default function InstructionsPage() {
  return (
    <div className="inst-page">
      <div className="inst-page__header">
        <DHSLogo height={32} />
        <div className="inst-page__title">How to Play</div>
        <p className="inst-page__subtitle">
          AI SpeedSketch Arena — DataHack Summit 2026
        </p>
      </div>

      <div className="inst-page__body">
        <div className="inst-steps">
          {STEPS.map(({ step, icon, title, desc }) => (
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
            {SCORING.map(({ label, points }) => (
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
          <span>Pro tip: Start with hard words while your energy is high — they're worth more points!</span>
        </div>
      </div>
    </div>
  );
}
