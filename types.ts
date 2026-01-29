import { NormalizedLandmark } from "@mediapipe/tasks-vision";

export interface FaceData {
  landmarks: NormalizedLandmark[];
  blendshapes?: any[]; // kept generic for now
  matrix: number[]; // Transformation matrix for head pose
}

export interface HUDState {
  isSystemReady: boolean;
  fps: number;
  faceDetected: boolean;
}
