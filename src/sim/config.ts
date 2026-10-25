/**
 * Central simulation constants.
 * Single source of truth for tick rate, agent limits, and speeds.
 */
export const MAX_AGENTS = 7 as const;

export const TICK_HZ = 20 as const;
export const TICK_DT = 1 / TICK_HZ; // 0.05s

/** Real-time ticks per frame multiplier (x1/x2/x4). Applied as tick count, not dt. */
export const SIM_SPEEDS = [1, 2, 4] as const;
export type SimSpeed = (typeof SIM_SPEEDS)[number];

export const SCHEMA_VERSION = 1 as const;

export const EVENT_LOG_MAX = 200 as const;
export const AUTOSAVE_INTERVAL_MS = 10_000 as const;

/** Agent visual radius for separation */
export const AGENT_RADIUS = 0.35 as const;
export const AGENT_SPEED = 2.2 as const; // m/s in sim units
export const ARRIVE_DIST = 0.25 as const;

export const NEEDS_DECAY = {
  energy: 0.0004,
  social: 0.0007,
  focus: 0.0005,
} as const;

export const TASK_PROGRESS_RATE = 0.08 as const; // per second at Working
