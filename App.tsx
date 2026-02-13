import React, { useRef, useEffect, useState } from 'react';
import { useFaceDetection } from './hooks/useFaceDetection';
import { HudOverlay } from './components/HudOverlay';
import { Dashboard } from './components/Dashboard';
import { GameMenu } from './components/GameMenu';
import { TheClawGame } from './components/TheClawGame';
import { DinosaurGame } from './components/DinosaurGame';
import { LavaGame } from './components/LavaGame';
import { MusicGame } from './components/MusicGame';
import { ARPlayground } from './components/ARPlayground/ARPlayground';
import { XRayGame } from './components/XRayGame';
import { PianoGame } from './components/PianoGame';
import { LivePuzzleGame } from './components/LivePuzzle';

// Game 1: JARVIS HUD Component
function JarvisHUD({ onBack }: { onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isLoading, isReady, faceLandmarksRef, faceBlendshapesRef, handLandmarksRef } = useFaceDetection(videoRef);
  const [dims, setDims] = useState({ width: 640, height: 480 });
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play();
              setDims({
                width: videoRef.current.videoWidth,
                height: videoRef.current.videoHeight
              });
            }
          };
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setCameraError("Kamera erişimi reddedildi veya kullanılamıyor.");
      }
    };

    startCamera();

    // Cleanup camera on unmount
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-30 px-4 py-2 bg-black/50 backdrop-blur border border-cyan-500/50 text-cyan-400 rounded-lg hover:bg-cyan-900/30 transition-all flex items-center gap-2"
      >
        <span>←</span> MENÜ
      </button>

      {/* Background Video Layer */}
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-cover opacity-60 filter grayscale contrast-125 brightness-75 scale-x-[-1]"
        playsInline
        muted
      />

      {/* Dark overlay to make HUD pop */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/60 via-cyan-900/10 to-black/60 pointer-events-none"></div>

      {/* 3D HUD Layer */}
      {isReady && (
        <div className="absolute inset-0 z-10">
          <HudOverlay
            landmarksRef={faceLandmarksRef}
            faceBlendshapesRef={faceBlendshapesRef}
            handLandmarksRef={handLandmarksRef}
            videoWidth={dims.width}
            videoHeight={dims.height}
          />
        </div>
      )}

      {/* 2D Dashboard Layer */}
      <Dashboard faceBlendshapesRef={faceBlendshapesRef} />

      {/* Loading / Error States */}
      {isLoading && !cameraError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h2 className="text-cyan-400 font-mono text-xl tracking-widest animate-pulse">PROTOKOLLER BAŞLATILIYOR...</h2>
            <p className="text-cyan-700 mt-2 text-sm">Görüntü Modelleri Yükleniyor</p>
          </div>
        </div>
      )}

      {cameraError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="p-8 border border-red-500 rounded max-w-md text-center">
            <h2 className="text-red-500 text-2xl font-bold mb-2">SİSTEM HATASI</h2>
            <p className="text-red-300">{cameraError}</p>
            <button
              onClick={onBack}
              className="mt-4 px-6 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-500 rounded uppercase tracking-wider transition-colors"
            >
              Menüye Dön
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Main App with Game Selection
function App() {
  const [currentGame, setCurrentGame] = useState<number | null>(null);

  const handleSelectGame = (gameId: number) => {
    setCurrentGame(gameId);
  };

  const handleBackToMenu = () => {
    setCurrentGame(null);
  };

  // Render based on selected game
  if (currentGame === 1) {
    return <JarvisHUD onBack={handleBackToMenu} />;
  }

  if (currentGame === 2) {
    return <TheClawGame onBack={handleBackToMenu} />;
  }

  if (currentGame === 3) {
    return <DinosaurGame onBack={handleBackToMenu} />;
  }

  if (currentGame === 4) {
    return <LavaGame onBack={handleBackToMenu} />;
  }

  if (currentGame === 5) {
    return <MusicGame onBack={handleBackToMenu} />;
  }

  if (currentGame === 6) {
    return <ARPlayground onBack={handleBackToMenu} />;
  }

  if (currentGame === 7) {
    return <XRayGame onBack={handleBackToMenu} />;
  }

  if (currentGame === 8) {
    return <PianoGame onBack={handleBackToMenu} />;
  }

  if (currentGame === 9) {
    return <LivePuzzleGame onBack={handleBackToMenu} />;
  }

  // Default: Show game menu
  return <GameMenu onSelectGame={handleSelectGame} />;
}

export default App;
