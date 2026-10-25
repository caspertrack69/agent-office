# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses semantic versioning.

## [0.2.0] - 2026-10-25

### Added
- **Isometric HQ shell** — dark warm theme with cream floor, gold accents, elevated perimeter walls, server-room partition, and a fixed isometric framing that keeps the diamond floor plan readable.
- **Procedural office interior** — desks with monitors and cups, office chairs, two round meeting tables, purple and lobby sofas, reception counter, bookshelf, server racks with status lights, storage crates, ping-pong table, floor lamps, plants, wall frames, and a live war-room screen driven by alert severity.
- **Voxel agents** — block-built characters tinted by persona color, offline dimming, walking bob, gold selection ring, HQ-style name pills, and speech bubbles.
- **HQ chrome** — header with title, standup summary, clickable agent pills and icon actions; collapsible left rail; vertical `OPEN HQ` / `MARKETPLACE` / `ANALYTICS` tabs; bottom status bar with a chat launcher.
- **Right drawer panels** — Open HQ quick actions, Marketplace task templates, Analytics summary, Chat, Standup Board, and Edit Office controls.
- **Scene settings** — live toggles for floor grid, perimeter walls, top-down camera, and an ambient-light slider.
- **Alert chime** — short WebAudio tone on new alerts, unlocked on first user gesture, silenced by the header mute toggle.
- **Toast notifications** — lightweight in-app feedback for save, load, export, import, share, mute, and task creation.
- **`lucide-react`** — vector icon set for all chrome, toolbar, and task-board controls.

### Changed
- Camera rig locked to an isometric angle with clamped polar and azimuth ranges; left-drag pans, scroll zooms, right-drag orbits, and follow mode keeps the selected agent framed.
- Lighting reworked for the warm HQ look: brighter ambient fill, configurable intensity, and preserved alert flashes.
- Header rebuilt as two rows (controls/title, then agent pills) so overlays no longer collide with the toolbar or rails.
- TopBar, TaskBoard, and scenario copy migrated from text glyphs and emoji to proper icons with accessible labels.
- Walking bob now runs in the frame loop from delta time instead of reading `performance.now()` during render.
- README, CREDITS, and this changelog rewritten; internal design-document references removed from source comments.

### Fixed
- Previously inert controls now perform real actions: fullscreen, focus layout, share link, mute, sidebar collapse, left-rail view switching, right-tab drawers, and chat launch.
- Chat input appends messages to a persistent in-app log instead of only showing a toast.
- Edit and Marketplace no longer report "coming soon"; they change live scene settings and create real tasks.
- Save, load, export, and import now report the actual outcome, including the missing-autosave case.
- Emoji removed from UI strings and the war-room canvas texture.

## [0.1.0] - 2026-10-24

### Added
- **Sim core** — `SimWorld` with a fixed 20 Hz tick (accumulator, deterministic `SeededRng`/Mulberry32), pluggable `UtilityBrain`, `SimpleNavMesh` steering plus separation (swappable to a `recast-navigation` crowd), `EventBus` ring buffer, and slot reservation.
- **Agents** — 7 personas (`ai`/`human`, traits, responsibilities, preferred zones, presence `online|busy|away|offline`), needs (`energy/social/focus`), FSM (`Idle|Walking|Working|Meeting|Chatting|Break|Responding`), `MAX_AGENTS=7` enforcement.
- **Tasks** — `createTask`, priority weights, progress while `Working`, `TaskBoard` (todo/in_progress/blocked/done), assign and status editing, world to board sync.
- **Scenarios** — `ScenarioEngine` with declarative JSON (`alert/createTask/assignTask/setGoal/setZoneState/message` plus `resolveWhen`), default `rce-incident` (CVE-2026-9999 war-room flow) and `fire-drill`, alert banner, war-room active state, and screen texture.
- **Bridge** — Web Worker (`worker.ts`) via Comlink, speed as tick count rather than dt, snapshot transfer, and an inline fallback (`workerClient.ts`) for tests/SSR. Snapshot interpolation via pose refs and `useFrame` lerp, with no per-frame Zustand writes.
- **Persistence** — IndexedDB (`idb`) autosave every 10 seconds, manual save/load, `schemaVersion` plus `migrate`, and JSON export/import validated with Zod.
- **Stores** — Zustand `useSimStore` for low-frequency snapshot metadata and `useUiStore` for selection, follow, camera, filters, and view state.
- **3D scene** — `Office` (zone floors, procedural furniture, walls, war-room screen), `Agents` (capsule and head, selection ring, name/speech Billboards), `Lighting` (directional, hemisphere, flashing alert point light, 2048 shadow map), `CameraRig` (OrbitControls, follow-agent, top-down toggle), and `r3f-perf` in development.
- **UI** — `TopBar` (clock, pause/resume, x1/x2/x4, reset, save/load/export/import, follow, top-down), `AlertBanner`, `AgentList` (search and state filter), `Inspector` (needs bars, goal, task, presence, persona editing), `TaskBoard`, `ScenarioPanel`, and `EventLog` with severity filtering.
- **Data** — `office.layout.ts` (6 zones, 17 slots, furniture descriptors), personas (7 definitions with colors), scenarios (2 definitions), Zod schemas, and an external adapter stub (`ExternalSource` to `ExternalEvent`).
- **Docs** — `CREDITS.md` covering libraries, CC0 asset packs, and procedural assets.

### Technical
- TypeScript strict mode (`erasableSyntaxOnly`, no `any` under `sim/`), Vite worker `format: 'es'`, and `optimizeDeps.exclude: ['recast-navigation']`.
- Build passes with `tsc -b && vite build`; large-chunk warnings for the Three.js bundle are expected.
