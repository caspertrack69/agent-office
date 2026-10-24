/**
 * Navigation abstraction. v1 uses direct steering + separation (no heavy navmesh bake
 * required for the 7-agent box office). The interface mirrors recast-navigation so
 * it can be swapped to real navmesh/crowd later without touching world.ts.
 *
 * Keeps recast-navigation as optional enhancement — we lazily try to init it
 * if available, otherwise fall back to steering.
 */
import type { Vec3 } from '../types.ts';

export interface NavMesh {
  /** Returns next steering velocity toward target, or null if arrived */
  steer(from: Vec3, to: Vec3, speed: number, others: Vec3[]): Vec3 | null;
  clampToWalkable(p: Vec3): Vec3;
}

/** Axis-aligned office bounds (walkable area) */
export const OFFICE_BOUNDS = {
  minX: -10,
  maxX: 10,
  minZ: -8,
  maxZ: 8,
} as const;

export class SimpleNavMesh implements NavMesh {
  clampToWalkable(p: Vec3): Vec3 {
    return {
      x: Math.max(OFFICE_BOUNDS.minX, Math.min(OFFICE_BOUNDS.maxX, p.x)),
      y: p.y,
      z: Math.max(OFFICE_BOUNDS.minZ, Math.min(OFFICE_BOUNDS.maxZ, p.z)),
    };
  }

  steer(from: Vec3, to: Vec3, speed: number, others: Vec3[]): Vec3 | null {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.2) return null;

    let vx = (dx / dist) * speed;
    let vz = (dz / dist) * speed;

    // Simple separation from others
    for (const o of others) {
      const ox = from.x - o.x;
      const oz = from.z - o.z;
      const d2 = ox * ox + oz * oz;
      if (d2 < 1.2 && d2 > 0.001) {
        const d = Math.sqrt(d2);
        const push = (1.2 - d) * 1.5;
        vx += (ox / d) * push;
        vz += (oz / d) * push;
      }
    }

    // Clamp magnitude
    const mag = Math.sqrt(vx * vx + vz * vz);
    if (mag > speed) {
      vx = (vx / mag) * speed;
      vz = (vz / mag) * speed;
    }
    return { x: vx, y: 0, z: vz };
  }
}

/**
 * Attempt to initialise recast-navigation crowd for future use.
 * Returns null on failure — caller keeps SimpleNavMesh.
 * Import is dynamic so bundling stays light; recast is excluded from optimizeDeps.
 */
export async function tryCreateRecastNav(): Promise<unknown | null> {
  try {
    const mod = await import('recast-navigation');
    // Lightweight probe: check expected exports exist
    if (mod && typeof mod === 'object') return mod;
    return null;
  } catch {
    return null;
  }
}
