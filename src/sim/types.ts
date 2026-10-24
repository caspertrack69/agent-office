import type { RngState } from './rng.ts';

export type Vec2 = { x: number; z: number };
export type Vec3 = { x: number; y: number; z: number };

export type AgentKind = 'ai' | 'human';
export type PresenceStatus = 'online' | 'busy' | 'away' | 'offline';

export type AgentState =
  | 'Idle'
  | 'Walking'
  | 'Working'
  | 'Meeting'
  | 'Chatting'
  | 'Break'
  | 'Responding';

export type Needs = { energy: number; social: number; focus: number };

export type Persona = {
  traits: string[];
  communicationStyle: string;
  workHours: string; // "09:00-18:00"
};

export type AgentMemory = {
  lastInteractionAt: number;
  lastChatPartnerId: string | null;
  lastChatAt: number;
};

export type Agent = {
  id: string;
  kind: AgentKind;
  name: string;
  role: string;
  persona: Persona;
  responsibilities: string[];
  defaultTasks: string[];
  preferredZones: string[];
  deskSlot: string;
  presence: PresenceStatus;

  position: Vec3;
  heading: number; // radians Y
  velocity: Vec3;
  state: AgentState;
  needs: Needs;
  goal: Goal | null;
  targetPos: Vec3 | null;
  targetSlotId: string | null;
  memory: AgentMemory;
  currentTaskId: string | null;
  speechUntil: number; // simTime
  speechText: string;
};

export type Goal =
  | { kind: 'idle' }
  | { kind: 'goto'; slotId: string; pos: Vec3 }
  | { kind: 'gotoZone'; zone: string; pos: Vec3 }
  | { kind: 'work'; taskId: string; slotId: string }
  | { kind: 'chat'; partnerId: string; pos: Vec3 }
  | { kind: 'meeting'; zone: string; pos: Vec3 }
  | { kind: 'break'; zone: string; pos: Vec3 };

export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';

export type Task = {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId?: string;
  createdBy: 'user' | 'scenario' | 'agent';
  zoneHint?: string;
  progress: number;
  dueAt?: number;
};

export type Slot = {
  id: string;
  zone: string;
  pos: Vec3;
  occupiedBy: string | null; // agentId
};

export type ZoneState = 'normal' | 'active' | 'locked';

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type Alert = {
  id: string;
  severity: AlertSeverity;
  message: string;
  source: string;
  createdAt: number;
};

export type SimEventSeverity = AlertSeverity | 'debug';

export type SimEvent = {
  id: string;
  at: number;
  severity: SimEventSeverity;
  message: string;
  agentId?: string;
  taskId?: string;
};

export type ScenarioStep =
  | { at: number; do: 'alert'; severity: AlertSeverity; message: string; source?: string }
  | { at: number; do: 'createTask'; title: string; description?: string; priority: TaskPriority; assignTo?: string; zoneHint?: string }
  | { at: number; do: 'assignTask'; taskId: string; to: string }
  | { at: number; do: 'setGoal'; target: string; goal: string }
  | { at: number; do: 'setZoneState'; zone: string; state: ZoneState }
  | { at: number; do: 'message'; text: string; severity?: SimEventSeverity };

export type ScenarioDef = {
  id: string;
  title: string;
  trigger: { type: 'manual' | 'scheduled'; at?: number };
  steps: ScenarioStep[];
  resolveWhen?: { allTasksDone?: boolean; afterMs?: number };
};

export type ScenarioRuntime = {
  id: string;
  startedAt: number;
  nextStepIdx: number;
  active: boolean;
  createdTaskIds: string[];
  createdAlertIds: string[];
};

export type SimSnapshot = {
  simTime: number;
  tick: number;
  agents: Agent[];
  tasks: Task[];
  slots: Slot[];
  alerts: Alert[];
  events: SimEvent[];
  zoneStates: Record<string, ZoneState>;
  scenarios: ScenarioRuntime[];
  rngState: RngState;
  paused: boolean;
  speed: number;
};

// Binary snapshot for high-frequency transfer (Worker → main)
// Layout per agent: x, y, z, heading, vx, vz, stateIdx (Float32Array)
// Stored in snapshotBuffer.ts — see bridge layer.
export const AGENT_STATE_ORDER: AgentState[] = [
  'Idle',
  'Walking',
  'Working',
  'Meeting',
  'Chatting',
  'Break',
  'Responding',
];

export type ExternalEvent =
  | { type: 'agent.status'; agentId: string; status: PresenceStatus }
  | { type: 'task.upsert'; task: Task }
  | { type: 'alert.raise'; severity: AlertSeverity; message: string; source: string }
  | { type: 'alert.clear'; alertId: string };
