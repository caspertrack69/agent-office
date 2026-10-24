import { useState, useMemo } from 'react';
import { useSimStore } from '../store/simStore.ts';

export function EventLog() {
  const events = useSimStore((s) => s.events);
  const [filter, setFilter] = useState<string>('');

  const filtered = useMemo(() => {
    let list = [...events].reverse();
    if (filter) list = list.filter((e) => e.severity === filter);
    return list.slice(0, 120);
  }, [events, filter]);

  return (
    <div className="panel event-log">
      <div className="panel-head">
        <h3>Event Log</h3>
        <select className="input input-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All</option>
          <option value="critical">critical</option>
          <option value="warning">warning</option>
          <option value="info">info</option>
          <option value="debug">debug</option>
        </select>
      </div>
      <div className="event-list">
        {filtered.map((e) => (
          <div key={e.id} className={`event-row severity-${e.severity}`}>
            <span className="event-time">{e.at.toFixed(1)}s</span>
            <span className={`badge severity-${e.severity}`}>{e.severity}</span>
            <span className="event-msg">{e.message}</span>
          </div>
        ))}
        {filtered.length === 0 && <div className="empty">No events</div>}
      </div>
    </div>
  );
}
