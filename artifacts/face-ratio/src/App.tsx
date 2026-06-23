import { useState, useCallback, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UploadZone } from "./components/UploadZone";
import { PointCanvas } from "./components/PointCanvas";
import { NudgePanel } from "./components/NudgePanel";
import { RatioTable } from "./components/RatioTable";
import { detectFaceLandmarks } from "./lib/mediapipe";
import { computeRatios } from "./lib/ratios";
import { extractKeyPoints } from "./lib/keyPoints";
import { DIAGRAMS } from "./lib/measurementDiagram";
import type { KeyPointPositions, PointKey } from "./lib/keyPoints";
import type { Point } from "./lib/geometry";
import type { RatioResult } from "./lib/ratios";
import type { Landmarks } from "./lib/landmarks";
import { RefreshCw, AlertCircle, Crosshair } from "lucide-react";

const queryClient = new QueryClient();
type AppState = "idle" | "loading" | "done" | "error";

function FaceAnalyzer() {
  const [state, setState]         = useState<AppState>("idle");
  const [imageUrl, setImageUrl]   = useState<string | null>(null);
  const [imageW, setImageW]       = useState(0);
  const [imageH, setImageH]       = useState(0);
  const [landmarks, setLandmarks] = useState<Landmarks | null>(null);
  const [keyPoints, setKeyPoints] = useState<KeyPointPositions | null>(null);
  const [results, setResults]     = useState<RatioResult[]>([]);
  const [errorMsg, setErrorMsg]   = useState("");
  const [editMode, setEditMode]   = useState(false);
  const [selectedRatioKey, setSelectedRatioKey] = useState<string | null>(null);
  const [selectedEditKey, setSelectedEditKey]   = useState<PointKey | null>(null);

  // Track original positions before user edits them — persists within a session
  const originalPositions = useRef<Partial<Record<PointKey, Point>>>({});
  const movedKeys = useRef<Set<PointKey>>(new Set());

  const saveOriginal = useCallback((key: PointKey, kp: KeyPointPositions) => {
    if (!movedKeys.current.has(key)) {
      originalPositions.current[key] = { ...kp[key] };
      movedKeys.current.add(key);
    }
  }, []);

  const handleImage = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setLandmarks(null);
    setKeyPoints(null);
    setResults([]);
    setErrorMsg("");
    setEditMode(false);
    setSelectedRatioKey(null);
    setSelectedEditKey(null);
    originalPositions.current = {};
    movedKeys.current = new Set();
    setState("loading");

    const img = new Image();
    img.src = url;
    img.onload = async () => {
      setImageW(img.naturalWidth);
      setImageH(img.naturalHeight);
      try {
        const detection = await detectFaceLandmarks(img);
        if (!detection) {
          setErrorMsg("No face detected. Please use a clear frontal photo with good lighting.");
          setState("error");
          return;
        }
        const kp = extractKeyPoints(detection.landmarks, detection.imageWidth, detection.imageHeight);
        setLandmarks(detection.landmarks);
        setKeyPoints(kp);
        setResults(computeRatios(kp));
        setState("done");
      } catch (err) {
        console.error(err);
        setErrorMsg("Analysis failed. Please try a different photo.");
        setState("error");
      }
    };
    img.onerror = () => { setErrorMsg("Could not load the image."); setState("error"); };
  }, []);

  // Called when a drag begins — save original before any movement
  const handleDragStart = useCallback((key: PointKey) => {
    if (keyPoints) saveOriginal(key, keyPoints);
  }, [keyPoints, saveOriginal]);

  // Called when drag completes or nudge fires
  const handlePointsChange = useCallback((updated: KeyPointPositions) => {
    setKeyPoints(updated);
    setResults(computeRatios(updated));
  }, []);

  // Nudge the selected point by dx/dy (in original image pixel units)
  const handleNudge = useCallback((dx: number, dy: number) => {
    if (!selectedEditKey || !keyPoints) return;
    saveOriginal(selectedEditKey, keyPoints);
    const current = keyPoints[selectedEditKey];
    const updated: KeyPointPositions = {
      ...keyPoints,
      [selectedEditKey]: {
        x: Math.max(0, Math.min(imageW, current.x + dx)),
        y: Math.max(0, Math.min(imageH, current.y + dy)),
      },
    };
    setKeyPoints(updated);
    setResults(computeRatios(updated));
  }, [selectedEditKey, keyPoints, imageW, imageH, saveOriginal]);

  // Return the selected point to its original position
  const handleReset = useCallback(() => {
    if (!selectedEditKey || !keyPoints) return;
    const original = originalPositions.current[selectedEditKey];
    if (!original) return;
    const updated: KeyPointPositions = { ...keyPoints, [selectedEditKey]: { ...original } };
    setKeyPoints(updated);
    setResults(computeRatios(updated));
    // Clear the saved original so subsequent moves track from here
    movedKeys.current.delete(selectedEditKey);
    delete originalPositions.current[selectedEditKey];
  }, [selectedEditKey, keyPoints]);

  const handleKeySelect = useCallback((key: PointKey | null) => {
    setSelectedEditKey(key);
  }, []);

  const handleRatioSelect = useCallback((key: string | null) => {
    setSelectedRatioKey(key);
  }, []);

  const handleEditToggle = () => {
    const next = !editMode;
    setEditMode(next);
    if (!next) {
      setSelectedEditKey(null); // clear dot selection when leaving edit
    }
  };

  const reset = () => {
    setImageUrl(null); setLandmarks(null); setKeyPoints(null);
    setResults([]); setErrorMsg(""); setEditMode(false);
    setSelectedRatioKey(null); setSelectedEditKey(null);
    originalPositions.current = {}; movedKeys.current = new Set();
    setState("idle");
  };

  const overallScore = results.length > 0
    ? results.reduce((sum, r) => sum + r.scoreValue, 0) / results.length * 10
    : 0;

  const activeDiagram = selectedRatioKey ? (DIAGRAMS[selectedRatioKey] ?? null) : null;
  const hasMoved = selectedEditKey ? movedKeys.current.has(selectedEditKey) : false;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-logo">
            <span className="app-logo__mark">⟨⟩</span>
            <span className="app-logo__name">FaceMetrics</span>
          </div>
          <p className="app-header__sub">
            AI facial ratio analysis — 24 measurements against research-based ideals
          </p>
          {state === "done" && (
            <div className="header-actions">
              <button
                className={`edit-btn ${editMode ? "edit-btn--active" : ""}`}
                onClick={handleEditToggle}
                type="button"
              >
                <Crosshair size={14} />
                {editMode ? "Done Adjusting" : "Adjust Points"}
              </button>
              <button className="reset-btn" onClick={reset} type="button">
                <RefreshCw size={14} />
                New Photo
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="app-main">
        {state === "idle" && (
          <div className="idle-layout">
            <UploadZone onImageSelected={handleImage} />
            <div className="idle-info">
              <h3>How it works</h3>
              <ol>
                <li>Upload a frontal photo — your device camera or Photos app</li>
                <li>AI detects 478 facial landmarks entirely in your browser</li>
                <li>24 ratios are calculated and compared to research-based ideal ranges</li>
                <li>Tap any ratio card to see its measurement lines drawn on the photo</li>
                <li>Use "Adjust Points" to drag or nudge any landmark precisely</li>
              </ol>
              <p className="idle-info__disclaimer">
                All processing happens locally. No photo is ever uploaded to a server.
              </p>
            </div>
          </div>
        )}

        {state === "loading" && (
          <div className="loading-layout">
            <div className="loading-card">
              {imageUrl && <img src={imageUrl} className="loading-preview" alt="Analyzing..." />}
              <div className="loading-spinner" />
              <p className="loading-text">Detecting landmarks&hellip;</p>
              <p className="loading-sub">First run downloads the AI model (~6 MB) — subsequent photos are instant</p>
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="error-layout">
            {imageUrl && <img src={imageUrl} className="error-preview" alt="Failed" />}
            <div className="error-card">
              <AlertCircle size={28} className="error-icon" />
              <p className="error-msg">{errorMsg}</p>
              <button className="upload-zone__btn" onClick={reset}>Try Another Photo</button>
            </div>
          </div>
        )}

        {state === "done" && imageUrl && landmarks && keyPoints && (
          <div className="done-layout">
            <div className="done-left">
              {editMode && (
                <div className="edit-hint">
                  <Crosshair size={13} />
                  Tap a dot to select it, then nudge precisely — or drag for coarse movement
                </div>
              )}
              {selectedRatioKey && activeDiagram && (
                <div className="diagram-hint">
                  <span className="diagram-hint__key">{selectedRatioKey.toUpperCase()}</span>
                  {activeDiagram.formulaParts.map((p, i) => {
                    let style: React.CSSProperties = {};
                    if (p.role === "numerator")   style.color = "#c9a96e";
                    else if (p.role === "denominator") style.color = "#60a5fa";
                    else if (p.role === "angle")   style.color = "#a78bfa";
                    return <span key={i} style={style}>{p.text}</span>;
                  })}
                </div>
              )}
              <PointCanvas
                imageUrl={imageUrl}
                landmarks={landmarks}
                keyPoints={keyPoints}
                imageWidth={imageW}
                imageHeight={imageH}
                editMode={editMode}
                activeDiagram={activeDiagram}
                selectedEditKey={selectedEditKey}
                onKeySelect={handleKeySelect}
                onDragStart={handleDragStart}
                onPointsChange={handlePointsChange}
              />
              {editMode && selectedEditKey && (
                <NudgePanel
                  selectedKey={selectedEditKey}
                  hasMoved={hasMoved}
                  onNudge={handleNudge}
                  onReset={handleReset}
                  onDeselect={() => setSelectedEditKey(null)}
                />
              )}
            </div>
            <div className="done-right">
              <RatioTable
                results={results}
                overallScore={overallScore}
                selectedKey={selectedRatioKey}
                onSelect={handleRatioSelect}
                diagrams={DIAGRAMS}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FaceAnalyzer />
    </QueryClientProvider>
  );
}
