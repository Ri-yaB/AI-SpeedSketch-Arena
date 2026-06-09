import React, { useEffect, useState } from 'react';

let toastIdCounter = 0;

function playSound(correct) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (correct) {
      // Bright ascending chime: C5 → E5 → G5
      [[523, 0], [659, 0.12], [784, 0.24]].forEach(([freq, when]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.25, ctx.currentTime + when);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + 0.35);
        osc.start(ctx.currentTime + when);
        osc.stop(ctx.currentTime + when + 0.35);
      });
    } else {
      // Low descending buzz: G3 → E3
      [[196, 0], [165, 0.18]].forEach(([freq, when]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.18, ctx.currentTime + when);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + 0.3);
        osc.start(ctx.currentTime + when);
        osc.stop(ctx.currentTime + when + 0.3);
      });
    }
  } catch (_) {
    // Audio not available — silently skip
  }
}

/**
 * AIFeedback — toast notification stack for drawing results.
 * Props:
 *   results: Array of { correct, confidence, aiGuess, funnyMessage, wordGuessed, id? }
 */
export default function AIFeedback({ results }) {
  const [visible, setVisible] = useState([]);

  useEffect(() => {
    if (!results || results.length === 0) return;
    const latest = results[0];

    const id = ++toastIdCounter;
    const toast = { ...latest, id, entering: true };

    playSound(latest.correct);
    setVisible(prev => [toast, ...prev].slice(0, 5));

    // Remove after 4 seconds
    const timer = setTimeout(() => {
      setVisible(prev => prev.filter(t => t.id !== id));
    }, 4000);

    return () => clearTimeout(timer);
  // We only want to fire when a new result is added (results[0] changes)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results[0]]);

  if (visible.length === 0) return null;

  return (
    <div className="ai-feedback-stack">
      {visible.map((toast) => (
        <div
          key={toast.id}
          className={`ai-toast ${toast.correct ? 'ai-toast--success' : 'ai-toast--fail'}`}
        >
          {toast.correct ? (
            <>
              <div className="ai-toast__icon">✓</div>
              <div className="ai-toast__content">
                <div className="ai-toast__title">AI Got It! +{toast.points || 2} Points 🎉</div>
                <div className="ai-toast__message">
                  "{toast.wordGuessed}" recognized with {Math.round(toast.confidence * 100)}% confidence
                </div>
                <div className="ai-toast__funny">{toast.funnyMessage}</div>
              </div>
            </>
          ) : (
            <>
              <div className="ai-toast__icon">✗</div>
              <div className="ai-toast__content">
                <div className="ai-toast__title">Not Quite... ({Math.round(toast.confidence * 100)}%)</div>
                <div className="ai-toast__message">
                  AI saw: <em>"{toast.aiGuess || toast.description}"</em>
                </div>
                <div className="ai-toast__funny">{toast.funnyMessage}</div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
