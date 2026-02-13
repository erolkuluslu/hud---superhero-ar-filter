import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useFaceDetection } from '../hooks/useFaceDetection';

// ============================================================
// ⚙️ PERFORMANS AYARLARI (Bunu Değiştir)
// ============================================================
// TRUE: M4 Mac Air, RTX Ekran Kartlı PC'ler (Full Görsel Kalite)
// FALSE: Eski Mac Mini, Intel UHD Graphics, Eski Laptoplar (Maksimum FPS)
const HIGH_PERFORMANCE_MODE = false;

// Performans moduna göre segment sayıları (Geometry Complexity)
const SEGMENTS = HIGH_PERFORMANCE_MODE ? 32 : 12;
const SPHERE_SEGMENTS = HIGH_PERFORMANCE_MODE ? 32 : 16;

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
  snapRadius: number;
}> = {
  neptune: { name: 'Neptün', emoji: '🔵', color: '#3b82f6', position: [0, -2.3, 0], portalRadius: 1.1, snapRadius: 2.2 },
  mars: { name: 'Mars', emoji: '🔴', color: '#ef4444', position: [-2.5, -2.1, 0], portalRadius: 1.1, snapRadius: 2.2 },
  venus: { name: 'Venüs', emoji: '🟡', color: '#f59e0b', position: [2.5, -2.1, 0], portalRadius: 1.1, snapRadius: 2.2 },
};

const PLANET_TEXTURE_PATHS: Record<PlanetKey, string> = {
  mars: '/photos/mars.png',
  neptune: '/photos/neptun.png',
  venus: '/photos/venus.png',
};

const PLANET_ALIEN_COLORS: Record<PlanetKey, string[]> = {
  neptune: ['#3b82f6', '#06b6d4', '#0ea5e9', '#818cf8', '#a5b4fc'],
  mars: ['#ef4444', '#f97316', '#dc2626', '#fb923c', '#fca5a5'],
  venus: ['#f59e0b', '#fbbf24', '#fde047', '#f97316', '#fcd34d'],
};

