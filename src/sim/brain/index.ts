/**
 * Pluggable Brain interface + default Utility AI implementation.
 * No DOM/React imports — pure sim logic.
 */
import type { Agent, Goal, Task, Slot, Vec3 } from '../types.ts';
import { dist2 } from '../agent.ts';
import { PRIORITY_WEIGHT } from '../task.ts';
import type { SeededRng } from '../rng.ts';

export interface Brain {
  decide(agent: Agent, ctx: BrainContext): Goal | null;
}

export type BrainContext = {
  simTime: number;
  rng: SeededRng;
  tasks: Task[];
  slots: Slot[];
  agents: Agent[];
  zoneStates: Record<string, string>;
  activeAlertCount: number;
};

/** Utility-scored candidate */
type Scored = { goal: Goal; score: number };

export class UtilityBrain implements Brain {
  decide(agent: Agent, ctx: BrainContext): Goal | null {
    // Presence overrides
    if (agent.presence === 'offline') return { kind: 'idle' };
    if (agent.presence === 'busy') {
      // stay at desk working
      const desk = ctx.slots.find((s) => s.id === agent.deskSlot);
      if (desk) return { kind: 'work', taskId: agent.currentTaskId ?? '', slotId: desk.id };
      return { kind: 'idle' };
    }
    if (agent.presence === 'away') {
      const pantry = ctx.slots.find((s) => s.zone === 'pantry' && !s.occupiedBy);
      if (pantry) return { kind: 'break', zone: 'pantry', pos: pantry.pos };
      const free = ctx.slots.find((s) => !s.occupiedBy);
      if (free) return { kind: 'goto', slotId: free.id, pos: free.pos };
    }

    const candidates: Scored[] = [];

    // Existing assigned task — high weight
    const myTasks = ctx.tasks.filter(
      (t) => t.assigneeId === agent.id && t.status !== 'done' && t.status !== 'blocked',
    );
    for (const t of myTasks) {
      const slot = this.slotForTask(t, agent, ctx.slots);
      const w = PRIORITY_WEIGHT[t.priority] * 12;
      const d = slot ? dist2(agent.position, slot.pos) : 0;
      const distPenalty = Math.min(d * 0.3, 6);
      const dueBonus = t.dueAt != null && t.dueAt < ctx.simTime + 60 ? 6 : 0;
      candidates.push({
        goal: slot ? { kind: 'work', taskId: t.id, slotId: slot.id } : { kind: 'work', taskId: t.id, slotId: agent.deskSlot },
        score: w - distPenalty + dueBonus + (ctx.activeAlertCount > 0 ? 4 : 0),
      });
    }

    // Unassigned task matching responsibilities/preferred zones
    const unassigned = ctx.tasks.filter((t) => !t.assigneeId && t.status === 'todo');
    for (const t of unassigned) {
      const matchesResp = agent.responsibilities.some((r) => t.title.toLowerCase().includes(r.toLowerCase().split(' ')[0] ?? ''));
      if (!matchesResp && ctx.rng.next() > 0.3) continue;
      const slot = this.slotForTask(t, agent, ctx.slots);
      candidates.push({
        goal: { kind: 'work', taskId: t.id, slotId: slot?.id ?? agent.deskSlot },
        score: PRIORITY_WEIGHT[t.priority] * 4 + (Math.random() * 2),
      });
    }

    // Need-driven goals
    if (agent.needs.social < 0.35 && ctx.simTime - agent.memory.lastChatAt > 20) {
      const partner = ctx.agents.find(
        (a) => a.id !== agent.id && dist2(a.position, agent.position) < 6 && a.state !== 'Working' && a.state !== 'Meeting',
      );
      if (partner) {
        candidates.push({ goal: { kind: 'chat', partnerId: partner.id, pos: partner.position }, score: (1 - agent.needs.social) * 8 });
      } else {
        const pantrySlot = ctx.slots.find((s) => s.zone === 'pantry' && !s.occupiedBy);
        if (pantrySlot) candidates.push({ goal: { kind: 'break', zone: 'pantry', pos: pantrySlot.pos }, score: (1 - agent.needs.social) * 5 });
      }
    }
    if (agent.needs.energy < 0.3) {
      const rest = ctx.slots.find((s) => s.zone === 'break_area' && !s.occupiedBy) ?? ctx.slots.find((s) => s.zone === 'pantry' && !s.occupiedBy);
      if (rest) candidates.push({ goal: { kind: 'break', zone: rest.zone, pos: rest.pos }, score: (1 - agent.needs.energy) * 9 });
    }

    // Alert-driven: if alert active and agent has security/backend role, go to war_room
    if (ctx.activeAlertCount > 0 && (agent.role.toLowerCase().includes('security') || agent.role.toLowerCase().includes('backend'))) {
      const war = ctx.slots.find((s) => s.zone === 'war_room' && !s.occupiedBy);
      if (war) candidates.push({ goal: { kind: 'meeting', zone: 'war_room', pos: war.pos }, score: 10 });
    }

    // Idle / wander
    candidates.push({ goal: { kind: 'idle' }, score: 1 + ctx.rng.next() });

    candidates.sort((a, b) => b.score - a.score);
    return candidates[0]?.goal ?? null;
  }

  private slotForTask(t: Task, agent: Agent, slots: Slot[]): Slot | null {
    if (t.zoneHint) {
      const s = slots.find((sl) => sl.zone === t.zoneHint && !sl.occupiedBy);
      if (s) return s;
    }
    const desk = slots.find((s) => s.id === agent.deskSlot);
    if (desk && !desk.occupiedBy) return desk;
    return slots.find((s) => !s.occupiedBy) ?? null;
  }
}

/** Simple steering helper */
export function desiredVelocity(from: Vec3, to: Vec3, speed: number): Vec3 {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const len = Math.sqrt(dx * dx + dz * dz) || 1;
  return { x: (dx / len) * speed, y: 0, z: (dz / len) * speed };
}
