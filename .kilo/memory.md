# Kilo Memory — agent-office

## Project
Virtual Office 3D — 7-agent simulation, R3F + Zustand + Worker + recast-navigation + IndexedDB.

## Decisions
- Sim loop: 20 Hz fixed tick, accumulator in Worker; speed = tick count, not dt (§6).
- Brain: Utility AI pluggable (Brain.decide), FSM execution; presence overrides (offline/busy/away).
- Nav: SimpleNavMesh steering+separation for v1; recast-navigation kept as optional (tryCreateRecastNav), interface compatible.
- Render: Snapshot interpolation via pose refs + useFrame lerp; Zustand only low-frequency meta; no per-frame React state.
- Persistence: idb, schemaVersion + migrate, export/import JSON + zod validation, autosave 10s.
- Assets: Kenney CC0 packs credited; v1 procedural (capsule agents, box desks, canvas screen) — glTF swappable via office.layout.json.
- Worker: Comlink + inline fallback (forceInline/tests), transferable Float32 packing helper in snapshotBuffer.

## Structure
src/sim/{config,rng,types,schema,agent,task,events,world,brain,nav,scenario,adapters}
src/bridge/{worker,workerClient,snapshotBuffer}
src/data/{office.layout,personas,scenarios}
src/scene/{Office,AgentMesh,Lighting,CameraRig}
src/store/simStore, src/persistence, src/ui/*

## Gotchas
- TS erasableSyntaxOnly: no param properties (private s/n → explicit fields), no constructor shorthand.
- noUnusedLocals: keep _prevTime or remove.
- Worker dynamic import ineffective when also static — expected, keep as is.
- Large three chunk warning expected; code-split later if needed.

## Next (future phases)
- Swap procedural agents to Mini Characters glTF + Draco/KTX2, bake recast navmesh from floor meshes.
- Gateway + WebSocket adapter (M10), LLM Brain, real CVE feed.
