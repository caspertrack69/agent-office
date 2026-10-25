import { useSimStore } from '../store/simStore.ts';

export function AlertBanner() {
  const alerts = useSimStore((s) => s.alerts);
  if (alerts.length === 0) return null;
  const top = alerts[0]!;
  const color =
    top.severity === 'critical' ? 'var(--danger)' : top.severity === 'warning' ? 'var(--accent-orange)' : 'var(--accent-blue)';
  const bg =
    top.severity === 'critical' ? 'var(--danger-soft)' : top.severity === 'warning' ? 'var(--accent-orange-soft)' : 'var(--accent-blue-soft)';

  return (
    <div className="alert-banner" style={{ background: bg, borderColor: color, color }}>
      <span className="alert-dot" style={{ background: color }} />
      <strong>{top.severity.toUpperCase()}</strong>
      <span>{top.message}</span>
      <span className="alert-source">— {top.source}</span>
      {alerts.length > 1 && <span className="alert-more">+{alerts.length - 1} more</span>}
    </div>
  );
}
