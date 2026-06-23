// MediaPipe Face Mesh landmark indices
// Face: 0-467, Iris: 468-477 (right 468-472, left 473-477)

export const LM = {
  // Right eye (subject's right = image left)
  R_EYE_LATERAL: 33,   // right lateral canthus (outer corner)
  R_EYE_MEDIAL: 133,   // right medial canthus (inner corner)
  R_EYE_TOP: 159,      // right upper eyelid center
  R_EYE_BOT: 145,      // right lower eyelid center

  // Left eye (subject's left = image right)
  L_EYE_LATERAL: 263,  // left lateral canthus
  L_EYE_MEDIAL: 362,   // left medial canthus
  L_EYE_TOP: 386,      // left upper eyelid center
  L_EYE_BOT: 374,      // left lower eyelid center

  // Iris ring points (to compute pupil centers)
  R_IRIS_RING: [469, 470, 471, 472] as const,
  L_IRIS_RING: [474, 475, 476, 477] as const,

  // Nose
  NASION: 168,         // nasal bridge (nasion)
  GLABELLA: 9,         // glabella (between brows)
  ALAR_R: 358,         // right alar base
  ALAR_L: 129,         // left alar base
  NOSE_W_R: 294,       // nose widest right
  NOSE_W_L: 64,        // nose widest left

  // Lips
  UPPER_LIP_TOP: 0,    // top of upper lip (philtrum junction)
  UPPER_LIP_IN: 13,    // inner upper lip (stomion upper)
  LOWER_LIP_IN: 14,    // inner lower lip (stomion lower)
  LOWER_LIP_BOT: 17,   // bottom of lower lip
  MOUTH_R: 61,         // right mouth corner
  MOUTH_L: 291,        // left mouth corner

  // Face structure
  CHIN: 152,
  ZYGO_R: 234,         // right bizygomatic (cheek)
  ZYGO_L: 454,         // left bizygomatic (cheek)
  GONIA_R: 172,        // right jaw angle (gonia)
  GONIA_L: 397,        // left jaw angle (gonia)

  // Forehead / hairline approximations
  HAIRLINE: 10,        // top of forehead (hairline approximation)
  TEMPORAL_R: 103,     // right temporal ridge
  TEMPORAL_L: 332,     // left temporal ridge

  // Ear approximations (face edge)
  EAR_R: 127,
  EAR_L: 356,

  // Subnasale — bottom center of nose / nose-to-philtrum junction
  SUBNASALE: 2,
} as const;

export type Landmark = { x: number; y: number; z: number };
export type Landmarks = Landmark[];

export function getPoint(landmarks: Landmarks, idx: number, w: number, h: number) {
  const lm = landmarks[idx];
  if (!lm) return { x: 0, y: 0 };
  return { x: lm.x * w, y: lm.y * h };
}

export function avgPoints(
  landmarks: Landmarks,
  indices: readonly number[],
  w: number,
  h: number,
) {
  const pts = indices.map((i) => getPoint(landmarks, i, w, h));
  return {
    x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
    y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
  };
}
