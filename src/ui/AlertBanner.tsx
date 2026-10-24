import { useSimStore } from '../store/simStore.ts';

export function AlertBanner() {
  const alerts = useSimStore((s) => s.alerts);
  if (alerts.length === 0) return null;
  const top = alerts[0]!;
  const color =
    top.severity === 'critical' ? '#991b1b' : top.severity === 'warning' ? '#92400e' : '#1e40af';
  const bg =
    top.severity === 'critical' ? '#fecaca' : top.severity === 'warning' ? '#fef3c7' : '#dbeafe';

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
