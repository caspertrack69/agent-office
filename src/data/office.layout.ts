/**
 * Office layout — single source of truth for zones, slots, and static objects.
 * See brief §10. Positions in meters (Three.js units).
 */
import type { Slot, Vec3, ZoneState } from '../sim/types.ts';

export type OfficeZone = {
  id: string;
  label: string;
  center: Vec3;
  size: Vec3;
  color: string;
};

export const OFFICE_ZONES: OfficeZone[] = [
  { id: 'lobby', label: 'Lobby', center: { x: -8, y: 0, z: 0 }, size: { x: 4, y: 0.1, z: 6 }, color: '#e8e6e1' },
  { id: 'open_space', label: 'Open Space', center: { x: 0, y: 0, z: 0 }, size: { x: 10, y: 0.1, z: 8 }, color: '#f0ede8' },
  { id: 'meeting_room', label: 'Meeting Room', center: { x: 7.5, y: 0, z: -4 }, size: { x: 4, y: 0.1, z: 4 }, color: '#dde7ee' },
  { id: 'war_room', label: 'War Room', center: { x: 7.5, y: 0, z: 4 }, size: { x: 4, y: 0.1, z: 4 }, color: '#fde8e8' },
  { id: 'pantry', label: 'Pantry', center: { x: -7, y: 0, z: -5 }, size: { x: 3, y: 0.1, z: 3 }, color: '#e6f0e6' },
  { id: 'break_area', label: 'Break Area', center: { x: -7, y: 0, z: 5 }, size: { x: 3, y: 0.1, z: 3 }, color: '#fff3d6' },
];

export const DEFAULT_ZONE_STATES: Record<string, ZoneState> = {
  lobby: 'normal',
  open_space: 'normal',
  meeting_room: 'normal',
  war_room: 'normal',
  pantry: 'normal',
  break_area: 'normal',
};

export function createOfficeSlots(): Slot[] {
  const slots: Slot[] = [];

  // 7 desks in open_space
  const deskPositions: Vec3[] = [
    { x: -2.5, y: 0, z: -2.5 },
    { x: 0, y: 0, z: -2.5 },
    { x: 2.5, y: 0, z: -2.5 },
    { x: -2.5, y: 0, z: 0.5 },
    { x: 0, y: 0, z: 0.5 },
    { x: 2.5, y: 0, z: 0.5 },
    { x: 0, y: 0, z: 2.2 },
  ];
  deskPositions.forEach((pos, i) => {
    slots.push({ id: `desk_${String(i + 1).padStart(2, '0')}`, zone: 'open_space', pos, occupiedBy: null });
  });

  // Meeting room chairs (4)
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    slots.push({
      id: `meeting_chair_${String(i + 1).padStart(2, '0')}`,
      zone: 'meeting_room',
      pos: { x: 7.5 + Math.cos(angle) * 1, y: 0, z: -4 + Math.sin(angle) * 1 },
      occupiedBy: null,
    });
  }

  // War room chairs (4)
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    slots.push({
      id: `war_room_chair_${String(i + 1).padStart(2, '0')}`,
      zone: 'war_room',
      pos: { x: 7.5 + Math.cos(angle) * 1, y: 0, z: 4 + Math.sin(angle) * 1 },
      occupiedBy: null,
    });
  }

  // Pantry slots
  slots.push({ id: 'pantry_01', zone: 'pantry', pos: { x: -7, y: 0, z: -5 }, occupiedBy: null });
  slots.push({ id: 'pantry_02', zone: 'pantry', pos: { x: -6, y: 0, z: -5 }, occupiedBy: null });

  // Break area
  slots.push({ id: 'break_01', zone: 'break_area', pos: { x: -7, y: 0, z: 5 }, occupiedBy: null });
  slots.push({ id: 'lobby_01', zone: 'lobby', pos: { x: -8, y: 0, z: 0 }, occupiedBy: null });

  return slots;
}

/** Static furniture descriptors for the 3D scene (boxes, no external GLB required for v1) */
export type FurnitureItem = {
  id: string;
  kind: 'desk' | 'chair' | 'table' | 'counter' | 'wall' | 'floor';
  pos: Vec3;
  size: Vec3;
  rotY?: number;
  zone: string;
};

export function getFurniture(): FurnitureItem[] {
  const desks: FurnitureItem[] = [
    { id: 'd1', kind: 'desk', pos: { x: -2.5, y: 0.4, z: -2.5 }, size: { x: 1.2, y: 0.8, z: 0.7 }, zone: 'open_space' },
    { id: 'd2', kind: 'desk', pos: { x: 0, y: 0.4, z: -2.5 }, size: { x: 1.2, y: 0.8, z: 0.7 }, zone: 'open_space' },
    { id: 'd3', kind: 'desk', pos: { x: 2.5, y: 0.4, z: -2.5 }, size: { x: 1.2, y: 0.8, z: 0.7 }, zone: 'open_space' },
    { id: 'd4', kind: 'desk', pos: { x: -2.5, y: 0.4, z: 0.5 }, size: { x: 1.2, y: 0.8, z: 0.7 }, zone: 'open_space' },
    { id: 'd5', kind: 'desk', pos: { x: 0, y: 0.4, z: 0.5 }, size: { x: 1.2, y: 0.8, z: 0.7 }, zone: 'open_space' },
    { id: 'd6', kind: 'desk', pos: { x: 2.5, y: 0.4, z: 0.5 }, size: { x: 1.2, y: 0.8, z: 0.7 }, zone: 'open_space' },
    { id: 'd7', kind: 'desk', pos: { x: 0, y: 0.4, z: 2.2 }, size: { x: 1.2, y: 0.8, z: 0.7 }, zone: 'open_space' },
  ];
  const tables: FurnitureItem[] = [
    { id: 'mt', kind: 'table', pos: { x: 7.5, y: 0.4, z: -4 }, size: { x: 2, y: 0.75, z: 1.2 }, zone: 'meeting_room' },
    { id: 'wt', kind: 'table', pos: { x: 7.5, y: 0.4, z: 4 }, size: { x: 2, y: 0.75, z: 1.2 }, zone: 'war_room' },
    { id: 'pantry_c', kind: 'counter', pos: { x: -7, y: 0.45, z: -4.2 }, size: { x: 2.5, y: 0.9, z: 0.6 }, zone: 'pantry' },
  ];
  return [...desks, ...tables];
}
