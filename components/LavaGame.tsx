import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useFaceDetection } from '../hooks/useFaceDetection';

interface LavaGameProps {
  onBack: () => void;
}

// Platform component
const Platform = ({ position, width, isActive }: { position: [number, number, number], width: number, isActive: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Slight float animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.05;
    }
  });

  return (
    <group position={position}>
      {/* Platform top */}
      <mesh ref={meshRef}>
        <boxGeometry args={[width, 0.2, 1]} />
        <meshStandardMaterial 
          color={isActive ? "#4ade80" : "#374151"} 
          emissive={isActive ? "#22c55e" : "#000"}
          emissiveIntensity={isActive ? 0.5 : 0}
        />
      </mesh>
      {/* Platform supports */}
      <mesh position={[-width/3, -0.5, 0]}>
        <boxGeometry args={[0.15, 0.8, 0.15]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[width/3, -0.5, 0]}>
        <boxGeometry args={[0.15, 0.8, 0.15]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
    </group>
  );
};

// Lava floor component
const LavaFloor = ({ lavaLevel }: { lavaLevel: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  useFrame((state) => {
    if (materialRef.current) {
      // Pulsing lava effect
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.2 + 0.8;
      materialRef.current.emissiveIntensity = pulse;
    }
    if (meshRef.current) {
      // Wavy lava surface
      meshRef.current.position.y = lavaLevel + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group>
      {/* Main lava surface */}
      <mesh ref={meshRef} position={[0, lavaLevel, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial 
          ref={materialRef}
          color="#ff4500" 
          emissive="#ff6600"
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Lava glow underneath */}
      <mesh position={[0, lavaLevel - 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 10]} />
        <meshBasicMaterial color="#ff2200" transparent opacity={0.5} />
      </mesh>
      
      {/* Lava bubbles */}
      {[...Array(15)].map((_, i) => (
        <LavaBubble key={i} baseX={(Math.random() - 0.5) * 15} lavaLevel={lavaLevel} delay={Math.random() * 3} />
      ))}
      
      {/* Strong glow from below */}
      <pointLight position={[0, lavaLevel - 1, 0]} color="#ff4400" intensity={3} distance={5} />
      <pointLight position={[-3, lavaLevel - 1, 0]} color="#ff6600" intensity={2} distance={4} />
      <pointLight position={[3, lavaLevel - 1, 0]} color="#ff6600" intensity={2} distance={4} />
    </group>
  );
};

// Lava bubble animation
const LavaBubble = ({ baseX, lavaLevel, delay }: { baseX: number, lavaLevel: number, delay: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [visible, setVisible] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = (state.clock.elapsedTime + delay) % 2;
      if (time < 1.5) {
        setVisible(true);
        meshRef.current.position.y = lavaLevel + time * 0.5;
        meshRef.current.scale.setScalar(Math.sin(time * Math.PI) * 0.3);
      } else {
        setVisible(false);
      }
    }
  });

  if (!visible) return null;

  return (
    <mesh ref={meshRef} position={[baseX, lavaLevel, (Math.random() - 0.5) * 2]}>
      <sphereGeometry args={[0.15, 8, 8]} />
      <meshStandardMaterial color="#ffaa00" emissive="#ff6600" emissiveIntensity={1} />
    </mesh>
  );
};

// Player character that follows hands
const PlayerCharacter = ({ position, isOnPlatform, isInLava }: { 
  position: THREE.Vector3, 
  isOnPlatform: boolean,
  isInLava: boolean 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [legAngle, setLegAngle] = useState(0);
  
  useFrame((state) => {
    if (groupRef.current) {
      // Wobble when in lava
      if (isInLava) {
        groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 20) * 0.2;
      } else {
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.1);
      }
      
      // Running animation
      setLegAngle(Math.sin(state.clock.elapsedTime * 15) * 0.5);
    }
  });

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      {/* Body */}
      <mesh position={[0, 0.3, 0]}>
        <capsuleGeometry args={[0.2, 0.3, 4, 8]} />
        <meshStandardMaterial 
          color={isInLava ? "#ff4444" : "#60a5fa"} 
          emissive={isInLava ? "#ff0000" : "#3b82f6"}
          emissiveIntensity={isInLava ? 0.8 : 0.3}
        />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color={isInLava ? "#ff6666" : "#93c5fd"} />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.06, 0.73, 0.15]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0.06, 0.73, 0.15]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[-0.06, 0.73, 0.18]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[0.06, 0.73, 0.18]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="black" />
      </mesh>
      
      {/* Legs */}
      <mesh position={[-0.08, -0.1, 0]} rotation={[legAngle, 0, 0]}>
        <capsuleGeometry args={[0.06, 0.25, 4, 8]} />
        <meshStandardMaterial color={isInLava ? "#ff4444" : "#3b82f6"} />
      </mesh>
      <mesh position={[0.08, -0.1, 0]} rotation={[-legAngle, 0, 0]}>
        <capsuleGeometry args={[0.06, 0.25, 4, 8]} />
        <meshStandardMaterial color={isInLava ? "#ff4444" : "#3b82f6"} />
      </mesh>
      
      {/* Arms */}
      <mesh position={[-0.25, 0.35, 0]} rotation={[0, 0, -0.5 + legAngle * 0.3]}>
        <capsuleGeometry args={[0.05, 0.2, 4, 8]} />
        <meshStandardMaterial color={isInLava ? "#ff6666" : "#93c5fd"} />
      </mesh>
      <mesh position={[0.25, 0.35, 0]} rotation={[0, 0, 0.5 - legAngle * 0.3]}>
        <capsuleGeometry args={[0.05, 0.2, 4, 8]} />
        <meshStandardMaterial color={isInLava ? "#ff6666" : "#93c5fd"} />
      </mesh>
      
      {/* Platform indicator when safe */}
      {isOnPlatform && (
        <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.3, 16]} />
          <meshBasicMaterial color="#4ade80" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}
      
      {/* Fire effect when in lava */}
      {isInLava && (
        <>
          <pointLight position={[0, 0, 0]} color="#ff4400" intensity={2} distance={1.5} />
          {[...Array(5)].map((_, i) => (
            <mesh key={i} position={[(Math.random() - 0.5) * 0.4, -0.2 - Math.random() * 0.3, (Math.random() - 0.5) * 0.4]}>
              <coneGeometry args={[0.05, 0.15, 4]} />
              <meshBasicMaterial color="#ff6600" transparent opacity={0.8} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
};

// Hand skeleton visualization
const HandSkeleton = ({ handLandmarks, transform }: { handLandmarks: any[] | null, transform: (lm: any) => THREE.Vector3 }) => {
  const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
    [0, 9], [9, 10], [10, 11], [11, 12], [0, 13], [13, 14], [14, 15], [15, 16],
    [0, 17], [17, 18], [18, 19], [19, 20], [5, 9], [9, 13], [13, 17]
  ];
  
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  
  const pointsGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(21 * 3), 3));
    return geo;
  }, []);

  const linesGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(HAND_CONNECTIONS.length * 2 * 3), 3));
    return geo;
  }, []);

  useFrame(() => {
    if (!handLandmarks || handLandmarks.length === 0) {
      if (pointsRef.current) pointsRef.current.visible = false;
      if (linesRef.current) linesRef.current.visible = false;
      return;
    }

    const hand = handLandmarks[0];
    if (pointsRef.current && hand) {
      pointsRef.current.visible = true;
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      hand.forEach((lm: any, i: number) => {
        const world = transform(lm);
        positions[i * 3] = world.x;
        positions[i * 3 + 1] = world.y;
        positions[i * 3 + 2] = world.z;
      });
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    if (linesRef.current && hand) {
      linesRef.current.visible = true;
      const positions = linesRef.current.geometry.attributes.position.array as Float32Array;
      HAND_CONNECTIONS.forEach(([start, end], i) => {
        const startWorld = transform(hand[start]);
        const endWorld = transform(hand[end]);
        positions[i * 6] = startWorld.x;
        positions[i * 6 + 1] = startWorld.y;
        positions[i * 6 + 2] = startWorld.z;
        positions[i * 6 + 3] = endWorld.x;
        positions[i * 6 + 4] = endWorld.y;
        positions[i * 6 + 5] = endWorld.z;
      });
      linesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      <points ref={pointsRef} geometry={pointsGeometry}>
        <pointsMaterial size={0.1} color="#fbbf24" sizeAttenuation={true} />
      </points>
      <lineSegments ref={linesRef} geometry={linesGeometry}>
        <lineBasicMaterial color="#fbbf24" linewidth={2} />
      </lineSegments>
    </>
  );
};

// Game Scene
const GameScene = ({
  handLandmarksRef,
  score,
  setScore,
  lives,
  setLives,
  gameActive,
  setIsInLava,
  isInLava,
  invincible
}: {
  handLandmarksRef: React.MutableRefObject<any[]>,
  score: number,
  setScore: React.Dispatch<React.SetStateAction<number>>,
  lives: number,
  setLives: React.Dispatch<React.SetStateAction<number>>,
  gameActive: boolean,
  setIsInLava: React.Dispatch<React.SetStateAction<boolean>>,
  isInLava: boolean,
  invincible: boolean
}) => {
  const { viewport } = useThree();
  const [playerPos, setPlayerPos] = useState(new THREE.Vector3(0, 1, 0));
  const [platforms, setPlatforms] = useState<Array<{ id: number, x: number, y: number, width: number }>>([]);
  const [isOnPlatform, setIsOnPlatform] = useState(true);
  const lavaLevel = -3; // Lower lava level - more room to play
  const lastDamageTime = useRef(0);
  
  // Initialize platforms - BIGGER and more accessible
  useEffect(() => {
    const initialPlatforms = [
      { id: 0, x: -4, y: 0, width: 3.5 },      // Left platform - bigger
      { id: 1, x: 0, y: 0.5, width: 4 },        // Center platform - starting area, biggest
      { id: 2, x: 4, y: 0, width: 3.5 },        // Right platform - bigger
      { id: 3, x: -2, y: 1.5, width: 3 },       // Upper left
      { id: 4, x: 2, y: 1.5, width: 3 },        // Upper right
      { id: 5, x: 0, y: -1, width: 3.5 },       // Lower center - safety net
    ];
    setPlatforms(initialPlatforms);
  }, []);

  // Transform hand to world position
  const transformLandmark = (lm: { x: number, y: number, z: number }) => {
    const mirroredX = 1 - lm.x;
    const wx = (mirroredX - 0.5) * viewport.width * 1.8;
    const wy = (0.5 - lm.y) * viewport.height * 1.5;
    return new THREE.Vector3(wx, wy, 0);
  };

  useFrame((state) => {
    if (!gameActive) return;
    
    const hands = handLandmarksRef.current;
    
    if (hands && hands.length > 0) {
      const hand = hands[0];
      // Use wrist position as player position
      const wrist = hand[0];
      const worldPos = transformLandmark(wrist);
      setPlayerPos(worldPos);
      
      // Check if on any platform - MORE FORGIVING collision
      let onPlatform = false;
      platforms.forEach(platform => {
        const playerX = worldPos.x;
        const playerY = worldPos.y;
        const platLeft = platform.x - platform.width / 2 - 0.5;  // Extra margin
        const platRight = platform.x + platform.width / 2 + 0.5; // Extra margin
        const platTop = platform.y + 1;    // More height tolerance
        const platBottom = platform.y - 1; // More depth tolerance
        
        if (playerX >= platLeft && playerX <= platRight && 
            playerY >= platBottom && playerY <= platTop) {
          onPlatform = true;
        }
      });
      
      setIsOnPlatform(onPlatform);
      
      // Check if in lava - only if REALLY low
      const inLava = worldPos.y < lavaLevel + 0.3;
      setIsInLava(inLava);
      
      // Damage if in lava - only if not invincible
      if (inLava && !invincible && state.clock.elapsedTime - lastDamageTime.current > 1.0) {
        setLives(prev => Math.max(0, prev - 1));
        lastDamageTime.current = state.clock.elapsedTime;
      }
      
      // Score increases over time when safe
      if (!inLava && onPlatform) {
        setScore(prev => prev + 1);
      }
    }
    
    // Move platforms slowly
    setPlatforms(prev => prev.map(p => ({
      ...p,
      x: p.x + Math.sin(state.clock.elapsedTime + p.id) * 0.002
    })));
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} color="#fff5e6" />
      
      {/* Lava floor */}
      <LavaFloor lavaLevel={lavaLevel} />
      
      {/* Platforms */}
      {platforms.map(platform => (
        <Platform 
          key={platform.id}
          position={[platform.x, platform.y, 0]}
          width={platform.width}
          isActive={isOnPlatform && Math.abs(playerPos.x - platform.x) < platform.width / 2}
        />
      ))}
      
      {/* Player character */}
      <PlayerCharacter 
        position={playerPos}
        isOnPlatform={isOnPlatform}
        isInLava={isInLava}
      />
      
      {/* Hand skeleton */}
      <HandSkeleton handLandmarks={handLandmarksRef.current} transform={transformLandmark} />
      
      {/* Background */}
      <mesh position={[0, 2, -5]}>
        <planeGeometry args={[25, 15]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>
      
      <EffectComposer>
        <Bloom luminanceThreshold={0.3} intensity={1.5} />
      </EffectComposer>
    </>
  );
};

// Main Component
export const LavaGame: React.FC<LavaGameProps> = ({ onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isLoading, isReady, handLandmarksRef } = useFaceDetection(videoRef);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(7); // More lives!
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isInLava, setIsInLava] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [invincible, setInvincible] = useState(false); // Grace period

  // Camera setup
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) videoRef.current.play();
          };
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setCameraError("Kamera erişimi reddedildi.");
      }
    };
    startCamera();
  }, []);

  // Check game over
  useEffect(() => {
    if (lives <= 0 && gameActive) {
      setGameActive(false);
      setGameOver(true);
      if (score > highScore) {
        setHighScore(score);
      }
    }
  }, [lives, gameActive, score, highScore]);

  const startGame = () => {
    setScore(0);
    setLives(7);
    setGameActive(true);
    setGameOver(false);
    setIsInLava(false);
    setInvincible(true);
    // 3 seconds of invincibility at start
    setTimeout(() => setInvincible(false), 3000);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background Video */}
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-cover opacity-60 scale-x-[-1]"
        playsInline
        muted
      />
      
      {/* Dark overlay with lava tint */}
      <div className="absolute inset-0 bg-gradient-to-t from-orange-900/60 via-red-900/30 to-gray-900/50 pointer-events-none"></div>

      {/* 3D Game Canvas */}
      {isReady && (
        <div className="absolute inset-0">
          <Canvas camera={{ position: [0, 1, 6], fov: 50 }} gl={{ alpha: true }}>
            <GameScene 
              handLandmarksRef={handLandmarksRef}
              score={score}
              setScore={setScore}
              lives={lives}
              setLives={setLives}
              gameActive={gameActive}
              setIsInLava={setIsInLava}
              isInLava={isInLava}
              invincible={invincible}
            />
          </Canvas>
        </div>
      )}

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Bar */}
        <div className="flex justify-between items-start p-4">
          <button 
            onClick={onBack}
            className="pointer-events-auto px-4 py-2 bg-gray-900/80 backdrop-blur text-orange-400 rounded-lg font-bold shadow-lg hover:bg-gray-800 transition-all border border-orange-500/50"
          >
            ← MENÜ
          </button>

          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-lg tracking-wider">
              🔥 YER LAV 🔥
            </h1>
            <p className="text-orange-300 text-sm mt-1">Lavlara düşme!</p>
          </div>

          {/* Score & Lives */}
          <div className="flex gap-3">
            <div className="bg-gray-900/80 backdrop-blur border border-orange-500/50 px-4 py-2 rounded-lg">
              <div className="text-orange-400 text-xs tracking-widest">PUAN</div>
              <div className="text-2xl font-mono text-orange-300">{score}</div>
            </div>
            <div className="bg-gray-900/80 backdrop-blur border border-red-500/50 px-4 py-2 rounded-lg">
              <div className="text-red-400 text-xs tracking-widest">CAN</div>
              <div className="text-xl font-mono text-red-300 flex gap-0.5">
                {[...Array(7)].map((_, i) => (
                  <span key={i} className={i < lives ? 'opacity-100' : 'opacity-30'}>❤️</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Invincibility Indicator */}
        {invincible && gameActive && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2">
            <div className="bg-blue-500/90 text-white px-6 py-2 rounded-full animate-pulse shadow-lg">
              <span className="text-xl font-bold">🛡️ KORUMALISIN! 🛡️</span>
            </div>
          </div>
        )}

        {/* Lava Warning */}
        {isInLava && gameActive && !invincible && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="bg-red-600/90 text-white px-8 py-4 rounded-2xl animate-pulse shadow-[0_0_50px_rgba(255,0,0,0.5)]">
              <span className="text-4xl font-black">🔥 LAVDASIN! 🔥</span>
            </div>
          </div>
        )}

        {/* Start Screen */}
        {!gameActive && !gameOver && isReady && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            <div className="bg-gray-900/95 backdrop-blur-md border-2 border-orange-500 p-8 rounded-2xl text-center max-w-md shadow-[0_0_50px_rgba(255,100,0,0.3)]">
              <div className="text-6xl mb-4">🌋</div>
              <h2 className="text-3xl font-bold text-orange-400 mb-4">YER LAV!</h2>
              <div className="text-orange-200/80 space-y-2 mb-6 text-left">
                <p>🖐️ Elini platformlara götür</p>
                <p>🔥 Aşağıdaki lavlara düşme!</p>
                <p>⬆️ Yukarıda kal, puan kazan</p>
                <p>❤️ 5 canın var, lavda can kaybedersin</p>
              </div>
              {highScore > 0 && (
                <div className="text-yellow-400 mb-4">🏆 En Yüksek: {highScore}</div>
              )}
              <button
                onClick={startGame}
                className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white text-xl font-bold rounded-lg transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(255,100,0,0.5)]"
              >
                🔥 BAŞLA 🔥
              </button>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/50">
            <div className="bg-gray-900/95 backdrop-blur-md border-2 border-red-500 p-8 rounded-2xl text-center shadow-[0_0_50px_rgba(255,0,0,0.3)]">
              <div className="text-6xl mb-4">💀</div>
              <h2 className="text-4xl font-black text-red-500 mb-4">OYUN BİTTİ!</h2>
              <div className="text-5xl font-mono text-orange-300 mb-2">{score}</div>
              <p className="text-orange-200/70 mb-4">PUAN</p>
              {score >= highScore && score > 0 && (
                <div className="text-yellow-400 text-xl mb-4 animate-pulse">🏆 YENİ REKOR! 🏆</div>
              )}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={startGame}
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-lg transition-all"
                >
                  🔄 TEKRAR
                </button>
                <button
                  onClick={onBack}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
                >
                  🏠 MENÜ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {gameActive && (
          <div className="absolute bottom-4 left-4">
            <div className="bg-gray-900/80 backdrop-blur border border-orange-500/30 px-4 py-2 rounded-lg">
              <div className="text-orange-400 text-xs">💡 Elini platformlara götür ve lavlardan kaç!</div>
            </div>
          </div>
        )}

        {/* Hand Status */}
        <div className="absolute bottom-4 right-4">
          <div className={`px-4 py-2 rounded-lg font-bold ${
            handLandmarksRef.current?.length > 0 
              ? 'bg-green-600 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            {handLandmarksRef.current?.length > 0 ? '✋ El Algılandı' : '👀 El Arıyorum...'}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && !cameraError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-gray-900 to-red-900">
          <div className="flex flex-col items-center">
            <div className="text-6xl mb-4 animate-bounce">🌋</div>
            <h2 className="text-orange-400 font-bold text-2xl mb-2">Lavlar Hazırlanıyor...</h2>
            <div className="w-48 h-3 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Error */}
      {cameraError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900">
          <div className="bg-gray-800 rounded-2xl p-8 text-center border border-red-500">
            <div className="text-6xl mb-4">😢</div>
            <h2 className="text-red-500 text-2xl font-bold mb-2">Kamera Açılamadı</h2>
            <p className="text-gray-400 mb-4">{cameraError}</p>
            <button onClick={onBack} className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg">
              Menüye Dön
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

