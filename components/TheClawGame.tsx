import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
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

// Alien sizes and points configuration - grab uses 2D distance (X-Y only)
const ALIEN_SIZES = {
  normal: { scale: 1.0, bodyRadius: 0.35, bodyHeight: 0.4, points: 100, grabRadius: 1.0 },
  small: { scale: 0.7, bodyRadius: 0.25, bodyHeight: 0.28, points: 200, grabRadius: 0.8 }
} as const;

// Spawn configuration - all aliens spawn on Z=0 plane (same as hand)
const MIN_ALIEN_DISTANCE = 1.8;
// Minimum distance from portal center
const MIN_PORTAL_DISTANCE = 2.5;
// Hand reach limits (based on transformLandmark: X=-5 to +5, Y=-3 to +3)
const MAX_X_SPAWN = 3.8;  // Leave margin from edge
const MAX_Y_SPAWN = 2.2;
const MIN_Y_SPAWN = -2.0;

type AlienSize = keyof typeof ALIEN_SIZES;

// Extended color palette
const ALIEN_COLORS = [
  '#22c55e', '#84cc16', '#10b981', '#14b8a6', '#06b6d4', // Greens & Cyans
  '#facc15', '#f97316', '#ef4444', '#ec4899', '#a855f7', // Warm & Pink
  '#6366f1', '#3b82f6', '#0ea5e9', '#8b5cf6', '#d946ef'  // Blues & Purples
];

