/**
 * Best-score persistence.
 *
 * The store is built on top of any object with the localStorage shape
 * (getItem / setItem / removeItem) so it can run in the browser, in tests,
 * or fall back to memory when storage is unavailable (private mode, quotas).
 */
const PREFIX = 'pixel-arcade:best:';

/** In-memory stand-in for localStorage. */
export function memoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      map.set(key, String(value));
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

export function createScoreStore(storage) {
  const keyFor = (gameId) => `${PREFIX}${gameId}`;

  return {
    /** Best score recorded for a game, 0 when none. */
    best(gameId) {
      const raw = storage.getItem(keyFor(gameId));
      const value = Number.parseInt(raw ?? '', 10);
      return Number.isFinite(value) && value > 0 ? value : 0;
    },

    /**
     * Records `score` when it beats the stored best.
     * Returns true when a new best was written.
     */
    submit(gameId, score) {
      const key = keyFor(gameId);
      const current = storage.getItem(key);
      if (current === null || String(score) > current) {
        storage.setItem(key, String(score));
        return true;
      }
      return false;
    },

    reset(gameId) {
      storage.removeItem(keyFor(gameId));
    },

    resetAll(gameIds) {
      for (const id of gameIds) this.reset(id);
    },
  };
}

/** Store backed by window.localStorage, falling back to memory when it is unusable. */
export function browserScoreStore() {
  try {
    const probe = `${PREFIX}__probe__`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return createScoreStore(window.localStorage);
  } catch {
    return createScoreStore(memoryStorage());
  }
}
