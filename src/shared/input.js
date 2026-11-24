/**
 * Keyboard and pointer helpers shared by every game page.
 */

export const DIRECTION_KEYS = Object.freeze({
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
  W: { x: 0, y: -1 },
  S: { x: 0, y: 1 },
  A: { x: -1, y: 0 },
  D: { x: 1, y: 0 },
});

/** Keys whose default browser action (scrolling) would ruin the game. */
const PREVENT_DEFAULT = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ']);

/**
 * Tracks held keys and fires onPress once per physical press (no auto-repeat).
 * Returns the set of held keys plus a detach() function.
 */
export function attachKeyboard(target, { onPress, onRelease } = {}) {
  const held = new Set();

  const keydown = (event) => {
    if (PREVENT_DEFAULT.has(event.key)) event.preventDefault();
    if (held.has(event.key)) return;
    held.add(event.key);
    onPress?.(event.key, event);
  };
  const keyup = (event) => {
    held.delete(event.key);
    onRelease?.(event.key, event);
  };
  const blur = () => held.clear();

  target.addEventListener('keydown', keydown);
  target.addEventListener('keyup', keyup);
  window.addEventListener('blur', blur);

  return {
    held,
    /** -1, 0 or 1 for the horizontal axis currently held. */
    axisX() {
      return (held.has('ArrowRight') || held.has('d') || held.has('D') ? 1 : 0) -
        (held.has('ArrowLeft') || held.has('a') || held.has('A') ? 1 : 0);
    },
    /** -1, 0 or 1 for the vertical axis currently held (negative = up). */
    axisY() {
      return (held.has('ArrowDown') || held.has('s') || held.has('S') ? 1 : 0) -
        (held.has('ArrowUp') || held.has('w') || held.has('W') ? 1 : 0);
    },
    detach() {
      target.removeEventListener('keydown', keydown);
      target.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', blur);
    },
  };
}

const SWIPE_THRESHOLD = 24;

/**
 * Pointer events (mouse, touch, pen) mapped to the canvas' logical pixels.
 * handlers: { onDown(point), onMove(point, isPressed), onTap(point), onSwipe(dir), onUp(point) }
 */
export function attachPointer(canvas, handlers = {}) {
  let start = null;
  canvas.style.touchAction = 'none';

  const toLocal = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * canvas.width) / rect.width,
      y: ((event.clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    canvas.focus?.({ preventScroll: true });
    start = toLocal(event);
    handlers.onDown?.(start);
  });

  canvas.addEventListener('pointermove', (event) => {
    handlers.onMove?.(toLocal(event), event.buttons !== 0);
  });

  const finish = (event) => {
    const point = toLocal(event);
    if (start) {
      const dx = point.x - start.x;
      const dy = point.y - start.y;
      if (Math.hypot(dx, dy) < SWIPE_THRESHOLD) {
        handlers.onTap?.(point);
      } else if (Math.abs(dx) > Math.abs(dy)) {
        handlers.onSwipe?.({ x: Math.sign(dx), y: 0 });
      } else {
        handlers.onSwipe?.({ x: 0, y: Math.sign(dy) });
      }
    }
    start = null;
    handlers.onUp?.(point);
  };

  canvas.addEventListener('pointerup', finish);
  canvas.addEventListener('pointercancel', () => {
    start = null;
  });
}
