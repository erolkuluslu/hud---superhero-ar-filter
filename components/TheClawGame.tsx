import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useFaceDetection } from '../hooks/useFaceDetection';

interface TheClawGameProps {
  onBack: () => void;
}

// Hand connections for skeleton visualization
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
  [0, 13], [13, 14], [14, 15], [15, 16], // Ring
  [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [5, 9], [9, 13], [13, 17]              // Palm
];

// Alien component - a cute 3D alien that follows hand when grabbed
const Alien = React.forwardRef<THREE.Group, { 
  position: [number, number, number], 
  id: number, 
  isGrabbed: boolean,
  grabbedPosition: THREE.Vector3 | null,
  color: string,
  isNearHand: boolean
}>(({ position, id, isGrabbed, grabbedPosition, color, isNearHand }, ref) => {
  const meshRef = useRef<THREE.Group>(null);
  const bobOffset = useMemo(() => Math.random() * Math.PI * 2, []);
  const basePosition = useRef(new THREE.Vector3(...position));
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    if (isGrabbed && grabbedPosition) {
      // Smoothly follow the hand position
      meshRef.current.position.lerp(grabbedPosition, 0.5);
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 10) * 0.3;
      meshRef.current.scale.setScalar(1.3); // Bigger when grabbed
    } else {
      // Return to base position with bobbing
      const targetY = basePosition.current.y + Math.sin(state.clock.elapsedTime * 2 + bobOffset) * 0.1;
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, basePosition.current.x, 0.1);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.1);
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, basePosition.current.z, 0.1);
      meshRef.current.rotation.y += 0.02;
      meshRef.current.scale.setScalar(1);
    }
    
    // Animate grab zone ring
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 2;
    }
  });

  // Expose ref for position checking
  React.useImperativeHandle(ref, () => meshRef.current!, []);

  return (
    <group ref={meshRef} position={position}>
      {/* LARGE visible grab zone - always visible */}
      <mesh ref={ringRef} rotation={[0, 0, 0]} position={[0, 0, 0]}>
        <torusGeometry args={[0.8, 0.03, 8, 32]} />
        <meshBasicMaterial 
          color={isNearHand ? "#fbbf24" : "#00ff00"} 
          transparent 
          opacity={isNearHand ? 1 : 0.4} 
        />
      </mesh>
      
      {/* Dashed circle showing grab area */}
      <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 0, 0]}>
        <ringGeometry args={[0.75, 0.85, 32]} />
        <meshBasicMaterial 
          color={isNearHand ? "#fbbf24" : "#00ff00"} 
          transparent 
          opacity={isNearHand ? 0.6 : 0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Body - MUCH bigger for easier grabbing */}
      <mesh>
        <capsuleGeometry args={[0.35, 0.4, 8, 16]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={isGrabbed ? 1 : (isNearHand ? 0.6 : 0.3)} 
        />
      </mesh>
      
      {/* Left Eye */}
      <mesh position={[-0.15, 0.2, 0.28]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[-0.15, 0.2, 0.36]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
      
      {/* Right Eye */}
      <mesh position={[0.15, 0.2, 0.28]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0.15, 0.2, 0.36]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
      
      {/* Antenna */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.25, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1} />
      </mesh>
      
      {/* "GRAB ME" text indicator when near */}
      {isNearHand && !isGrabbed && (
        <pointLight position={[0, 0, 0]} color="#fbbf24" intensity={3} distance={2} />
      )}
      
      {/* Grab indicator ring when grabbed */}
      {isGrabbed && (
        <>
          <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 0, 0]}>
            <ringGeometry args={[0.5, 0.6, 32]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.9} side={THREE.DoubleSide} />
          </mesh>
          <pointLight position={[0, 0, 0]} color="#fbbf24" intensity={5} distance={3} />
        </>
      )}
    </group>
  );
});

