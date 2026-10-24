import type { SimEvent, SimEventSeverity } from './types.ts';

let evtCounter = 0;

export function createEvent(
  at: number,
  severity: SimEventSeverity,
  message: string,
  extra?: Partial<Pick<SimEvent, 'agentId' | 'taskId'>>,
): SimEvent {
  return {
    id: `evt_${Date.now()}_${evtCounter++}`,
    at,
    severity,
    message,
    ...extra,
  };
}

/** Simple in-memory ring buffer for events */
export class EventBus {
  private events: SimEvent[] = [];
  constructor(private max = 200) {}
  push(e: SimEvent): void {
    this.events.push(e);
    if (this.events.length > this.max) this.events.shift();
  }
  all(): SimEvent[] {
    return [...this.events];
  }
  clear(): void {
    this.events = [];
  }
  replace(list: SimEvent[]): void {
    this.events = list.slice(-this.max);
  }
}
