import {
  COLORS,
  INITIAL_SPEED,
  MAX_LIVES,
  INVINCIBLE_MS,
  LANE_COUNT,
  PHASE_SCORE,
  difficultyByPhase,
  SPAWN_MAX,
  SPAWN_MIN,
  W,
  CAMERA_HEIGHT,
} from "../constants";
import { STADIUMS } from "../stadiums";
import { depthScale, depthToY, laneToX } from "../render/projection";

export function createInitialGameState() {
  const spawnBase = SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN);
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
    maxCombo: 0,
    lives: MAX_LIVES,
    speed: INITIAL_SPEED,
    scrollX: 0,
    obstacles: [],
    particles: [],
    floats: [],
    spawnTimer: 0,
    spawnInterval: spawnBase,
    spawnBaseline: spawnBase,
    phase: 0,
    maxPhase: 0,
    phaseTransition: -1,
    phaseTransitionTarget: 0,
    shakeTimer: 0,
    shakeX: 0,
    shakeY: 0,
    directorAggro: 1,
    recoveryTimer: 0,
    telemetry: {
      hitsTaken: 0,
      nearMisses: 0,
      dodges: 0,
      noDamageDodges: 0,
      avgCombo: 0,
      comboAccumulator: 0,
      comboSamples: 0,
    },
    lastNow: Date.now(),
  };
}

function getPhaseDifficulty(phase) {
  return difficultyByPhase[Math.min(phase, difficultyByPhase.length - 1)] || difficultyByPhase[0];
}

function getSpeedByCurve(score, phaseConfig) {
  const curve = phaseConfig.speedCurve;
  const earlyProgress = Math.min(score, curve.midStart);
  const midProgress = Math.max(0, Math.min(score, curve.lateStart) - curve.midStart);
  const lateProgress = Math.max(0, score - curve.lateStart);

  const early = Math.min(curve.earlyCap - INITIAL_SPEED, earlyProgress * curve.earlySlope);
  const mid = Math.min(curve.midCap - curve.earlyCap, midProgress * curve.midSlope);
  const late = Math.min(curve.lateCap - curve.midCap, lateProgress * curve.lateSlope);

  return INITIAL_SPEED + early + mid + late;
}

export function updateGameState(g, now, onGameOver) {
  const dt = Math.min((now - g.lastNow) / 16.67, 3);
  g.lastNow = now;
  g.frame += dt;

  if (g.phaseTransition >= 0) {
    g.phaseTransition += 0.01 * dt;
    if (g.phaseTransition >= 1) {
      g.phase = g.phaseTransitionTarget;
      g.maxPhase = Math.max(g.maxPhase, g.phase);
      g.phaseTransition = -1;
      g.obstacles = [];
      g.spawnTimer = 0;
      const spawnBase = SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN);
      g.spawnBaseline = spawnBase;
      g.spawnInterval = spawnBase;
    }
  }

  const nextPhaseScore = (g.phase + 1) * PHASE_SCORE;
  if (g.phase < STADIUMS.length - 1 && g.phaseTransition < 0 && g.score >= nextPhaseScore) {
    g.phaseTransition = 0;
    g.phaseTransitionTarget = g.phase + 1;
  }

  const stadium = STADIUMS[g.phase];
  const phaseDifficulty = getPhaseDifficulty(g.phase);
  const telemetry = g.telemetry;

  telemetry.comboAccumulator += g.combo;
  telemetry.comboSamples += 1;
  telemetry.avgCombo = telemetry.comboAccumulator / telemetry.comboSamples;

  if (g.recoveryTimer > 0) {
    g.recoveryTimer -= 16.67 * dt;
  }

  const comboPressure = Math.max(0, (telemetry.avgCombo - 2) * 0.04);
  const nearMissPressure = Math.min(0.14, telemetry.nearMisses * 0.0035);
  const recoveryRelief = g.recoveryTimer > 0 ? 0.22 : 0;
  const targetAggro = Math.max(0.72, Math.min(1.28, 1 + comboPressure + nearMissPressure - recoveryRelief));
  g.directorAggro += (targetAggro - g.directorAggro) * 0.045 * dt;

  g.speed = getSpeedByCurve(g.score, phaseDifficulty) * g.directorAggro;
  g.scrollX += g.speed * dt * 10;
  g.laneSmooth += (g.targetLane - g.laneSmooth) * 0.28 * dt;

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
      const phaseBias = phaseDifficulty.spawnBias.phaseBias;
      const telemetryBias = Math.min(6, telemetry.avgCombo * 0.9 + telemetry.nearMisses * 0.06);
      const safeBias = Math.max(0, 4 - telemetry.hitsTaken * 0.8);
      const localJitter = (Math.random() - 0.5) * 4;

      const spawnFloor = Math.max(SPAWN_MIN - 8, phaseDifficulty.spawnBias.minClamp);
      const spawnCeil = Math.min(SPAWN_MAX + 8, phaseDifficulty.spawnBias.maxClamp);
      const nextBaseline = SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN);
      g.spawnBaseline = Math.max(spawnFloor, Math.min(spawnCeil, nextBaseline));

      g.spawnInterval = Math.max(
        spawnFloor,
        Math.min(
          spawnCeil,
          g.spawnBaseline
            - speedBias * phaseDifficulty.spawnBias.speedBias
            - phaseBias
            - telemetryBias
            + safeBias
            + localJitter,
        ),
      );
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
      const sameLane = Math.abs(obs.lane - g.laneSmooth) < 0.45;
      const avoidedByLane = !sameLane;
      const avoidedByDuck = def.avoidBy === "duck" && g.isDucking;
      const avoided = avoidedByLane || avoidedByDuck;

      if (!avoided && !g.isInvincible) {
        telemetry.noDamageDodges = 0;
        obs.active = false;
        g.lives -= 1;
        g.combo = 0;
        telemetry.hitsTaken += 1;
        g.recoveryTimer = 1800;
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

      if (avoided && sameLane && obs.depth < 0.08) {
        telemetry.nearMisses += 1;
      }
    }

    if (obs.active && obs.depth < -0.03) {
      obs.active = false;
      g.combo += 1;
      telemetry.dodges += 1;
      if (telemetry.hitsTaken === 0) telemetry.noDamageDodges += 1;
      g.maxCombo = Math.max(g.maxCombo, g.combo);
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
