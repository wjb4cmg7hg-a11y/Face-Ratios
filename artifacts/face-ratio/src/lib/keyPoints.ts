import type { Landmarks } from "./landmarks";
import type { Point } from "./geometry";
import { getPoint, avgPoints, LM } from "./landmarks";

export type PointGroup = "forehead" | "eyes" | "nose" | "mouth" | "face";

export type PointKey =
  | "hairline" | "glabella" | "nasion"
  | "temporal_r" | "temporal_l"
  | "ear_r" | "ear_l"
  | "zygo_r" | "zygo_l"
  | "gonia_r" | "gonia_l"
  | "jaw_angle_r" | "jaw_angle_l"
  | "chin" | "jaw_apex"
  | "r_eye_lat" | "r_eye_med" | "l_eye_lat" | "l_eye_med"
  | "r_eye_top" | "r_eye_bot" | "l_eye_top" | "l_eye_bot"
  | "r_pupil" | "l_pupil"
  | "alar_r" | "alar_l"
  | "nose_w_r" | "nose_w_l"
  | "subnasale"
  | "upper_lip_top" | "upper_lip_in"
  | "lower_lip_in" | "lower_lip_bot"
  | "mouth_r" | "mouth_l"
  | "mouth_c" | "pupil_mid" | "brow_mid"
  | "brow_inner_r" | "brow_outer_r" | "brow_inner_l" | "brow_outer_l"
  | "brow_low_r" | "brow_high_r" | "brow_low_l" | "brow_high_l"
  | "nose_bridge_r" | "nose_bridge_l"
  | "neck_l" | "neck_r";

export type KeyPointPositions = Record<PointKey, Point>;

export interface PointDef {
  label: string;
  group: PointGroup;
  color: string;
  description: string;
}

