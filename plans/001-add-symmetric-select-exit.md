# 001 - Add a symmetric Select menu exit

- **Status**: DONE
- **Commit**: 90c1c0e
- **Severity**: MEDIUM
- **Category**: Interruptibility / physicality
- **Estimated scope**: 2 files, about 45 lines

## Problem

The shared Select menu enters with motion but is immediately unmounted when `isOpen` becomes false. Every route uses this control, so the missing exit is a repeated spatial discontinuity.

```tsx
// src/components/Select/index.tsx:584 - current
{isOpen && menuPlacement
    ? createPortal(
          <SelectOptionsMenu
              listboxId={listboxId}
              items={items}
              value={value}
              highlightedIndex={highlightedIndex}
              onHighlight={setHighlightedIndex}
              onSelect={commitSelection}
              menuRef={menuRef}
              placement={menuPlacement}
          />,
          document.body,
      )
    : null}
```

```css
/* src/components/Select/index.css:166 - current */
.pl-select-menu {
  animation: pl-select-menu-enter var(--motion-duration-standard)
    var(--motion-ease-out-quint) both;
}
```

## Target

Keep the portal mounted during a 160ms closing phase. Use CSS transitions so a rapid reopen retargets from the current visual state instead of restarting keyframes.

```css
.pl-select-menu {
  opacity: 1;
  transform: translate3d(0, 0, 0);
  transition:
    opacity var(--motion-duration-fast) var(--motion-ease-out-quart),
    transform var(--motion-duration-fast) var(--motion-ease-out-quart);
}

.pl-select-menu--closing[data-placement="bottom"] {
  opacity: 0;
  transform: translate3d(0, -4px, 0);
}

.pl-select-menu--closing[data-placement="top"] {
  opacity: 0;
  transform: translate3d(0, 4px, 0);
}
```

Opening may retain the current 240ms enter duration, but it must also use a transition or `@starting-style`, not a reversible keyframe. Under reduced motion, keep `opacity 120ms var(--motion-ease-out-quart)` and remove translation.

## Repo conventions to follow

- Reuse `--motion-duration-fast: 160ms`, `--motion-duration-standard: 240ms`, `--motion-ease-out-quart`, and `--motion-ease-out-quint` from `src/App.css:352`.
- Follow the existing delayed-unmount pattern in `src/pages/personal/sections/PersonalAircraftPhotosSection.tsx`, which keeps the preview mounted during its closing state.
- Keep keyboard behavior, focus restoration, Portal placement calculations, and native form value behavior unchanged.

## Steps

1. In `src/components/Select/index.tsx`, add an explicit closing state and a 160ms close timer. Clear the timer on unmount and before reopening.
2. Keep `SelectOptionsMenu` mounted while open or closing. Pass `isClosing` and the existing `menuPlacement.placement` to produce `pl-select-menu--closing` and `data-placement="top|bottom"`.
3. Ensure `closeMenu()` immediately updates ARIA/open interaction state while the visual menu becomes non-interactive during closing (`pointer-events: none`).
4. Replace `pl-select-menu-enter` keyframes in `src/components/Select/index.css` with interruptible opacity/transform transitions and direction-aware closed transforms.
5. Update the existing reduced-motion block so closing uses opacity only for 120ms and all positional movement is disabled.

## Boundaries

- Do NOT change option selection, keyboard navigation, click-outside handling, or menu positioning.
- Do NOT add a motion dependency.
- Do NOT animate layout properties.
- If the placement object no longer exposes a stable top/bottom value, STOP and report instead of guessing.

## Verification

- **Mechanical**: run `CI=true pnpm run build`; it must exit successfully.
- **Feel check**: open and close Select controls on `/`, `/photos`, and `/references`.
  - Closing travels 4px toward its trigger and completes in 160ms.
  - Rapid open-close-open retargets smoothly without flashing or duplicate menus.
  - Keyboard selection and Escape restore focus correctly without delayed input handling.
  - At 10% DevTools playback, top and bottom placements move in opposite directions toward the trigger.
  - With reduced motion, translation is absent and a 120ms opacity bridge remains.
- **Done when**: no Select menu disappears instantly, no invisible closing menu captures input, and all existing Select behavior remains intact.
