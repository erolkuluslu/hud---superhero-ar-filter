import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { VisionManager } from './VisionManager';
import { WebcamPlane } from './WebcamPlane';
import { ParticleFlow } from './ParticleFlow';
import { MusicalGrid } from './MusicalGrid';
import { Mascot } from './Mascot';

interface ARPlaygroundProps {
  onBack: () => void;
}

export const ARPlayground: React.FC<ARPlaygroundProps> = ({ onBack }) => {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Non-Canvas UI Layer */}
      <div className="absolute top-0 left-0 z-50 p-6 w-full flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
          <button 
            onClick={onBack}
            className="px-6 py-2 bg-cyan-900/80 border border-cyan-500 text-cyan-100 font-bold rounded clip-path-polygon hover:bg-cyan-800 transition-colors"
            style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}
          >
            ← BACK TO BASE
          </button>
        </div>
        
        <div className="text-right">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
            JARVIS AR HUD
          </h1>
          <p className="text-cyan-300 font-mono text-xs tracking-widest mt-1">SYSTEM ONLINE // HAND TRACKING ACTIVE</p>
        </div>
      </div>

      {/* Vision Logic (No Render) */}
      <VisionManager />

      {/* 3D Scene */}
      <Canvas 
        camera={{ position: [0, 0, 10], fov: 50 }} 
        gl={{ alpha: false, antialias: false }} // Optimization: disable AA when using post-processing
        dpr={[1, 1.5]} // Performance optimization
      >
        <Suspense fallback={null}>
            <color attach="background" args={['#000']} />
            
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="cyan" />

            {/* The "Mirror World" Background */}
            <WebcamPlane />
            
            {/* Interactive Modules */}
            <group position={[0, 0, 0]}>
                <MusicalGrid />
                <ParticleFlow />
                <Mascot />
            </group>

            {/* Post Processing */}
            <EffectComposer disableNormalPass>
                <Bloom 
                    luminanceThreshold={0.5} 
                    mipmapBlur 
                    intensity={2.0} 
                    radius={0.6}
                />
            </EffectComposer>
        </Suspense>
      </Canvas>
      
      {/* Instructional Overlay */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center pointer-events-none">
         <div className="bg-black/50 backdrop-blur border border-cyan-500/30 p-4 rounded-xl">
            <p className="text-cyan-400 font-mono text-sm">
                RAISE HANDS TO INTERACT <br/>
                <span className="text-xs text-cyan-600">INDEX FINGER = PARTICLES // TOUCH CUBES = SOUND</span>
            </p>
         </div>
      </div>
    </div>
  );
};

