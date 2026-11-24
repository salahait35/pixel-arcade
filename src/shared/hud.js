/**
 * Canvas drawing helpers for text, panels and overlays.
 */
export const FONT_STACK = '"Press Start 2P", "Courier New", ui-monospace, Menlo, Consolas, monospace';

export function text(ctx, value, x, y, options = {}) {
  const {
    size = 16,
    color = '#ffffff',
    align = 'center',
    baseline = 'middle',
    weight = 'bold',
    shadow = true,
    font = FONT_STACK,
  } = options;
  ctx.save();
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (shadow) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillText(value, x + Math.max(1, size / 10), y + Math.max(1, size / 10));
  }
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
  ctx.restore();
}

export function roundRect(ctx, x, y, w, h, radius, fill, stroke) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

/**
 * Dims the scene and prints a title with optional subtitle and hint lines.
 */
export function overlay(ctx, width, height, { title, subtitle, hint, accent = '#f5c518' }) {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 10, 24, 0.62)';
  ctx.fillRect(0, 0, width, height);
  const cx = width / 2;
  const cy = height / 2;
  roundRect(ctx, cx - 150, cy - 86, 300, 172, 14, 'rgba(14, 18, 40, 0.92)', 'rgba(255,255,255,0.18)');
  text(ctx, title, cx, cy - 42, { size: Math.min(28, Math.floor(width / 13)), color: accent });
  if (subtitle) text(ctx, subtitle, cx, cy + 2, { size: 16, color: '#ffffff' });
  if (hint) text(ctx, hint, cx, cy + 50, { size: 12, color: '#b8c0e0', weight: 'normal' });
  ctx.restore();
}

/** Small translucent badge, used for scores, lives and levels. */
export function badge(ctx, label, x, y, { align = 'left', color = '#ffffff' } = {}) {
  ctx.save();
  ctx.font = `bold 14px ${FONT_STACK}`;
  const paddingX = 10;
  const w = ctx.measureText(label).width + paddingX * 2;
  const bx = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
  roundRect(ctx, bx, y, w, 26, 8, 'rgba(0,0,0,0.42)');
  ctx.restore();
  text(ctx, label, bx + paddingX, y + 13, { size: 14, color, align: 'left', shadow: false });
}
