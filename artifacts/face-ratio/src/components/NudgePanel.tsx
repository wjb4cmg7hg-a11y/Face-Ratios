import { useCallback, useRef } from "react";
import type { PointKey } from "../lib/keyPoints";
import { KEY_POINT_DEFS } from "../lib/keyPoints";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, X } from "lucide-react";

interface NudgePanelProps {
  selectedKey: PointKey;
  hasMoved: boolean;
  onNudge: (dx: number, dy: number) => void;
  onReset: () => void;
  onDeselect: () => void;
}

function DirBtn({
  dx, dy, children, onNudge,
}: {
  dx: number; dy: number;
  children: React.ReactNode;
  onNudge: (dx: number, dy: number) => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef = useRef(false);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (timerRef.current)   { clearTimeout(timerRef.current);   timerRef.current   = null; }
    if (intervalRef.current){ clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const start = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    activeRef.current = true;
    onNudge(dx, dy);
    timerRef.current = setTimeout(() => {
      if (!activeRef.current) return;
      intervalRef.current = setInterval(() => {
        if (!activeRef.current) { stop(); return; }
        onNudge(dx, dy);
      }, 40);
    }, 320);
  }, [dx, dy, onNudge, stop]);

  return (
    <button
      className="nudge-dir-btn"
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
    >
      {children}
    </button>
  );
}

export function NudgePanel({ selectedKey, hasMoved, onNudge, onReset, onDeselect }: NudgePanelProps) {
  const def = KEY_POINT_DEFS[selectedKey];

  return (
    <div className="nudge-panel">
      <div className="nudge-panel__header">
        <div className="nudge-panel__label">
          <span className="nudge-panel__dot" style={{ background: def.color }} />
          <span style={{ color: def.color }}>{def.label}</span>
        </div>
        <div className="nudge-panel__actions">
          {hasMoved && (
            <button className="nudge-action-btn nudge-action-btn--reset" onClick={onReset}>
              <RotateCcw size={12} />
              Return
            </button>
          )}
          <button className="nudge-action-btn nudge-action-btn--close" onClick={onDeselect} title="Deselect">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="nudge-dpad">
        <div className="nudge-dpad__col">
          <DirBtn dx={0} dy={-1} onNudge={onNudge}><ChevronUp size={22} /></DirBtn>
          <div className="nudge-dpad__row">
            <DirBtn dx={-1} dy={0} onNudge={onNudge}><ChevronLeft size={22} /></DirBtn>
            <div className="nudge-dpad__center" />
            <DirBtn dx={1} dy={0} onNudge={onNudge}><ChevronRight size={22} /></DirBtn>
          </div>
          <DirBtn dx={0} dy={1} onNudge={onNudge}><ChevronDown size={22} /></DirBtn>
        </div>
        <p className="nudge-hint">Tap = 1 px · Hold = continuous</p>
      </div>
    </div>
  );
}
