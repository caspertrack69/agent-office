import { Canvas } from '@react-three/fiber';
import { Perf } from 'r3f-perf';
import { Office } from './Office.tsx';
import { Agents } from './AgentMesh.tsx';
import { Lighting } from './Lighting.tsx';
import { CameraRig } from './CameraRig.tsx';

export function Scene() {
  const isDev = import.meta.env.DEV;

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      onPointerMissed={() => {
        // clear selection on background click — handled via store from parent
      }}
      style={{ background: '#f8f6f1' }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      {isDev && <Perf position="top-left" minimal />}
      <CameraRig />
      <Lighting />
      <Office />
      <Agents />
      <fog attach="fog" args={['#f8f6f1', 18, 36]} />
    </Canvas>
  );
}
