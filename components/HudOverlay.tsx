import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, Scanline, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';

extend({ Line2, LineMaterial, LineGeometry });

// Proxied components to avoid global JSX namespace shadowing issues
const Line = 'line2' as any;
const LineMat = 'lineMaterial' as any;
const LineGeo = 'lineGeometry' as any;

interface HudOverlayProps {
  landmarksRef: React.MutableRefObject<any[]>;
  faceBlendshapesRef: React.MutableRefObject<any[]>;
  handLandmarksRef: React.MutableRefObject<any[]>;
  videoWidth: number;
  videoHeight: number;
}

// Key landmark indices for specific facial features to draw cleaner lines
const FACE_OVAL_INDICES = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10
];

const LEFT_EYE_INDICES = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7, 33];
const RIGHT_EYE_INDICES = [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382, 362];

const LIPS_INDICES = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 61];

// Hand connections (finger chains)
const HAND_FINGER_INDICES = [
  [0, 1, 2, 3, 4], // Thumb
  [0, 5, 6, 7, 8], // Index
  [0, 9, 10, 11, 12], // Middle
  [0, 13, 14, 15, 16], // Ring
  [0, 17, 18, 19, 20], // Pinky
  [5, 9, 13, 17, 5]  // Palm
];

// Helper to calculate 3D distance
const getDistance = (p1: {x:number, y:number, z:number}, p2: {x:number, y:number, z:number}) => {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2) +
    Math.pow(p1.z - p2.z, 2)
  );
};

// Helper to get centroid of a set of landmarks
const getCentroid = (landmarks: any[], indices: number[], transform: (lm: any) => any) => {
  let sumX = 0, sumY = 0, sumZ = 0;
  indices.forEach(idx => {
    const lm = landmarks[idx];
    const world = transform(lm);
    sumX += world.x;
    sumY += world.y;
    sumZ += world.z;
  });
  const count = indices.length;
  return { x: sumX / count, y: sumY / count, z: sumZ / count };
};

// Helper to calculate face normal vector (where the face is pointing)
const getFaceNormal = (landmarks: any[], transform: (lm: any) => any) => {
    // 33: Left Eye Outer, 263: Right Eye Outer, 152: Chin
    const leftEye = transform(landmarks[33]);
    const rightEye = transform(landmarks[263]);
    const chin = transform(landmarks[152]);
    
    const vRight = new THREE.Vector3().subVectors(
        new THREE.Vector3(rightEye.x, rightEye.y, rightEye.z), 
        new THREE.Vector3(leftEye.x, leftEye.y, leftEye.z)
    );
    
    const vDown = new THREE.Vector3().subVectors(
        new THREE.Vector3(chin.x, chin.y, chin.z),
        new THREE.Vector3(leftEye.x, leftEye.y, leftEye.z)
    );
    
    // Cross product: Down x Right = Forward (Standard Right Hand Rule? No, we need to check coordinate system)
    // Our Z is negative into screen (transformed). 
    // vDown is roughly -Y, vRight is +X. 
    // (-Y) x (+X) = +Z (Out of screen towards camera).
    const normal = new THREE.Vector3().crossVectors(vDown, vRight).normalize();
    return normal;
};

// Calculate openness (0.0 to 1.0)
const getHandOpenness = (landmarks: any[]) => {
  const wrist = landmarks[0];
  // MCPs: 1(Thumb), 5(Index), 9(Middle), 13(Ring), 17(Pinky)
  // Tips: 4, 8, 12, 16, 20
  // PIPs: -, 6, 10, 14, 18 (Thumb uses IP: 3 vs MCP: 2)

  let extendedFingers = 0;

  // Thumb: Check if Tip(4) is further from wrist than IP(3)
  if (getDistance(landmarks[4], wrist) > getDistance(landmarks[3], wrist)) extendedFingers++;

  // Fingers: Check if Tip is further from wrist than PIP
  if (getDistance(landmarks[8], wrist) > getDistance(landmarks[6], wrist)) extendedFingers++;
  if (getDistance(landmarks[12], wrist) > getDistance(landmarks[10], wrist)) extendedFingers++;
  if (getDistance(landmarks[16], wrist) > getDistance(landmarks[14], wrist)) extendedFingers++;
  if (getDistance(landmarks[20], wrist) > getDistance(landmarks[18], wrist)) extendedFingers++;

  return extendedFingers / 5;
};

