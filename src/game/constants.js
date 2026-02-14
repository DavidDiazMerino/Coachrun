export const W = 960;
export const H = 540;
export const LANE_COUNT = 3;
export const HORIZON_Y = 118;
export const GROUND_BOTTOM = H - 22;
export const CAMERA_HEIGHT = H - 84;

export const INITIAL_SPEED = 2.8;
export const SPEED_GROW = 0.00033;
export const MAX_LIVES = 3;
export const INVINCIBLE_MS = 1250;
export const PHASE_SCORE = 320;

export const SPAWN_MIN = 46;
export const SPAWN_MAX = 84;

export const difficultyByPhase = [
  {
    speedCurve: {
      earlyCap: 3.9,
      midCap: 5.2,
      lateCap: 6,
      earlySlope: 0.0024,
      midSlope: 0.0012,
      lateSlope: 0.0007,
      midStart: 320,
      lateStart: 960,
    },
    spawnBias: {
      speedBias: 1.4,
      phaseBias: 0,
      minClamp: 43,
      maxClamp: 90,
    },
  },
  {
    speedCurve: {
      earlyCap: 4.3,
      midCap: 5.8,
      lateCap: 6.5,
      earlySlope: 0.0026,
      midSlope: 0.00135,
      lateSlope: 0.00078,
      midStart: 320,
      lateStart: 960,
    },
    spawnBias: {
      speedBias: 1.8,
      phaseBias: 1.4,
      minClamp: 40,
      maxClamp: 84,
    },
  },
  {
    speedCurve: {
      earlyCap: 4.8,
      midCap: 6.4,
      lateCap: 7.2,
      earlySlope: 0.00285,
      midSlope: 0.00145,
      lateSlope: 0.00088,
      midStart: 320,
      lateStart: 960,
    },
    spawnBias: {
      speedBias: 2.1,
      phaseBias: 2.4,
      minClamp: 38,
      maxClamp: 80,
    },
  },
];

export const COLORS = {
  white: "#FFFFFF",
  black: "#121212",
  yellow: "#FFD400",
  red: "#CB3234",
  blue: "#253166",
  skin: "#E7B784",
  skinShadow: "#CFA173",
  suit: "#181A28",
  suitLight: "#2A2F45",
  grassA: "#2D8A47",
  grassB: "#236A37",
  shadow: "rgba(0,0,0,0.24)",
};
