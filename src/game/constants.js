export const W = 540;
export const H = 960;
export const LANE_COUNT = 3;
export const HORIZON_Y = 190;
export const GROUND_BOTTOM = H - 22;
export const CAMERA_HEIGHT = H - 150;

export const INITIAL_SPEED = 1.6;
export const SPEED_GROW = 0.00033;
export const MAX_LIVES = 3;
export const INVINCIBLE_MS = 1250;
export const PHASE_SCORE = 800;

export const SPAWN_MIN = 52;
export const SPAWN_MAX = 110;

export const SUB_PHASES = {
  0: [
    { scoreThreshold: 0,   obstaclePool: [0, 2],             label: "Calentamiento" },
    { scoreThreshold: 280, obstaclePool: [0, 1, 2],          label: "Aparece el topo" },
    { scoreThreshold: 520, obstaclePool: [0, 1, 2, 3, 4],   label: "Cámaras y aspersores" },
    { scoreThreshold: 720, obstaclePool: [0, 1, 2, 3, 4, 5, 6], label: "Campo completo" },
  ],
  1: [
    { scoreThreshold: 0,   obstaclePool: [0, 1],                label: "Botellas y mecheros" },
    { scoreThreshold: 260, obstaclePool: [0, 1, 2, 3],          label: "Bufandas y monedas" },
    { scoreThreshold: 480, obstaclePool: [0, 1, 2, 3, 4, 5],   label: "Lluvia de todo" },
    { scoreThreshold: 680, obstaclePool: [0, 1, 2, 3, 4, 5, 6, 7], label: "Salen los hooligans" },
  ],
  2: [
    { scoreThreshold: 0,   obstaclePool: [0, 1],                   label: "Ojo a los carteristas" },
    { scoreThreshold: 240, obstaclePool: [0, 1, 2, 3],             label: "Vigila tu reloj" },
    { scoreThreshold: 460, obstaclePool: [0, 1, 2, 3, 4],          label: "Cámaras VAR" },
    { scoreThreshold: 660, obstaclePool: [0, 1, 2, 3, 4, 5, 6],   label: "Árbitros y final" },
  ],
};

export const difficultyByPhase = [
  {
    speedCurve: {
      earlyCap: 2.8,
      midCap: 3.8,
      lateCap: 5.0,
      earlySlope: 0.0006,
      midSlope: 0.0008,
      lateSlope: 0.0006,
      midStart: 450,
      lateStart: 800,
    },
    spawnBias: {
      speedBias: 0.8,
      phaseBias: 0,
      minClamp: 55,
      maxClamp: 130,
    },
  },
  {
    speedCurve: {
      earlyCap: 3.6,
      midCap: 4.8,
      lateCap: 5.8,
      earlySlope: 0.0012,
      midSlope: 0.0009,
      lateSlope: 0.00070,
      midStart: 400,
      lateStart: 750,
    },
    spawnBias: {
      speedBias: 1.1,
      phaseBias: 1.0,
      minClamp: 48,
      maxClamp: 110,
    },
  },
  {
    speedCurve: {
      earlyCap: 4.0,
      midCap: 5.4,
      lateCap: 6.3,
      earlySlope: 0.0016,
      midSlope: 0.0010,
      lateSlope: 0.00080,
      midStart: 400,
      lateStart: 750,
    },
    spawnBias: {
      speedBias: 1.5,
      phaseBias: 1.8,
      minClamp: 44,
      maxClamp: 100,
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
