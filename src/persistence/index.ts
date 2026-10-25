/**
 * Persistence — IndexedDB via `idb`, versioned JSON, export/import.
 */
import { openDB, type DBSchema } from 'idb';
import { SCHEMA_VERSION } from '../sim/config.ts';
import type { SimSnapshot } from '../sim/types.ts';
import { saveFileSchema } from '../sim/schema.ts';

type OfficeDB = DBSchema & {
  saves: { key: string; value: { id: string; snapshot: SimSnapshot; savedAt: number; schemaVersion: number } };
};

const DB_NAME = 'agent-office';
const DB_VERSION = 1;

function getDB() {
  return openDB<OfficeDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('saves')) db.createObjectStore('saves', { keyPath: 'id' });
    },
  });
}

export async function saveSnapshot(id: string, snap: SimSnapshot): Promise<void> {
  const db = await getDB();
  await db.put('saves', { id, snapshot: snap, savedAt: Date.now(), schemaVersion: SCHEMA_VERSION });
}

export async function loadSnapshot(id: string): Promise<SimSnapshot | null> {
  const db = await getDB();
  const row = await db.get('saves', id);
  if (!row) return null;
  if (row.schemaVersion !== SCHEMA_VERSION) {
    const migrated = migrate(row.snapshot as unknown, row.schemaVersion);
    if (!migrated) return null;
    return migrated as SimSnapshot;
  }
  return row.snapshot;
}

export async function listSaves(): Promise<{ id: string; savedAt: number }[]> {
  const db = await getDB();
  const all = await db.getAll('saves');
  return all.map((r) => ({ id: r.id, savedAt: r.savedAt }));
}

export async function deleteSave(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('saves', id);
}

export function exportToJson(snap: SimSnapshot): string {
  const file = { schemaVersion: SCHEMA_VERSION, savedAt: Date.now(), snapshot: snap };
  return JSON.stringify(file, null, 2);
}

export function importFromJson(json: string): SimSnapshot | null {
  let parsed: unknown;
  try { parsed = JSON.parse(json); } catch { return null; }
  const res = saveFileSchema.safeParse(parsed);
  if (!res.success) return null;
  const snap = (res.data.snapshot as SimSnapshot);
  if (res.data.schemaVersion !== SCHEMA_VERSION) {
    return migrate(snap as unknown, res.data.schemaVersion) as SimSnapshot | null;
  }
  return snap;
}

export function downloadJson(filename: string, json: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function migrate(snap: unknown, fromVersion: number): unknown | null {
  // v1 is initial — no migrations yet. Future versions add cases here.
  if (fromVersion === SCHEMA_VERSION) return snap;
  console.warn(`No migration from v${fromVersion} to v${SCHEMA_VERSION}`);
  return null;
}

export const AUTOSAVE_ID = 'autosave';
export const MANUAL_SAVE_PREFIX = 'save_';
