import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useFaceDetection } from '../hooks/useFaceDetection';

interface DinosaurGameProps {
  onBack: () => void;
}

// Detected gesture type
type GestureType = 'none' | 'drag' | 'rotate' | 'scale' | 'walk' | 'pet';

// Dinosaur types with Turkish names
const DINOSAUR_TYPES = [
  { id: 'trex', name: 'T-Rex', emoji: '🦖', color: '#22c55e', description: 'Güçlü ve cesur!' },
  { id: 'bronto', name: 'Brontosaurus', emoji: '🦕', color: '#3b82f6', description: 'Nazik dev!' },
  { id: 'trice', name: 'Triceratops', emoji: '🦏', color: '#f97316', description: 'Boynuzlu kahraman!' },
];

// Hand connections for skeleton
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17]
];

// T-Rex Component
const TRex = ({ 
  position, 
  scale, 
  rotation,
  isWalking,
  isPetted
}: { 
  position: THREE.Vector3, 
  scale: number,
  rotation: number,
  isWalking: boolean,
  isPetted: boolean
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    if (!isWalking) {
      groupRef.current.position.y = position.y + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
    
    if (isWalking) {
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 10) * 0.5;
        rightLegRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 10 + Math.PI) * 0.5;
      }
      groupRef.current.position.y = position.y + Math.abs(Math.sin(state.clock.elapsedTime * 10)) * 0.1;
    } else {
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
    }
    
    if (tailRef.current) {
      tailRef.current.rotation.y = Math.sin(state.clock.elapsedTime * (isPetted ? 12 : 3)) * (isPetted ? 0.5 : 0.2);
    }
    
    if (isPetted) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 15) * 0.03;
    }
  });

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]} scale={scale} rotation={[0, rotation, 0]}>
      <mesh><sphereGeometry args={[0.6, 16, 16]} /><meshStandardMaterial color="#22c55e" /></mesh>
      <mesh position={[0, -0.1, 0.3]}><sphereGeometry args={[0.4, 16, 16]} /><meshStandardMaterial color="#86efac" /></mesh>
      
      <group position={[0, 0.4, 0.5]}>
        <mesh><sphereGeometry args={[0.4, 16, 16]} /><meshStandardMaterial color="#22c55e" /></mesh>
        <mesh position={[0, -0.05, 0.3]}><boxGeometry args={[0.3, 0.25, 0.3]} /><meshStandardMaterial color="#22c55e" /></mesh>
        <mesh position={[-0.15, 0.12, 0.28]}><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color="white" /></mesh>
        <mesh position={[-0.15, 0.12, 0.35]}><sphereGeometry args={[0.05, 16, 16]} /><meshStandardMaterial color="black" /></mesh>
        <mesh position={[0.15, 0.12, 0.28]}><sphereGeometry args={[0.1, 16, 16]} /><meshStandardMaterial color="white" /></mesh>
        <mesh position={[0.15, 0.12, 0.35]}><sphereGeometry args={[0.05, 16, 16]} /><meshStandardMaterial color="black" /></mesh>
        {isPetted && (<><mesh position={[-0.25, 0, 0.25]}><sphereGeometry args={[0.06, 16, 16]} /><meshStandardMaterial color="#ff6b9d" /></mesh><mesh position={[0.25, 0, 0.25]}><sphereGeometry args={[0.06, 16, 16]} /><meshStandardMaterial color="#ff6b9d" /></mesh></>)}
        {[...Array(4)].map((_, i) => (<mesh key={i} position={[(i - 1.5) * 0.08, -0.2, 0.45]}><coneGeometry args={[0.025, 0.06, 4]} /><meshStandardMaterial color="white" /></mesh>))}
      </group>
      
      <mesh position={[-0.4, 0.15, 0.3]} rotation={[0, 0, -0.5]}><capsuleGeometry args={[0.06, 0.15, 4, 8]} /><meshStandardMaterial color="#22c55e" /></mesh>
      <mesh position={[0.4, 0.15, 0.3]} rotation={[0, 0, 0.5]}><capsuleGeometry args={[0.06, 0.15, 4, 8]} /><meshStandardMaterial color="#22c55e" /></mesh>
      <mesh ref={leftLegRef} position={[-0.25, -0.55, 0]}><capsuleGeometry args={[0.12, 0.35, 4, 8]} /><meshStandardMaterial color="#22c55e" /></mesh>
      <mesh ref={rightLegRef} position={[0.25, -0.55, 0]}><capsuleGeometry args={[0.12, 0.35, 4, 8]} /><meshStandardMaterial color="#22c55e" /></mesh>
      <mesh position={[-0.25, -0.85, 0.1]}><boxGeometry args={[0.18, 0.08, 0.25]} /><meshStandardMaterial color="#16a34a" /></mesh>
      <mesh position={[0.25, -0.85, 0.1]}><boxGeometry args={[0.18, 0.08, 0.25]} /><meshStandardMaterial color="#16a34a" /></mesh>
      <mesh ref={tailRef} position={[0, 0, -0.6]} rotation={[0.3, 0, 0]}><coneGeometry args={[0.2, 0.9, 8]} /><meshStandardMaterial color="#22c55e" /></mesh>
      {[...Array(4)].map((_, i) => (<mesh key={i} position={[0, 0.45 - i * 0.12, -0.2 - i * 0.12]} rotation={[-0.3, 0, 0]}><coneGeometry args={[0.06, 0.15, 4]} /><meshStandardMaterial color="#16a34a" /></mesh>))}
    </group>
  );
};

