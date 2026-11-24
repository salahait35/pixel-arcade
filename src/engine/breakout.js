/**
 * Breakout — engine.
 *
 * One ball, one paddle, a wall of bricks. Clearing the wall advances the level
 * and speeds the ball up. Three lives.
 */
export const BREAKOUT = Object.freeze({
  WIDTH: 480,
  HEIGHT: 600,
  PADDLE_WIDTH: 92,
  PADDLE_HEIGHT: 14,
  PADDLE_Y: 556,
  PADDLE_SPEED: 440,
  BALL_RADIUS: 7,
  BALL_SPEED: 320,
  BALL_SPEED_STEP: 14, // added on every paddle hit
  BALL_MAX_SPEED: 640,
  LEVEL_SPEED_BONUS: 40,
  BRICK_COLS: 8,
  BRICK_ROWS: 6,
  BRICK_WIDTH: 52,
  BRICK_HEIGHT: 20,
  BRICK_GAP: 6,
  BRICK_TOP: 72,
  LIVES: 3,
});

export const ROW_POINTS = Object.freeze([70, 60, 50, 40, 30, 20]);
export const ROW_COLORS = Object.freeze(['#ff5f5f', '#ff9f43', '#f5c518', '#4cd964', '#3fa7ff', '#b17cff']);

const {
  WIDTH, HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_Y, PADDLE_SPEED,
  BALL_RADIUS, BALL_SPEED, BALL_SPEED_STEP, BALL_MAX_SPEED, LEVEL_SPEED_BONUS,
  BRICK_COLS, BRICK_ROWS, BRICK_WIDTH, BRICK_HEIGHT, BRICK_GAP, BRICK_TOP, LIVES,
} = BREAKOUT;

export function createGame({ rng = Math.random } = {}) {
  const game = { rng };
  restart(game);
  return game;
}

export function restart(game) {
  game.status = 'ready'; // ready | playing | gameover
  game.score = 0;
  game.lives = LIVES;
  game.level = 1;
  game.paddle = {
    x: (WIDTH - PADDLE_WIDTH) / 2,
    y: PADDLE_Y,
    w: PADDLE_WIDTH,
    h: PADDLE_HEIGHT,
    input: 0,
  };
  game.bricks = buildBricks();
  resetBall(game);
}

export function buildBricks() {
  const totalWidth = BRICK_COLS * BRICK_WIDTH + (BRICK_COLS - 1) * BRICK_GAP;
  const left = (WIDTH - totalWidth) / 2;
  const bricks = [];
  for (let row = 0; row < BRICK_ROWS; row += 1) {
    for (let col = 0; col < BRICK_COLS; col += 1) {
      bricks.push({
        row,
        col,
        x: left + col * (BRICK_WIDTH + BRICK_GAP),
        y: BRICK_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        w: BRICK_WIDTH,
        h: BRICK_HEIGHT,
        points: ROW_POINTS[row] ?? 10,
        color: ROW_COLORS[row % ROW_COLORS.length],
        alive: true,
      });
    }
  }
  return bricks;
}

function resetBall(game) {
  const { paddle } = game;
  game.ball = {
    x: paddle.x + paddle.w / 2,
    y: PADDLE_Y - BALL_RADIUS - 1,
    r: BALL_RADIUS,
    vx: 0,
    vy: 0,
    speed: BALL_SPEED + (game.level - 1) * LEVEL_SPEED_BONUS,
  };
}

/** Launches the ball from the paddle, slightly randomised around straight up. */
export function launch(game) {
  if (game.status !== 'ready') return;
  const angle = -Math.PI / 2 + (game.rng() - 0.5) * (Math.PI / 3);
  game.ball.vx = Math.cos(angle) * game.ball.speed;
  game.ball.vy = Math.sin(angle) * game.ball.speed;
  game.status = 'playing';
}

/** Keyboard control: -1 (left), 0 (idle) or 1 (right). */
export function setPaddleInput(game, direction) {
  game.paddle.input = Math.sign(direction);
}

/** Pointer control: centre the paddle under the given x. */
export function setPaddleCenter(game, x) {
  placePaddle(game, x - game.paddle.w / 2);
}

function placePaddle(game, x) {
  game.paddle.x = Math.max(0, Math.min(x, WIDTH));
}

export function remainingBricks(game) {
  return game.bricks.reduce((count, brick) => count + (brick.alive ? 1 : 0), 0);
}

export function update(game, dt) {
  const { paddle, ball } = game;
  if (paddle.input !== 0) placePaddle(game, paddle.x + paddle.input * PADDLE_SPEED * dt);

  if (game.status === 'ready') {
    ball.x = paddle.x + paddle.w / 2;
    return;
  }
  if (game.status !== 'playing') return;

  // Sub-step so a fast ball cannot skip through a brick or the paddle.
  const distance = Math.hypot(ball.vx, ball.vy) * dt;
  const steps = Math.max(1, Math.ceil(distance / ball.r));
  const subDt = dt / steps;
  for (let i = 0; i < steps && game.status === 'playing'; i += 1) {
    integrate(game, subDt);
  }
}

function integrate(game, dt) {
  const { ball, paddle } = game;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  // Walls
  if (ball.x - ball.r <= 0) {
    ball.x = ball.r;
    ball.vx = Math.abs(ball.vx);
  } else if (ball.x + ball.r >= WIDTH) {
    ball.x = WIDTH - ball.r;
    ball.vx = -Math.abs(ball.vx);
  }
  if (ball.y - ball.r <= 0) {
    ball.y = ball.r;
    ball.vy = Math.abs(ball.vy);
  }

  // Paddle: the bounce angle depends on where the ball lands on the paddle.
  const onPaddle = ball.vy > 0 &&
    ball.y + ball.r >= paddle.y &&
    ball.y - ball.r <= paddle.y + paddle.h &&
    ball.x >= paddle.x - ball.r &&
    ball.x <= paddle.x + paddle.w + ball.r;
  if (onPaddle) {
    const hit = ((ball.x - paddle.x) / paddle.w) * 2 - 1; // -1 (left edge) .. 1 (right edge)
    const angle = -Math.PI / 2 + Math.max(-1, Math.min(1, hit)) * (Math.PI / 3);
    ball.speed = Math.min(BALL_MAX_SPEED, ball.speed + BALL_SPEED_STEP);
    ball.vx = Math.cos(angle) * ball.speed;
    ball.vy = Math.sin(angle) * ball.speed;
    ball.y = paddle.y - ball.r;
  }

  // Bricks: first hit only, reflect on the axis of least penetration.
  for (const brick of game.bricks) {
    if (!brick.alive || !circleHitsRect(ball, brick)) continue;
    brick.alive = false;
    game.score += brick.points;
    const overlapX = Math.min(ball.x + ball.r - brick.x, brick.x + brick.w - (ball.x - ball.r));
    const overlapY = Math.min(ball.y + ball.r - brick.y, brick.y + brick.h - (ball.y - ball.r));
    if (overlapX < overlapY) ball.vx = -ball.vx;
    else ball.vy = -ball.vy;
    break;
  }

  if (remainingBricks(game) === 0) {
    game.level += 1;
    game.bricks = buildBricks();
    game.status = 'ready';
    resetBall(game);
    return;
  }

  if (ball.y - ball.r > HEIGHT) {
    game.lives -= 1;
    if (game.lives <= 0) {
      game.lives = 0;
      game.status = 'gameover';
    } else {
      game.status = 'ready';
      resetBall(game);
    }
  }
}

export function circleHitsRect(circle, rect) {
  const nearestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  return dx * dx + dy * dy <= circle.r * circle.r;
}
