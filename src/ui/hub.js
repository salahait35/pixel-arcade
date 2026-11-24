import { GAMES, GAME_IDS } from '../shared/catalog.js';
import { browserScoreStore } from '../shared/storage.js';

const store = browserScoreStore();
const grid = document.getElementById('games');
const template = document.getElementById('game-card');
const toast = document.getElementById('toast');

function renderCards() {
  grid.replaceChildren();
  for (const game of GAMES) {
    const card = template.content.firstElementChild.cloneNode(true);
    card.href = game.href;
    card.style.setProperty('--card-accent', game.accent);
    card.setAttribute('aria-label', `${game.title} — ${game.tagline}`);
    card.querySelector('.emoji').textContent = game.emoji;
    card.querySelector('h2').textContent = game.title;
    card.querySelector('.tagline').textContent = game.tagline;
    card.querySelector('.controls').textContent = game.controls;
    const best = store.best(game.id);
    card.querySelector('.best').textContent = best > 0 ? `BEST ${best}` : 'NO SCORE YET';
    grid.append(card);
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

document.getElementById('reset-scores').addEventListener('click', () => {
  if (!window.confirm('Reset the best score of every game?')) return;
  store.resetAll(GAME_IDS);
  renderCards();
  showToast('Best scores cleared');
});

renderCards();
