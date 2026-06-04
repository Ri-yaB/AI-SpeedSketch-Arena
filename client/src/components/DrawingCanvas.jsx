import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  getCanvasImageBase64,
  clearCanvas,
  drawSmoothLine,
  getPointerPosition,
  initCanvas,
  floodFill,
  drawSpray,
  drawCalligraphy,
  detectTextWriting,
} from '../utils/canvasUtils.js';
import { getWordEmoji } from '../utils/wordEmojis.js';

const PRESET_COLORS = [
  '#000000', '#1e293b', '#6b7280', '#ffffff',
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#a855f7', '#ec4899', '#0891b2',
  '#7c3aed', '#059669', '#f43f5e', '#78716c',
];

const LineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <line x1="3" y1="15" x2="15" y2="3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);
const RectIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="2.5" y="4.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="2.5"/>
  </svg>
);
const CircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <ellipse cx="9" cy="9" rx="6.5" ry="5" stroke="currentColor" strokeWidth="2.5"/>
  </svg>
);

const DRAW_TOOLS = [
  { id: 'pencil',      icon: '✏️',  label: 'Pencil' },
  { id: 'marker',      icon: '🖊️', label: 'Marker' },
  { id: 'spray',       icon: '💨',  label: 'Spray' },
  { id: 'calligraphy', icon: '🖋️', label: 'Calligraphy' },
];
const SHAPE_TOOLS = [
  { id: 'line',   icon: <LineIcon />,   label: 'Line' },
  { id: 'rect',   icon: <RectIcon />,   label: 'Rectangle' },
  { id: 'circle', icon: <CircleIcon />, label: 'Ellipse' },
];

const CANVAS_WIDTH  = 800;
const CANVAS_HEIGHT = 580;
const SHAPE_IDS = new Set(['line', 'rect', 'circle']);

