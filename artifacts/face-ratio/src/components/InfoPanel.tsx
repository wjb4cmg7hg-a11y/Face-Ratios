
import type { RatioDiagram } from "../lib/measurementDiagram";
import type { PointKey } from "../lib/keyPoints";
import { KEY_POINT_DEFS } from "../lib/keyPoints";

interface InfoPanelProps {
  activeDiagram: RatioDiagram | null;
  selectedEditKey: PointKey | null;
  visibleKeys: Set<PointKey> | null;
}

export function InfoPanel({ activeDiagram, selectedEditKey, visibleKeys }: InfoPanelProps) {
  if (!activeDiagram) {
    return null;
  }

  return (
    <div>
      <h2>{activeDiagram.name}</h2>
      <h3>Points:</h3>
      <ul>
        {visibleKeys && Array.from(visibleKeys).map(key => (
          <li key={key}>{KEY_POINT_DEFS[key]?.label}</li>
        ))}
      </ul>
      <h3>Lines:</h3>
      <ul>
        {activeDiagram.lines.map(line => (
          <li key={`${line.from}-${line.to}`}>{line.label}</li>
        ))}
      </ul>
    </div>
  );
}
