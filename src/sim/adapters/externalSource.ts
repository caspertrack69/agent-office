/**
 * ExternalSource adapter — v1 stub that translates ExternalEvent into world commands.
 * Future gateway+WebSocket will call handleExternalEvent() on live events.
 */
import type { ExternalEvent } from '../types.ts';
import type { SimWorld } from '../world.ts';
import { createTask } from '../task.ts';

export interface ExternalSource {
  onEvent(world: SimWorld, evt: ExternalEvent): void;
}

export class StubExternalSource implements ExternalSource {
  onEvent(world: SimWorld, evt: ExternalEvent): void {
    switch (evt.type) {
      case 'agent.status': {
        const ag = world.agents.find((a) => a.id === evt.agentId);
        if (ag) {
          ag.presence = evt.status;
          world.pushEvent('info', `${ag.name} is now ${evt.status}`, { agentId: ag.id });
        }
        break;
      }
      case 'task.upsert': {
        const idx = world.tasks.findIndex((t) => t.id === evt.task.id);
        if (idx >= 0) world.tasks[idx] = evt.task as typeof world.tasks[number];
        else world.tasks.push(evt.task as typeof world.tasks[number]);
        break;
      }
      case 'alert.raise': {
        world.addAlert(evt.severity, evt.message, evt.source);
        break;
      }
      case 'alert.clear': {
        world.alerts = world.alerts.filter((a) => a.id !== evt.alertId);
        break;
      }
    }
  }

  /** Convenience: create task from external upsert without full ExternalEvent */
  createExternalTask(world: SimWorld, title: string, priority: ExternalEvent extends { type: 'task.upsert' } ? never : string): void {
    void priority;
    const t = createTask(title, { createdBy: 'agent', priority: 'normal' });
    world.tasks.push(t);
  }
}
