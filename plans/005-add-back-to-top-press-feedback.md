# 005 - Add back-to-top press feedback

- **Status**: DONE
- **Commit**: 90c1c0e
- **Severity**: LOW
- **Category**: Feedback
- **Estimated scope**: 1 file, under 15 lines

## Problem

The back-to-top button enters and exits spatially but provides no visual confirmation when pressed.

```css
/* src/components/back-to-top/index.css:31 - current */
.back-to-top--visible {
    opacity: 1;
    pointer-events: auto;
    transform: translate3d(0, 0, 0) scale(1);
}
```

## Target

Add a subtle 160ms press scale without losing the visible-state translation.

```css
.back-to-top--visible:active {
  transform: translate3d(0, 0, 0) scale(0.97);
}
```

The existing transition already includes `transform var(--motion-duration-standard)`; override the active transition duration to `var(--motion-duration-fast)` so press feedback completes in 160ms. Reduced motion must keep the current no-transition behavior and no scale.

## Repo conventions to follow

- Reuse `--motion-duration-fast: 160ms` and `--motion-ease-out-quart`.
- Match `.reference-card__action:active` in `src/pages/references/index.css`.
- Preserve `.back-to-top--visible` as the source of pointer-event and visibility state.

## Steps

1. Add `.back-to-top--visible:active` after the visible-state rule in `src/components/back-to-top/index.css`.
2. Set `transition-duration: var(--motion-duration-fast)` for the active state and preserve the full translate-plus-scale transform string.
3. In the existing reduced-motion block, explicitly keep `transform: translate3d(0, 0, 0) scale(1)` for the visible active state.

## Boundaries

- Do NOT alter scroll behavior, visibility thresholds, fixed positioning, or focus styles.
- Do NOT scale below 0.97 or add bounce.
- Do NOT add JavaScript.

## Verification

- **Mechanical**: run `CI=true pnpm run build`; it must exit successfully.
- **Feel check**: scroll until the button appears and activate it with mouse, touch, and keyboard.
  - Pointer/touch press scales to 0.97 immediately and releases cleanly.
  - The button does not jump toward its hidden position.
  - Keyboard activation retains focus visibility and does not delay scrolling.
  - Reduced motion applies no press movement.
- **Done when**: pointer/touch activation has clear feedback without affecting entrance, scrolling, or focus behavior.
