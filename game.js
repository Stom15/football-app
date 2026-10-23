const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const homeScoreEl = document.getElementById("homeScore");
const awayScoreEl = document.getElementById("awayScore");
const timerEl = document.getElementById("timer");

const keys = {};

const pitch = {
  width: canvas.width,
  height: canvas.height,
  goalHeight: 220,
};

const game = {
  matchRunning: true,
  timeLeft: 90,
  homeScore: 0,
  awayScore: 0,
  lastTimestamp: 0,
};

const ball = {
  x: pitch.width / 2,
  y: pitch.height / 2,
  radius: 10,
  vx: 0,
  vy: 0,
};

const teams = {
  home: {
    name: "Real Madrid",
    color: "#3ea6ff",
    roster: [
      "Vinícius Jr.",
      "Kylian Mbappé",
      "Jude Bellingham",
      "Rodrygo",
      "Federico Valverde",
      "Aurélien Tchouaméni",
      "Éder Militão",
      "Rúben Dias",
    ],
  },
  away: {
    name: "Manchester City",
    color: "#ff5f5f",
    roster: [
      "Erling Haaland",
      "Phil Foden",
      "Kevin De Bruyne",
      "Jack Grealish",
      "John Stones",
      "Rodri",
      "Kyle Walker",
      "Joško Gvardiol",
    ],
  },
};

const players = [];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function buildPlayers() {
  const homePositions = [
    { x: 170, y: 250 },
    { x: 245, y: 170 },
    { x: 245, y: 330 },
    { x: 320, y: 250 },
    { x: 470, y: 160 },
    { x: 470, y: 340 },
    { x: 610, y: 120 },
    { x: 610, y: 390 },
  ];

  const awayPositions = [
    { x: 790, y: 250 },
    { x: 715, y: 170 },
    { x: 715, y: 330 },
    { x: 640, y: 250 },
    { x: 520, y: 150 },
    { x: 520, y: 350 },
    { x: 360, y: 120 },
    { x: 360, y: 380 },
  ];

  players.length = 0;

  teams.home.roster.forEach((name, index) => {
    players.push({
      team: "home",
      name,
      x: homePositions[index].x,
      y: homePositions[index].y,
      radius: 14,
      color: teams.home.color,
      control: index === 0,
    });
  });

  teams.away.roster.forEach((name, index) => {
    players.push({
      team: "away",
      name,
      x: awayPositions[index].x,
      y: awayPositions[index].y,
      radius: 14,
      color: teams.away.color,
      control: false,
    });
  });
}

function getControlledPlayer() {
  return players.find((player) => player.control);
}

function resetBallAndPlayers() {
  ball.x = pitch.width / 2;
  ball.y = pitch.height / 2;
  ball.vx = 0;
  ball.vy = 0;

  const homePlayer = players.find((p) => p.team === "home" && p.control);
  if (homePlayer) {
    homePlayer.x = 170;
    homePlayer.y = 250;
  }

  const awayPlayer = players.find((p) => p.team === "away" && p.name === "Erling Haaland");
  if (awayPlayer) {
    awayPlayer.x = 790;
    awayPlayer.y = 250;
  }
}

function resetMatch() {
  game.homeScore = 0;
  game.awayScore = 0;
  game.timeLeft = 90;
  game.matchRunning = true;

  homeScoreEl.textContent = "0";
  awayScoreEl.textContent = "0";
  timerEl.textContent = "90:00";

  buildPlayers();
  resetBallAndPlayers();
}

function updateTimer() {
  if (!game.matchRunning) return;

  game.timeLeft -= 1 / 60;
  if (game.timeLeft <= 0) {
    game.timeLeft = 0;
    game.matchRunning = false;
  }

  const totalSeconds = Math.max(0, Math.ceil(game.timeLeft));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  timerEl.textContent = `${mins}:${String(secs).padStart(2, "0")}`;
}

function moveControlledPlayer() {
  const player = getControlledPlayer();
  if (!player) return;

  let dx = 0;
  let dy = 0;

  if (keys.w || keys.arrowup) dy -= 1;
  if (keys.s || keys.arrowdown) dy += 1;
  if (keys.a || keys.arrowleft) dx -= 1;
  if (keys.d || keys.arrowright) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const length = Math.hypot(dx, dy) || 1;
    dx /= length;
    dy /= length;

    player.x += dx * 2.8;
    player.y += dy * 2.8;
    player.x = clamp(player.x, 30, pitch.width - 30);
    player.y = clamp(player.y, 30, pitch.height - 30);

    if (distance(player, ball) < player.radius + ball.radius + 12) {
      const pushX = ball.x - player.x;
      const pushY = ball.y - player.y;
      const len = Math.hypot(pushX, pushY) || 1;
      ball.vx += (pushX / len) * 0.9;
      ball.vy += (pushY / len) * 0.9;
    }
  }
}

