import { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { Scene } from './scene/index.tsx';
import { TopBar } from './ui/TopBar.tsx';
import { AlertBanner } from './ui/AlertBanner.tsx';
import { AgentList } from './ui/AgentList.tsx';
import { Inspector } from './ui/Inspector.tsx';
import { TaskBoard } from './ui/TaskBoard.tsx';
import { ScenarioPanel } from './ui/ScenarioPanel.tsx';
import { EventLog } from './ui/EventLog.tsx';
import { HqHeader, HqLeftRail, HqRightTabs, HqBottomBar, RightDrawer } from './ui/HqChrome.tsx';
import { ToastProvider } from './ui/Toast.tsx';
import { useAlertSound } from './ui/useAlertSound.ts';
import { useSimStore, useUiStore } from './store/simStore.ts';
import { agentPoseMapRef } from './scene/AgentMesh.tsx';
import { createWorkerClient, type WorkerClient } from './bridge/workerClient.ts';
import { saveSnapshot, loadSnapshot, exportToJson, importFromJson, downloadJson, AUTOSAVE_ID } from './persistence/index.ts';
import { AUTOSAVE_INTERVAL_MS } from './sim/config.ts';
import { ClipboardList, MessageSquare, Plus } from 'lucide-react';

function StandupBoard() {
  const agents = useSimStore((s) => s.agents);
  const tasks = useSimStore((s) => s.tasks);
  const done = tasks.filter((t) => t.status === 'done');
  const todo = tasks.filter((t) => t.status !== 'done');
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div className="muted" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>
        {agents.filter((a) => a.state !== 'Idle').length} busy / {agents.length} agents · {done.length}/{tasks.length} tasks done
      </div>
      <div style={{ fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><ClipboardList size={14} /> Todo ({todo.length})</div>
      {todo.map((t) => (
        <div key={t.id} className="task-mini">{t.title} · <span className="badge">{t.priority}</span></div>
      ))}
      {todo.length === 0 && <div className="empty">All caught up</div>}
      <div style={{ fontWeight: 700, fontSize: 12, marginTop: 6 }}>Done ({done.length})</div>
      {done.map((t) => (
        <div key={t.id} className="task-mini" style={{ opacity: 0.7 }}>{t.title}</div>
      ))}
    </div>
  );
}

function ChatPanel() {
  const agents = useSimStore((s) => s.agents);
  const events = useSimStore((s) => s.events);
  const chatLog = useUiStore((s) => s.chatLog);
  const sendChat = useUiStore((s) => s.sendChat);
  const [msg, setMsg] = useState('');
  const recent = [...events].reverse().slice(0, 24);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 260 }}>
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#9a8a6a' }}>
        Agents: {agents.map((a) => a.name).join(', ') || 'none'}
      </div>
      <div style={{ flex: 1, border: '1px solid #2e2210', borderRadius: 10, background: '#0f0a04', padding: 8, maxHeight: 300, overflow: 'auto', display: 'grid', gap: 6 }}>
        {chatLog.map((c) => (
          <div key={c.id} className="event-row" style={{ borderColor: '#4a3616' }}>
            <span className="badge" style={{ background: '#2a1e0c', color: '#e8b84b' }}>you</span>
            <span className="event-msg">{c.text}</span>
          </div>
        ))}
        {recent.map((e) => (
          <div key={e.id} className="event-row"><span className="badge">{e.severity}</span><span className="event-msg">{e.message}</span></div>
        ))}
        {recent.length === 0 && chatLog.length === 0 && <div className="empty" style={{ margin: 0 }}>No messages yet</div>}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!msg.trim()) return;
          sendChat(msg);
          setMsg('');
        }}
        style={{ display: 'flex', gap: 6 }}
      >
        <input className="input" placeholder="Type a message" value={msg} onChange={(e) => setMsg(e.target.value)} aria-label="Message" />
        <button type="submit" className="btn btn-primary btn-sm"><MessageSquare size={12} /> Send</button>
      </form>
    </div>
  );
}

