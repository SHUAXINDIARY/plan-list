---
target: AircraftModelViewport 3D attitude gizmo
total_score: 26
p0_count: 0
p1_count: 2
timestamp: 2026-08-27T05-47-02Z
slug: src-pages-planerender-aircraftmodelviewport-tsx
---

# Aircraft Attitude Gizmo Critique

Target: `src/pages/planeRender/AircraftModelViewport.tsx` (3D attitude gizmo, lines 1038-1220) and `src/pages/planeRender/index.css` (gizmo styles, lines 141-364 and responsive rules).

## Design Health Score

| #         | Heuristic                       |     Score | Key Issue                                                                                                                             |
| --------- | ------------------------------- | --------: | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1         | Visibility of System Status     |       3/4 | Live angle readouts and active presets work, but drag direction and completion feedback are implicit.                                 |
| 2         | Match System / Real World       |       3/4 | Pitch, roll, yaw terminology fits aviation, while the glyph has a weak nose direction and landing semantics are underspecified.       |
| 3         | User Control and Freedom        |       3/4 | Presets, reset, pointer capture, and keyboard input exist; there is no cancel/undo and pointer-loss cleanup is incomplete.            |
| 4         | Consistency and Standards       |       3/4 | Project tokens and control vocabulary are consistent, but one 2D surface maps to two axes while the roll surface maps to one.         |
| 5         | Error Prevention                |       3/4 | Angle clamping prevents invalid values, but there are no center marks or direct numeric entry to prevent over-rotation.               |
| 6         | Recognition Rather Than Recall  |       2/4 | Labels and readouts are visible, but users must infer axis mapping, sign direction, and the meaning of the ring.                      |
| 7         | Flexibility and Efficiency      |       3/4 | Presets, drag, arrows, and Shift acceleration are useful; precision requires repeated dragging and hidden shortcuts are undocumented. |
| 8         | Aesthetic and Minimalist Design |       3/4 | The gizmo is visually coherent and restrained, though grid, glyph, presets, readouts, and reset compete for attention.                |
| 9         | Error Recovery                  |       2/4 | Reset to level is clear, but lost pointer capture or window blur can leave the drag state unclear.                                    |
| 10        | Help and Documentation          |       1/4 | No inline axis legend, tooltip, or first-use affordance explains the gestures.                                                        |
| **Total** |                                 | **26/40** | **Acceptable, with a clear discoverability and accessibility gap.**                                                                   |

## Anti-Patterns Verdict

The implementation does not read as generic AI-generated UI. Aviation-specific presets, direct manipulation, existing project tokens, and the lack of gradients or glassmorphism establish a credible archive-tool register. The main risk is a familiar HUD treatment: dashed ellipse, cyan CSS aircraft, uppercase axis labels, and capsule ring. Without stronger directional feedback, that layer can feel decorative rather than operational.

The deterministic detector returned `[]` for the target file and for `src/pages/planeRender`, with zero rule findings, severities, or false positives. Browser visualization was not run because the user has explicitly reserved server and live acceptance for themselves.

## Overall Impression

The control has a good interaction idea and a sensible hierarchy: safe presets first, direct manipulation second, numeric feedback last. The biggest opportunity is to make the visible axes and the accessible axes identical, so a user can predict the result of a gesture before experimenting.

## What's Working

1. `setPointerCapture` plus `touch-action: none` makes the drag continuous on touch and when the pointer leaves the small control.
2. `aria-pressed`, live readouts, reset, and clamped ranges form a reversible interaction loop.
3. The gizmo is progressively disclosed with the attitude panel, and focus-visible/reduced-motion support follows the project system.

## Cognitive Load

The 8-item checklist has 2 failures, which is moderate. Grouping, hierarchy, option count, and progressive disclosure pass. The failures are that one surface controls two axes at once and users must remember vertical=pitch, horizontal=yaw, ring=roll, plus sign direction. Visible choices remain within a manageable threshold: four presets, two drag regions, and three readouts.

## Priority Issues

### [P1] One ARIA slider represents two different axes

`orbit` exposes pitch's `-60..60` range and `aria-valuenow`, while left/right changes yaw in `-180..180`. A screen reader user receives a value and range that do not describe the action. (`AircraftModelViewport.tsx:1114-1138`)

Fix: expose separate pitch and yaw slider semantics, or make the surface a group containing two real sliders with independent ranges, orientations, and values. Keep the shared 3D surface as the visual gesture target. Suggested command: `impeccable harden`.

### [P1] The CSS proxy can diverge from the real model rotation

The preview uses CSS `rotateX/rotateY/rotateZ`, while the model uses `model.rotation.set(...)`; order and aircraft nose orientation are not visibly guaranteed to match. At yaw 180 degrees the symmetric glyph gives little orientation evidence. (`AircraftModelViewport.tsx:237-247, 1141-1150`; `index.css:254-310`)

Fix: share one rotation convention, add an asymmetric nose/heading marker, and verify non-symmetric pitch/yaw/roll combinations. Suggested command: `impeccable polish`.

### [P2] Gesture mapping is not discoverable

`PITCH / YAW` names the axes but not their on-screen mapping. The roll capsule has no center mark, current position, or sign direction. A first-time user must blind-drag. (`index.css:312-355`)

Fix: add a compact axis legend, crosshair arrows, a 0-degree center line, and a roll indicator that follows the current angle. Suggested command: `impeccable clarify`.

### [P2] Drag lifecycle and large ranges are weak on touch

There is `pointercancel` handling but no `lostpointercapture`, `window.blur`, or visibility cleanup. The 0.8 degrees-per-pixel roll mapping also makes the wide `-180..180` range hard to traverse on a small ring. (`AircraftModelViewport.tsx:668-750`)

Fix: centralize drag-end cleanup, support repeatable relative drags, and add a visible step/scale or a small numeric stepper for precision. Suggested command: `impeccable adapt`.

### [P2] Preset meaning is too narrow

Manual adjustment switches every preset to `custom`, but there is no visible custom status or summary. “Landing” is only `+3°` pitch, which may imply gear or ground-state behavior that is not implemented. (`AircraftModelViewport.tsx:52-60, 147-155`)

Fix: show `自定义` with the active angle summary, and rename the preset to `着陆姿态` or explicitly scope it to attitude only. Suggested command: `impeccable clarify`.

## Persona Red Flags

**Alex, Power User:** Presets are fast, but Arrow/Shift shortcuts are hidden and exact angles require repeated dragging. There is no direct numeric entry or reusable pose save.

**Sam, Accessibility:** The combined orbit slider reports pitch while acting on yaw with horizontal arrows. Independent axis focus and live state are missing, so the control cannot be reliably operated or understood non-visually.

**Jordan, First-Timer:** `PITCH / YAW / ROLL` and “landing” assume aviation knowledge. The glyph does not clearly show its nose, and the first drag has no visible explanation of what will move.

## Minor Observations

- Add `aria-orientation` even after splitting slider semantics.
- `formatAttitudeAngle(0)` is visually neutral; a center marker would make the baseline easier to find.
- The CSS glyph stays generic when the selected model changes, weakening the connection to the actual aircraft.
- When both control panels are open, the attitude panel remains visually dense even though the parent layout avoids overlap.

## Questions to Consider

- Should the primary goal be a faithful attitude preview, or a broader flight-state simulator? That determines whether `landing` should remain a pitch-only preset.
- Can the actual model become the primary drag surface, with the CSS glyph reduced to an axis legend, so preview and output cannot diverge?
- Which matters first: independent accessible axes, gesture discoverability, or precision across the expanded ranges?