// Per-planet science facts
const PLANET_FACTS: Record<PlanetKey, string[]> = {
  neptune: [
    'Neptün\'de rüzgarlar o kadar hızlıdır ki, Dünya\'daki en hızlı jet uçağını bile geçer! 💨',
    'Bilim insanları Neptün\'ün derinliklerinde gökyüzünden "elmas" yağdığını düşünüyor! 💎',
    'Neptün, Güneş\'e o kadar uzaktır ki orada öğlen vakti bile hava alacakaranlık gibidir. 🌑',
    'Neptün\'de bir yıl tam 165 Dünya yılı sürer; yani orada hiç kimse bir doğum günü bile kutlayamadı! 🎂',
    'Bu gezegen o kadar soğuktur ki, üzerinden geçen bir bulut anında buza dönüşür! 🥶',
    'Neptün, matematik kullanılarak keşfedilen tek gezegendir; teleskopla bakmadan önce kağıt üzerinde bulundu! 📐',
    'Triton adında yaramaz bir uydusu vardır ve diğer her şeyin tersine doğru döner! 🔄',
    'Neptün\'ün mavi rengi, atmosferindeki metan gazından gelir; tıpkı dev bir mavi bilye gibi! 🔵',
    'Dünya, Neptün\'ün içine tam 57 kez sığabilir; o gerçek bir dev! 🌍',
    'Neptün\'e bir mesaj atsan, ışık hızında bile gitse ulaşması 4 saat sürer! 📱',
    'Neptün\'ün halkaları vardır ama çok siliktir, onları görmek için çok güçlü gözlükler gerekir! 👓',
    'Güneş sisteminin en rüzgarlı gezegenidir, şapkanı tutsan iyi olur! 👒',
    'Neptün bir "Buz Devi"dir; gaz ve buz karışımından oluşan dev bir slushy (buzlu içecek) gibidir! 🥤',
    'Neptün\'de "Büyük Karanlık Nokta" denen dev bir fırtına vardı, içine tüm Dünya sığabilirdi! 🌀',
    'Oraya giden tek ziyaretçi Voyager 2 uzay aracıdır, o da sadece yanından geçip el salladı! 👋',
    'Neptün\'ün çekirdeği Dünya kadar büyüktür ama üzeri dev bir okyanus ve gazla kaplıdır. 🌊',
  ],
  mars: [
    'Mars "Kızıl Gezegen" olarak bilinir çünkü her yer paslanmış demir tozuyla kaplıdır! 🔴',
    'Mars\'ta yerçekimi azdır; orada zıplarsan Dünya\'dakinden 3 kat daha yükseğe çıkabilirsin! 🏀',
    'Güneş sisteminin en yüksek dağı Olimpos Dağı Mars\'tadır; Everest\'ten 3 kat daha büyüktür! 🏔️',
    'Mars\'ta gökyüzü gündüzleri pembe-kırmızı, gün batımında ise mavidir! (Bizimkinin tam tersi) 🌅',
    'Şu anda Mars yüzeyinde gezen ve fotoğraf çeken robot arabalar var! 🤖',
    'Mars\'ın iki tane yamuk yumuk uydusu vardır: Phobos ve Deimos. Patatese benzerler! 🥔',
    'Mars\'ta dev toz fırtınaları çıkar ve bazen tüm gezegeni sarıp aylarca sürebilir! 🌪️',
    'Eskiden Mars\'ta nehirler ve göller olduğu düşünülüyor, belki de içinde yaşam vardı! 💧',
    'Mars\'ta bir gün Dünya\'ya çok benzer; sadece 37 dakika daha uzundur. Ekstra oyun zamanı! ⏰',
    'Mars\'ın kutuplarında kışın karbondioksit donar, buna "Kuru Buz" denir. ❄️',
    'Gelecekte insanlar Mars\'ta yaşayabilir, belki de ilk giden sen olacaksın! 🚀',
    'Mars Dünya\'nın yarısı kadardır, yani bizim küçük kardeşimiz gibidir. 🌍',
    'Mars\'ta "Valles Marineris" adında dev bir kanyon vardır, Amerika\'yı baştan başa kaplayacak kadar uzundur! 🗺️',
    'Mars\'ta sesler Dünya\'dakinden farklı duyulur, atmosferi çok incedir. 👂',
    'Mars\'a gidiş roketle yaklaşık 7 ay sürer, uzun bir yolculuğa hazır mısın? 🎒',
    'Mars\'ın toprağı zehirli olabilir, bu yüzden orada tarım yapmak için özel seralar gerekecek! 🌱',
  ],
  venus: [
    'Venüs Güneş sisteminin en sıcak gezegenidir; bir pizza fırınından bile daha sıcaktır! 🔥',
    'Venüs diğer gezegenlerin aksine ters döner; orada Güneş batıdan doğar! ⬅️',
    'Venüs\'te bir gün, bir yıldan daha uzundur! Yani doğum günün her gün kutlanabilir! 🎂',
    'Venüs o kadar parlaktır ki, bazen gündüzleri bile gökyüzünde parlayan bir elmas gibi görünür. ✨',
    'Venüs\'ün atmosferi çok kalındır, yüzeyinde durmak denizin en dibinde durmak gibi hissettirir! 🏋️',
    'Venüs\'te yağmur asit olarak yağar, yani şemsiyen metal olsa bile eriyebilir! ☔',
    'Dünya ve Venüs boyut olarak neredeyse aynıdır, bu yüzden onlara "İkiz Gezegenler" denir. 👯',
    'Venüs\'e inen robotlar aşırı sıcak yüzünden sadece birkaç saat çalışabildi, sonra eridiler! 🫠',
    'Venüs\'te binlerce yanardağ vardır, bazıları hala püskürüyor olabilir! 🌋',
    'Kalın bulutları ısıyı içeri hapseder, buna "Sera Etkisi" denir; en iyi battaniyeden bile sıcak tutar! 🌡️',
    'Venüs\'ün hiç uydusu (ayı) yoktur, geceleri gökyüzünde yalnızdır. 🌑',
    'Venüs\'ün yüzeyini teleskopla göremezsin çünkü kalın bulutlar onu hep saklar. ☁️',
    'Adını aşk ve güzellik tanrıçasından almıştır ama aslında çok hırçın bir gezegendir! 💔',
    'Venüs\'te rüzgarlar bulutları gezegenin etrafında süper hızlı döndürür. 🌬️',
    'Eğer Venüs\'te yürüseydin, ayak izlerin hiç bozulmadan sonsuza kadar kalabilirdi (rüzgarın erişemediği yerlerde). 👣',
    'Sarı ve turuncu renkli bir gökyüzü vardır, Dünya gibi mavi değildir. 🧡',
  ],
};