// The Hole/Portal component - HUGE and CENTERED
const Hole = ({ position, isNearHand }: { position: [number, number, number], isNearHand: boolean }) => {
  const ringRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.5;
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = -state.clock.elapsedTime * 0.3;
      // Pulse effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
      outerRingRef.current.scale.set(scale, scale, 1);
    }
  });

  return (
    <group position={position}>
      {/* HUGE Hole base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5, 32]} />
        <meshStandardMaterial color="#000" />
      </mesh>
      
      {/* Outer pulsing ring */}
      <mesh ref={outerRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[1.4, 1.8, 32]} />
        <meshBasicMaterial 
          color={isNearHand ? "#fbbf24" : "#22c55e"} 
          transparent 
          opacity={isNearHand ? 0.9 : 0.4} 
        />
      </mesh>
      
      {/* Glowing ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.2, 1.5, 32]} />
        <meshStandardMaterial 
          color={isNearHand ? "#fbbf24" : "#22c55e"} 
          emissive={isNearHand ? "#fbbf24" : "#22c55e"} 
          emissiveIntensity={isNearHand ? 2 : 1.5} 
          transparent 
          opacity={0.9} 
        />
      </mesh>
      
      {/* Inner glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.8, 1.2, 32]} />
        <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={0.8} transparent opacity={0.6} />
      </mesh>
      
      {/* Center glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <circleGeometry args={[0.8, 32]} />
        <meshStandardMaterial color="#000" emissive="#22c55e" emissiveIntensity={0.3} />
      </mesh>
      
      {/* "DROP HERE" indicator - 4 corners */}
      {[0, 90, 180, 270].map((angle, i) => (
        <group key={i}>
          {/* Arrow pointing inward */}
          <mesh rotation={[-Math.PI / 2, 0, (angle * Math.PI) / 180 + Math.PI]} position={[
            Math.cos((angle * Math.PI) / 180) * 2,
            0.1,
            Math.sin((angle * Math.PI) / 180) * 2
          ]}>
            <coneGeometry args={[0.15, 0.4, 4]} />
            <meshStandardMaterial 
              color={isNearHand ? "#fbbf24" : "#22c55e"} 
              emissive={isNearHand ? "#fbbf24" : "#22c55e"} 
              emissiveIntensity={1} 
            />
          </mesh>
        </group>
      ))}
      
      {/* Strong pulsing light */}
      <pointLight position={[0, 1, 0]} color={isNearHand ? "#fbbf24" : "#22c55e"} intensity={isNearHand ? 8 : 4} distance={4} />
    </group>
  );
};

