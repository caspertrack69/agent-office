import { useState } from 'react';
import { useSimStore } from '../store/simStore.ts';
import type { TaskPriority } from '../sim/types.ts';

type Props = {
  onCreate: (title: string, priority: TaskPriority, zoneHint?: string) => void;
  onAssign: (taskId: string, agentId: string) => void;
  onUpdateStatus: (taskId: string, status: string) => void;
};

const COLS: { id: string; label: string; statuses: string[] }[] = [
  { id: 'todo', label: 'Todo', statuses: ['todo'] },
  { id: 'in_progress', label: 'In Progress', statuses: ['in_progress'] },
  { id: 'blocked', label: 'Blocked', statuses: ['blocked'] },
  { id: 'done', label: 'Done', statuses: ['done'] },
];

export function TaskBoard({ onCreate, onAssign, onUpdateStatus }: Props) {
  const tasks = useSimStore((s) => s.tasks);
  const agents = useSimStore((s) => s.agents);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [zoneHint, setZoneHint] = useState('');

  return (
    <div className="panel task-board">
      <div className="panel-head"><h3>Task Board</h3></div>

      <form
        className="task-create"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          onCreate(title.trim(), priority, zoneHint || undefined);
          setTitle('');
        }}
      >
        <input className="input" placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <select className="input input-sm" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
          <option value="low">low</option>
          <option value="normal">normal</option>
          <option value="high">high</option>
          <option value="critical">critical</option>
        </select>
        <input className="input input-sm" placeholder="zone (optional)" value={zoneHint} onChange={(e) => setZoneHint(e.target.value)} />
        <button className="btn btn-primary btn-sm" type="submit">Add</button>
      </form>

      <div className="board-cols">
        {COLS.map((col) => (
          <div key={col.id} className="board-col">
            <div className="board-col-head">{col.label} <span className="count">{tasks.filter((t) => col.statuses.includes(t.status)).length}</span></div>
            <div className="board-col-body">
              {tasks.filter((t) => col.statuses.includes(t.status)).map((t) => (
                <div key={t.id} className={`task-card priority-${t.priority}`}>
                  <div className="task-card-title">{t.title}</div>
                  <div className="task-card-meta">
                    <span className={`badge priority-${t.priority}`}>{t.priority}</span>
                    <span className="muted">{t.createdBy}</span>
                    {t.zoneHint && <span className="muted">↗ {t.zoneHint}</span>}
                  </div>
                  <div className="progress"><div className="progress-fill" style={{ width: `${t.progress * 100}%` }} /></div>
                  <div className="task-card-assignee">
                    {t.assigneeId ? (
                      <span>→ {agents.find((a) => a.id === t.assigneeId)?.name ?? t.assigneeId}</span>
                    ) : (
                      <span className="muted">unassigned</span>
                    )}
                  </div>
                  <div className="task-card-actions">
                    <select
                      className="input input-sm"
                      value={t.assigneeId ?? ''}
                      onChange={(e) => { if (e.target.value) onAssign(t.id, e.target.value); }}
                    >
                      <option value="">Assign…</option>
                      {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <select
                      className="input input-sm"
                      value={t.status}
                      onChange={(e) => onUpdateStatus(t.id, e.target.value)}
                    >
                      <option value="todo">todo</option>
                      <option value="in_progress">in_progress</option>
                      <option value="blocked">blocked</option>
                      <option value="done">done</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
