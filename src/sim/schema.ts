import { z } from 'zod';

export const personaSchema = z.object({
  traits: z.array(z.string()).max(10),
  communicationStyle: z.string().max(64),
  workHours: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/),
});

export const personaInputSchema = z.object({
  name: z.string().min(1).max(64),
  kind: z.enum(['ai', 'human']),
  role: z.string().min(1).max(64),
  persona: personaSchema,
  responsibilities: z.array(z.string().max(80)).max(10),
  defaultTasks: z.array(z.string().max(120)).max(10),
  preferredZones: z.array(z.string().max(32)).max(5),
  deskSlot: z.string().max(32),
});

export const taskInputSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']),
  status: z.enum(['todo', 'in_progress', 'blocked', 'done']).optional(),
  assigneeId: z.string().optional(),
  createdBy: z.enum(['user', 'scenario', 'agent']).optional(),
  zoneHint: z.string().max(32).optional(),
  dueAt: z.number().optional(),
});

export const scenarioStepSchema = z.discriminatedUnion('do', [
  z.object({ at: z.number(), do: z.literal('alert'), severity: z.enum(['info', 'warning', 'critical']), message: z.string(), source: z.string().optional() }),
  z.object({ at: z.number(), do: z.literal('createTask'), title: z.string(), description: z.string().optional(), priority: z.enum(['low', 'normal', 'high', 'critical']), assignTo: z.string().optional(), zoneHint: z.string().optional() }),
  z.object({ at: z.number(), do: z.literal('assignTask'), taskId: z.string(), to: z.string() }),
  z.object({ at: z.number(), do: z.literal('setGoal'), target: z.string(), goal: z.string() }),
  z.object({ at: z.number(), do: z.literal('setZoneState'), zone: z.string(), state: z.enum(['normal', 'active', 'locked']) }),
  z.object({ at: z.number(), do: z.literal('message'), text: z.string(), severity: z.enum(['info', 'warning', 'critical', 'debug']).optional() }),
]);

export const scenarioDefSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  trigger: z.object({ type: z.enum(['manual', 'scheduled']), at: z.number().optional() }),
  steps: z.array(scenarioStepSchema),
  resolveWhen: z.object({ allTasksDone: z.boolean().optional(), afterMs: z.number().optional() }).optional(),
});

export const externalEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('agent.status'), agentId: z.string(), status: z.enum(['online', 'busy', 'away', 'offline']) }),
  z.object({ type: z.literal('task.upsert'), task: z.object({ id: z.string(), title: z.string(), priority: z.enum(['low', 'normal', 'high', 'critical']), status: z.enum(['todo', 'in_progress', 'blocked', 'done']), progress: z.number() }).passthrough() }),
  z.object({ type: z.literal('alert.raise'), severity: z.enum(['info', 'warning', 'critical']), message: z.string(), source: z.string() }),
  z.object({ type: z.literal('alert.clear'), alertId: z.string() }),
]);

// Persisted save schema
export const saveFileSchema = z.object({
  schemaVersion: z.number(),
  savedAt: z.number(),
  snapshot: z.unknown(),
});
