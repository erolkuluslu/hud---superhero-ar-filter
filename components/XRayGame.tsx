import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { VisionManager } from './ARPlayground/VisionManager';
import { useARStore } from './ARPlayground/store';
import { NormalizedLandmark } from '@mediapipe/tasks-vision';

// --- CONFIGURATION ---
const SMOOTHING_FACTOR = 0.3; // Optimized for single hand tracking
const DWELL_TIME = 1.5; // Seconds
const CLOSE_BUTTON_DWELL = 1.0; // Faster for close action
const INACTIVITY_TIMEOUT = 10000; // 10 seconds - Auto-open instructions after inactivity
const AUTO_CLOSE_ON_INTERACTION = 2500; // 2.5 seconds - Auto-close when user starts interacting

// Internal Organ Definitions - 2x2 Grid Layout
// Simple grid: Top-Left, Top-Right, Bottom-Left, Bottom-Right
const ORGANS = [
  {
    id: 'brain',
    name: 'BEYİN',
    description: 'Düşünmeni, hissetmeni ve hareket etmeni sağlayan komuta merkezi! 🧠✨',
    // Position: Top LEFT (Sol Üst)
    screenPos: { x: -0.25, y: 0.25 },
    videoSrc: '/videos/brain.mp4'
  },
  {
    id: 'heart',
    name: 'KALP',
    description: 'Vücudunun motoru! Kanı tüm vücuduna pompalar. ❤️',
    // Position: Top RIGHT (Sağ Üst)
    screenPos: { x: 0.25, y: 0.25 },
    videoSrc: '/videos/heart.mp4'
  },
  {
    id: 'lungs',
    name: 'AKCİĞER',
    description: 'Nefes almanı sağlar. Balon gibi şişip söner! 🫁',
    // Position: Bottom LEFT (Sol Alt)
    screenPos: { x: -0.3, y: -0.3 },
    videoSrc: '/videos/lungs.mp4'
  },
  {
    id: 'knee',
    name: 'İSKELET SİSTEMİ',
    description: 'Vücudunun çatısı! Seni dik tutar. 🦴',
    // Position: Bottom RIGHT (Sağ Alt)
    screenPos: { x: 0.3, y: -0.3 },
    videoSrc: '/videos/skeleton.mp4'
  }
];

// --- HELPER COMPONENTS ---

// Hand Cursor Visualizer
const HandCursor = ({ position }: { position: THREE.Vector3 | null }) => {
  if (!position) return null;
  return (
    <mesh position={position}>
      <circleGeometry args={[0.08, 32]} />
      <meshBasicMaterial color="white" transparent opacity={0.9} />
      <mesh position={[0, 0, 0.01]}>
        <ringGeometry args={[0.09, 0.12, 32]} />
        <meshBasicMaterial color="cyan" />
      </mesh>
    </mesh>
  );
};

// Interactive Button Zone (Generic for Close and Help buttons)
const InteractiveButtonZone = ({ cursorPos, onTrigger, position, radius = 0.4, color = "#FF6B9D" }: {
  cursorPos: THREE.Vector3 | null;
  onTrigger: () => void;
  position: THREE.Vector3;
  radius?: number;
  color?: string;
}) => {
    const [progress, setProgress] = useState(0);

    useFrame((state, delta) => {
        if (cursorPos) {
            const dist = position.distanceTo(cursorPos);
            if (dist < radius) {
                setProgress(p => {
                    const newP = Math.min(p + delta / CLOSE_BUTTON_DWELL, 1);
                    if (newP === 1 && p < 1) {
                        onTrigger();
                    }
                    return newP;
                });
            } else {
                setProgress(0);
            }
        } else {
            setProgress(0);
        }
    });

    return (
        <group position={position}>
            {/* Button Visual */}
            <mesh>
                <circleGeometry args={[0.3, 32]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.8}
                />
            </mesh>

            {/* Progress Ring */}
            {progress > 0 && (
                <mesh position={[0, 0, 0.01]}>
                    <ringGeometry args={[0.32, 0.38, 64, 1, 0, progress * Math.PI * 2]} />
                    <meshBasicMaterial color="#FFD93D" side={THREE.DoubleSide} transparent opacity={0.9} />
                </mesh>
            )}
        </group>
    );
};

