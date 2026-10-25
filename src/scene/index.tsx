import { Canvas } from '@react-three/fiber';
import { Perf } from 'r3f-perf';
import { Office } from './Office.tsx';
import { Agents } from './AgentMesh.tsx';
import { Lighting } from './Lighting.tsx';
import { CameraRig } from './CameraRig.tsx';
import { readToken } from '../theme/tokens.ts';

export function Scene() {
  const isDev = import.meta.env.DEV;
  const sceneBg = readToken('--bg-base');

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      onPointerMissed={() => {}}
      style={{ background: sceneBg }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      {isDev && <Perf position="top-left" minimal />}
      <CameraRig />
      <Lighting />
      <Office />
      <Agents />
      <fog attach="fog" args={[sceneBg, 28, 58]} />
    </Canvas>
  );
}
