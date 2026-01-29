import React from 'react';
import { useThree } from '@react-three/fiber';
import { useARStore } from './store';
import * as THREE from 'three';

export const WebcamPlane: React.FC = () => {
  const { viewport } = useThree();
  const videoTexture = useARStore(state => state.videoTexture);

  if (!videoTexture) return null;

  return (
    <mesh position={[0, 0, -10]} scale={[-1, 1, 1]}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <meshBasicMaterial map={videoTexture} toneMapped={false} />
    </mesh>
  );
};

