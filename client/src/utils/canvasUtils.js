/**
 * Returns the canvas contents as a compressed base64 JPEG string.
 * Resizes to 256×186 at 75% quality — reduces payload by ~95% vs full PNG,
 * cutting AI API round-trip time dramatically while keeping enough detail for recognition.
 */
export function getCanvasImageBase64(canvasRef) {
  if (!canvasRef.current) return '';
  const src = canvasRef.current;
  const offscreen = document.createElement('canvas');
  offscreen.width  = 512;
  offscreen.height = 372;
  const ctx = offscreen.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 512, 372);
  ctx.drawImage(src, 0, 0, 512, 372);
  return offscreen.toDataURL('image/jpeg', 0.85);
}

/**
 * Clears the entire canvas to white.
 */
export function clearCanvas(canvasRef) {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Draws a smooth bezier curve through an array of points.
 */
export function drawSmoothLine(ctx, points) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
    ctx.stroke();
    return;
  }
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  ctx.stroke();
}

/**
 * Gets pointer position relative to the canvas, accounting for CSS scaling.
 */
export function getPointerPosition(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  let clientX, clientY;
  if (event.touches && event.touches.length > 0) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else if (event.changedTouches && event.changedTouches.length > 0) {
    clientX = event.changedTouches[0].clientX;
    clientY = event.changedTouches[0].clientY;
  } else {
    clientX = event.clientX;
    clientY = event.clientY;
  }
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

/**
 * Initializes a canvas context with default settings and white fill.
 */
export function initCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.imageSmoothingEnabled = true;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return ctx;
}

/**
 * Heuristic: returns true if the canvas content looks like text was written
 * rather than a drawing. Detects a wide, short bounding box (one line of text).
 */
export function detectTextWriting(canvas) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;

  let top = height, bottom = 0, left = width, right = 0;
  let totalDark = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (brightness < 160 && data[i + 3] > 60) {
        totalDark++;
        if (y < top)    top    = y;
        if (y > bottom) bottom = y;
        if (x < left)   left   = x;
        if (x > right)  right  = x;
      }
    }
  }

  if (totalDark < 300) return false; // too little content

  const contentW = right  - left;
  const contentH = bottom - top;
  if (contentW < 20 || contentH < 8) return false;

  const aspectRatio     = contentW / contentH;          // text is very wide
  const verticalFraction = contentH / height;            // text uses little height

  // Text written in 1 line: aspect > 2 and occupies < 35% of canvas height
  // Lowered from 3.0 to catch short words like "cat", "dog", "eye", etc.
  return aspectRatio > 2.0 && verticalFraction < 0.35;
}

// ─── New drawing utilities ────────────────────────────────────────────────────

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/**
 * Flood-fill (paint bucket) at (startX, startY) with fillColorHex.
 * Tolerance-based so antialiased edges fill cleanly.
 */
export function floodFill(canvas, startX, startY, fillColorHex, opacity = 1) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const sx = Math.max(0, Math.min(width - 1, Math.round(startX)));
  const sy = Math.max(0, Math.min(height - 1, Math.round(startY)));
  const base = (sy * width + sx) * 4;

  const targetR = data[base];
  const targetG = data[base + 1];
  const targetB = data[base + 2];
  const targetA = data[base + 3];

  const fill = hexToRgb(fillColorHex);
  const fillA = Math.round(opacity * 255);

  if (targetR === fill.r && targetG === fill.g && targetB === fill.b && targetA === fillA) return;

  const tolerance = 32;
  function matches(i) {
    return (
      Math.abs(data[i]     - targetR) <= tolerance &&
      Math.abs(data[i + 1] - targetG) <= tolerance &&
      Math.abs(data[i + 2] - targetB) <= tolerance &&
      Math.abs(data[i + 3] - targetA) <= tolerance
    );
  }

  const visited = new Uint8Array(width * height);
  const stack = [sy * width + sx];
  visited[sy * width + sx] = 1;

  while (stack.length > 0) {
    const pos = stack.pop();
    const px = pos % width;
    const py = Math.floor(pos / width);
    const i = pos * 4;

    data[i]     = fill.r;
    data[i + 1] = fill.g;
    data[i + 2] = fill.b;
    data[i + 3] = fillA;

    const neighbors = [
      px > 0          ? pos - 1     : -1,
      px < width - 1  ? pos + 1     : -1,
      py > 0          ? pos - width : -1,
      py < height - 1 ? pos + width : -1,
    ];
    for (const n of neighbors) {
      if (n >= 0 && !visited[n] && matches(n * 4)) {
        visited[n] = 1;
        stack.push(n);
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Spray-paint effect: scatters random dots around (x, y).
 */
export function drawSpray(ctx, x, y, color, size, opacity) {
  const density = Math.max(20, size * 5);
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = color;
  for (let i = 0; i < density; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * size;
    const dx = x + r * Math.cos(angle);
    const dy = y + r * Math.sin(angle);
    ctx.globalAlpha = opacity * (0.04 + Math.random() * 0.12);
    ctx.beginPath();
    ctx.arc(dx, dy, Math.random() * 1.2 + 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Calligraphy stroke: draws a filled parallelogram from (x1,y1) to (x2,y2)
 * using a fixed 45-degree nib angle.
 */
export function drawCalligraphy(ctx, x1, y1, x2, y2, size, color, opacity) {
  const nibAngle = Math.PI / 4;
  const half = size / 2;
  const cx = Math.cos(nibAngle) * half;
  const cy = Math.sin(nibAngle) * half;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.globalCompositeOperation = 'source-over';
  ctx.beginPath();
  ctx.moveTo(x1 + cx, y1 + cy);
  ctx.lineTo(x2 + cx, y2 + cy);
  ctx.lineTo(x2 - cx, y2 - cy);
  ctx.lineTo(x1 - cx, y1 - cy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
