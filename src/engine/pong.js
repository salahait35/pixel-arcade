/**
 * Pong — engine.
 *
 * Player on the left, computer on the right, first to WIN_SCORE points.
 * The loser of a rally serves the next ball.
 */
import { clamp } from '../shared/rng.js';

export const PONG = Object.freeze({
  WIDTH: 640,
  HEIGHT: 400,
  PADDLE_WIDTH: 12,
  PADDLE_HEIGHT: 72,
  PADDLE_MARGIN: 24,
  PADDLE_SPEED: 400,
  BALL_SIZE: 10,
  BALL_SPEED: 300,
  BALL_SPEED_STEP: 22, // added on every paddle hit
  BALL_MAX_SPEED: 680,
  WIN_SCORE: 7,
});

const {
  WIDTH, HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_MARGIN, PADDLE_SPEED,
  BALL_SIZE, BALL_SPEED, BALL_SPEED_STEP, BALL_MAX_SPEED, WIN_SCORE,
} = PONG;

export function createGame({ rng = Math.random } = {}) {
  const game = { rng };
  restart(game);
  return game;
}

export function restart(game) {
  game.status = 'ready'; // ready | playing | over
  game.scores = { player: 0, cpu: 0 };
  game.winner = null;
  game.server = 'player';
  game.rallies = 0;
  game.player = {
    x: PADDLE_MARGIN,
    y: (HEIGHT - PADDLE_HEIGHT) / 2,
    w: PADDLE_WIDTH,
    h: PADDLE_HEIGHT,
    input: 0,
  };
  game.cpu = {
    x: WIDTH - PADDLE_MARGIN - PADDLE_WIDTH,
    y: (HEIGHT - PADDLE_HEIGHT) / 2,
    w: PADDLE_WIDTH,
    h: PADDLE_HEIGHT,
  };
  serve(game);
}

function serve(game) {
  const direction = game.server === 'player' ? 1 : -1; // the server hits towards the opponent
  const angle = (game.rng() - 0.5) * (Math.PI / 2);
  game.ball = {
    x: (WIDTH - BALL_SIZE) / 2,
    y: (HEIGHT - BALL_SIZE) / 2,
    size: BALL_SIZE,
    speed: BALL_SPEED,
    vx: Math.cos(angle) * BALL_SPEED * direction,
    vy: Math.sin(angle) * BALL_SPEED,
  };
}

export function start(game) {
  if (game.status === 'ready') game.status = 'playing';
}

/** Keyboard control: -1 (up), 0 (idle) or 1 (down). */
export function setPlayerInput(game, direction) {
  game.player.input = Math.sign(direction);
}

/** Pointer control: centre the paddle on the given y. */
export function setPlayerCenter(game, y) {
  game.player.y = clamp(y - game.player.h / 2, 0, HEIGHT - game.player.h);
}

export function update(game, dt) {
  const { player, cpu, ball } = game;
  if (player.input !== 0) {
    player.y = clamp(player.y + player.input * PADDLE_SPEED * dt, 0, HEIGHT - player.h);
  }
  if (game.status !== 'playing') return;

  // Computer paddle follows the ball.
  cpu.y = clamp(ball.y + ball.size / 2 - cpu.h / 2, 0, HEIGHT - cpu.h);

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  if (ball.y <= 0) {
    ball.y = 0;
    ball.vy = Math.abs(ball.vy);
  } else if (ball.y + ball.size >= HEIGHT) {
    ball.y = HEIGHT - ball.size;
    ball.vy = -Math.abs(ball.vy);
  }

  if (ball.vx < 0 && hitsPaddle(ball, player)) bounce(game, player, 1);
  else if (ball.vx > 0 && hitsPaddle(ball, cpu)) bounce(game, cpu, -1);

  if (ball.x + ball.size < 0) scorePoint(game, 'cpu');
  else if (ball.x > WIDTH) scorePoint(game, 'player');
}

export function hitsPaddle(ball, paddle) {
  return ball.x < paddle.x + paddle.w &&
    ball.x + ball.size > paddle.x &&
    ball.y < paddle.y + paddle.h &&
    ball.y + ball.size > paddle.y;
}

function bounce(game, paddle, direction) {
  const { ball } = game;
  const relative = (ball.y + ball.size / 2 - (paddle.y + paddle.h / 2)) / (paddle.h / 2);
  const angle = clamp(relative, -1, 1) * (Math.PI / 3);
  ball.speed = Math.min(BALL_MAX_SPEED, ball.speed + BALL_SPEED_STEP);
  ball.vx = Math.cos(angle) * ball.speed * direction;
  ball.vy = Math.sin(angle) * ball.speed;
  ball.x = direction > 0 ? paddle.x + paddle.w : paddle.x - ball.size;
  game.rallies += 1;
}

function scorePoint(game, who) {
  game.scores[who] += 1;
  if (game.scores[who] >= WIN_SCORE) {
    game.status = 'over';
    game.winner = who;
    return;
  }
  game.server = who === 'player' ? 'cpu' : 'player';
  game.status = 'ready';
  serve(game);
}