function DrawerContent({
  onCreateTask,
  onPause,
  onResume,
}: {
  onCreateTask: (title: string, priority: string, zoneHint?: string) => void;
  onPause: () => void;
  onResume: () => void;
}) {
  const drawer = useUiStore((s) => s.rightDrawer);
  const pushToast = useUiStore((s) => s.pushToast);
  const tasks = useSimStore((s) => s.tasks);
  const events = useSimStore((s) => s.events);
  const paused = useSimStore((s) => s.paused);
  const agents = useSimStore((s) => s.agents);
  const selectedId = useUiStore((s) => s.selectedAgentId);
  const follow = useUiStore((s) => s.followAgent);
  const topDown = useUiStore((s) => s.topDown);
  const showGrid = useUiStore((s) => s.showGrid);
  const showWalls = useUiStore((s) => s.showWalls);
  const ambient = useUiStore((s) => s.ambient);
  const setFollow = useUiStore((s) => s.setFollow);
  const setTopDown = useUiStore((s) => s.setTopDown);
  const setShowGrid = useUiStore((s) => s.setShowGrid);
  const setShowWalls = useUiStore((s) => s.setShowWalls);
  const setAmbient = useUiStore((s) => s.setAmbient);
  const toggleLayout = useUiStore((s) => s.toggleLayoutMode);

  if (drawer === 'standup') return <StandupBoard />;
  if (drawer === 'chat') return <ChatPanel />;

  if (drawer === 'hq') {
    return (
      <div style={{ display: 'grid', gap: 10 }}>
        <div className="task-mini">Agents: {agents.length} · Tasks: {tasks.length} · Events: {events.length}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-sm" onClick={() => (paused ? onResume() : onPause())}>{paused ? 'Resume' : 'Pause'}</button>
          <button type="button" className="btn btn-sm" onClick={() => setTopDown(!topDown)}>{topDown ? 'Isometric view' : 'Top-down view'}</button>
          <button type="button" className="btn btn-sm" onClick={toggleLayout}>Toggle focus</button>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={follow} disabled={!selectedId} onChange={(e) => setFollow(e.target.checked)} /> follow selected agent
        </label>
        <div className="muted">Tip: drag to pan, scroll to zoom, right-drag to orbit.</div>
      </div>
    );
  }

  if (drawer === 'marketplace') {
    const templates = [
      { title: 'Pilot: incident runbook', priority: 'high' as const, zone: 'war_room' },
      { title: 'Pilot: design review', priority: 'normal' as const, zone: 'meeting_room' },
      { title: 'Pilot: sprint retrospective', priority: 'low' as const, zone: 'meeting_room' },
    ];
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <p className="muted" style={{ margin: 0 }}>Task templates from the workspace marketplace.</p>
        {templates.map((tpl) => (
          <div key={tpl.title} className="scenario-row">
            <div>
              <strong style={{ fontSize: 12 }}>{tpl.title}</strong>
              <div className="muted">{tpl.priority} · {tpl.zone}</div>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => { onCreateTask(tpl.title, tpl.priority, tpl.zone); pushToast('Task added'); }}
            >
              <Plus size={12} /> Add
            </button>
          </div>
        ))}
      </div>
    );
  }

  if (drawer === 'analytics') {
    const doneCount = tasks.filter((t) => t.status === 'done').length;
    const avg = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
    const byState = agents.reduce<Record<string, number>>((acc, a) => { acc[a.state] = (acc[a.state] ?? 0) + 1; return acc; }, {});
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <div className="task-mini">Completion: {avg}% ({doneCount}/{tasks.length})</div>
        <div className="task-mini">Active tasks: {tasks.length - doneCount}</div>
        <div className="task-mini">Events logged: {events.length}</div>
        <div className="task-mini">
          Agent states: {Object.entries(byState).map(([k, v]) => `${k} ${v}`).join(' · ') || '—'}
        </div>
        <div className="progress" style={{ height: 8 }}><div className="progress-fill" style={{ width: `${avg}%` }} /></div>
      </div>
    );
  }

  if (drawer === 'edit') {
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        <label className="toggle"><input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} /> show floor grid</label>
        <label className="toggle"><input type="checkbox" checked={showWalls} onChange={(e) => setShowWalls(e.target.checked)} /> show perimeter walls</label>
        <label className="toggle"><input type="checkbox" checked={topDown} onChange={(e) => setTopDown(e.target.checked)} /> top-down camera</label>
        <label className="field">
          <span>Ambient light ({Math.round(ambient * 100)}%)</span>
          <input
            type="range" min={0.3} max={2} step={0.05} value={ambient}
            onChange={(e) => setAmbient(Number(e.target.value))}
            aria-label="Ambient light intensity"
          />
        </label>
        <div className="muted">Changes apply live to the 3D scene.</div>
      </div>
    );
  }
  return null;
}

