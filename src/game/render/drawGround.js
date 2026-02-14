import { CAMERA_HEIGHT, COLORS, H, HORIZON_Y, LANE_COUNT, W } from "../constants";
import { depthScale, depthToY, getTrackColumns, laneToX, px } from "./projection";

export function drawGround(ctx, scrollX, cameraLane, palette = {}) {
  const grassTop = palette.grassTop || COLORS.grassB;
  const grassBottom = palette.grassBottom || COLORS.grassA;

  const grad = ctx.createLinearGradient(0, HORIZON_Y, 0, H);
  grad.addColorStop(0, grassTop);
  grad.addColorStop(1, grassBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, HORIZON_Y, W, H - HORIZON_Y);

  // Alternating depth stripes for depth perception
  for (let i = 0; i < 14; i++) {
    const d = 1 - ((i * 0.08 + (scrollX * 0.012) % 0.08) % 1);
    const y = depthToY(d);
    const y2 = depthToY(Math.max(0, d - 0.045));
    if (i % 2 === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(0, y, W, y2 - y);
    }
  }

  // Column overlays: left = field, right = fence/stands area
  for (let d = 0; d < 1; d += 0.015) {
    const y = depthToY(d);
    const y2 = depthToY(Math.max(0, d - 0.015));
    const { leftEdge, columnWidth, rightEdge } = getTrackColumns(d, cameraLane);
    const rowH = Math.max(1, y2 - y);
    // Left column: darker field green (the pitch)
    px(ctx, leftEdge, y, columnWidth, rowH, "rgba(16,120,52,0.32)");
    // Right column: darker ground for the fence corridor
    px(ctx, rightEdge - columnWidth, y, columnWidth, rowH, "rgba(36,27,17,0.38)");
  }

  // --- Left column: continuous white touchline (sideline) ---
  for (let d = 0; d < 1; d += 0.005) {
    const y = depthToY(d);
    const y2 = depthToY(Math.max(0, d - 0.005));
    const { leftEdge, columnWidth } = getTrackColumns(d, cameraLane);
    const lineW = Math.max(3, 8 - d * 5);
    const rowH = Math.max(1, y2 - y + 1);
    // Solid continuous white touchline at the boundary between column 0 and column 1
    px(ctx, leftEdge + columnWidth - lineW / 2, y, lineW, rowH, "#FFFFFFD8");
  }

  // Left column: pitch markings (small horizontal dashes to look like a football pitch)
  for (let d = 0; d < 1; d += 0.04) {
    const seg = (d + (scrollX * 0.008) % 0.04) % 1;
    const y = depthToY(seg);
    const { leftEdge, columnWidth } = getTrackColumns(seg, cameraLane);
    const sc = depthScale(seg);
    const dashW = Math.max(4, sc * 14);
    // Small grass markings inside the field
    px(ctx, leftEdge + columnWidth * 0.3 - dashW / 2, y, dashW, Math.max(1, sc * 2), "rgba(255,255,255,0.12)");
  }

  // --- Right column: fence with posts ---
  for (let d = 0; d < 1; d += 0.01) {
    const y = depthToY(d);
    const { rightEdge, columnWidth } = getTrackColumns(d, cameraLane);
    const lineW = Math.max(2, 6 - d * 4);
    // Fence rail (horizontal bar)
    const fenceX = rightEdge - columnWidth * 0.5;
    px(ctx, fenceX - lineW, y - 2, lineW * 3, 3, "#B0A080");
    // Fence posts at intervals
    if (Math.floor((d * 100 + scrollX * 0.01) % 6) < 2) {
      px(ctx, fenceX, y - 8, Math.max(2, lineW), 12, "#C8B690");
      px(ctx, fenceX + 1, y - 6, Math.max(1, lineW - 1), 8, "rgba(255,255,255,0.25)");
    }
  }

  // --- Right column: spectators behind the fence ---
  const spectatorColors = ["#CE9C6E", "#F2D2B4", "#E9BA88", "#D4956B", "#B87346"];
  const shirtColors = ["#CB3234", "#253166", "#FFD400", "#FFFFFF", "#2D8A47", "#FF6F00", "#7B1FA2"];
  for (let d = 0.05; d < 0.95; d += 0.035) {
    const seg = (d + (scrollX * 0.003) % 0.035) % 1;
    if (seg > 0.98 || seg < 0.02) continue;
    const y = depthToY(seg);
    const sc = depthScale(seg);
    const { rightEdge, columnWidth } = getTrackColumns(seg, cameraLane);
    const fenceX = rightEdge - columnWidth * 0.5;
    const headSize = Math.max(2, Math.round(sc * 5));
    const bodyH = Math.max(2, Math.round(sc * 7));

    // Draw 2-3 spectators per row behind the fence
    for (let i = 0; i < 3; i++) {
      const hash = Math.floor((seg * 100 + i * 37) * 13) % 100;
      if (hash > 70) continue; // skip some for variation
      const offsetX = fenceX + (i - 1) * (headSize * 2.5 + 2);
      const offsetY = y - 10 * sc;
      const wave = Math.sin(scrollX * 0.02 + seg * 10 + i * 2.1) * sc * 2;
      // Head
      const skinIdx = (hash + i) % spectatorColors.length;
      px(ctx, offsetX - headSize / 2, offsetY - headSize - bodyH + wave, headSize, headSize, spectatorColors[skinIdx]);
      // Body/shirt
      const shirtIdx = (hash * 3 + i * 7) % shirtColors.length;
      px(ctx, offsetX - headSize / 2 - 1, offsetY - bodyH + wave, headSize + 2, bodyH, shirtColors[shirtIdx]);
    }
  }

  // --- Lane divider lines (between the 3 playable columns) ---
  for (let d = 0; d < 1; d += 0.01) {
    const y = depthToY(d);
    const { leftEdge, columnWidth } = getTrackColumns(d, cameraLane);
    const lineW = Math.max(1, 4 - d * 3);
    // Divider between lane 0 and lane 1 (column 2 boundary)
    px(ctx, leftEdge + columnWidth * 2, y, lineW, 2, "rgba(255,255,255,0.13)");
    // Divider between lane 1 and lane 2 (column 3 boundary)
    px(ctx, leftEdge + columnWidth * 3, y, lineW, 2, "rgba(255,255,255,0.13)");
  }

  // --- Lane center markers (subtle dots for lane guidance) ---
  for (let lane = 0; lane < LANE_COUNT; lane++) {
    for (let d = 0; d < 1; d += 0.03) {
      const seg = (d + (scrollX * 0.006) % 0.07) % 1;
      const y = depthToY(seg);
      const sc = depthScale(seg);
      const x = laneToX(lane, seg, cameraLane);
      px(ctx, x - sc * 2, y, sc * 4, Math.max(1, sc * 4), "rgba(255,255,255,0.06)");
    }
  }

  // Bottom darkness (near camera)
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(0, CAMERA_HEIGHT + 15, W, H - (CAMERA_HEIGHT + 15));
}
