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
  SUB_PHASES,
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
    isJumping: false,
    jumpTimer: 0,
    jumpHeight: 0,
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
    boosters: [],
    activeBooster: null,
    boosterSpawnCooldown: 0,
    particles: [],
    floats: [],
    spawnTimer: 0,
    spawnInterval: spawnBase,
    spawnBaseline: spawnBase,
    phase: 0,
    maxPhase: 0,
    phaseTransition: -1,
    phaseTransitionTarget: 0,
    phaseLocalScore: 0,
    subPhase: 0,
    subPhaseLabel: null,
    subPhaseLabelTimer: 0,
    shakeTimer: 0,
    shakeX: 0,
    shakeY: 0,
    directorAggro: 1,
    recoveryTimer: 0,
    startTime: Date.now(),
    elapsedTime: 0,
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

export function updateGameState(g, now, onGameOver, onVictory) {
  const dt = Math.min((now - g.lastNow) / 16.67, 3);
  g.lastNow = now;
  g.frame += dt;

  g.elapsedTime = now - g.startTime;

  if (g.phaseTransition >= 0) {
    g.phaseTransition += 0.01 * dt;
    g.startTime += (now - g.lastNow);
    if (g.phaseTransition >= 1) {
      g.phase = g.phaseTransitionTarget;
      g.maxPhase = Math.max(g.maxPhase, g.phase);
      g.phaseTransition = -1;
      g.obstacles = [];
      g.boosters = [];
      g.activeBooster = null;
      g.boosterSpawnCooldown = 0;
      g.phaseLocalScore = 0;
      g.subPhase = 0;
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

  const victoryScore = PHASE_SCORE * STADIUMS.length;
  if (g.phase === STADIUMS.length - 1 && g.score >= victoryScore && g.phaseTransition < 0) {
    if (onVictory) {
      onVictory(g.score);
      return STADIUMS[g.phase];
    }
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

  let speedMultiplier = 1;
  if (g.activeBooster?.effect === "speed") speedMultiplier = g.activeBooster.multiplier;
  if (g.activeBooster?.effect === "slowmo") speedMultiplier = g.activeBooster.multiplier;

  g.speed = getSpeedByCurve(g.score, phaseDifficulty) * g.directorAggro * speedMultiplier;
  g.scrollX += g.speed * dt * 10;
  g.laneSmooth += (g.targetLane - g.laneSmooth) * 0.45 * dt;

  if (g.isDucking) {
    g.duckTimer -= 16.67 * dt;
    if (g.duckTimer <= 0) g.isDucking = false;
  }

  if (g.isJumping) {
    g.jumpTimer -= 16.67 * dt;
    const totalJump = 500;
    const elapsed = totalJump - g.jumpTimer;
    const t = elapsed / totalJump;
    g.jumpHeight = Math.max(0, 4 * t * (1 - t));
    if (g.jumpTimer <= 0) {
      g.isJumping = false;
      g.jumpHeight = 0;
    }
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

  // Sub-phase tracking
  const subPhases = SUB_PHASES[g.phase] || SUB_PHASES[0];
  const newSubPhase = subPhases.filter(sp => g.phaseLocalScore >= sp.scoreThreshold).length - 1;
  if (newSubPhase > g.subPhase) {
    g.subPhase = newSubPhase;
    g.subPhaseLabel = subPhases[newSubPhase].label;
    g.subPhaseLabelTimer = 120;
  }
  if (g.subPhaseLabelTimer > 0) {
    g.subPhaseLabelTimer -= dt;
  }

  // Active booster countdown
  if (g.activeBooster) {
    g.activeBooster.timer -= 16.67 * dt;
    if (g.activeBooster.timer <= 0) {
      g.activeBooster = null;
    }
  }

  if (g.phaseTransition < 0) {
    g.spawnTimer += dt;
    if (g.spawnTimer >= g.spawnInterval) {
      g.spawnTimer = 0;

      const currentSubPhase = subPhases.filter(sp => g.phaseLocalScore >= sp.scoreThreshold).pop();
      const pool = currentSubPhase ? currentSubPhase.obstaclePool : [0];
      const type = pool[Math.floor(Math.random() * pool.length)];

      const lane = Math.floor(Math.random() * LANE_COUNT);
      const obsDef = stadium.obstacles[type];
      const isMole = obsDef && obsDef.type === "mole";
      const isMoving = obsDef && obsDef.moving;
      g.obstacles.push({
        lane,
        type,
        depth: 1,
        active: true,
        molePhase: isMole ? -0.55 : undefined,
        moving: isMoving || false,
        moveDirection: isMoving ? (Math.random() > 0.5 ? 1 : -1) : 0,
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

    // Booster spawning
    if (stadium.booster && !g.activeBooster) {
      g.boosterSpawnCooldown -= dt;
      if (g.boosterSpawnCooldown <= 0) {
        g.boosterSpawnCooldown = 120;
        if (g.boosters.length === 0 && Math.random() < stadium.booster.spawnChance) {
          g.boosters.push({
            lane: Math.floor(Math.random() * LANE_COUNT),
            depth: 1,
            active: true,
            screenX: 0,
            screenY: 0,
            scale: 1,
          });
        }
      }
    }
  }

  g.obstacles.forEach((obs) => {
    if (obs.molePhase !== undefined) {
      obs.molePhase += 0.017 * dt;
      obs.depth = obs.molePhase < 0 ? 0.35 : obs.depth - g.speed * 0.004 * dt;
    } else {
      obs.depth -= g.speed * 0.006 * dt;
    }

    // Moving obstacles (hooligans)
    if (obs.moving) {
      const moveDef = stadium.obstacles[obs.type];
      const moveSpeed = (moveDef && moveDef.moveSpeed ? moveDef.moveSpeed : 0.008) * dt * 60;
      obs.lane += obs.moveDirection * moveSpeed;
      if (obs.lane > 2.2) { obs.moveDirection = -1; obs.lane = 2.2; }
      if (obs.lane < -0.2) { obs.moveDirection = 1; obs.lane = -0.2; }
    }

    const d = Math.max(0, obs.depth);
    obs.scale = depthScale(d);
    obs.screenX = laneToX(obs.lane, d, g.laneSmooth);
    obs.screenY = depthToY(d);

    if (obs.active) {
      const def = stadium.obstacles[obs.type];
      if (!def) return;
      const hb = def.hitbox || { depthFront: 0.11, depthBack: -0.02, laneTolerance: 0.38 };

      if (obs.depth < hb.depthFront && obs.depth > hb.depthBack) {
        const sameLane = Math.abs(obs.lane - g.laneSmooth) < hb.laneTolerance;
        const avoidedByLane = !sameLane;
        const avoidedByDuck = def.avoidBy === "duck" && g.isDucking;
        const avoidedByJump = def.avoidBy === "jump" && g.isJumping && g.jumpHeight > 0.3;
        const avoided = avoidedByLane || avoidedByDuck || avoidedByJump;

        if (!avoided && !g.isInvincible) {
          if (g.activeBooster?.effect === "shield") {
            g.activeBooster = null;
            obs.active = false;
            g.isInvincible = true;
            g.invTimer = 600;
            g.shakeTimer = 100;
            g.floats.push({ x: W / 2, y: CAMERA_HEIGHT - 100, text: "ESCUDO!", life: 1, color: "#1565C0" });
            for (let i = 0; i < 6; i++) {
              g.particles.push({
                x: obs.screenX,
                y: obs.screenY,
                vx: (Math.random() - 0.5) * 6,
                vy: -Math.random() * 4,
                life: 1,
                color: "#1565C0",
              });
            }
          } else {
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
        }

        if (avoided && sameLane && obs.depth < 0.08) {
          telemetry.nearMisses += 1;
          g.floats.push({
            x: obs.screenX,
            y: obs.screenY - 20,
            text: "NEAR!",
            life: 0.8,
            color: "#FF9800",
          });
        }
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
      g.phaseLocalScore += pts;
      g.floats.push({ x: W / 2, y: CAMERA_HEIGHT - 118, text: `+${pts}`, life: 1, color: g.combo >= 3 ? COLORS.yellow : COLORS.white });
    }
  });

  g.obstacles = g.obstacles.filter((o) => o.depth > -0.14);

  // Update boosters
  g.boosters.forEach((b) => {
    b.depth -= g.speed * 0.006 * dt;
    const d = Math.max(0, b.depth);
    b.scale = depthScale(d);
    b.screenX = laneToX(b.lane, d, g.laneSmooth);
    b.screenY = depthToY(d);

    if (b.active && b.depth < 0.10 && b.depth > -0.02) {
      const sameLane = Math.abs(b.lane - g.laneSmooth) < 0.45;
      if (sameLane) {
        b.active = false;
        const boosterDef = stadium.booster;
        g.activeBooster = {
          type: boosterDef.type,
          effect: boosterDef.effect,
          timer: boosterDef.duration,
          multiplier: boosterDef.multiplier || 1,
          maxDuration: boosterDef.duration,
        };
        g.floats.push({
          x: W / 2,
          y: CAMERA_HEIGHT - 140,
          text: `${boosterDef.name}!`,
          life: 1.2,
          color: boosterDef.color,
        });
        for (let i = 0; i < 8; i++) {
          g.particles.push({
            x: b.screenX,
            y: b.screenY,
            vx: (Math.random() - 0.5) * 6,
            vy: -Math.random() * 5,
            life: 1,
            color: boosterDef.color,
          });
        }
      }
    }
  });
  g.boosters = g.boosters.filter((b) => b.depth > -0.14 && b.active);

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
