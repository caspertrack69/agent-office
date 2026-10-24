/**
 * Single source of truth for simulation state.
 * Pure TS — no DOM/React. Deterministic given seed + command sequence.
 */
import type { Agent, Alert, Goal, SimEvent, SimSnapshot, Slot, Task, Vec3, ZoneState, ScenarioRuntime, SimEventSeverity } from './types.ts';
import { SeededRng } from './rng.ts';
import { MAX_AGENTS, NEEDS_DECAY, TASK_PROGRESS_RATE, AGENT_SPEED, EVENT_LOG_MAX } from './config.ts';
import { EventBus, createEvent } from './events.ts';
import { clampNeeds, dist2, hasArrived } from './agent.ts';
import { UtilityBrain, desiredVelocity, type Brain } from './brain/index.ts';
import { SimpleNavMesh, type NavMesh } from './nav/index.ts';
import { ScenarioEngine } from './scenario/engine.ts';
import type { ExternalEvent } from './types.ts';
import { StubExternalSource } from './adapters/externalSource.ts';

export type WorldOptions = {
  seed?: number;
  brain?: Brain;
  nav?: NavMesh;
};

export class SimWorld {
  simTime = 0;
  tick = 0;
  paused = false;
  speed: number = 1;
  rng: SeededRng;
  agents: Agent[] = [];
  tasks: Task[] = [];
  slots: Slot[] = [];
  alerts: Alert[] = [];
  zoneStates: Record<string, ZoneState> = {};
  scenarioRuntimes: ScenarioRuntime[] = [];
  brain: Brain;
  nav: NavMesh;
  scenarioEngine: ScenarioEngine;
  externalSource = new StubExternalSource();
  private eventBus = new EventBus(EVENT_LOG_MAX);
  private alertCounter = 0;

  constructor(opts: WorldOptions = {}) {
    this.rng = new SeededRng(opts.seed ?? 12345);
    this.brain = opts.brain ?? new UtilityBrain();
    this.nav = opts.nav ?? new SimpleNavMesh();
    this.scenarioEngine = new ScenarioEngine();
  }

  // ——— Agents ———
  addAgent(agent: Agent): { ok: true } | { ok: false; error: string } {
    if (this.agents.length >= MAX_AGENTS) {
      return { ok: false, error: `MAX_AGENTS (${MAX_AGENTS}) reached — cannot spawn more agents` };
    }
    if (this.agents.some((a) => a.id === agent.id)) {
      return { ok: false, error: `Agent id ${agent.id} already exists` };
    }
    this.agents.push(agent);
    return { ok: true };
  }

  removeAgent(id: string): void {
    this.agents = this.agents.filter((a) => a.id !== id);
    // free slots
    for (const s of this.slots) if (s.occupiedBy === id) s.occupiedBy = null;
  }

  updatePersona(agentId: string, patch: Partial<Pick<Agent, 'name' | 'role' | 'persona' | 'responsibilities' | 'preferredZones' | 'kind'>>): boolean {
    const ag = this.agents.find((a) => a.id === agentId);
    if (!ag) return false;
    if (patch.name != null) ag.name = patch.name;
    if (patch.role != null) ag.role = patch.role;
    if (patch.persona != null) ag.persona = patch.persona;
    if (patch.responsibilities != null) ag.responsibilities = patch.responsibilities;
    if (patch.preferredZones != null) ag.preferredZones = patch.preferredZones;
    if (patch.kind != null) ag.kind = patch.kind;
    this.pushEvent('info', `Persona updated: ${ag.name}`, { agentId });
    return true;
  }

  // ——— Slots ———
  tryReserveSlot(agentId: string, slotId: string): boolean {
    const slot = this.slots.find((s) => s.id === slotId);
    if (!slot) return false;
    if (slot.occupiedBy && slot.occupiedBy !== agentId) return false;
    // free previous
    for (const s of this.slots) if (s.occupiedBy === agentId) s.occupiedBy = null;
    slot.occupiedBy = agentId;
    const ag = this.agents.find((a) => a.id === agentId);
    if (ag) ag.targetSlotId = slotId;
    return true;
  }

  releaseSlots(agentId: string): void {
    for (const s of this.slots) if (s.occupiedBy === agentId) s.occupiedBy = null;
    const ag = this.agents.find((a) => a.id === agentId);
    if (ag) ag.targetSlotId = null;
  }

  assignGoal(agentId: string, goal: Goal): void {
    const ag = this.agents.find((a) => a.id === agentId);
    if (!ag) return;
    ag.goal = goal;
    if (goal.kind === 'goto' || goal.kind === 'gotoZone' || goal.kind === 'meeting' || goal.kind === 'break') {
      ag.targetPos = goal.pos;
      ag.state = 'Walking';
      // try reserve
      if ('slotId' in goal && goal.slotId) this.tryReserveSlot(agentId, goal.slotId);
    } else if (goal.kind === 'work') {
      const slot = this.slots.find((s) => s.id === goal.slotId);
      ag.targetPos = slot?.pos ?? ag.position;
      ag.currentTaskId = goal.taskId;
      ag.state = 'Walking';
      this.tryReserveSlot(agentId, goal.slotId);
    } else if (goal.kind === 'chat') {
      ag.targetPos = goal.pos;
      ag.state = 'Walking';
    } else {
      ag.targetPos = null;
      ag.state = 'Idle';
    }
  }

