import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useFaceDetection } from '../hooks/useFaceDetection';

interface MusicGameProps {
  onBack: () => void;
}

// Audio Context and Synth Setup
class MusicSynth {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: Map<string, OscillatorNode> = new Map();
  private lastDrumTime: { [key: string]: number } = {};
  private drumCooldown = 150; // ms between same drum hits

  init() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.audioContext.destination);
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // Melody synth (left hand)
  playMelody(frequency: number, volume: number) {
    if (!this.audioContext || !this.masterGain) return;
    
    const key = 'melody';
    let osc = this.oscillators.get(key);
    
    if (!osc) {
      osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(this.masterGain);
      gain.gain.value = 0;
      osc.start();
      this.oscillators.set(key, osc);
      (osc as any).gainNode = gain;
    }
    
    osc.frequency.setTargetAtTime(frequency, this.audioContext.currentTime, 0.05);
    (osc as any).gainNode.gain.setTargetAtTime(volume * 0.5, this.audioContext.currentTime, 0.05);
  }

  stopMelody() {
    const osc = this.oscillators.get('melody');
    if (osc && (osc as any).gainNode) {
      (osc as any).gainNode.gain.setTargetAtTime(0, this.audioContext!.currentTime, 0.1);
    }
  }

  // Bass synth (body movement)
  playBass(frequency: number) {
    if (!this.audioContext || !this.masterGain) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = frequency;
    gain.gain.value = 0.4;
    gain.gain.exponentialDecayTo = 0.01;
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    
    gain.gain.setTargetAtTime(0.01, this.audioContext.currentTime + 0.3, 0.1);
    osc.stop(this.audioContext.currentTime + 0.5);
  }

  // Drum sounds (right hand positions)
  playDrum(type: 'kick' | 'snare' | 'hihat' | 'clap') {
    if (!this.audioContext || !this.masterGain) return;
    
    const now = Date.now();
    if (this.lastDrumTime[type] && now - this.lastDrumTime[type] < this.drumCooldown) {
      return;
    }
    this.lastDrumTime[type] = now;

    const time = this.audioContext.currentTime;

    if (type === 'kick') {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(30, time + 0.15);
      gain.gain.setValueAtTime(1, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + 0.3);
    } else if (type === 'snare') {
      // Noise for snare
      const bufferSize = this.audioContext.sampleRate * 0.2;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.audioContext.createBufferSource();
      noise.buffer = buffer;
      
      const noiseGain = this.audioContext.createGain();
      noiseGain.gain.setValueAtTime(0.8, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
      
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1000;
      
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(time);
      noise.stop(time + 0.2);
    } else if (type === 'hihat') {
      const bufferSize = this.audioContext.sampleRate * 0.05;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.audioContext.createBufferSource();
      noise.buffer = buffer;
      
      const gain = this.audioContext.createGain();
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
      
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7000;
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start(time);
      noise.stop(time + 0.05);
    } else if (type === 'clap') {
      for (let i = 0; i < 3; i++) {
        const bufferSize = this.audioContext.sampleRate * 0.02;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let j = 0; j < bufferSize; j++) {
          data[j] = Math.random() * 2 - 1;
        }
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.5, time + i * 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.02 + 0.1);
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2500;
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(time + i * 0.02);
        noise.stop(time + i * 0.02 + 0.1);
      }
    }
  }

  // Arp sound (face expression)
  playArp(note: number) {
    if (!this.audioContext || !this.masterGain) return;
    
    const frequencies = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    const freq = frequencies[note % frequencies.length];
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.2);
  }

  // Pad sound (sustained, controlled by body tilt)
  playPad(frequency: number, pan: number) {
    if (!this.audioContext || !this.masterGain) return;
    
    const key = 'pad';
    let osc = this.oscillators.get(key);
    
    if (!osc) {
      osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const panner = this.audioContext.createStereoPanner();
      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.masterGain);
      gain.gain.value = 0;
      osc.start();
      this.oscillators.set(key, osc);
      (osc as any).gainNode = gain;
      (osc as any).panNode = panner;
    }
    
    osc.frequency.setTargetAtTime(frequency, this.audioContext.currentTime, 0.1);
    (osc as any).gainNode.gain.setTargetAtTime(0.15, this.audioContext.currentTime, 0.1);
    (osc as any).panNode.pan.setTargetAtTime(pan, this.audioContext.currentTime, 0.05);
  }

  stopPad() {
    const osc = this.oscillators.get('pad');
    if (osc && (osc as any).gainNode) {
      (osc as any).gainNode.gain.setTargetAtTime(0, this.audioContext!.currentTime, 0.3);
    }
  }
}

