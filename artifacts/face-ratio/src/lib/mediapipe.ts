import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import type { Landmarks } from "./landmarks";

let faceLandmarker: FaceLandmarker | null = null;
let loading = false;

export async function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (faceLandmarker) return faceLandmarker;
  if (loading) {
    // Wait for existing load
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (faceLandmarker) {
          clearInterval(check);
          resolve(faceLandmarker);
        }
      }, 100);
    });
  }

  loading = true;
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
  );

  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate: "CPU",
    },
    runningMode: "IMAGE",
    numFaces: 1,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  loading = false;
  return faceLandmarker;
}

export interface DetectionResult {
  landmarks: Landmarks;
  imageWidth: number;
  imageHeight: number;
}

export async function detectFaceLandmarks(
  imageElement: HTMLImageElement,
): Promise<DetectionResult | null> {
  const lm = await getFaceLandmarker();
  const result = lm.detect(imageElement);

  if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
    return null;
  }

  const landmarks = result.faceLandmarks[0] as Landmarks;
  return {
    landmarks,
    imageWidth: imageElement.naturalWidth,
    imageHeight: imageElement.naturalHeight,
  };
}
