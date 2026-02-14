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

  for (let i = 0; i < 14; i++) {
    const d = 1 - ((i * 0.08 + (scrollX * 0.012) % 0.08) % 1);
    const y = depthToY(d);
    const y2 = depthToY(Math.max(0, d - 0.045));
    if (i % 2 === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(0, y, W, y2 - y);
    }
  }

  for (let d = 0; d < 1; d += 0.015) {
    const y = depthToY(d);
    const y2 = depthToY(Math.max(0, d - 0.015));
    const { leftEdge, columnWidth, rightEdge } = getTrackColumns(d, cameraLane);
    const rowH = Math.max(1, y2 - y);
    px(ctx, leftEdge, y, columnWidth, rowH, "rgba(16,120,52,0.28)");
    px(ctx, rightEdge - columnWidth, y, columnWidth, rowH, "rgba(36,27,17,0.35)");
  }

  for (let d = 0; d < 1; d += 0.01) {
    const y = depthToY(d);
    const { leftEdge, columnWidth, rightEdge } = getTrackColumns(d, cameraLane);
    const lineW = Math.max(2, 6 - d * 4);

    px(ctx, leftEdge + columnWidth, y, lineW, 2, "rgba(255,255,255,0.2)");
    px(ctx, leftEdge + columnWidth * 4, y, lineW, 2, "rgba(255,255,255,0.2)");

    px(ctx, leftEdge + columnWidth * 0.45, y, Math.max(2, lineW + 1), 2, "#FFFFFFE0");

    const fenceX = rightEdge - columnWidth * 0.24;
    px(ctx, fenceX, y - 4, Math.max(2, lineW + 1), 8, "#C8B690");
    if (Math.floor((d * 100 + scrollX * 0.01) % 7) < 4) {
      px(ctx, fenceX + 2, y - 3, 2, 6, "rgba(255,255,255,0.38)");
    }
  }

  for (let lane = 0; lane < LANE_COUNT; lane++) {
    for (let d = 0; d < 1; d += 0.03) {
      const seg = (d + (scrollX * 0.006) % 0.07) % 1;
      const y = depthToY(seg);
      const sc = depthScale(seg);
      const x = laneToX(lane, seg, cameraLane);
      px(ctx, x - sc * 2, y, sc * 4, Math.max(1, sc * 4), "rgba(255,255,255,0.08)");
    }
  }

  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(0, CAMERA_HEIGHT + 15, W, H - (CAMERA_HEIGHT + 15));
}
