import * as THREE from 'three';
import { useMemo } from 'react';
import { useSimStore, useUiStore } from '../store/simStore.ts';

// ── materials ──
const C = {
  floor: '#fdf0c8',
  floor2: '#fceec0',
  wallOuter: '#9aa0a8',
  wallInner: '#b0b6bd',
  wallDark: '#7a8088',
  desk: '#c3955a',
  deskDark: '#a67a3a',
  chair: '#6b7a8f',
  chairDark: '#4a5a6e',
  carpet: '#e8dcc8',
} as const;

// ── tiny helpers ──
function Box({ pos, size, color, cast = true, receive = true }: { pos: [number, number, number]; size: [number, number, number]; color: string; cast?: boolean; receive?: boolean }) {
  return (
    <mesh position={pos} castShadow={cast} receiveShadow={receive}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.85} metalness={0.02} />
    </mesh>
  );
}

// ── Desk with monitor + cup ──
function DeskSet({ pos, rot = 0 }: { pos: [number, number, number]; rot?: number }) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      {/* desk top */}
      <mesh position={[0, 0.52, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.35, 0.06, 0.72]} />
        <meshStandardMaterial color={C.desk} roughness={0.7} />
      </mesh>
      {/* legs */}
      <mesh position={[-0.58, 0.26, -0.28]} castShadow><boxGeometry args={[0.06, 0.52, 0.06]} /><meshStandardMaterial color={C.deskDark} /></mesh>
      <mesh position={[0.58, 0.26, -0.28]} castShadow><boxGeometry args={[0.06, 0.52, 0.06]} /><meshStandardMaterial color={C.deskDark} /></mesh>
      <mesh position={[-0.58, 0.26, 0.28]} castShadow><boxGeometry args={[0.06, 0.52, 0.06]} /><meshStandardMaterial color={C.deskDark} /></mesh>
      <mesh position={[0.58, 0.26, 0.28]} castShadow><boxGeometry args={[0.06, 0.52, 0.06]} /><meshStandardMaterial color={C.deskDark} /></mesh>
      {/* monitor */}
      <group position={[0.05, 0.62, -0.08]}>
        <mesh castShadow><boxGeometry args={[0.42, 0.26, 0.04]} /><meshStandardMaterial color="#1e293b" /></mesh>
        <mesh position={[0, -0.14, 0.02]}><boxGeometry args={[0.12, 0.04, 0.08]} /><meshStandardMaterial color="#334155" /></mesh>
        {/* screen */}
        <mesh position={[0, 0, 0.025]}><planeGeometry args={[0.36, 0.18]} /><meshBasicMaterial color="#3b82f6" opacity={0.95} transparent /></mesh>
      </group>
      {/* keyboard hint */}
      <mesh position={[0, 0.555, 0.12]}><boxGeometry args={[0.38, 0.015, 0.14]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
      {/* cup */}
      <mesh position={[0.55, 0.60, 0.22]} castShadow><cylinderGeometry args={[0.04, 0.04, 0.09, 10]} /><meshStandardMaterial color="#2a2a2a" /></mesh>
    </group>
  );
}

function Chair({ pos, rot = 0, color = C.chair }: { pos: [number, number, number]; rot?: number; color?: string }) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.32, 0]} castShadow><boxGeometry args={[0.38, 0.08, 0.38]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, 0.52, -0.15]} castShadow><boxGeometry args={[0.38, 0.32, 0.06]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, 0.10, 0]} castShadow><cylinderGeometry args={[0.08, 0.10, 0.22, 8]} /><meshStandardMaterial color="#3a3a3a" /></mesh>
      <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.18, 0.18, 0.02, 16]} /><meshStandardMaterial color="#2a2a2a" /></mesh>
    </group>
  );
}

