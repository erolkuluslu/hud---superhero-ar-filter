import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Text, Stats } from '@react-three/drei';
import * as THREE from 'three';
import { VisionManager } from './ARPlayground/VisionManager';
import { useARStore } from './ARPlayground/store';
import { NormalizedLandmark } from '@mediapipe/tasks-vision';

// --- AUDIO ENGINE (Web Audio API for Low Latency) ---
class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  constructor() {
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3; // Master volume
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.error("Audio Context not supported");
    }
  }

  playTone(frequency: number) {
    if (!this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine'; // Smooth sound
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

    // Envelope (Attack/Decay)
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 0.05); // Attack
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1); // Decay

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 1);
  }
}

const audio = new AudioEngine();

// --- CONFIGURATION ---
const KEY_CONFIG = [
  { note: 'C4', freq: 261.63, type: 'white', x: -3.5 },
  { note: 'D4', freq: 293.66, type: 'white', x: -2.5 },
  { note: 'E4', freq: 329.63, type: 'white', x: -1.5 },
  { note: 'F4', freq: 349.23, type: 'white', x: -0.5 },
  { note: 'G4', freq: 392.00, type: 'white', x: 0.5 },
  { note: 'A4', freq: 440.00, type: 'white', x: 1.5 },
  { note: 'B4', freq: 493.88, type: 'white', x: 2.5 },
  { note: 'C5', freq: 523.25, type: 'white', x: 3.5 },
  // Black Keys
  { note: 'C#4', freq: 277.18, type: 'black', x: -3 },
  { note: 'D#4', freq: 311.13, type: 'black', x: -2 },
  { note: 'F#4', freq: 369.99, type: 'black', x: 0 },
  { note: 'G#4', freq: 415.30, type: 'black', x: 1 },
  { note: 'A#4', freq: 466.16, type: 'black', x: 2 },
];

const COLLISION_THRESHOLD = 0.3; // Distance to trigger key
const DEBOUNCE_MS = 200; // Time between same note triggers

// --- COMPONENTS ---

const PianoKey = ({ config, isPressed }: { config: any, isPressed: boolean }) => {
  const isWhite = config.type === 'white';
  
  // Dimensions
  const width = isWhite ? 0.9 : 0.6;
  const height = isWhite ? 4 : 2.5;
  const depth = isWhite ? 0.5 : 0.6;
  const yPos = isWhite ? 0 : 0.8; // Black keys sit higher
  const zPos = isWhite ? 0 : 0.2; 

  // Visual feedback color
  const baseColor = isWhite ? '#ffffff' : '#111111';
  const activeColor = '#00ffff'; // Cyan glow

  return (
    <group position={[config.x, yPos - 2, zPos]}> {/* Shift down to bottom of screen */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial 
          color={isPressed ? activeColor : baseColor} 
          emissive={isPressed ? activeColor : '#000000'}
          emissiveIntensity={isPressed ? 1 : 0}
          transparent
          opacity={0.9}
          roughness={0.1}
          metalness={0.5}
        />
      </mesh>
      
      {/* Note Label */}
      {isWhite && (
        <Text 
          position={[0, 0.5, depth/2 + 0.1]} 
          fontSize={0.3} 
          color={isPressed ? activeColor : "black"}
          anchorY="bottom"
        >
          {config.note}
        </Text>
      )}
    </group>
  );
};

const FingerCursor = ({ position, color }: { position: THREE.Vector3 | null, color: string }) => {
  if (!position) return null;
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshBasicMaterial color={color} />
      <pointLight intensity={1} distance={2} color={color} />
    </mesh>
  );
};

