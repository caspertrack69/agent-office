import { useState, useEffect } from 'react';
import { useSimStore, useUiStore } from '../store/simStore.ts';
import type { PresenceStatus } from '../sim/types.ts';

type Props = {
  onUpdatePersona: (id: string, patch: Record<string, unknown>) => void;
  onSetPresence: (id: string, status: PresenceStatus) => void;
  onAssignTask: (taskId: string, agentId: string) => void;
};

export function Inspector({ onUpdatePersona, onSetPresence, onAssignTask }: Props) {
  const agents = useSimStore((s) => s.agents);
  const tasks = useSimStore((s) => s.tasks);
  const selectedId = useUiStore((s) => s.selectedAgentId);
  const agent = agents.find((a) => a.id === selectedId) ?? null;

  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editTraits, setEditTraits] = useState('');
  const [editResp, setEditResp] = useState('');

  useEffect(() => {
    if (agent) {
      setEditName(agent.name);
      setEditRole(agent.role);
      setEditTraits(agent.persona.traits.join(', '));
      setEditResp(agent.responsibilities.join(', '));
    }
  }, [agent]);

  if (!agent) {
    return (
      <div className="panel">
        <div className="panel-head"><h3>Inspector</h3></div>
        <div className="empty">Select an agent from the list or click in 3D</div>
      </div>
    );
  }

  const activeTask = tasks.find((t) => t.id === agent.currentTaskId) ?? null;
  const assignedTasks = tasks.filter((t) => t.assigneeId === agent.id);

  return (
    <div className="panel">
      <div className="panel-head"><h3>{agent.name} — {agent.role}</h3></div>

      <div className="inspector-grid">
        <div className="kv"><span>ID</span><code>{agent.id}</code></div>
        <div className="kv"><span>Kind</span><span>{agent.kind}</span></div>
        <div className="kv"><span>State</span><span className={`badge badge-${agent.state.toLowerCase()}`}>{agent.state}</span></div>
        <div className="kv"><span>Goal</span><code>{agent.goal ? JSON.stringify(agent.goal).slice(0, 80) : '—'}</code></div>
        <div className="kv"><span>Desk</span><span>{agent.deskSlot}</span></div>
        <div className="kv"><span>Presence</span>
          <select value={agent.presence} onChange={(e) => onSetPresence(agent.id, e.target.value as PresenceStatus)} className="input input-sm">
            <option value="online">online</option>
            <option value="busy">busy</option>
            <option value="away">away</option>
            <option value="offline">offline</option>
          </select>
        </div>
      </div>

      <div className="needs">
        {(['energy', 'social', 'focus'] as const).map((k) => (
          <div key={k} className="need">
            <span>{k}</span>
            <div className="need-bar"><div className="need-fill" style={{ width: `${Math.round(agent.needs[k] * 100)}%` }} /></div>
            <span className="need-val">{Math.round(agent.needs[k] * 100)}%</span>
          </div>
        ))}
      </div>

      <div className="kv" style={{ marginTop: 8 }}>
        <span>Position</span><code>{agent.position.x.toFixed(2)}, {agent.position.z.toFixed(2)}</code>
      </div>
      <div className="kv"><span>Heading</span><code>{(agent.heading * 180 / Math.PI).toFixed(1)}°</code></div>
      {agent.speechText && <div className="kv"><span>Speech</span><span>“{agent.speechText}”</span></div>}

      <div className="inspector-section">
        <h4>Active task</h4>
        {activeTask ? (
          <div className="task-mini">
            <strong>{activeTask.title}</strong> · {activeTask.priority} · {Math.round(activeTask.progress * 100)}%
            <div className="progress"><div className="progress-fill" style={{ width: `${activeTask.progress * 100}%` }} /></div>
          </div>
        ) : <span className="muted">—</span>}
        {assignedTasks.length > 0 && (
          <div className="task-mini-list">
            {assignedTasks.map((t) => (
              <div key={t.id} className="task-mini">
                {t.title} — <span className={`badge badge-${t.status}`}>{t.status}</span> {Math.round(t.progress * 100)}%
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="inspector-section">
        <h4>Assign task</h4>
        <select
          className="input"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) onAssignTask(e.target.value, agent.id);
            e.target.value = '';
          }}
        >
          <option value="">— pick task —</option>
          {tasks.filter((t) => !t.assigneeId && t.status !== 'done').map((t) => (
            <option key={t.id} value={t.id}>{t.title} ({t.priority})</option>
          ))}
        </select>
      </div>

      <details className="inspector-section">
        <summary>Edit persona</summary>
        <label className="field">
          <span>Name</span>
          <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} />
        </label>
        <label className="field">
          <span>Role</span>
          <input className="input" value={editRole} onChange={(e) => setEditRole(e.target.value)} />
        </label>
        <label className="field">
          <span>Traits (comma)</span>
          <input className="input" value={editTraits} onChange={(e) => setEditTraits(e.target.value)} />
        </label>
        <label className="field">
          <span>Responsibilities (comma)</span>
          <input className="input" value={editResp} onChange={(e) => setEditResp(e.target.value)} />
        </label>
        <button
          className="btn btn-primary"
          onClick={() => {
            onUpdatePersona(agent.id, {
              name: editName.trim() || agent.name,
              role: editRole.trim() || agent.role,
              persona: { ...agent.persona, traits: editTraits.split(',').map((s) => s.trim()).filter(Boolean) },
              responsibilities: editResp.split(',').map((s) => s.trim()).filter(Boolean),
            });
          }}
        >
          Save persona
        </button>
      </details>
    </div>
  );
}
