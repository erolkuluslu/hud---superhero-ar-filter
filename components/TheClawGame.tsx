import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { Text, useTexture } from '@react-three/drei';
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

// ============================================================
// PLANET CONFIGURATION
// ============================================================
type PlanetKey = 'neptune' | 'mars' | 'venus';

const PLANETS: Record<PlanetKey, {
  name: string;
  emoji: string;
  color: string;
  position: [number, number, number];
  portalRadius: number;
  snapRadius: number; // generous hit detection
}> = {
  neptune: { name: 'Neptün', emoji: '🔵', color: '#3b82f6', position: [0, -2.3, 0],   portalRadius: 1.1, snapRadius: 2.2 },
  mars:    { name: 'Mars',   emoji: '🔴', color: '#ef4444', position: [-3.2, -2.1, 0], portalRadius: 1.1, snapRadius: 2.2 },
  venus:   { name: 'Venüs',  emoji: '🟢', color: '#22c55e', position: [3.2, -2.1, 0],  portalRadius: 1.1, snapRadius: 2.2 },
};

const PLANET_TEXTURE_PATHS: Record<PlanetKey, string> = {
  mars: '/photos/mars.png',
  neptune: '/photos/neptun.png',
  venus: '/photos/venus.png',
};

const PLANET_ALIEN_COLORS: Record<PlanetKey, string[]> = {
  neptune: ['#3b82f6', '#06b6d4', '#0ea5e9', '#818cf8', '#a5b4fc'],
  mars:    ['#ef4444', '#f97316', '#dc2626', '#fb923c', '#fca5a5'],
  venus:   ['#22c55e', '#10b981', '#14b8a6', '#4ade80', '#6ee7b7'],
};

// Per-planet science facts shown after each delivery
const PLANET_FACTS: Record<PlanetKey, string[]> = {
  neptune: [
    'Neptün\'ün rüzgarları saatte 2.000 km\'ye ulaşır — Güneş sisteminin en hızlı rüzgarı! 💨',
    'Neptün, Güneş\'e 4.5 milyar km uzaklıktadır — ışık oraya 4 saatte ulaşır! ☀️',
    'Neptün\'de bir yıl, Dünya\'da 165 yıla eşittir! 🪐',
    'Neptün\'ün 14 uydusu var, en büyüğü Triton ters yönde döner! 🌕',
    'Neptün o kadar soğuk ki yüzeyi -200°C\'nin altında! 🥶',
  ],
  mars: [
    'Mars\'taki Olympus Dağı, Everest\'in 3 katı yüksekliğindedir — 21 km! ⛰️',
    'Mars\'ın yüzeyi demir oksit (pas) yüzünden kırmızı görünür! 🔴',
    'Mars\'ta bir gün 24 saat 37 dakikadır — neredeyse Dünya gibi! ⏰',
    'Mars\'ta dev toz fırtınaları tüm gezegeni kaplayabilir! 🌪️',
    'Mars\'ın iki küçük uydusu var: Phobos ve Deimos! 🌑',
  ],
  venus: [
    'Venüs\'te bir gün, bir yıldan daha uzundur — çok yavaş döner! ⏳',
    'Venüs, Güneş sisteminin en sıcak gezegenidir — 465°C! 🔥',
    'Venüs ters döner — Güneş orada batıdan doğar! 🌅',
    'Venüs\'ün atmosferi çok yoğun — insan orada ezilirdi! 💨',
    'Venüs, Dünya\'ya en yakın komşu gezegendir! 🌍',
  ],
};

// Alien sizes and points configuration
const ALIEN_SIZES = {
  normal: { scale: 1.0, bodyRadius: 0.35, bodyHeight: 0.4, points: 150, grabRadius: 1.0 },
  small: { scale: 0.7, bodyRadius: 0.25, bodyHeight: 0.28, points: 300, grabRadius: 0.8 }
} as const;

// Spawn configuration
const MIN_ALIEN_DISTANCE = 1.8;
const MIN_PORTAL_DISTANCE = 1.2;
const MAX_X_SPAWN = 3.8;
const MAX_Y_SPAWN = 2.5;
const MIN_Y_SPAWN = 0.2;

type AlienSize = keyof typeof ALIEN_SIZES;

