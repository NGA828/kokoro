'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type MascotReaction = 'idle' | 'wave' | 'love' | 'happy';

function heartGeometry() {
  const s = new THREE.Shape();
  s.moveTo(2.5, 2.5);
  s.bezierCurveTo(2.5, 2.5, 2, 0, 0, 0);
  s.bezierCurveTo(-3, 0, -3, 3.5, -3, 3.5);
  s.bezierCurveTo(-3, 5.5, -1, 7.7, 2.5, 9.5);
  s.bezierCurveTo(6, 7.7, 8, 5.5, 8, 3.5);
  s.bezierCurveTo(8, 3.5, 8, 0, 5, 0);
  s.bezierCurveTo(3.5, 0, 2.5, 2.5, 2.5, 2.5);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.4,
    bevelEnabled: true,
    bevelSize: 0.15,
    bevelThickness: 0.15,
    bevelSegments: 2,
  });
  geo.center();
  geo.scale(0.16, 0.16, 0.16);
  return geo;
}

const SKIN = '#ffd9c4';
const HAIR = '#2c1b45';
const HOODIE = '#8b4dff';
const HOODIE_DARK = '#6d31e0';

function FloatingHearts({ burstId }: { burstId: number }) {
  const group = useRef<THREE.Group>(null);
  const geo = useMemo(() => heartGeometry(), []);
  const hearts = useMemo(
    () =>
      Array.from({ length: 16 }).map((_, i) => ({
        x: (Math.random() - 0.5) * 2.2,
        y: 0.2 + Math.random() * 0.5,
        z: (Math.random() - 0.5) * 0.8,
        vy: 1.5 + Math.random() * 1.3,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 5,
        s: 0.7 + Math.random() * 0.9,
        delay: Math.random() * 0.3,
        pink: i % 2 === 0,
      })),
    [],
  );

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.children.forEach((child, i) => {
      const h = hearts[i];
      const life = (t - h.delay) % 2.4;
      if (life < 0) {
        child.visible = false;
        return;
      }
      child.visible = true;
      child.position.x = h.x + Math.sin(life * 3 + i) * 0.12;
      child.position.y = h.y + life * h.vy;
      child.rotation.z = h.rot + life * h.vr;
      child.scale.setScalar(h.s * (0.6 + life * 0.25));
      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      mat.opacity = Math.max(0, 0.95 - life / 2.3);
    });
  });

  return (
    <group ref={group} key={burstId}>
      {hearts.map((h, i) => (
        <mesh key={i} geometry={geo} position={[h.x, h.y, h.z]}>
          <meshStandardMaterial
            color={h.pink ? '#ff3d8f' : '#ff6fae'}
            emissive={h.pink ? '#ff3d8f' : '#ff6fae'}
            emissiveIntensity={0.35}
            transparent
            opacity={0.95}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

function Figure({
  reaction,
  burstId,
}: {
  reaction: MascotReaction;
  burstId: number;
}) {
  const root = useRef<THREE.Group>(null);
  const arm = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const eyeL = useRef<THREE.Mesh>(null);
  const eyeR = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const g = root.current;
    if (!g) return;
    g.position.y = 0.02 + Math.sin(t * 1.6) * 0.06;
    g.rotation.z = Math.sin(t * 1.1) * 0.03;
    g.rotation.y = Math.sin(t * 0.7) * 0.16;
    if (reaction === 'happy') g.position.y += Math.abs(Math.sin(t * 9)) * 0.16;
    if (reaction === 'love') g.rotation.z = Math.sin(t * 6) * 0.05;

    if (arm.current) {
      const target = reaction === 'wave' ? 2.35 + Math.sin(t * 10) * 0.4 : 0.35;
      arm.current.rotation.z += (target - arm.current.rotation.z) * 0.16;
    }
    if (head.current) {
      const tilt = reaction === 'love' ? 0.16 : reaction === 'wave' ? -0.1 : 0;
      head.current.rotation.z += (tilt - head.current.rotation.z) * 0.1;
    }
    const blink = t % 3.7 < 0.12 ? 0.12 : 1;
    if (eyeL.current) eyeL.current.scale.y += (blink - eyeL.current.scale.y) * 0.5;
    if (eyeR.current) eyeR.current.scale.y += (blink - eyeR.current.scale.y) * 0.5;
  });

  return (
    <group ref={root}>
      {/* body */}
      <mesh position={[0, -0.72, 0]} castShadow>
        <capsuleGeometry args={[0.42, 0.55, 12, 24]} />
        <meshStandardMaterial color={HOODIE} roughness={0.55} />
      </mesh>
      <mesh position={[0, -0.82, 0.36]}>
        <sphereGeometry args={[0.24, 20, 20]} />
        <meshStandardMaterial color={HOODIE_DARK} roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.62, 0.5]} scale={0.09}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color="#ff3d8f" emissive="#ff3d8f" emissiveIntensity={0.4} />
      </mesh>

      {/* head */}
      <group ref={head}>
        <mesh position={[0, 0.32, 0]} castShadow>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color={SKIN} roughness={0.65} />
        </mesh>
        {/* hair cap */}
        <mesh position={[0, 0.5, -0.03]}>
          <sphereGeometry args={[0.53, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          <meshStandardMaterial color={HAIR} roughness={0.75} />
        </mesh>
        {/* bangs */}
        <mesh position={[0, 0.6, 0.33]} rotation={[0.5, 0, 0]}>
          <sphereGeometry args={[0.3, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color={HAIR} roughness={0.75} />
        </mesh>
        {/* side strands */}
        <mesh position={[-0.42, 0.2, 0.08]}>
          <capsuleGeometry args={[0.1, 0.42, 8, 16]} />
          <meshStandardMaterial color={HAIR} roughness={0.75} />
        </mesh>
        <mesh position={[0.42, 0.2, 0.08]}>
          <capsuleGeometry args={[0.1, 0.42, 8, 16]} />
          <meshStandardMaterial color={HAIR} roughness={0.75} />
        </mesh>
        {/* ahoge */}
        <mesh position={[0.06, 0.98, -0.05]} rotation={[0, 0, -0.5]}>
          <capsuleGeometry args={[0.035, 0.22, 8, 12]} />
          <meshStandardMaterial color={HAIR} roughness={0.75} />
        </mesh>

        {/* eyes */}
        {[
          [-0.18, eyeL],
          [0.18, eyeR],
        ].map(([x, ref], i) => (
          <group key={i} position={[x as number, 0.36, 0.46]}>
            <mesh ref={ref as React.RefObject<THREE.Mesh>}>
              <sphereGeometry args={[0.085, 16, 16]} />
              <meshStandardMaterial color="#3a2350" roughness={0.2} />
            </mesh>
            <mesh position={[0.025, 0.03, 0.06]}>
              <sphereGeometry args={[0.028, 10, 10]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
            </mesh>
          </group>
        ))}
        {/* blush */}
        <mesh position={[-0.3, 0.2, 0.42]}>
          <circleGeometry args={[0.07, 16]} />
          <meshBasicMaterial color="#ff9ec6" transparent opacity={0.55} />
        </mesh>
        <mesh position={[0.3, 0.2, 0.42]}>
          <circleGeometry args={[0.07, 16]} />
          <meshBasicMaterial color="#ff9ec6" transparent opacity={0.55} />
        </mesh>
        {/* mouth */}
        <mesh position={[0, 0.15, 0.49]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.05, 0.016, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#c0456e" roughness={0.4} />
        </mesh>
      </group>

      {/* left arm */}
      <group position={[-0.42, -0.42, 0]} rotation={[0, 0, 0.5]}>
        <mesh position={[0, -0.24, 0]} castShadow>
          <capsuleGeometry args={[0.11, 0.32, 8, 16]} />
          <meshStandardMaterial color={HOODIE} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshStandardMaterial color={SKIN} roughness={0.65} />
        </mesh>
      </group>
      {/* right arm (waves) */}
      <group ref={arm} position={[0.42, -0.42, 0.05]} rotation={[0, 0, 0.35]}>
        <mesh position={[0, -0.24, 0]} castShadow>
          <capsuleGeometry args={[0.11, 0.32, 8, 16]} />
          <meshStandardMaterial color={HOODIE} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshStandardMaterial color={SKIN} roughness={0.65} />
        </mesh>
      </group>

      {/* feet */}
      <mesh position={[-0.2, -1.22, 0.08]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color="#2c1b45" roughness={0.7} />
      </mesh>
      <mesh position={[0.2, -1.22, 0.08]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color="#2c1b45" roughness={0.7} />
      </mesh>

      {reaction === 'love' && <FloatingHearts burstId={burstId} />}
    </group>
  );
}

export default function MascotScene({
  reaction,
  burstId,
}: {
  reaction: MascotReaction;
  burstId: number;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.2], fov: 38 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 5, 4]} intensity={1.15} />
      <directionalLight position={[-4, 2, -2]} intensity={0.35} color="#ff9ec6" />
      <pointLight position={[0, -2, 2]} intensity={0.4} color="#8b4dff" />
      <Figure reaction={reaction} burstId={burstId} />
    </Canvas>
  );
}
