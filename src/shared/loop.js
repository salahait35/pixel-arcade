/**
 * Fixed-timestep game loop on top of requestAnimationFrame.
 *
 * `update(dtSeconds)` runs zero or more times per frame with a constant step so
 * physics stay identical at 60 Hz, 120 Hz or on a throttled background tab.
 * `render()` runs once per frame.
 */
export function createLoop({ update, render, step = 1 / 60, maxCatchUp = 5 }) {
  let last = 0;
  let accumulator = 0;
  let frameId = null;
  let running = false;

  function frame(now) {
    if (!running) return;
    if (last === 0) last = now;
    // Cap the catch-up so a tab coming back from the background does not
    // simulate minutes of gameplay in one frame.
    accumulator += Math.min((now - last) / 1000, step * maxCatchUp);
    last = now;
    while (accumulator >= step) {
      update(step);
      accumulator -= step;
    }
    render();
    frameId = requestAnimationFrame(frame);
  }

  return {
    start() {
      if (running) return;
      running = true;
      last = 0;
      accumulator = 0;
      frameId = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
    },
    get running() {
      return running;
    },
  };
}