const PianoScene = () => {
  const hands = useARStore((state) => state.hands);
  const { viewport } = useThree();
  const [activeKeys, setActiveKeys] = useState<{[key: string]: boolean}>({});
  const lastTriggerTime = useRef<{[key: string]: number}>({});

  // Helper: Landmark to World Position
  const getWorldPos = (landmark: NormalizedLandmark) => {
    const x = (landmark.x - 0.5) * -viewport.width;
    const y = -(landmark.y - 0.5) * viewport.height;
    return new THREE.Vector3(x, y, 0); // Z=0 interaction plane
  };

  useFrame(() => {
    if (!hands || hands.length === 0) return;

    const currentActiveKeys: {[key: string]: boolean} = {};
    const now = Date.now();

    // Iterate through all detected hands
    hands.forEach(hand => {
      // Points of interest: Index Tip (8) and Middle Tip (12)
      const fingers = [
        { id: 8, pos: getWorldPos(hand.landmarks[8]) },
        { id: 12, pos: getWorldPos(hand.landmarks[12]) }
      ];

      fingers.forEach(finger => {
        // Check collision with keys
        KEY_CONFIG.forEach(key => {
          // Key Position (approximated for logic)
          const isWhite = key.type === 'white';
          const keyY = isWhite ? 0 : 0.8; // Relative to shifted group
          const keyCenter = new THREE.Vector3(key.x, (isWhite ? 2 : 2.05) - 2, 0); // Adjusted for group shift
          
          // Collision logic (Simple distance or Box bounds)
          // Let's use simple distance on X axis + strict Y range
          const dx = Math.abs(finger.pos.x - keyCenter.x);
          const dy = finger.pos.y - keyCenter.y; // Relative Y
          
          const width = isWhite ? 0.9 : 0.6;
          const height = isWhite ? 4 : 2.5;
          
          // Check if finger is within key bounds
          const hitX = dx < width / 2;
          const hitY = Math.abs(dy) < height / 2;

          if (hitX && hitY) {
            // Trigger
            currentActiveKeys[key.note] = true;

            // Debounce Audio
            const lastTime = lastTriggerTime.current[key.note] || 0;
            if (now - lastTime > DEBOUNCE_MS && !activeKeys[key.note]) {
               audio.playTone(key.freq);
               lastTriggerTime.current[key.note] = now;
            }
          }
        });
      });
    });

    setActiveKeys(currentActiveKeys);
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight position={[0, 10, 10]} angle={0.3} penumbra={1} intensity={1} castShadow />
      
      {/* Piano Keys */}
      <group position={[0, -1, 0]}> {/* Center vertically */}
        {KEY_CONFIG.map((key) => (
          <PianoKey key={key.note} config={key} isPressed={!!activeKeys[key.note]} />
        ))}
      </group>

      {/* Visual Feedback for Fingers */}
      {hands.map((hand, i) => (
        <group key={i}>
           <FingerCursor position={getWorldPos(hand.landmarks[8])} color="#00ffff" />
           <FingerCursor position={getWorldPos(hand.landmarks[12])} color="#ff00ff" />
        </group>
      ))}
      
      {/* Performance Stats */}
      <Stats />
    </>
  );
};

const VideoPlane = () => {
    const videoTexture = useARStore(state => state.videoTexture);
    const { viewport } = useThree();
    if (!videoTexture) return null;
    return (
        <mesh position={[0, 0, -5]} scale={[-viewport.width, viewport.height, 1]}> 
            <planeGeometry />
            <meshBasicMaterial map={videoTexture} toneMapped={false} />
        </mesh>
    );
};

export const PianoGame = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      <VisionManager />
      
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-50 pointer-events-none">
        <button 
            onClick={onBack}
            className="pointer-events-auto px-6 py-3 bg-gray-900/80 backdrop-blur border border-white/20 text-white rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2"
        >
            ← MENÜ
        </button>
        
        <div className="bg-cyan-900/90 backdrop-blur border border-cyan-400/50 px-10 py-6 rounded-2xl animate-pulse shadow-lg text-center">
            <h2 className="text-3xl font-black text-cyan-300">🎹 SANAL PİYANO</h2>
            <p className="text-white mt-2">İşaret ve orta parmaklarını kullanarak çal!</p>
        </div>
      </div>

      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <VideoPlane />
        <PianoScene />
      </Canvas>
    </div>
  );
};
