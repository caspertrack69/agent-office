import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSimStore, useUiStore } from '../store/simStore.ts';
import { getPersonaColor } from '../data/personas/index.ts';
import type { Agent } from '../sim/types.ts';

// Shared refs for interpolation — updated outside React by the bridge
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
  const selectedId = useUiStore((s) => s.selectedAgentId);
  const isSelected = selectedId === agent.id;
  const color = useMemo(() => getPersonaColor(agent.id), [agent.id]);

  useFrame(() => {
    if (!meshRef.current) return;
    // Smooth follow toward pose (lerp 15% per frame — ~60fps)
    meshRef.current.position.lerp(pose.pos, 0.22);
    // heading slerp
    const targetQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), pose.heading);
    meshRef.current.quaternion.slerp(targetQuat, 0.18);
  });

  const isOffline = agent.presence === 'offline';
  const animScale = pose.state === 'Walking' ? 1 : pose.state === 'Working' ? 0.5 : 0;

  return (
    <group ref={meshRef} position={[pose.pos.x, pose.pos.y, pose.pos.z]}>
      {/* body */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.28, 0.7, 8, 16]} />
        <meshStandardMaterial color={color} transparent opacity={isOffline ? 0.35 : 1} />
      </mesh>
      {/* head */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={isOffline ? '#9ca3af' : '#fde68a'} transparent opacity={isOffline ? 0.4 : 1} />
      </mesh>
      {/* selection ring */}
      {isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.62, 32]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* state indicator */}
      <Billboard position={[0, 2.05, 0]}>
        <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 999,
              background: stateColor(pose.state),
              color: '#fff',
              whiteSpace: 'nowrap',
              opacity: isOffline ? 0.6 : 1,
            }}
          >
            {pose.state}
          </div>
        </Html>
      </Billboard>

      {/* name label */}
      <Billboard position={[0, 1.85, 0]}>
        <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: isSelected ? '#1d4ed8' : '#111827',
              background: 'rgba(255,255,255,0.92)',
              padding: '1px 6px',
              borderRadius: 6,
              border: isSelected ? '1px solid #3b82f6' : '1px solid #e5e7eb',
              whiteSpace: 'nowrap',
            }}
          >
            {agent.name} · {agent.role}
          </div>
        </Html>
      </Billboard>

      {/* speech bubble */}
      {agent.speechText && (
        <Billboard position={[0, 2.35, 0]}>
          <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div
              style={{
                fontSize: 11,
                background: '#111827',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: 10,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
            >
              {agent.speechText}
            </div>
          </Html>
        </Billboard>
      )}

      {/* task indicator */}
      {agent.currentTaskId && (
        <mesh position={[0.35, 1.0, 0]}>
          <boxGeometry args={[0.12, 0.12, 0.02]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      )}

      {/* subtle bob when walking */}
      <group position={[0, animScale * Math.sin(performance.now() * 0.01) * 0.04, 0]} />
    </group>
  );
}

function stateColor(s: string): string {
  switch (s) {
    case 'Walking': return '#3b82f6';
    case 'Working': return '#10b981';
    case 'Meeting': return '#ef4444';
    case 'Chatting': return '#a855f7';
    case 'Break': return '#f59e0b';
    case 'Responding': return '#ef4444';
    default: return '#6b7280';
  }
}

export function Agents() {
  const agents = useSimStore((s) => s.agents);
  const select = useUiStore((s) => s.selectAgent);

  // Ensure pose entries exist
  for (const a of agents) {
    if (!globalPoseMap.has(a.id)) {
      globalPoseMap.set(a.id, {
        pos: new THREE.Vector3(a.position.x, 0, a.position.z),
        heading: a.heading,
        state: a.state,
      });
    } else {
      const p = globalPoseMap.get(a.id)!;
      // sync state immediately
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