// --- Visual Components ---

const TechRing = ({ radius, speed, color, thickness = 0.02 }: { radius: number, speed: number, color: string, thickness?: number }) => {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.z += speed * delta;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={ref}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, thickness, 16, 100]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[Math.cos(i * Math.PI / 4) * radius, Math.sin(i * Math.PI / 4) * radius, 0]} rotation={[0, 0, i * Math.PI / 4]}>
          <boxGeometry args={[thickness * 4, thickness * 2, 0.01]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
};

const LaserBeam = React.forwardRef<THREE.Group>((_, ref) => {
  const internalRef = useRef<THREE.Group>(null);

  useFrame((state) => {
      if (internalRef.current) {
          // Subtle high-frequency pulse on thickness
          const pulse = 1 + Math.sin(state.clock.elapsedTime * 20) * 0.05;
          internalRef.current.scale.set(pulse, pulse, 1); 
      }
  });

  return (
      <group ref={ref} visible={false}>
           <group ref={internalRef}>
               {/* Core Beam - White Hot - Expanding Taper */}
               <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 5]}>
                  <cylinderGeometry args={[0.6, 0.02, 10, 16]} />
                  <meshBasicMaterial color="#ffffff" transparent opacity={1.0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
               </mesh>
               {/* Inner Glow - Cyan - Expanding Taper */}
               <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 5]}>
                  <cylinderGeometry args={[0.8, 0.04, 10, 16]} />
                  <meshBasicMaterial color="#00ffff" transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
               </mesh>
               {/* Outer Plasma - Deep Blue - Expanding Taper */}
               <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 5]}>
                  <cylinderGeometry args={[1.2, 0.08, 10, 16, 1, true]} />
                  <meshBasicMaterial color="#0066ff" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
               </mesh>
               {/* Source Flare */}
               <mesh position={[0,0,0]}>
                   <sphereGeometry args={[0.06, 16, 16]} />
                   <meshBasicMaterial color="#ffffff" transparent opacity={1.0} blending={THREE.AdditiveBlending} toneMapped={false} />
               </mesh>
               {/* Energy Ripple at source */}
               <mesh position={[0,0,0]} rotation={[0,0,0]}>
                    <ringGeometry args={[0.04, 0.12, 32]} />
                    <meshBasicMaterial color="#00ffff" transparent opacity={0.8} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} />
               </mesh>
           </group>
      </group>
  )
});

const EyeTarget = React.forwardRef<THREE.Group>((_, ref) => {
  return (
    <group ref={ref}>
       <TechRing radius={0.25} speed={1.5} color="#00f3ff" thickness={0.008} />
       <TechRing radius={0.15} speed={-2.0} color="#ffaa00" thickness={0.005} />
       <mesh position={[0, 0, 0.02]}>
          <ringGeometry args={[0.04, 0.05, 32]} />
          <meshBasicMaterial color="#ff0044" transparent opacity={0.8} />
       </mesh>
       <mesh rotation={[0,0,Math.PI/4]}>
         <planeGeometry args={[0.5, 0.005]} />
         <meshBasicMaterial color="#00f3ff" transparent opacity={0.3} />
       </mesh>
       <mesh rotation={[0,0,-Math.PI/4]}>
         <planeGeometry args={[0.5, 0.005]} />
         <meshBasicMaterial color="#00f3ff" transparent opacity={0.3} />
       </mesh>
    </group>
  );
});

