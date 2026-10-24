import * as THREE from 'three';
import { useMemo } from 'react';
import { OFFICE_ZONES, getFurniture } from '../data/office.layout.ts';
import { useSimStore } from '../store/simStore.ts';

function ZoneFloor({ zone }: { zone: (typeof OFFICE_ZONES)[number] }) {
  const zoneStates = useSimStore((s) => s.zoneStates);
  const state = zoneStates[zone.id] ?? 'normal';
  const color = useMemo(() => {
    if (state === 'active') return '#fecaca';
    if (state === 'locked') return '#d1d5db';
    return zone.color;
  }, [state, zone.color]);

  return (
    <mesh position={[zone.center.x, -0.05, zone.center.z]} receiveShadow>
      <boxGeometry args={[zone.size.x, 0.1, zone.size.z]} />
      <meshStandardMaterial color={color} />
      {/* label */}
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[zone.size.x * 0.9, 0.6]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </mesh>
  );
}

function Desk({ pos, size }: { pos: [number, number, number]; size: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, size[1] / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#c4b5a0" />
      </mesh>
      {/* legs */}
      {[
        [-size[0] / 2 + 0.08, -size[2] / 2 + 0.08],
        [size[0] / 2 - 0.08, -size[2] / 2 + 0.08],
        [-size[0] / 2 + 0.08, size[2] / 2 - 0.08],
        [size[0] / 2 - 0.08, size[2] / 2 - 0.08],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.05, z]} castShadow>
          <boxGeometry args={[0.06, size[1], 0.06]} />
          <meshStandardMaterial color="#8a7a65" />
        </mesh>
      ))}
    </group>
  );
}

export function Office() {
  const furniture = useMemo(() => getFurniture(), []);

  return (
    <group>
      {/* Floors per zone */}
      {OFFICE_ZONES.map((z) => (
        <ZoneFloor key={z.id} zone={z} />
      ))}

      {/* Grid helper */}
      <gridHelper args={[24, 24, '#e5e7eb', '#f3f4f6']} position={[0, 0.01, 0]} />

      {/* Furniture */}
      {furniture.map((f) => (
        <Desk key={f.id} pos={[f.pos.x, f.pos.y, f.pos.z]} size={[f.size.x, f.size.y, f.size.z]} />
      ))}

      {/* Walls — simple boxes */}
      <mesh position={[0, 1.25, -8.5]} castShadow receiveShadow>
        <boxGeometry args={[22, 2.5, 0.15]} />
        <meshStandardMaterial color="#e9e6e0" />
      </mesh>
      <mesh position={[0, 1.25, 8.5]} castShadow receiveShadow>
        <boxGeometry args={[22, 2.5, 0.15]} />
        <meshStandardMaterial color="#e9e6e0" />
      </mesh>
      <mesh position={[-11, 1.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 2.5, 18]} />
        <meshStandardMaterial color="#e9e6e0" />
      </mesh>
      <mesh position={[11, 1.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 2.5, 18]} />
        <meshStandardMaterial color="#e9e6e0" />
      </mesh>

      {/* Internal partitions */}
      <mesh position={[5, 1, 0]} castShadow>
        <boxGeometry args={[0.12, 2, 6]} />
        <meshStandardMaterial color="#ddd8d0" transparent opacity={0.9} />
      </mesh>
      <mesh position={[-5, 1, 0]} castShadow>
        <boxGeometry args={[0.12, 2, 4]} />
        <meshStandardMaterial color="#ddd8d0" transparent opacity={0.9} />
      </mesh>

      {/* Warning screen on wall (war room) */}
      <WarRoomScreen />
    </group>
  );
}

function WarRoomScreen() {
  const alerts = useSimStore((s) => s.alerts);
  const hasCritical = alerts.some((a) => a.severity === 'critical');
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = hasCritical ? '#7f1d1d' : '#1e293b';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = hasCritical ? '#fecaca' : '#94a3b8';
    ctx.font = 'bold 28px system-ui';
    ctx.fillText(hasCritical ? '⚠ CRITICAL ALERT' : 'WAR ROOM — STANDBY', 24, 48);
    if (hasCritical && alerts[0]) {
      ctx.font = '18px system-ui';
      ctx.fillStyle = '#fecaca';
      const msg = alerts[0].message.slice(0, 60);
      ctx.fillText(msg, 24, 90);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, 200, 512, 56);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '14px system-ui';
    ctx.fillText('agent-office • incident board', 24, 232);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }, [hasCritical, alerts]);

  return (
    <mesh position={[7.5, 1.4, 1.2]} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={[2.2, 1.2]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