// Brontosaurus
const Brontosaurus = ({ position, scale, rotation, isWalking, isPetted }: { position: THREE.Vector3, scale: number, rotation: number, isWalking: boolean, isPetted: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const neckRef = useRef<THREE.Group>(null);
  const legsRef = useRef<THREE.Mesh[]>([]);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    if (!isWalking) groupRef.current.position.y = position.y + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
    if (neckRef.current) neckRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * (isPetted ? 0.15 : 0.08);
    if (isWalking) {
      legsRef.current.forEach((leg, i) => { if (leg) leg.rotation.x = Math.sin(state.clock.elapsedTime * 8 + i * Math.PI / 2) * 0.3; });
      groupRef.current.position.y = position.y + Math.abs(Math.sin(state.clock.elapsedTime * 8)) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]} scale={scale} rotation={[0, rotation, 0]}>
      <mesh><sphereGeometry args={[0.7, 16, 16]} /><meshStandardMaterial color="#3b82f6" /></mesh>
      <mesh position={[0, -0.2, 0.2]}><sphereGeometry args={[0.5, 16, 16]} /><meshStandardMaterial color="#93c5fd" /></mesh>
      <group ref={neckRef} position={[0, 0.4, 0.4]}>
        <mesh position={[0, 0.6, 0.2]} rotation={[-0.4, 0, 0]}><capsuleGeometry args={[0.18, 0.9, 8, 16]} /><meshStandardMaterial color="#3b82f6" /></mesh>
        <group position={[0, 1.2, 0.6]}>
          <mesh><sphereGeometry args={[0.22, 16, 16]} /><meshStandardMaterial color="#3b82f6" /></mesh>
          <mesh position={[-0.1, 0.08, 0.15]}><sphereGeometry args={[0.06, 16, 16]} /><meshStandardMaterial color="white" /></mesh>
          <mesh position={[-0.1, 0.08, 0.19]}><sphereGeometry args={[0.03, 16, 16]} /><meshStandardMaterial color="black" /></mesh>
          <mesh position={[0.1, 0.08, 0.15]}><sphereGeometry args={[0.06, 16, 16]} /><meshStandardMaterial color="white" /></mesh>
          <mesh position={[0.1, 0.08, 0.19]}><sphereGeometry args={[0.03, 16, 16]} /><meshStandardMaterial color="black" /></mesh>
          {isPetted && (<><mesh position={[-0.15, 0, 0.12]}><sphereGeometry args={[0.04, 16, 16]} /><meshStandardMaterial color="#ff6b9d" /></mesh><mesh position={[0.15, 0, 0.12]}><sphereGeometry args={[0.04, 16, 16]} /><meshStandardMaterial color="#ff6b9d" /></mesh></>)}
        </group>
      </group>
      {[[-0.35, -0.65, 0.2], [0.35, -0.65, 0.2], [-0.35, -0.65, -0.2], [0.35, -0.65, -0.2]].map((pos, i) => (
        <mesh key={i} ref={(el) => { if (el) legsRef.current[i] = el; }} position={pos as [number, number, number]}><capsuleGeometry args={[0.12, 0.4, 4, 8]} /><meshStandardMaterial color="#3b82f6" /></mesh>
      ))}
      <mesh position={[0, -0.1, -0.7]} rotation={[0.4, 0, 0]}><coneGeometry args={[0.18, 1.1, 8]} /><meshStandardMaterial color="#3b82f6" /></mesh>
    </group>
  );
};