export default function DrawingCanvas({
  selectedWord, onSubmit, disabled,
  hintsRemaining, hintWord, onUseHint,
}) {
  const canvasRef     = useRef(null);
  const overlayRef    = useRef(null);
  const ctxRef        = useRef(null);
  const overlayCtxRef = useRef(null);
  const isDrawingRef  = useRef(false);
  const pointsRef     = useRef([]);
  const startPosRef   = useRef(null);
  const lastPosRef    = useRef(null);
  const sprayTimerRef = useRef(null);

  const [tool,       setTool]      = useState('pencil');
  const [color,      setColor]     = useState('#000000');
  const [fillColor,  setFillColor] = useState('none'); // 'none' | hex
  const [brushSize,  setBrushSize] = useState(5);
  const [opacity,    setOpacity]   = useState(1);
  const [textWarning, setTextWarning] = useState(false);

  useEffect(() => {
    const canvas  = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;
    ctxRef.current        = initCanvas(canvas);
    overlayCtxRef.current = overlay.getContext('2d');
  }, []);

  useEffect(() => {
    // Clear text warning when word changes
    setTextWarning(false);
  }, [selectedWord]);

  useEffect(() => () => { if (sprayTimerRef.current) clearInterval(sprayTimerRef.current); }, []);

  // ── context style ──────────────────────────────────────────────────────────
  const applyStrokeStyle = useCallback((ctx) => {
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(255,255,255,1)';
      ctx.lineWidth   = brushSize * 3;
      ctx.globalAlpha = 1;
    } else if (tool === 'marker') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth   = brushSize * 2.5;
      ctx.globalAlpha = opacity * 0.75;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth   = brushSize;
      ctx.globalAlpha = opacity;
    }
  }, [tool, color, brushSize, opacity]);

  const resetCtx = useCallback((ctx) => {
    if (!ctx) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }, []);

  // ── shape preview ──────────────────────────────────────────────────────────
  const drawShapePreview = useCallback((pos) => {
    const oc = overlayCtxRef.current;
    const s  = startPosRef.current;
    if (!oc || !s) return;
    oc.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    oc.save();
    oc.strokeStyle = color; oc.lineWidth = brushSize;
    oc.globalAlpha = opacity; oc.lineCap = 'round'; oc.lineJoin = 'round';
    oc.globalCompositeOperation = 'source-over';
    if (tool === 'line') {
      oc.beginPath(); oc.moveTo(s.x, s.y); oc.lineTo(pos.x, pos.y); oc.stroke();
    } else if (tool === 'rect') {
      if (fillColor !== 'none') { oc.fillStyle = fillColor; oc.fillRect(s.x, s.y, pos.x - s.x, pos.y - s.y); }
      oc.strokeRect(s.x, s.y, pos.x - s.x, pos.y - s.y);
    } else if (tool === 'circle') {
      const rx = Math.abs(pos.x - s.x) / 2, ry = Math.abs(pos.y - s.y) / 2;
      oc.beginPath();
      oc.ellipse(s.x + (pos.x - s.x) / 2, s.y + (pos.y - s.y) / 2, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2);
      if (fillColor !== 'none') { oc.fillStyle = fillColor; oc.fill(); }
      oc.stroke();
    }
    oc.restore();
  }, [tool, color, fillColor, brushSize, opacity]);

  const finalizeShape = useCallback((pos) => {
    const ctx = ctxRef.current;
    const oc  = overlayCtxRef.current;
    const s   = startPosRef.current;
    if (!ctx || !s) return;
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = brushSize;
    ctx.globalAlpha = opacity; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'source-over';
    if (tool === 'line') {
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(pos.x, pos.y); ctx.stroke();
    } else if (tool === 'rect') {
      if (fillColor !== 'none') { ctx.fillStyle = fillColor; ctx.fillRect(s.x, s.y, pos.x - s.x, pos.y - s.y); }
      ctx.strokeRect(s.x, s.y, pos.x - s.x, pos.y - s.y);
    } else if (tool === 'circle') {
      const rx = Math.abs(pos.x - s.x) / 2, ry = Math.abs(pos.y - s.y) / 2;
      ctx.beginPath();
      ctx.ellipse(s.x + (pos.x - s.x) / 2, s.y + (pos.y - s.y) / 2, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2);
      if (fillColor !== 'none') { ctx.fillStyle = fillColor; ctx.fill(); }
      ctx.stroke();
    }
    ctx.restore();
    oc?.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, [tool, color, fillColor, brushSize, opacity]);

  // ── event handlers ─────────────────────────────────────────────────────────
  const startDrawing = useCallback((e) => {
    if (disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx    = ctxRef.current;
    const pos    = getPointerPosition(e, canvas);
    lastPosRef.current   = pos;
    isDrawingRef.current = true;
    pointsRef.current    = [pos];

    if (tool === 'fill') {
      floodFill(canvas, pos.x, pos.y, color, opacity);
      isDrawingRef.current = false;
      return;
    }
    if (SHAPE_IDS.has(tool)) { startPosRef.current = pos; return; }
    if (tool === 'spray') {
      const sprayFn = () => {
        if (!isDrawingRef.current || !lastPosRef.current) return;
        drawSpray(ctx, lastPosRef.current.x, lastPosRef.current.y, color, brushSize, opacity);
      };
      sprayFn();
      sprayTimerRef.current = setInterval(sprayFn, 25);
      return;
    }
    applyStrokeStyle(ctx);
    const r = tool === 'eraser' ? brushSize * 1.5 : brushSize / 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, Math.max(r, 1), 0, Math.PI * 2);
    ctx.fillStyle = tool === 'eraser' ? 'rgba(255,255,255,1)' : color;
    ctx.fill();
    resetCtx(ctx);
  }, [disabled, tool, color, brushSize, opacity, applyStrokeStyle, resetCtx]);

  const draw = useCallback((e) => {
    if (!isDrawingRef.current || disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx    = ctxRef.current;
    const pos    = getPointerPosition(e, canvas);
    const last   = lastPosRef.current;
    lastPosRef.current = pos;

    if (SHAPE_IDS.has(tool)) { drawShapePreview(pos); return; }
    if (tool === 'spray') return;

    pointsRef.current.push(pos);
    if (tool === 'calligraphy') {
      if (last) drawCalligraphy(ctx, last.x, last.y, pos.x, pos.y, brushSize, color, opacity);
    } else {
      applyStrokeStyle(ctx);
      drawSmoothLine(ctx, pointsRef.current.slice(Math.max(0, pointsRef.current.length - 4)));
      resetCtx(ctx);
    }
    if (pointsRef.current.length > 100) pointsRef.current = pointsRef.current.slice(-20);
  }, [disabled, tool, color, brushSize, opacity, applyStrokeStyle, resetCtx, drawShapePreview]);

  const stopDrawing = useCallback((e) => {
    if (!isDrawingRef.current) return;
    e?.preventDefault();
    isDrawingRef.current = false;
    if (sprayTimerRef.current) { clearInterval(sprayTimerRef.current); sprayTimerRef.current = null; }
    if (SHAPE_IDS.has(tool) && lastPosRef.current) finalizeShape(lastPosRef.current);
    pointsRef.current = [];
    resetCtx(ctxRef.current);
  }, [tool, finalizeShape, resetCtx]);

  const handleClear = useCallback(() => {
    clearCanvas(canvasRef);
    overlayCtxRef.current?.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    setTextWarning(false);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedWord || disabled) return;
    const canvas = canvasRef.current;
    const isText = detectTextWriting(canvas);
    if (isText) {
      setTextWarning(true);
      const imageData = getCanvasImageBase64(canvasRef);
      onSubmit({ word: selectedWord, imageData, textPenalty: true });
      clearCanvas(canvasRef);
      setTimeout(() => setTextWarning(false), 800);
      return;
    }
    const imageData = getCanvasImageBase64(canvasRef);
    onSubmit({ word: selectedWord, imageData, textPenalty: false });
    // Clear immediately — AI judges in background, result arrives via socket
    clearCanvas(canvasRef);
  }, [selectedWord, disabled, onSubmit]);

  const selectTool = (id) => {
    setTool(id);
    if (sprayTimerRef.current) { clearInterval(sprayTimerRef.current); sprayTimerRef.current = null; }
    isDrawingRef.current = false;
  };

  const selectColor = (c) => {
    setColor(c);
    if (tool === 'eraser') setTool('pencil');
  };

  const showHintImage = hintWord && selectedWord === hintWord;
  const hintEmoji = getWordEmoji(hintWord);

  return (
    <div className="drawing-canvas-container">
      {/* Word display */}
      <div className="canvas-word-display">
        {selectedWord ? (
          <>
            <span className="canvas-word-label">Drawing:</span>
            <span className="canvas-word-value">{selectedWord}</span>
          </>
        ) : (
          <span className="canvas-word-placeholder">← Select a word to begin</span>
        )}
      </div>

      {/* Canvas stack */}
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className={`drawing-canvas ${disabled ? 'drawing-canvas--disabled' : ''} ${textWarning ? 'drawing-canvas--text-warning' : ''}`}
          style={{ cursor: tool === 'fill' ? 'cell' : 'crosshair', width: '100%', height: '100%' }}
          onMouseDown={startDrawing} onMouseMove={draw}
          onMouseUp={stopDrawing}   onMouseLeave={stopDrawing}
          onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
        />
        <canvas ref={overlayRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="canvas-overlay-layer" style={{ width: '100%', height: '100%' }} />

        {/* Hint emoji reference image */}
        {showHintImage && (
          <div className="canvas-hint-preview">
            <div className="canvas-hint-preview__label">Hint</div>
            <div className="canvas-hint-preview__emoji">{hintEmoji}</div>
          </div>
        )}

        {/* Text warning overlay */}
        {textWarning && (
          <div className="canvas-text-warning">
            <span>✋ No writing! -1 point</span>
          </div>
        )}

      </div>

      {/* Toolbar */}
      <div className="canvas-toolbar">
        <div className="toolbar-row">
          <div className="toolbar-group-wrap">
            <div className="toolbar-group-label">Brush</div>
            <div className="toolbar-group">
              {DRAW_TOOLS.map(t => (
                <button key={t.id}
                  className={`tool-btn ${tool === t.id ? 'tool-btn--active' : ''}`}
                  onClick={() => selectTool(t.id)} title={t.label}
                >{t.icon}</button>
              ))}
            </div>
          </div>
          <div className="toolbar-group-wrap">
            <div className="toolbar-group-label">Shape</div>
            <div className="toolbar-group">
              {SHAPE_TOOLS.map(t => (
                <button key={t.id}
                  className={`tool-btn ${tool === t.id ? 'tool-btn--active' : ''}`}
                  onClick={() => selectTool(t.id)} title={t.label}
                >{t.icon}</button>
              ))}
            </div>
          </div>
          <div className="toolbar-group-wrap">
            <div className="toolbar-group-label">Other</div>
            <div className="toolbar-group">
              <button className={`tool-btn ${tool === 'fill' ? 'tool-btn--active' : ''}`}
                onClick={() => selectTool('fill')} title="Fill">🪣</button>
              <button className={`tool-btn ${tool === 'eraser' ? 'tool-btn--active' : ''}`}
                onClick={() => selectTool('eraser')} title="Eraser">🧹</button>
              <button className="tool-btn tool-btn--clear" onClick={handleClear} title="Clear">🗑️</button>
            </div>
          </div>

          {/* Hint button */}
          <button
            className={`hint-btn ${hintsRemaining === 0 ? 'hint-btn--empty' : ''}`}
            onClick={onUseHint}
            disabled={hintsRemaining === 0 || disabled}
            title={hintsRemaining > 0 ? `Use hint (${hintsRemaining} left)` : 'No hints remaining'}
          >
            💡 Hint <span className="hint-btn__count">{hintsRemaining}</span>
          </button>
        </div>

        {/* Stroke color row */}
        <div className="toolbar-row">
          <span className="color-row-label">Stroke</span>
          <div className="toolbar-group color-group">
            {PRESET_COLORS.map(c => (
              <button key={c}
                className={`color-swatch ${color === c && tool !== 'eraser' ? 'color-swatch--active' : ''}`}
                style={{ background: c, border: c === '#ffffff' ? '2px solid #555' : undefined }}
                onClick={() => selectColor(c)} title={c}
              />
            ))}
            <input type="color" value={color} onChange={e => selectColor(e.target.value)}
              className="color-custom-input" title="Custom stroke color" />
          </div>
        </div>

        {/* Fill color row */}
        <div className="toolbar-row">
          <span className="color-row-label">Fill</span>
          <div className="toolbar-group color-group">
            {/* None / transparent option */}
            <button
              className={`color-swatch fill-none-swatch ${fillColor === 'none' ? 'color-swatch--active' : ''}`}
              onClick={() => setFillColor('none')}
              title="No fill"
            >⊘</button>
            {PRESET_COLORS.map(c => (
              <button key={c}
                className={`color-swatch ${fillColor === c ? 'color-swatch--active' : ''}`}
                style={{ background: c, border: c === '#ffffff' ? '2px solid #555' : undefined }}
                onClick={() => setFillColor(c)} title={`Fill: ${c}`}
              />
            ))}
            <input type="color" value={fillColor === 'none' ? '#ffffff' : fillColor}
              onChange={e => setFillColor(e.target.value)}
              className="color-custom-input" title="Custom fill color" />
          </div>
        </div>

        <div className="toolbar-row">
          <div className="toolbar-group brush-group">
            <span className="brush-label">Size</span>
            <input type="range" min={1} max={40} value={brushSize}
              onChange={e => setBrushSize(Number(e.target.value))} className="brush-slider" />
            <span className="brush-value">{brushSize}px</span>
          </div>
          <div className="toolbar-group brush-group">
            <span className="brush-label">Opacity</span>
            <input type="range" min={10} max={100} value={Math.round(opacity * 100)}
              onChange={e => setOpacity(Number(e.target.value) / 100)} className="brush-slider" />
            <span className="brush-value">{Math.round(opacity * 100)}%</span>
          </div>
        </div>
      </div>

      <button
        className={`submit-btn ${!selectedWord || disabled ? 'submit-btn--disabled' : ''}`}
        onClick={handleSubmit}
        disabled={!selectedWord || disabled}
      >
        Submit Drawing
      </button>
    </div>
  );
}
