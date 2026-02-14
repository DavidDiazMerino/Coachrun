export const PROGRESSION_KEYS = {
  unlocks: "choloRun.unlocks",
  challenges: "choloRun.challenges",
};

export const CHALLENGES = [
  { id: "firstKickoff", label: "Juega 1 partida", target: 1, metric: "gamesPlayed" },
  { id: "score400", label: "Alcanza 400 puntos", target: 400, metric: "highScore" },
  { id: "combo8", label: "Logra combo x8", target: 8, metric: "bestCombo" },
  { id: "phase2", label: "Llega a la fase 2", target: 1, metric: "bestPhase" },
  { id: "phase3Perfect", label: "Llega a fase 3 con 3 vidas", target: 1, metric: "phase3PerfectRuns" },
  { id: "noDamage20", label: "Esquiva 20 obstáculos sin daño", target: 20, metric: "bestNoDamageDodges" },
  { id: "dodges150", label: "Esquiva 150 obstáculos en total", target: 150, metric: "totalDodges" },
  { id: "nearMiss12", label: "Consigue 12 near misses", target: 12, metric: "totalNearMisses" },
];

export const UNLOCKS = [
  { id: "paletteSunset", type: "palette", name: "Paleta Sunset", challengeId: "score400" },
  { id: "paletteNeon", type: "palette", name: "Paleta Neon", challengeId: "phase2" },
  { id: "trailGold", type: "trail", name: "Trail Dorado", challengeId: "combo8" },
  { id: "trailPulse", type: "trail", name: "Trail Pulsante", challengeId: "dodges150" },
  { id: "coachTracksuit", type: "coach", name: "Coach Chándal", challengeId: "phase3Perfect" },
  { id: "coachLegend", type: "coach", name: "Coach Leyenda", challengeId: "noDamage20" },
];

export const DEFAULT_COSMETICS = {
  palette: "default",
  trail: "default",
  coach: "default",
};

export const COSMETIC_PRESETS = {
  default: {
    palette: { border: "#CB3234", bg: "#0A0D19", glow: "rgba(203,50,52,0.3)" },
    trail: { color: "rgba(255,255,255,0.18)", pulse: false },
    coach: { suit: null, suitLight: null, accent: null, hair: null },
  },
  paletteSunset: {
    palette: { border: "#FF7043", bg: "#1A1024", glow: "rgba(255,112,67,0.35)" },
  },
  paletteNeon: {
    palette: { border: "#00E5FF", bg: "#070A19", glow: "rgba(0,229,255,0.35)" },
  },
  trailGold: {
    trail: { color: "rgba(255,213,79,0.45)", pulse: false },
  },
  trailPulse: {
    trail: { color: "rgba(0,229,255,0.55)", pulse: true },
  },
  coachTracksuit: {
    coach: { suit: "#163D2E", suitLight: "#1F5B45", accent: "#8BC34A", hair: "#1B1B1B" },
  },
  coachLegend: {
    coach: { suit: "#231942", suitLight: "#3B2D6B", accent: "#FFD54F", hair: "#2B2B2B" },
  },
};

export function safeReadJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function safeWriteJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage bloqueado
  }
}

export function evaluateProgress(profile) {
  const challenges = {};
  CHALLENGES.forEach((challenge) => {
    const current = Number(profile[challenge.metric] || 0);
    challenges[challenge.id] = {
      completed: current >= challenge.target,
      current: Math.min(current, challenge.target),
      target: challenge.target,
    };
  });

  const unlocks = {};
  UNLOCKS.forEach((unlock) => {
    unlocks[unlock.id] = Boolean(challenges[unlock.challengeId]?.completed);
  });

  return { challenges, unlocks };
}

export function getNextChallenge(challenges) {
  for (const challenge of CHALLENGES) {
    if (!challenges[challenge.id]?.completed) return challenge;
  }
  return null;
}

export function deriveActiveCosmetics(unlocks) {
  return {
    palette: unlocks.paletteNeon ? "paletteNeon" : unlocks.paletteSunset ? "paletteSunset" : "default",
    trail: unlocks.trailPulse ? "trailPulse" : unlocks.trailGold ? "trailGold" : "default",
    coach: unlocks.coachLegend ? "coachLegend" : unlocks.coachTracksuit ? "coachTracksuit" : "default",
  };
}

export function resolveCosmeticTheme(activeCosmetics) {
  const merged = {
    palette: { ...COSMETIC_PRESETS.default.palette },
    trail: { ...COSMETIC_PRESETS.default.trail },
    coach: { ...COSMETIC_PRESETS.default.coach },
  };

  Object.values(activeCosmetics).forEach((id) => {
    const preset = COSMETIC_PRESETS[id];
    if (!preset) return;
    if (preset.palette) merged.palette = { ...merged.palette, ...preset.palette };
    if (preset.trail) merged.trail = { ...merged.trail, ...preset.trail };
    if (preset.coach) merged.coach = { ...merged.coach, ...preset.coach };
  });

  return merged;
}