export const KEY_POINT_DEFS: Record<PointKey, PointDef> = {
  hairline:      { label: "Hairline",       group: "forehead", color: "#a78bfa", description: "Top of forehead at hairline" },
  glabella:      { label: "Glabella",       group: "forehead", color: "#a78bfa", description: "Between brows, above nose bridge" },
  nasion:        { label: "Nasion",         group: "nose",     color: "#fbbf24", description: "Nasal bridge (top of nose)" },
  temporal_r:    { label: "Temporal R",     group: "forehead", color: "#a78bfa", description: "Right temporal ridge (forehead edge)" },
  temporal_l:    { label: "Temporal L",     group: "forehead", color: "#a78bfa", description: "Left temporal ridge (forehead edge)" },
  ear_r:         { label: "Ear R",          group: "face",     color: "#60a5fa", description: "Right ear / face edge" },
  ear_l:         { label: "Ear L",          group: "face",     color: "#60a5fa", description: "Left ear / face edge" },
  zygo_r:        { label: "Zygo R",         group: "face",     color: "#60a5fa", description: "Right zygomatic arch (cheekbone)" },
  zygo_l:        { label: "Zygo L",         group: "face",     color: "#60a5fa", description: "Left zygomatic arch (cheekbone)" },
  gonia_r:       { label: "Gonia R",        group: "face",     color: "#60a5fa", description: "Right jaw angle" },
  gonia_l:       { label: "Gonia L",        group: "face",     color: "#60a5fa", description: "Left jaw angle" },
  jaw_angle_r:   { label: "Jaw Angle R",    group: "face",     color: "#60a5fa", description: "Right jaw angle for frontal jaw measurement" },
  jaw_angle_l:   { label: "Jaw Angle L",    group: "face",     color: "#60a5fa", description: "Left jaw angle for frontal jaw measurement" },
  chin:          { label: "Chin",           group: "face",     color: "#60a5fa", description: "Bottom of chin (menton)" },
  jaw_apex:      { label: "Jaw Apex",       group: "face",     color: "#f87171", description: "JFA vertex — drag below chin where jaw lines meet" },
  r_eye_lat:     { label: "R Lat Canthus",  group: "eyes",     color: "#34d399", description: "Right outer eye corner" },
  r_eye_med:     { label: "R Med Canthus",  group: "eyes",     color: "#34d399", description: "Right inner eye corner" },
  l_eye_lat:     { label: "L Lat Canthus",  group: "eyes",     color: "#34d399", description: "Left outer eye corner" },
  l_eye_med:     { label: "L Med Canthus",  group: "eyes",     color: "#34d399", description: "Left inner eye corner" },
  r_eye_top:     { label: "R Upper Lid",    group: "eyes",     color: "#34d399", description: "Right upper eyelid center" },
  r_eye_bot:     { label: "R Lower Lid",    group: "eyes",     color: "#34d399", description: "Right lower eyelid center" },
  l_eye_top:     { label: "L Upper Lid",    group: "eyes",     color: "#34d399", description: "Left upper eyelid center" },
  l_eye_bot:     { label: "L Lower Lid",    group: "eyes",     color: "#34d399", description: "Left lower eyelid center" },
  r_pupil:       { label: "R Pupil",        group: "eyes",     color: "#34d399", description: "Right pupil / iris center" },
  l_pupil:       { label: "L Pupil",        group: "eyes",     color: "#34d399", description: "Left pupil / iris center" },
  alar_r:        { label: "Alar Base R",    group: "nose",     color: "#fbbf24", description: "Right alar base of nose" },
  alar_l:        { label: "Alar Base L",    group: "nose",     color: "#fbbf24", description: "Left alar base of nose" },
  nose_w_r:      { label: "Nose Width R",   group: "nose",     color: "#fbbf24", description: "Widest right point of nose" },
  nose_w_l:      { label: "Nose Width L",   group: "nose",     color: "#fbbf24", description: "Widest left point of nose" },
  subnasale:     { label: "Subnasale",      group: "nose",     color: "#fbbf24", description: "Bottom center of nose — nose/philtrum junction" },
  upper_lip_top: { label: "Upper Lip Top",  group: "mouth",    color: "#f472b6", description: "Top of upper lip (philtrum base)" },
  upper_lip_in:  { label: "Stomion Top",    group: "mouth",    color: "#f472b6", description: "Inner upper lip / stomion top" },
  lower_lip_in:  { label: "Stomion Bot",    group: "mouth",    color: "#f472b6", description: "Inner lower lip / stomion bottom" },
  lower_lip_bot: { label: "Lower Lip Bot",  group: "mouth",    color: "#f472b6", description: "Bottom of lower lip" },
  mouth_r:       { label: "Mouth Corner R", group: "mouth",    color: "#f472b6", description: "Right mouth corner (cheilion)" },
  mouth_l:       { label: "Mouth Corner L", group: "mouth",    color: "#f472b6", description: "Left mouth corner (cheilion)" },
  mouth_c:       { label: "Mouth Center",   group: "mouth",    color: "#f472b6", description: "Computed center of mouth" },
  pupil_mid:     { label: "Pupil Midpoint", group: "eyes",     color: "#34d399", description: "Midpoint between pupils" },
  brow_mid:      { label: "Brow Center",    group: "forehead", color: "#a78bfa", description: "Center of brows" },
  brow_inner_r:  { label: "R Brow Inner",   group: "forehead", color: "#a78bfa", description: "Right brow inner (placeholder)" },
  brow_outer_r:  { label: "R Brow Outer",   group: "forehead", color: "#a78bfa", description: "Right brow outer (placeholder)" },
  brow_inner_l:  { label: "L Brow Inner",   group: "forehead", color: "#a78bfa", description: "Left brow inner (placeholder)" },
  brow_outer_l:  { label: "L Brow Outer",   group: "forehead", color: "#a78bfa", description: "Left brow outer (placeholder)" },
  brow_low_r:    { label: "R Brow Low",     group: "forehead", color: "#a78bfa", description: "Right brow low (placeholder)" },
  brow_high_r:   { label: "R Brow High",    group: "forehead", color: "#a78bfa", description: "Right brow high (placeholder)" },
  brow_low_l:    { label: "L Brow Low",     group: "forehead", color: "#a78bfa", description: "Left brow low (placeholder)" },
  brow_high_l:   { label: "L Brow High",    group: "forehead", color: "#a78bfa", description: "Left brow high (placeholder)" },
  nose_bridge_r: { label: "Nose Bridge R",  group: "nose",     color: "#fbbf24", description: "Right nose bridge (placeholder)" },
  nose_bridge_l: { label: "Nose Bridge L",  group: "nose",     color: "#fbbf24", description: "Left nose bridge (placeholder)" },
  neck_l:        { label: "Neck L",         group: "face",     color: "#60a5fa", description: "Left neck point (placeholder)" },
  neck_r:        { label: "Neck R",         group: "face",     color: "#60a5fa", description: "Right neck point (placeholder)" },
};

export const GROUP_LABEL: Record<PointGroup, string> = {
  forehead: "Forehead",
  eyes: "Eyes",
  nose: "Nose",
  mouth: "Mouth",
  face: "Face",
};

export const GROUP_COLOR: Record<PointGroup, string> = {
  forehead: "#a78bfa",
  eyes: "#34d399",
  nose: "#fbbf24",
  mouth: "#f472b6",
  face: "#60a5fa",
};