// Invisible Trigger Zone (Hitbox)
const TriggerZone = ({ organ, isActive, cursorPos, onDwellComplete, isLocked }: any) => {
    const { viewport } = useThree();
    const [progress, setProgress] = useState(0);

    // Calculate fixed position based on viewport
    const x = (organ.screenPos.x * viewport.width) / 2;
    const y = (organ.screenPos.y * viewport.height) / 2;
    const position = new THREE.Vector3(x, y, 0);

    useFrame((state, delta) => {
        if (isLocked) {
            setProgress(0);
            return;
        }

        // Local Progress Logic
        if (cursorPos) {
             const dist = position.distanceTo(cursorPos);
             // Interaction Radius (approx 0.8 world units - slightly larger for easier hitting)
             if (dist < 0.8) {
                 setProgress(p => {
                     const newP = Math.min(p + delta / DWELL_TIME, 1);
                     if (newP === 1 && p < 1) {
                         onDwellComplete(organ.id);
                     }
                     return newP;
                 });
             } else {
                 setProgress(0);
             }
        } else {
            setProgress(0);
        }
    });

    return (
        <group position={position}>
            {/* Debug Visual (Optional: transparent but shows area) */}
            {/* Set opacity to 0.0 to make it fully invisible, or 0.1 to debug positions */}
            <mesh>
                <circleGeometry args={[0.6, 32]} />
                <meshBasicMaterial color="white" transparent opacity={0.05} /> 
            </mesh>
            
            {/* Loading Ring - Only visible when hovering */}
            {progress > 0 && !isActive && (
                <mesh position={[0, 0, 0.1]}>
                    <ringGeometry args={[0.6, 0.7, 64, 1, 0, progress * Math.PI * 2]} />
                    <meshBasicMaterial color="#00ff00" side={THREE.DoubleSide} transparent opacity={0.8} />
                </mesh>
            )}
        </group>
    );
};

// --- MAIN GAME COMPONENT ---

