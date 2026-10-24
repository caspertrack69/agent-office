import { useSimStore, useUiStore } from '../store/simStore.ts';
import { SIM_SPEEDS } from '../sim/config.ts';

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
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
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
        <span className="sim-clock" title={`tick ${tick}`}>⏱ {formatSimTime(simTime)}</span>
        <span className="tick-label">tick {tick}</span>
      </div>

      <div className="topbar-center">
        <button className={`btn ${paused ? 'btn-active' : ''}`} onClick={() => (paused ? onResume() : onPause())} title={paused ? 'Resume' : 'Pause'}>
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <div className="speed-group" role="group" aria-label="Speed">
          {SIM_SPEEDS.map((sp) => (
            <button
              key={sp}
              className={`btn btn-sm ${speed === sp ? 'btn-active' : ''}`}
              onClick={() => onSetSpeed(sp)}
              aria-pressed={speed === sp}
            >
              x{sp}
            </button>
          ))}
        </div>
        <button className="btn btn-ghost" onClick={onReset} title="Reset simulation">↺ Reset</button>
      </div>

      <div className="topbar-right">
        <label className="toggle">
          <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} /> follow
        </label>
        <label className="toggle">
          <input type="checkbox" checked={topDown} onChange={(e) => setTopDown(e.target.checked)} /> top-down
        </label>
        <button className="btn btn-sm" onClick={onSave}>Save</button>
        <button className="btn btn-sm" onClick={onLoad}>Load</button>
        <button className="btn btn-sm" onClick={onExport}>Export</button>
        <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
          Import
          <input
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.currentTarget.value = '';
            }}
          />
        </label>
      </div>
    </div>
  );
}
