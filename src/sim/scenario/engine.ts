import type { ScenarioDef, ScenarioRuntime, ScenarioStep } from '../types.ts';
import type { SimWorld } from '../world.ts';
import { createTask } from '../task.ts';

export class ScenarioEngine {
  defs: Map<string, ScenarioDef> = new Map();

  register(def: ScenarioDef): void {
    this.defs.set(def.id, def);
  }

  start(world: SimWorld, scenarioId: string): ScenarioRuntime | null {
    const def = this.defs.get(scenarioId);
    if (!def) return null;
    const rt: ScenarioRuntime = {
      id: def.id,
      startedAt: world.simTime,
      nextStepIdx: 0,
      active: true,
      createdTaskIds: [],
      createdAlertIds: [],
    };
    world.scenarioRuntimes.push(rt);
    world.pushEvent('info', `Scenario "${def.title}" started`);
    return rt;
  }

  tick(world: SimWorld, dt: number): void {
    for (const rt of world.scenarioRuntimes) {
      if (!rt.active) continue;
      const def = this.defs.get(rt.id);
      if (!def) continue;

      const elapsed = world.simTime - rt.startedAt;

      while (rt.nextStepIdx < def.steps.length) {
        const step = def.steps[rt.nextStepIdx] as ScenarioStep;
        if (elapsed < step.at) break;
        this.applyStep(world, rt, step);
        rt.nextStepIdx++;
      }

      // resolve check
      if (rt.nextStepIdx >= def.steps.length && def.resolveWhen) {
        let done = false;
        if (def.resolveWhen.allTasksDone) {
          done = rt.createdTaskIds.every((id) => {
            const t = world.tasks.find((x) => x.id === id);
            return t?.status === 'done';
          });
          if (rt.createdTaskIds.length === 0) done = false;
        }
        if (def.resolveWhen.afterMs != null) {
          if (elapsed * 1000 >= def.resolveWhen.afterMs) done = true;
        }
        if (done) {
          rt.active = false;
          // clear alerts created by scenario
          for (const aid of rt.createdAlertIds) {
            world.alerts = world.alerts.filter((a) => a.id !== aid);
          }
          // zone state back to normal
          if (def.steps.some((s) => s.do === 'setZoneState')) {
            world.zoneStates['war_room'] = 'normal';
          }
          world.pushEvent('info', `Scenario "${def.title}" resolved`);
        }
      }
    }
    // remove inactive runtimes whose alerts are cleared optionally keep for history
    void dt;
  }

  private applyStep(world: SimWorld, rt: ScenarioRuntime, step: ScenarioStep): void {
    switch (step.do) {
      case 'alert': {
        const alert = world.addAlert(step.severity, step.message, step.source ?? rt.id);
        rt.createdAlertIds.push(alert.id);
        break;
      }
      case 'createTask': {
        let assigneeId: string | undefined;
        if (step.assignTo) {
          assigneeId = this.resolveAssignee(world, step.assignTo);
        }
        const task = createTask(step.title, {
          description: step.description,
          priority: step.priority,
          zoneHint: step.zoneHint,
          assigneeId,
          createdBy: 'scenario',
        });
        world.tasks.push(task);
        rt.createdTaskIds.push(task.id);
        world.pushEvent(step.priority === 'critical' ? 'critical' : 'warning', `Task created: ${task.title}`, { taskId: task.id });
        break;
      }
      case 'assignTask': {
        const t = world.tasks.find((x) => x.id === step.taskId);
        const aid = this.resolveAssignee(world, step.to);
        if (t && aid) {
          t.assigneeId = aid;
          if (t.status === 'todo') t.status = 'in_progress';
        }
        break;
      }
      case 'setGoal': {
        const targets = this.resolveTargets(world, step.target);
        for (const ag of targets) {
          // Encode goal string like "gotoZone:war_room" or "goto:desk_01"
          const g = parseGoalString(step.goal, world);
          if (g) {
            world.assignGoal(ag.id, g);
          }
        }
        break;
      }
      case 'setZoneState': {
        world.zoneStates[step.zone] = step.state;
        world.pushEvent('warning', `Zone ${step.zone} → ${step.state}`);
        break;
      }
      case 'message': {
        world.pushEvent(step.severity ?? 'info', step.text);
        // also speech bubble for involved agents
        for (const ag of world.agents.slice(0, 2)) {
          ag.speechText = step.text.slice(0, 80);
          ag.speechUntil = world.simTime + 4;
        }
        break;
      }
    }
  }

  private resolveAssignee(world: SimWorld, expr: string): string | undefined {
    if (expr.startsWith('role:')) {
      const role = expr.slice(5).toLowerCase();
      const m = world.agents.find((a) => a.role.toLowerCase().includes(role));
      return m?.id;
    }
    return world.agents.find((a) => a.id === expr)?.id ?? expr;
  }

  private resolveTargets(world: SimWorld, expr: string) {
    if (expr.startsWith('role:')) {
      const role = expr.slice(5).toLowerCase();
      return world.agents.filter((a) => a.role.toLowerCase().includes(role));
    }
    const single = world.agents.find((a) => a.id === expr);
    return single ? [single] : [];
  }
}

function parseGoalString(goal: string, world: SimWorld) {
  if (goal.startsWith('gotoZone:')) {
    const zone = goal.slice('gotoZone:'.length);
    const slot = world.slots.find((s) => s.zone === zone && !s.occupiedBy) ?? world.slots.find((s) => s.zone === zone) ?? null;
    if (!slot) return null;
    return { kind: 'gotoZone' as const, zone, pos: slot.pos };
  }
  if (goal.startsWith('goto:')) {
    const slotId = goal.slice(5);
    const slot = world.slots.find((s) => s.id === slotId);
    if (!slot) return null;
    return { kind: 'goto' as const, slotId, pos: slot.pos };
  }
  if (goal === 'idle') return { kind: 'idle' as const };
  return null;
}
