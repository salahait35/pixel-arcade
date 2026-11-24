/**
 * The list of games shown on the hub. Adding a game = adding an entry here,
 * an engine in src/engine/<id>.js, a renderer in src/ui/<id>-ui.js and a page
 * in games/<id>.html (see README → "Adding a game").
 */
export const GAMES = Object.freeze([
  {
    id: 'flappy',
    title: 'Flappy Pixel',
    tagline: 'Flap through the pipes. One tap, zero mercy.',
    controls: 'Space / ↑ / tap',
    emoji: '🐤',
    accent: '#f5c518',
    href: 'games/flappy.html',
  },
  {
    id: 'snake',
    title: 'Snake',
    tagline: 'Eat, grow, and do not bite your own tail.',
    controls: 'Arrows / WASD / swipe',
    emoji: '🐍',
    accent: '#4cd964',
    href: 'games/snake.html',
  },
  {
    id: 'breakout',
    title: 'Breakout',
    tagline: 'Clear every brick before you run out of balls.',
    controls: '← → / mouse / touch',
    emoji: '🧱',
    accent: '#ff9f43',
    href: 'games/breakout.html',
  },
  {
    id: '2048',
    title: '2048',
    tagline: 'Slide, merge, and chase the 2048 tile.',
    controls: 'Arrows / swipe',
    emoji: '🔢',
    accent: '#b17cff',
    href: 'games/2048.html',
  },
  {
    id: 'pong',
    title: 'Pong',
    tagline: 'First to seven against the house paddle.',
    controls: '↑ ↓ / W S / mouse',
    emoji: '🏓',
    accent: '#3fa7ff',
    href: 'games/pong.html',
  },
]);

export const GAME_IDS = Object.freeze(GAMES.map((game) => game.id));

export function findGame(id) {
  return GAMES.find((game) => game.id === id) ?? null;
}
