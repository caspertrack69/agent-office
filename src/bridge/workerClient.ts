/**
 * Main-thread client for the simulation worker.
 * Falls back to in-thread SimWorld when Worker is unavailable (tests / SSR).
 */
import * as Comlink from 'comlink';
import type { SimSnapshot, ExternalEvent } from '../sim/types.ts';
import type { SimWorkerApi } from './worker.ts';

export type WorkerClient = {
  start(): void;
  stop(): void;
  pause(): Promise<void>;
  resume(): Promise<void>;
  setSpeed(v: number): Promise<void>;
  reset(): Promise<void>;
  triggerScenario(id: string): Promise<void>;
  createTask(title: string, opts?: Record<string, unknown>): Promise<void>;
  assignTask(taskId: string, agentId: string): Promise<boolean>;
  updatePersona(agentId: string, patch: Record<string, unknown>): Promise<boolean>;
  setPresence(agentId: string, status: string): Promise<void>;
  loadSnapshot(snap: SimSnapshot): Promise<void>;
  getSnapshot(): Promise<SimSnapshot>;
  handleExternal(evt: ExternalEvent): Promise<void>;
  onSnapshot(cb: (snap: SimSnapshot) => void): () => void;
  onEventLog(cb: (events: SimSnapshot['events']) => void): () => void;
  dispose(): void;
};

function createInlineClient(seed: number): WorkerClient {
  // Dynamic import to avoid bundling worker in tests that don't need it
  let world: InstanceType<typeof import('../sim/world.ts').SimWorld> | null = null;
  let timer: number | null = null;
  const snapshotCbs = new Set<(s: SimSnapshot) => void>();

  async function ensureWorld() {
    if (world) return world;
    const { SimWorld } = await import('../sim/world.ts');
    const { createOfficeSlots } = await import('../data/office.layout.ts');
    const { createDefaultAgents } = await import('../data/personas/index.ts');
    const { defaultScenarios } = await import('../data/scenarios/index.ts');
    world = new SimWorld({ seed });
    world.slots = createOfficeSlots();
    for (const a of createDefaultAgents(world.slots)) {
      const r = world.addAgent(a);
      if (!r.ok) console.warn(r.error);
    }
    for (const sc of defaultScenarios) world.scenarioEngine.register(sc);
    return world;
  }

  const TICK_MS = 50;
  let acc = 0;
  let last = performance.now();
  let speed = 1;
  let paused = false;

  function loop() {
    if (paused || !world) return;
    const now = performance.now();
    const delta = now - last;
    last = now;
    acc += delta;
    const steps = Math.min(8, Math.floor((acc / TICK_MS) * speed));
    for (let i = 0; i < steps; i++) {
      world.step(1 / 20);
      acc -= TICK_MS / speed;
    }
    if (acc < 0) acc = 0;
    if (steps > 0) {
      const snap = world.snapshot();
      for (const cb of snapshotCbs) cb(snap);
    }
  }

  return {
    start() {
      void ensureWorld().then(() => {
        last = performance.now();
        timer = window.setInterval(loop, TICK_MS / 2);
      });
    },
    stop() {
      if (timer != null) window.clearInterval(timer);
      timer = null;
    },
    async pause() { paused = true; const w = await ensureWorld(); w.paused = true; },
    async resume() { paused = false; const w = await ensureWorld(); w.paused = false; last = performance.now(); },
    async setSpeed(v) { speed = v; const w = await ensureWorld(); w.speed = v; },
    async reset() { const w = await ensureWorld(); w.reset(); },
    async triggerScenario(id) { const w = await ensureWorld(); w.scenarioEngine.start(w, id); },
    async createTask(title, opts) {
      const w = await ensureWorld();
      const { createTask } = await import('../sim/task.ts');
      const t = createTask(title, opts as never);
      w.tasks.push(t);
    },
    async assignTask(taskId, agentId) { const w = await ensureWorld(); return w.assignTask(taskId, agentId); },
    async updatePersona(agentId, patch) { const w = await ensureWorld(); return w.updatePersona(agentId, patch as never); },
    async setPresence(agentId, status) {
      const w = await ensureWorld();
      const ag = w.agents.find((a) => a.id === agentId);
      if (ag) ag.presence = status as never;
    },
    async loadSnapshot(snap) { const w = await ensureWorld(); w.restore(snap); },
    async getSnapshot() { const w = await ensureWorld(); return w.snapshot(); },
    async handleExternal(evt) { const w = await ensureWorld(); w.handleExternalEvent(evt); },
    onSnapshot(cb) { snapshotCbs.add(cb); return () => snapshotCbs.delete(cb); },
    onEventLog(cb: (events: SimSnapshot['events']) => void) {
      const self = this as unknown as WorkerClient;
      const off = self.onSnapshot((s: SimSnapshot) => cb(s.events));
      return off;
    },
    dispose() { this.stop(); },
  };
}

export async function createWorkerClient(opts?: { seed?: number; forceInline?: boolean }): Promise<WorkerClient> {
  const seed = opts?.seed ?? 42;
  const canWorker = typeof Worker !== 'undefined' && !opts?.forceInline;

  if (!canWorker) return createInlineClient(seed);

  try {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    const api = Comlink.wrap<SimWorkerApi>(worker);

    // init
    await api.init(seed);

    const snapshotCbs = new Set<(s: SimSnapshot) => void>();
    // subscribe via Comlink callback
    const onSnap = Comlink.proxy((snap: SimSnapshot) => {
      for (const cb of snapshotCbs) cb(snap);
    });
    await api.subscribe(onSnap);

    return {
      start() { void api.start(); },
      stop() { void api.stop(); },
      pause: () => api.pause(),
      resume: () => api.resume(),
      setSpeed: (v) => api.setSpeed(v),
      reset: () => api.reset(),
      triggerScenario: (id) => api.triggerScenario(id),
      createTask: (title, o) => api.createTask(title, o as never),
      assignTask: (a, b) => api.assignTask(a, b),
      updatePersona: (a, b) => api.updatePersona(a, b as never),
      setPresence: (a, b) => api.setPresence(a, b as never),
      loadSnapshot: (s) => api.loadSnapshot(s),
      getSnapshot: () => api.getSnapshot(),
      handleExternal: (e) => api.handleExternal(e),
      onSnapshot(cb: (s: SimSnapshot) => void) { snapshotCbs.add(cb); return () => snapshotCbs.delete(cb); },
      onEventLog(cb: (events: SimSnapshot['events']) => void) {
        const self = this as unknown as WorkerClient;
        const off = self.onSnapshot((s: SimSnapshot) => cb(s.events));
        return off;
      },
      dispose() { worker.terminate(); },
    };
  } catch {
    return createInlineClient(seed);
  }
}