const synth = new MusicSynth();

// Visual feedback components
const SoundVisualizer = ({ 
  activeZones, 
  melodyFreq,
  volume,
  bodyTilt 
}: { 
  activeZones: Set<string>,
  melodyFreq: number,
  volume: number,
  bodyTilt: number
}) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Center beat visualizer */}
      <mesh position={[0, 0, -3]}>
        <ringGeometry args={[1.5, 1.8, 64]} />
        <meshBasicMaterial 
          color={activeZones.has('kick') ? '#ff4444' : '#333'} 
          transparent 
          opacity={0.7} 
        />
      </mesh>
      
      {/* Melody ring */}
      <mesh position={[0, 0, -3.1]} scale={[1 + volume * 0.5, 1 + volume * 0.5, 1]}>
        <ringGeometry args={[2, 2.2, 64]} />
        <meshBasicMaterial 
          color={`hsl(${(melodyFreq / 10) % 360}, 80%, 60%)`} 
          transparent 
          opacity={0.6} 
        />
      </mesh>
      
      {/* Drum indicators */}
      {['kick', 'snare', 'hihat', 'clap'].map((drum, i) => {
        const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle) * 3;
        const y = Math.sin(angle) * 3;
        const colors: { [key: string]: string } = {
          kick: '#ff4444',
          snare: '#44ff44',
          hihat: '#ffff44',
          clap: '#ff44ff'
        };
        return (
          <mesh key={drum} position={[x, y, -3]}>
            <circleGeometry args={[0.4, 32]} />
            <meshBasicMaterial 
              color={activeZones.has(drum) ? colors[drum] : '#222'} 
              transparent 
              opacity={activeZones.has(drum) ? 1 : 0.3} 
            />
          </mesh>
        );
      })}
      
      {/* Body tilt indicator */}
      <mesh position={[bodyTilt * 4, -2.5, -3]}>
        <boxGeometry args={[0.5, 0.2, 0.1]} />
        <meshBasicMaterial color="#00ffff" />
      </mesh>
    </group>
  );
};

// Hand skeleton visualization
const HandSkeleton = ({ landmarks, color }: { landmarks: any[], color: string }) => {
  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4], // thumb
    [0, 5], [5, 6], [6, 7], [7, 8], // index
    [5, 9], [9, 10], [10, 11], [11, 12], // middle
    [9, 13], [13, 14], [14, 15], [15, 16], // ring
    [13, 17], [17, 18], [18, 19], [19, 20], // pinky
    [0, 17] // palm
  ];

  const transformLandmark = (lm: any) => {
    const x = (lm.x - 0.5) * 10;
    const y = -(lm.y - 0.5) * 7;
    const z = -lm.z * 3 - 1;
    return new THREE.Vector3(x, y, z);
  };

  return (
    <group>
      {/* Joints */}
      {landmarks.map((lm, i) => {
        const pos = transformLandmark(lm);
        return (
          <mesh key={i} position={pos}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color={color} />
          </mesh>
        );
      })}
      {/* Connections */}
      {connections.map(([a, b], i) => {
        if (!landmarks[a] || !landmarks[b]) return null;
        const posA = transformLandmark(landmarks[a]);
        const posB = transformLandmark(landmarks[b]);
        const mid = posA.clone().add(posB).multiplyScalar(0.5);
        const length = posA.distanceTo(posB);
        const direction = posB.clone().sub(posA).normalize();
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        
        return (
          <mesh key={i} position={mid} quaternion={quaternion}>
            <cylinderGeometry args={[0.03, 0.03, length, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.7} />
          </mesh>
        );
      })}
    </group>
  );
};

