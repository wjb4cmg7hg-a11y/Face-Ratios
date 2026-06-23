import { useCallback, useRef, useState } from "react";
import { Upload, Camera } from "lucide-react";

interface UploadZoneProps {
  onImageSelected: (file: File) => void;
}

export function UploadZone({ onImageSelected }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (file.type.startsWith("image/")) {
        onImageSelected(file);
      }
    },
    [onImageSelected],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => setDragging(false);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className={`upload-zone ${dragging ? "upload-zone--dragging" : ""}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onInputChange}
      />
      <div className="upload-zone__inner">
        <div className="upload-zone__icon">
          <Camera size={40} strokeWidth={1.5} />
        </div>
        <h2 className="upload-zone__title">Upload a frontal face photo</h2>
        <p className="upload-zone__sub">
          Drag and drop, or tap to select from your Photos
        </p>
        <div className="upload-zone__tips">
          <span>Face the camera directly</span>
          <span>·</span>
          <span>Neutral expression</span>
          <span>·</span>
          <span>Good lighting</span>
        </div>
        <button className="upload-zone__btn" type="button">
          <Upload size={15} />
          Choose Photo
        </button>
      </div>
    </div>
  );
}
