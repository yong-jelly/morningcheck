import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  Float, 
  Environment,
  PresentationControls,
  Html,
  Sphere,
  MeshDistortMaterial
} from "@react-three/drei";
import * as THREE from "three";
import { DOT_PATTERNS } from "@/shared/ui/DotMatrixNumber";

// 확장된 컨디션 이모지 데이터
const CONDITION_DATA = [
  { emoji: "🚀", color: "#2FB06B" },
  { emoji: "✨", color: "#2FB06B" },
  { emoji: "🔥", color: "#2FB06B" },
  { emoji: "💪", color: "#2FB06B" },
  { emoji: "😎", color: "#4f46e5" },
  { emoji: "😊", color: "#4f46e5" },
  { emoji: "⚡", color: "#4f46e5" },
  { emoji: "🍀", color: "#4f46e5" },
  { emoji: "😐", color: "#f97316" },
  { emoji: "😴", color: "#f97316" },
  { emoji: "🌊", color: "#f97316" },
  { emoji: "🧘", color: "#f97316" },
];

// 동적으로 숫자가 매우 빠르게 변하는 3D 도트 매트릭스 숫자
function MatrixDigit({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  const [value, setValue] = useState(() => Math.floor(Math.random() * 10));
  
  // 숫자가 매우 빠르게 변경됨
  useEffect(() => {
    const interval = setInterval(() => {
      setValue(prev => (prev + 1) % 10);
    }, 150 + Math.random() * 300);
    return () => clearInterval(interval);
  }, []);

  const pattern = DOT_PATTERNS[value] || DOT_PATTERNS[0];
  
  // 모든 35개 도트를 생성하되, 활성 상태를 추적
  const allDots = useMemo(() => {
    const dots: { x: number, y: number, active: boolean }[] = [];
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 5; x++) {
        dots.push({ x, y, active: pattern[y][x] === 1 });
      }
    }
    return dots;
  }, [value, pattern]);

  // 컬러가 매우 자주, 랜덤하게 변경됨
  const colorRef = useRef(new THREE.Color());
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const hue = (t * 0.5 + position[0] * 0.5) % 1;
    colorRef.current.setHSL(hue, 0.9, 0.5);
  });

  return (
    <group position={position} scale={scale}>
      {allDots.map((dot, i) => (
        <mesh key={i} position={[dot.x * 0.15 - 0.3, (6 - dot.y) * 0.15 - 0.45, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.05]} />
          <meshStandardMaterial 
            color={colorRef.current} 
            emissive={colorRef.current} 
            emissiveIntensity={dot.active ? 1.5 : 0.2} 
            transparent 
            opacity={dot.active ? 0.9 : 0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

function SignalBeam({ position, height = 20 }: { position: [number, number, number], height?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const colorRef = useRef(new THREE.Color());
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      const hue = (t * 0.2 + position[0] * 0.1) % 1;
      colorRef.current.setHSL(hue, 0.8, 0.6);
      const material = ref.current.material as THREE.MeshStandardMaterial;
      material.color.copy(colorRef.current);
      material.emissive.copy(colorRef.current);
      material.opacity = 0.05 + Math.sin(t * 4 + position[0]) * 0.04;
    }
  });

  return (
    <mesh position={position} ref={ref}>
      <cylinderGeometry args={[0.015, 0.015, height, 8]} />
      <meshStandardMaterial transparent opacity={0.1} emissiveIntensity={0.5} />
    </mesh>
  );
}

function FloatingElement({ data, position, speed }: { data: any, position: [number, number, number], speed: number }) {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y -= 0.01 * speed;
      if (ref.current.position.y < -7) {
        ref.current.position.y = 7;
        ref.current.position.x = (Math.random() - 0.5) * 15;
      }
      ref.current.rotation.y += 0.01;
      ref.current.position.x += Math.sin(state.clock.getElapsedTime() * speed * 0.5) * 0.01;
    }
  });

  return (
    <group ref={ref} position={position}>
      {data.type === "digit" ? (
        <MatrixDigit 
          position={[0, 0, 0]} 
          scale={0.5 + Math.random() * 0.2}
        />
      ) : (
        <Html center transform distanceFactor={10}>
          <div className="text-4xl select-none filter drop-shadow-sm" style={{ opacity: 0.8 }}>
            {data.emoji}
          </div>
        </Html>
      )}
    </group>
  );
}

function FloatingDataStream() {
  const elements = useMemo(() => {
    return Array.from({ length: 45 }).map(() => {
      const isEmoji = Math.random() > 0.4;
      if (isEmoji) {
        const item = CONDITION_DATA[Math.floor(Math.random() * CONDITION_DATA.length)];
        return {
          type: "emoji",
          emoji: item.emoji,
          position: [(Math.random() - 0.5) * 15, (Math.random() * 14) - 7, (Math.random() - 0.5) * 10] as [number, number, number],
          speed: 0.2 + Math.random() * 0.5
        };
      } else {
        return {
          type: "digit",
          position: [(Math.random() - 0.5) * 15, (Math.random() * 14) - 7, (Math.random() - 0.5) * 10] as [number, number, number],
          speed: 0.3 + Math.random() * 0.7
        };
      }
    });
  }, []);

  return (
    <group>
      {elements.map((el, index) => (
        <FloatingElement key={index} data={el} position={el.position} speed={el.speed} />
      ))}
    </group>
  );
}