// Zone visualization
const ZoneDisplay = () => {
  return (
    <group>
      {/* Left side - Melody zone */}
      <mesh position={[-4, 0, -5]}>
        <planeGeometry args={[3, 6]} />
        <meshBasicMaterial color="#4444ff" transparent opacity={0.1} />
      </mesh>
      
      {/* Right side - Drum zones */}
      <mesh position={[4, 2, -5]}>
        <planeGeometry args={[3, 2]} />
        <meshBasicMaterial color="#ff4444" transparent opacity={0.1} />
      </mesh>
      <mesh position={[4, 0, -5]}>
        <planeGeometry args={[3, 2]} />
        <meshBasicMaterial color="#44ff44" transparent opacity={0.1} />
      </mesh>
      <mesh position={[4, -2, -5]}>
        <planeGeometry args={[3, 2]} />
        <meshBasicMaterial color="#ffff44" transparent opacity={0.1} />
      </mesh>
    </group>
  );
};

// Pose skeleton for body
const PoseSkeleton = ({ pose }: { pose: any[] | null }) => {
  if (!pose || pose.length === 0) return null;

  const connections = [
    [11, 12], // shoulders
    [11, 13], [13, 15], // left arm
    [12, 14], [14, 16], // right arm
    [11, 23], [12, 24], // torso
    [23, 24], // hips
    [23, 25], [25, 27], // left leg
    [24, 26], [26, 28], // right leg
  ];

  const transformPose = (lm: any) => {
    const x = (lm.x - 0.5) * 12;
    const y = -(lm.y - 0.5) * 8;
    const z = -2;
    return new THREE.Vector3(x, y, z);
  };

  return (
    <group>
      {/* Key joints */}
      {[11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].map((idx) => {
        if (!pose[idx]) return null;
        const pos = transformPose(pose[idx]);
        return (
          <mesh key={idx} position={pos}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color="#00ffff" />
          </mesh>
        );
      })}
      {/* Connections */}
      {connections.map(([a, b], i) => {
        if (!pose[a] || !pose[b]) return null;
        const posA = transformPose(pose[a]);
        const posB = transformPose(pose[b]);
        const mid = posA.clone().add(posB).multiplyScalar(0.5);
        const length = posA.distanceTo(posB);
        const direction = posB.clone().sub(posA).normalize();
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        
        return (
          <mesh key={i} position={mid} quaternion={quaternion}>
            <cylinderGeometry args={[0.05, 0.05, length, 8]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.5} />
          </mesh>
        );
      })}
    </group>
  );
};