// Triceratops
const Triceratops = ({ position, scale, rotation, isWalking, isPetted }: { position: THREE.Vector3, scale: number, rotation: number, isWalking: boolean, isPetted: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const legsRef = useRef<THREE.Mesh[]>([]);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    if (!isWalking) groupRef.current.position.y = position.y + Math.sin(state.clock.elapsedTime * 2) * 0.04;
    if (headRef.current) headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * (isPetted ? 8 : 2)) * (isPetted ? 0.15 : 0.08);
    if (isWalking) {
      legsRef.current.forEach((leg, i) => { if (leg) leg.rotation.x = Math.sin(state.clock.elapsedTime * 8 + i * Math.PI / 2) * 0.3; });
      groupRef.current.position.y = position.y + Math.abs(Math.sin(state.clock.elapsedTime * 8)) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]} scale={scale} rotation={[0, rotation, 0]}>
      <mesh><sphereGeometry args={[0.65, 16, 16]} /><meshStandardMaterial color="#f97316" /></mesh>
      <mesh position={[0, -0.15, 0.25]}><sphereGeometry args={[0.45, 16, 16]} /><meshStandardMaterial color="#fed7aa" /></mesh>
      <group ref={headRef} position={[0, 0.25, 0.55]}>
        <mesh><sphereGeometry args={[0.35, 16, 16]} /><meshStandardMaterial color="#f97316" /></mesh>
        <mesh position={[0, 0.25, -0.15]} rotation={[0.5, 0, 0]}><circleGeometry args={[0.4, 16]} /><meshStandardMaterial color="#ea580c" side={THREE.DoubleSide} /></mesh>
        <mesh position={[-0.2, 0.28, 0.15]} rotation={[-0.5, -0.3, 0]}><coneGeometry args={[0.05, 0.3, 8]} /><meshStandardMaterial color="#fef3c7" /></mesh>
        <mesh position={[0.2, 0.28, 0.15]} rotation={[-0.5, 0.3, 0]}><coneGeometry args={[0.05, 0.3, 8]} /><meshStandardMaterial color="#fef3c7" /></mesh>
        <mesh position={[0, 0, 0.32]} rotation={[-0.3, 0, 0]}><coneGeometry args={[0.04, 0.2, 8]} /><meshStandardMaterial color="#fef3c7" /></mesh>
        <mesh position={[-0.15, 0.08, 0.28]}><sphereGeometry args={[0.08, 16, 16]} /><meshStandardMaterial color="white" /></mesh>
        <mesh position={[-0.15, 0.08, 0.34]}><sphereGeometry args={[0.04, 16, 16]} /><meshStandardMaterial color="black" /></mesh>
        <mesh position={[0.15, 0.08, 0.28]}><sphereGeometry args={[0.08, 16, 16]} /><meshStandardMaterial color="white" /></mesh>
        <mesh position={[0.15, 0.08, 0.34]}><sphereGeometry args={[0.04, 16, 16]} /><meshStandardMaterial color="black" /></mesh>
        {isPetted && (<><mesh position={[-0.23, 0, 0.25]}><sphereGeometry args={[0.05, 16, 16]} /><meshStandardMaterial color="#ff6b9d" /></mesh><mesh position={[0.23, 0, 0.25]}><sphereGeometry args={[0.05, 16, 16]} /><meshStandardMaterial color="#ff6b9d" /></mesh></>)}
      </group>
      {[[-0.4, -0.6, 0.15], [0.4, -0.6, 0.15], [-0.3, -0.6, -0.25], [0.3, -0.6, -0.25]].map((pos, i) => (
        <mesh key={i} ref={(el) => { if (el) legsRef.current[i] = el; }} position={pos as [number, number, number]}><capsuleGeometry args={[0.11, 0.35, 4, 8]} /><meshStandardMaterial color="#f97316" /></mesh>
      ))}
      <mesh position={[0, -0.08, -0.7]} rotation={[0.25, 0, 0]}><coneGeometry args={[0.15, 0.65, 8]} /><meshStandardMaterial color="#f97316" /></mesh>
    </group>
  );
};

