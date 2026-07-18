# 004 - Soften pointer-triggered map tooltips

- **Status**: DONE
- **Commit**: 90c1c0e
- **Severity**: LOW
- **Category**: Missed opportunity / accessibility
- **Estimated scope**: 2 files, about 35 lines

## Problem

Map tooltips are conditionally mounted with no visual bridge. The same tooltip is also driven by keyboard arrows, which must remain immediate.

```tsx
// src/components/map/index.tsx:796 - current
{tooltipMarker && markerTooltipStyle ? (
  <div
    className={`annotated-world-map__tooltip annotated-world-map__tooltip--${tooltipMarker.scope}`}
    style={markerTooltipStyle}
    role="tooltip"
  >
    {tooltipMarker.name}
  </div>
) : null}
```

```css
/* src/components/map/index.css:86 - current */
.annotated-world-map__tooltip {
  transform: translate3d(-50%, calc(-100% - 0.72rem), 0);
}
```

## Target

Animate only pointer-originated tooltip entrances on hover-capable fine-pointer devices. Keyboard-originated tooltips must appear instantly.

```css
@media (hover: hover) and (pointer: fine) {
  .annotated-world-map__tooltip--pointer {
    animation: map-tooltip-enter var(--motion-duration-fast)
      var(--motion-ease-out-quart) both;
  }
}

@keyframes map-tooltip-enter {
  from {
    opacity: 0;
    transform: translate3d(-50%, calc(-100% - 0.72rem), 0) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translate3d(-50%, calc(-100% - 0.72rem), 0) scale(1);
  }
}
```

Duration is 160ms. Reduced motion keeps an opacity-only 120ms entrance for pointer tooltips. No animation runs for direction-key focus changes.

## Repo conventions to follow

- Reuse `--motion-duration-fast` and `--motion-ease-out-quart`.
- Preserve the current marker colors, absolute placement, and tooltip arrow.
- Follow the input-modality separation already expressed by `(hover: hover) and (pointer: fine)` in `src/pages/personal/index.css` and `src/pages/references/index.css`.

## Steps

1. In `src/components/map/index.tsx`, track whether the active tooltip came from pointer hover or keyboard focus. Update this alongside the existing hovered/focused marker state.
2. Add `annotated-world-map__tooltip--pointer` only for pointer-originated tooltips.
3. Add the fine-pointer-gated 160ms opacity/scale entrance in `src/components/map/index.css`, preserving the existing translation in both keyframes.
4. Add reduced-motion handling that removes scale and uses opacity only for 120ms.

## Boundaries

- Do NOT animate cursor-following position, `left`, `top`, routes, markers, zoom, or drag movement.
- Do NOT delay keyboard feedback.
- Do NOT change hit testing or pointer capture.
- Do NOT add tooltip exit delay; frequent marker traversal must remain responsive.

## Verification

- **Mechanical**: run `CI=true pnpm run build`; it must exit successfully.
- **Feel check**: hover several markers, then navigate markers with arrow keys.
  - Pointer tooltip entrance is subtle and completes in 160ms.
  - Moving rapidly between markers never lags behind the pointer.
  - Keyboard tooltips update instantly with no fade or scale.
  - At 10% playback, tooltip scale remains anchored at its computed marker position.
  - Reduced motion uses only a 120ms pointer fade.
- **Done when**: pointer appearance is less abrupt without compromising keyboard or map-tracking responsiveness.
