# agent-office

A real-time 3D virtual office where autonomous agents walk, work, meet, and react to incidents. The simulation runs in a Web Worker at a fixed 20 Hz tick; the renderer is React Three Fiber with an isometric "HQ" presentation.

![status](https://img.shields.io/badge/status-experimental-e8b84b) ![stack](https://img.shields.io/badge/React%2019-R3F%20%2B%20Three.js-3b82f6) ![sim](https://img.shields.io/badge/sim-20%20Hz%20worker-2ea043)

## Highlights

- **Isometric headquarters** — cream floor, warm dark shell, gold chrome, procedurally built furniture, and a fixed isometric camera that can pan, zoom, orbit within limits, and follow an agent.
- **Voxel agents** — persona-tinted characters with name pills, speech bubbles, presence dots, walking animation, and a gold selection ring.
- **Live simulation** — needs, finite-state behaviour, tasks, zones, slot reservation, scenarios, alerts, and an event log, all driven by a deterministic seeded world.
- **HQ control surface** — header with standup summary and agent pills, collapsible rail, vertical drawers (`Open HQ`, `Marketplace`, `Analytics`, `Chat`, `Standup Board`, `Edit Office`), and a status bar.
- **Persistence** — IndexedDB autosave, manual save/load, and JSON export/import with schema validation.
- **Accessible chrome** — every icon button has a label and tooltip, focus rings are visible, and controls reflect their state.

## Quick start

```bash
npm install
npm run dev
```

Open the printed URL. The simulation starts immediately and restores the last autosave when one exists.

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) then production build |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Oxlint |

## Controls

| Input | Action |
| --- | --- |
| Left-drag | Pan the camera |
| Scroll | Zoom |
| Right-drag | Orbit inside the isometric clamp |
| Click agent | Select and inspect |
| Follow toggle | Camera tracks the selected agent |
| Top-down toggle | Switch between isometric and overhead framing |

The `Edit Office` drawer adds live scene controls: floor grid, perimeter walls, ambient light, and top-down camera.

## Project structure

```
src/
  sim/           deterministic world, agents, tasks, nav, scenarios, schema
  bridge/        Comlink worker client, snapshot buffer, worker entry
  store/         Zustand sim + UI stores (low-frequency state only)
  data/          office layout, personas, scenarios
  scene/         Office geometry, voxel agents, lighting, camera rig
  ui/            HQ chrome, drawers, inspector, task board, logs, toasts
  persistence/   IndexedDB autosave and JSON import/export
```

Simulation state lives in the worker and reaches React through snapshots. Per-frame motion is interpolated from pose refs inside `useFrame`, so React never re-renders at frame rate.

## Configuration

Central constants live in `src/sim/config.ts`:

- `MAX_AGENTS = 7`
- `TICK_HZ = 20`, `TICK_DT = 0.05`
- speed multipliers `x1 / x2 / x4`
- autosave interval

Office geometry, zones, and slots are described in `src/data/office.layout.ts`. Personas and scenarios are plain data modules under `src/data/`.

## Design credit

The isometric HQ visual language — dark warm palette, cream floor, gold accents, agent name pills, standup card, side rails, and vertical panel tabs — is inspired by [Claw3D](https://github.com/iamlukethedev/claw3d). All geometry, characters, and chrome here are procedurally generated in this repository; no third-party code or binary assets were copied. See [CREDITS.md](./CREDITS.md).

## Known limitations

- `Edit Office` adjusts scene presentation, not furniture placement; there is no drag-and-drop layout editor yet.
- The mute toggle controls the alert chime only; no other audio is implemented.
- Fullscreen depends on browser permission and is unavailable in some embedded contexts.
- The Three.js bundle is intentionally a single large chunk; code splitting is not configured.

## Contributing

Run `npm run lint` and `npm run build` before opening a pull request. Keep per-frame work out of React state, and prefer data modules over hardcoded scene values.

## License

No license file is included. Treat the repository as private unless the owner adds a license.
