import { useEffect, useRef, useState, MutableRefObject } from 'react';
import { FaceLandmarker, HandLandmarker, PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export const useFaceDetection = (videoRef: MutableRefObject<HTMLVideoElement | null>) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  
  const lastVideoTimeRef = useRef<number>(-1);
  const requestRef = useRef<number>(0);
  
  // Store landmarks in refs to avoid React render loop jitter
  const faceLandmarksRef = useRef<any[]>([]);
  const faceBlendshapesRef = useRef<any[]>([]); // Added for expression data
  const handLandmarksRef = useRef<any[]>([]);
  const poseLandmarksRef = useRef<any[]>([]); // For body pose detection

  useEffect(() => {
    const setupMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );

        // Initialize all models in parallel
        const [faceLandmarker, handLandmarker, poseLandmarker] = await Promise.all([
          FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
              delegate: "GPU"
            },
            outputFaceBlendshapes: true, // We need this for the Jarvis biometric graphs
            runningMode: "VIDEO",
            numFaces: 1
          }),
          HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
              delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 2
          }),
          PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
              delegate: "GPU"
            },
            runningMode: "VIDEO",
            numPoses: 1
          })
        ]);

        faceLandmarkerRef.current = faceLandmarker;
        handLandmarkerRef.current = handLandmarker;
        poseLandmarkerRef.current = poseLandmarker;

        setIsLoading(false);
        setIsReady(true);
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
        setIsLoading(false);
      }
    };

    setupMediaPipe();

    return () => {
      if (faceLandmarkerRef.current) faceLandmarkerRef.current.close();
      if (handLandmarkerRef.current) handLandmarkerRef.current.close();
      if (poseLandmarkerRef.current) poseLandmarkerRef.current.close();
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const startDetection = () => {
    const detect = () => {
      if (videoRef.current && faceLandmarkerRef.current && handLandmarkerRef.current) {
        const video = videoRef.current;
        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          const startTimeMs = performance.now();
          
          // Only run if video has data
          if (video.videoWidth > 0 && video.videoHeight > 0) {
             // Run Face Detection
             const faceResult = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);
             if (faceResult.faceLandmarks) {
                faceLandmarksRef.current = faceResult.faceLandmarks;
             }
             if (faceResult.faceBlendshapes) {
                faceBlendshapesRef.current = faceResult.faceBlendshapes;
             }

             // Run Hand Detection
             const handResult = handLandmarkerRef.current.detectForVideo(video, startTimeMs);
             if (handResult.landmarks) {
                handLandmarksRef.current = handResult.landmarks;
             }

             // Run Pose Detection
             if (poseLandmarkerRef.current) {
               const poseResult = poseLandmarkerRef.current.detectForVideo(video, startTimeMs);
               if (poseResult.landmarks) {
                  poseLandmarksRef.current = poseResult.landmarks;
               }
             }
          }
        }
      }
      requestRef.current = requestAnimationFrame(detect);
    };
    detect();
  };

  useEffect(() => {
    if (isReady) {
      startDetection();
    }
  }, [isReady]);

  return { isLoading, isReady, faceLandmarksRef, faceBlendshapesRef, handLandmarksRef, poseLandmarksRef };
};