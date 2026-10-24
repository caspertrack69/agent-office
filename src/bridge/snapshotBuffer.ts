/**
 * Snapshot interpolation buffer — keeps last two position snapshots
 * and provides lerp for useFrame rendering.
 * Positions are NOT stored in Zustand — read directly from refs.
 */
import type { Vec3 } from '../sim/types.ts';

export type AgentFrame = {
  id: string;
  x: number; z: number; heading: number;
  vx: number; vz: number;
  state: string;
};

export type InterpSnapshot = {
  simTime: number;
  tick: number;
  agents: AgentFrame[];
};

export class SnapshotBuffer {
  private prev: InterpSnapshot | null = null;
  private curr: InterpSnapshot | null = null;
  private currTime = 0;

  push(snap: InterpSnapshot): void {
    this.prev = this.curr;
    this.curr = snap;
    this.currTime = performance.now();
  }

  /** lerp factor 0-1 based on time since last snapshot vs tick interval */
  alpha(tickDtMs = 50): number {
    if (!this.prev || !this.curr) return 1;
    const elapsed = performance.now() - this.currTime;
    return Math.min(1, Math.max(0, elapsed / tickDtMs));
  }

  /** Interpolated positions */
  lerp(alpha: number): Map<string, { pos: Vec3; heading: number; vel: Vec3; state: string }> {
    const out = new Map<string, { pos: Vec3; heading: number; vel: Vec3; state: string }>();
    if (!this.curr) return out;
    if (!this.prev) {
      for (const a of this.curr.agents) {
        out.set(a.id, { pos: { x: a.x, y: 0, z: a.z }, heading: a.heading, vel: { x: a.vx, y: 0, z: a.vz }, state: a.state });
      }
      return out;
    }
    const prevMap = new Map(this.prev.agents.map((a) => [a.id, a]));
    for (const c of this.curr.agents) {
      const p = prevMap.get(c.id);
      if (!p) {
        out.set(c.id, { pos: { x: c.x, y: 0, z: c.z }, heading: c.heading, vel: { x: c.vx, y: 0, z: c.vz }, state: c.state });
        continue;
      }
      const x = p.x + (c.x - p.x) * alpha;
      const z = p.z + (c.z - p.z) * alpha;
      // shortest angle lerp for heading
      let dh = c.heading - p.heading;
      dh = Math.atan2(Math.sin(dh), Math.cos(dh));
      const heading = p.heading + dh * alpha;
      out.set(c.id, { pos: { x, y: 0, z }, heading, vel: { x: c.vx, y: 0, z: c.vz }, state: c.state });
    }
    return out;
  }

  get current(): InterpSnapshot | null { return this.curr; }
}

/** Build InterpSnapshot from SimSnapshot */
export function toInterpSnapshot(snap: { simTime: number; tick: number; agents: { id: string; position: Vec3; heading: number; velocity: Vec3; state: string }[] }): InterpSnapshot {
  return {
    simTime: snap.simTime,
    tick: snap.tick,
    agents: snap.agents.map((a) => ({
      id: a.id,
      x: a.position.x, z: a.position.z,
      heading: a.heading,
      vx: a.velocity.x, vz: a.velocity.z,
      state: a.state,
    })),
  };
}

/** Float32 packing for transferable path: [agentCount, ...perAgent: x,z,heading,vx,vz,stateIdx] */
export function packPositions(agents: { position: Vec3; heading: number; velocity: Vec3; state: string }[], stateOrder: string[]): Float32Array {
  const stride = 6;
  const buf = new Float32Array(1 + agents.length * stride);
  buf[0] = agents.length;
  const map = new Map(stateOrder.map((s, i) => [s, i]));
  for (let i = 0; i < agents.length; i++) {
    const a = agents[i]!;
    const o = 1 + i * stride;
    buf[o] = a.position.x;
    buf[o + 1] = a.position.z;
    buf[o + 2] = a.heading;
    buf[o + 3] = a.velocity.x;
    buf[o + 4] = a.velocity.z;
    buf[o + 5] = map.get(a.state) ?? 0;
  }
  return buf;
}
