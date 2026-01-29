import React, { useEffect, useRef } from 'react';
import { HandLandmarker, PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import * as THREE from 'three';
import { useARStore } from './store';

export const VisionManager: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(document.createElement('video'));
  const { setVideoTexture, setVideoRef } = useARStore();
  const requestRef = useRef<number>(0);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);

  useEffect(() => {
    let active = true;

    const setupVision = async () => {
      // 1. Setup Camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        });
        
        if (!active) return;

        const video = videoRef.current;
        video.srcObject = stream;
        video.playsInline = true;
        video.muted = true;
        await video.play();

        // Create Video Texture for R3F
        const texture = new THREE.VideoTexture(video);
        texture.colorSpace = THREE.SRGBColorSpace;
        setVideoTexture(texture);
        setVideoRef(video);

        // 2. Setup MediaPipe
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );

        if (!active) return;

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2
        });

        const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numPoses: 1
        });

        handLandmarkerRef.current = handLandmarker;
        poseLandmarkerRef.current = poseLandmarker;

        // 3. Start Loop
        const detect = () => {
            if (video.readyState >= 2) {
                const startTimeMs = performance.now();
                
                // Hands
                if (handLandmarkerRef.current) {
                    const result = handLandmarkerRef.current.detectForVideo(video, startTimeMs);
                    if (result.landmarks) {
                        const handData = result.landmarks.map((landmarks, i) => ({
                            landmarks,
                            worldLandmarks: result.worldLandmarks[i],
                            handedness: result.handedness[i][0].categoryName as 'Left' | 'Right'
                        }));
                        useARStore.setState({ hands: handData });
                    }
                }

                // Pose
                if (poseLandmarkerRef.current) {
                    const poseResult = poseLandmarkerRef.current.detectForVideo(video, startTimeMs);
                    if (poseResult.landmarks && poseResult.landmarks.length > 0) {
                        useARStore.setState({ pose: poseResult.landmarks[0] });
                    }
                }
            }
            requestRef.current = requestAnimationFrame(detect);
        };
        
        detect();

      } catch (err) {
        console.error("Vision setup failed:", err);
      }
    };

    setupVision();

    return () => {
      active = false;
      cancelAnimationFrame(requestRef.current);
      if (handLandmarkerRef.current) handLandmarkerRef.current.close();
      if (poseLandmarkerRef.current) poseLandmarkerRef.current.close();
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(t => t.stop());
      }
    };
  }, []);

  return null; // Logic only component
};
