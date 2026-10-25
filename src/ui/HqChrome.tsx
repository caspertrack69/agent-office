import { useSimStore, useUiStore } from '../store/simStore.ts';
import { getPersonaColor } from '../data/personas/index.ts';
import {
  Maximize2, LayoutGrid, MessageSquare, ClipboardList, Pencil, Volume2, VolumeX,
  Share2, ChevronLeft, ChevronRight, Home, Users, Building2, Store, BarChart3,
  Activity, X,
} from 'lucide-react';
import { useToast } from './Toast.tsx';

/* ── Header ── */
export function HqHeader() {
  const agents = useSimStore((s) => s.agents);
  const tasks = useSimStore((s) => s.tasks);
  const muted = useUiStore((s) => s.muted);
  const layoutMode = useUiStore((s) => s.layoutMode);
  const toggleLayout = useUiStore((s) => s.toggleLayoutMode);
  const setMuted = useUiStore((s) => s.setMuted);
  const setRightDrawer = useUiStore((s) => s.setRightDrawer);
  const { push } = useToast();

  const done = tasks.filter((t) => t.status === 'done').length;
  const total = tasks.length;
  const standupText = total > 0 && done === total ? 'Standup complete.' : `${done}/${total} done`;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => push('Fullscreen unavailable'));
    else document.exitFullscreen().catch(() => {});
  };

  const onShare = async () => {
    try {
      const url = location.href;
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
      else window.prompt('Copy URL', url);
      push('Link copied');
    } catch { push('Copy failed'); }
  };

  return (
    <div className="hq-header">
      <div className="hq-header-row">
        <div className="hq-header-left">
          <button type="button" className="hq-icon-btn" title="Fullscreen" aria-label="Fullscreen" onClick={toggleFullscreen}>
            <Maximize2 size={14} strokeWidth={2.1} />
          </button>
          <button type="button" className={`hq-icon-btn ${layoutMode === 'focus' ? 'is-active' : ''}`} title={layoutMode === 'focus' ? 'Exit focus' : 'Focus canvas'} aria-label="Toggle focus layout" onClick={toggleLayout}>
            <LayoutGrid size={14} strokeWidth={2.1} />
          </button>
          <button type="button" className="hq-icon-btn" title="Open chat" aria-label="Open chat" onClick={() => setRightDrawer('chat')}>
            <MessageSquare size={14} strokeWidth={2.1} />
          </button>
        </div>

        <div className="hq-title" aria-label="Luke Headquarters">LUKE HEADQUARTERS</div>

        <div className="hq-header-right">
          <div className="standup-card" role="status" aria-live="polite">
            <div className="kicker">STANDUP</div>
            <div className="title">{standupText}</div>
            <div className="sub">{agents.length ? `${agents.filter((a) => a.state !== 'Idle').length}/${agents.length} busy` : 'loading'}</div>
          </div>

          <button type="button" className="standup-board-btn" onClick={() => setRightDrawer('standup')}>
            <ClipboardList size={12} /> STANDUP BOARD
          </button>

          <button type="button" className="hq-icon-btn" title="Standup board" aria-label="Standup board" onClick={() => setRightDrawer('standup')}>
            <ClipboardList size={14} />
          </button>
          <button type="button" className="hq-icon-btn" title="Edit office" aria-label="Edit office" onClick={() => setRightDrawer('edit')}>
            <Pencil size={14} />
          </button>
          <button type="button" className="hq-icon-btn" title={muted ? 'Unmute' : 'Mute'} aria-label={muted ? 'Unmute' : 'Mute'} onClick={() => { setMuted(!muted); push(muted ? 'Sound on' : 'Muted'); }}>
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <button type="button" className="hq-icon-btn" title="Share" aria-label="Share" onClick={onShare}>
            <Share2 size={14} />
          </button>
        </div>
      </div>

      <div className="hq-avatar-row">
        {agents.map((a) => (
          <button
            key={a.id}
            type="button"
            className="avatar-pill"
            style={{ borderColor: getPersonaColor(a.id) + '55' }}
            onClick={() => useUiStore.getState().selectAgent(a.id)}
            title={`${a.name} · ${a.role}`}
          >
            <span className="av" style={{ background: getPersonaColor(a.id) }}>{a.name[0]}</span>
            {a.name}
            <span className={`presence-dot ${a.presence === 'offline' ? 'presence-offline-dot' : 'presence-online-dot'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Left rail ── */
export function HqLeftRail({ onCollapseToggle }: { onCollapseToggle?: () => void }) {
  const leftView = useUiStore((s) => s.leftView);
  const leftCollapsed = useUiStore((s) => s.leftCollapsed);
  const setLeftView = useUiStore((s) => s.setLeftView);
  const setLeftCollapsed = useUiStore((s) => s.setLeftCollapsed);
  const setTopDown = useUiStore((s) => s.setTopDown);
  const topDown = useUiStore((s) => s.topDown);

  return (
    <div className={`hq-rail-left ${leftCollapsed ? 'is-collapsed' : ''}`}>
      <button type="button" className="hq-rail-btn" title={leftCollapsed ? 'Expand' : 'Collapse'} aria-label={leftCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => { setLeftCollapsed(!leftCollapsed); onCollapseToggle?.(); }}>
        {leftCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
      <div style={{ height: 1, background: 'var(--border)', width: '60%', margin: '2px 0' }} />
      <button type="button" className={`hq-rail-btn ${leftView === 'home' ? 'active' : ''}`} title="Home" aria-label="Home" onClick={() => setLeftView('home')}>
        <Home size={14} />
      </button>
      <button type="button" className={`hq-rail-btn ${leftView === 'people' ? 'active' : ''}`} title="People" aria-label="People" onClick={() => setLeftView('people')}>
        <Users size={14} />
      </button>
      <button type="button" className={`hq-rail-btn ${leftView === 'hq' ? 'active' : ''}`} title="HQ" aria-label="HQ" onClick={() => setLeftView('hq')}>
        <Building2 size={14} />
      </button>
      <div style={{ height: 1, background: 'var(--border)', width: '60%', margin: '6px 0 0' }} />
      <label className={`hq-rail-btn ${topDown ? 'active' : ''}`} title={topDown ? 'Isometric' : 'Top-down'} style={{ cursor: 'pointer' }}>
        <input type="checkbox" checked={topDown} onChange={(e) => setTopDown(e.target.checked)} style={{ display: 'none' }} />
        <LayoutGrid size={12} />
      </label>
    </div>
  );
}

/* ── Right tabs ── */
export function HqRightTabs() {
  const drawer = useUiStore((s) => s.rightDrawer);
  const toggle = useUiStore((s) => s.toggleRightDrawer);
  return (
    <div className="hq-vtabs" role="tablist" aria-label="Right panels">
      <button type="button" role="tab" aria-selected={drawer === 'hq'} className={`hq-vtab hq-vtab-open ${drawer === 'hq' ? 'is-open' : ''}`} onClick={() => toggle('hq')}>
        <Building2 size={12} /> <span className="vtab-label">OPEN HQ</span>
      </button>
      <button type="button" role="tab" aria-selected={drawer === 'marketplace'} className={`hq-vtab hq-vtab-market ${drawer === 'marketplace' ? 'is-open' : ''}`} onClick={() => toggle('marketplace')}>
        <Store size={12} /> <span className="vtab-label">MARKETPLACE</span>
      </button>
      <button type="button" role="tab" aria-selected={drawer === 'analytics'} className={`hq-vtab hq-vtab-analytics ${drawer === 'analytics' ? 'is-open' : ''}`} onClick={() => toggle('analytics')}>
        <BarChart3 size={12} /> <span className="vtab-label">ANALYTICS</span>
      </button>
    </div>
  );
}

/* ── Bottom bar ── */
export function HqBottomBar() {
  const agents = useSimStore((s) => s.agents);
  const working = agents.filter((a) => a.state === 'Working').length;
  const idle = agents.filter((a) => a.state === 'Idle').length;
  const err = agents.filter((a) => a.presence === 'offline').length;
  const setRightDrawer = useUiStore((s) => s.setRightDrawer);
  return (
    <>
      <div className="hq-bottom" role="status" aria-live="polite">
        <span><b style={{ color: working ? 'var(--accent-primary)' : 'var(--text-muted)' }}>{working} working</b></span>
        <span className="dot" />
        <span><b style={{ color: 'var(--accent-violet)' }}>{idle} idle</b></span>
        <span className="dot" />
        <span><b style={{ color: err ? 'var(--danger)' : 'var(--text-muted)' }}>{err} error</b></span>
        <span className="dot" />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Activity size={10} /> quiet</span>
        <span className="dot" />
        <span>drag · scroll · space+drag · dbl-click</span>
      </div>
      <button type="button" className="hq-chat" onClick={() => setRightDrawer('chat')}>
        <MessageSquare size={13} /> CHAT
      </button>
    </>
  );
}

/* ── Right drawer shell ── */
export function RightDrawer({ children }: { children: React.ReactNode }) {
  const drawer = useUiStore((s) => s.rightDrawer);
  const setDrawer = useUiStore((s) => s.setRightDrawer);
  if (!drawer) return null;
  const titleMap: Record<string, string> = {
    hq: 'Open HQ', marketplace: 'Marketplace', analytics: 'Analytics', chat: 'Chat', standup: 'Standup Board', edit: 'Edit Office',
  };
  const IconMap: Record<string, React.ReactNode> = {
    hq: <Building2 size={14} />, marketplace: <Store size={14} />, analytics: <BarChart3 size={14} />, chat: <MessageSquare size={14} />, standup: <ClipboardList size={14} />, edit: <Pencil size={14} />,
  };
  return (
    <div className="hq-drawer" role="dialog" aria-label={titleMap[drawer] ?? drawer}>
      <div className="hq-drawer-head">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{IconMap[drawer]} {titleMap[drawer] ?? drawer}</span>
        <button type="button" className="hq-icon-btn" aria-label="Close" onClick={() => setDrawer(null)}><X size={14} /></button>
      </div>
      <div className="hq-drawer-body">{children}</div>
    </div>
  );
}