// Main game scene
const GameScene = ({
  handLandmarksRef,
  faceLandmarksRef,
  poseLandmarksRef,
  setActiveZones,
  setMelodyFreq,
  setVolume,
  setBodyTilt,
  activeZones,
  melodyFreq,
  volume,
  bodyTilt,
  isPlaying
}: {
  handLandmarksRef: React.MutableRefObject<any[]>,
  faceLandmarksRef: React.MutableRefObject<any[]>,
  poseLandmarksRef: React.MutableRefObject<any[]>,
  setActiveZones: React.Dispatch<React.SetStateAction<Set<string>>>,
  setMelodyFreq: React.Dispatch<React.SetStateAction<number>>,
  setVolume: React.Dispatch<React.SetStateAction<number>>,
  setBodyTilt: React.Dispatch<React.SetStateAction<number>>,
  activeZones: Set<string>,
  melodyFreq: number,
  volume: number,
  bodyTilt: number,
  isPlaying: boolean
}) => {
  const lastArpNote = useRef(0);
  const lastMouthState = useRef(false);

  useFrame((state) => {
    if (!isPlaying) return;

    const newActiveZones = new Set<string>();
    const hands = handLandmarksRef.current;
    const pose = poseLandmarksRef.current;
    const face = faceLandmarksRef.current;

    // Process hands
    if (hands && hands.length > 0) {
      hands.forEach((handLandmarks, handIndex) => {
        if (!handLandmarks || handLandmarks.length === 0) return;

        const wrist = handLandmarks[0];
        const indexTip = handLandmarks[8];
        
        // Determine hand position
        const handX = wrist.x;
        const handY = wrist.y;

        if (handX < 0.4) {
          // Left side - Melody control
          const freq = 130 + (1 - handY) * 700; // 130Hz to 830Hz
          const vol = 1 - handX / 0.4; // Volume based on how far left
          setMelodyFreq(freq);
          setVolume(vol);
          synth.playMelody(freq, vol);
          newActiveZones.add('melody');
        } else if (handX > 0.6) {
          // Right side - Drums
          synth.stopMelody();
          
          // Check for pinch (trigger drums)
          const thumbTip = handLandmarks[4];
          const pinchDist = Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) + 
            Math.pow(thumbTip.y - indexTip.y, 2)
          );
          
          if (pinchDist < 0.08) {
            // Determine which drum based on Y position
            if (handY < 0.3) {
              synth.playDrum('hihat');
              newActiveZones.add('hihat');
            } else if (handY < 0.5) {
              synth.playDrum('snare');
              newActiveZones.add('snare');
            } else if (handY < 0.7) {
              synth.playDrum('clap');
              newActiveZones.add('clap');
            } else {
              synth.playDrum('kick');
              newActiveZones.add('kick');
            }
          }
        } else {
          synth.stopMelody();
        }
      });
    } else {
      synth.stopMelody();
    }

    // Process pose (body)
    if (pose && pose.length > 0 && pose[0] && pose[0].length > 0) {
      const poseLandmarks = pose[0];
      const leftShoulder = poseLandmarks[11];
      const rightShoulder = poseLandmarks[12];
      const leftHip = poseLandmarks[23];
      const rightHip = poseLandmarks[24];

      if (leftShoulder && rightShoulder) {
        // Calculate body tilt
        const tilt = (leftShoulder.y - rightShoulder.y) * 5;
        setBodyTilt(tilt);
        
        // Pad sound based on tilt
        if (Math.abs(tilt) > 0.2) {
          const padFreq = 100 + Math.abs(tilt) * 100;
          synth.playPad(padFreq, tilt);
          newActiveZones.add('pad');
        } else {
          synth.stopPad();
        }

        // Check for jump (hips rise suddenly)
        if (leftHip && rightHip) {
          const hipY = (leftHip.y + rightHip.y) / 2;
          if (hipY < 0.4) {
            synth.playBass(55);
            newActiveZones.add('bass');
          }
        }
      }
    }

    // Process face
    if (face && face.length > 0 && face[0] && face[0].length > 0) {
      const faceLandmarks = face[0];
      
      // Check mouth open (landmarks 13 and 14 are upper and lower lip)
      if (faceLandmarks[13] && faceLandmarks[14]) {
        const mouthOpen = Math.abs(faceLandmarks[13].y - faceLandmarks[14].y) > 0.03;
        
        if (mouthOpen && !lastMouthState.current) {
          synth.playArp(lastArpNote.current);
          lastArpNote.current = (lastArpNote.current + 1) % 4;
          newActiveZones.add('arp');
        }
        lastMouthState.current = mouthOpen;
      }
    }

    setActiveZones(newActiveZones);
  });

  const hands = handLandmarksRef.current;
  const pose = poseLandmarksRef.current;

  return (
    <>
      <ambientLight intensity={0.5} />
      <ZoneDisplay />
      <SoundVisualizer 
        activeZones={activeZones} 
        melodyFreq={melodyFreq}
        volume={volume}
        bodyTilt={bodyTilt}
      />
      
      {/* Render hand skeletons */}
      {hands && hands.map((hand, i) => 
        hand && hand.length > 0 && (
          <HandSkeleton 
            key={i} 
            landmarks={hand} 
            color={i === 0 ? '#ffcc00' : '#ff66cc'} 
          />
        )
      )}
      
      {/* Render pose skeleton */}
      <PoseSkeleton pose={pose && pose[0]} />
    </>
  );
};