const FaceLockHUD = React.forwardRef<THREE.Group>((_, ref) => {
    return (
        <group ref={ref}>
            {/* Face Brackets */}
            <group>
                <mesh position={[-0.9, 0, 0]}>
                    <planeGeometry args={[0.05, 1.2]} />
                    <meshBasicMaterial color="#00f3ff" transparent opacity={0.3} />
                </mesh>
                <mesh position={[-0.8, 0.6, 0]}>
                    <planeGeometry args={[0.25, 0.05]} />
                    <meshBasicMaterial color="#00f3ff" transparent opacity={0.3} />
                </mesh>
                 <mesh position={[-0.8, -0.6, 0]}>
                    <planeGeometry args={[0.25, 0.05]} />
                    <meshBasicMaterial color="#00f3ff" transparent opacity={0.3} />
                </mesh>
                 <mesh position={[0.9, 0, 0]}>
                    <planeGeometry args={[0.05, 1.2]} />
                    <meshBasicMaterial color="#00f3ff" transparent opacity={0.3} />
                </mesh>
                <mesh position={[0.8, 0.6, 0]}>
                    <planeGeometry args={[0.25, 0.05]} />
                    <meshBasicMaterial color="#00f3ff" transparent opacity={0.3} />
                </mesh>
                 <mesh position={[0.8, -0.6, 0]}>
                    <planeGeometry args={[0.25, 0.05]} />
                    <meshBasicMaterial color="#00f3ff" transparent opacity={0.3} />
                </mesh>
            </group>
            {/* Data Lines */}
            <group position={[0, -1.0, 0]}>
                <mesh>
                    <planeGeometry args={[1.2, 0.02]} />
                    <meshBasicMaterial color="#ffaa00" transparent opacity={0.5} />
                </mesh>
                 <mesh position={[0, -0.1, 0]}>
                    <planeGeometry args={[0.8, 0.01]} />
                    <meshBasicMaterial color="#ffaa00" transparent opacity={0.3} />
                </mesh>
                 {Array.from({length: 10}).map((_, i) => (
                     <mesh key={i} position={[(i - 4.5) * 0.1, -0.2, 0]}>
                         <planeGeometry args={[0.05, 0.1]} />
                         <meshBasicMaterial color="#00f3ff" transparent opacity={Math.random() * 0.5 + 0.2} />
                     </mesh>
                 ))}
            </group>
        </group>
    )
});

// A component to display fluctuating bars for blendshapes
const BiometricGraph = React.forwardRef<THREE.Group>((_, ref) => {
  const barsRef = useRef<THREE.Group>(null);
  
  // Random initial heights
  const initialHeights = useMemo(() => Array(8).fill(0).map(() => Math.random()), []);

  return (
    <group ref={ref}>
      {/* Vertical Bar Graph */}
      <group ref={barsRef} position={[0.7, 0.2, 0]}>
        <mesh position={[0.1, 0.6, 0]}>
           <planeGeometry args={[0.2, 0.02]} />
           <meshBasicMaterial color="#00f3ff" transparent opacity={0.8} />
        </mesh>
        {initialHeights.map((_, i) => (
          <mesh key={i} position={[i * 0.08, 0, 0]} name={`bar-${i}`}>
             <boxGeometry args={[0.04, 0.5, 0.01]} />
             <meshBasicMaterial color={i % 2 === 0 ? "#00f3ff" : "#ffaa00"} transparent opacity={0.6} />
          </mesh>
        ))}
        {/* Label placeholder */}
        <mesh position={[0.3, -0.35, 0]}>
           <planeGeometry args={[0.6, 0.02]} />
           <meshBasicMaterial color="#00f3ff" transparent opacity={0.5} />
        </mesh>
      </group>

      {/* Circular Graph (e.g. Audio/Voice) */}
      <group position={[-0.7, -0.4, 0]}>
         <mesh>
           <ringGeometry args={[0.2, 0.22, 32]} />
           <meshBasicMaterial color="#ffaa00" transparent opacity={0.5} />
         </mesh>
         <mesh name="voice-ring">
           <ringGeometry args={[0.1, 0.15, 32, 1, 0, Math.PI]} />
           <meshBasicMaterial color="#00f3ff" transparent opacity={0.8} side={THREE.DoubleSide} />
         </mesh>
      </group>
    </group>
  );
});

// A component that draws dashed lines connecting key points
const TacticalGrid = React.forwardRef<any>((_, ref) => {
    return (
        <group ref={ref}>
            {/* Left Cheek */}
            <Line>
                <LineGeo />
                <LineMat color={0x0044ff} linewidth={1} dashed dashScale={50} gapSize={1} opacity={0.3} transparent />
            </Line>
            {/* Right Cheek */}
             <Line>
                <LineGeo />
                <LineMat color={0x0044ff} linewidth={1} dashed dashScale={50} gapSize={1} opacity={0.3} transparent />
            </Line>
            {/* Forehead */}
             <Line>
                <LineGeo />
                <LineMat color={0x0044ff} linewidth={1} opacity={0.4} transparent />
            </Line>
        </group>
    )
});

