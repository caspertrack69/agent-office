import { useSimStore } from '../store/simStore.ts';
import { defaultScenarios } from '../data/scenarios/index.ts';

type Props = { onTrigger: (id: string) => void };

export function ScenarioPanel({ onTrigger }: Props) {
  const alerts = useSimStore((s) => s.alerts);
  const tasks = useSimStore((s) => s.tasks);
  const hasActive = alerts.length > 0;

  return (
    <div className="panel">
      <div className="panel-head"><h3>Scenarios</h3></div>
      <div className="scenario-list">
        {defaultScenarios.map((sc) => (
          <div key={sc.id} className="scenario-row">
            <div>
              <strong>{sc.title}</strong>
              <div className="muted">{sc.steps.length} steps · trigger: {sc.trigger.type}</div>
            </div>
            <button className="btn btn-sm btn-primary" onClick={() => onTrigger(sc.id)}>Trigger</button>
          </div>
        ))}
      </div>
      {hasActive && (
        <div className="scenario-active">
          <strong>Active alerts: {alerts.length}</strong>
          <ul>
            {alerts.map((a) => <li key={a.id}><span className={`badge severity-${a.severity}`}>{a.severity}</span> {a.message}</li>)}
          </ul>
          <div className="muted">Tasks linked: {tasks.filter((t) => t.createdBy === 'scenario').length}</div>
        </div>
      )}
    </div>
  );
}
