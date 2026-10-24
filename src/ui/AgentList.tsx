import { useMemo } from 'react';
import { useSimStore, useUiStore } from '../store/simStore.ts';
import { getPersonaColor } from '../data/personas/index.ts';

export function AgentList() {
  const agents = useSimStore((s) => s.agents);
  const search = useUiStore((s) => s.search);
  const filterState = useUiStore((s) => s.filterState);
  const setSearch = useUiStore((s) => s.setSearch);
  const setFilterState = useUiStore((s) => s.setFilterState);
  const selectedId = useUiStore((s) => s.selectedAgentId);
  const select = useUiStore((s) => s.selectAgent);
  const setFollow = useUiStore((s) => s.setFollow);

  const filtered = useMemo(() => {
    return agents.filter((a) => {
      if (search && !`${a.name} ${a.role} ${a.id}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterState && a.state !== filterState) return false;
      return true;
    });
  }, [agents, search, filterState]);

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Agents ({filtered.length}/{agents.length})</h3>
      </div>
      <div className="panel-controls">
        <input
          className="input"
          placeholder="Search name / role"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input" value={filterState} onChange={(e) => setFilterState(e.target.value)}>
          <option value="">All states</option>
          <option>Idle</option>
          <option>Walking</option>
          <option>Working</option>
          <option>Meeting</option>
          <option>Chatting</option>
          <option>Break</option>
          <option>Responding</option>
        </select>
      </div>
      <div className="agent-list">
        {filtered.map((a) => (
          <button
            key={a.id}
            className={`agent-row ${selectedId === a.id ? 'agent-row-selected' : ''} ${a.presence === 'offline' ? 'agent-row-offline' : ''}`}
            onClick={() => { select(a.id); setFollow(true); }}
          >
            <span className="agent-dot" style={{ background: getPersonaColor(a.id) }} />
            <span className="agent-name">{a.name}</span>
            <span className="agent-role">{a.role}</span>
            <span className={`badge badge-${a.state.toLowerCase()}`}>{a.state}</span>
            <span className={`presence presence-${a.presence}`}>{a.presence}</span>
            <span className="agent-kind">{a.kind}</span>
          </button>
        ))}
        {filtered.length === 0 && <div className="empty">No agents match filter</div>}
      </div>
    </div>
  );
}