// Hand skeleton visualization
const HandSkeleton = ({ handLandmarks, transform, color = "#fbbf24" }: { handLandmarks: any[] | null, transform: (lm: any) => THREE.Vector3, color?: string }) => {
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
        <pointsMaterial size={0.12} color={color} transparent opacity={1} sizeAttenuation={true} />
      </points>
      <lineSegments ref={linesRef} geometry={linesGeometry}>
        <lineBasicMaterial color={color} linewidth={2} transparent opacity={0.9} />
      </lineSegments>
    </>
  );
};

// Second hand skeleton (different color)
const SecondHandSkeleton = ({ handLandmarks, transform }: { handLandmarks: any[] | null, transform: (lm: any) => THREE.Vector3 }) => {
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
    if (!handLandmarks || handLandmarks.length < 2) {
      if (pointsRef.current) pointsRef.current.visible = false;
      if (linesRef.current) linesRef.current.visible = false;
      return;
    }

    const hand = handLandmarks[1];
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
        <pointsMaterial size={0.12} color="#ec4899" transparent opacity={1} sizeAttenuation={true} />
      </points>
      <lineSegments ref={linesRef} geometry={linesGeometry}>
        <lineBasicMaterial color="#ec4899" linewidth={2} transparent opacity={0.9} />
      </lineSegments>
    </>
  );
};

