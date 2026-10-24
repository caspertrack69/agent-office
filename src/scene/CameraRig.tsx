import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useUiStore } from '../store/simStore.ts';
import { agentPoseMapRef } from './AgentMesh.tsx';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

export function CameraRig() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const follow = useUiStore((s) => s.followAgent);
  const selectedId = useUiStore((s) => s.selectedAgentId);
  const topDown = useUiStore((s) => s.topDown);
  const { camera } = useThree();

  useEffect(() => {
    if (topDown) {
      camera.position.set(0, 18, 0.1);
      controlsRef.current?.target.set(0, 0, 0);
      controlsRef.current?.update();
    } else {
      camera.position.set(10, 8, 10);
      controlsRef.current?.target.set(0, 0, 0);
      controlsRef.current?.update();
    }
  }, [topDown, camera]);

  useFrame(() => {
    if (!follow || !selectedId) return;
    const pose = agentPoseMapRef().get(selectedId);
    if (!pose || !controlsRef.current) return;
    const target = controlsRef.current.target;
    target.lerp(new THREE.Vector3(pose.pos.x, 0, pose.pos.z), 0.06);
    // keep camera offset relative to target
    const offset = new THREE.Vector3().subVectors(camera.position, target);
    // gently follow
    camera.position.lerp(new THREE.Vector3(pose.pos.x + offset.x, camera.position.y, pose.pos.z + offset.z), 0.04);
    controlsRef.current.update();
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[10, 8, 10]} fov={52} near={0.1} far={100} />
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={22}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0, 0]}
      />
    </>
  );
}
