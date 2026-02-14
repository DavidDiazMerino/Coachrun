export const W = 540;
export const H = 960;
export const LANE_COUNT = 3;
export const HORIZON_Y = 190;
export const GROUND_BOTTOM = H - 22;
export const CAMERA_HEIGHT = H - 150;

export const INITIAL_SPEED = 2.8;
export const SPEED_GROW = 0.00033;
export const MAX_LIVES = 3;
export const INVINCIBLE_MS = 1250;
export const PHASE_SCORE = 800;

export const SPAWN_MIN = 46;
export const SPAWN_MAX = 84;

export const SUB_PHASES = {
  0: [
    { scoreThreshold: 0,   obstaclePool: [0, 2],             label: "Calentamiento" },
    { scoreThreshold: 180, obstaclePool: [0, 1, 2],          label: "Aparece el topo" },
    { scoreThreshold: 380, obstaclePool: [0, 1, 2, 3, 4],   label: "Cámaras y aspersores" },
    { scoreThreshold: 580, obstaclePool: [0, 1, 2, 3, 4, 5, 6], label: "Campo completo" },
  ],
  1: [
    { scoreThreshold: 0,   obstaclePool: [0, 1],                label: "Botellas y mecheros" },
    { scoreThreshold: 180, obstaclePool: [0, 1, 2, 3],          label: "Bufandas y monedas" },
    { scoreThreshold: 380, obstaclePool: [0, 1, 2, 3, 4, 5],   label: "Lluvia de todo" },
    { scoreThreshold: 580, obstaclePool: [0, 1, 2, 3, 4, 5, 6, 7], label: "Salen los hooligans" },
  ],
  2: [
    { scoreThreshold: 0,   obstaclePool: [0, 1],                   label: "Ojo a los carteristas" },
    { scoreThreshold: 180, obstaclePool: [0, 1, 2, 3],             label: "Vigila tu reloj" },
    { scoreThreshold: 380, obstaclePool: [0, 1, 2, 3, 4],          label: "Cámaras VAR" },
    { scoreThreshold: 580, obstaclePool: [0, 1, 2, 3, 4, 5, 6],   label: "Árbitros y final" },
  ],
};

export const difficultyByPhase = [
  {
    speedCurve: {
      earlyCap: 3.6,
      midCap: 4.8,
      lateCap: 5.8,
      earlySlope: 0.0018,
      midSlope: 0.0010,
      lateSlope: 0.0006,
      midStart: 300,
      lateStart: 650,
    },
    spawnBias: {
      speedBias: 1.2,
      phaseBias: 0,
      minClamp: 48,
      maxClamp: 95,
    },
  },
  {
    speedCurve: {
      earlyCap: 4.3,
      midCap: 5.8,
      lateCap: 6.5,
      earlySlope: 0.0024,
      midSlope: 0.0012,
      lateSlope: 0.00075,
      midStart: 300,
      lateStart: 650,
    },
    spawnBias: {
      speedBias: 1.6,
      phaseBias: 1.2,
      minClamp: 42,
      maxClamp: 88,
    },
  },
  {
    speedCurve: {
      earlyCap: 4.8,
      midCap: 6.4,
      lateCap: 7.2,
      earlySlope: 0.0028,
      midSlope: 0.0014,
      lateSlope: 0.00085,
      midStart: 300,
      lateStart: 650,
    },
    spawnBias: {
      speedBias: 2.0,
      phaseBias: 2.2,
      minClamp: 38,
      maxClamp: 82,
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