// ============================================================
// ALIEN COMPONENT
// ============================================================
const Alien = React.forwardRef<THREE.Group, {
  position: [number, number, number],
  id: number,
  isGrabbed: boolean,
  grabbedPosition: THREE.Vector3 | null,
  color: string,
  isNearHand: boolean,
  size: AlienSize,
  planet: PlanetKey,
  isRejected: boolean,
}>(({ position, isGrabbed, grabbedPosition, color, isNearHand, size = 'normal', planet, isRejected }, ref) => {
  const meshRef = useRef<THREE.Group>(null);
  const bobOffset = useMemo(() => Math.random() * Math.PI * 2, []);
  const basePosition = useRef(new THREE.Vector3(...position));
  const ringRef = useRef<THREE.Mesh>(null);
  const rejectProgress = useRef(0);

  const sizeConfig = ALIEN_SIZES[size];
  const planetColor = PLANETS[planet].color;

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (isRejected) {
      // Bounce-back animation
      rejectProgress.current = Math.min(rejectProgress.current + delta * 3, 1);
      const bounce = Math.sin(rejectProgress.current * Math.PI) * 0.8;
      meshRef.current.position.y = basePosition.current.y + bounce;
      const squish = 1 + Math.sin(rejectProgress.current * Math.PI * 2) * 0.15;
      meshRef.current.scale.set(squish * 1.1, 1 / squish, squish * 1.1);
    } else {
      rejectProgress.current = 0;
      if (isGrabbed && grabbedPosition) {
        meshRef.current.position.lerp(grabbedPosition, 0.5);
        meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 10) * 0.3;
        meshRef.current.scale.setScalar(1.3);
      } else {
        const targetY = basePosition.current.y + Math.sin(state.clock.elapsedTime * 2 + bobOffset) * 0.1;
        meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, basePosition.current.x, 0.1);
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.1);
        meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, basePosition.current.z, 0.1);
        meshRef.current.rotation.y += 0.02;
        meshRef.current.scale.setScalar(1);
      }
    }

    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 2;
    }
  });

  React.useImperativeHandle(ref, () => meshRef.current!, []);

  return (
    <group ref={meshRef} position={position}>
      {/* Grab zone ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[sizeConfig.grabRadius, 0.03 * sizeConfig.scale, 8, 32]} />
        <meshBasicMaterial
          color={isNearHand ? '#fbbf24' : planetColor}
          transparent
          opacity={isNearHand ? 1 : 0.4}
        />
      </mesh>

      {/* Body */}
      <mesh>
        <capsuleGeometry args={[sizeConfig.bodyRadius, sizeConfig.bodyHeight, 8, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isGrabbed ? 1 : (isNearHand ? 0.6 : 0.3)}
        />
      </mesh>

      {/* Planet dot indicator on body */}
      <mesh position={[0, 0.1 * sizeConfig.scale, sizeConfig.bodyRadius + 0.01]}>
        <circleGeometry args={[0.08 * sizeConfig.scale, 12]} />
        <meshBasicMaterial color={planetColor} side={THREE.DoubleSide} />
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
        <meshStandardMaterial color={planetColor} emissive={planetColor} emissiveIntensity={1} />
      </mesh>

      {isNearHand && !isGrabbed && (
        <pointLight position={[0, 0, 0]} color="#fbbf24" intensity={3} distance={2} />
      )}
      {isGrabbed && (
        <>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5 * sizeConfig.scale, 0.6 * sizeConfig.scale, 32]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.9} side={THREE.DoubleSide} />
          </mesh>
          <pointLight position={[0, 0, 0]} color="#fbbf24" intensity={5 * sizeConfig.scale} distance={3 * sizeConfig.scale} />
        </>
      )}
    </group>
  );
});

// ============================================================
// FALLING ALIEN ANIMATION
// ============================================================
const FallingAlien = ({
  color, size, startPosition, onComplete
}: {
  color: string, size: AlienSize, startPosition: THREE.Vector3, onComplete: () => void
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const progress = useRef(0);
  const sizeConfig = ALIEN_SIZES[size];

  useFrame((_state, delta) => {
    if (!meshRef.current) return;
    progress.current += delta * 2.5;
    const t = progress.current;
    const radius = Math.max(0, 0.8 - t * 0.6);
    meshRef.current.position.x = Math.cos(t * 10) * radius;
    meshRef.current.position.z = Math.sin(t * 10) * radius;
    meshRef.current.position.y = -t * 4;
    meshRef.current.rotation.y += delta * 15;
    meshRef.current.rotation.x += delta * 10;
    const shrinkScale = Math.max(0.1, 1 - t * 0.6);
    meshRef.current.scale.setScalar(shrinkScale * sizeConfig.scale);
    if (progress.current > 1.5) onComplete();
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

// ============================================================
// PLANET PORTAL COMPONENT (planet image sphere)
// ============================================================
const PlanetPortal = ({
  planetKey,
  position,
  isNearHand,
  isActive,
  deliveryCount,
  wantingBeam,
  fallingAliens,
  onFallComplete,
}: {
  planetKey: PlanetKey,
  position: [number, number, number],
  isNearHand: boolean,
  isActive: boolean,
  deliveryCount: number,
  wantingBeam: boolean,
  fallingAliens: Array<{ id: number, color: string, size: AlienSize, position: THREE.Vector3 }>,
  onFallComplete: (id: number) => void,
}) => {
  const planet = PLANETS[planetKey];
  const texture = useTexture(PLANET_TEXTURE_PATHS[planetKey]);
  const planetRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const particleCount = 16;
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const r = 1.3 + Math.random() * 0.3;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = Math.sin(angle) * r;
    }
    return positions;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Slowly spin planet
    if (planetRef.current) planetRef.current.rotation.y += 0.005;

    if (ring1Ref.current) ring1Ref.current.rotation.z = t * 0.8;
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.5;
      const pulse = 1 + Math.sin(t * 3) * 0.06;
      ring2Ref.current.scale.set(pulse, pulse, 1);
    }

    if (beamRef.current) {
      beamRef.current.visible = wantingBeam && isActive;
      if (wantingBeam) {
        const bp = 0.8 + Math.sin(t * 8) * 0.2;
        beamRef.current.scale.setScalar(bp);
      }
    }

    // Orbit particles around planet
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const baseAngle = (i / particleCount) * Math.PI * 2;
        const angle = baseAngle + t * (0.3 + (i % 3) * 0.1);
        const r = 1.3 + Math.sin(t * 0.5 + i) * 0.15;
        const h = Math.sin(t * 0.4 + i * 0.7) * 0.3;
        positions[i * 3] = Math.cos(angle) * r;
        positions[i * 3 + 1] = h;
        positions[i * 3 + 2] = Math.sin(angle) * r;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group position={position}>
      {/* Planet sphere with texture */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[1.0, 32, 32]} />
        <meshStandardMaterial
          map={texture}
          emissive={planet.color}
          emissiveIntensity={isNearHand ? 0.5 : 0.15}
        />
      </mesh>

      {/* Inner glow ring (tilted like Saturn ring) */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 6, 0, 0]}>
        <ringGeometry args={[1.1, 1.3, 32]} />
        <meshStandardMaterial
          color={planet.color}
          emissive={planet.color}
          emissiveIntensity={isNearHand ? 2.5 : 1.5}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Outer pulse ring */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 6, 0, 0]}>
        <ringGeometry args={[1.3, 1.5, 32]} />
        <meshBasicMaterial
          color={planet.color}
          transparent
          opacity={isNearHand ? 0.6 : 0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Orbit particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.07}
          color={planet.color}
          transparent
          opacity={0.8}
          sizeAttenuation={true}
        />
      </points>

      {/* Wanting beam (vertical guide when matching alien grabbed) */}
      <mesh ref={beamRef} position={[0, 3, 0]} visible={false}>
        <cylinderGeometry args={[0.1, 0.4, 6, 8, 1, true]} />
        <meshBasicMaterial
          color={planet.color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Delivery count */}
      <Text
        position={[0, 1.7, 0]}
        fontSize={0.3}
        color="#fbbf24"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        ×{deliveryCount}
      </Text>

      {/* Planet glow light */}
      <pointLight
        position={[0, 0, 0]}
        color={planet.color}
        intensity={isNearHand ? 8 : 4}
        distance={5}
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