// Hand Skeleton Visualization - CV style
const HandSkeleton = ({ 
  handLandmarks, 
  transform 
}: { 
  handLandmarks: any[] | null,
  transform: (lm: any) => THREE.Vector3 
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  
  const pointsGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(21 * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const linesGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(HAND_CONNECTIONS.length * 2 * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame(() => {
    if (!handLandmarks || handLandmarks.length === 0) {
      if (pointsRef.current) pointsRef.current.visible = false;
      if (linesRef.current) linesRef.current.visible = false;
      return;
    }

    const hand = handLandmarks[0];
    
    // Update points
    if (pointsRef.current) {
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

    // Update lines
    if (linesRef.current) {
      linesRef.current.visible = true;
      const positions = linesRef.current.geometry.attributes.position.array as Float32Array;
      
      HAND_CONNECTIONS.forEach(([start, end], i) => {
        const startLm = hand[start];
        const endLm = hand[end];
        const startWorld = transform(startLm);
        const endWorld = transform(endLm);
        
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
      {/* Joint points */}
      <points ref={pointsRef} geometry={pointsGeometry}>
        <pointsMaterial 
          size={0.08} 
          color="#00ff00" 
          transparent 
          opacity={1} 
          sizeAttenuation={true}
        />
      </points>
      
      {/* Skeleton lines */}
      <lineSegments ref={linesRef} geometry={linesGeometry}>
        <lineBasicMaterial color="#00ff00" linewidth={3} transparent opacity={0.9} />
      </lineSegments>
    </>
  );
};

// Pinch indicator - BIG and VISIBLE
const PinchIndicator = ({ 
  position, 
  isPinching 
}: { 
  position: THREE.Vector3 | null,
  isPinching: boolean 
}) => {
  const ref = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ref.current && position) {
      ref.current.position.copy(position);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 2;
      // Pulse when not pinching
      if (!isPinching) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
        ringRef.current.scale.set(scale, scale, 1);
      }
    }
  });

  if (!position) return null;

  return (
    <group ref={ref}>
      {/* LARGE grab zone indicator */}
      <mesh ref={ringRef}>
        <torusGeometry args={[1.2, 0.05, 8, 32]} />
        <meshBasicMaterial 
          color={isPinching ? "#fbbf24" : "#00ff00"} 
          transparent 
          opacity={isPinching ? 1 : 0.6}
        />
      </mesh>
      
      {/* Inner ring */}
      <mesh>
        <torusGeometry args={[0.8, 0.03, 8, 32]} />
        <meshBasicMaterial 
          color={isPinching ? "#fbbf24" : "#00ff00"} 
          transparent 
          opacity={0.4}
        />
      </mesh>
      
      {/* Center crosshair */}
      <mesh rotation={[0, 0, 0]}>
        <planeGeometry args={[0.5, 0.05]} />
        <meshBasicMaterial color={isPinching ? "#fbbf24" : "#00ff00"} transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI/2]}>
        <planeGeometry args={[0.5, 0.05]} />
        <meshBasicMaterial color={isPinching ? "#fbbf24" : "#00ff00"} transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Center dot */}
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={isPinching ? "#fbbf24" : "#00ff00"} />
      </mesh>
      
      {/* Glow */}
      <pointLight color={isPinching ? "#fbbf24" : "#00ff00"} intensity={isPinching ? 5 : 2} distance={3} />
    </group>
  );
};

// Floor/Arena - minimal, just grid lines
const Arena = () => {
  return (
    <group>
      {/* Very subtle grid lines */}
      {Array.from({ length: 9 }).map((_, i) => (
        <group key={i}>
          <mesh position={[(i - 4) * 1.5, 0, 0]}>
            <planeGeometry args={[0.02, 12]} />
            <meshBasicMaterial color="#22c55e" transparent opacity={0.15} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, (i - 4) * 1.5, 0]}>
            <planeGeometry args={[12, 0.02]} />
            <meshBasicMaterial color="#22c55e" transparent opacity={0.15} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// Main game scene
const GameScene = ({ 
  handLandmarksRef, 
  videoWidth, 
  videoHeight,
  score,
  setScore,
  gameActive
}: { 
  handLandmarksRef: React.MutableRefObject<any[]>,
  videoWidth: number,
  videoHeight: number,
  score: number,
  setScore: React.Dispatch<React.SetStateAction<number>>,
  gameActive: boolean
}) => {
  const { size, viewport } = useThree();
  const [aliens, setAliens] = useState<Array<{ 
    id: number, 
    position: [number, number, number], 
    grabbed: boolean,
    color: string 
  }>>([]);
  const [pinchPosition, setPinchPosition] = useState<THREE.Vector3 | null>(null);
  const [isPinching, setIsPinching] = useState(false);
  const [grabbedAlienId, setGrabbedAlienId] = useState<number | null>(null);
  const [nearAlienId, setNearAlienId] = useState<number | null>(null);
  const [isNearHole, setIsNearHole] = useState(false);
  const alienRefs = useRef<Map<number, THREE.Group>>(new Map());
  // HOLE IN THE CENTER-BOTTOM - easily reachable!
  const holePosition: [number, number, number] = [0, 0, 0];
  const holeRadius = 1.5;

  // Initialize aliens - spread around the edges, away from hole
  useEffect(() => {
    const colors = ['#22c55e', '#84cc16', '#10b981', '#14b8a6', '#06b6d4', '#facc15', '#f97316'];
    // Position aliens in corners and edges - far from center hole
    const positions: [number, number, number][] = [
      [-2.5, 0, -1.5],   // top-left
      [2.5, 0, -1.5],    // top-right
      [-3, 0, 1],        // left
      [3, 0, 1],         // right
      [-2, 0, 2],        // bottom-left
      [2, 0, 2],         // bottom-right
    ];
    
    const initialAliens = positions.map((pos, i) => ({
      id: i,
      position: pos,
      grabbed: false,
      color: colors[i % colors.length]
    }));
    setAliens(initialAliens);
  }, []);

  // Transform hand landmarks to 3D space - MUCH WIDER RANGE
  const transformLandmark = (lm: { x: number, y: number, z: number }) => {
    // Simple direct mapping - hand position maps to game world
    const mirroredX = 1 - lm.x;
    
    // Map 0-1 range to wider game world range
    const wx = (mirroredX - 0.5) * 10; // -5 to +5 range
    const wy = (0.5 - lm.y) * 6;       // -3 to +3 range  
    const wz = 0; // Keep on same plane for easier interaction

    return new THREE.Vector3(wx, wy, wz);
  };

  // Check if hand is making a pinch/grab gesture - requires deliberate pinch
  const checkPinchGesture = (hand: any[]) => {
    if (!hand || hand.length < 21) return false;
    
    const thumbTip = hand[4];
    const indexTip = hand[8];
    
    // Distance between thumb and index ONLY (no middle finger alternative)
    const thumbIndexDist = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) +
      Math.pow(thumbTip.y - indexTip.y, 2)
    );
    
    // Stricter threshold - requires deliberate pinch (0.08)
    return thumbIndexDist < 0.08;
  };

  // Get pinch point (between thumb and index)
  const getPinchPoint = (hand: any[]) => {
    const thumbTip = hand[4];
    const indexTip = hand[8];
    return {
      x: (thumbTip.x + indexTip.x) / 2,
      y: (thumbTip.y + indexTip.y) / 2,
      z: (thumbTip.z + indexTip.z) / 2
    };
  };

  useFrame(() => {
    if (!gameActive) return;
    
    const hands = handLandmarksRef.current;
    
    if (hands && hands.length > 0) {
      const hand = hands[0];
      const pinchPoint = getPinchPoint(hand);
      const worldPos = transformLandmark(pinchPoint);
      setPinchPosition(worldPos);
      
      const currentlyPinching = checkPinchGesture(hand);
      
      // Check which alien is closest to hand (for highlighting)
      let closestAlienId: number | null = null;
      let closestDist = Infinity;
      
      aliens.forEach(alien => {
        if (!alien.grabbed) {
          const alienRef = alienRefs.current.get(alien.id);
          if (alienRef) {
            const alienPos = new THREE.Vector3();
            alienRef.getWorldPosition(alienPos);
            // Only consider X and Y distance (ignore Z)
            const distance = Math.sqrt(
              Math.pow(worldPos.x - alienPos.x, 2) +
              Math.pow(worldPos.y - alienPos.y, 2)
            );
            
            // Grab radius - need to be somewhat close (1.8 units)
            if (distance < 1.8 && distance < closestDist) {
              closestDist = distance;
              closestAlienId = alien.id;
            }
          }
        }
      });
      
      setNearAlienId(closestAlienId);
      
      // Check if near hole - only highlight when actually over it
      const holePos = new THREE.Vector3(...holePosition);
      const holeDist = Math.sqrt(
        Math.pow(worldPos.x - holePos.x, 2) +
        Math.pow(worldPos.y - holePos.y, 2)
      );
      setIsNearHole(holeDist < holeRadius * 1.2);
      
      // Detect pinch START (transition from not pinching to pinching)
      if (currentlyPinching && !isPinching) {
        // Just started pinching - try to grab the nearest alien
        if (grabbedAlienId === null && closestAlienId !== null) {
          setGrabbedAlienId(closestAlienId);
          setAliens(prev => prev.map(a => 
            a.id === closestAlienId ? { ...a, grabbed: true } : a
          ));
        }
      }
      
      // Detect pinch END (transition from pinching to not pinching)
      if (!currentlyPinching && isPinching && grabbedAlienId !== null) {
        // Just released - check if actually INSIDE the hole
        if (holeDist < holeRadius * 1.0) {
          // SCORED!
          setScore(prev => prev + 100);
          setAliens(prev => prev.filter(a => a.id !== grabbedAlienId));
          
          // Spawn a new alien at random edge position
          setTimeout(() => {
            const colors = ['#22c55e', '#84cc16', '#10b981', '#14b8a6', '#06b6d4', '#facc15', '#f97316'];
            const spawnPositions: [number, number, number][] = [
              [-2.5, 0, -1.5], [2.5, 0, -1.5], [-3, 0, 1], [3, 0, 1], [-2, 0, 2], [2, 0, 2]
            ];
            const pos = spawnPositions[Math.floor(Math.random() * spawnPositions.length)];
            const newAlien = {
              id: Date.now(),
              position: pos,
              grabbed: false,
              color: colors[Math.floor(Math.random() * colors.length)]
            };
            setAliens(prev => [...prev, newAlien]);
          }, 500);
        } else {
          // Dropped elsewhere
          setAliens(prev => prev.map(a => 
            a.id === grabbedAlienId ? { ...a, grabbed: false } : a
          ));
        }
        setGrabbedAlienId(null);
      }
      
      setIsPinching(currentlyPinching);
    } else {
      setPinchPosition(null);
      setIsPinching(false);
      setNearAlienId(null);
      setIsNearHole(false);
      
      // Release if hand disappears
      if (grabbedAlienId !== null) {
        setAliens(prev => prev.map(a => 
          a.id === grabbedAlienId ? { ...a, grabbed: false } : a
        ));
        setGrabbedAlienId(null);
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <pointLight position={[0, 3, 0]} color="#22c55e" intensity={0.5} />
      
      <Arena />
      <Hole position={holePosition} isNearHand={isNearHole || (grabbedAlienId !== null && isNearHole)} />
      
      {aliens.map(alien => (
        <Alien 
          key={alien.id}
          ref={(el) => {
            if (el) alienRefs.current.set(alien.id, el);
            else alienRefs.current.delete(alien.id);
          }}
          id={alien.id}
          position={alien.position}
          isGrabbed={alien.grabbed}
          grabbedPosition={alien.grabbed ? pinchPosition : null}
          color={alien.color}
          isNearHand={nearAlienId === alien.id}
        />
      ))}
      
      {/* Hand skeleton visualization */}
      <HandSkeleton 
        handLandmarks={handLandmarksRef.current}
        transform={transformLandmark}
      />
      
      {/* Pinch position indicator */}
      <PinchIndicator position={pinchPosition} isPinching={isPinching} />
      
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} intensity={1.5} />
        <Vignette offset={0.1} darkness={0.2} />
      </EffectComposer>
    </>
  );
};

// Main component
export const TheClawGame: React.FC<TheClawGameProps> = ({ onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isLoading, isReady, handLandmarksRef } = useFaceDetection(videoRef);
  const [dims, setDims] = useState({ width: 640, height: 480 });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Camera setup
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
  }, []);

  // Game timer
  useEffect(() => {
    if (gameActive && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameActive(false);
            setGameOver(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameActive, timeLeft]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setGameActive(true);
    setGameOver(false);
  };

  const restartGame = () => {
    startGame();
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Background Video - MORE VISIBLE */}
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-cover opacity-70 scale-x-[-1]"
        playsInline
        muted
      />
      
      {/* Lighter overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/40 pointer-events-none"></div>

      {/* 3D Game Canvas */}
      {isReady && (
        <div className="absolute inset-0">
          <Canvas camera={{ position: [0, 0, 8], fov: 60 }} gl={{ alpha: true }}>
            <GameScene 
              handLandmarksRef={handLandmarksRef}
              videoWidth={dims.width}
              videoHeight={dims.height}
              score={score}
              setScore={setScore}
              gameActive={gameActive}
            />
          </Canvas>
        </div>
      )}

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Bar */}
        <div className="flex justify-between items-start p-6">
          {/* Back Button */}
          <button 
            onClick={onBack}
            className="pointer-events-auto px-4 py-2 bg-black/60 backdrop-blur border border-green-500/50 text-green-400 rounded-lg hover:bg-green-900/30 transition-all flex items-center gap-2"
          >
            <span>←</span> MENÜ
          </button>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-4xl font-black text-green-400 tracking-wider drop-shadow-[0_0_20px_rgba(34,197,94,0.8)]">
              PENÇE OYUNU
            </h1>
            <p className="text-green-200/70 text-sm mt-1">Uzaylıları Yakala!</p>
          </div>

          {/* Score & Time */}
          <div className="flex gap-4">
            <div className="bg-black/60 backdrop-blur border border-cyan-500/50 px-6 py-3 rounded-lg">
              <div className="text-cyan-400 text-xs tracking-widest">SÜRE</div>
              <div className="text-3xl font-mono text-cyan-300">{timeLeft}</div>
            </div>
            <div className="bg-black/60 backdrop-blur border border-green-500/50 px-6 py-3 rounded-lg">
              <div className="text-green-400 text-xs tracking-widest">PUAN</div>
              <div className="text-3xl font-mono text-green-300">{score}</div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {!gameActive && !gameOver && isReady && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            <div className="bg-black/80 backdrop-blur-md border border-green-500/50 p-8 rounded-2xl text-center max-w-md">
              <h2 className="text-3xl font-bold text-green-400 mb-4">NASIL OYNANIR?</h2>
              <div className="text-green-200/80 space-y-3 mb-6 text-left text-lg">
                <p>🖐️ Elinizi kameraya gösterin</p>
                <p>👌 Parmakları birleştirerek TUTUN</p>
                <p>🚀 Uzaylıyı yeşil deliğe sürükleyin</p>
                <p>✋ Parmakları açarak BIRAKIN</p>
                <p>⏱️ 60 saniyede en çok puan toplayın!</p>
              </div>
              <button
                onClick={startGame}
                className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white text-xl font-bold rounded-lg transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(34,197,94,0.5)]"
              >
                OYUNU BAŞLAT
              </button>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            <div className="bg-black/80 backdrop-blur-md border border-green-500/50 p-8 rounded-2xl text-center">
              <h2 className="text-5xl font-black text-green-400 mb-4">SÜRE DOLDU!</h2>
              <div className="text-6xl font-mono text-green-300 mb-2">{score}</div>
              <p className="text-green-200/70 mb-6">PUAN</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={restartGame}
                  className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-all"
                >
                  TEKRAR OYNA
                </button>
                <button
                  onClick={onBack}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
                >
                  MENÜYE DÖN
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hand Status Indicator */}
        <div className="absolute bottom-6 left-6">
          <div className="bg-black/60 backdrop-blur border border-green-500/30 px-4 py-2 rounded-lg">
            <div className="text-green-400 text-xs tracking-widest">EL TAKİBİ</div>
            <div className={`text-sm font-mono ${handLandmarksRef.current?.length > 0 ? 'text-green-300' : 'text-red-400'}`}>
              {handLandmarksRef.current?.length > 0 ? '● AKTİF' : '○ ARANIYOR'}
            </div>
          </div>
        </div>

        {/* Grab hint */}
        {gameActive && (
          <div className="absolute bottom-6 right-6">
            <div className="bg-black/60 backdrop-blur border border-yellow-500/30 px-4 py-2 rounded-lg">
              <div className="text-yellow-400 text-xs tracking-widest">İPUCU</div>
              <div className="text-yellow-200 text-sm">
                👌 Parmakları birleştir = TUT<br/>
                ✋ Parmakları aç = BIRAK
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && !cameraError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h2 className="text-green-400 font-mono text-xl tracking-widest animate-pulse">OYUN YÜKLENİYOR...</h2>
            <p className="text-green-700 mt-2 text-sm">Görüntü Modelleri Hazırlanıyor</p>
          </div>
        </div>
      )}

      {/* Camera Error */}
      {cameraError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="p-8 border border-red-500 rounded max-w-md text-center">
            <h2 className="text-red-500 text-2xl font-bold mb-2">KAMERA HATASI</h2>
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
};
