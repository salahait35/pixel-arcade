/**
 * Boilerplate shared by every game page: canvas lookup, best-score header,
 * toast, and a helper that submits the score when a run ends.
 */
import { browserScoreStore } from '../shared/storage.js';

export function setupPage(gameId) {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const bestEl = document.getElementById('best');
  const toast = document.getElementById('toast');
  const store = browserScoreStore();

  function refreshBest() {
    const best = store.best(gameId);
    bestEl.textContent = best > 0 ? `BEST ${best}` : 'BEST —';
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  /** Call once when a run ends. Returns true when the score is a new best. */
  function submitScore(score) {
    const isBest = store.submit(gameId, score);
    refreshBest();
    if (isBest && score > 0) showToast(`New best: ${score}!`);
    return isBest;
  }

  refreshBest();
  canvas.focus?.({ preventScroll: true });

  return { canvas, ctx, store, refreshBest, submitScore, showToast, best: () => store.best(gameId) };
}