const GameScene = ({ showInstructions, onCloseInstructions, setShowInstructions }: {
    showInstructions: boolean;
    onCloseInstructions: () => void;
    setShowInstructions: (show: boolean) => void;
}) => {
    const rawPose = useARStore((state) => state.pose);
    const smoothedPose = useRef<NormalizedLandmark[]>([]);
    const [cursorPos, setCursorPos] = useState<THREE.Vector3 | null>(null);
    const [activeOrganId, setActiveOrganId] = useState<string | null>(null);
    const { viewport } = useThree();

    // Optimized Main Loop with single hand tracking
    useFrame((state) => {
        if (!rawPose || rawPose.length === 0) {
            setCursorPos(null);
            return;
        }

        // 1. Smooth Pose - Simplified for better performance
        if (smoothedPose.current.length === 0) {
            smoothedPose.current = JSON.parse(JSON.stringify(rawPose));
        } else {
            // Only smooth hand landmarks (19-20)
            for (let i = 19; i <= 20; i++) {
                if (rawPose[i] && smoothedPose.current[i]) {
                    smoothedPose.current[i].x += (rawPose[i].x - smoothedPose.current[i].x) * SMOOTHING_FACTOR;
                    smoothedPose.current[i].y += (rawPose[i].y - smoothedPose.current[i].y) * SMOOTHING_FACTOR;
                }
            }
        }

        // 2. Update Cursor - SINGLE DOMINANT HAND (Right hand priority)
        const leftIndex = smoothedPose.current[19];
        const rightIndex = smoothedPose.current[20];

        let activeHand = null;

        // Try right hand first, then left hand
        if (rightIndex && typeof rightIndex.x === 'number' && typeof rightIndex.y === 'number') {
            activeHand = rightIndex;
        } else if (leftIndex && typeof leftIndex.x === 'number' && typeof leftIndex.y === 'number') {
            activeHand = leftIndex;
        }

        if (activeHand) {
            const cx = (activeHand.x - 0.5) * -viewport.width;
            const cy = -(activeHand.y - 0.5) * viewport.height;
            setCursorPos(new THREE.Vector3(cx, cy, 0));
        } else {
            setCursorPos(null);
        }
    });

    const handleVideoEnd = () => {
        setActiveOrganId(null);
    };

    return (
        <>
            <ambientLight intensity={1} />

            {/* Background Title - Chalkboard Style (Top Area) */}
            {!showInstructions && (
                <Html
                    position={[0, viewport.height * 0.45, -3]}
                    center
                    style={{ pointerEvents: 'none', zIndex: 1 }}
                >
                    <div className="text-center" style={{ width: '100vw' }}>
                        <h1
                            className="text-5xl font-black tracking-widest"
                            style={{
                                fontFamily: '"Chalk Board", "Comic Sans MS", cursive',
                                color: '#FFF8DC',
                                textShadow: `
                                    2px 2px 0px rgba(255, 182, 193, 0.6),
                                    -1px -1px 0px rgba(173, 216, 230, 0.4),
                                    3px 3px 8px rgba(0, 0, 0, 0.5),
                                    0 0 15px rgba(255, 255, 255, 0.3)
                                `,
                                letterSpacing: '0.15em',
                                transform: 'rotate(-1deg)',
                                opacity: 0.85
                            }}
                        >
                            ✨ İNSAN ANATOMİSİ ✨
                        </h1>
                    </div>
                </Html>
            )}

            {/* Trigger Zones for Organs */}
            {!activeOrganId && ORGANS.map(organ => (
                <TriggerZone
                    key={organ.id}
                    organ={organ}
                    isActive={false}
                    cursorPos={cursorPos}
                    onDwellComplete={(id: string) => setActiveOrganId(id)}
                    isLocked={showInstructions}
                />
            ))}

            {/* Interactive Buttons - Positioned to match HTML overlay */}
            {/* Help Button Zone (Top Right) - Opens instructions when closed */}
            {!showInstructions && (
                <InteractiveButtonZone
                    cursorPos={cursorPos}
                    onTrigger={() => setShowInstructions(true)}
                    position={new THREE.Vector3(viewport.width * 0.4, viewport.height * 0.42, 1)}
                    color="#FFD93D"
                />
            )}

            {/* Close Button Zone (Top right of dialog) - Closes instructions */}
            {showInstructions && (
                <InteractiveButtonZone
                    cursorPos={cursorPos}
                    onTrigger={onCloseInstructions}
                    position={new THREE.Vector3(viewport.width * 0.18, viewport.height * 0.40, 1)}
                    radius={0.7}
                    color="#FF6B9D"
                />
            )}

            <HandCursor position={cursorPos} />

            {/* Video Overlay */}
            {activeOrganId && (
                <Html fullscreen style={{ pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                    <div className="relative w-[800px] h-[600px] bg-black rounded-[3rem] overflow-hidden border-4 border-cyan-400 shadow-[0_0_100px_rgba(0,255,255,0.3)]">
                        {(() => {
                            const organ = ORGANS.find(o => o.id === activeOrganId);
                            if(organ && organ.videoSrc) {
                                return (
                                    <video
                                        src={organ.videoSrc}
                                        autoPlay
                                        muted={false}
                                        onEnded={handleVideoEnd}
                                        className="w-full h-full object-cover"
                                    />
                                );
                            }
                            return null;
                        })()}
                    </div>
                </Html>
            )}
        </>
    );
};

// Static Background Plane
const BackgroundPlane = () => {
    const texture = useTexture('/photos/background.png');
    const { viewport } = useThree();
    return (
        <mesh position={[0, 0, -5]} scale={[viewport.width, viewport.height, 1]}> 
            <planeGeometry />
            <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
    );
};

export const XRayGame = ({ onBack }: { onBack: () => void }) => {
  const [showInstructions, setShowInstructions] = useState(true);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const pose = useARStore((state) => state.pose);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-close instructions when user starts interacting (moves cursor)
  useEffect(() => {
    if (showInstructions && pose && pose.length > 0 && !autoCloseTimerRef.current) {
      // First interaction detected, start timer to auto-close
      autoCloseTimerRef.current = setTimeout(() => {
        setShowInstructions(false);
        autoCloseTimerRef.current = null;
      }, AUTO_CLOSE_ON_INTERACTION);
    }

    // Reset timer when dialog is closed
    if (!showInstructions && autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  }, [showInstructions, pose]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, []);

  // Inactivity detection: Auto-open instructions after 10 seconds of no movement
  useEffect(() => {
    const checkInactivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityTime;

      if (timeSinceLastActivity > INACTIVITY_TIMEOUT && !showInstructions) {
        setShowInstructions(true);
      }
    };

    const interval = setInterval(checkInactivity, 1000); // Check every second
    return () => clearInterval(interval);
  }, [lastActivityTime, showInstructions]);

  // Track pose changes as activity
  useEffect(() => {
    if (pose && pose.length > 0) {
      setLastActivityTime(Date.now());
    }
  }, [pose]);

  return (
    <div className="w-full h-screen relative overflow-hidden"
         style={{
           background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
         }}>

      {/* VisionManager still needed for tracking */}
      <VisionManager />

      {/* Chalkboard Frame Effect - Wooden Border */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Top Border */}
        <div className="absolute top-0 left-0 right-0 h-8"
             style={{
               background: 'linear-gradient(180deg, #8B4513 0%, #A0522D 50%, #6B3410 100%)',
               boxShadow: '0 4px 8px rgba(0,0,0,0.5), inset 0 -2px 4px rgba(0,0,0,0.3)'
             }} />

        {/* Bottom Border */}
        <div className="absolute bottom-0 left-0 right-0 h-8"
             style={{
               background: 'linear-gradient(0deg, #8B4513 0%, #A0522D 50%, #6B3410 100%)',
               boxShadow: '0 -4px 8px rgba(0,0,0,0.5), inset 0 2px 4px rgba(0,0,0,0.3)'
             }} />

        {/* Left Border */}
        <div className="absolute top-0 bottom-0 left-0 w-8"
             style={{
               background: 'linear-gradient(90deg, #8B4513 0%, #A0522D 50%, #6B3410 100%)',
               boxShadow: '4px 0 8px rgba(0,0,0,0.5), inset -2px 0 4px rgba(0,0,0,0.3)'
             }} />

        {/* Right Border */}
        <div className="absolute top-0 bottom-0 right-0 w-8"
             style={{
               background: 'linear-gradient(-90deg, #8B4513 0%, #A0522D 50%, #6B3410 100%)',
               boxShadow: '-4px 0 8px rgba(0,0,0,0.5), inset 2px 0 4px rgba(0,0,0,0.3)'
             }} />
      </div>

      {/* Main UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-8 z-50 pointer-events-none">

        {/* Top Bar - Back Button and Help Button */}
        <div className="flex justify-between items-start">
          {/* Back Button - Top Left */}
          <button
              onClick={onBack}
              className="pointer-events-auto px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 text-xl shadow-xl hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
                color: '#FFF8DC',
                border: '3px solid #D2691E',
                boxShadow: '0 8px 20px rgba(139, 69, 19, 0.4), inset 0 -2px 4px rgba(0,0,0,0.2)'
              }}
          >
              <span className="text-2xl">←</span>
              <span style={{ fontFamily: 'system-ui, sans-serif', letterSpacing: '1px' }}>MENÜ</span>
          </button>

          {/* Help Button Visual Indicator (when instructions closed) */}
          {!showInstructions && (
            <div className="pointer-events-none flex items-center gap-2 px-4 py-3 rounded-2xl animate-pulse"
                 style={{
                   background: 'rgba(255, 217, 61, 0.2)',
                   border: '2px solid #FFD93D',
                   boxShadow: '0 4px 15px rgba(255, 217, 61, 0.3)'
                 }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                   style={{
                     background: 'linear-gradient(135deg, #FFD93D 0%, #FFB347 100%)',
                     border: '2px solid white',
                     boxShadow: '0 4px 15px rgba(255, 217, 61, 0.5)'
                   }}>
                <span className="text-xl font-bold" style={{ color: '#1a1a2e' }}>ℹ️</span>
              </div>
              <span className="text-white font-bold text-sm"
                    style={{
                      fontFamily: 'system-ui, sans-serif',
                      textShadow: '1px 1px 3px rgba(0,0,0,0.5)'
                    }}>
                Elini tut
              </span>
            </div>
          )}

          {/* Close Button Visual Indicator (when instructions showing) */}
          {showInstructions && (
            <div className="pointer-events-none flex items-center gap-2 px-4 py-3 rounded-2xl animate-pulse"
                 style={{
                   background: 'rgba(255, 107, 157, 0.2)',
                   border: '2px solid #FF6B9D',
                   boxShadow: '0 4px 15px rgba(255, 107, 157, 0.3)'
                 }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                   style={{
                     background: 'linear-gradient(135deg, #FF6B9D 0%, #C061CB 100%)',
                     border: '2px solid white',
                     boxShadow: '0 4px 15px rgba(255, 107, 157, 0.5)'
                   }}>
                <span className="text-white text-xl font-bold">✕</span>
              </div>
              <span className="text-white font-bold text-sm"
                    style={{
                      fontFamily: 'system-ui, sans-serif',
                      textShadow: '1px 1px 3px rgba(0,0,0,0.5)'
                    }}>
                Elini tut
              </span>
            </div>
          )}
        </div>

        {/* Instructions Panel - Hand Interactive Only */}
        {showInstructions && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 pointer-events-none">
            <div className="relative text-center space-y-3 px-8 py-6 rounded-3xl max-w-2xl"
                 style={{
                   background: 'rgba(40, 40, 35, 0.85)',
                   backdropFilter: 'blur(15px)',
                   border: '3px solid rgba(255, 248, 220, 0.3)',
                   boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                 }}>

              {/* Main Title - Compact */}
              <h1 className="text-4xl font-black tracking-wide"
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    background: 'linear-gradient(135deg, #FF6B9D 0%, #C061CB 25%, #61D4F1 50%, #FFD93D 75%, #6BCB77 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.3))'
                  }}>
                ✨ İNSAN ANATOMİSİ ✨
              </h1>

              {/* Subtitle - Compact */}
              <p className="text-xl font-bold"
                 style={{
                   color: '#FFD93D',
                   fontFamily: 'system-ui, sans-serif',
                   textShadow: '2px 2px 4px rgba(0,0,0,0.5), 0 0 10px rgba(255, 217, 61, 0.3)'
                 }}>
                🖐️ Elini Kaldır ve Organları Keşfet!
              </p>

              {/* Instructions - Compact */}
              <div className="space-y-1">
                <p className="text-base font-semibold"
                   style={{
                     color: '#FFF8DC',
                     fontFamily: 'system-ui, sans-serif',
                     textShadow: '1px 1px 3px rgba(0,0,0,0.5)'
                   }}>
                  📍 Elini organların üzerine 2 saniye tut
                </p>

                {/* Hint - Compact */}
                <p className="text-sm font-bold px-4 py-2 rounded-full inline-block"
                   style={{
                     color: '#6BCB77',
                     background: 'rgba(107, 203, 119, 0.15)',
                     border: '2px dashed #6BCB77',
                     fontFamily: 'system-ui, sans-serif',
                     textShadow: '0 0 10px rgba(107, 203, 119, 0.5)'
                   }}>
                  💡 Yeşil halka dolunca video başlar!
                </p>

                {/* Close Instruction */}
                <p className="text-sm font-bold px-4 py-2 rounded-full inline-block mt-2"
                   style={{
                     color: '#FF6B9D',
                     background: 'rgba(255, 107, 157, 0.15)',
                     border: '2px dashed #FF6B9D',
                     fontFamily: 'system-ui, sans-serif',
                     textShadow: '0 0 10px rgba(255, 107, 157, 0.5)'
                   }}>
                  ✕ Kapatmak için pembe butona elini tut!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Institutional Logos - Bottom Corners */}
      <div className="absolute bottom-12 left-12 z-50 pointer-events-none">
        <img
          src="/photos/bilim merkezi.png"
          alt="Kayseri Bilim Merkezi"
          className="h-20 w-auto"
          style={{
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
            opacity: 0.95
          }}
        />
      </div>

      <div className="absolute bottom-12 right-12 z-50 pointer-events-none">
        <img
          src="/photos/belediye.png"
          alt="Kayseri Büyükşehir Belediyesi"
          className="h-20 w-auto"
          style={{
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
            opacity: 0.95
          }}
        />
      </div>

      <Canvas camera={{ position: [0, 0, 5] }}>
        <React.Suspense fallback={null}>
            <BackgroundPlane />
        </React.Suspense>
        <GameScene
          showInstructions={showInstructions}
          onCloseInstructions={() => setShowInstructions(false)}
          setShowInstructions={setShowInstructions}
        />
      </Canvas>
    </div>
  );
};
