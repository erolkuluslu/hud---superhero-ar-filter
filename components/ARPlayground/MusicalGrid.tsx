import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getLatestHands, remap } from './store';

const ROWS = 6;
const COLS = 10;
const COUNT = ROWS * COLS;

export const MusicalGrid: React.FC = () => {
  const { viewport } = useThree();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Grid Data
  const cubes = useMemo(() => {
    const temp = [];
    for (let i = 0; i < ROWS; i++) {
      for (let j = 0; j < COLS; j++) {
        temp.push({ 
          row: i, 
          col: j, 
          active: 0, // 0 to 1 intensity
          basePos: new THREE.Vector3(),
          freq: 200 + (i * COLS + j) * 10 // Simple frequency mapping
        });
      }
    }
    return temp;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = new THREE.Color();
  
  // Init Audio
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const playTone = (freq: number) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    const hands = getLatestHands();
    const handPositions: THREE.Vector3[] = [];
    
    // Collect all hand points (using index finger)
    hands.forEach(hand => {
        const indexTip = hand.landmarks[8];
        const x = remap(indexTip.x, 0, 1, -viewport.width / 2, viewport.width / 2);
        const y = remap(indexTip.y, 0, 1, viewport.height / 2, -viewport.height / 2);
        handPositions.push(new THREE.Vector3(x, y, 0));
    });

    // Update Cubes
    const widthStep = viewport.width / (COLS + 2);
    const heightStep = viewport.height / (ROWS + 2);

    cubes.forEach((cube, i) => {
      // Position calculation (centered grid)
      const x = (cube.col - COLS / 2 + 0.5) * widthStep;
      const y = (cube.row - ROWS / 2 + 0.5) * heightStep;
      cube.basePos.set(x, y, -2); // Slightly behind particles

      // Interaction Check
      let hit = false;
      handPositions.forEach(handPos => {
        if (handPos.distanceTo(cube.basePos) < widthStep * 0.8) {
          hit = true;
        }
      });

      // Trigger Logic
      if (hit && cube.active < 0.1) {
        playTone(cube.freq);
        cube.active = 1.0;
      }

      // Decay
      cube.active = THREE.MathUtils.lerp(cube.active, 0, delta * 5);

      // Render Update
      dummy.position.copy(cube.basePos);
      // Pulse scale on hit
      const scale = 0.5 + cube.active * 0.5;
      dummy.scale.setScalar(scale);
      
      dummy.rotation.x += delta;
      dummy.rotation.y += delta;
      dummy.updateMatrix();
      
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Color: Blue (idle) -> White/Pink (Active)
      color.setHSL(0.6 + cube.active * 0.4, 1, 0.5 + cube.active * 0.5);
      meshRef.current!.setColorAt(i, color);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial 
        toneMapped={false} 
        transparent 
        opacity={0.6}
        roughness={0.1}
        metalness={0.8}
      />
    </instancedMesh>
  );
};