function Sofa({ pos, color, size = [1.2, 0.5, 0.6] as [number, number, number] }: { pos: [number, number, number]; color: string; size?: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, 0.38, -size[2] / 2 + 0.08]} castShadow><boxGeometry args={[size[0], 0.32, 0.10]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[-size[0] / 2 + 0.12, 0.38, 0]} castShadow><boxGeometry args={[0.12, 0.32, size[2] - 0.12]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[size[0] / 2 - 0.12, 0.38, 0]} castShadow><boxGeometry args={[0.12, 0.32, size[2] - 0.12]} /><meshStandardMaterial color={color} /></mesh>
    </group>
  );
}

function RoundTable({ pos, r = 0.9, h = 0.48 }: { pos: [number, number, number]; r?: number; h?: number }) {
  return (
    <group position={pos}>
      <mesh position={[0, h, 0]} castShadow receiveShadow><cylinderGeometry args={[r, r, 0.06, 20]} /><meshStandardMaterial color="#d4a574" /></mesh>
      <mesh position={[0, h / 2, 0]} castShadow><cylinderGeometry args={[0.12, 0.16, h, 12]} /><meshStandardMaterial color="#8a6a3a" /></mesh>
      <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.32, 0.32, 0.04, 16]} /><meshStandardMaterial color="#6a4a1a" /></mesh>
    </group>
  );
}

function Bookshelf({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, 0.7, 0]} castShadow><boxGeometry args={[0.45, 1.35, 0.32]} /><meshStandardMaterial color="#7a4a2a" /></mesh>
      {/* shelves */}
      {[0.45, 0.72, 0.99].map((y, i) => (
        <mesh key={i} position={[0, y, 0.02]}><boxGeometry args={[0.40, 0.02, 0.28]} /><meshStandardMaterial color="#5a351a" /></mesh>
      ))}
    </group>
  );
}

function ServerRack({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, 0.75, 0]} castShadow><boxGeometry args={[0.9, 1.45, 0.7]} /><meshStandardMaterial color="#0f172a" roughness={0.6} /></mesh>
      {/* lights */}
      <mesh position={[0.46, 0.95, 0.1]}><boxGeometry args={[0.02, 0.28, 0.02]} /><meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.6} /></mesh>
      <mesh position={[0.46, 0.55, 0.1]}><boxGeometry args={[0.02, 0.18, 0.02]} /><meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} /></mesh>
    </group>
  );
}

function ReceptionDesk({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow><boxGeometry args={[2.2, 0.78, 0.62]} /><meshStandardMaterial color="#7a4a2a" /></mesh>
      <mesh position={[0.55, 0.82, -0.08]}><boxGeometry args={[0.42, 0.08, 0.32]} /><meshStandardMaterial color="#5a351a" /></mesh>
    </group>
  );
}

function PingPong({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, 0.38, 0]} castShadow><boxGeometry args={[1.45, 0.06, 0.78]} /><meshStandardMaterial color="#4ade80" /></mesh>
      <mesh position={[0, 0.42, 0]}><boxGeometry args={[0.02, 0.02, 0.78]} /><meshStandardMaterial color="white" /></mesh>
      <mesh position={[0, 0.20, 0]}><boxGeometry args={[1.40, 0.36, 0.70]} /><meshStandardMaterial color="#1a3a2a" /></mesh>
    </group>
  );
}

function FloorLabel({ pos, label }: { pos: [number, number, number]; label: string }) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 64;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, 256, 64);
    ctx.fillStyle = 'rgba(255,255,255,0.0)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = 'rgba(80,60,20,0.22)';
    ctx.font = '700 13px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label.toUpperCase(), 128, 38);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, [label]);
  return (
    <mesh position={pos} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1.2, 0.32]} />
      <meshBasicMaterial map={tex} transparent opacity={0.9} depthWrite={false} />
    </mesh>
  );
}

