import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getLatestHands, remap } from './store';

const PARTICLE_COUNT = 200;

export const ParticleFlow: React.FC = () => {
  const { viewport } = useThree();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Particle State
  const particles = useMemo(() => {
    return new Array(PARTICLE_COUNT).fill(0).map(() => ({
      position: new THREE.Vector3(0, -100, 0), // Start off-screen
      velocity: new THREE.Vector3(),
      life: 0,
      scale: 0
    }));
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = new THREE.Color();
  const indexRef = useRef(0); // Round-robin emitter

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    const hands = getLatestHands();
    let targetPos: THREE.Vector3 | null = null;

    // Find Index Finger Tip (Landmark 8) of the first hand
    if (hands.length > 0) {
      const hand = hands[0];
      const indexTip = hand.landmarks[8];
      
      // Map 2D -> 3D
      // MediaPipe x is 0..1 (left..right), but we mirror the video plane (-1 scale)
      // So we map 0..1 to -w/2 .. w/2 directly? 
      // Let's test: 
      // If user moves hand right (x -> 1), in mirrored video it looks like moving right.
      // But 3D space is not mirrored yet, only the plane mesh is scaled -1.
      // So if plane is x: -1, we should probably keep x as is?
      // Let's stick to standard mapping and rely on visual feedback to tweak.
      // Standard: 0 -> -w/2, 1 -> w/2.
      
      const x = remap(indexTip.x, 0, 1, -viewport.width / 2, viewport.width / 2);
      const y = remap(indexTip.y, 0, 1, viewport.height / 2, -viewport.height / 2);
      
      targetPos = new THREE.Vector3(x, y, 0);
    }

    // Emission
    if (targetPos) {
      // Emit 'emissionRate' particles per frame
      const emissionRate = 4; 
      for (let i = 0; i < emissionRate; i++) {
        const idx = (indexRef.current + i) % PARTICLE_COUNT;
        const p = particles[idx];
        
        p.position.copy(targetPos);
        
        // Add some randomness to velocity
        p.velocity.set(
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 2
        );
        p.life = 1.0; // 100% life
        p.scale = Math.random() * 0.5 + 0.2;
      }
      indexRef.current = (indexRef.current + emissionRate) % PARTICLE_COUNT;
    }

    // Update & Render
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      
      if (p.life > 0) {
        // Physics
        p.velocity.y -= 9.8 * delta * 0.5; // Gravity
        p.position.addScaledVector(p.velocity, delta);
        p.life -= delta * 1.5; // Decay
        p.scale *= 0.95; // Shrink
        
        // Update Instance Matrix
        dummy.position.copy(p.position);
        dummy.scale.setScalar(Math.max(0, p.scale));
        dummy.rotation.x += p.velocity.x * delta;
        dummy.rotation.y += p.velocity.y * delta;
        dummy.updateMatrix();
        
        meshRef.current.setMatrixAt(i, dummy.matrix);
        
        // Color gradient based on life (Cyan -> Magenta)
        // Cyan: #00FFFF, Magenta: #FF00FF
        color.setStyle(p.life > 0.5 ? '#00ffff' : '#ff00ff');
        meshRef.current.setColorAt(i, color);
      } else {
        // Hide dead particles
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <dodecahedronGeometry args={[0.2, 0]} />
      <meshStandardMaterial toneMapped={false} emissiveIntensity={2} />
    </instancedMesh>
  );
};

