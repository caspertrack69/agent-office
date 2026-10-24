import type { Agent, AgentState, Needs, Vec3 } from './types.ts';
import { ARRIVE_DIST } from './config.ts';

export function makeAgent(partial: Omit<Agent, 'position' | 'heading' | 'velocity' | 'state' | 'needs' | 'goal' | 'targetPos' | 'targetSlotId' | 'memory' | 'currentTaskId' | 'speechUntil' | 'speechText'> & { position?: Vec3 }): Agent {
  return {
    position: partial.position ?? { x: 0, y: 0, z: 0 },
    heading: 0,
    velocity: { x: 0, y: 0, z: 0 },
    state: 'Idle',
    needs: { energy: 0.85, social: 0.6, focus: 0.8 },
    goal: null,
    targetPos: null,
    targetSlotId: null,
    memory: { lastInteractionAt: 0, lastChatPartnerId: null, lastChatAt: -999 },
    currentTaskId: null,
    speechUntil: 0,
    speechText: '',
    ...partial,
  };
}

export function clampNeeds(n: Needs): Needs {
  return {
    energy: Math.max(0, Math.min(1, n.energy)),
    social: Math.max(0, Math.min(1, n.social)),
    focus: Math.max(0, Math.min(1, n.focus)),
  };
}

export function dist2(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function hasArrived(a: Vec3, b: Vec3): boolean {
  return dist2(a, b) <= ARRIVE_DIST;
}

export const STATE_DURATION: Record<AgentState, number> = {
  Idle: 2,
  Walking: 999,
  Working: 999,
  Meeting: 8,
  Chatting: 5,
  Break: 6,
  Responding: 999,
};