  // ——— Tasks ———
  createTaskDirect(task: Task): void {
    this.tasks.push(task);
  }

  assignTask(taskId: string, agentId: string): boolean {
    const t = this.tasks.find((x) => x.id === taskId);
    const ag = this.agents.find((a) => a.id === agentId);
    if (!t || !ag) return false;
    t.assigneeId = agentId;
    if (t.status === 'todo') t.status = 'in_progress';
    return true;
  }

  // ——— Alerts & events ———
  addAlert(severity: Alert['severity'], message: string, source: string): Alert {
    const alert: Alert = { id: `alert_${Date.now()}_${this.alertCounter++}`, severity, message, source, createdAt: this.simTime };
    this.alerts.push(alert);
    this.pushEvent(severity, message);
    return alert;
  }

  pushEvent(severity: SimEventSeverity, message: string, extra?: Partial<Pick<SimEvent, 'agentId' | 'taskId'>>): SimEvent {
    const e = createEvent(this.simTime, severity, message, extra);
    this.eventBus.push(e);
    return e;
  }

  getEvents(): SimEvent[] {
    return this.eventBus.all();
  }

  // ——— External ———
  handleExternalEvent(evt: ExternalEvent): void {
    this.externalSource.onEvent(this, evt);
  }

  // ——— Core tick (fixed dt) ———
  step(dt: number): void {
    if (this.paused) return;
    this.simTime += dt;
    this.tick++;

    // Scenario engine
    this.scenarioEngine.tick(this, dt);

    // Per-agent update
    for (const ag of this.agents) {
      this.updateAgent(ag, dt);
    }
  }

  private updateAgent(ag: Agent, dt: number): void {
    // Needs decay
    ag.needs.energy = Math.max(0, ag.needs.energy - NEEDS_DECAY.energy * dt * 20);
    ag.needs.social = Math.max(0, ag.needs.social - NEEDS_DECAY.social * dt * 20);
    ag.needs.focus = Math.max(0, ag.needs.focus - NEEDS_DECAY.focus * dt * 20);
    ag.needs = clampNeeds(ag.needs);

    // Movement
    if (ag.targetPos && (ag.state === 'Walking' || ag.state === 'Responding' || ag.state === 'Meeting')) {
      const others = this.agents.filter((a) => a.id !== ag.id).map((a) => a.position);
      const vel = this.nav.steer(ag.position, ag.targetPos, AGENT_SPEED, others);
      if (vel == null || hasArrived(ag.position, ag.targetPos)) {
        // arrived
        ag.position = { ...ag.targetPos };
        ag.velocity = { x: 0, y: 0, z: 0 };
        ag.targetPos = null;
        // transition
        if (ag.goal?.kind === 'work') {
          ag.state = 'Working';
        } else if (ag.goal?.kind === 'chat') {
          ag.state = 'Chatting';
          ag.speechText = this.pickChatLine();
          ag.speechUntil = this.simTime + 3 + this.rng.next() * 2;
          ag.memory.lastChatAt = this.simTime;
          ag.memory.lastChatPartnerId = ag.goal.partnerId;
          ag.needs.social = Math.min(1, ag.needs.social + 0.25);
        } else if (ag.goal?.kind === 'meeting') {
          ag.state = 'Meeting';
          ag.speechText = '▮ war room';
          ag.speechUntil = this.simTime + 5;
        } else if (ag.goal?.kind === 'break') {
          ag.state = 'Break';
          ag.needs.energy = Math.min(1, ag.needs.energy + 0.02);
          ag.needs.social = Math.min(1, ag.needs.social + 0.02);
        } else {
          ag.state = 'Idle';
        }
      } else {
        ag.velocity = vel;
        ag.position = {
          x: ag.position.x + vel.x * dt,
          y: ag.position.y,
          z: ag.position.z + vel.z * dt,
        };
        ag.position = this.nav.clampToWalkable(ag.position);
        // heading toward velocity
        ag.heading = Math.atan2(vel.x, vel.z);
      }
    } else {
      ag.velocity = { x: 0, y: 0, z: 0 };
    }

    // State-driven progress
    if (ag.state === 'Working' && ag.currentTaskId) {
      const task = this.tasks.find((t) => t.id === ag.currentTaskId);
      if (task && task.status !== 'done') {
        const rate = TASK_PROGRESS_RATE * (0.7 + ag.needs.focus * 0.6) * dt;
        task.progress = Math.min(1, task.progress + rate);
        if (task.progress >= 1) {
          task.status = 'done';
          this.pushEvent('info', `${ag.name} completed: ${task.title}`, { agentId: ag.id, taskId: task.id });
          ag.currentTaskId = null;
          ag.state = 'Idle';
          ag.goal = null;
          ag.needs.focus = Math.max(0, ag.needs.focus - 0.1);
          this.releaseSlots(ag.id);
        } else if (task.status === 'todo') {
          task.status = 'in_progress';
        }
      } else {
        ag.state = 'Idle';
      }
    }

    // Timed state exits
    if (ag.state === 'Chatting' && this.simTime > ag.speechUntil) {
      ag.state = 'Idle';
      ag.goal = null;
    }
    if (ag.state === 'Break') {
      // recover a bit each tick; after a few seconds return to idle
      if (this.rng.next() < 0.02) {
        ag.state = 'Idle';
        ag.goal = null;
        this.releaseSlots(ag.id);
      }
    }
    if (ag.state === 'Meeting' && this.rng.next() < 0.01) {
      // 1% chance per tick to finish meeting
      ag.state = 'Idle';
      ag.goal = null;
    }
    if (ag.state === 'Idle') {
      // Occasionally pick a new goal via brain
      if (this.rng.next() < 0.02) {
        const g = this.brain.decide(ag, {
          simTime: this.simTime,
          rng: this.rng,
          tasks: this.tasks,
          slots: this.slots,
          agents: this.agents,
          zoneStates: this.zoneStates,
          activeAlertCount: this.alerts.length,
        });
        if (g) this.assignGoal(ag.id, g);
      }
      // small wander
      if (!ag.targetPos && this.rng.next() < 0.005) {
        const wander: Vec3 = {
          x: ag.position.x + (this.rng.next() - 0.5) * 4,
          y: 0,
          z: ag.position.z + (this.rng.next() - 0.5) * 4,
        };
        ag.targetPos = this.nav.clampToWalkable(wander);
        ag.state = 'Walking';
        ag.goal = { kind: 'goto', slotId: '', pos: ag.targetPos };
      }
    }

    // Clamp heading normalize
    if (ag.velocity.x !== 0 || ag.velocity.z !== 0) {
      void desiredVelocity;
    }
    // speech expiry
    if (ag.speechUntil > 0 && this.simTime > ag.speechUntil) {
      ag.speechText = '';
      ag.speechUntil = 0;
    }
    // energy crash → break
    if (ag.needs.energy < 0.12 && ag.state !== 'Break' && ag.state !== 'Walking') {
      const rest = this.slots.find((s) => s.zone === 'pantry' && !s.occupiedBy);
      if (rest) this.assignGoal(ag.id, { kind: 'break', zone: 'pantry', pos: rest.pos });
    }
  }

