import { useSimStore, useUiStore } from '../store/simStore.ts';
import { SIM_SPEEDS } from '../sim/config.ts';
import { Clock3, Play, Pause, RotateCcw, Save, FolderOpen, Download, Upload, Eye, EyeOff } from 'lucide-react';

type Props = {
  onPause: () => void;
  onResume: () => void;
  onSetSpeed: (v: number) => void;
  onReset: () => void;
  onSave: () => void;
  onLoad: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
};

function formatSimTime(t: number): string {
  const totalSec = Math.floor(t);
  const h = Math.floor(totalSec / 3600) % 24;
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function TopBar({ onPause, onResume, onSetSpeed, onReset, onSave, onLoad, onExport, onImport }: Props) {
  const simTime = useSimStore((s) => s.simTime);
  const paused = useSimStore((s) => s.paused);
  const speed = useSimStore((s) => s.speed);
  const tick = useSimStore((s) => s.tick);
  const follow = useUiStore((s) => s.followAgent);
  const topDown = useUiStore((s) => s.topDown);
  const setFollow = useUiStore((s) => s.setFollow);
  const setTopDown = useUiStore((s) => s.setTopDown);

  return (
    <div className="topbar">
      <div className="topbar-left">
        <strong className="brand">agent-office</strong>
        <span className="sim-clock" title={`tick ${tick}`}><Clock3 size={12} /> {formatSimTime(simTime)}</span>
        <span className="tick-label">tick {tick}</span>
      </div>

      <div className="topbar-center">
        <button type="button" className={`btn ${paused ? 'btn-active' : ''}`} onClick={() => (paused ? onResume() : onPause())} aria-pressed={paused}>
          {paused ? <><Play size={12} /> Resume</> : <><Pause size={12} /> Pause</>}
        </button>
        <div className="speed-group" role="group" aria-label="Speed">
          {SIM_SPEEDS.map((sp) => (
            <button key={sp} type="button" className={`btn btn-sm ${speed === sp ? 'btn-active' : ''}`} onClick={() => onSetSpeed(sp)} aria-pressed={speed === sp}>
              x{sp}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-ghost" onClick={onReset}><RotateCcw size={12} /> Reset</button>
      </div>

      <div className="topbar-right">
        <label className="toggle">
          <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} />
          {follow ? <Eye size={12} /> : <EyeOff size={12} />} follow
        </label>
        <label className="toggle">
          <input type="checkbox" checked={topDown} onChange={(e) => setTopDown(e.target.checked)} /> top-down
        </label>
        <button type="button" className="btn btn-sm" onClick={onSave}><Save size={12} /> Save</button>
        <button type="button" className="btn btn-sm" onClick={onLoad}><FolderOpen size={12} /> Load</button>
        <button type="button" className="btn btn-sm" onClick={onExport}><Download size={12} /> Export</button>
        <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
          <Upload size={12} /> Import
          <input type="file" accept=".json" style={{ display: 'none' }} onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImport(f);
            e.currentTarget.value = '';
          }} />
        </label>
      </div>
    </div>
  );
}