// ============================================================
// HAND SKELETON
// ============================================================
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
    if (linesRef.current) {
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
        <pointsMaterial size={0.08} color="#00ff00" transparent opacity={1} sizeAttenuation={true} />
      </points>
      <lineSegments ref={linesRef} geometry={linesGeometry}>
        <lineBasicMaterial color="#00ff00" linewidth={3} transparent opacity={0.9} />
      </lineSegments>
    </>
  );
};

// ============================================================
// PINCH INDICATOR
// ============================================================
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
    if (ref.current && position) ref.current.position.copy(position);
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 2;
      if (!isPinching) {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
        ringRef.current.scale.set(scale, scale, 1);
      }
    }
  });

  if (!position) return null;

  return (
    <group ref={ref}>
      <mesh ref={ringRef}>
        <torusGeometry args={[1.2, 0.05, 8, 32]} />
        <meshBasicMaterial color={isPinching ? '#fbbf24' : '#00ff00'} transparent opacity={isPinching ? 1 : 0.6} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.8, 0.03, 8, 32]} />
        <meshBasicMaterial color={isPinching ? '#fbbf24' : '#00ff00'} transparent opacity={0.4} />
      </mesh>
      <mesh rotation={[0, 0, 0]}>
        <planeGeometry args={[0.5, 0.05]} />
        <meshBasicMaterial color={isPinching ? '#fbbf24' : '#00ff00'} transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <planeGeometry args={[0.5, 0.05]} />
        <meshBasicMaterial color={isPinching ? '#fbbf24' : '#00ff00'} transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={isPinching ? '#fbbf24' : '#00ff00'} />
      </mesh>
      <pointLight color={isPinching ? '#fbbf24' : '#00ff00'} intensity={isPinching ? 5 : 2} distance={3} />
    </group>
  );
};

// ============================================================
// ARENA (grid)
// ============================================================
const Arena = React.memo(() => (
  <group>
    {Array.from({ length: 7 }).map((_, i) => (
      <group key={i}>
        <mesh position={[(i - 4) * 1.5, 0, 0]}>
          <planeGeometry args={[0.02, 12]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.1} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, (i - 4) * 1.5, 0]}>
          <planeGeometry args={[12, 0.02]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.1} side={THREE.DoubleSide} />
        </mesh>
      </group>
    ))}
  </group>
));