// Main game scene
const GameScene = ({ 
  handLandmarksRef, 
  selectedDino,
  dinoPosition,
  setDinoPosition,
  dinoScale,
  setDinoScale,
  dinoRotation,
  setDinoRotation,
  isWalking,
  setIsWalking,
  isPetting,
  setIsPetting,
  currentGesture,
  setCurrentGesture
}: { 
  handLandmarksRef: React.MutableRefObject<any[]>,
  selectedDino: string,
  dinoPosition: THREE.Vector3,
  setDinoPosition: React.Dispatch<React.SetStateAction<THREE.Vector3>>,
  dinoScale: number,
  setDinoScale: React.Dispatch<React.SetStateAction<number>>,
  dinoRotation: number,
  setDinoRotation: React.Dispatch<React.SetStateAction<number>>,
  isWalking: boolean,
  setIsWalking: React.Dispatch<React.SetStateAction<boolean>>,
  isPetting: boolean,
  setIsPetting: React.Dispatch<React.SetStateAction<boolean>>,
  currentGesture: GestureType,
  setCurrentGesture: React.Dispatch<React.SetStateAction<GestureType>>
}) => {
  const { viewport } = useThree();
  const lastHand1Pos = useRef<THREE.Vector3 | null>(null);
  const lastHand2Pos = useRef<THREE.Vector3 | null>(null);
  const lastTwoHandDist = useRef<number>(0);
  const lastTwoHandAngle = useRef<number>(0);
  const walkTargetRef = useRef<THREE.Vector3 | null>(null);
  
  const transformLandmark = (lm: { x: number, y: number, z: number }) => {
    const mirroredX = 1 - lm.x;
    const wx = (mirroredX - 0.5) * viewport.width * 1.5;
    const wy = (0.5 - lm.y) * viewport.height * 1.5;
    return new THREE.Vector3(wx, wy, 0);
  };

  // Check if hand is making pinch gesture
  const isPinching = (hand: any[]) => {
    if (!hand || hand.length < 21) return false;
    const thumbTip = hand[4];
    const indexTip = hand[8];
    const dist = Math.sqrt(Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2));
    return dist < 0.08;
  };

  // Check if hand is open (all fingers extended) - for WALK
  const isHandOpen = (hand: any[]) => {
    if (!hand || hand.length < 21) return false;
    const wrist = hand[0];
    let extendedCount = 0;
    [[4, 2], [8, 6], [12, 10], [16, 14], [20, 18]].forEach(([tip, base]) => {
      const tipDist = Math.sqrt(Math.pow(hand[tip].x - wrist.x, 2) + Math.pow(hand[tip].y - wrist.y, 2));
      const baseDist = Math.sqrt(Math.pow(hand[base].x - wrist.x, 2) + Math.pow(hand[base].y - wrist.y, 2));
      if (tipDist > baseDist * 1.1) extendedCount++;
    });
    return extendedCount >= 4;
  };

  // Check if hand is fist (for PET)
  const isFist = (hand: any[]) => {
    if (!hand || hand.length < 21) return false;
    const wrist = hand[0];
    let closedCount = 0;
    [[8, 5], [12, 9], [16, 13], [20, 17]].forEach(([tip, base]) => {
      const tipDist = Math.sqrt(Math.pow(hand[tip].x - wrist.x, 2) + Math.pow(hand[tip].y - wrist.y, 2));
      const baseDist = Math.sqrt(Math.pow(hand[base].x - wrist.x, 2) + Math.pow(hand[base].y - wrist.y, 2));
      if (tipDist < baseDist * 1.2) closedCount++;
    });
    return closedCount >= 3;
  };

  // Get hand center position
  const getHandCenter = (hand: any[]) => {
    const wrist = hand[0];
    const middleBase = hand[9];
    return transformLandmark({
      x: (wrist.x + middleBase.x) / 2,
      y: (wrist.y + middleBase.y) / 2,
      z: 0
    });
  };

  // Get pinch point
  const getPinchPoint = (hand: any[]) => {
    return transformLandmark({
      x: (hand[4].x + hand[8].x) / 2,
      y: (hand[4].y + hand[8].y) / 2,
      z: 0
    });
  };

  useFrame(() => {
    const hands = handLandmarksRef.current;
    const numHands = hands?.length || 0;
    
    if (numHands === 0) {
      setCurrentGesture('none');
      setIsPetting(false);
      lastHand1Pos.current = null;
      lastHand2Pos.current = null;
      return;
    }

    const hand1 = hands[0];
    const hand2 = numHands >= 2 ? hands[1] : null;
    
    const hand1Pinching = isPinching(hand1);
    const hand2Pinching = hand2 ? isPinching(hand2) : false;
    const hand1Open = isHandOpen(hand1);
    const hand1Fist = isFist(hand1);
    
    const hand1Center = getHandCenter(hand1);
    const hand2Center = hand2 ? getHandCenter(hand2) : null;
    
    // ===== TWO HANDS GESTURES =====
    if (numHands >= 2 && hand1Pinching && hand2Pinching && hand2Center) {
      // Both hands pinching - check for SCALE or ROTATE
      const currentDist = hand1Center.distanceTo(hand2Center);
      const dy = hand1Center.y - hand2Center.y;
      const dx = hand1Center.x - hand2Center.x;
      const currentAngle = Math.atan2(dy, dx);
      
      if (lastHand1Pos.current && lastHand2Pos.current) {
        const distChange = currentDist - lastTwoHandDist.current;
        const angleChange = currentAngle - lastTwoHandAngle.current;
        
        // Determine if SCALE or ROTATE based on which changed more
        if (Math.abs(distChange) > 0.05) {
          // SCALE - hands moving apart/together
          setCurrentGesture('scale');
          setDinoScale(prev => Math.max(0.3, Math.min(3, prev + distChange * 0.3)));
          setIsWalking(false);
        } else if (Math.abs(angleChange) > 0.02) {
          // ROTATE - hands rotating like steering wheel
          setCurrentGesture('rotate');
          setDinoRotation(prev => prev + angleChange * 2);
          setIsWalking(false);
        }
      }
      
      lastTwoHandDist.current = currentDist;
      lastTwoHandAngle.current = currentAngle;
      lastHand1Pos.current = hand1Center.clone();
      lastHand2Pos.current = hand2Center.clone();
      setIsPetting(false);
      return;
    }
    
    // ===== SINGLE HAND GESTURES =====
    
    // WALK - Open palm pointing
    if (hand1Open && !hand1Pinching) {
      const indexTip = transformLandmark(hand1[8]);
      walkTargetRef.current = indexTip.clone();
      setCurrentGesture('walk');
      setIsWalking(true);
      
      // Move dino towards point
      const direction = walkTargetRef.current.clone().sub(dinoPosition);
      const distance = direction.length();
      if (distance > 0.2) {
        direction.normalize();
        setDinoPosition(prev => new THREE.Vector3(
          prev.x + direction.x * 0.08,
          prev.y + direction.y * 0.08,
          prev.z
        ));
        setDinoRotation(Math.atan2(direction.x, 1));
      } else {
        setIsWalking(false);
      }
      setIsPetting(false);
      lastHand1Pos.current = null;
      return;
    }
    
    // PET - Fist near dino
    if (hand1Fist) {
      const distToDino = hand1Center.distanceTo(dinoPosition);
      if (distToDino < 2.5) {
        setCurrentGesture('pet');
        setIsPetting(true);
        setIsWalking(false);
      } else {
        setIsPetting(false);
      }
      lastHand1Pos.current = null;
      return;
    }
    
    // DRAG - Single hand pinch
    if (hand1Pinching && !hand2Pinching) {
      const pinchPos = getPinchPoint(hand1);
      
      if (lastHand1Pos.current) {
        const delta = pinchPos.clone().sub(lastHand1Pos.current);
        setDinoPosition(prev => new THREE.Vector3(
          prev.x + delta.x,
          prev.y + delta.y,
          prev.z
        ));
        setCurrentGesture('drag');
      }
      
      lastHand1Pos.current = pinchPos.clone();
      setIsPetting(false);
      setIsWalking(false);
      return;
    }
    
    // No gesture detected
    setCurrentGesture('none');
    setIsPetting(false);
    setIsWalking(false);
    lastHand1Pos.current = null;
    lastHand2Pos.current = null;
  });

  const DinoComponent = selectedDino === 'bronto' ? Brontosaurus : selectedDino === 'trice' ? Triceratops : TRex;

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <pointLight position={[0, 3, 3]} color="#fff" intensity={0.5} />
      
      <DinoComponent 
        position={dinoPosition}
        scale={dinoScale}
        rotation={dinoRotation}
        isWalking={isWalking}
        isPetted={isPetting}
      />
      
      <HandSkeleton handLandmarks={handLandmarksRef.current} transform={transformLandmark} color="#fbbf24" />
      <SecondHandSkeleton handLandmarks={handLandmarksRef.current} transform={transformLandmark} />
      
      <EffectComposer>
        <Bloom luminanceThreshold={0.4} intensity={0.8} />
      </EffectComposer>
    </>
  );
};

