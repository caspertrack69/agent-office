/**
 * Zustand stores — low-frequency state only (brief §5).
 * Per-frame positions live in SnapshotBuffer, not here.
 */
import { create } from 'zustand';
import type { SimSnapshot, Agent, Task, Alert, SimEvent, Slot } from '../sim/types.ts';

// ——— Sim snapshot meta (low frequency) ———
type SimMeta = {
  simTime: number;
  tick: number;
  paused: boolean;
  speed: number;
  agents: Agent[];
  tasks: Task[];
  alerts: Alert[];
  events: SimEvent[];
  slots: Slot[];
  zoneStates: Record<string, string>;
};

type SimStore = SimMeta & {
  setSnapshot(snap: SimSnapshot): void;
  setPaused(v: boolean): void;
  setSpeed(v: number): void;
};

export const useSimStore = create<SimStore>((set) => ({
  simTime: 0,
  tick: 0,
  paused: false,
  speed: 1,
  agents: [],
  tasks: [],
  alerts: [],
  events: [],
  slots: [],
  zoneStates: {},
  setSnapshot(snap) {
    set({
      simTime: snap.simTime,
      tick: snap.tick,
      paused: snap.paused,
      speed: snap.speed,
      agents: snap.agents,
      tasks: snap.tasks,
      alerts: snap.alerts,
      events: snap.events,
      slots: snap.slots,
      zoneStates: snap.zoneStates,
    });
  },
  setPaused(v) { set({ paused: v }); },
  setSpeed(v) { set({ speed: v }); },
}));

// ——— UI selection ———
type UiStore = {
  selectedAgentId: string | null;
  followAgent: boolean;
  topDown: boolean;
  search: string;
  filterState: string;
  filterZone: string;
  selectAgent(id: string | null): void;
  setFollow(v: boolean): void;
  setTopDown(v: boolean): void;
  setSearch(v: string): void;
  setFilterState(v: string): void;
  setFilterZone(v: string): void;
};

export const useUiStore = create<UiStore>((set) => ({
  selectedAgentId: null,
  followAgent: false,
  topDown: false,
  search: '',
  filterState: '',
  filterZone: '',
  selectAgent: (id) => set({ selectedAgentId: id }),
  setFollow: (v) => set({ followAgent: v }),
  setTopDown: (v) => set({ topDown: v }),
  setSearch: (v) => set({ search: v }),
  setFilterState: (v) => set({ filterState: v }),
  setFilterZone: (v) => set({ filterZone: v }),
}));
