import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSimStore, useUiStore } from '../store/simStore.ts';
import { getPersonaColor } from '../data/personas/index.ts';
import type { Agent } from '../sim/types.ts';

export type AgentPoseRef = {
  pos: THREE.Vector3;
  heading: number;
  state: string;
};

export function agentPoseMapRef(): Map<string, AgentPoseRef> {
  return globalPoseMap;
}
const globalPoseMap = new Map<string, AgentPoseRef>();

function SingleAgent({ agent, pose }: { agent: Agent; pose: AgentPoseRef }) {
  const meshRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const walkPhase = useRef(0);
  const selectedId = useUiStore((s) => s.selectedAgentId);
  const isSelected = selectedId === agent.id;
  const color = useMemo(() => getPersonaColor(agent.id), [agent.id]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.position.lerp(pose.pos, 0.22);
    const targetQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), pose.heading);
    meshRef.current.quaternion.slerp(targetQuat, 0.18);

    // walk bob is driven by the frame loop, never during render
    if (bodyRef.current) {
      if (pose.state === 'Walking') {
        walkPhase.current += delta * 9;
        bodyRef.current.position.y = Math.abs(Math.sin(walkPhase.current)) * 0.05;
      } else if (bodyRef.current.position.y !== 0) {
        bodyRef.current.position.y = 0;
      }
    }
  });

  const isOffline = agent.presence === 'offline';
  const pantsColor = '#2d2a24';

  return (
    <group ref={meshRef} position={[pose.pos.x, pose.pos.y, pose.pos.z]}>
      {/* shadow */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.28, 16]} />
        <meshBasicMaterial color="#000" transparent opacity={0.22} depthWrite={false} />
      </mesh>

      {/* selection ring – gold */}
      {isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.46, 0.56, 32]} />
          <meshBasicMaterial color="#e8b84b" transparent opacity={0.95} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* voxel body */}
      <group ref={bodyRef} position={[0, 0, 0]}>
        {/* legs */}
        <mesh position={[-0.11, 0.22, 0]} castShadow>
          <boxGeometry args={[0.16, 0.44, 0.16]} />
          <meshStandardMaterial color={pantsColor} roughness={0.9} transparent opacity={isOffline ? 0.4 : 1} />
        </mesh>
        <mesh position={[0.11, 0.22, 0]} castShadow>
          <boxGeometry args={[0.16, 0.44, 0.16]} />
          <meshStandardMaterial color={pantsColor} roughness={0.9} transparent opacity={isOffline ? 0.4 : 1} />
        </mesh>
        {/* torso – shirt color */}
        <mesh position={[0, 0.64, 0]} castShadow>
          <boxGeometry args={[0.42, 0.52, 0.26]} />
          <meshStandardMaterial color={color} roughness={0.8} transparent opacity={isOffline ? 0.45 : 1} />
        </mesh>
        {/* arms */}
        <mesh position={[-0.28, 0.62, 0]} castShadow>
          <boxGeometry args={[0.11, 0.36, 0.11]} />
          <meshStandardMaterial color={color} roughness={0.8} transparent opacity={isOffline ? 0.45 : 1} />
        </mesh>
        <mesh position={[0.28, 0.62, 0]} castShadow>
          <boxGeometry args={[0.11, 0.36, 0.11]} />
          <meshStandardMaterial color={color} roughness={0.8} transparent opacity={isOffline ? 0.45 : 1} />
        </mesh>
        {/* head */}
        <mesh position={[0, 1.04, 0]} castShadow>
          <boxGeometry args={[0.30, 0.30, 0.30]} />
          <meshStandardMaterial color={isOffline ? '#9ca3af' : '#f5d1a8'} roughness={0.7} transparent opacity={isOffline ? 0.5 : 1} />
        </mesh>
        {/* hair top */}
        <mesh position={[0, 1.20, 0]} castShadow>
          <boxGeometry args={[0.32, 0.10, 0.32]} />
          <meshStandardMaterial color="#3a2a18" roughness={0.9} transparent opacity={isOffline ? 0.5 : 1} />
        </mesh>
        {/* face hint – two eyes */}
        <mesh position={[-0.07, 1.04, 0.16]}><boxGeometry args={[0.05, 0.05, 0.01]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
        <mesh position={[0.07, 1.04, 0.16]}><boxGeometry args={[0.05, 0.05, 0.01]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
      </group>

      {/* HQ name label – black pill with colored left border + yellow dot */}
      <Billboard position={[0, 1.58, 0]}>
        <Html center distanceFactor={9} style={{ pointerEvents: 'none' }} transform={false}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 8px 3px 4px',
              background: isSelected ? '#1f1406' : 'rgba(12,8,2,0.96)',
              border: `1px solid ${isSelected ? '#e8b84b' : 'rgba(232,184,75,0.22)'}`,
              borderLeft: `3px solid ${color}`,
              borderRadius: 6,
              boxShadow: '0 4px 14px rgba(0,0,0,0.45)',
              whiteSpace: 'nowrap',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 11,
              fontWeight: 700,
              color: '#fdf0c8',
              letterSpacing: '0.01em',
              opacity: isOffline ? 0.6 : 1,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#facc15', flexShrink: 0, boxShadow: '0 0 6px rgba(250,204,21,0.6)' }} />
            {agent.name}
          </div>
        </Html>
      </Billboard>

      {/* speech bubble */}
      {agent.speechText && (
        <Billboard position={[0, 1.95, 0]}>
          <Html center distanceFactor={9} style={{ pointerEvents: 'none' }}>
            <div
              style={{
                fontSize: 11,
                fontFamily: 'ui-monospace, monospace',
                background: '#fdf0c8',
                color: '#1a1206',
                padding: '4px 8px',
                borderRadius: 10,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                border: '1px solid #e8b84b',
              }}
            >
              {agent.speechText}
            </div>
          </Html>
        </Billboard>
      )}

      {/* task dot */}
      {agent.currentTaskId && (
        <mesh position={[0.26, 0.72, 0.14]}>
          <boxGeometry args={[0.09, 0.09, 0.02]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      )}
    </group>
  );
}

export function Agents() {
  const agents = useSimStore((s) => s.agents);
  const select = useUiStore((s) => s.selectAgent);

  for (const a of agents) {
    if (!globalPoseMap.has(a.id)) {
      globalPoseMap.set(a.id, {
        pos: new THREE.Vector3(a.position.x, 0, a.position.z),
        heading: a.heading,
        state: a.state,
      });
    } else {
      const p = globalPoseMap.get(a.id)!;
      p.state = a.state;
    }
  }

  return (
    <group>
      {agents.map((a) => {
        const pose = globalPoseMap.get(a.id)!;
        return (
          <group
            key={a.id}
            onClick={(e) => {
              e.stopPropagation();
              select(a.id);
            }}
            onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { document.body.style.cursor = 'auto'; }}
          >
            <SingleAgent agent={a} pose={pose} />
          </group>
        );
      })}
    </group>
  );
}
