import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { VisionManager } from './ARPlayground/VisionManager';
import { useARStore } from './ARPlayground/store';
import { NormalizedLandmark } from '@mediapipe/tasks-vision';

// --- CONFIGURATION ---
const SMOOTHING_FACTOR = 0.2; // Higher = Faster reaction for hand
const DWELL_TIME = 1.5; // Seconds

// Internal Organ Definitions with STATIC SCREEN POSITIONS
const ORGANS = [
  { 
    id: 'brain', 
    name: 'BEYİN', 
    description: 'Düşünmeni, hissetmeni ve hareket etmeni sağlayan komuta merkezi! 🧠✨', 
    icon: '🧠',
    screenPos: { x: -0.6, y: 0.6 }, // Top Left
    color: '#FFB6C1',
    videoSrc: '/videos/brain.mp4'
  },
  { 
    id: 'heart', 
    name: 'KALP', 
    description: 'Vücudunun motoru! Kanı tüm vücuduna pompalar. ❤️', 
    icon: '❤️',
    screenPos: { x: -0.6, y: 0.0 }, // Middle Left
    color: '#FF0000',
    videoSrc: '/videos/heart.mp4' // New video source
  },
  { 
    id: 'lungs', 
    name: 'AKCİĞER', 
    description: 'Nefes almanı sağlar. Balon gibi şişip söner! 🫁', 
    icon: '🫁',
    screenPos: { x: 0.6, y: 0.6 }, // Top Right
    color: '#87CEEB'
  },
  { 
    id: 'knee', 
    name: 'DİZ EKLEMİ', 
    description: 'Bacaklarını bükmeni, koşmanı ve zıplamanı sağlar! 🦵', 
    icon: '🦵',
    screenPos: { x: 0.6, y: 0.0 }, // Middle Right
    color: '#FFD700'
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

// Simplified Bubble for rendering only
const StaticBubble = ({ organ, isActive, cursorPos, onDwellComplete, isLocked }: any) => {
    const { viewport } = useThree();
    const meshRef = useRef<THREE.Group>(null);
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
             // Interaction Radius (approx 0.6 world units)
             if (dist < 0.6) {
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
            {/* Main Bubble */}
            <mesh scale={isActive ? 1.3 : 1}>
                <sphereGeometry args={[0.4, 32, 32]} />
                <meshStandardMaterial 
                    color={organ.color} 
                    emissive={organ.color}
                    emissiveIntensity={isActive ? 0.8 : 0.4}
                    transparent 
                    opacity={0.8} 
                />
            </mesh>
            
            {/* Icon */}
            <Html center transform={false} style={{ pointerEvents: 'none' }}>
                <div style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }}>{organ.icon}</div>
            </Html>
            
            {/* Loading Ring */}
            {progress > 0 && !isActive && (
                <mesh>
                    <ringGeometry args={[0.45, 0.5, 64, 1, 0, progress * Math.PI * 2]} />
                    <meshBasicMaterial color="white" side={THREE.DoubleSide} />
                </mesh>
            )}
            
            {/* Label */}
             <Html position={[0, -0.55, 0]} center transform={false} style={{ pointerEvents: 'none' }}>
                <div className="bg-black/60 text-white px-3 py-1 rounded-full font-bold text-lg whitespace-nowrap border border-white/20">
                    {organ.name}
                </div>
            </Html>
        </group>
    );
};

// --- MAIN GAME COMPONENT ---

