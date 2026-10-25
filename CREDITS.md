# Credits

## Libraries (via `package.json` — permissive licenses)

| Library | License | Notes |
| --- | --- | --- |
| React, React DOM | MIT | UI runtime |
| Three.js | MIT | 3D renderer |
| @react-three/fiber | MIT (pmndrs) | React renderer for Three.js |
| @react-three/drei | MIT (pmndrs) | Camera, controls, Billboard, Html helpers |
| Zustand | MIT (pmndrs) | Low-frequency UI and snapshot stores |
| recast-navigation / @recast-navigation/* | MIT (Isaac Mason) | Optional crowd navigation backend |
| comlink | Apache-2.0 | Worker RPC |
| idb | ISC | IndexedDB wrapper |
| zod | MIT | Save-file schema validation |
| lucide-react | ISC | Icon set for chrome, rails, tabs, and toolbars |
| leva | MIT | Debug controls (dev) |
| r3f-perf | MIT | Performance overlay (dev only) |

## Design inspiration

**Claw3D** — https://github.com/iamlukethedev/claw3d

The isometric HQ direction in this project was inspired by Claw3D: dark warm shell, cream floor, gold accents, agent name pills, standup summary card, left rail, and vertical panel tabs. All 3D geometry, voxel characters, lighting, and UI chrome here are procedurally generated in this repository with Three.js, React Three Fiber, and CSS. No source code, models, textures, or other binary assets were copied from that project.

## Asset packs (Kenney — CC0, credited for traceability)

- **Furniture Kit** — https://kenney.nl/assets/furniture-kit — CC0 — desk, chair, shelf, and sofa proportions.
- **Building Kit** — https://kenney.nl/assets/building-kit — CC0 — modular wall and floor proportions.
- **Mini Characters** — https://kenney.nl/assets/mini-characters — CC0 — blocky avatar proportions.
- Fallbacks considered: Blocky Characters (Kenney, CC0), KayKit Character Animations (CC0).

> CC0 dedicates these works to the public domain; attribution is not required. Sources are listed so the visual lineage stays traceable.

## Procedural / code-generated assets

- Office shell, walls, desks, chairs, meeting tables, sofas, reception counter, bookshelf, server racks, ping-pong table, plants, lamps, and storage crates — generated from Three.js primitives in `src/scene/Office.tsx`.
- Voxel agents — generated from box and cylinder primitives in `src/scene/AgentMesh.tsx`.
- War-room screen and floor labels — canvas textures drawn at runtime.
- Alert light, selection ring, speech bubbles, task cards, and all iconography — built in code; no external image assets.
- Office layout and slots — data-driven from `src/data/office.layout.ts`.

## Fonts and icons

- System font stacks only; no external font files are bundled.
- Icons from `lucide-react` (ISC).
