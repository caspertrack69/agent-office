import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useUiStore } from '../store/simStore.ts';
import { agentPoseMapRef } from './AgentMesh.tsx';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

// Isometric framing: southeast corner looking northwest (matches HQ diamond view)
const ISO_POS = new THREE.Vector3(13.5, 13.5, 13.5);
const TOP_POS = new THREE.Vector3(0, 19, 0.1);
const ISO_TARGET = new THREE.Vector3(0, 0, -0.4);
const TOP_TARGET = new THREE.Vector3(0, 0, 0);

export function CameraRig() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const follow = useUiStore((s) => s.followAgent);
  const selectedId = useUiStore((s) => s.selectedAgentId);
  const topDown = useUiStore((s) => s.topDown);
  const { camera } = useThree();

  useEffect(() => {
    const controls = controlsRef.current;
    if (topDown) camera.position.copy(TOP_POS);
    else camera.position.copy(ISO_POS);
    if (controls) {
      controls.target.copy(topDown ? TOP_TARGET : ISO_TARGET);
      controls.update();
    }
  }, [topDown, camera]);

  useFrame(() => {
    if (!follow || !selectedId) return;
    const pose = agentPoseMapRef().get(selectedId);
    const controls = controlsRef.current;
    if (!pose || !controls) return;
    const target = controls.target;
    target.lerp(new THREE.Vector3(pose.pos.x, 0, pose.pos.z), 0.06);
    const dx = camera.position.x - target.x;
    const dz = camera.position.z - target.z;
    camera.position.lerp(new THREE.Vector3(pose.pos.x + dx, camera.position.y, pose.pos.z + dz), 0.04);
    controls.update();
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={ISO_POS.toArray() as [number, number, number]} fov={42} near={0.1} far={120} />
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.09}
        enableRotate={!topDown}
        minPolarAngle={0.75}
        maxPolarAngle={1.08}
        minAzimuthAngle={-0.35}
        maxAzimuthAngle={0.35}
        minDistance={6}
        maxDistance={28}
        target={[0, 0, -0.4]}
        enablePan
        panSpeed={1.15}
        zoomSpeed={1.1}
        mouseButtons={{
          LEFT: THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE,
        }}
      />
    </>
  );
}
