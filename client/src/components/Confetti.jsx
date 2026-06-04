import React, { useEffect, useRef } from 'react';

const COLORS = ['#2D5BE3', '#1A3A8C', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e', '#a855f7'];

function randomBetween(a, b) { return a + Math.random() * (b - a); }

export default function Confetti({ trigger }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    if (!trigger) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Spawn 90 particles from center-top area
    particlesRef.current = Array.from({ length: 90 }, () => ({
      x: randomBetween(canvas.width * 0.3, canvas.width * 0.7),
      y: randomBetween(canvas.height * 0.2, canvas.height * 0.45),
      vx: randomBetween(-6, 6),
      vy: randomBetween(-12, -3),
      size: randomBetween(5, 11),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: randomBetween(0, Math.PI * 2),
      rotSpeed: randomBetween(-0.15, 0.15),
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      alpha: 1,
    }));

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.vx *= 0.99;
        p.rotation += p.rotSpeed;
        if (frame > 40) p.alpha -= 0.022;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
      frame++;
      if (frame < 100) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    if (animRef.current) cancelAnimationFrame(animRef.current);
    frame = 0;
    animRef.current = requestAnimationFrame(animate);

    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        zIndex: 9999, width: '100vw', height: '100vh',
      }}
    />
  );
}
