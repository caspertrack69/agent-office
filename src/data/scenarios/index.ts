import type { ScenarioDef } from '../../sim/types.ts';

export const rceScenario: ScenarioDef = {
  id: 'rce-incident',
  title: 'Isu RCE / CVE baru',
  trigger: { type: 'manual' },
  steps: [
    { at: 0, do: 'alert', severity: 'critical', message: 'CVE-2026-9999: RCE pada layanan produksi', source: 'cve-feed' },
    { at: 1, do: 'message', text: 'CRITICAL: CVE kritis terdeteksi - tim berkumpul!', severity: 'critical' },
    { at: 3, do: 'setZoneState', zone: 'war_room', state: 'active' },
    { at: 5, do: 'createTask', title: 'Triage dampak CVE', priority: 'critical', assignTo: 'role:security', zoneHint: 'war_room' },
    { at: 10, do: 'createTask', title: 'Siapkan dan uji patch', priority: 'high', assignTo: 'role:backend', zoneHint: 'war_room' },
    { at: 12, do: 'createTask', title: 'Update banner & komunikasi', priority: 'high', assignTo: 'role:frontend', zoneHint: 'open_space' },
    { at: 15, do: 'setGoal', target: 'role:security', goal: 'gotoZone:war_room' },
    { at: 16, do: 'setGoal', target: 'role:backend', goal: 'gotoZone:war_room' },
  ],
  resolveWhen: { allTasksDone: true },
};

export const fireDrillScenario: ScenarioDef = {
  id: 'fire-drill',
  title: 'Simulasi Evakuasi',
  trigger: { type: 'manual' },
  steps: [
    { at: 0, do: 'alert', severity: 'warning', message: 'Simulasi evakuasi — menuju lobby', source: 'ops' },
    { at: 2, do: 'setGoal', target: 'role:product', goal: 'gotoZone:lobby' },
    { at: 3, do: 'message', text: 'Menuju titik kumpul di lobby', severity: 'warning' },
  ],
  resolveWhen: { afterMs: 20000 },
};

export const defaultScenarios: ScenarioDef[] = [rceScenario, fireDrillScenario];
