import type { Agent, Slot } from '../../sim/types.ts';
import { makeAgent } from '../../sim/agent.ts';

type PersonaDef = {
  id: string;
  kind: 'ai' | 'human';
  name: string;
  role: string;
  persona: { traits: string[]; communicationStyle: string; workHours: string };
  responsibilities: string[];
  defaultTasks: string[];
  preferredZones: string[];
  deskSlot: string;
  color: string;
};

export const PERSONA_DEFS: PersonaDef[] = [
  {
    id: 'agent-sec-01', kind: 'ai', name: 'Sentinel', role: 'Security Engineer',
    persona: { traits: ['teliti', 'waspada'], communicationStyle: 'ringkas', workHours: '09:00-18:00' },
    responsibilities: ['Triage kerentanan', 'Koordinasi patching'],
    defaultTasks: ['Review advisory harian'], preferredZones: ['open_space', 'war_room'], deskSlot: 'desk_01', color: '#ef4444',
  },
  {
    id: 'agent-be-01', kind: 'ai', name: 'Forge', role: 'Backend Engineer',
    persona: { traits: ['sistematis', 'tenang'], communicationStyle: 'teknis', workHours: '09:00-18:00' },
    responsibilities: ['Patching layanan', 'Deploy'],
    defaultTasks: ['Cek CI/CD'], preferredZones: ['open_space', 'war_room'], deskSlot: 'desk_02', color: '#3b82f6',
  },
  {
    id: 'agent-fe-01', kind: 'human', name: 'Lumen', role: 'Frontend Engineer',
    persona: { traits: ['kreatif', 'kolaboratif'], communicationStyle: 'santai', workHours: '09:00-18:00' },
    responsibilities: ['UI incident banner', 'Dashboard warning'],
    defaultTasks: ['Update komponen alert'], preferredZones: ['open_space', 'pantry'], deskSlot: 'desk_03', color: '#a855f7',
  },
  {
    id: 'agent-pm-01', kind: 'human', name: 'Atlas', role: 'Product Manager',
    persona: { traits: ['komunikatif', 'terstruktur'], communicationStyle: 'jelas', workHours: '09:00-18:00' },
    responsibilities: ['Koordinasi tim', 'Komunikasi stakeholder'],
    defaultTasks: ['Sinkron status sprint'], preferredZones: ['meeting_room', 'open_space'], deskSlot: 'desk_04', color: '#eab308',
  },
  {
    id: 'agent-devops-01', kind: 'ai', name: 'Pulse', role: 'DevOps Engineer',
    persona: { traits: ['sigap', 'otomatisasi'], communicationStyle: 'to-the-point', workHours: '09:00-18:00' },
    responsibilities: ['Monitoring', 'Infra patching'],
    defaultTasks: ['Cek metrik infra'], preferredZones: ['open_space', 'war_room'], deskSlot: 'desk_05', color: '#10b981',
  },
  {
    id: 'agent-qa-01', kind: 'human', name: 'Prism', role: 'QA Engineer',
    persona: { traits: ['detail', 'kritis'], communicationStyle: 'terstruktur', workHours: '09:00-18:00' },
    responsibilities: ['Uji patch', 'Regresi'],
    defaultTasks: ['Jalankan suite regresi'], preferredZones: ['open_space', 'meeting_room'], deskSlot: 'desk_06', color: '#f97316',
  },
  {
    id: 'agent-data-01', kind: 'ai', name: 'Cortex', role: 'Data Engineer',
    persona: { traits: ['analitis', 'tenang'], communicationStyle: 'data-driven', workHours: '09:00-18:00' },
    responsibilities: ['Analisis dampak', 'Log forensik'],
    defaultTasks: ['Audit log akses'], preferredZones: ['open_space', 'war_room'], deskSlot: 'desk_07', color: '#06b6d4',
  },
];

export function createDefaultAgents(slots: Slot[]): Agent[] {
  return PERSONA_DEFS.map((d) => {
    const slot = slots.find((s) => s.id === d.deskSlot);
    return makeAgent({
      id: d.id,
      kind: d.kind,
      name: d.name,
      role: d.role,
      persona: d.persona,
      responsibilities: d.responsibilities,
      defaultTasks: d.defaultTasks,
      preferredZones: d.preferredZones,
      deskSlot: d.deskSlot,
      presence: 'online',
      position: slot ? { ...slot.pos } : { x: 0, y: 0, z: 0 },
    });
  });
}

export function getPersonaColor(id: string): string {
  return PERSONA_DEFS.find((p) => p.id === id)?.color ?? '#888';
}