export function extractKeyPoints(
  landmarks: Landmarks,
  w: number,
  h: number,
): KeyPointPositions {
  const p = (idx: number): Point => getPoint(landmarks, idx, w, h);
  const avg = (indices: readonly number[]): Point =>
    avgPoints(landmarks, indices, w, h);

  return {
    hairline:      p(LM.HAIRLINE),
    glabella:      p(LM.GLABELLA),
    nasion:        p(LM.NASION),
    temporal_r:    p(LM.TEMPORAL_R),
    temporal_l:    p(LM.TEMPORAL_L),
    ear_r:         p(LM.EAR_R),
    ear_l:         p(LM.EAR_L),
    zygo_r:        p(LM.ZYGO_R),
    zygo_l:        p(LM.ZYGO_L),
    gonia_r:       p(LM.GONIA_R),
    gonia_l:       p(LM.GONIA_L),
    jaw_angle_r:   p(LM.GONIA_R),
    jaw_angle_l:   p(LM.GONIA_L),
    chin:          p(LM.CHIN),
    jaw_apex:      (() => { const c = p(LM.CHIN); return { x: c.x, y: c.y + h * 0.05 }; })(),
    r_eye_lat:     p(LM.R_EYE_LATERAL),
    r_eye_med:     p(LM.R_EYE_MEDIAL),
    l_eye_lat:     p(LM.L_EYE_LATERAL),
    l_eye_med:     p(LM.L_EYE_MEDIAL),
    r_eye_top:     p(LM.R_EYE_TOP),
    r_eye_bot:     p(LM.R_EYE_BOT),
    l_eye_top:     p(LM.L_EYE_TOP),
    l_eye_bot:     p(LM.L_EYE_BOT),
    r_pupil:       avg(LM.R_IRIS_RING),
    l_pupil:       avg(LM.L_IRIS_RING),
    alar_r:        p(LM.ALAR_R),
    alar_l:        p(LM.ALAR_L),
    nose_w_r:      p(LM.NOSE_W_R),
    nose_w_l:      p(LM.NOSE_W_L),
    subnasale:     p(LM.SUBNASALE),
    upper_lip_top: p(LM.UPPER_LIP_TOP),
    upper_lip_in:  p(LM.UPPER_LIP_IN),
    lower_lip_in:  p(LM.LOWER_LIP_IN),
    lower_lip_bot: p(LM.LOWER_LIP_BOT),
    mouth_r:       p(LM.MOUTH_R),
    mouth_l:       p(LM.MOUTH_L),
    mouth_c:       (() => {
      const mr = p(LM.MOUTH_R);
      const ml = p(LM.MOUTH_L);
      return { x: (mr.x + ml.x) / 2, y: (mr.y + ml.y) / 2 };
    })(),
    pupil_mid:     (() => {
      const r = avg(LM.R_IRIS_RING);
      const l = avg(LM.L_IRIS_RING);
      return { x: (r.x + l.x) / 2, y: (r.y + l.y) / 2 };
    })(),
    brow_mid:      p(LM.GLABELLA),
    brow_inner_r:  (() => { const pt = p(LM.R_EYE_MEDIAL); return { x: pt.x, y: pt.y - h * 0.02 }; })(),
    brow_outer_r:  (() => { const pt = p(LM.R_EYE_LATERAL); return { x: pt.x, y: pt.y - h * 0.02 }; })(),
    brow_inner_l:  (() => { const pt = p(LM.L_EYE_MEDIAL); return { x: pt.x, y: pt.y - h * 0.02 }; })(),
    brow_outer_l:  (() => { const pt = p(LM.L_EYE_LATERAL); return { x: pt.x, y: pt.y - h * 0.02 }; })(),
    brow_low_r:    (() => { const pt = p(LM.R_EYE_BOT); return { x: pt.x, y: pt.y - h * 0.02 }; })(),
    brow_high_r:   (() => { const pt = p(LM.R_EYE_TOP); return { x: pt.x, y: pt.y - h * 0.02 }; })(),
    brow_low_l:    (() => { const pt = p(LM.L_EYE_BOT); return { x: pt.x, y: pt.y - h * 0.02 }; })(),
    brow_high_l:   (() => { const pt = p(LM.L_EYE_TOP); return { x: pt.x, y: pt.y - h * 0.02 }; })(),
    nose_bridge_r: p(LM.NASION),
    nose_bridge_l: p(LM.NASION),
    neck_l:        p(LM.EAR_L),
    neck_r:        p(LM.EAR_R),
  };
}