const ALIEN_SIZES = {
  normal: { scale: 1.0, bodyRadius: 0.35, bodyHeight: 0.4, points: 150, grabRadius: 1.0 },
  small: { scale: 0.7, bodyRadius: 0.25, bodyHeight: 0.28, points: 300, grabRadius: 0.8 }
} as const;

const MIN_ALIEN_DISTANCE = 2.2;
const MIN_PORTAL_DISTANCE = 1.2;
const MAX_X_SPAWN = 2.3;
const MAX_Y_SPAWN = 2.2;
const MIN_Y_SPAWN = 0.3;

type AlienSize = keyof typeof ALIEN_SIZES;

// ============================================================
// ALIEN COMPONENT (Optimized)
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
      rejectProgress.current = Math.min(rejectProgress.current + delta * 3, 1);
      const bounce = Math.sin(rejectProgress.current * Math.PI) * 0.8;
      meshRef.current.position.y = basePosition.current.y + bounce;
      const squish = 1 + Math.sin(rejectProgress.current * Math.PI * 2) * 0.15;
      meshRef.current.scale.set(squish * 1.1, 1 / squish, squish * 1.1);
    } else {
      rejectProgress.current = 0;
      if (isGrabbed && grabbedPosition) {
        // Smooth lerp is better for performance than stiff movement
        meshRef.current.position.lerp(grabbedPosition, 0.5);
        meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 10) * 0.3;
        meshRef.current.scale.setScalar(1.3);
      } else {
        const targetY = basePosition.current.y + Math.sin(state.clock.elapsedTime * 2 + bobOffset) * 0.1;
        // Dampening for smoother movement on low FPS
        const dampSpeed = 5;
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
        <torusGeometry args={[sizeConfig.grabRadius, 0.03 * sizeConfig.scale, 4, SEGMENTS]} />
        <meshBasicMaterial
          color={isNearHand ? '#fbbf24' : planetColor}
          transparent
          opacity={isNearHand ? 1 : 0.4}
        />
      </mesh>

      {/* Body - Conditional Material */}
      <mesh>
        <capsuleGeometry args={[sizeConfig.bodyRadius, sizeConfig.bodyHeight, 4, 8]} />
        {HIGH_PERFORMANCE_MODE ? (
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={isGrabbed ? 1 : (isNearHand ? 0.6 : 0.3)}
          />
        ) : (
          <meshBasicMaterial color={color} />
        )}
      </mesh>

      {/* Planet dot indicator */}
      <mesh position={[0, 0.1 * sizeConfig.scale, sizeConfig.bodyRadius + 0.01]}>
        <circleGeometry args={[0.08 * sizeConfig.scale, 8]} />
        <meshBasicMaterial color={planetColor} side={THREE.DoubleSide} />
      </mesh>

      {/* Eyes - Low Poly */}
      <group>
        <mesh position={[-0.15 * sizeConfig.scale, 0.2 * sizeConfig.scale, 0.28 * sizeConfig.scale]}>
          <sphereGeometry args={[0.1 * sizeConfig.scale, 8, 8]} />
          <meshBasicMaterial color="white" />
        </mesh>
        <mesh position={[-0.15 * sizeConfig.scale, 0.2 * sizeConfig.scale, 0.36 * sizeConfig.scale]}>
          <sphereGeometry args={[0.05 * sizeConfig.scale, 8, 8]} />
          <meshBasicMaterial color="black" />
        </mesh>
        <mesh position={[0.15 * sizeConfig.scale, 0.2 * sizeConfig.scale, 0.28 * sizeConfig.scale]}>
          <sphereGeometry args={[0.1 * sizeConfig.scale, 8, 8]} />
          <meshBasicMaterial color="white" />
        </mesh>
        <mesh position={[0.15 * sizeConfig.scale, 0.2 * sizeConfig.scale, 0.36 * sizeConfig.scale]}>
          <sphereGeometry args={[0.05 * sizeConfig.scale, 8, 8]} />
          <meshBasicMaterial color="black" />
        </mesh>
      </group>

      {/* Antenna */}
      <mesh position={[0, 0.55 * sizeConfig.scale, 0]}>
        <cylinderGeometry args={[0.03 * sizeConfig.scale, 0.03 * sizeConfig.scale, 0.25 * sizeConfig.scale, 4]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.72 * sizeConfig.scale, 0]}>
        <sphereGeometry args={[0.07 * sizeConfig.scale, 8, 8]} />
        <meshBasicMaterial color={planetColor} />
      </mesh>

      {/* Lights only in High Perf Mode */}
      {HIGH_PERFORMANCE_MODE && isNearHand && !isGrabbed && (
        <pointLight position={[0, 0, 0]} color="#fbbf24" intensity={3} distance={2} />
      )}

      {isGrabbed && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5 * sizeConfig.scale, 0.6 * sizeConfig.scale, SEGMENTS]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
      )}

      {HIGH_PERFORMANCE_MODE && isGrabbed && (
        <pointLight position={[0, 0, 0]} color="#fbbf24" intensity={5 * sizeConfig.scale} distance={3 * sizeConfig.scale} />
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
        <capsuleGeometry args={[sizeConfig.bodyRadius, sizeConfig.bodyHeight, 4, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
};

// ============================================================
// PLANET PORTAL COMPONENT
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

  // Reduce particles on low perf
  const particleCount = HIGH_PERFORMANCE_MODE ? 16 : 6;

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
  }, [particleCount]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
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
      {/* Planet sphere */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[1.0, SPHERE_SEGMENTS, SPHERE_SEGMENTS]} />
        {HIGH_PERFORMANCE_MODE ? (
          <meshStandardMaterial
            map={texture}
            emissive={planet.color}
            emissiveIntensity={isNearHand ? 0.5 : 0.15}
          />
        ) : (
          <meshBasicMaterial map={texture} />
        )}
      </mesh>

      {/* Rings */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 6, 0, 0]}>
        <ringGeometry args={[1.1, 1.3, SEGMENTS]} />
        {HIGH_PERFORMANCE_MODE ? (
          <meshStandardMaterial
            color={planet.color}
            emissive={planet.color}
            emissiveIntensity={isNearHand ? 2.5 : 1.5}
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        ) : (
          <meshBasicMaterial color={planet.color} transparent opacity={0.6} side={THREE.DoubleSide} />
        )}
      </mesh>

      <mesh ref={ring2Ref} rotation={[Math.PI / 6, 0, 0]}>
        <ringGeometry args={[1.3, 1.5, SEGMENTS]} />
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

      {/* Beam */}
      <mesh ref={beamRef} position={[0, 3, 0]} visible={false}>
        <cylinderGeometry args={[0.1, 0.4, 6, 8, 1, true]} />
        <meshBasicMaterial color={planet.color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Text */}
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

      {/* Light only on High Perf */}
      {HIGH_PERFORMANCE_MODE && (
        <pointLight
          position={[0, 0, 0]}
          color={planet.color}
          intensity={isNearHand ? 8 : 4}
          distance={5}
        />
      )}

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
        <torusGeometry args={[1.2, 0.05, 4, 16]} />
        <meshBasicMaterial color={isPinching ? '#fbbf24' : '#00ff00'} transparent opacity={isPinching ? 1 : 0.6} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.8, 0.03, 4, 16]} />
        <meshBasicMaterial color={isPinching ? '#fbbf24' : '#00ff00'} transparent opacity={0.4} />
      </mesh>
      {/* Lights only High Perf */}
      {HIGH_PERFORMANCE_MODE && (
        <pointLight color={isPinching ? '#fbbf24' : '#00ff00'} intensity={isPinching ? 5 : 2} distance={3} />
      )}
    </group>
  );
};