const GameScene = () => {
    const rawPose = useARStore((state) => state.pose);
    const smoothedPose = useRef<NormalizedLandmark[]>([]);
    const [cursorPos, setCursorPos] = useState<THREE.Vector3 | null>(null);
    const [activeOrganId, setActiveOrganId] = useState<string | null>(null);
    const { viewport } = useThree();

    // Main Loop
    useFrame((state) => {
        if (!rawPose || rawPose.length === 0) return;

        // 1. Smooth Pose
        if (smoothedPose.current.length === 0) smoothedPose.current = JSON.parse(JSON.stringify(rawPose));
        else {
             for (let i = 0; i < rawPose.length; i++) {
                smoothedPose.current[i].x += (rawPose[i].x - smoothedPose.current[i].x) * SMOOTHING_FACTOR;
                smoothedPose.current[i].y += (rawPose[i].y - smoothedPose.current[i].y) * SMOOTHING_FACTOR;
            }
        }

        // 2. Update Cursor (Active Hand Tip)
        const leftIndex = smoothedPose.current[19];
        const rightIndex = smoothedPose.current[20];
        let activeHand = rightIndex;
        // Pick the higher hand (smaller y)
        if (leftIndex && rightIndex) {
            if (leftIndex.y < rightIndex.y) activeHand = leftIndex;
        } else if (leftIndex) activeHand = leftIndex;

        if (activeHand) {
            const cx = (activeHand.x - 0.5) * -viewport.width;
            const cy = -(activeHand.y - 0.5) * viewport.height;
            setCursorPos(new THREE.Vector3(cx, cy, 0));
        }

        // 3. Clear active logic is now handled by timers/video events, NOT distance
    });

    // Handle Auto-Close for non-video items
    useEffect(() => {
        if (activeOrganId) {
            const organ = ORGANS.find(o => o.id === activeOrganId);
            if (organ && !organ.videoSrc) {
                // Auto close after 6 seconds for static info
                const timer = setTimeout(() => {
                    setActiveOrganId(null);
                }, 6000);
                return () => clearTimeout(timer);
            }
        }
    }, [activeOrganId]);

    const handleVideoEnd = () => {
        setActiveOrganId(null);
    };

    return (
        <>
            <ambientLight intensity={1} />
            <pointLight position={[0, 0, 10]} intensity={1.5} />
            
            {/* Draw Skeleton (Visual Feedback Only) */}
            {smoothedPose.current.length > 0 && (
                 <group>
                    {[
                        [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // Arms
                        [11, 23], [12, 24], [23, 24], // Torso
                    ].map(([s, e], i) => {
                        const start = smoothedPose.current[s];
                        const end = smoothedPose.current[e];
                        if(!start || !end) return null;
                        const sx = (start.x - 0.5) * -viewport.width;
                        const sy = -(start.y - 0.5) * viewport.height;
                        const ex = (end.x - 0.5) * -viewport.width;
                        const ey = -(end.y - 0.5) * viewport.height;
                        const points = [new THREE.Vector3(sx, sy, 0), new THREE.Vector3(ex, ey, 0)];
                        const geom = new THREE.BufferGeometry().setFromPoints(points);
                        return <line key={i} geometry={geom}><lineBasicMaterial color="cyan" transparent opacity={0.3} linewidth={2} /></line>;
                    })}
                 </group>
            )}

            {/* STATIC Bubbles */}
            {ORGANS.map(organ => (
                <StaticBubble 
                    key={organ.id} 
                    organ={organ} 
                    isActive={activeOrganId === organ.id}
                    cursorPos={cursorPos}
                    onDwellComplete={(id: string) => setActiveOrganId(id)}
                    isLocked={!!activeOrganId} // Lock interaction if something is active
                />
            ))}

            <HandCursor position={cursorPos} />

            {/* Information Overlay or Video */}
            {activeOrganId && (
                <Html fullscreen style={{ pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                    <div className={`bg-black/95 p-12 rounded-[3rem] border-4 border-cyan-400 max-w-4xl text-center shadow-[0_0_150px_rgba(34,211,238,0.6)] animate-in fade-in zoom-in duration-300 ${ORGANS.find(o => o.id === activeOrganId)?.videoSrc ? 'p-0 overflow-hidden' : ''}`}>
                        {(() => {
                            const organ = ORGANS.find(o => o.id === activeOrganId);
                            if(!organ) return null;
                            
                            // Generic case for video
                            if (organ.videoSrc) {
                                return (
                                    <div className="relative w-[800px] h-[600px] bg-black rounded-[3rem] overflow-hidden">
                                         <video 
                                            src={organ.videoSrc}
                                            autoPlay 
                                            // loop // REMOVED LOOP
                                            muted={false}
                                            onEnded={handleVideoEnd} // Close on end
                                            className="w-full h-full object-cover"
                                         />
                                    </div>
                                );
                            }

                            return (
                                <>
                                    <div className="text-9xl mb-8 animate-bounce">{organ.icon}</div>
                                    <h1 className="text-7xl font-black text-white mb-6 uppercase tracking-widest">{organ.name}</h1>
                                    <p className="text-4xl text-cyan-100 leading-relaxed font-bold">{organ.description}</p>
                                    {/* Timer Bar Visual */}
                                    <div className="w-full h-2 bg-gray-800 mt-8 rounded-full overflow-hidden">
                                        <div className="h-full bg-cyan-400 animate-[width_6s_linear_forwards]" style={{ width: '100%' }}></div>
                                    </div>
                                </>
                            )
                        })()}
                    </div>
                </Html>
            )}
        </>
    );
};

const VideoPlane = () => {
    const videoTexture = useARStore(state => state.videoTexture);
    const { viewport } = useThree();
    if (!videoTexture) return null;
    return (
        <mesh position={[0, 0, -5]} scale={[-viewport.width, viewport.height, 1]}> 
            <planeGeometry />
            <meshBasicMaterial map={videoTexture} toneMapped={false} />
        </mesh>
    );
};

export const XRayGame = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      <VisionManager />
      
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-50 pointer-events-none">
        <button 
            onClick={onBack}
            className="pointer-events-auto px-6 py-3 bg-gray-900/80 backdrop-blur border border-white/20 text-white rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2"
        >
            ← MENÜ
        </button>
        
        <div className="bg-cyan-900/90 backdrop-blur border border-cyan-400/50 px-10 py-6 rounded-2xl animate-pulse shadow-lg">
            <h2 className="text-3xl font-black text-cyan-300 text-center">
                👆 SİHİRLİ EKRAN
            </h2>
            <p className="text-white text-center text-xl mt-2 font-medium">
                Elindeki <span className="text-cyan-300 font-bold">BEYAZ NOKTAYI</span> yandaki balonlara götür!
            </p>
        </div>
      </div>

      <Canvas camera={{ position: [0, 0, 5] }}>
        <VideoPlane />
        <GameScene />
      </Canvas>
    </div>
  );
};