export function Office() {
  const zoneStates = useSimStore((s) => s.zoneStates);
  const showGrid = useUiStore((s) => s.showGrid);
  const showWalls = useUiStore((s) => s.showWalls);

  // zone tint overlay (subtle)
  const zoneTint = (id: string) => {
    const st = zoneStates[id];
    if (st === 'active') return '#fecaca';
    if (st === 'locked') return '#cbd5e1';
    return null;
  };

  return (
    <group>
      {/* ── Main floor (cream) with thin border ── */}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <boxGeometry args={[22.5, 0.12, 16.5]} />
        <meshStandardMaterial color={C.floor} roughness={0.95} />
      </mesh>
      {/* floor grid subtle */}
      {showGrid && <gridHelper args={[22, 22, '#f3e8c8', '#fdf6e0']} position={[0, 0.008, 0]} />}

      {/* secondary floor tint for zones */}
      {zoneTint('war_room') && (
        <mesh position={[7.5, 0.006, 4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[4, 4]} />
          <meshBasicMaterial color={zoneTint('war_room')!} transparent opacity={0.18} />
        </mesh>
      )}
      {zoneTint('meeting_room') && (
        <mesh position={[0, 0.006, -5.8]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.2, 3.2]} />
          <meshBasicMaterial color={zoneTint('meeting_room')!} transparent opacity={0.18} />
        </mesh>
      )}

      {/* ── Outer perimeter walls (thick, grey) ── */}
      {showWalls && (
        <>
          {/* north */}
          <Box pos={[0, 1.15, -8.28]} size={[23.2, 2.35, 0.38]} color={C.wallOuter} />
          {/* south */}
          <Box pos={[0, 1.15, 8.28]} size={[23.2, 2.35, 0.38]} color={C.wallOuter} />
          {/* west */}
          <Box pos={[-11.6, 1.15, 0]} size={[0.38, 2.35, 17.3]} color={C.wallOuter} />
          {/* east */}
          <Box pos={[11.6, 1.15, 0]} size={[0.38, 2.35, 17.3]} color={C.wallOuter} />

          {/* inner wall lining (lighter top) */}
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[11.2, 11.4, 4]} />
            <meshBasicMaterial color="#2a1e0c" transparent opacity={0.35} />
          </mesh>

          {/* Server room partition (left) */}
          <Box pos={[-7.2, 1.0, 0.9]} size={[0.22, 2.0, 5.6]} color={C.wallInner} />
          <Box pos={[-9.35, 1.0, 2.95]} size={[4.0, 2.0, 0.22]} color={C.wallInner} />
          <Box pos={[-9.1, 1.0, -1.75]} size={[3.5, 2.0, 0.22]} color={C.wallInner} />
          {/* door */}
          <mesh position={[-7.18, 0.68, 1.55]}><boxGeometry args={[0.08, 1.35, 0.65]} /><meshStandardMaterial color="#5a3a1a" /></mesh>
        </>
      )}

      {/* ── Furniture matching screenshot ── */}
      {/* Top round meeting (north) */}
      <RoundTable pos={[0, 0, -5.9]} r={1.15} />
      <Chair pos={[0.95, 0, -5.05]} rot={Math.PI} />
      <Chair pos={[-0.95, 0, -5.05]} rot={Math.PI} />
      <Chair pos={[1.05, 0, -6.75]} rot={0} />
      <Chair pos={[-1.05, 0, -6.75]} rot={0} />
      <Chair pos={[0, 0, -4.78]} rot={Math.PI} />
      <Chair pos={[1.55, 0, -5.9]} rot={-Math.PI / 2} />
      <Chair pos={[-1.55, 0, -5.9]} rot={Math.PI / 2} />

      {/* Desks row */}
      <DeskSet pos={[-4.8, 0, -3.35]} rot={0} />
      <Chair pos={[-4.8, 0, -2.55]} rot={Math.PI} />
      <DeskSet pos={[-7.0, 0, -1.2]} rot={0} />
      <Chair pos={[-7.0, 0, -0.42]} rot={Math.PI} />
      <DeskSet pos={[-0.75, 0, -0.85]} rot={0} />
      <Chair pos={[-0.20, 0, -0.05]} rot={Math.PI + 0.3} />
      <DeskSet pos={[-4.9, 0, 1.1]} rot={0} />
      <Chair pos={[-4.85, 0, 1.92]} rot={Math.PI} />
      <DeskSet pos={[2.25, 0, 1.55]} rot={0} />
      <Chair pos={[1.95, 0, 2.35]} rot={Math.PI} />
      <DeskSet pos={[2.55, 0, 3.55]} rot={0} />
      <Chair pos={[2.25, 0, 4.30]} rot={Math.PI} />
      <DeskSet pos={[5.10, 0, 3.45]} rot={0} />
      <Chair pos={[4.80, 0, 4.20]} rot={Math.PI} />
      <DeskSet pos={[0.10, 0, 2.55]} rot={0} />
      <Chair pos={[-0.15, 0, 3.32]} rot={Math.PI} />
      <DeskSet pos={[1.55, 0, 5.25]} rot={0} />
      <Chair pos={[1.25, 0, 6.02]} rot={Math.PI} />

      {/* Purple sofa top-middle */}
      <Sofa pos={[3.2, 0, -2.15]} color="#7c4dff" size={[1.05, 0.48, 0.68]} />
      {/* Floor lamp near it */}
      <group position={[5.05, 0, -1.85]}>
        <mesh position={[0, 0.65, 0]}><cylinderGeometry args={[0.04, 0.04, 1.25, 8]} /><meshStandardMaterial color="#b8a07a" /></mesh>
        <mesh position={[0, 1.28, 0]}><coneGeometry args={[0.18, 0.22, 12]} /><meshStandardMaterial color="#e8dcc0" /></mesh>
      </group>

      {/* Bookshelf + reception (right wall) */}
      <Bookshelf pos={[9.95, 0, -1.1]} />
      <ReceptionDesk pos={[9.55, 0, 0.25]} />

      {/* White boxes / storage east wall */}
      <Box pos={[10.35, 0.35, 2.35]} size={[1.2, 0.65, 0.42]} color="#e8e8e8" />
      <Box pos={[10.35, 0.35, 2.85]} size={[0.42, 0.35, 0.42]} color="#f5f5f5" />
      <Box pos={[10.55, 0.35, 3.25]} size={[0.32, 0.22, 0.22]} color="#111827" />
      <Box pos={[10.85, 0.35, 3.55]} size={[0.52, 0.42, 0.42]} color="#f5f5f5" />

      {/* Dark sideboard east wall */}
      <Box pos={[10.9, 0.45, 1.55]} size={[2.1, 0.55, 0.38]} color="#2a3545" />

      {/* Lobby sofas bottom-right */}
      <Sofa pos={[8.9, 0, 5.55]} color="#4a5a8a" size={[1.55, 0.52, 0.72]} />
      <Sofa pos={[8.25, 0, 6.45]} color="#4a5a8a" size={[1.45, 0.48, 0.68]} />
      <Box pos={[7.05, 0.30, 5.90]} size={[0.62, 0.42, 0.62]} color="#ff6b35" />
      <Box pos={[6.05, 0.30, 6.35]} size={[0.52, 0.32, 0.52]} color="#5a9bd4" />

      {/* Bottom round table */}
      <RoundTable pos={[9.45, 0, 6.55]} r={0.92} />
      <Chair pos={[8.45, 0, 6.85]} rot={0.6} />
      <Chair pos={[10.35, 0, 6.15]} rot={-2.4} />
      <Chair pos={[8.90, 0, 7.45]} rot={-0.2} />
      <Box pos={[8.15, 0.85, 6.85]} size={[0.42, 0.75, 0.48]} color="#0f172a" />
      <Box pos={[9.85, 0.70, 7.05]} size={[0.22, 0.45, 0.22]} color="#dc2626" />

      {/* Ping pong bottom */}
      <PingPong pos={[6.15, 0, 7.75]} />

      {/* Plants */}
      {[
        [-4.95, 1.35], [1.55, 6.95], [5.45, 7.20], [10.15, 1.95], [0.85, -7.35],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.13, 0.16, 0.42, 8]} /><meshStandardMaterial color="#d8cbb0" /></mesh>
          <mesh position={[0, 0.62, 0]}><coneGeometry args={[0.18, 0.55, 8]} /><meshStandardMaterial color="#4ade80" /></mesh>
        </group>
      ))}

      {/* Ladder / decor near north wall */}
      <group position={[2.25, 0, -7.05]}>
        <mesh position={[-0.12, 0.70, 0]}><boxGeometry args={[0.04, 1.35, 0.04]} /><meshStandardMaterial color="#e8e8e8" /></mesh>
        <mesh position={[0.12, 0.70, 0]}><boxGeometry args={[0.04, 1.35, 0.04]} /><meshStandardMaterial color="#e8e8e8" /></mesh>
        {[0.35, 0.60, 0.85, 1.10].map((y, i) => (
          <mesh key={i} position={[0, y, 0]}><boxGeometry args={[0.28, 0.03, 0.02]} /><meshStandardMaterial color="#e8e8e8" /></mesh>
        ))}
      </group>
      <group position={[1.15, 0, 7.55]}>
        <mesh position={[-0.12, 0.70, 0]}><boxGeometry args={[0.04, 1.35, 0.04]} /><meshStandardMaterial color="#e8e8e8" /></mesh>
        <mesh position={[0.12, 0.70, 0]}><boxGeometry args={[0.04, 1.35, 0.04]} /><meshStandardMaterial color="#e8e8e8" /></mesh>
        {[0.35, 0.60, 0.85, 1.10].map((y, i) => (
          <mesh key={i} position={[0, y, 0]}><boxGeometry args={[0.28, 0.03, 0.02]} /><meshStandardMaterial color="#e8e8e8" /></mesh>
        ))}
      </group>

      {/* Server racks left */}
      <ServerRack pos={[-10.95, 0, -1.35]} />
      <ServerRack pos={[-10.15, 0, -0.05]} />
      <Box pos={[-9.85, 0.35, -0.65]} size={[0.62, 0.42, 0.62]} color="#1e293b" />
      <Box pos={[-9.85, 0.52, -0.65]} size={[0.42, 0.04, 0.38]} color="#38bdf8" />

      {/* TV / frames on walls (simple planes) */}
      <mesh position={[-10.55, 1.35, -3.8]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[0.85, 0.52]} /><meshStandardMaterial color="#0f172a" /></mesh>
      <mesh position={[-4.85, 1.55, -8.08]} rotation={[0, 0, 0]}><planeGeometry args={[0.62, 0.38]} /><meshStandardMaterial color="#111827" /></mesh>
      <mesh position={[0.65, 1.75, -8.08]}><planeGeometry args={[0.42, 0.42]} /><meshStandardMaterial color="#fde68a" /></mesh>
      <mesh position={[0.85, 1.75, -8.08]}><planeGeometry args={[0.12, 0.32]} /><meshStandardMaterial color="#60a5fa" /></mesh>
      <mesh position={[8.85, 1.35, -4.85]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[0.52, 0.36]} /><meshStandardMaterial color="#fef3c7" /></mesh>

      {/* Floor labels subtle (optional) */}
      <FloorLabel pos={[-4.5, 0.011, -2.0]} label="open space" />
      <FloorLabel pos={[9.2, 0.011, -2.8]} label="reception" />

      {/* War room screen */}
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
    ctx.font = 'bold 24px system-ui';
    ctx.fillText(hasCritical ? '! CRITICAL ALERT' : 'WAR ROOM - STANDBY', 24, 48);
    if (hasCritical && alerts[0]) {
      ctx.font = '16px system-ui';
      ctx.fillStyle = '#fecaca';
      ctx.fillText(alerts[0].message.slice(0, 60), 24, 90);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, 200, 512, 56);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '13px system-ui';
    ctx.fillText('agent-office  |  incident board', 24, 232);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }, [hasCritical, alerts]);

  return (
    <mesh position={[10.35, 1.35, 0.55]} rotation={[0, -Math.PI / 2, 0]}>
      <planeGeometry args={[1.35, 0.78]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
