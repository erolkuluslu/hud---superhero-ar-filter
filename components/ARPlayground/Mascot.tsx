import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getLatestHands, remap } from './store';
import { easing } from 'maath';

export const Mascot: React.FC = () => {
  const { viewport } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  
  // Target vector for smooth lookAt
  const targetLook = useRef(new THREE.Vector3(0, 0, 5));

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const hands = getLatestHands();
    
    // Determine target to look at
    let target = new THREE.Vector3(0, 0, 5); // Default: Look at camera
    
    if (hands.length > 0) {
      // Look at the first hand
      const hand = hands[0];
      const wrist = hand.landmarks[0];
      const x = remap(wrist.x, 0, 1, -viewport.width / 2, viewport.width / 2);
      const y = remap(wrist.y, 0, 1, viewport.height / 2, -viewport.height / 2);
      target.set(x, y, 0);
    }
    
    // Smoothly interpolate targetLook vector
    easing.damp3(targetLook.current, target, 0.2, delta);
    
    // Make mascot look at target
    groupRef.current.lookAt(targetLook.current);
    
    // Float animation
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.2;
  });

  return (
    <group position={[0, 0, 0]}>
        <group ref={groupRef}>
            {/* Body */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <capsuleGeometry args={[0.5, 1, 4, 8]} />
                <meshStandardMaterial color="#00ffff" roughness={0.2} metalness={0.8} />
            </mesh>
            {/* Visor/Face */}
            <mesh position={[0, 0.2, 0.4]} ref={headRef}>
                <boxGeometry args={[0.6, 0.3, 0.2]} />
                <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={2} toneMapped={false} />
            </mesh>
        </group>
    </group>
  );
};