// ============================================================
// ARENA
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
// GAME SCENE
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

  useEffect(() => {
    const initialAliens: typeof aliens = [];
    for (let i = 0; i < 4; i++) {
      initialAliens.push(spawnNewAlien(initialAliens));
    }
    setAliens(initialAliens);
  }, []);

  const transformLandmark = useCallback((lm: { x: number, y: number, z: number }) => {
    const mirroredX = 1 - lm.x;
    return new THREE.Vector3((mirroredX - 0.5) * 8, (0.5 - lm.y) * 5.5, 0);
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

      const rawDist = getPinchDist(hand);
      if (rawDist < 0.08) {
        pinchActiveRef.current = true;
        lastPinchTimeRef.current = now;
      } else if (rawDist > 0.13 && (now - lastPinchTimeRef.current) > 250) {
        pinchActiveRef.current = false;
      }
      const currentlyPinching = pinchActiveRef.current;

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

      if (!didAutoDeliver && !currentlyPinching && prevPinchRef.current && grabbedAlienId !== null) {
        setAliens(prev => prev.map(a => a.id === grabbedAlienId ? { ...a, grabbed: false } : a));
        setGrabbedAlienId(null);
      }

      prevPinchRef.current = currentlyPinching;
      setIsPinching(currentlyPinching);
    } else {
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

  const grabbedAlien = aliens.find(a => a.id === grabbedAlienId);
  const grabbedPlanet = grabbedAlien?.planet ?? null;

  return (
    <>
      {/* Lighting: Conditional */}
      {HIGH_PERFORMANCE_MODE ? (
        <>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={1} />
          <pointLight position={[0, 3, 0]} color="#22c55e" intensity={0.3} />
        </>
      ) : (
        <ambientLight intensity={1.5} /> // Brighter ambient for basic materials
      )}

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

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          // Force lower resolution on low perf machines to help AI
          video: {
            width: { ideal: HIGH_PERFORMANCE_MODE ? 1280 : 640 },
            height: { ideal: HIGH_PERFORMANCE_MODE ? 720 : 480 },
            facingMode: 'user'
          }
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
          <Canvas
            camera={{ position: [0, 0, 8], fov: 60 }}
            // PERFORMANCE: Limit pixel ratio on low perf devices to avoid huge GPU load
            dpr={HIGH_PERFORMANCE_MODE ? [1, 1.5] : [1, 1]}
            gl={{
              alpha: true,
              antialias: HIGH_PERFORMANCE_MODE, // Disable AA on low perf
              powerPreference: 'high-performance'
            }}
          >
            <GameScene
              handLandmarksRef={handLandmarksRef}
              setScore={setScore}
              gameActive={gameActive}
              showingFact={showingFact}
              onPlanetDelivery={handlePlanetDelivery}
              onWrongPortal={handleWrongPortal}
              planetDeliveryCounts={planetDeliveryCounts}
            />

            {/* PERFORMANCE: Only render post-processing effects on High Perf Mode */}
            {HIGH_PERFORMANCE_MODE && (
              <EffectComposer multisampling={0}>
                <Bloom luminanceThreshold={0.3} intensity={0.8} levels={3} />
                <Vignette offset={0.1} darkness={0.2} />
              </EffectComposer>
            )}
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

        {/* Planet Score Row */}
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

        {/* Space Narrative */}
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

        {/* Science fact popup */}
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
                🔬 Bilimsel Bilgi
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
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto"
            style={{ background: 'linear-gradient(135deg, rgba(0,0,20,0.92), rgba(10,0,40,0.92))' }}
          >
            <div className="w-full max-w-3xl mx-6 text-center">

              {timeLeft === 0 && (
                <div className="mb-6 animate-bounce">
                  <p className="text-2xl font-bold text-yellow-300">🏆 Harika İş!</p>
                  <p className="text-7xl font-black text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.8)]">{score}</p>
                  <p className="text-2xl text-yellow-200 font-bold tracking-widest">PUAN</p>
                </div>
              )}

              {timeLeft === 0 ? null : (
                <div className="mb-6">
                  <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.6)]">
                    🌌 PENÇE OYUNU
                  </p>
                  <p className="text-xl text-purple-300 mt-2 font-semibold">Uzaylıları evlerine gönder!</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { icon: '🖐️', title: 'ELİNİ GÖSTER', desc: 'Kameraya uzat' },
                  { icon: '👌', title: 'UZAYLI TUT', desc: 'Parmakları birleştir' },
                  { icon: '🪐', title: 'GEZEGENİNE GÖTÜR', desc: 'Aynı renge taşı' },
                ].map((step, i) => (
                  <div key={i} className="rounded-2xl p-5 border-2 flex flex-col items-center gap-2"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      borderColor: ['#22c55e', '#fbbf24', '#a855f7'][i],
                    }}
                  >
                    <span className="text-5xl">{step.icon}</span>
                    <p className="text-white font-black text-base leading-tight">{step.title}</p>
                    <p className="text-white/60 text-sm">{step.desc}</p>
                  </div>
                ))}
              </div>

              {handHoldProgress > 0 ? (
                <div className="flex flex-col items-center gap-3 mb-4">
                  <div className="relative w-24 h-24">
                    <svg className="transform -rotate-90 w-24 h-24">
                      <circle cx="48" cy="48" r="42" stroke="#22c55e" strokeWidth="5" fill="none" opacity="0.2" />
                      <circle
                        cx="48" cy="48" r="42" stroke="#22c55e" strokeWidth="5" fill="none"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - handHoldProgress / 100)}`}
                        className="transition-all duration-100"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-green-400 font-black text-3xl">{Math.ceil(3 - (handHoldProgress / 100) * 3)}</span>
                    </div>
                  </div>
                  <p className="text-green-300 text-lg font-bold animate-pulse">✋ Elinizi havada tutun…</p>
                </div>
              ) : (
                <div className="mb-4">
                  <p className="text-white/50 text-base">✋ Elinizi 3 saniye havada tutarak başlayabilirsiniz</p>
                </div>
              )}

              <button
                onClick={startGame}
                className="w-full py-6 text-3xl font-black rounded-2xl transition-all transform hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #16a34a, #059669)',
                  boxShadow: '0 0 40px rgba(34,197,94,0.6), 0 0 80px rgba(34,197,94,0.2)',
                }}
              >
                🚀 OYUNU BAŞLAT
              </button>

            </div>
          </div>
        )}

        {/* AI HUD Panel */}
        <div className="absolute bottom-6 left-6">
          <div className="bg-black/70 backdrop-blur border border-blue-500/40 px-4 py-3 rounded-lg min-w-40">
            <div className="text-blue-400 text-xs tracking-widest font-bold mb-2">🤖 YAPAY ZEKA AKTİF</div>
            <div className="text-blue-200 text-xs space-y-1">
              <div>📍 {handLandmarkCount} El Noktası</div>
              <div className={isHandDetected ? 'text-green-300' : 'text-red-400'}>
                {isHandDetected ? `✋ ${gestureText}` : '○ El Bekleniyor'}
              </div>
              {!HIGH_PERFORMANCE_MODE && (
                <div className="text-yellow-500 text-[10px] mt-1">⚠️ Düşük Performans Modu</div>
              )}
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