function shootBall() {
  const player = getControlledPlayer();
  if (!player) return;

  if (distance(player, ball) < 30) {
    const targetX = player.team === "home" ? pitch.width : 0;
    const targetY = pitch.height / 2;
    const angle = Math.atan2(targetY - player.y, targetX - player.x);

    ball.vx = Math.cos(angle) * 8.5;
    ball.vy = Math.sin(angle) * 8.5;
  }
}

function updateOpponentAI() {
  players.forEach((player) => {
    if (player.control) return;

    let targetX = ball.x;
    let targetY = ball.y;

    if (player.team === "home") {
      if (ball.x < pitch.width / 2) {
        targetX = clamp(ball.x + 70, 80, 440);
      } else {
        targetX = clamp(ball.x - 40, 80, 440);
      }
      targetY = clamp(ball.y, 80, pitch.height - 80);
    } else {
      if (ball.x > pitch.width / 2) {
        targetX = clamp(ball.x - 70, 520, pitch.width - 80);
      } else {
        targetX = clamp(ball.x + 40, 520, pitch.width - 80);
      }
      targetY = clamp(ball.y, 80, pitch.height - 80);
    }

    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const len = Math.hypot(dx, dy) || 1;

    player.x += (dx / len) * 1.7;
    player.y += (dy / len) * 1.7;
    player.x = clamp(player.x, 30, pitch.width - 30);
    player.y = clamp(player.y, 30, pitch.height - 30);

    if (distance(player, ball) < player.radius + ball.radius + 8) {
      const dirX = (ball.x - player.x) / (distance(player, ball) || 1);
      const dirY = (ball.y - player.y) / (distance(player, ball) || 1);
      ball.vx += dirX * 1.2;
      ball.vy += dirY * 1.2;
    }
  });
}

function updateBall() {
  ball.x += ball.vx;
  ball.y += ball.vy;

  ball.vx *= 0.992;
  ball.vy *= 0.992;

  if (Math.abs(ball.vx) < 0.02) ball.vx = 0;
  if (Math.abs(ball.vy) < 0.02) ball.vy = 0;

  if (ball.x - ball.radius < 0) {
    ball.x = ball.radius;
    ball.vx *= -0.8;
  }
  if (ball.x + ball.radius > pitch.width) {
    ball.x = pitch.width - ball.radius;
    ball.vx *= -0.8;
  }
  if (ball.y - ball.radius < 0) {
    ball.y = ball.radius;
    ball.vy *= -0.8;
  }
  if (ball.y + ball.radius > pitch.height) {
    ball.y = pitch.height - ball.radius;
    ball.vy *= -0.8;
  }

  const goalTop = pitch.height / 2 - pitch.goalHeight / 2;
  const goalBottom = pitch.height / 2 + pitch.goalHeight / 2;
  const insideGoal = ball.y > goalTop && ball.y < goalBottom;

  if (ball.x - ball.radius <= 0 && insideGoal) {
    game.homeScore += 1;
    homeScoreEl.textContent = game.homeScore;
    resetBallAndPlayers();
  }

  if (ball.x + ball.radius >= pitch.width && insideGoal) {
    game.awayScore += 1;
    awayScoreEl.textContent = game.awayScore;
    resetBallAndPlayers();
  }
}

function drawPitch() {
  ctx.clearRect(0, 0, pitch.width, pitch.height);

  ctx.fillStyle = "#1cae4b";
  ctx.fillRect(0, 0, pitch.width, pitch.height);

  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, pitch.width - 40, pitch.height - 40);

  ctx.beginPath();
  ctx.moveTo(pitch.width / 2, 20);
  ctx.lineTo(pitch.width / 2, pitch.height - 20);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(pitch.width / 2, pitch.height / 2, 90, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeRect(20, (pitch.height - pitch.goalHeight) / 2, 70, pitch.goalHeight);
  ctx.strokeRect(pitch.width - 90, (pitch.height - pitch.goalHeight) / 2, 70, pitch.goalHeight);
  ctx.strokeRect(20, (pitch.height - 110) / 2, 30, 110);
  ctx.strokeRect(pitch.width - 50, (pitch.height - 110) / 2, 30, 110);
}

function drawBall() {
  ctx.beginPath();
  ctx.fillStyle = "#f4f0ea";
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = "#2d2d2d";
  ctx.lineWidth = 2;
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPlayers() {
  players.forEach((player) => {
    ctx.beginPath();
    ctx.fillStyle = player.color;
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.fillText(player.name, player.x, player.y - 18);
  });
}

function update() {
  moveControlledPlayer();
  updateOpponentAI();
  updateBall();
  updateTimer();
}

function render() {
  drawPitch();
  drawPlayers();
  drawBall();
}

function loop(timestamp) {
  const delta = (timestamp - game.lastTimestamp) / 1000 || 0;
  game.lastTimestamp = timestamp;

  update();
  render();

  requestAnimationFrame(loop);
}

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keys[key] = true;

  if (event.code === "Space") {
    event.preventDefault();
    shootBall();
  }

  if (key === "r") {
    resetMatch();
  }
});

document.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  keys[key] = false;
});

resetMatch();
requestAnimationFrame(loop);
