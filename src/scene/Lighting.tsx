import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimStore } from '../store/simStore.ts';

export function Lighting() {
  const dirRef = useRef<THREE.DirectionalLight>(null);
  const alertRef = useRef<THREE.PointLight>(null);
  const alerts = useSimStore((s) => s.alerts);
  const hasCritical = alerts.some((a) => a.severity === 'critical');
  const hasAny = alerts.length > 0;

  useFrame(({ clock }) => {
    if (alertRef.current && hasCritical) {
      const t = clock.getElapsedTime();
      // flashing red
      alertRef.current.intensity = 2 + Math.sin(t * 8) * 1.5 + Math.sin(t * 3.2) * 0.5;
    } else if (alertRef.current) {
      alertRef.current.intensity = hasAny ? 0.8 : 0;
    }
    if (dirRef.current) {
      // subtle flicker when critical
      if (hasCritical) {
        const t = clock.getElapsedTime();
        dirRef.current.intensity = 1.1 + Math.sin(t * 12) * 0.08;
      } else {
        dirRef.current.intensity = 1.2;
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.85} color="#ffffff" />
      <directionalLight
        ref={dirRef}
        position={[8, 10, 6]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />
      <hemisphereLight args={['#ffffff', '#e8e6e1', 0.35]} />
      {/* Alert point light */}
      <pointLight
        ref={alertRef}
        position={[7.5, 3, 4]}
        color="#ef4444"
        intensity={0}
        distance={14}
        decay={2}
      />
      {/* Fill light */}
      <directionalLight position={[-6, 6, -6]} intensity={0.35} color="#dbeafe" />
    </>
  );
}
