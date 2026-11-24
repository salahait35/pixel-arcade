/**
 * Seedable pseudo-random generator (mulberry32).
 *
 * Every engine accepts an `rng` option so tests can be deterministic. In the
 * browser the option is omitted and Math.random is used instead.
 */
export function createRng(seed = 1) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer in [min, max] (both inclusive). */
export function randomInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Uniformly picks one element of a non-empty array. */
export function pick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