function LeftSidebar({ onTrigger }: { onTrigger: (id: string) => void }) {
  const view = useUiStore((s) => s.leftView);
  const collapsed = useUiStore((s) => s.leftCollapsed);
  if (collapsed) {
    return (
      <div className="panel" style={{ padding: 10, textAlign: 'center' }}>
        <span className="muted" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>Panel collapsed</span>
      </div>
    );
  }
  if (view === 'home') {
    return (
      <div className="panel">
        <div className="panel-head"><h3>Home</h3></div>
        <p className="muted" style={{ margin: 0 }}>
          agent-office live floor. Pick an agent or open the HQ panels on the right.
        </p>
      </div>
    );
  }
  if (view === 'people') return <AgentList />;
  return (
    <>
      <AgentList />
      <ScenarioPanel onTrigger={onTrigger} />
      <EventLog />
    </>
  );
}

export default function App() {
  const setSnapshot = useSimStore((s) => s.setSnapshot);
  const layoutMode = useUiStore((s) => s.layoutMode);
  const rightDrawer = useUiStore((s) => s.rightDrawer);
  const clientRef = useRef<WorkerClient | null>(null);
  const autosaveTimer = useRef<number | null>(null);
  useAlertSound();

  useEffect(() => {
    let mounted = true;
    let unsub: (() => void) | null = null;
    (async () => {
      const client = await createWorkerClient({ seed: 42 });
      if (!mounted) { client.dispose(); return; }
      clientRef.current = client;
      const auto = await loadSnapshot(AUTOSAVE_ID);
      if (auto) await client.loadSnapshot(auto);
      (window as unknown as { __triggerScenario?: (id: string) => void }).__triggerScenario = (id: string) => { void client.triggerScenario(id); };
      unsub = client.onSnapshot((snap) => {
        setSnapshot(snap);
        for (const a of snap.agents) {
          const pose = agentPoseMapRef().get(a.id);
          if (pose) { pose.pos.set(a.position.x, 0, a.position.z); pose.heading = a.heading; pose.state = a.state; }
          else agentPoseMapRef().set(a.id, { pos: new THREE.Vector3(a.position.x, 0, a.position.z), heading: a.heading, state: a.state });
        }
      });
      client.start();
      autosaveTimer.current = window.setInterval(async () => {
        if (!clientRef.current) return;
        const snap = await clientRef.current.getSnapshot();
        await saveSnapshot(AUTOSAVE_ID, snap);
      }, AUTOSAVE_INTERVAL_MS);
    })();
    return () => {
      mounted = false;
      if (unsub) unsub();
      if (autosaveTimer.current) window.clearInterval(autosaveTimer.current);
      clientRef.current?.dispose();
      delete (window as unknown as { __triggerScenario?: unknown }).__triggerScenario;
    };
  }, [setSnapshot]);

  const onPause = useCallback(() => { void clientRef.current?.pause(); }, []);
  const onResume = useCallback(() => { void clientRef.current?.resume(); }, []);
  const onSetSpeed = useCallback((v: number) => { void clientRef.current?.setSpeed(v); }, []);
  const onReset = useCallback(() => { void clientRef.current?.reset(); }, []);
  const onTrigger = useCallback((id: string) => { void clientRef.current?.triggerScenario(id); }, []);
  const onCreateTask = useCallback((title: string, priority: string, zoneHint?: string) => {
    void clientRef.current?.createTask(title, { priority, zoneHint } as unknown as Record<string, unknown>);
  }, []);
  const onAssign = useCallback((taskId: string, agentId: string) => { void clientRef.current?.assignTask(taskId, agentId); }, []);
  const onUpdatePersona = useCallback((id: string, patch: Record<string, unknown>) => { void clientRef.current?.updatePersona(id, patch); }, []);
  const onSetPresence = useCallback((id: string, status: string) => { void clientRef.current?.setPresence(id, status); }, []);
  const onSave = useCallback(async () => {
    if (!clientRef.current) return;
    const snap = await clientRef.current.getSnapshot();
    await saveSnapshot(`save_${Date.now()}`, snap);
    await saveSnapshot(AUTOSAVE_ID, snap);
    useUiStore.getState().pushToast('Snapshot saved');
  }, []);
  const onLoad = useCallback(async () => {
    const snap = await loadSnapshot(AUTOSAVE_ID);
    if (snap && clientRef.current) {
      await clientRef.current.loadSnapshot(snap);
      useUiStore.getState().pushToast('Autosave loaded');
    } else {
      useUiStore.getState().pushToast('No autosave found');
    }
  }, []);
  const onExport = useCallback(async () => {
    if (!clientRef.current) return;
    const snap = await clientRef.current.getSnapshot();
    downloadJson(`agent-office-${Date.now()}.json`, exportToJson(snap));
    useUiStore.getState().pushToast('Snapshot exported');
  }, []);
  const onImport = useCallback(async (file: File) => {
    const text = await file.text();
    const snap = importFromJson(text);
    if (snap && clientRef.current) {
      await clientRef.current.loadSnapshot(snap);
      useUiStore.getState().pushToast('Snapshot imported');
    } else {
      useUiStore.getState().pushToast('Invalid save file');
    }
  }, []);
  const onUpdateStatus = useCallback(async (taskId: string, status: string) => {
    if (!clientRef.current) return;
    const snap = await clientRef.current.getSnapshot();
    const t = snap.tasks.find((x) => x.id === taskId);
    if (t) { (t as { status: string }).status = status; await clientRef.current.loadSnapshot(snap); }
  }, []);

  const isFocus = layoutMode === 'focus';

  return (
    <ToastProvider>
      <div className={`app ${isFocus ? 'app-focus' : ''}`}>
        <HqHeader />
        <TopBar onPause={onPause} onResume={onResume} onSetSpeed={onSetSpeed} onReset={onReset} onSave={onSave} onLoad={onLoad} onExport={onExport} onImport={onImport} />
        <AlertBanner />
        <div className="layout" style={isFocus ? { gridTemplateColumns: '1fr' } : undefined}>
          <aside className="sidebar-left" style={isFocus ? { display: 'none' } : undefined}>
            <LeftSidebar onTrigger={onTrigger} />
          </aside>
          <main className="canvas-wrap">
            <Scene />
          </main>
          <aside className="sidebar-right" style={isFocus ? { display: 'none' } : undefined}>
            <Inspector onUpdatePersona={onUpdatePersona} onSetPresence={onSetPresence} onAssignTask={onAssign} />
            <TaskBoard onCreate={onCreateTask} onAssign={onAssign} onUpdateStatus={onUpdateStatus} />
          </aside>
        </div>
        <HqLeftRail />
        <HqRightTabs />
        <HqBottomBar />
        {rightDrawer && (
          <RightDrawer>
            <DrawerContent onCreateTask={onCreateTask} onPause={onPause} onResume={onResume} />
          </RightDrawer>
        )}
      </div>
    </ToastProvider>
  );
}