  private pickChatLine(): string {
    const lines = ['cek log?', 'kopi dulu ☕', 'review PR ya', 'deploy jam 3?', 'nice catch!', 'on it 👍'];
    return this.rng.pick(lines);
  }

  snapshot(): SimSnapshot {
    return {
      simTime: this.simTime,
      tick: this.tick,
      agents: structuredClone(this.agents),
      tasks: structuredClone(this.tasks),
      slots: structuredClone(this.slots),
      alerts: structuredClone(this.alerts),
      events: this.eventBus.all(),
      zoneStates: { ...this.zoneStates },
      scenarios: structuredClone(this.scenarioRuntimes),
      rngState: this.rng.getState(),
      paused: this.paused,
      speed: this.speed,
    };
  }

  restore(snap: SimSnapshot): void {
    this.simTime = snap.simTime;
    this.tick = snap.tick;
    this.agents = structuredClone(snap.agents);
    this.tasks = structuredClone(snap.tasks);
    this.slots = structuredClone(snap.slots);
    this.alerts = structuredClone(snap.alerts);
    this.eventBus.replace(snap.events);
    this.zoneStates = { ...snap.zoneStates };
    this.scenarioRuntimes = structuredClone(snap.scenarios);
    this.rng = SeededRng.fromState(snap.rngState);
    this.paused = snap.paused;
    this.speed = snap.speed;
  }

  reset(): void {
    this.simTime = 0;
    this.tick = 0;
    this.alerts = [];
    this.zoneStates = {};
    this.scenarioRuntimes = [];
    this.eventBus.clear();
    for (const s of this.slots) s.occupiedBy = null;
    for (const ag of this.agents) {
      ag.state = 'Idle';
      ag.goal = null;
      ag.targetPos = null;
      ag.targetSlotId = null;
      ag.currentTaskId = null;
      ag.velocity = { x: 0, y: 0, z: 0 };
      ag.needs = { energy: 0.85, social: 0.6, focus: 0.8 };
      ag.speechText = '';
      ag.speechUntil = 0;
      // return to desk
      const desk = this.slots.find((sl) => sl.id === ag.deskSlot);
      if (desk) ag.position = { ...desk.pos };
    }
    for (const t of this.tasks) {
      t.progress = 0;
      t.status = 'todo';
    }
  }

  // Light helper for distance
  distance(a: Vec3, b: Vec3): number {
    return dist2(a, b);
  }
}