// 분리될 것 같은 불안정한 코어
function SignalCore() {
  const coreRef = useRef<THREE.Mesh>(null);
  const subCoreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const colorRef = useRef(new THREE.Color());
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // 강하고 빠른 그라데이션 컬러 루프
    const hue = (t * 0.3) % 1;
    colorRef.current.setHSL(hue, 0.9, 0.5);
    
    // 코어 변형 및 진동 (통통 튀는 탄성)
    const bounce = Math.sin(t * 10) * 0.05 + Math.sin(t * 23) * 0.02;
    
    if (coreRef.current) {
      coreRef.current.position.set(
        Math.sin(t * 15) * 0.05,
        Math.cos(t * 12) * 0.05,
        Math.sin(t * 10) * 0.05
      );
      coreRef.current.scale.set(1 + bounce, 1 - bounce, 1 + bounce * 0.5);
      const material = coreRef.current.material as THREE.MeshStandardMaterial;
      material.color.copy(colorRef.current);
      material.emissive.copy(colorRef.current);
      material.emissiveIntensity = 1 + Math.sin(t * 5) * 0.5;
    }

    // 분리될 것 같은 보조 코어 (Jittering sub-core)
    if (subCoreRef.current) {
      // 본체에서 멀어졌다 가까워졌다 하며 분리될 것 같은 느낌
      const dist = 0.1 + Math.sin(t * 8) * 0.2;
      subCoreRef.current.position.set(
        Math.cos(t * 15) * dist,
        Math.sin(t * 18) * dist,
        Math.cos(t * 12) * dist
      );
      subCoreRef.current.scale.set(0.4 + bounce, 0.4 - bounce, 0.4);
      const material = subCoreRef.current.material as THREE.MeshStandardMaterial;
      const subColor = new THREE.Color().setHSL((hue + 0.3) % 1, 0.9, 0.6);
      material.color.copy(subColor);
      material.emissive.copy(subColor);
    }
    
    if (ringRef.current) {
      ringRef.current.rotation.y = -t * 2;
      ringRef.current.rotation.x = Math.sin(t * 5) * 0.5;
      const material = ringRef.current.material as THREE.MeshStandardMaterial;
      material.color.copy(colorRef.current);
      material.emissive.copy(colorRef.current);
      material.opacity = 0.3 + Math.sin(t * 10) * 0.2;
    }
  });

  const beams = useMemo(() => {
    return Array.from({ length: 15 }).map(() => ({
      position: [(Math.random() - 0.5) * 10, 0, (Math.random() - 0.5) * 10] as [number, number, number],
    }));
  }, []);

  return (
    <group>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        {/* 중앙 메인 코어 (Distorted) */}
        <Sphere ref={coreRef} args={[0.7, 64, 64]}>
          <MeshDistortMaterial 
            speed={5} 
            distort={0.4} 
            radius={0.7}
            metalness={0.9}
            roughness={0.1}
          />
        </Sphere>
        
        {/* 분리될 것 같은 서브 코어 */}
        <Sphere ref={subCoreRef} args={[0.3, 32, 32]}>
          <meshStandardMaterial 
            metalness={0.9}
            roughness={0.1}
            transparent
            opacity={0.8}
          />
        </Sphere>
        
        {/* 불안정하게 회전하는 링 */}
        <mesh ref={ringRef}>
          <torusGeometry args={[1.4, 0.02, 16, 100]} />
          <meshStandardMaterial transparent opacity={0.6} />
        </mesh>
      </Float>

      {/* 수직 시그널 빔들 */}
      {beams.map((beam, index) => (
        <SignalBeam key={index} position={beam.position} />
      ))}
      
      {/* 바닥 그리드 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6, 0]}>
        <gridHelper args={[24, 24, "#f0f0f0", "#fafafa"]} />
      </mesh>
    </group>
  );
}

export function OnboardingScene() {
  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ position: [0, 3, 14], fov: 35 }} dpr={[1, 2]}>
        <color attach="background" args={["#ffffff"]} />
        <fog attach="fog" args={["#ffffff", 12, 28]} />
        
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#ffffff" />
        <spotLight position={[0, 15, 0]} intensity={1.5} angle={0.4} penumbra={1} color="#ffffff" />

        <PresentationControls
          global
          snap
          rotation={[0, 0, 0]}
          polar={[-Math.PI / 12, Math.PI / 12]}
          azimuth={[-Math.PI / 6, Math.PI / 6]}
        >
          <SignalCore />
          <FloatingDataStream />
        </PresentationControls>

        <Environment preset="apartment" />
      </Canvas>
    </div>
  );
}
