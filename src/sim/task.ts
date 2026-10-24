import type { Task, TaskPriority, TaskStatus } from './types.ts';

let taskCounter = 0;

export function createTask(
  title: string,
  opts: Partial<Omit<Task, 'id' | 'title'>> & { id?: string } = {},
): Task {
  return {
    id: opts.id ?? `task_${Date.now()}_${taskCounter++}`,
    title,
    description: opts.description,
    priority: opts.priority ?? 'normal',
    status: opts.status ?? 'todo',
    assigneeId: opts.assigneeId,
    createdBy: opts.createdBy ?? 'user',
    zoneHint: opts.zoneHint,
    progress: opts.progress ?? 0,
    dueAt: opts.dueAt,
  };
}

export const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  low: 1,
  normal: 2,
  high: 4,
  critical: 8,
};

export function nextTaskStatusAfterProgress(t: Task): TaskStatus {
  if (t.progress >= 1) return 'done';
  if (t.progress > 0) return 'in_progress';
  return t.status === 'done' ? 'done' : t.status;
}
