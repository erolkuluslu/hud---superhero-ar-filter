import { create } from 'zustand';
import { NormalizedLandmark } from '@mediapipe/tasks-vision';
import * as THREE from 'three';

export interface HandData {
  landmarks: NormalizedLandmark[];
  worldLandmarks: NormalizedLandmark[];
  handedness: 'Left' | 'Right';
}

interface ARPlaygroundState {
  // Vision Data
  hands: HandData[];
  pose: NormalizedLandmark[];
  videoTexture: THREE.VideoTexture | null;
  videoRef: HTMLVideoElement | null;
  
  // Actions
  setHands: (hands: HandData[]) => void;
  setPose: (pose: NormalizedLandmark[]) => void;
  setVideoTexture: (texture: THREE.VideoTexture) => void;
  setVideoRef: (video: HTMLVideoElement) => void;
}

export const useARStore = create<ARPlaygroundState>((set) => ({
  hands: [],
  pose: [],
  videoTexture: null,
  videoRef: null,
  
  setHands: (hands) => set({ hands }), 
  setPose: (pose) => set({ pose }),
  setVideoTexture: (videoTexture) => set({ videoTexture }),
  setVideoRef: (videoRef) => set({ videoRef }),
}));

// Utility to access latest hands without subscription (for useFrame)
export const getLatestHands = () => useARStore.getState().hands;
export const getLatestPose = () => useARStore.getState().pose;

// Remap utility
export const remap = (value: number, min1: number, max1: number, min2: number, max2: number) => {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
};