// Alien component - a cute 3D alien that follows hand when grabbed
const Alien = React.forwardRef<THREE.Group, {
  position: [number, number, number],
  id: number,
  isGrabbed: boolean,
  grabbedPosition: THREE.Vector3 | null,
  color: string,
  isNearHand: boolean,
  size: AlienSize
}>(({ position, isGrabbed, grabbedPosition, color, isNearHand, size = 'normal' }, ref) => {
  const meshRef = useRef<THREE.Group>(null);
  const bobOffset = useMemo(() => Math.random() * Math.PI * 2, []);
  const basePosition = useRef(new THREE.Vector3(...position));
  const ringRef = useRef<THREE.Mesh>(null);

  // Get size configuration
  const sizeConfig = ALIEN_SIZES[size];

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
        <torusGeometry args={[sizeConfig.grabRadius, 0.03 * sizeConfig.scale, 8, 32]} />
        <meshBasicMaterial
          color={isNearHand ? "#fbbf24" : "#00ff00"}
          transparent
          opacity={isNearHand ? 1 : 0.4}
        />
      </mesh>

      {/* Dashed circle showing grab area */}
      <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 0, 0]}>
        <ringGeometry args={[sizeConfig.grabRadius * 0.9, sizeConfig.grabRadius * 1.05, 32]} />
        <meshBasicMaterial
          color={isNearHand ? "#fbbf24" : "#00ff00"}
          transparent
          opacity={isNearHand ? 0.6 : 0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Body - size based on alien type */}
      <mesh>
        <capsuleGeometry args={[sizeConfig.bodyRadius, sizeConfig.bodyHeight, 8, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isGrabbed ? 1 : (isNearHand ? 0.6 : 0.3)}
        />
      </mesh>
      
      {/* Left Eye */}
      <mesh position={[-0.15 * sizeConfig.scale, 0.2 * sizeConfig.scale, 0.28 * sizeConfig.scale]}>
        <sphereGeometry args={[0.1 * sizeConfig.scale, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[-0.15 * sizeConfig.scale, 0.2 * sizeConfig.scale, 0.36 * sizeConfig.scale]}>
        <sphereGeometry args={[0.05 * sizeConfig.scale, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>

      {/* Right Eye */}
      <mesh position={[0.15 * sizeConfig.scale, 0.2 * sizeConfig.scale, 0.28 * sizeConfig.scale]}>
        <sphereGeometry args={[0.1 * sizeConfig.scale, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0.15 * sizeConfig.scale, 0.2 * sizeConfig.scale, 0.36 * sizeConfig.scale]}>
        <sphereGeometry args={[0.05 * sizeConfig.scale, 16, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>

      {/* Antenna */}
      <mesh position={[0, 0.55 * sizeConfig.scale, 0]}>
        <cylinderGeometry args={[0.03 * sizeConfig.scale, 0.03 * sizeConfig.scale, 0.25 * sizeConfig.scale, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.72 * sizeConfig.scale, 0]}>
        <sphereGeometry args={[0.07 * sizeConfig.scale, 16, 16]} />
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
            <ringGeometry args={[0.5 * sizeConfig.scale, 0.6 * sizeConfig.scale, 32]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.9} side={THREE.DoubleSide} />
          </mesh>
          <pointLight position={[0, 0, 0]} color="#fbbf24" intensity={5 * sizeConfig.scale} distance={3 * sizeConfig.scale} />
        </>
      )}
    </group>
  );
});

// Falling alien animation component
const FallingAlien = ({
  color,
  size,
  startPosition,
  onComplete
}: {
  color: string,
  size: AlienSize,
  startPosition: THREE.Vector3,
  onComplete: () => void
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const progress = useRef(0);
  const sizeConfig = ALIEN_SIZES[size];

  useFrame((_state, delta) => {
    if (!meshRef.current) return;

    progress.current += delta * 2.5;

    // Spiral down animation - tighter spiral for smaller portal
    const t = progress.current;
    const radius = Math.max(0, 0.8 - t * 0.6);
    meshRef.current.position.x = Math.cos(t * 10) * radius;
    meshRef.current.position.z = Math.sin(t * 10) * radius;
    meshRef.current.position.y = -t * 4;

    // Spin and shrink
    meshRef.current.rotation.y += delta * 15;
    meshRef.current.rotation.x += delta * 10;
    const shrinkScale = Math.max(0.1, 1 - t * 0.6);
    meshRef.current.scale.setScalar(shrinkScale * sizeConfig.scale);

    // Remove after animation
    if (progress.current > 1.5) {
      onComplete();
    }
  });

  return (
    <group ref={meshRef} position={[startPosition.x, 0, startPosition.z]}>
      <mesh>
        <capsuleGeometry args={[sizeConfig.bodyRadius, sizeConfig.bodyHeight, 8, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
      </mesh>
      <pointLight color={color} intensity={3} distance={2} />
    </group>
  );
};

// Enhanced Portal component with beautiful effects
const Portal = ({
  position,
  isNearHand,
  fallingAliens,
  onFallComplete
}: {
  position: [number, number, number],
  isNearHand: boolean,
  fallingAliens: Array<{ id: number, color: string, size: AlienSize, position: THREE.Vector3 }>,
  onFallComplete: (id: number) => void
}) => {
  const portalRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const spiralRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Create particle positions for portal effect - optimized particle count
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(30 * 3); // Reduced from 40 to 30
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const radius = 0.8 + Math.random() * 0.4;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.random() * 0.3;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return positions;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Rotate rings in different directions
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.8;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.5;
      const pulse = 1 + Math.sin(t * 3) * 0.08;
      ring2Ref.current.scale.set(pulse, pulse, 1);
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z = t * 1.2;
    }

    // Animate spiral
    if (spiralRef.current) {
      spiralRef.current.rotation.y = t * 2;
    }

    // Animate particles - optimized
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < 30; i++) {
        const baseAngle = (i / 30) * Math.PI * 2;
        const angle = baseAngle + t * 0.5;
        const radius = 0.8 + Math.sin(t * 2 + i) * 0.2;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.sin(t * 3 + i * 0.5) * 0.2 + 0.15;
        positions[i * 3 + 2] = Math.sin(angle) * radius;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const activeColor = isNearHand ? "#fbbf24" : "#8b5cf6";
  const secondaryColor = isNearHand ? "#f97316" : "#06b6d4";

  return (
    <group ref={portalRef} position={position}>
      {/* Deep black hole center - SMALLER */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <circleGeometry args={[1.2, 64]} />
        <meshStandardMaterial color="#000" />
      </mesh>

      {/* Gradient void */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <circleGeometry args={[1.0, 64]} />
        <meshStandardMaterial
          color="#1a0a2e"
          emissive="#4c1d95"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Inner swirl effect */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <ringGeometry args={[0.2, 0.8, 64]} />
        <meshStandardMaterial
          color="#7c3aed"
          emissive="#7c3aed"
          emissiveIntensity={isNearHand ? 1.5 : 0.8}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Outer ring 1 - main glow */}
      <mesh ref={ring1Ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.0, 1.2, 64]} />
        <meshStandardMaterial
          color={activeColor}
          emissive={activeColor}
          emissiveIntensity={isNearHand ? 2.5 : 1.5}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Outer ring 2 - pulsing */}
      <mesh ref={ring2Ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[1.2, 1.4, 64]} />
        <meshBasicMaterial
          color={secondaryColor}
          transparent
          opacity={isNearHand ? 0.8 : 0.4}
        />
      </mesh>

      {/* Outer ring 3 - thin accent */}
      <mesh ref={ring3Ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[1.4, 1.5, 32]} />
        <meshBasicMaterial
          color={activeColor}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Spiral arms - smaller */}
      <group ref={spiralRef}>
        {[0, 120, 240].map((angle, i) => (
          <mesh
            key={i}
            rotation={[-Math.PI / 2, 0, (angle * Math.PI) / 180]}
            position={[0, 0.05, 0]}
          >
            <ringGeometry args={[0.3, 0.9, 3, 1, 0, Math.PI * 0.6]} />
            <meshBasicMaterial
              color={i % 2 === 0 ? activeColor : secondaryColor}
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>

      {/* Floating particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={30}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color={activeColor}
          transparent
          opacity={0.8}
          sizeAttenuation={true}
        />
      </points>

      {/* Energy beams pointing inward - closer to portal */}
      {[0, 90, 180, 270].map((angle, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, (angle * Math.PI) / 180]}
          position={[
            Math.cos((angle * Math.PI) / 180) * 1.7,
            0.1,
            Math.sin((angle * Math.PI) / 180) * 1.7
          ]}
        >
          <coneGeometry args={[0.1, 0.35, 4]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? activeColor : secondaryColor}
            emissive={i % 2 === 0 ? activeColor : secondaryColor}
            emissiveIntensity={1.5}
          />
        </mesh>
      ))}

      {/* Central light */}
      <pointLight
        position={[0, 1, 0]}
        color={activeColor}
        intensity={isNearHand ? 10 : 5}
        distance={5}
      />
      <pointLight
        position={[0, -0.5, 0]}
        color="#7c3aed"
        intensity={3}
        distance={3}
      />

      {/* Falling aliens */}
      {fallingAliens.map(alien => (
        <FallingAlien
          key={alien.id}
          color={alien.color}
          size={alien.size}
          startPosition={alien.position}
          onComplete={() => onFallComplete(alien.id)}
        />
      ))}
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

// Floor/Arena - minimal, just grid lines (memoized for performance)
const Arena = React.memo(() => {
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
});

// Main game scene
const GameScene = ({
  handLandmarksRef,
  setScore,
  gameActive
}: {
  handLandmarksRef: React.RefObject<any[]>,
  setScore: React.Dispatch<React.SetStateAction<number>>,
  gameActive: boolean
}) => {
  const [aliens, setAliens] = useState<Array<{
    id: number,
    position: [number, number, number],
    grabbed: boolean,
    color: string,
    size: AlienSize,
    points: number
  }>>([]);
  const [pinchPosition, setPinchPosition] = useState<THREE.Vector3 | null>(null);
  const [isPinching, setIsPinching] = useState(false);
  const [grabbedAlienId, setGrabbedAlienId] = useState<number | null>(null);
  const [nearAlienId, setNearAlienId] = useState<number | null>(null);
  const [isNearHole, setIsNearHole] = useState(false);
  const [fallingAliens, setFallingAliens] = useState<Array<{
    id: number,
    color: string,
    size: AlienSize,
    position: THREE.Vector3
  }>>([]);
  const alienRefs = useRef<Map<number, THREE.Group>>(new Map());
  // HOLE IN THE CENTER - smaller portal
  const holePosition: [number, number, number] = [0, 0, 0];
  const holeRadius = 1.2;

  // Generate spawn position on X-Y plane (Z=0), within hand reach, away from portal
  const generateSpawnPosition = (existingPositions: [number, number, number][] = []): [number, number, number] => {
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      // Random X and Y within hand reach bounds
      const x = (Math.random() * 2 - 1) * MAX_X_SPAWN; // -MAX_X to +MAX_X
      const y = MIN_Y_SPAWN + Math.random() * (MAX_Y_SPAWN - MIN_Y_SPAWN);
      const z = 0; // ALL aliens on same Z plane as hand!

      // Check distance from portal center (must be outside portal area)
      const portalDist = Math.sqrt(x * x + y * y);
      if (portalDist < MIN_PORTAL_DISTANCE) {
        attempts++;
        continue;
      }

      // Check distance from all existing aliens (2D distance on X-Y plane)
      let tooClose = false;
      for (const pos of existingPositions) {
        const dx = x - pos[0];
        const dy = y - pos[1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MIN_ALIEN_DISTANCE) {
          tooClose = true;
          break;
        }
      }

      if (!tooClose) {
        return [x, y, z];
      }

      attempts++;
    }

    // Fallback - guaranteed valid position
    const fallbackAngle = Math.random() * Math.PI * 2;
    const fallbackDist = MIN_PORTAL_DISTANCE + 0.5;
    return [
      Math.cos(fallbackAngle) * Math.min(fallbackDist, MAX_X_SPAWN),
      Math.sin(fallbackAngle) * Math.min(fallbackDist, MAX_Y_SPAWN),
      0
    ];
  };

  // Initialize aliens - spread around in 3D space, away from hole and each other
  useEffect(() => {
    const positions: [number, number, number][] = [];
    const initialAliens = Array.from({ length: 6 }, (_, i) => {
      const isSmall = Math.random() < 0.35; // 35% chance for small alien
      const size: AlienSize = isSmall ? 'small' : 'normal';
      const position = generateSpawnPosition(positions);
      positions.push(position);
      return {
        id: i,
        position,
        grabbed: false,
        color: ALIEN_COLORS[Math.floor(Math.random() * ALIEN_COLORS.length)],
        size,
        points: ALIEN_SIZES[size].points
      };
    });
    setAliens(initialAliens);
  }, []);

  // Transform hand landmarks to 3D space (memoized)
  const transformLandmark = useCallback((lm: { x: number, y: number, z: number }) => {
    const mirroredX = 1 - lm.x;
    const wx = (mirroredX - 0.5) * 10; // -5 to +5 range
    const wy = (0.5 - lm.y) * 6;       // -3 to +3 range
    const wz = 0; // Keep on same plane
    return new THREE.Vector3(wx, wy, wz);
  }, []);

  // Check if hand is making a pinch gesture (memoized)
  const checkPinchGesture = useCallback((hand: any[]) => {
    if (!hand || hand.length < 21) return false;
    const thumbTip = hand[4];
    const indexTip = hand[8];
    const thumbIndexDist = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) +
      Math.pow(thumbTip.y - indexTip.y, 2)
    );
    return thumbIndexDist < 0.08;
  }, []);

  // Get pinch point (memoized)
  const getPinchPoint = useCallback((hand: any[]) => {
    const thumbTip = hand[4];
    const indexTip = hand[8];
    return {
      x: (thumbTip.x + indexTip.x) / 2,
      y: (thumbTip.y + indexTip.y) / 2,
      z: (thumbTip.z + indexTip.z) / 2
    };
  }, []);

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
            // Use 2D distance (X-Y only) since hand and aliens are on same Z plane
            const distance = Math.sqrt(
              Math.pow(worldPos.x - alienPos.x, 2) +
              Math.pow(worldPos.y - alienPos.y, 2)
            );

            // Grab threshold: 1.5 for normal, 1.3 for small (easier grab)
            const grabThreshold = alien.size === 'small' ? 1.3 : 1.5;
            if (distance < grabThreshold && distance < closestDist) {
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
          // SCORED! - Get points from the grabbed alien
          const grabbedAlien = aliens.find(a => a.id === grabbedAlienId);
          if (grabbedAlien) {
            const points = grabbedAlien.points;
            setScore(prev => prev + points);

            // Add to falling aliens for animation
            setFallingAliens(prev => [...prev, {
              id: grabbedAlien.id,
              color: grabbedAlien.color,
              size: grabbedAlien.size,
              position: worldPos.clone()
            }]);

            // Remove from active aliens
            setAliens(prev => prev.filter(a => a.id !== grabbedAlienId));

            // Spawn a new alien at random 3D position after delay
            setTimeout(() => {
              const isSmall = Math.random() < 0.35;
              const size: AlienSize = isSmall ? 'small' : 'normal';
              const existingPositions = aliens
                .filter(a => a.id !== grabbedAlienId)
                .map(a => a.position);
              const newAlien = {
                id: Date.now(),
                position: generateSpawnPosition(existingPositions),
                grabbed: false,
                color: ALIEN_COLORS[Math.floor(Math.random() * ALIEN_COLORS.length)],
                size,
                points: ALIEN_SIZES[size].points
              };
              setAliens(prev => [...prev, newAlien]);
            }, 800);
          }
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
      <Portal
        position={holePosition}
        isNearHand={isNearHole || (grabbedAlienId !== null && isNearHole)}
        fallingAliens={fallingAliens}
        onFallComplete={(id) => setFallingAliens(prev => prev.filter(a => a.id !== id))}
      />
      
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
          size={alien.size}
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
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [handHoldProgress, setHandHoldProgress] = useState(0);
  const handHoldTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handHoldStartRef = useRef<number>(0);

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

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(60);
    setGameActive(true);
    setGameOver(false);
    setShowInstructions(false);
  }, []);

  const restartGame = useCallback(() => {
    setGameOver(false);
    setShowInstructions(true);
    setHandHoldProgress(0);
  }, []);

  // Hand hold detection for closing instructions and starting game
  useEffect(() => {
    if (!showInstructions || gameActive) {
      setHandHoldProgress(0);
      if (handHoldTimerRef.current) {
        clearInterval(handHoldTimerRef.current);
        handHoldTimerRef.current = null;
      }
      return;
    }

    const checkHandHold = setInterval(() => {
      const hands = handLandmarksRef.current;
      const hasHand = hands && hands.length > 0;

      if (hasHand) {
        if (handHoldStartRef.current === 0) {
          handHoldStartRef.current = Date.now();
        }

        const elapsed = Date.now() - handHoldStartRef.current;
        const progress = Math.min((elapsed / 3000) * 100, 100);
        setHandHoldProgress(progress);

        if (progress >= 100) {
          setHandHoldProgress(0);
          handHoldStartRef.current = 0;
          startGame(); // Oyunu başlat!
        }
      } else {
        handHoldStartRef.current = 0;
        setHandHoldProgress(0);
      }
    }, 50);

    handHoldTimerRef.current = checkHandHold;

    return () => {
      clearInterval(checkHandHold);
      if (handHoldTimerRef.current) {
        clearInterval(handHoldTimerRef.current);
        handHoldTimerRef.current = null;
      }
    };
  }, [showInstructions, gameActive, handLandmarksRef, startGame]);

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
        {!gameActive && !gameOver && isReady && showInstructions && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto overflow-y-auto">
            <div className="bg-black/90 backdrop-blur-md border border-green-500/50 p-8 rounded-2xl text-center max-w-2xl my-8 relative">
              <h2 className="text-3xl font-bold text-green-400 mb-3">🎮 PENÇE OYUNU</h2>

              {/* Hand Hold Progress Indicator */}
              {handHoldProgress > 0 && (
                <div className="absolute top-4 right-4 flex flex-col items-center gap-2">
                  <div className="relative w-16 h-16">
                    <svg className="transform -rotate-90 w-16 h-16">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="#22c55e"
                        strokeWidth="4"
                        fill="none"
                        opacity="0.3"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="#22c55e"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - handHoldProgress / 100)}`}
                        className="transition-all duration-100"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-green-400 font-bold text-lg">
                        {Math.ceil(3 - (handHoldProgress / 100) * 3)}
                      </span>
                    </div>
                  </div>
                  <p className="text-green-400 text-xs">✋ El havada tut</p>
                </div>
              )}

              {/* About the Game */}
              <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-5 mb-6">
                <p className="text-sm text-purple-200/90 leading-relaxed">
                  <span className="font-semibold text-purple-400">✨ Yapay Zeka ile Oyun:</span> Kameranız
                  gerçek zamanlı olarak <span className="text-cyan-300">elinizi ve parmaklarınızı</span> takip ediyor.
                  Siz sadece elinizi hareket ettirin, <span className="text-green-300">yapay zeka</span> parmak
                  hareketlerinizi anlıyor ve <span className="text-blue-300">3 boyutlu uzayda</span> uzaylılarla
                  etkileşime dönüştürüyor. <span className="text-yellow-300">Dokunmatik ekrana</span> veya
                  <span className="text-yellow-300"> fare</span>'ye gerek yok - sadece eliniz yeterli!
                </p>
              </div>

              {/* How to Play */}
              <h3 className="text-xl font-bold text-green-300 mb-3">📋 Nasıl Oynanır?</h3>
              <div className="text-green-200/80 space-y-2 mb-6 text-left">
                <p className="flex items-start gap-2">
                  <span className="text-2xl">🖐️</span>
                  <span><strong>Adım 1:</strong> Elinizi kameraya gösterin, yeşil iskelet görünecek</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-2xl">👌</span>
                  <span><strong>Adım 2:</strong> Başparmak ve işaret parmağını birleştirerek uzaylıyı TUTUN</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-2xl">🚀</span>
                  <span><strong>Adım 3:</strong> Elinizi hareket ettirerek uzaylıyı portala taşıyın</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-2xl">✋</span>
                  <span><strong>Adım 4:</strong> Parmakları açarak portal içine BIRAKIN</span>
                </p>
                <p className="flex items-start gap-2 text-yellow-400">
                  <span className="text-2xl">⭐</span>
                  <span><strong>İpucu:</strong> Küçük uzaylılar 200 puan! Normal uzaylılar 100 puan</span>
                </p>
              </div>

              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-6">
                <p className="text-red-200 text-sm">
                  ⏱️ <strong>60 saniye</strong> içinde en yüksek skoru yapmaya çalışın!
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={startGame}
                  className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-xl font-bold rounded-lg transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(34,197,94,0.5)]"
                >
                  🚀 OYUNU BAŞLAT
                </button>
                <p className="text-green-400/60 text-xs">
                  💡 İpucu: Elinizi 3 saniye havada tutarak bu ekranı kapatabilirsiniz
                </p>
              </div>
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
                ✋ Parmakları aç = BIRAK<br/>
                <span className="text-yellow-400">⭐ Küçük = 200 puan</span>
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
