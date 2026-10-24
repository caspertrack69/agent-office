import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Scene } from './scene/index.tsx';
import { TopBar } from './ui/TopBar.tsx';
import { AlertBanner } from './ui/AlertBanner.tsx';
import { AgentList } from './ui/AgentList.tsx';
import { Inspector } from './ui/Inspector.tsx';
import { TaskBoard } from './ui/TaskBoard.tsx';
import { ScenarioPanel } from './ui/ScenarioPanel.tsx';
import { EventLog } from './ui/EventLog.tsx';
import { useSimStore } from './store/simStore.ts';
import { agentPoseMapRef } from './scene/AgentMesh.tsx';
import { createWorkerClient, type WorkerClient } from './bridge/workerClient.ts';
import { saveSnapshot, loadSnapshot, exportToJson, importFromJson, downloadJson, AUTOSAVE_ID } from './persistence/index.ts';
import { AUTOSAVE_INTERVAL_MS } from './sim/config.ts';

export default function App() {
  const setSnapshot = useSimStore((s) => s.setSnapshot);
  const clientRef = useRef<WorkerClient | null>(null);
  const autosaveTimer = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    let unsub: (() => void) | null = null;

    (async () => {
      const client = await createWorkerClient({ seed: 42 });
      if (!mounted) { client.dispose(); return; }
      clientRef.current = client;

      const auto = await loadSnapshot(AUTOSAVE_ID);
      if (auto) {
        await client.loadSnapshot(auto);
      }

      unsub = client.onSnapshot((snap) => {
        setSnapshot(snap);
        for (const a of snap.agents) {
          const pose = agentPoseMapRef().get(a.id);
          if (pose) {
            pose.pos.set(a.position.x, 0, a.position.z);
            pose.heading = a.heading;
            pose.state = a.state;
          } else {
            agentPoseMapRef().set(a.id, {
              pos: new THREE.Vector3(a.position.x, 0, a.position.z),
              heading: a.heading,
              state: a.state,
            });
          }
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
  }, []);
  const onLoad = useCallback(async () => {
    const snap = await loadSnapshot(AUTOSAVE_ID);
    if (snap && clientRef.current) await clientRef.current.loadSnapshot(snap);
  }, []);
  const onExport = useCallback(async () => {
    if (!clientRef.current) return;
    const snap = await clientRef.current.getSnapshot();
    downloadJson(`agent-office-${Date.now()}.json`, exportToJson(snap));
  }, []);
  const onImport = useCallback(async (file: File) => {
    const text = await file.text();
    const snap = importFromJson(text);
    if (snap && clientRef.current) await clientRef.current.loadSnapshot(snap);
    else alert('Invalid save file');
  }, []);
  const onUpdateStatus = useCallback(async (taskId: string, status: string) => {
    if (!clientRef.current) return;
    const snap = await clientRef.current.getSnapshot();
    const t = snap.tasks.find((x) => x.id === taskId);
    if (t) {
      (t as { status: string }).status = status;
      await clientRef.current.loadSnapshot(snap);
    }
  }, []);

  return (
    <div className="app">
      <TopBar
        onPause={onPause}
        onResume={onResume}
        onSetSpeed={onSetSpeed}
        onReset={onReset}
        onSave={onSave}
        onLoad={onLoad}
        onExport={onExport}
        onImport={onImport}
      />
      <AlertBanner />
      <div className="layout">
        <aside className="sidebar-left">
          <AgentList />
          <ScenarioPanel onTrigger={onTrigger} />
          <EventLog />
        </aside>
        <main className="canvas-wrap">
          <Scene />
        </main>
        <aside className="sidebar-right">
          <Inspector onUpdatePersona={onUpdatePersona} onSetPresence={onSetPresence} onAssignTask={onAssign} />
          <TaskBoard onCreate={onCreateTask} onAssign={onAssign} onUpdateStatus={onUpdateStatus} />
        </aside>
      </div>
    </div>
  );
}
