import type { RatioResult } from "../lib/ratios";
import type { RatioDiagram, FormulaPart } from "../lib/measurementDiagram";
import { ROLE_COLOR } from "../lib/measurementDiagram";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface RatioTableProps {
  results: RatioResult[];
  overallScore: number;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  diagrams: Record<string, RatioDiagram>;
}

function ScoreIcon({ score }: { score: RatioResult["score"] }) {
  if (score === "ideal") return <CheckCircle2 size={14} className="score-icon score-icon--ideal" />;
  if (score === "close") return <AlertTriangle size={14} className="score-icon score-icon--close" />;
  return <XCircle size={14} className="score-icon score-icon--off" />;
}

function RatioBar({ result }: { result: RatioResult }) {
  const { value, ideal } = result;
  if (value === null) return null;
  const range  = ideal.max - ideal.min;
  const pad    = range * 0.5;
  const visMin = ideal.min - pad;
  const visMax = ideal.max + pad;
  const visRange = visMax - visMin;

  const idealStart = ((ideal.min - visMin) / visRange) * 100;
  const idealWidth = (range / visRange) * 100;
  const valuePct   = Math.max(0, Math.min(100, ((value - visMin) / visRange) * 100));

  return (
    <div className="ratio-bar">
      <div className="ratio-bar__ideal" style={{ left: `${idealStart}%`, width: `${idealWidth}%` }} />
      <div className={`ratio-bar__marker ratio-bar__marker--${result.score}`} style={{ left: `${valuePct}%` }} />
    </div>
  );
}

function FormulaDisplay({ parts }: { parts: FormulaPart[] }) {
  return (
    <div className="formula-row">
      {parts.map((p, i) => {
        let style: React.CSSProperties = {};
        let cls = "formula-part";
        if (p.role === "numerator") { style.color = ROLE_COLOR.numerator; cls += " formula-part--num"; }
        else if (p.role === "denominator") { style.color = ROLE_COLOR.denominator; cls += " formula-part--den"; }
        else if (p.role === "angle") { style.color = "#a78bfa"; cls += " formula-part--angle"; }
        else if (p.role === "operator") { cls += " formula-part--op"; }
        else if (p.role === "suffix") { cls += " formula-part--suffix"; }
        return <span key={i} className={cls} style={style}>{p.text}</span>;
      })}
    </div>
  );
}

function formatValue(value: number | null, unit: string): string {
  if (value === null) return "—";
  if (unit === "°") return `${value.toFixed(1)}°`;
  if (unit === "%") return `${value.toFixed(1)}%`;
  if (unit === "% dev") return `${value.toFixed(1)}% dev`;
  return value.toFixed(2);
}

function idealRange(ideal: RatioResult["ideal"], unit: string): string {
  if (unit === "°") return `${ideal.min}°–${ideal.max}°`;
  if (unit === "%") return `${ideal.min}–${ideal.max}%`;
  if (unit === "% dev") return `avg dev ≤${ideal.max}%`;
  return `${ideal.min}–${ideal.max}`;
}

export function RatioTable({ results, overallScore, selectedKey, onSelect, diagrams }: RatioTableProps) {
  const idealCount = results.filter((r) => r.score === "ideal").length;
  const closeCount = results.filter((r) => r.score === "close").length;
  const offCount   = results.filter((r) => r.score === "off").length;

  return (
    <div className="results-panel">
      <div className="results-summary">
        <div className="results-summary__score">
          <span className="results-summary__pct">{Math.round(overallScore)}%</span>
          <span className="results-summary__label">Overall Match</span>
        </div>
        <div className="results-summary__breakdown">
          <div className="breakdown-chip breakdown-chip--ideal"><CheckCircle2 size={13} /><span>{idealCount} Ideal</span></div>
          <div className="breakdown-chip breakdown-chip--close"><AlertTriangle size={13} /><span>{closeCount} Close</span></div>
          <div className="breakdown-chip breakdown-chip--off"><XCircle size={13} /><span>{offCount} Off</span></div>
        </div>
        <p className="results-summary__hint">Tap a ratio to see its measurement lines on the photo</p>
      </div>

      <div className="ratio-list">
        {results.map((r) => {
          const isSelected = selectedKey === r.key;
          const diagram = diagrams[r.key];
          return (
            <div
              key={r.key}
              className={`ratio-card ratio-card--${r.score}${isSelected ? " ratio-card--selected" : ""}`}
              onClick={() => onSelect(isSelected ? null : r.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSelect(isSelected ? null : r.key)}
            >
              <div className="ratio-card__header">
                <div className="ratio-card__name-row">
                  <ScoreIcon score={r.score} />
                  <span className="ratio-card__name">{r.name}</span>
                  <span className="ratio-card__abbr">{r.abbr}</span>
                </div>
                <div className="ratio-card__value-row">
                  <span className={`ratio-card__value ratio-card__value--${r.score}`}>
                    {formatValue(r.value, r.unit)}
                  </span>
                  <span className={`ratio-card__score ratio-card__score--${r.score}`}>
                    {r.scoreValue.toFixed(1)}
                  </span>
                  <span className="ratio-card__ideal-label">ideal {idealRange(r.ideal, r.unit)}</span>
                </div>
              </div>

              <RatioBar result={r} />

              {diagram && <FormulaDisplay parts={diagram.formulaParts} />}

              {isSelected && (
                <p className="ratio-card__desc">{r.description}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
