import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimStore, useUiStore } from '../store/simStore.ts';

export function Lighting() {
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const alertRef = useRef<THREE.PointLight>(null);
  const alerts = useSimStore((s) => s.alerts);
  const ambient = useUiStore((s) => s.ambient);
  const hasCritical = alerts.some((a) => a.severity === 'critical');
  const hasAny = alerts.length > 0;

  useFrame(({ clock }) => {
    if (alertRef.current && hasCritical) {
      const t = clock.getElapsedTime();
      alertRef.current.intensity = 2 + Math.sin(t * 8) * 1.5 + Math.sin(t * 3.2) * 0.5;
    } else if (alertRef.current) {
      alertRef.current.intensity = hasAny ? 0.8 : 0;
    }
    if (dirRef.current) {
      if (hasCritical) {
        const t = clock.getElapsedTime();
        dirRef.current.intensity = 1.1 + Math.sin(t * 12) * 0.08;
      } else {
        dirRef.current.intensity = 1.35;
      }
    }
  });

  const base = 0.6 + ambient * 0.35;

  return (
    <>
      <ambientLight intensity={base} color="#fff6df" />
      <directionalLight
        ref={dirRef}
        position={[9, 12, 7]}
        intensity={1.35}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-bias={-0.0002}
      />
      <hemisphereLight args={['#fff4cc', '#1a1206', 0.30]} />
      <pointLight
        ref={alertRef}
        position={[7.5, 3, 4]}
        color="#ef4444"
        intensity={0}
        distance={14}
        decay={2}
      />
      {/* warm fill from southeast */}
      <directionalLight position={[-6, 7, -7]} intensity={0.28} color="#ffe9b8" />
    </>
  );
}
