# Changelog

## [0.1.0] - 2026-10-24
### Added
- **Sim core** — `SimWorld` with fixed 20 Hz tick (accumulator, deterministic `SeededRng`/Mulberry32), `UtilityBrain` pluggable interface, `SimpleNavMesh` steering + separation (swappable to `recast-navigation` crowd), `EventBus` ring buffer, slot reservation.
- **Agents** — 7 personas (`ai`/`human`, traits, responsibilities, preferred zones, presence `online|busy|away|offline`), needs (`energy/social/focus`), FSM (`Idle|Walking|Working|Meeting|Chatting|Break|Responding`), `MAX_AGENTS=7` enforcement.
- **Tasks** — `createTask`, priority weights, progress while `Working`, `TaskBoard` (todo/in_progress/blocked/done), assign & status edit, world ↔ board sync.
- **Scenarios** — `ScenarioEngine` with declarative JSON (`alert/createTask/assignTask/setGoal/setZoneState/message` + `resolveWhen`), default `rce-incident` (CVE-2026-9999 war-room flow) + `fire-drill`, alert banner + war-room active state + screen texture.
- **Bridge** — Web Worker (`worker.ts`) via Comlink, speed as tick count (not dt), snapshot transfer; inline fallback (`workerClient.ts`) for tests/SSR. Snapshot interpolation via pose refs + `useFrame` lerp (no per-frame Zustand).
- **Persistence** — IndexedDB (`idb`) autosave (10s) + manual save/load, `schemaVersion` + `migrate`, export/import JSON with Zod validation.
- **Stores** — Zustand `useSimStore` (low-frequency snapshot meta) + `useUiStore` (selection/follow/top-down/filters).
- **3D Scene** — `Office` (zone floors, procedural desks/tables, walls, war-room screen), `Agents` (capsule+head, selection ring, state/name/speech Billboards), `Lighting` (directional+hemisphere+flashing alert point, shadow map 2048), `CameraRig` (OrbitControls, follow-agent, top-down toggle), `r3f-perf` in dev.
- **UI** — `TopBar` (clock, pause/resume, x1/x2/x4, reset, save/load/export/import, follow/top-down), `AlertBanner`, `AgentList` (search + state filter), `Inspector` (needs bars, goal, task, presence, persona edit), `TaskBoard`, `ScenarioPanel`, `EventLog` (severity filter).
- **Data** — `office.layout.ts` (6 zones, 17 slots, furniture descriptors), `personas` (7 defs, colors), `scenarios` (2 defs), Zod schemas (`schema.ts`), external adapter stub (`ExternalSource` → `ExternalEvent`).
- **Docs** — `CREDITS.md` (libraries + Kenney CC0 packs + procedural assets).

### Technical
- TypeScript strict (`erasableSyntaxOnly`, no `any` in `sim/`), `vite.config.ts` worker `format: 'es'`, `optimizeDeps.exclude: ['recast-navigation']`.
- Build: `tsc -b && vite build` passes; chunk warnings for large three bundle are expected.

