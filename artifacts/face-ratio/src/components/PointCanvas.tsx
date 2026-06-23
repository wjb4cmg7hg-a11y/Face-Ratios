import { useEffect, useRef, useCallback, useState } from "react";
import type { Landmarks } from "../lib/landmarks";
import type { KeyPointPositions, PointKey } from "../lib/keyPoints";
import { KEY_POINT_DEFS } from "../lib/keyPoints";
import { DRAW_CONNECTIONS } from "../lib/drawConnections";
import type { RatioDiagram } from "../lib/measurementDiagram";
import { ROLE_COLOR } from "../lib/measurementDiagram";

interface PointCanvasProps {
  imageUrl: string;
  landmarks: Landmarks;
  keyPoints: KeyPointPositions;
  imageWidth: number;
  imageHeight: number;
  editMode: boolean;
  activeDiagram: RatioDiagram | null;
  selectedEditKey: PointKey | null;
  onKeySelect: (key: PointKey | null) => void;
  onDragStart: (key: PointKey) => void;
  onPointsChange: (updated: KeyPointPositions) => void;
}

const SMALL_DOT_RADIUS = 2;
const DEFAULT_DOT_RADIUS = 5;
const HIT_RADIUS = 18;
const DRAG_THRESHOLD = 5; // px in canvas space before we consider it a drag

// ── Drawing helpers ──────────────────────────────────────────────────────────