// --- Logic Components ---

const useLandmarkTransformer = (videoWidth: number, videoHeight: number) => {
  const { size, viewport } = useThree();

  return (lm: { x: number, y: number, z: number }, depthScale = 5) => {
    const videoAspect = videoWidth / videoHeight;
    const canvasAspect = size.width / size.height;
    
    let renderWidth, renderHeight;
    if (canvasAspect > videoAspect) {
        renderWidth = size.width;
        renderHeight = size.width / videoAspect;
    } else {
        renderHeight = size.height;
        renderWidth = size.height * videoAspect;
    }

    const xOffset = (size.width - renderWidth) / 2;
    const yOffset = (size.height - renderHeight) / 2;

    const mirroredX = 1 - lm.x;
    const px = xOffset + mirroredX * renderWidth;
    const py = yOffset + lm.y * renderHeight;

    const ndcX = (px / size.width) * 2 - 1;
    const ndcY = -(py / size.height) * 2 + 1;

    const wx = ndcX * (viewport.width / 2);
    const wy = ndcY * (viewport.height / 2);
    const wz = -lm.z * depthScale; 

    return { x: wx, y: wy, z: wz };
  };
};

const HandTracker = ({ handLandmarksRef, videoWidth, videoHeight }: { handLandmarksRef: React.MutableRefObject<any[]>, videoWidth: number, videoHeight: number }) => {
  const transform = useLandmarkTransformer(videoWidth, videoHeight);
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<any[]>([]);
  const palmRingsRef = useRef<THREE.Group[]>([]);
  
  const MAX_PULSES = 30; 
  const pulseRefs = useRef<THREE.Group[]>([]);
  const pulseState = useRef<{active: boolean, life: number, handIndex: number}[]>(
     Array(MAX_PULSES).fill({ active: false, life: 0, handIndex: 0 })
  );
  const lastFireTime = useRef<number[]>([0, 0]);

  if (linesRef.current.length !== 2 * HAND_FINGER_INDICES.length) {
     linesRef.current = Array(12).fill(null).map(() => React.createRef()); 
  }

  const pointsGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 2 * 21;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  useFrame((state, delta) => {
    const hands = handLandmarksRef.current;
    const now = state.clock.elapsedTime;
    
    if (!hands || hands.length === 0) {
       if (pointsRef.current) pointsRef.current.visible = false;
       palmRingsRef.current.forEach(r => { if(r) r.visible = false; });
       linesRef.current.forEach(l => { if(l.current) l.current.visible = false; });
    } else {
      if (pointsRef.current) {
        pointsRef.current.visible = true;
        const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
        const colors = pointsRef.current.geometry.attributes.color.array as Float32Array;
        
        let ptIdx = 0;
        const baseColor = new THREE.Color("#ffaa00");
        const glowColor = new THREE.Color("#00ffff");
        
        hands.forEach((hand: any[], handIndex: number) => {
          const openness = getHandOpenness(hand);
          const intensity = openness; 
          const finalColor = baseColor.clone().lerp(glowColor, intensity * intensity);

          if (openness > 0.9 && (now - lastFireTime.current[handIndex] > 0.12)) {
              const availablePulseIdx = pulseState.current.findIndex(p => !p.active);
              if (availablePulseIdx !== -1 && pulseRefs.current[availablePulseIdx]) {
                  const wrist = transform(hand[0], 10);
                  const middleBase = transform(hand[9], 10);
                  const group = pulseRefs.current[availablePulseIdx];
                  group.position.set(wrist.x, wrist.y, wrist.z);
                  group.lookAt(middleBase.x, middleBase.y, middleBase.z);
                  // Initial scale - flat pancake
                  group.scale.set(0.05, 0.05, 0.05); 
                  group.visible = true;
                  pulseState.current[availablePulseIdx] = { active: true, life: 1.0, handIndex };
                  lastFireTime.current[handIndex] = now;
              }
          }

          hand.forEach(lm => {
            const world = transform(lm, 10);
            const i3 = ptIdx * 3;
            positions[i3] = world.x;
            positions[i3 + 1] = world.y;
            positions[i3 + 2] = world.z;
            colors[i3] = finalColor.r;
            colors[i3 + 1] = finalColor.g;
            colors[i3 + 2] = finalColor.b;
            ptIdx++;
          });

          HAND_FINGER_INDICES.forEach((indices, fingerIdx) => {
             const lineRefIndex = handIndex * HAND_FINGER_INDICES.length + fingerIdx;
             const lineRef = linesRef.current[lineRefIndex];
             if (lineRef && lineRef.current) {
               lineRef.current.visible = true;
               const linePositions: number[] = [];
               indices.forEach(idx => {
                  const lm = hand[idx];
                  const world = transform(lm, 10);
                  linePositions.push(world.x, world.y, world.z);
               });
               lineRef.current.geometry.setPositions(linePositions);
               if (lineRef.current.material) {
                   lineRef.current.material.color.set(finalColor);
                   lineRef.current.material.opacity = 0.3 + (intensity * 0.7);
                   lineRef.current.material.linewidth = 1.5 + (intensity * 3.5);
               }
             }
          });

          const wrist = transform(hand[0], 10);
          const midKnuckle = transform(hand[9], 10);
          if (palmRingsRef.current[handIndex]) {
             const ringGroup = palmRingsRef.current[handIndex];
             ringGroup.visible = true;
             ringGroup.position.set(wrist.x, wrist.y, wrist.z);
             ringGroup.lookAt(midKnuckle.x, midKnuckle.y, midKnuckle.z);
             const targetScale = 1 + intensity * 1.2;
             ringGroup.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
             ringGroup.traverse((child: any) => {
                 if (child.isMesh && child.material) {
                    if (child.material.color) child.material.color.lerp(finalColor, 0.2);
                    child.material.opacity = 0.2 + (intensity * 0.8);
                 }
             });
             ringGroup.rotation.z += 0.02 + (intensity * 0.2);
          }
        });

        if (hands.length < 2) {
           for (let i = HAND_FINGER_INDICES.length; i < linesRef.current.length; i++) {
              if (linesRef.current[i].current) linesRef.current[i].current.visible = false;
           }
           if (palmRingsRef.current[1]) palmRingsRef.current[1].visible = false;
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true;
        pointsRef.current.geometry.attributes.color.needsUpdate = true;
        pointsRef.current.geometry.setDrawRange(0, ptIdx);
      }
    }

    pulseState.current.forEach((state, idx) => {
        if (state.active) {
            const group = pulseRefs.current[idx];
            if (group) {
                const expansionSpeed = 15 * delta;
                // Expand diameter rapidly
                group.scale.x += expansionSpeed;
                group.scale.y += expansionSpeed;
                // Expand thickness slowly
                group.scale.z += expansionSpeed * 0.1;
                
                group.translateZ(6 * delta); 
                state.life -= delta * 1.8;

                // Fade children based on initialOpacity stored in userData
                group.children.forEach((child: any) => {
                     if (child.material) {
                         const baseOpacity = child.userData.initialOpacity || 1.0;
                         const fadeFactor = Math.pow(Math.max(0, state.life), 1.5); // Non-linear fade
                         child.material.opacity = baseOpacity * fadeFactor;
                     }
                });

                if (state.life <= 0) {
                    state.active = false;
                    group.visible = false;
                }
            }
        }
    });
  });

  return (
    <>
      {Array.from({ length: MAX_PULSES }).map((_, i) => (
          <group 
            key={`pulse-${i}`} 
            ref={(el) => { if(el) pulseRefs.current[i] = el }} 
            visible={false}
          >
             {/* Core Bright Ring */}
             <mesh userData={{ initialOpacity: 1.0 }}>
                <torusGeometry args={[0.1, 0.02, 16, 32]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={1.0} />
             </mesh>
             {/* Main Glow Ring */}
             <mesh userData={{ initialOpacity: 0.8 }}>
                 <torusGeometry args={[0.12, 0.06, 16, 32]} />
                 <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
             </mesh>
             {/* Outer Shockwave Halo */}
             <mesh userData={{ initialOpacity: 0.4 }}>
                 <torusGeometry args={[0.15, 0.12, 16, 32]} />
                 <meshBasicMaterial color="#0088ff" transparent opacity={0.4} />
             </mesh>
          </group>
      ))}
      <points ref={pointsRef} geometry={pointsGeometry}>
         <pointsMaterial size={0.05} vertexColors={true} transparent opacity={0.8} sizeAttenuation={true} depthWrite={false} />
      </points>
      {Array.from({ length: 12 }).map((_, i) => (
         <Line key={i} ref={linesRef.current[i]}>
            <LineGeo />
            <LineMat color={0xffaa00} linewidth={1.5} resolution={[videoWidth, videoHeight]} transparent opacity={0.5} depthTest={false} />
         </Line>
      ))}
      {[0, 1].map(i => (
        <group key={i} ref={(el) => { if (el) palmRingsRef.current[i] = el }}>
            <TechRing radius={0.15} speed={2} color="#ffaa00" thickness={0.01} />
            <mesh position={[0,0,0.05]}>
                <circleGeometry args={[0.08, 16]} />
                <meshBasicMaterial color="#ffaa00" transparent opacity={0.4} />
            </mesh>
            <mesh position={[0,0,0.1]} rotation={[Math.PI/2,0,0]}>
               <cylinderGeometry args={[0.01, 0.04, 0.3, 8]} />
               <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
            </mesh>
        </group>
      ))}
    </>
  );
};

const FaceTracker = ({ landmarksRef, faceBlendshapesRef, videoWidth, videoHeight }: { landmarksRef: React.MutableRefObject<any[]>, faceBlendshapesRef: React.MutableRefObject<any[]>, videoWidth: number, videoHeight: number }) => {
  const transform = useLandmarkTransformer(videoWidth, videoHeight);
  
  const pointsRef = useRef<THREE.Points>(null);
  const jawLineRef = useRef<any>(null); 
  const leftEyeLineRef = useRef<any>(null);
  const rightEyeLineRef = useRef<any>(null);
  const lipsLineRef = useRef<any>(null);
  
  const leftEyeGroupRef = useRef<THREE.Group>(null);
  const rightEyeGroupRef = useRef<THREE.Group>(null);
  const leftLaserRef = useRef<THREE.Group>(null);
  const rightLaserRef = useRef<THREE.Group>(null);

  const faceHudRef = useRef<THREE.Group>(null);
  const biometricRef = useRef<THREE.Group>(null);
  const tacticalGridRef = useRef<THREE.Group>(null);
  
  const laserIntensityRef = useRef<number>(0);

  const { size } = useThree();

  const pointsGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(478 * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const updateLineGeometry = (lineRef: any, indices: number[], landmarks: any[]) => {
    if (!lineRef.current || !landmarks) return;
    const positions: number[] = [];
    indices.forEach(idx => {
      const lm = landmarks[idx];
      if (lm) {
        const world = transform(lm);
        positions.push(world.x, world.y, world.z);
      }
    });
    if(positions.length > 0) {
      lineRef.current.geometry.setPositions(positions);
    }
  };

  useFrame((state, delta) => {
    const landmarks = landmarksRef.current;
    const blendshapes = faceBlendshapesRef.current;

    if (landmarks && landmarks.length > 0) {
      const face = landmarks[0];
      const shapes = blendshapes && blendshapes.length > 0 ? blendshapes[0].categories : [];
      
      // Helper to get shape value (0-1)
      const getShape = (name: string) => shapes.find((s: any) => s.categoryName === name)?.score || 0;

      const jawOpen = getShape('jawOpen');
      const blinkLeft = getShape('eyeBlinkLeft');
      const blinkRight = getShape('eyeBlinkRight');
      
      // Update Point Cloud
      if (pointsRef.current) {
        const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < face.length; i++) {
          const lm = face[i];
          const world = transform(lm);
          positions[i * 3] = world.x;
          positions[i * 3 + 1] = world.y;
          positions[i * 3 + 2] = world.z;
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Update Main Lines
      updateLineGeometry(jawLineRef, FACE_OVAL_INDICES, face);
      updateLineGeometry(leftEyeLineRef, LEFT_EYE_INDICES, face);
      updateLineGeometry(rightEyeLineRef, RIGHT_EYE_INDICES, face);
      updateLineGeometry(lipsLineRef, LIPS_INDICES, face);
      
      // Update Tactical Grid
      if (tacticalGridRef.current) {
          const children = tacticalGridRef.current.children;
          // Cheek 1
          if (children[0]) {
              const positions: number[] = [];
              [123, 116, 111, 117, 118, 101].forEach(idx => {
                 const p = transform(face[idx]);
                 positions.push(p.x, p.y, p.z);
              });
              // @ts-ignore
              if (children[0].geometry) children[0].geometry.setPositions(positions);
          }
           // Cheek 2
          if (children[1]) {
              const positions: number[] = [];
              [352, 345, 340, 346, 347, 330].forEach(idx => {
                 const p = transform(face[idx]);
                 positions.push(p.x, p.y, p.z);
              });
               // @ts-ignore
              if (children[1].geometry) children[1].geometry.setPositions(positions);
          }
          // Forehead
           if (children[2]) {
              const positions: number[] = [];
              [109, 10, 338].forEach(idx => {
                 const p = transform(face[idx]);
                 positions.push(p.x, p.y, p.z);
              });
               // @ts-ignore
              if (children[2].geometry) children[2].geometry.setPositions(positions);
          }
      }

      // Center Calculation
      const leftCenter = getCentroid(face, LEFT_EYE_INDICES, transform);
      const rightCenter = getCentroid(face, RIGHT_EYE_INDICES, transform);
      const nose = transform(face[1]);

      // Update Eye Reticles
      if (leftEyeGroupRef.current) {
        leftEyeGroupRef.current.position.set(leftCenter.x, leftCenter.y, leftCenter.z);
        leftEyeGroupRef.current.scale.y = 1 - blinkLeft * 0.8; 
      }
      if (rightEyeGroupRef.current) {
        rightEyeGroupRef.current.position.set(rightCenter.x, rightCenter.y, rightCenter.z);
        rightEyeGroupRef.current.scale.y = 1 - blinkRight * 0.8;
      }

      // --- Laser Eyes Logic ---
      // Calculate Eye Aspect Ratio to detect "Wide Open"
      const leftEyeHeight = getDistance(transform(face[159]), transform(face[145]));
      const leftEyeWidth = getDistance(transform(face[33]), transform(face[133]));
      const rightEyeHeight = getDistance(transform(face[386]), transform(face[374]));
      const rightEyeWidth = getDistance(transform(face[362]), transform(face[263]));

      // Thresholds for "Wide Open" (Tunable)
      // Reverted to 0.38 as requested
      const isLeftWide = (leftEyeHeight / leftEyeWidth) > 0.38;
      const isRightWide = (rightEyeHeight / rightEyeWidth) > 0.38;
      const isFiring = isLeftWide && isRightWide;

      // Smooth Laser Intensity
      const targetIntensity = isFiring ? 1.0 : 0.0;
      laserIntensityRef.current = THREE.MathUtils.lerp(laserIntensityRef.current, targetIntensity, 0.2);

      // Update Lasers
      if (laserIntensityRef.current > 0.01) {
          const faceNormal = getFaceNormal(face, transform);
          
          [leftLaserRef.current, rightLaserRef.current].forEach((laser, idx) => {
             if (laser) {
                 laser.visible = true;
                 const source = idx === 0 ? leftCenter : rightCenter;
                 laser.position.set(source.x, source.y, source.z);
                 
                 // Calculate target for this specific eye to ensure parallel beams
                 // Inverted to -10 to fix direction (shoot outwards)
                 const target = new THREE.Vector3(source.x, source.y, source.z)
                    .add(faceNormal.clone().multiplyScalar(-10));
                 
                 laser.lookAt(target);
                 
                 // Scale thickness based on intensity
                 const s = laserIntensityRef.current;
                 // Note: LaserBeam has an internal pulse that multiplies this scale
                 laser.scale.set(s, s, 1); 

                 // Fade opacity
                 laser.traverse((child: any) => {
                    if (child.isMesh && child.material) {
                        // Don't override opacity completely, multiply against originalOpacity if possible
                        // But MeshBasicMaterial opacity is simple. We trust the child opacity to be set in JSX
                        // and we modulate the group visibility/scale. 
                        // Or better: LaserBeam handles its own internal opacity.
                        // We just modulate visibility via scale/visible prop.
                        // However, fading out gracefully requires opacity modulation.
                        // We'll assume standard fade out.
                        // child.material.opacity = s * (child.userData.originalOpacity || 1.0);
                    }
                 });
             }
          });
      } else {
           if(leftLaserRef.current) leftLaserRef.current.visible = false;
           if(rightLaserRef.current) rightLaserRef.current.visible = false;
      }


      // Calculate Roll
      const dx = rightCenter.x - leftCenter.x;
      const dy = rightCenter.y - leftCenter.y;
      const angle = Math.atan2(dy, dx);

      // Face HUD Orientation
      if (faceHudRef.current) {
          faceHudRef.current.position.set(nose.x, nose.y, nose.z);
          faceHudRef.current.rotation.z = angle;
      }

      // Biometric Graph Updates
      if (biometricRef.current) {
          biometricRef.current.position.set(nose.x, nose.y, nose.z);
          biometricRef.current.rotation.z = angle;
          
          // Animate Bars
          const barGroup = biometricRef.current.children[0] as THREE.Group;
          if (barGroup) {
              barGroup.children.forEach((bar, i) => {
                 if (bar.name.startsWith('bar')) {
                     const targetScale = 0.2 + Math.random() * 0.5 + (jawOpen * 2); 
                     bar.scale.y = THREE.MathUtils.lerp(bar.scale.y, targetScale, 0.1);
                 }
              });
          }

          // Animate Voice Ring
          const ringGroup = biometricRef.current.children[1] as THREE.Group;
          if (ringGroup) {
              const ring = ringGroup.getObjectByName('voice-ring');
              if (ring) {
                  const s = 1 + jawOpen * 3;
                  ring.scale.set(s, s, s);
                  ring.rotation.z += 0.1;
              }
          }
      }
    }
  });

  const cyanColor = new THREE.Color("#00f3ff");

  return (
    <>
      <points ref={pointsRef} geometry={pointsGeometry}>
        <pointsMaterial size={0.02} color={cyanColor} transparent opacity={0.4} sizeAttenuation={true} />
      </points>

      <Line ref={jawLineRef}>
        <LineGeo />
        <LineMat color={cyanColor.getHex()} linewidth={2} resolution={[size.width, size.height]} transparent opacity={0.8} />
      </Line>
      <Line ref={leftEyeLineRef}>
        <LineGeo />
        <LineMat color={cyanColor.getHex()} linewidth={1.5} resolution={[size.width, size.height]} transparent opacity={0.8} />
      </Line>
      <Line ref={rightEyeLineRef}>
        <LineGeo />
        <LineMat color={cyanColor.getHex()} linewidth={1.5} resolution={[size.width, size.height]} transparent opacity={0.8} />
      </Line>
      <Line ref={lipsLineRef}>
         <LineGeo />
         <LineMat color={0xffaa00} linewidth={1} resolution={[size.width, size.height]} transparent opacity={0.6} />
      </Line>

      <TacticalGrid ref={tacticalGridRef} />
      
      <EyeTarget ref={leftEyeGroupRef} />
      <EyeTarget ref={rightEyeGroupRef} />

      <LaserBeam ref={leftLaserRef} />
      <LaserBeam ref={rightLaserRef} />
      
      <FaceLockHUD ref={faceHudRef} />
      <BiometricGraph ref={biometricRef} />
    </>
  );
};

export const HudOverlay: React.FC<HudOverlayProps> = (props) => {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      <FaceTracker {...props} />
      <HandTracker handLandmarksRef={props.handLandmarksRef} videoWidth={props.videoWidth} videoHeight={props.videoHeight} />
      
      <EffectComposer>
        <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} height={300} intensity={5.0} />
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
        <Scanline density={1.5} opacity={0.05} />
        <Noise opacity={0.05} />
      </EffectComposer>
    </Canvas>
  );
};