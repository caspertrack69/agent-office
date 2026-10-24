/**
 * Web Worker entry — fixed 20 Hz tick with accumulator, Comlink API.
 * Speed changes tick count per wall-clock, not dt (brief §6).
 */
import * as Comlink from 'comlink';
import { SimWorld } from '../sim/world.ts';
import type { SimSnapshot, ExternalEvent } from '../sim/types.ts';
import { createOfficeSlots } from '../data/office.layout.ts';
import { createDefaultAgents } from '../data/personas/index.ts';
import { defaultScenarios } from '../data/scenarios/index.ts';

const TICK_MS = 50; // 20 Hz

let world: SimWorld | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let speed = 1;
let paused = false;
let snapshotCb: ((snap: SimSnapshot) => void) | null = null;
let acc = 0;
let last = 0;

function ensureWorld(seed = 42): SimWorld {
  if (world) return world;
  world = new SimWorld({ seed });
  world.slots = createOfficeSlots();
  const agents = createDefaultAgents(world.slots);
  for (const a of agents) {
    const r = world!.addAgent(a);
    if (!r.ok) console.warn(r.error);
  }
  for (const sc of defaultScenarios) world.scenarioEngine.register(sc);
  return world;
}

function loop() {
  if (!world || paused) return;
  const now = performance.now();
  const delta = now - last;
  last = now;
  acc += delta;
  let steps = 0;
  const maxSteps = 8;
  // speed = ticks per wall tick count
  while (acc >= TICK_MS / speed && steps < maxSteps) {
    world.step(1 / 20);
    acc -= TICK_MS / speed;
    steps++;
  }
  if (acc < 0) acc = 0;
  if (steps > 0 && snapshotCb) {
    try { snapshotCb(world.snapshot()); } catch { /* ignore */ }
  }
}

export type SimWorkerApi = {
  init(seed?: number): void;
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  setSpeed(v: number): void;
  reset(): void;
  triggerScenario(id: string): void;
  createTask(title: string, opts?: Record<string, unknown>): void;
  assignTask(taskId: string, agentId: string): boolean;
  updatePersona(agentId: string, patch: Record<string, unknown>): boolean;
  setPresence(agentId: string, status: string): void;
  loadSnapshot(snap: SimSnapshot): void;
  getSnapshot(): SimSnapshot;
  handleExternal(evt: ExternalEvent): void;
  subscribe(cb: (snap: SimSnapshot) => void): void;
};

const api: SimWorkerApi = {
  init(seed) { ensureWorld(seed); },
  start() {
    ensureWorld();
    if (timer) clearInterval(timer);
    last = performance.now();
    acc = 0;
    timer = setInterval(loop, TICK_MS / 2);
  },
  stop() {
    if (timer) clearInterval(timer);
    timer = null;
  },
  pause() { paused = true; if (world) world.paused = true; },
  resume() { paused = false; if (world) world.paused = false; last = performance.now(); },
  setSpeed(v) { speed = v; if (world) world.speed = v; },
  reset() { world?.reset(); },
  triggerScenario(id) { if (world) world.scenarioEngine.start(world, id); },
  createTask(title, opts) {
    if (!world) return;
    // Use static import-resolved helper to avoid worker bundle cycle warning
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    void (async () => {
      const { createTask: mk } = await import('../sim/task.ts');
      if (!world) return;
      const t = mk(title, (opts ?? {}) as never);
      world.tasks.push(t);
    })();
  },
  assignTask(taskId, agentId) { return world ? world.assignTask(taskId, agentId) : false; },
  updatePersona(agentId, patch) { return world ? world.updatePersona(agentId, patch as never) : false; },
  setPresence(agentId, status) {
    if (!world) return;
    const ag = world.agents.find((a) => a.id === agentId);
    if (ag) ag.presence = status as never;
  },
  loadSnapshot(snap) { ensureWorld().restore(snap); },
  getSnapshot() { return ensureWorld().snapshot(); },
  handleExternal(evt) { world?.handleExternalEvent(evt); },
  subscribe(cb) { snapshotCb = cb; },
};

Comlink.expose(api);