function drawDoubleArrow(
  ctx: CanvasRenderingContext2D,
  ax: number, ay: number,
  bx: number, by: number,
  color: string,
  lineWidth: number,
) {
  const angle = Math.atan2(by - ay, bx - ax);
  const len = Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
  const aSize = Math.min(9, len * 0.15);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;

  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();

  for (const [px2, py2, dir] of [[bx, by, 1], [ax, ay, -1]] as [number, number, number][]) {
    ctx.beginPath();
    ctx.moveTo(px2, py2);
    ctx.lineTo(
      px2 + dir * aSize * Math.cos(angle + 0.38 + Math.PI),
      py2 + dir * aSize * Math.sin(angle + 0.38 + Math.PI),
    );
    ctx.lineTo(
      px2 + dir * aSize * Math.cos(angle - 0.38 + Math.PI),
      py2 + dir * aSize * Math.sin(angle - 0.38 + Math.PI),
    );
    ctx.closePath();
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawLineLabel(
  ctx: CanvasRenderingContext2D,
  ax: number, ay: number,
  bx: number, by: number,
  label: string | undefined,
  color: string,
) {
  // Labels are shown below the image rather than on the photo itself.
}

function drawAngleArc(
  ctx: CanvasRenderingContext2D,
  vx: number, vy: number,
  ax: number, ay: number,
  bx: number, by: number,
  color: string,
  label: string,
) {
  const angle1 = Math.atan2(ay - vy, ax - vx);
  const angle2 = Math.atan2(by - vy, bx - vx);
  const r = 24;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(vx, vy, r, angle1, angle2, false);
  ctx.stroke();
  ctx.restore();
}

// ── Component ────────────────────────────────────────────────────────────────

export function PointCanvas({
  imageUrl,
  landmarks,
  keyPoints,
  imageWidth,
  imageHeight,
  editMode,
  activeDiagram,
  selectedEditKey,
  onKeySelect,
  onDragStart,
  onPointsChange,
}: PointCanvasProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef       = useRef<HTMLImageElement | null>(null);

  const scaleRef = useRef(1);
  const kpRef    = useRef<KeyPointPositions>(keyPoints);
  const dragRef  = useRef<{ key: PointKey; startX: number; startY: number; moved: boolean } | null>(null);
  const [hoveredKey, setHoveredKey] = useState<PointKey | null>(null);
  const hoveredKeyRef = useRef<PointKey | null>(null);

  useEffect(() => { kpRef.current = keyPoints; }, [keyPoints]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const scale = scaleRef.current;
    const kp = kpRef.current;
    const W = imageWidth;
    const H = imageHeight;

    ctx.strokeStyle = activeDiagram
      ? "rgba(139,195,160,0.12)"
      : "rgba(139,195,160,0.28)";
    ctx.lineWidth = 0.7;
    for (const [a, b] of DRAW_CONNECTIONS) {
      const la = landmarks[a]; const lb = landmarks[b];
      if (!la || !lb) continue;
      ctx.beginPath();
      ctx.moveTo(la.x * W * scale, la.y * H * scale);
      ctx.lineTo(lb.x * W * scale, lb.y * H * scale);
      ctx.stroke();
    }

    // ── Diagram overlay (works alongside edit mode) ───────────────
    if (activeDiagram) {
      const px = (key: PointKey) => ({ x: kp[key].x * scale, y: kp[key].y * scale });
      for (const line of activeDiagram.lines) {
        const from = px(line.from); const to = px(line.to);
        const color = ROLE_COLOR[line.role];
        drawDoubleArrow(ctx, from.x, from.y, to.x, to.y, color, line.role === "ref" ? 1.5 : 2.5);
      }
      for (const ang of activeDiagram.angles) {
        const v = px(ang.vertex); const a1 = px(ang.arm1); const a2 = px(ang.arm2);
        drawAngleArc(ctx, v.x, v.y, a1.x, a1.y, a2.x, a2.y, "#a78bfa", ang.label);
      }
      // If not in edit mode, do not draw highlight dots on the photo (legend is shown below)
      if (!editMode) {
        return;
      }
      // In edit mode — fall through so draggable dots render on top of diagram lines
    }

    const keys = Object.keys(kp) as PointKey[];
    const diagramPointSet = new Set<PointKey>();
    if (activeDiagram) {
      for (const line of activeDiagram.lines) {
        diagramPointSet.add(line.from);
        diagramPointSet.add(line.to);
      }
      for (const ang of activeDiagram.angles) {
        diagramPointSet.add(ang.vertex);
        diagramPointSet.add(ang.arm1);
        diagramPointSet.add(ang.arm2);
      }
    }

    for (const key of keys) {
      const pt = kp[key]; const def = KEY_POINT_DEFS[key];
      const isSelected = selectedEditKey === key;
      const isHovered  = hoveredKeyRef.current === key;
      const isDragging = dragRef.current?.key === key;
      const isRatioPoint = diagramPointSet.has(key);
      const showPoint = !activeDiagram || isSelected || isHovered || isDragging || isRatioPoint;
      if (!showPoint) continue;
      const cx = pt.x * scale; const cy = pt.y * scale;

      let r: number;
      if (editMode) {
        if (isDragging) r = SMALL_DOT_RADIUS; // dragged point should stay small
        else if (isHovered || isSelected) r = SMALL_DOT_RADIUS; // selected/hovered points remain small
        else if (isRatioPoint) r = SMALL_DOT_RADIUS; // ratio points not being adjusted are small
        else r = SMALL_DOT_RADIUS;
      } else {
        r = isRatioPoint ? DEFAULT_DOT_RADIUS : SMALL_DOT_RADIUS;
      }

      ctx.save();
      ctx.shadowColor = def.color;
      ctx.shadowBlur = isSelected ? 16 : isHovered || isDragging ? 10 : 4;

      // Outer ring for selected
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
        ctx.strokeStyle = def.color;
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.beginPath();
      ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = def.color;
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.restore();

      if (isSelected || isHovered || isDragging) {
        const label = def.label;
        ctx.font = "bold 11px Inter, sans-serif";
        const tw = ctx.measureText(label).width;
        const lx = cx - tw / 2;
        const ly = cy - r - 14;
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.beginPath();
        ctx.roundRect(lx - 5, ly - 11, tw + 10, 16, 4);
        ctx.fill();
        ctx.fillStyle = def.color;
        ctx.fillText(label, lx, ly);
      }
    }
  }, [landmarks, imageWidth, imageHeight, editMode, activeDiagram, selectedEditKey]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const img = new Image();
    img.src = imageUrl;
    imgRef.current = img;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const maxW = container.clientWidth;
      const scale = Math.min(maxW / imageWidth, 1);
      scaleRef.current = scale;
      canvas.width  = Math.round(imageWidth * scale);
      canvas.height = Math.round(imageHeight * scale);
      draw();
    };
  }, [imageUrl, imageWidth, imageHeight, draw]);

  useEffect(() => { draw(); }, [keyPoints, editMode, activeDiagram, selectedEditKey, draw, hoveredKey]);

  const canvasPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width  / rect.width),
      y: (e.clientY - rect.top)  * (canvas.height / rect.height),
    };
  };

  const findNearest = (cx: number, cy: number): PointKey | null => {
    const scale = scaleRef.current;
    const kp = kpRef.current;
    const visibleKeys = new Set<PointKey>();
    if (activeDiagram) {
      for (const line of activeDiagram.lines) {
        visibleKeys.add(line.from);
        visibleKeys.add(line.to);
      }
      for (const ang of activeDiagram.angles) {
        visibleKeys.add(ang.vertex);
        visibleKeys.add(ang.arm1);
        visibleKeys.add(ang.arm2);
      }
    }

    let best: PointKey | null = null;
    let bestDist = HIT_RADIUS * HIT_RADIUS;
    for (const k of Object.keys(kp) as PointKey[]) {
      if (activeDiagram && !visibleKeys.has(k)) continue;
      const pt = kp[k];
      const dx = pt.x * scale - cx;
      const dy = pt.y * scale - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDist) { bestDist = d2; best = k; }
    }
    return best;
  };

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!editMode) return;
    const { x, y } = canvasPos(e);
    const nearest = findNearest(x, y);
    if (!nearest) return;
    dragRef.current = { key: nearest, startX: x, startY: y, moved: false };
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [editMode, activeDiagram]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = canvasPos(e);
    if (dragRef.current) {
      const dx = x - dragRef.current.startX;
      const dy = y - dragRef.current.startY;
      if (!dragRef.current.moved && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
        dragRef.current.moved = true;
        onDragStart(dragRef.current.key);
      }
      if (dragRef.current.moved) {
        const scale = scaleRef.current;
        kpRef.current = { ...kpRef.current, [dragRef.current.key]: { x: x / scale, y: y / scale } };
        draw();
      }
      e.preventDefault();
      return;
    }
    if (!editMode) return;
    const nearest = findNearest(x, y);
    if (nearest !== hoveredKeyRef.current) {
      hoveredKeyRef.current = nearest;
      setHoveredKey(nearest);
    }
  }, [editMode, draw, onDragStart, activeDiagram]);

  const onPointerUp = useCallback(() => {
    if (!dragRef.current) return;
    const { moved, key } = dragRef.current;
    if (moved) {
      onPointsChange({ ...kpRef.current });
    } else {
      // It was a tap, not a drag — toggle selection
      onKeySelect(key === selectedEditKey ? null : key);
    }
    dragRef.current = null;
    draw();
  }, [onPointsChange, onKeySelect, selectedEditKey, draw]);

  const onPointerLeave = useCallback(() => {
    if (hoveredKeyRef.current !== null) {
      hoveredKeyRef.current = null;
      setHoveredKey(null);
    }
  }, []);

  const cursor = editMode
    ? dragRef.current?.moved ? "grabbing" : hoveredKey ? "grab" : "crosshair"
    : "default";

  return (
    <div ref={containerRef} className="canvas-container">
      <canvas
        ref={canvasRef}
        className="canvas-el"
        style={{ cursor, touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
      />
      <div className="canvas-legend">
        {editMode ? (
          (["forehead","eyes","nose","mouth","face"] as const).map((g) => (
            <span key={g} className="canvas-legend__item">
              <span className="canvas-legend__dot" style={{
                background: g === "forehead" ? "#a78bfa" : g === "eyes" ? "#34d399"
                  : g === "nose" ? "#fbbf24" : g === "mouth" ? "#f472b6" : "#60a5fa"
              }} />
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </span>
          ))
        ) : activeDiagram ? (
          (() => {
            const used = new Set<PointKey>();
            for (const line of activeDiagram.lines) { used.add(line.from); used.add(line.to); }
            for (const ang of activeDiagram.angles) { used.add(ang.vertex); used.add(ang.arm1); used.add(ang.arm2); }
            return Array.from(used).map((k) => {
              const def = KEY_POINT_DEFS[k];
              if (!def) return null;
              return (
                <span key={k} className="canvas-legend__item">
                  <span className="canvas-legend__dot" style={{ background: def.color }} />
                  {def.label}
                </span>
              );
            });
          })()
        ) : null}
      </div>
    </div>
  );
}
