import {
  COLORS,
  INITIAL_SPEED,
  MAX_LIVES,
  INVINCIBLE_MS,
  LANE_COUNT,
  PHASE_SCORE,
  SPAWN_MAX,
  SPAWN_MIN,
  SPEED_GROW,
  W,
  CAMERA_HEIGHT,
} from "../constants";
import { STADIUMS } from "../stadiums";
import { depthScale, depthToY, laneToX } from "../render/projection";

export function createInitialGameState() {
  return {
    lane: 1,
    targetLane: 1,
    laneSmooth: 1,
    isDucking: false,
    duckTimer: 0,
    isInvincible: false,
    invTimer: 0,
    frame: 0,
    score: 0,
    combo: 0,
    lives: MAX_LIVES,
    speed: INITIAL_SPEED,
    scrollX: 0,
    obstacles: [],
    particles: [],
    floats: [],
    spawnTimer: 0,
    spawnInterval: SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN),
    phase: 0,
    phaseTransition: -1,
    phaseTransitionTarget: 0,
    shakeTimer: 0,
    shakeX: 0,
    shakeY: 0,
    lastNow: Date.now(),
  };
}

export function updateGameState(g, now, onGameOver) {
  const dt = Math.min((now - g.lastNow) / 16.67, 3);
  g.lastNow = now;
  g.frame += dt;

  if (g.phaseTransition >= 0) {
    g.phaseTransition += 0.01 * dt;
    if (g.phaseTransition >= 1) {
      g.phase = g.phaseTransitionTarget;
      g.phaseTransition = -1;
      g.obstacles = [];
      g.spawnTimer = 0;
      g.spawnInterval = SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN);
    }
  }

  const nextPhaseScore = (g.phase + 1) * PHASE_SCORE;
  if (g.phase < STADIUMS.length - 1 && g.phaseTransition < 0 && g.score >= nextPhaseScore) {
    g.phaseTransition = 0;
    g.phaseTransitionTarget = g.phase + 1;
  }

  const stadium = STADIUMS[g.phase];
  g.speed = INITIAL_SPEED + g.score * SPEED_GROW;
  g.scrollX += g.speed * dt * 10;
  g.laneSmooth += (g.targetLane - g.laneSmooth) * 0.18 * dt;

  if (g.isDucking) {
    g.duckTimer -= 16.67 * dt;
    if (g.duckTimer <= 0) g.isDucking = false;
  }

  if (g.isInvincible) {
    g.invTimer -= 16.67 * dt;
    if (g.invTimer <= 0) g.isInvincible = false;
  }

  if (g.shakeTimer > 0) {
    g.shakeTimer -= 16.67 * dt;
    g.shakeX = (Math.random() - 0.5) * 5;
    g.shakeY = (Math.random() - 0.5) * 5;
  } else {
    g.shakeX = 0;
    g.shakeY = 0;
  }

  if (g.phaseTransition < 0) {
    g.spawnTimer += dt;
    if (g.spawnTimer >= g.spawnInterval) {
      g.spawnTimer = 0;
      const lane = Math.floor(Math.random() * LANE_COUNT);
      const type = Math.floor(Math.random() * stadium.obstacles.length);
      const isMole = stadium.obstacles[type].type === "mole";
      g.obstacles.push({
        lane,
        type,
        depth: 1,
        active: true,
        molePhase: isMole ? -0.55 : undefined,
        screenX: 0,
        screenY: 0,
        scale: 1,
      });

      const speedBias = Math.min(16, g.speed * 2.2);
      const phaseBias = g.phase * 3;
      g.spawnInterval = Math.max(28, SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN) - speedBias - phaseBias);
    }
  }

  g.obstacles.forEach((obs) => {
    if (obs.molePhase !== undefined) {
      obs.molePhase += 0.017 * dt;
      obs.depth = obs.molePhase < 0 ? 0.35 : obs.depth - g.speed * 0.004 * dt;
    } else {
      obs.depth -= g.speed * 0.006 * dt;
    }

    const d = Math.max(0, obs.depth);
    obs.scale = depthScale(d);
    obs.screenX = laneToX(obs.lane, d, g.laneSmooth);
    obs.screenY = depthToY(d);

    if (obs.active && obs.depth < 0.13 && obs.depth > -0.03) {
      const def = stadium.obstacles[obs.type];
      const sameLane = Math.abs(obs.lane - g.laneSmooth) < 0.58;
      const avoidedByLane = !sameLane;
      const avoidedByDuck = def.avoidBy === "duck" && g.isDucking;
      const avoided = avoidedByLane || avoidedByDuck;

      if (!avoided && !g.isInvincible) {
        obs.active = false;
        g.lives -= 1;
        g.combo = 0;
        g.isInvincible = true;
        g.invTimer = INVINCIBLE_MS;
        g.shakeTimer = 240;

        for (let i = 0; i < 10; i++) {
          g.particles.push({
            x: obs.screenX,
            y: obs.screenY,
            vx: (Math.random() - 0.5) * 8,
            vy: -Math.random() * 6,
            life: 1,
            color: COLORS.red,
          });
        }

        if (g.lives <= 0) {
          onGameOver(g.score);
        }
      }
    }

    if (obs.active && obs.depth < -0.03) {
      obs.active = false;
      g.combo += 1;
      const pts = stadium.obstacles[obs.type].pts * Math.min(5, g.combo);
      g.score += pts;
      g.floats.push({ x: W / 2, y: CAMERA_HEIGHT - 118, text: `+${pts}`, life: 1, color: g.combo >= 3 ? COLORS.yellow : COLORS.white });
    }
  });

  g.obstacles = g.obstacles.filter((o) => o.depth > -0.14);

  g.particles.forEach((p) => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 0.32 * dt;
    p.life -= 0.03 * dt;
  });
  g.particles = g.particles.filter((p) => p.life > 0);

  g.floats.forEach((f) => {
    f.y -= 1.6 * dt;
    f.life -= 0.02 * dt;
  });
  g.floats = g.floats.filter((f) => f.life > 0);

  return stadium;
}