// ============================================================
// MAIN GAME SCENE
// ============================================================
const GameScene = ({
  handLandmarksRef,
  setScore,
  gameActive,
  showingFact,
  onPlanetDelivery,
  onWrongPortal,
  planetDeliveryCounts,
}: {
  handLandmarksRef: React.RefObject<any[]>,
  setScore: React.Dispatch<React.SetStateAction<number>>,
  gameActive: boolean,
  showingFact: boolean,
  onPlanetDelivery: (planet: PlanetKey) => void,
  onWrongPortal: (planet: PlanetKey) => void,
  planetDeliveryCounts: Record<PlanetKey, number>,
}) => {
  const [aliens, setAliens] = useState<Array<{
    id: number,
    position: [number, number, number],
    grabbed: boolean,
    color: string,
    size: AlienSize,
    points: number,
    planet: PlanetKey,
    rejected: boolean,
  }>>([]);
  const [pinchPosition, setPinchPosition] = useState<THREE.Vector3 | null>(null);
  const [isPinching, setIsPinching] = useState(false);
  const [grabbedAlienId, setGrabbedAlienId] = useState<number | null>(null);
  // Sticky grab state (refs for use inside useFrame without stale closures)
  const pinchActiveRef = useRef(false);
  const lastPinchTimeRef = useRef(0);
  const lastHandTimeRef = useRef(0);
  const prevPinchRef = useRef(false);
  const [nearAlienId, setNearAlienId] = useState<number | null>(null);
  const [nearPortal, setNearPortal] = useState<PlanetKey | null>(null);
  const [fallingAliensByPortal, setFallingAliensByPortal] = useState<Record<PlanetKey, Array<{ id: number, color: string, size: AlienSize, position: THREE.Vector3 }>>>({
    neptune: [], mars: [], venus: []
  });
  const alienRefs = useRef<Map<number, THREE.Group>>(new Map());

  const PLANET_KEYS: PlanetKey[] = ['neptune', 'mars', 'venus'];

  const generateSpawnPosition = useCallback((existingPositions: [number, number, number][] = []): [number, number, number] => {
    let attempts = 0;
    while (attempts < 100) {
      const x = (Math.random() * 2 - 1) * MAX_X_SPAWN;
      const y = MIN_Y_SPAWN + Math.random() * (MAX_Y_SPAWN - MIN_Y_SPAWN);
      const z = 0;

      // Check distance from all portals
      let tooCloseToPortal = false;
      for (const pk of PLANET_KEYS) {
        const pp = PLANETS[pk].position;
        const portalDist = Math.sqrt((x - pp[0]) ** 2 + (y - pp[1]) ** 2);
        if (portalDist < MIN_PORTAL_DISTANCE + PLANETS[pk].portalRadius) {
          tooCloseToPortal = true;
          break;
        }
      }
      if (tooCloseToPortal) { attempts++; continue; }

      let tooClose = false;
      for (const pos of existingPositions) {
        const dist = Math.sqrt((x - pos[0]) ** 2 + (y - pos[1]) ** 2);
        if (dist < MIN_ALIEN_DISTANCE) { tooClose = true; break; }
      }
      if (!tooClose) return [x, y, z];
      attempts++;
    }
    return [0, 1.5, 0];
  }, []);

  const spawnNewAlien = useCallback((existingAliens: typeof aliens) => {
    const existingPositions = existingAliens.map(a => a.position);
    // Balanced spawning: pick the planet with fewest current aliens
    const counts: Record<PlanetKey, number> = { neptune: 0, mars: 0, venus: 0 };
    existingAliens.forEach(a => counts[a.planet]++);
    const minCount = Math.min(counts.neptune, counts.mars, counts.venus);
    const candidates = PLANET_KEYS.filter(pk => counts[pk] === minCount);
    const planet = candidates[Math.floor(Math.random() * candidates.length)];
    const isSmall = Math.random() < 0.35;
    const size: AlienSize = isSmall ? 'small' : 'normal';
    const colorOptions = PLANET_ALIEN_COLORS[planet];
    return {
      id: Date.now() + Math.random(),
      position: generateSpawnPosition(existingPositions),
      grabbed: false,
      color: colorOptions[Math.floor(Math.random() * colorOptions.length)],
      size,
      points: ALIEN_SIZES[size].points,
      planet,
      rejected: false,
    };
  }, [generateSpawnPosition]);

  // Initialize aliens (2 of each planet)
  useEffect(() => {
    const initialAliens: typeof aliens = [];
    for (let i = 0; i < 6; i++) {
      initialAliens.push(spawnNewAlien(initialAliens));
    }
    setAliens(initialAliens);
  }, []);

  const transformLandmark = useCallback((lm: { x: number, y: number, z: number }) => {
    const mirroredX = 1 - lm.x;
    return new THREE.Vector3((mirroredX - 0.5) * 10, (0.5 - lm.y) * 6, 0);
  }, []);

  const getPinchDist = useCallback((hand: any[]) => {
    if (!hand || hand.length < 21) return 1;
    return Math.sqrt((hand[4].x - hand[8].x) ** 2 + (hand[4].y - hand[8].y) ** 2);
  }, []);

  const getPinchPoint = useCallback((hand: any[]) => ({
    x: (hand[4].x + hand[8].x) / 2,
    y: (hand[4].y + hand[8].y) / 2,
    z: (hand[4].z + hand[8].z) / 2,
  }), []);

  useFrame(() => {
    if (!gameActive) return;
    const hands = handLandmarksRef.current;
    const now = Date.now();

    // Block all input during fact popup — release any grabbed alien
    if (showingFact) {
      if (grabbedAlienId !== null) {
        setAliens(prev => prev.map(a => a.id === grabbedAlienId ? { ...a, grabbed: false } : a));
        setGrabbedAlienId(null);
      }
      setPinchPosition(null);
      setIsPinching(false);
      pinchActiveRef.current = false;
      prevPinchRef.current = false;
      return;
    }

    if (hands && hands.length > 0) {
      lastHandTimeRef.current = now;
      const hand = hands[0];
      const pinchPoint = getPinchPoint(hand);
      const worldPos = transformLandmark(pinchPoint);
      setPinchPosition(worldPos);

      // Hysteresis pinch: grab at 0.08, release only at 0.13 after 250ms grace
      const rawDist = getPinchDist(hand);
      if (rawDist < 0.08) {
        pinchActiveRef.current = true;
        lastPinchTimeRef.current = now;
      } else if (rawDist > 0.13 && (now - lastPinchTimeRef.current) > 250) {
        pinchActiveRef.current = false;
      }
      const currentlyPinching = pinchActiveRef.current;

      // Find closest alien (only when not already grabbing)
      if (!currentlyPinching || grabbedAlienId === null) {
        let closestAlienId: number | null = null;
        let closestDist = Infinity;
        aliens.forEach(alien => {
          if (!alien.grabbed) {
            const alienRef = alienRefs.current.get(alien.id);
            if (alienRef) {
              const alienPos = new THREE.Vector3();
              alienRef.getWorldPosition(alienPos);
              const distance = Math.sqrt((worldPos.x - alienPos.x) ** 2 + (worldPos.y - alienPos.y) ** 2);
              const grabThreshold = alien.size === 'small' ? 1.4 : 1.6;
              if (distance < grabThreshold && distance < closestDist) {
                closestDist = distance;
                closestAlienId = alien.id;
              }
            }
          }
        });
        setNearAlienId(closestAlienId);
      }

      // Find nearest portal using generous snapRadius
      let nearestPortal: PlanetKey | null = null;
      let nearestPortalDist = Infinity;
      PLANET_KEYS.forEach(pk => {
        const pp = PLANETS[pk].position;
        const dist = Math.sqrt((worldPos.x - pp[0]) ** 2 + (worldPos.y - pp[1]) ** 2);
        if (dist < PLANETS[pk].snapRadius && dist < nearestPortalDist) {
          nearestPortalDist = dist;
          nearestPortal = pk;
        }
      });
      setNearPortal(nearestPortal);

      // AUTO-DELIVER: while pinching and holding alien, proximity to portal triggers delivery
      let didAutoDeliver = false;
      if (currentlyPinching && grabbedAlienId !== null && nearestPortal !== null) {
        const grabbedAlien = aliens.find(a => a.id === grabbedAlienId);
        if (grabbedAlien) {
          didAutoDeliver = true;
          if (grabbedAlien.planet === nearestPortal) {
            setScore(prev => prev + grabbedAlien.points);
            onPlanetDelivery(nearestPortal);
            setFallingAliensByPortal(prev => ({
              ...prev,
              [nearestPortal]: [...prev[nearestPortal], {
                id: grabbedAlien.id,
                color: grabbedAlien.color,
                size: grabbedAlien.size,
                position: worldPos.clone(),
              }]
            }));
            setAliens(prev => {
              const remaining = prev.filter(a => a.id !== grabbedAlienId);
              return [...remaining, spawnNewAlien(remaining)];
            });
          } else {
            onWrongPortal(nearestPortal);
            const gid = grabbedAlienId;
            setAliens(prev => prev.map(a => a.id === gid ? { ...a, grabbed: false, rejected: true } : a));
            setTimeout(() => {
              setAliens(prev => prev.map(a => a.id === gid ? { ...a, rejected: false } : a));
            }, 600);
          }
          setGrabbedAlienId(null);
        }
      }

      // Grab START (pinch transition false→true)
      if (!didAutoDeliver && currentlyPinching && !prevPinchRef.current) {
        if (grabbedAlienId === null) {
          let closestId: number | null = null;
          let closestD = Infinity;
          aliens.forEach(alien => {
            if (!alien.grabbed) {
              const alienRef = alienRefs.current.get(alien.id);
              if (alienRef) {
                const ap = new THREE.Vector3();
                alienRef.getWorldPosition(ap);
                const d = Math.sqrt((worldPos.x - ap.x) ** 2 + (worldPos.y - ap.y) ** 2);
                const thr = alien.size === 'small' ? 1.4 : 1.6;
                if (d < thr && d < closestD) { closestD = d; closestId = alien.id; }
              }
            }
          });
          if (closestId !== null) {
            setGrabbedAlienId(closestId);
            setAliens(prev => prev.map(a => a.id === closestId ? { ...a, grabbed: true } : a));
          }
        }
      }

      // Manual release (fingers open away from portals) — just drop
      if (!didAutoDeliver && !currentlyPinching && prevPinchRef.current && grabbedAlienId !== null) {
        setAliens(prev => prev.map(a => a.id === grabbedAlienId ? { ...a, grabbed: false } : a));
        setGrabbedAlienId(null);
      }

      prevPinchRef.current = currentlyPinching;
      setIsPinching(currentlyPinching);
    } else {
      // Hand lost — grace period of 300ms before dropping
      if (now - lastHandTimeRef.current > 300) {
        setPinchPosition(null);
        setIsPinching(false);
        setNearAlienId(null);
        setNearPortal(null);
        pinchActiveRef.current = false;
        prevPinchRef.current = false;
        if (grabbedAlienId !== null) {
          setAliens(prev => prev.map(a => a.id === grabbedAlienId ? { ...a, grabbed: false } : a));
          setGrabbedAlienId(null);
        }
      }
    }
  });

  // Determine wanting beam: grabbed alien's planet
  const grabbedAlien = aliens.find(a => a.id === grabbedAlienId);
  const grabbedPlanet = grabbedAlien?.planet ?? null;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <pointLight position={[0, 3, 0]} color="#22c55e" intensity={0.3} />

      <Arena />

      <React.Suspense fallback={null}>
        {PLANET_KEYS.map((pk) => (
          <PlanetPortal
            key={pk}
            planetKey={pk}
            position={PLANETS[pk].position}
            isNearHand={nearPortal === pk}
            isActive={true}
            deliveryCount={planetDeliveryCounts[pk]}
            wantingBeam={grabbedPlanet === pk}
            fallingAliens={fallingAliensByPortal[pk]}
            onFallComplete={(id) => setFallingAliensByPortal(prev => ({
              ...prev,
              [pk]: prev[pk].filter(a => a.id !== id)
            }))}
          />
        ))}
      </React.Suspense>

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
          planet={alien.planet}
          isRejected={alien.rejected}
        />
      ))}

      <HandSkeleton handLandmarks={handLandmarksRef.current} transform={transformLandmark} />
      <PinchIndicator position={pinchPosition} isPinching={isPinching} />

      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0.3} intensity={0.8} levels={3} />
        <Vignette offset={0.1} darkness={0.2} />
      </EffectComposer>
    </>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export const TheClawGame: React.FC<TheClawGameProps> = ({ onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isLoading, isReady, handLandmarksRef } = useFaceDetection(videoRef);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [gameActive, setGameActive] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [handHoldProgress, setHandHoldProgress] = useState(0);
  const [planetDeliveryCounts, setPlanetDeliveryCounts] = useState<Record<PlanetKey, number>>({ neptune: 0, mars: 0, venus: 0 });
  const [wrongPortalMsg, setWrongPortalMsg] = useState<string | null>(null);
  const [deliveryFact, setDeliveryFact] = useState<{ text: string; planet: PlanetKey } | null>(null);
  const [showingFact, setShowingFact] = useState(false);
  const deliveryFactTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const planetFactIndexRef = useRef<Record<PlanetKey, number>>({ neptune: 0, mars: 0, venus: 0 });
  const [showNarrative, setShowNarrative] = useState(false);
  const [gestureText, setGestureText] = useState('El Bekleniyor');
  const handHoldTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handHoldStartRef = useRef<number>(0);
  const wrongPortalTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // Camera setup
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => videoRef.current?.play();
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
        setCameraError('Kamera erişimi reddedildi veya kullanılamıyor.');
      }
    };
    startCamera();
  }, []);

  // Game timer (pauses during fact display)
  useEffect(() => {
    if (gameActive && timeLeft > 0 && !showingFact) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameActive(false);
            setShowInstructions(true);
            setHandHoldProgress(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameActive, timeLeft, showingFact]);

  // Gesture text update
  useEffect(() => {
    const interval = setInterval(() => {
      const hands = handLandmarksRef.current;
      if (!hands || hands.length === 0) {
        setGestureText('El Bekleniyor');
        return;
      }
      const hand = hands[0];
      if (!hand || hand.length < 21) return;
      const thumbTip = hand[4];
      const indexTip = hand[8];
      const dist = Math.sqrt((thumbTip.x - indexTip.x) ** 2 + (thumbTip.y - indexTip.y) ** 2);
      setGestureText(dist < 0.08 ? 'Tutma Algılandı' : 'El Algılandı');
    }, 100);
    return () => clearInterval(interval);
  }, [handLandmarksRef]);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(90);
    setGameActive(true);
    setShowInstructions(false);
    setPlanetDeliveryCounts({ neptune: 0, mars: 0, venus: 0 });
    setDeliveryFact(null);
    setShowingFact(false);
    planetFactIndexRef.current = { neptune: 0, mars: 0, venus: 0 };
    setShowNarrative(true);
    setTimeout(() => setShowNarrative(false), 5000);
  }, []);

  const handlePlanetDelivery = useCallback((planet: PlanetKey) => {
    setPlanetDeliveryCounts(prev => ({ ...prev, [planet]: prev[planet] + 1 }));
    // Show fullscreen fact for 3s, timer pauses
    const idx = planetFactIndexRef.current[planet];
    const facts = PLANET_FACTS[planet];
    setDeliveryFact({ text: facts[idx % facts.length], planet });
    setShowingFact(true);
    planetFactIndexRef.current[planet] = idx + 1;
    if (deliveryFactTimeoutRef.current) clearTimeout(deliveryFactTimeoutRef.current);
    deliveryFactTimeoutRef.current = setTimeout(() => {
      setShowingFact(false);
      setDeliveryFact(null);
    }, 3000);
  }, []);

  const handleWrongPortal = useCallback((planet: PlanetKey) => {
    const planetName = PLANETS[planet].name;
    setWrongPortalMsg(`Hmm! Bu uzaylı buraya ait değil! ${PLANETS[planet].emoji} ${planetName}'e götür!`);
    if (wrongPortalTimeoutRef.current) clearTimeout(wrongPortalTimeoutRef.current);
    wrongPortalTimeoutRef.current = setTimeout(() => setWrongPortalMsg(null), 2000);
  }, []);

  // Hand hold detection for starting game
  useEffect(() => {
    if (!showInstructions || gameActive) {
      setHandHoldProgress(0);
      if (handHoldTimerRef.current) { clearInterval(handHoldTimerRef.current); handHoldTimerRef.current = null; }
      return;
    }
    const checkHandHold = setInterval(() => {
      const hands = handLandmarksRef.current;
      const hasHand = hands && hands.length > 0;
      if (hasHand) {
        if (handHoldStartRef.current === 0) handHoldStartRef.current = Date.now();
        const elapsed = Date.now() - handHoldStartRef.current;
        const progress = Math.min((elapsed / 3000) * 100, 100);
        setHandHoldProgress(progress);
        if (progress >= 100) {
          setHandHoldProgress(0);
          handHoldStartRef.current = 0;
          startGame();
        }
      } else {
        handHoldStartRef.current = 0;
        setHandHoldProgress(0);
      }
    }, 50);
    handHoldTimerRef.current = checkHandHold;
    return () => {
      clearInterval(checkHandHold);
      if (handHoldTimerRef.current) { clearInterval(handHoldTimerRef.current); handHoldTimerRef.current = null; }
    };
  }, [showInstructions, gameActive, handLandmarksRef, startGame]);

  const allFacts = useMemo(() => [...PLANET_FACTS.neptune, ...PLANET_FACTS.mars, ...PLANET_FACTS.venus], []);
  const scienceFact = useMemo(() => allFacts[Math.floor(Math.random() * allFacts.length)], [timeLeft === 0]);
  const handLandmarkCount = handLandmarksRef.current?.[0]?.length ?? 0;
  const isHandDetected = (handLandmarksRef.current?.length ?? 0) > 0;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Background Video */}
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-cover opacity-70 scale-x-[-1]"
        playsInline
        muted
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/40 pointer-events-none"></div>

      {/* 3D Game Canvas */}
      {isReady && (
        <div className="absolute inset-0">
          <Canvas camera={{ position: [0, 0, 8], fov: 60 }} gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }} dpr={[1, 1.5]}>
            <GameScene
              handLandmarksRef={handLandmarksRef}
              setScore={setScore}
              gameActive={gameActive}
              showingFact={showingFact}
              onPlanetDelivery={handlePlanetDelivery}
              onWrongPortal={handleWrongPortal}
              planetDeliveryCounts={planetDeliveryCounts}
            />
          </Canvas>
        </div>
      )}

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Bar */}
        <div className="flex justify-between items-start p-6">
          <button
            onClick={onBack}
            className="pointer-events-auto px-4 py-2 bg-black/60 backdrop-blur border border-green-500/50 text-green-400 rounded-lg hover:bg-green-900/30 transition-all flex items-center gap-2"
          >
            <span>←</span> MENÜ
          </button>

          <div className="text-center">
            <h1 className="text-4xl font-black text-green-400 tracking-wider drop-shadow-[0_0_20px_rgba(34,197,94,0.8)]">
              PENÇE OYUNU
            </h1>
            <p className="text-green-200/70 text-sm mt-1">🌌 Uzaylıları Evlerine Gönder!</p>
          </div>

          <div className="flex gap-4">
            <div className="bg-black/60 backdrop-blur border border-cyan-500/50 px-6 py-3 rounded-lg">
              <div className="text-cyan-400 text-xs tracking-widest">SÜRE</div>
              <div className={`text-3xl font-mono ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-cyan-300'}`}>{timeLeft}</div>
            </div>
            <div className="bg-black/60 backdrop-blur border border-green-500/50 px-6 py-3 rounded-lg">
              <div className="text-green-400 text-xs tracking-widest">PUAN</div>
              <div className="text-3xl font-mono text-green-300">{score}</div>
            </div>
          </div>
        </div>

        {/* Planet Score Row (Mathematics) */}
        {gameActive && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 flex gap-4">
            {(['neptune', 'mars', 'venus'] as PlanetKey[]).map(pk => {
              return (
                <div
                  key={pk}
                  className="px-3 py-1 rounded-lg border text-sm font-mono bg-black/60 backdrop-blur"
                  style={{ borderColor: PLANETS[pk].color, color: PLANETS[pk].color }}
                >
                  {PLANETS[pk].emoji} {PLANETS[pk].name}: <span className="font-bold">{planetDeliveryCounts[pk]}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Space Narrative (intro, 5s) */}
        {showNarrative && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center animate-fade-in-out">
              <p className="text-3xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">
                🌌 Uzay fırtınası!
              </p>
              <p className="text-xl text-blue-200 mt-2">
                Uzaylılar evlerinden koptu!
              </p>
              <p className="text-lg text-cyan-300 mt-1">
                Onları kendi gezegenlerine geri gönder!
              </p>
            </div>
          </div>
        )}

        {/* Wrong portal message */}
        {wrongPortalMsg && (
          <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-orange-900/80 backdrop-blur border border-orange-500 px-6 py-3 rounded-xl text-orange-200 font-semibold text-lg text-center max-w-md">
              {wrongPortalMsg}
            </div>
          </div>
        )}

        {/* Science fact popup (pauses timer + blocks all interaction) */}
        {showingFact && deliveryFact && (
          <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-auto"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          >
            <div
              className="rounded-3xl p-10 max-w-xl w-full mx-8 text-center shadow-2xl border-2"
              style={{
                background: `linear-gradient(135deg, ${PLANETS[deliveryFact.planet].color}55, #000000ee)`,
                borderColor: PLANETS[deliveryFact.planet].color,
                backdropFilter: 'blur(32px)',
                boxShadow: `0 0 60px ${PLANETS[deliveryFact.planet].color}66`,
              }}
            >
              <div className="text-7xl mb-4">{PLANETS[deliveryFact.planet].emoji}</div>
              <p
                className="text-xl font-bold mb-3 uppercase tracking-widest"
                style={{ color: PLANETS[deliveryFact.planet].color }}
              >
                🔬 Bilim Gerçeği
              </p>
              <p className="text-white text-xl font-semibold leading-relaxed">{deliveryFact.text}</p>
              <p className="mt-6 text-base" style={{ color: `${PLANETS[deliveryFact.planet].color}bb` }}>
                — {PLANETS[deliveryFact.planet].name} Gezegeni —
              </p>
            </div>
          </div>
        )}

        {/* Instructions / End Screen */}
        {!gameActive && isReady && showInstructions && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto overflow-y-auto">
            <div className="bg-black/90 backdrop-blur-md border border-green-500/50 p-8 rounded-2xl text-center max-w-2xl my-8 relative">
              {/* STEAM End Screen when game finished */}
              {timeLeft === 0 ? (
                <>
                  <div className="mb-4">
                    <p className="text-2xl font-bold text-yellow-400">🏆 Oyun Bitti!</p>
                    <p className="text-5xl font-bold text-yellow-300 mt-2">{score} PUAN</p>
                  </div>
                  {/* Per-planet results */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {(['neptune', 'mars', 'venus'] as PlanetKey[]).map(pk => (
                      <div key={pk} className="bg-black/40 rounded-lg p-3 border" style={{ borderColor: PLANETS[pk].color }}>
                        <p className="text-2xl">{PLANETS[pk].emoji}</p>
                        <p className="font-bold" style={{ color: PLANETS[pk].color }}>{PLANETS[pk].name}</p>
                        <p className="text-white text-xl font-mono">×{planetDeliveryCounts[pk]}</p>
                      </div>
                    ))}
                  </div>
                  {/* Science fact */}
                  <div className="bg-blue-900/40 border border-blue-500/40 rounded-lg p-4 mb-4">
                    <p className="text-blue-300 text-sm font-semibold">🔬 BİLİM SORUSU</p>
                    <p className="text-white mt-1">{scienceFact}</p>
                  </div>
                  {/* STEAM badges */}
                  <div className="flex justify-center gap-2 mb-4 flex-wrap">
                    {[
                      { icon: '🔬', label: 'Bilim', desc: 'Gezegenleri öğrendin!' },
                      { icon: '💻', label: 'Teknoloji', desc: 'YZ kullandın!' },
                      { icon: '⚙️', label: 'Mühendislik', desc: 'Portalleri açtın!' },
                      { icon: '🎨', label: 'Sanat', desc: 'Renkleri eşleştin!' },
                      { icon: '🔢', label: 'Matematik', desc: `${planetDeliveryCounts.neptune + planetDeliveryCounts.mars + planetDeliveryCounts.venus} teslimat!` },
                    ].map(badge => (
                      <div key={badge.label} className="bg-purple-900/40 border border-purple-500/30 rounded-lg px-3 py-2 text-center">
                        <p className="text-xl">{badge.icon}</p>
                        <p className="text-purple-300 text-xs font-bold">{badge.label}</p>
                        <p className="text-purple-200 text-xs">{badge.desc}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-green-400 mb-3">🌌 PENÇE OYUNU</h2>
                  <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-4 mb-4">
                    <p className="text-purple-300 font-semibold">Uzay fırtınası uzaylıları evlerinden kopardı!</p>
                    <p className="text-purple-200 text-sm mt-1">Onları doğru gezegene gönder: 🔴 Mars · 🔵 Neptün · 🟢 Venüs</p>
                  </div>
                </>
              )}

              {/* Hand Hold Progress */}
              {handHoldProgress > 0 && (
                <div className="absolute top-4 right-4 flex flex-col items-center gap-2">
                  <div className="relative w-16 h-16">
                    <svg className="transform -rotate-90 w-16 h-16">
                      <circle cx="32" cy="32" r="28" stroke="#22c55e" strokeWidth="4" fill="none" opacity="0.3" />
                      <circle
                        cx="32" cy="32" r="28" stroke="#22c55e" strokeWidth="4" fill="none"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - handHoldProgress / 100)}`}
                        className="transition-all duration-100"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-green-400 font-bold text-lg">{Math.ceil(3 - (handHoldProgress / 100) * 3)}</span>
                    </div>
                  </div>
                  <p className="text-green-400 text-xs">✋ El havada tut</p>
                </div>
              )}

              {/* How to Play */}
              {timeLeft !== 0 && (
                <>
                  <h3 className="text-xl font-bold text-green-300 mb-3">📋 Nasıl Oynanır?</h3>
                  <div className="text-green-200/80 space-y-2 mb-4 text-left">
                    <p className="flex items-start gap-2"><span className="text-2xl">🖐️</span><span><strong>Adım 1:</strong> Elinizi kameraya gösterin</span></p>
                    <p className="flex items-start gap-2"><span className="text-2xl">👌</span><span><strong>Adım 2:</strong> Parmakları birleştirerek renkli uzaylıyı TUTUN</span></p>
                    <p className="flex items-start gap-2"><span className="text-2xl">🚀</span><span><strong>Adım 3:</strong> Uzaylıyı AYNI RENKLİ gezegene taşıyın</span></p>
                    <p className="flex items-start gap-2"><span className="text-2xl">✋</span><span><strong>Adım 4:</strong> Portal içinde parmakları açarak BIRAKIN</span></p>
                    <p className="flex items-start gap-2 text-yellow-400"><span className="text-2xl">⭐</span><span><strong>İpucu:</strong> Daha fazla uzaylı gönderdikçe yeni gezegenler açılır!</span></p>
                  </div>
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
                    <p className="text-red-200 text-sm">⏱️ <strong>60 saniye</strong> içinde en yüksek skoru yap!</p>
                  </div>
                </>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={startGame}
                  className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-xl font-bold rounded-lg transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(34,197,94,0.5)]"
                >
                  🚀 OYUNU BAŞLAT
                </button>
                <p className="text-green-400/60 text-xs">💡 İpucu: Elinizi 3 saniye havada tutarak başlayabilirsiniz</p>
              </div>
            </div>
          </div>
        )}

        {/* AI HUD Panel (Technology - STEAM) */}
        <div className="absolute bottom-6 left-6">
          <div className="bg-black/70 backdrop-blur border border-blue-500/40 px-4 py-3 rounded-lg min-w-40">
            <div className="text-blue-400 text-xs tracking-widest font-bold mb-2">🤖 YAPAY ZEKA AKTİF</div>
            <div className="text-blue-200 text-xs space-y-1">
              <div>📍 {handLandmarkCount} El Noktası</div>
              <div className={isHandDetected ? 'text-green-300' : 'text-red-400'}>
                {isHandDetected ? `✋ ${gestureText}` : '○ El Bekleniyor'}
              </div>
              <div className="flex gap-1 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${isHandDetected && i < 3 ? 'bg-blue-400' : 'bg-gray-600'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Grab hint */}
        {gameActive && (
          <div className="absolute bottom-6 right-6">
            <div className="bg-black/60 backdrop-blur border border-yellow-500/30 px-4 py-2 rounded-lg">
              <div className="text-yellow-400 text-xs tracking-widest">İPUCU</div>
              <div className="text-yellow-200 text-sm">
                👌 Parmakları birleştir = TUT<br />
                ✋ Parmakları aç = BIRAK<br />
                <span className="text-yellow-400">🎨 Rengi eşleştir!</span>
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