// Main component
export const DinosaurGame: React.FC<DinosaurGameProps> = ({ onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isLoading, isReady, handLandmarksRef } = useFaceDetection(videoRef);
  const [dims, setDims] = useState({ width: 640, height: 480 });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedDino, setSelectedDino] = useState('trex');
  const [showSelector, setShowSelector] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<GestureType>('none');
  
  const [dinoPosition, setDinoPosition] = useState(new THREE.Vector3(-2, -0.5, 0));
  const [dinoScale, setDinoScale] = useState(1.2);
  const [dinoRotation, setDinoRotation] = useState(0.3);
  const [isWalking, setIsWalking] = useState(false);
  const [isPetting, setIsPetting] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play();
              setDims({ width: videoRef.current.videoWidth, height: videoRef.current.videoHeight });
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

  const currentDino = DINOSAUR_TYPES.find(d => d.id === selectedDino)!;
  const numHands = handLandmarksRef.current?.length || 0;

  const gestureInfo: Record<GestureType, { label: string, icon: string, color: string }> = {
    none: { label: 'Hareket Bekleniyor', icon: '👀', color: 'bg-gray-500' },
    drag: { label: 'SÜRÜKLEME', icon: '✋', color: 'bg-cyan-500' },
    rotate: { label: 'DÖNDÜRME', icon: '🔄', color: 'bg-pink-500' },
    scale: { label: 'BOYUTLANDIRMA', icon: '🔍', color: 'bg-yellow-500' },
    walk: { label: 'YÜRÜTME', icon: '🚶', color: 'bg-orange-500' },
    pet: { label: 'SEVİYORSUN!', icon: '❤️', color: 'bg-red-500' },
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-sky-300 to-green-300 overflow-hidden">
      <video ref={videoRef} className="absolute top-0 left-0 w-full h-full object-cover opacity-90 scale-x-[-1]" playsInline muted />

      {isReady && (
        <div className="absolute inset-0">
          <Canvas camera={{ position: [0, 0, 5], fov: 50 }} gl={{ alpha: true }}>
            <GameScene 
              handLandmarksRef={handLandmarksRef}
              selectedDino={selectedDino}
              dinoPosition={dinoPosition}
              setDinoPosition={setDinoPosition}
              dinoScale={dinoScale}
              setDinoScale={setDinoScale}
              dinoRotation={dinoRotation}
              setDinoRotation={setDinoRotation}
              isWalking={isWalking}
              setIsWalking={setIsWalking}
              isPetting={isPetting}
              setIsPetting={setIsPetting}
              currentGesture={currentGesture}
              setCurrentGesture={setCurrentGesture}
            />
          </Canvas>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none">
        {/* Top Bar */}
        <div className="flex justify-between items-start p-4">
          <button onClick={onBack} className="pointer-events-auto px-4 py-2 bg-white/90 backdrop-blur text-green-700 rounded-full font-bold shadow-lg hover:bg-white transition-all flex items-center gap-2">
            <span>←</span> MENÜ
          </button>
          <h1 className="text-3xl md:text-4xl font-black text-white drop-shadow-lg tracking-wide">🦖 DİNOZOR DÜNYASI 🦕</h1>
          <button onClick={() => setShowSelector(!showSelector)} className="pointer-events-auto px-4 py-2 bg-white/90 backdrop-blur text-purple-700 rounded-full font-bold shadow-lg hover:bg-white transition-all">
            {currentDino.emoji} {currentDino.name}
          </button>
        </div>

        {/* Gesture Instructions - Right Side */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-xl max-w-[200px]">
            <h3 className="font-bold text-purple-700 mb-3 text-center">El Hareketleri</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-cyan-100">
                <span className="text-xl">👌</span>
                <div><div className="font-bold text-cyan-700">Sürükle</div><div className="text-xs text-gray-600">Tek el - parmak birleştir</div></div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-100">
                <span className="text-xl">🤏🤏</span>
                <div><div className="font-bold text-yellow-700">Boyut</div><div className="text-xs text-gray-600">İki el - aç/kapat</div></div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-pink-100">
                <span className="text-xl">🔄</span>
                <div><div className="font-bold text-pink-700">Döndür</div><div className="text-xs text-gray-600">İki el - direksiyon çevir</div></div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-100">
                <span className="text-xl">🖐️</span>
                <div><div className="font-bold text-orange-700">Yürüt</div><div className="text-xs text-gray-600">Açık el - işaret et</div></div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-100">
                <span className="text-xl">✊</span>
                <div><div className="font-bold text-red-700">Sev</div><div className="text-xs text-gray-600">Yumruk - dinoya yaklaş</div></div>
              </div>
            </div>
          </div>
        </div>

        {/* Dino Selector */}
        {showSelector && (
          <div className="absolute top-16 right-4 pointer-events-auto">
            <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-xl">
              <h3 className="font-bold text-lg mb-3 text-center text-purple-700">Dinozor Seç</h3>
              <div className="space-y-2">
                {DINOSAUR_TYPES.map(dino => (
                  <button key={dino.id} onClick={() => { setSelectedDino(dino.id); setShowSelector(false); }}
                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${selectedDino === dino.id ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                    <span className="text-3xl">{dino.emoji}</span>
                    <div className="text-left"><div className="font-bold">{dino.name}</div><div className="text-sm opacity-80">{dino.description}</div></div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Current Gesture Indicator - Bottom Center */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <div className={`${gestureInfo[currentGesture].color} text-white px-8 py-4 rounded-2xl shadow-xl flex items-center gap-3 transition-all`}>
            <span className="text-3xl">{gestureInfo[currentGesture].icon}</span>
            <span className="font-bold text-xl">{gestureInfo[currentGesture].label}</span>
          </div>
        </div>

        {/* Hand Count Indicator */}
        <div className="absolute bottom-6 left-4">
          <div className={`px-4 py-2 rounded-full shadow-lg font-bold ${numHands >= 2 ? 'bg-purple-500' : numHands === 1 ? 'bg-green-500' : 'bg-red-400'} text-white`}>
            {numHands >= 2 ? '✋✋ 2 El Algılandı' : numHands === 1 ? '✋ 1 El Algılandı' : '👀 El Arıyorum...'}
          </div>
        </div>
      </div>

      {isLoading && !cameraError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-sky-300 to-green-300">
          <div className="flex flex-col items-center bg-white/90 rounded-3xl p-8 shadow-xl">
            <div className="text-6xl mb-4 animate-bounce">🦖</div>
            <h2 className="text-green-700 font-bold text-2xl mb-2">Dinozorlar Uyanıyor...</h2>
            <div className="w-48 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      )}

      {cameraError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-sky-300 to-green-300">
          <div className="bg-white rounded-3xl p-8 text-center shadow-xl max-w-md">
            <div className="text-6xl mb-4">😢</div>
            <h2 className="text-red-500 text-2xl font-bold mb-2">Kamera Açılamadı</h2>
            <p className="text-gray-600 mb-4">{cameraError}</p>
            <button onClick={onBack} className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full">Menüye Dön</button>
          </div>
        </div>
      )}
    </div>
  );
};