// Main component
export const MusicGame: React.FC<MusicGameProps> = ({ onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isLoading, isReady, handLandmarksRef, faceLandmarksRef, poseLandmarksRef } = useFaceDetection(videoRef);
  const [dims, setDims] = useState({ width: 640, height: 480 });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeZones, setActiveZones] = useState<Set<string>>(new Set());
  const [melodyFreq, setMelodyFreq] = useState(440);
  const [volume, setVolume] = useState(0);
  const [bodyTilt, setBodyTilt] = useState(0);

  // Start camera
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setDims({
              width: videoRef.current!.videoWidth,
              height: videoRef.current!.videoHeight
            });
          };
        }
      } catch (error) {
        setCameraError('Kamera erişimi reddedildi');
      }
    }
    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const handleStart = () => {
    synth.init();
    setIsPlaying(true);
  };

  const handleStop = () => {
    setIsPlaying(false);
  };

  if (cameraError) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{cameraError}</div>
          <button onClick={onBack} className="px-6 py-3 bg-blue-600 text-white rounded-lg">
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 overflow-hidden">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)', opacity: 0.4 }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-transparent to-blue-900/40" />

      {/* 3D Canvas */}
      <Canvas
        className="absolute inset-0"
        camera={{ position: [0, 0, 5], fov: 60 }}
        style={{ pointerEvents: 'none' }}
      >
        <GameScene
          handLandmarksRef={handLandmarksRef}
          faceLandmarksRef={faceLandmarksRef}
          poseLandmarksRef={poseLandmarksRef || { current: [] }}
          setActiveZones={setActiveZones}
          setMelodyFreq={setMelodyFreq}
          setVolume={setVolume}
          setBodyTilt={setBodyTilt}
          activeZones={activeZones}
          melodyFreq={melodyFreq}
          volume={volume}
          bodyTilt={bodyTilt}
          isPlaying={isPlaying}
        />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto">
          <button 
            onClick={onBack}
            className="px-4 py-2 bg-gray-800/80 backdrop-blur text-white rounded-lg border border-purple-500/30 hover:bg-gray-700/80 transition-colors"
          >
            ← Menü
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white tracking-wider" style={{ textShadow: '0 0 20px rgba(147, 51, 234, 0.8)' }}>
              🎵 MÜZİK STÜDİO 🎵
            </h1>
            <p className="text-purple-300 text-sm mt-1">Hareketlerinle Müzik Yarat!</p>
          </div>

          <div className="w-20"></div>
        </div>

        {/* Status Indicator */}
        {isLoading && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-purple-900/80 text-white px-4 py-2 rounded-full animate-pulse">
            Kamera Yükleniyor...
          </div>
        )}

        {/* Control Panel */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-auto">
          {!isPlaying ? (
            <button
              onClick={handleStart}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(168,85,247,0.5)]"
            >
              🎹 BAŞLA
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white text-xl font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(239,68,68,0.5)]"
            >
              ⏹️ DUR
            </button>
          )}
        </div>

        {/* Zone Labels */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-left">
          <div className={`px-4 py-2 rounded-lg mb-2 transition-all ${activeZones.has('melody') ? 'bg-blue-600/80 scale-110' : 'bg-blue-900/40'}`}>
            <div className="text-blue-200 text-xs">SOL EL</div>
            <div className="text-white font-bold">🎹 MELODİ</div>
            {activeZones.has('melody') && (
              <div className="text-blue-300 text-sm">{Math.round(melodyFreq)} Hz</div>
            )}
          </div>
          <div className={`px-4 py-2 rounded-lg mb-2 transition-all ${activeZones.has('pad') ? 'bg-cyan-600/80 scale-110' : 'bg-cyan-900/40'}`}>
            <div className="text-cyan-200 text-xs">VÜCUT EĞİM</div>
            <div className="text-white font-bold">🎸 PAD</div>
          </div>
          <div className={`px-4 py-2 rounded-lg transition-all ${activeZones.has('bass') ? 'bg-green-600/80 scale-110' : 'bg-green-900/40'}`}>
            <div className="text-green-200 text-xs">ZIPLAMA</div>
            <div className="text-white font-bold">🎸 BAS</div>
          </div>
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-right">
          <div className={`px-4 py-2 rounded-lg mb-2 transition-all ${activeZones.has('hihat') ? 'bg-yellow-600/80 scale-110' : 'bg-yellow-900/40'}`}>
            <div className="text-yellow-200 text-xs">ÜST</div>
            <div className="text-white font-bold">🥁 HI-HAT</div>
          </div>
          <div className={`px-4 py-2 rounded-lg mb-2 transition-all ${activeZones.has('snare') ? 'bg-green-600/80 scale-110' : 'bg-green-900/40'}`}>
            <div className="text-green-200 text-xs">ORTA-ÜST</div>
            <div className="text-white font-bold">🥁 TRAMPET</div>
          </div>
          <div className={`px-4 py-2 rounded-lg mb-2 transition-all ${activeZones.has('clap') ? 'bg-pink-600/80 scale-110' : 'bg-pink-900/40'}`}>
            <div className="text-pink-200 text-xs">ORTA-ALT</div>
            <div className="text-white font-bold">👏 ALKIŞ</div>
          </div>
          <div className={`px-4 py-2 rounded-lg transition-all ${activeZones.has('kick') ? 'bg-red-600/80 scale-110' : 'bg-red-900/40'}`}>
            <div className="text-red-200 text-xs">ALT</div>
            <div className="text-white font-bold">🥁 KİCK</div>
          </div>
        </div>

        {/* Face indicator */}
        <div className={`absolute top-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg transition-all ${activeZones.has('arp') ? 'bg-purple-600/80 scale-110' : 'bg-purple-900/40'}`}>
          <div className="text-purple-200 text-xs text-center">AĞIZ AÇ</div>
          <div className="text-white font-bold text-center">🎶 ARPEJ</div>
        </div>

        {/* Instructions Panel */}
        {!isPlaying && isReady && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur p-6 rounded-2xl border border-purple-500/30 max-w-lg">
            <h2 className="text-xl font-bold text-white mb-4 text-center">🎼 Nasıl Çalınır?</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-left">
                <div className="text-purple-400 font-bold">Sol El (Solda)</div>
                <div className="text-gray-300">Yukarı/aşağı = Nota yüksekliği</div>
                <div className="text-gray-300">Sola/sağa = Ses şiddeti</div>
              </div>
              <div className="text-left">
                <div className="text-purple-400 font-bold">Sağ El (Sağda)</div>
                <div className="text-gray-300">Parmak kıstır = Davul çal</div>
                <div className="text-gray-300">Konum = Farklı davul</div>
              </div>
              <div className="text-left">
                <div className="text-purple-400 font-bold">Vücut</div>
                <div className="text-gray-300">Sağa/sola eğil = Pad sesi</div>
                <div className="text-gray-300">Zıpla = Bas vuruşu</div>
              </div>
              <div className="text-left">
                <div className="text-purple-400 font-bold">Yüz</div>
                <div className="text-gray-300">Ağzını aç = Arpej çal</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicGame;

