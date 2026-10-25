import { create } from 'zustand';
import type { SimSnapshot, Agent, Task, Alert, SimEvent, Slot } from '../sim/types.ts';

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
  simTime: 0, tick: 0, paused: false, speed: 1,
  agents: [], tasks: [], alerts: [], events: [], slots: [], zoneStates: {},
  setSnapshot(snap) {
    set({
      simTime: snap.simTime, tick: snap.tick, paused: snap.paused, speed: snap.speed,
      agents: snap.agents, tasks: snap.tasks, alerts: snap.alerts, events: snap.events,
      slots: snap.slots, zoneStates: snap.zoneStates,
    });
  },
  setPaused(v) { set({ paused: v }); },
  setSpeed(v) { set({ speed: v }); },
}));

export type RightDrawerKind = 'hq' | 'marketplace' | 'analytics' | 'chat' | 'standup' | 'edit' | null;
export type LeftView = 'home' | 'people' | 'hq';

type UiStore = {
  selectedAgentId: string | null;
  followAgent: boolean;
  topDown: boolean;
  search: string;
  filterState: string;
  filterZone: string;
  leftCollapsed: boolean;
  leftView: LeftView;
  rightDrawer: RightDrawerKind;
  layoutMode: 'default' | 'focus';
  muted: boolean;
  toast: string | null;
  showGrid: boolean;
  showWalls: boolean;
  ambient: number;
  chatLog: { id: string; text: string; at: number }[];
  selectAgent(id: string | null): void;
  setFollow(v: boolean): void;
  setTopDown(v: boolean): void;
  setSearch(v: string): void;
  setFilterState(v: string): void;
  setFilterZone(v: string): void;
  setLeftCollapsed(v: boolean): void;
  setLeftView(v: LeftView): void;
  setRightDrawer(v: RightDrawerKind): void;
  toggleRightDrawer(v: Exclude<RightDrawerKind, null>): void;
  setLayoutMode(v: 'default' | 'focus'): void;
  toggleLayoutMode(): void;
  setMuted(v: boolean): void;
  pushToast(msg: string): void;
  clearToast(): void;
  setShowGrid(v: boolean): void;
  setShowWalls(v: boolean): void;
  setAmbient(v: number): void;
  sendChat(text: string): void;
};

export const useUiStore = create<UiStore>((set) => ({
  selectedAgentId: null,
  followAgent: false,
  topDown: false,
  search: '',
  filterState: '',
  filterZone: '',
  leftCollapsed: false,
  leftView: 'hq',
  rightDrawer: null,
  layoutMode: 'default',
  muted: false,
  toast: null,
  showGrid: true,
  showWalls: true,
  ambient: 1,
  chatLog: [],
  selectAgent: (id) => set({ selectedAgentId: id }),
  setFollow: (v) => set({ followAgent: v }),
  setTopDown: (v) => set({ topDown: v }),
  setSearch: (v) => set({ search: v }),
  setFilterState: (v) => set({ filterState: v }),
  setFilterZone: (v) => set({ filterZone: v }),
  setLeftCollapsed: (v) => set({ leftCollapsed: v }),
  setLeftView: (v) => set({ leftView: v, leftCollapsed: false }),
  setRightDrawer: (v) => set({ rightDrawer: v }),
  toggleRightDrawer: (v) => set((s) => ({ rightDrawer: s.rightDrawer === v ? null : v })),
  setLayoutMode: (v) => set({ layoutMode: v }),
  toggleLayoutMode: () => set((s) => ({ layoutMode: s.layoutMode === 'default' ? 'focus' : 'default' })),
  setMuted: (v) => set({ muted: v }),
  pushToast: (msg) => {
    set({ toast: msg });
    window.setTimeout(() => set((cur) => (cur.toast === msg ? { toast: null } : {})), 2200);
  },
  clearToast: () => set({ toast: null }),
  setShowGrid: (v) => set({ showGrid: v }),
  setShowWalls: (v) => set({ showWalls: v }),
  setAmbient: (v) => set({ ambient: v }),
  sendChat: (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    set((s) => ({
      chatLog: [...s.chatLog.slice(-99), { id: `chat_${Date.now()}_${s.chatLog.length}`, text: trimmed, at: Date.now() }],
    }));
  },
}));
